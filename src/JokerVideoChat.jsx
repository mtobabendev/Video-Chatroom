import { useEffect, useRef, useState } from "react";

function VideoChat({ fromUser, toUser, socket }) {
    // Storing the reference to our HTML video elements
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null); // Reference to our PeerConnection
    const [selfMute, setSelfMute] = useState(false);
    const [otherMute, setOtherMute] = useState(false);
    const [callActive, setCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [incomingCallData, setIncomingCallData] = useState(null);

    // ICE Candidates may arrive before our remote description has been set
    // So, we'll need to store the candidates in a queue until the description is set.
    const candidateQueue = useRef([]);

    useEffect(() => {
        if (!socket) return;

        // Using a public STUN server for our web connection
        const configuration = {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        }

        // Create the RTCPeerConnection using the config options we set up
        pcRef.current = new RTCPeerConnection(configuration);

        // When an Interactive Connectivity Establishment(ICE) candidate is generated, send it to the server
        pcRef.current.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit('video-ice-candidate', {
                    candidate: e.candidate,
                    from: fromUser,
                    to: toUser
                })
            }
        };

        // Once there's a video from the connection, display that in the remoteVideoRef
        pcRef.current.ontrack = (e) => {
            remoteVideoRef.current.srcObject = e.streams[0];
        };

        // Capture local video & audio
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideoRef.current.srcObject = stream;
                // Add both audio/video tracks and add them to the peer connection
                stream.getTracks().forEach((track) => {
                    pcRef.current.addTrack(track, stream);
                });
            })
            .catch(err => console.error("Error accessing media devices: ", err));

        // When receiving an offer (for callee)
        socket.on('video-offer', async (data) => {
            // Process this offer only for the intended user
            if (data.to !== fromUser) return;
            setIncomingCall(true);
            setIncomingCallData(data);        
        });

        // When receiving an answer (for the caller)
        socket.on('video-answer', async (data) => {
            // Process this offer only for the intended user
            if (data.to !== fromUser) return;
            try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                setCallActive(true);
            } catch (err) {
                console.error("Error handling video answer: ", err);
            }
        });

        // When adding an ICE candidate
        socket.on('video-ice-candidate', async (data) => {
            //Process this offer only for the intended user
            if (data.to !== fromUser) return;
            try {
                // Only add ICE Candidate if there's a remote description already
                if (pcRef.current.remoteDescriptions && pcRef.current.remoteDescription.type) {
                    // Add the user as an ICE candidate to the connection
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
                } else {
                    // If the seesion hasn't been set up yet, put te user in a queue
                    candidateQueue.current.push(data.candidate);
                }
            } catch(err) {
                console.error("Error adding ICE candidate: ", err);
            }
        });

        socket.on('end-call', (data) => {
            if (data.to === fromUser) {
                endCall();
            }
        });

        // When the component is destroyed
        return () => {
            socket.off('video-offer');
            socket.off('video-answer');
            socket.off('video-ice-candidate');
            socket.off('end-call');
        };

    }, [socket, fromUser, toUser]);

    async function startCall() {
        try {
            // Create a call offer and send it to the server
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socket.emit('video-offer', {
                offer,
                from: fromUser,
                to: toUser
            });
        } catch (err) {
            console.error("Error starting call: ", err);
        }
    }
    // Adding people to the call is ALWAYS an async function
    async function acceptCall() {
        if (!incomingCallData) return;
        try {
            // Set up a session between the users
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
            // Go through the queue and try to add each candidate to the call
            for (const candidate of candidateQueue.current) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding queued ICE Candidate: ", err);
                }
            }
            candidateQueue.current = [];
            
            // Creates an answer and sets up a connection with that configuration
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socket.emit('video-answer', {
                answer,
                from: fromUser,
                to: incomingCallData.from
            });
            setCallActive(true);
            setIncomingCall(false);
        } catch (err) {
            console.error("Error accepting the call: ", err);
        }
    }

    function rejectCall() {
        setIncomingCall(false);
        setIncomingCallData(null);
    }

    function endCall() {
        if (pcRef.current) {
            // pcRef.current.close();
        }
        
        setCallActive(false);
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());

        const otherUser = toUser || (incomingCallData && incomingCallData.from);

        socket.emit('end-call', { from: fromUser, to: otherUser });
        setIncomingCallData(null);
    }

    // Function to mute/unmute the local video/audio
    function toggleMuteLocal() {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject;
            const audioTracks = stream.getAudioTracks();

            if (audioTracks.length > 0) {
                // Toggle the enabled property of the audio track
                audioTracks[0].enabled = !audioTracks[0].enabled;
                setSelfMute(!audioTracks[0].enabled); // Update the state
            }
        }
    }

    function toggleMuteRemote() {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
            setOtherMute(remoteVideoRef.current.muted); // Update the state
        }
    }


    return (
        <div>
            <video id='myVideo' ref={localVideoRef} playsInline autoPlay muted style={{position: 'relative', top: '4px', height: '68px', width: '90px', border: '2px solid green', borderRadius: '10px'}} />
            <video id='otherVideo' ref={remoteVideoRef} playsInline autoPlay style={{height: '198px', width: '265px', border: '2px solid purple', borderRadius: '10px'}}/>
            <br></br>
            {incomingCall && (
                <div style={{position: 'relative',
                                top: '-160px'
                }}>
                    <p style={{color: 'whitesmoke'}}
                    >Incoming call from {incomingCallData && incomingCallData.from}</p>
                    <button onClick={acceptCall}
                            style={{marginRight: '5px', 
                                        height: '30px',
                                        width: '85px',
                                        padding: '0',
                                        backgroundImage: 'linear-gradient(90deg, green 0%, black 50%, green 100%)', 
                                        color: 'whitesmoke'}}
                    >Accept</button>
                    <button onClick={rejectCall}
                            style={{marginRight: '5px', 
                                    height: '30px',
                                    width: '85px',
                                    padding: '0',
                                    backgroundImage: 'linear-gradient(90deg, red 0%, black 50%, red 100%)', 
                                    color: 'whitesmoke'}}
                    >Reject</button>
                </div>
            )}
            {!callActive && !incomingCall && (
                <div>
                <br></br>
                <button onClick={startCall}
                        style={{marginRight: '5px', 
                                height: '30px',
                                width: '85px',
                                padding: '0',
                                backgroundImage: 'linear-gradient(90deg, green 0%, black 50%, green 100%)', 
                                color: 'whitesmoke'}}
                >Start Call</button>
                </div>
            )}
            {callActive && (
            
                <div style={{padding: '0px', height: '30px'}}>
                {callActive && (
                <button onClick={endCall}
                        style={{marginRight: '5px',
                                height: '30px',
                                width: '85px',
                                padding: '0',
                                backgroundImage: 'linear-gradient(90deg, red 0%, black 50%, red 100%)', 
                                color: 'whitesmoke'}}>End</button>
                )}

                <button onClick={toggleMuteLocal}
                        style={{marginRight: '5px', 
                                height: '30px',
                                width: '85px',
                                padding: '0',
                                backgroundImage: 'linear-gradient(90deg, green 0%, black 50%, green 100%)', 
                                color: 'whitesmoke',
                                fontSize: 'x-small'}}
                >{selfMute ? "Unmute Self" : "Mute Self"}</button>

                <button onClick={toggleMuteRemote}
                        style={{marginRight: '5px', 
                                height: '30px',
                                width: '85px',
                                padding: '0',
                                backgroundImage: 'linear-gradient(90deg, green 0%, black 50%, green 100%)', 
                                color: 'whitesmoke',
                                fontSize: 'x-small'}}
                >{otherMute ? "Unmute Other" : "Mute Other"}</button>
            </div>
            )}

        </div>
    )
}

export default VideoChat