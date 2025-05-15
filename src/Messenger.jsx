import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import useSocket from './useSocket'
import './Messenger.css';
import VideoChat from './JokerVideoChat'

function Messenger() {

  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [password, setPassword] = useState('');
  const [avatarPicture, setAvatarPicture] = useState('');
  const [message, setMessage] = useState('');
  const [privateMessage, setPrivateMessage] = useState('');
  const [picture, setPicture] = useState('');
  const [validPassword, setValidPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validUsername, setValidUsername] = useState(null);
  const [fromUser, setFromUser] = useState(randomUsername());
  const [toUser, setToUser] = useState('');
  const [startVideo, setStartVideo] = useState(false);
  const [profilePicture, setProfilePicture] = useState('ProfilePlaceholder.png');

  const chatContainerRef = useRef();
  const privateChatContainerRef = useRef();

  //Database Connections

  function register() {
    // Makes a request to our server's port, specifically to the 'login' endpoint
    fetch('http://localhost:5000/register', {
        method: 'POST', // Specifying that we're making a POST request (sending data)
        // Headers is for metadata (extra information) about the request to help the browser/server understand how to handle it
        headers: {
            'Content-Type': 'application/json',
        },
        // The body is the main content that we want to send
        body: JSON.stringify({ username: username, password: password, profile_picture: picture })
    })
    // Once the request completes, these .then statements will run
    .then(response => response.json()) // Takes our response from the server and parses it as a JSON
    .then(data => alert(data.success)) // Once it's parsed as a JSON, we just log it to the console
    .catch(error => console.error(error)); // If there was an error, log that to the console
}

function checkUsername() {
  fetch('http://localhost:5000/check-username', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username })
  })
  .then(response => response.json())
  .then(data => setValidUsername(data))
  .catch(error => console.error(error));
}

function login() {
  fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username, password: password })
  })
  .then(response => response.json())
  .then(data => {
      if (data !== 'Invalid username or password') {
        setCurrentUser(username);
        setAvatarPicture(data.picture);
        sendLogin(username);
      }
        alert(data);
    })
  .catch(err => alert(err));
}
  
  //Sets/imports basic messenger variables
    
  const { chat, sendMessage, usersList, sendLogin, privateChat, sendPrivateMessage, socket, updatePic } = useSocket();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  useEffect(() => {
    if (privateChatContainerRef.current) {
      privateChatContainerRef.current.scrollTop = privateChatContainerRef.current.scrollHeight;
    }
  }, [privateChat]);

  const [rateLimited, setRateLimited] = useState(false);
  const [msgTimestamps, setMsgTimestamps] = useState([]);

  const maxMessages = 5;
  const timeWindow = 5000; //ms

  function handleEnter(isPrivate) {
    const now = Date.now();

    // Filter out messages older than timeWindow
    const recentTimestamps = msgTimestamps.filter(item => now - item < timeWindow);

    if (recentTimestamps.length >= maxMessages) {
      setRateLimited(true);
      alert("You're sending too many messages. Stop it!");

      setTimeout(() => {
        setRateLimited(false);
        setMsgTimestamps([]);
      }, timeWindow);
    } else {
    setMsgTimestamps([...recentTimestamps, now]);
    // If private, sendPrivateMessage
    // Else
    if (isPrivate) {
    sendPrivateMessage( privateMessage, currentUser, toUser );
    setPrivateMessage('');
    } else {
    sendMessage(message, currentUser ? currentUser : fromUser);
    setMessage('');
  }
  }
};

function handlePicture(e) {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('username', currentUser);

    fetch('http:///localhost:5000/upload-pic', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      setProfilePicture(`http://localhost:5000/uploads/${data.profilePic}`);
      updatePic(currentUser, `http://localhost:5000/uploads/${data.profilePic}` );
    })
    .catch(err => console.error(err));
  }
}

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

    //Open Messenger Window

    const [window, setWindow] = useState('none');
    const [chatOpen, setChatOpen] = useState(false);
    
    const [closedHovered, setclosedHovered] = useState(false);
    const [publicHovered, setpublicHovered] = useState(false);
    const [privateHovered, setprivateHovered] = useState(false);
    
    const styleCloseBTN = {
      cursor:closedHovered ? 'pointer' : 'auto',
      backgroundColor: closedHovered ? 'green' : 'red'
    }

    const publicSendBTN = {
      cursor:publicHovered ? 'pointer' : 'auto',
      backgroundColor: publicHovered ? 'green' : 'purple',
      color: publicHovered ? 'purple' : 'whitesmoke'
    }

    const privateSendBTN = {
      cursor:privateHovered ? 'pointer' : 'auto',
      backgroundColor: privateHovered ? 'green' : 'purple',
      color: privateHovered ? 'purple' : 'whitesmoke'
    }

    function openForm() {
        setWindow("block");
        setChatOpen(true);
      }
      
      function closeForm() {
        setWindow("none");
        setChatOpen(false);
      }

        const [msgType, setMsgType] = useState('');
        
        useEffect(() => {

          let timeout;
          let i = 0;
          let text = 'Type Public Message Here'; /* The text in the chat window*/
          let speed = 300; /* The speed/duration of the effect in milliseconds */

          function MsgTypeLoop() {
            
            if (i < text.length) {
                setMsgType(prev => prev + text.charAt(i));
                i++;
                timeout=setTimeout(MsgTypeLoop, speed);
            }
        }

        MsgTypeLoop();

        let counter = setInterval(() => {
          i = -1;
          setMsgType('')
          MsgTypeLoop();  
        }, 10000);

        return ()=> {clearTimeout(timeout); clearTimeout(counter)}
        
    }, []);  

      //Slide Out
      
      const [isOpen, setIsOpen] = useState(false);
      function openNav() {
        setIsOpen(true);
      }
      
      function closeNav() {
        setIsOpen(false);
      }

      const slideOutStyle = {
        position: 'absolute',
        height: '400px',
        width: isOpen ? '180px' : '0px',
        zIndex: '2',
        top: '0',
        left: '0',
        backgroundImage: 'linear-gradient(90deg, black 0%, purple 50%, black 100%)',
        borderRadius: '20px',
        overflowX: 'hidden',
        overflowY: 'hidden',
        paddingTop: '20px',
        transition: '0.5s',
        transform: isOpen ? 'translateX(-100%)' : 'translateX(0)',
      }

      const [hovered, setHovered] = useState(false);

      const styleOpenBTN = {
        cursor: hovered ? 'pointer' : 'auto',
        backgroundColor: hovered ? 'green' : 'purple'
      }

      //Slide Out Login

      // const { currentUser, setUser, clearUser, setPasswordContext, clearPasswordContext } = useUser();

      //Sets user variables - registration/login credentials 

      function randomUsername() {
        const newUser = 'Guest';
        const generate = Math.floor(Math.random() * 999999) + 1;
      
        return newUser + generate;
      }

      useEffect(() => {
      
      const validUpperCase = password?.match(/[A-Z]/g);
      const validLowerCase = password?.match(/[a-z]/g);
      const validNumber = password?.match(/[0-9]/g);
      const validSpecial = password?.match(/[\p{P}\p{S}]/u);
      const validLength = password?.length >= 7;

      setValidPassword(password && validUpperCase && validLowerCase && validNumber && validSpecial && validLength);
      }, [password]);

  return (
    <div id='messenger-box'>
        
        <div id='msg-main-container' style={{display: 'grid', gridTemplateColumns: '45px 50px 125px 25px', gridTemplateRows: '35px'}}>
                                
            <div id='bannerad-joker'>
              <img id='joker-left' alt='Clown Prince of Crime' title='Let&rsquo;s put a Smile on that Face!' src='Joker2.png' style={{height: '30px'}}></img>
            </div>

            <div id='wildcard-logo'>
            <NavLink to='/aboutus' className={()=> 'arkham-navlink'}>
              <img  id='messenger-wildcard' 
                    alt='WildCard DEV' 
                    title='Another WildCard Creation!' 
                    src='WildCard.png'
                    style={{height: '25px', 
                            borderRadius: '5px', 
                            backgroundColor: 'green'}}></img>
            </NavLink>

            </div>

            <div id='bannerad-chat-title' style={{ alignSelf: 'center'}}>
              <p><strong><sup>W</sup>h<sub>Y</sub> <sup>S</sup>o<sub> </sub>S<sup>e</sup>R<sub>i</sub>O<sup>u</sup>S<sub>?</sub></strong></p>
            </div>

            <div id='bannerad-harley'>
              <img id='harley-left' alt='Clown Princess of Crime' title='Sorry. The voices...' src='Harley2.png' style={{height: '30px'}}></img>
            </div>
        
        </div>

        {chatOpen ? (
        <div>
          <div>
            <button className="placeholder-open-button"
                    style={{width: '260px',
                            height: '55px'}}
            >Chat</button>

          </div>

        <div className="chat-popup" 
              id="myForm" 
              style={{display: window,
                      position: 'absolute',
                      transform: 'translate(-6.5%, -13.5%)',
                      zIndex: '3'}}>

            <div className="form-container"
                  style={{maxWidth: '290px',
                          padding: '10px',
                          borderRadius: '20px',
                          backgroundImage: 'linear-gradient(-135deg, green 0%, black 50%, red 100%)'}}
            >

                <button type="button" 
                        className="cancel-btn cancel" 
                        onMouseEnter={() => setclosedHovered(true)} onMouseLeave={() => setclosedHovered(false)}
                        onClick={closeForm}
                        style={{...styleCloseBTN,
                                width: '260px',
                                height: '55px',
                                color: 'whitesmoke',
                                padding: '16px 20px',
                                border: 'none',
                                marginLeft: '12px',
                              }}
                >Close</button>
                
                <div id='mySidebar' 
                      className={`sidebar ${isOpen ? 'openSidebar' : 'closedSidebar'}`}
                      style={slideOutStyle}>
                        
                        <button className='closebtn'
                                id='closebtn'
                                onClick={() => closeNav()}
                                style={{position: 'absolute',
                                        top: '10px',
                                        left: '140px',
                                        padding: '0',
                                        margin: '0',
                                        width: '25px',
                                        fontSize: '15px',
                                        backgroundColor: 'rgb(39, 223, 39)',
                                        color: 'purple'}}
                        ><strong>X</strong></button>
                            
                            <div className='msgDropdown'></div>
                            
                            {currentUser ? (
                                <div>
                                    <br></br>
                                    <h5 className='loginText' style={{lineHeight: '0.1rem',
                                                                       margin: '0', 
                                                                       height: '10px', 
                                                                       color: 'whitesmoke'}}>You are logged in as</h5> 
                                    
                                    <br></br>

                                    <h3 className='loginText' style={{lineHeight: '0.1rem', 
                                                                      margin: '0', 
                                                                      height: '10px', 
                                                                      color: 'whitesmoke'}}>{currentUser}</h3>
                                    <br></br>

                                    <input id='profilePic' type='file' accept='image/*' onChange={handlePicture} style={{ display: 'none'}} />
                                    {/* 'htmlFor={inputID' creates a hyperlink that activates the hidden input field */}
                                    <label htmlFor='profilePic'>
                                      <img src={profilePicture} title='Click Here To Set Profile Picture.' style={{ height: '100px', width: '100px', borderRadius: '50%', cursor: 'pointer' }} />
                                    </label>

                                </div>
                                )
                                :
                                (
                                <div>   
                                    
                                    <h4 className='loginText'
                                        style={{color: 'whitesmoke'}}>You are not logged in</h4>
                                    
                                    <img id='login-pic' alt='Login Avatar' title='Please log in to change Profile Pic.' 
                                          style={{height: '100px', borderRadius : '20px'}}src='ProfilePlaceholder.png'></img>
                                    
                                </div>
                                )
                              }

                            <p style={validUsername === "Username Available." ? {color: 'green', margin: '0px', height: '25px'} : {color: 'whitesmoke', margin: '0px', height: '25px'}}>{validUsername}</p>
                            
                            <input
                                style={{backgroundColor: 'green', 
                                        color: 'whitesmoke',
                                        borderRadius: '10px'}}
                                type='text'
                                className='userName'
                                placeholder='Username'
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                name='username'
                                title='Enter/Check Username'
                                onBlur={checkUsername}
                                autoComplete='one-time-code'
                            />
                            
                            <input
                                style={{backgroundColor: 'green',
                                        color: 'whitesmoke', 
                                        borderRadius: '10px'}}
                                type={`${showPassword ? 'text' : 'password'}`}
                                className='password'
                                placeholder='Password'
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyUp ={(e) => e.key === "Enter" && login()}
                                value={password}
                                name='password'
                                autoComplete='one-time-code'
                                title='Password MUST be at least 8 characters & contain 1 uppercase, 1 lowercase, 1 special character & 1 number.'
                            />
                              
                              <br></br>
                              <br></br>
                              
                              <button 
                                style={{height: '35px',
                                        width: '180px',
                                        padding: '0px', 
                                        backgroundImage: 'linear-gradient(90deg, green 0%, purple 50%, green 100%)', 
                                        color: 'whitesmoke'}}
                                onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? 'Hide Password' : 'Show Password'}
                              </button>
                              
                              <br></br>
                              <br></br>
                              
                              {!currentUser ? (
                              <button id='msg-loginbtn' 
                              style={{marginRight: '5px', 
                                        height: '30px',
                                        width: '85px',
                                        padding: '0',
                                        backgroundImage: 'linear-gradient(90deg, green 0%, black 50%, green 100%)', 
                                        color: 'whitesmoke'}} 
                                disabled={validPassword ? false : true}  
                                onClick={() => { login(); setPassword('') }}>
                                  Login
                              </button>
                              )
                              :
                              (
                                <button id='msg-logoutbtn'
                                style={{marginRight: '5px', 
                                        height: '30px',
                                        width: '85px',
                                        padding: '0',
                                        backgroundImage: 'linear-gradient(90deg, green 0%, black 50%, green 100%)', 
                                        color: 'whitesmoke'}} 
                                onClick={() => setCurrentUser('')}>Logout</button>
                              )
                              }
                              
                              <button id='msg-registerbtn' 
                                style={{marginLeft: '0px', 
                                        height: '30px',
                                        width: '85px',
                                        padding: '0',
                                        backgroundImage: 'linear-gradient(90deg, red 0%, black 50%, red 100%)', 
                                        color: 'whitesmoke'}}
                                onClick={register}>
                                  Register
                              </button>
                  </div>

                  <button className="msg-openbtn" 
                          onClick={() => openNav()}
                          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                          // ... = spread operator- takes everything in the const(object) & splits it out into the sub elements
                          style={{...styleOpenBTN,
                                  position: 'relative',
                                  top: '45px',
                                  left: '-270px',
                                  fontSize: '20px',
                                  cursor: 'pointer',
                                  color: 'white',
                                  padding: '0px',
                                  border: 'none'}}
                  >☰</button>
                  
            <h2 id='userList' 
                style={{color: 'green',
                        margin: '0px',}}
            >User List</h2>
                  
            <div id='users' style={{overflowY: 'auto', border: '2px solid green', borderRadius: '10px', height: '80px'}}>
                {usersList.map((item, index) => (
                  <div key={index} style={{borderBottom: '2px dash green', color: item.status === 'online' ? 'green' : 'red'}}>
                    <span style={{color: 'whitesmoke'}}>{item.username}<span style={{color: 'yellow'}}>:</span></span> <u>{item.status}</u>
            </div>
                ))}
            </div>

            <h2 id='msg-title'
                style={{margin: '0px',
                        color: 'green'}}
            >Messages</h2>

            <div ref={chatContainerRef} 
                  id='msg-history'
                  style={{color: 'whitesmoke',
                          height: '150px',
                          overflowY: 'auto',
                          border: '2px double purple',
                          borderRadius: '10px'}}
            >
              {chat.map((item, index) => (
                <div key={index}>
                  <img src={item.profilePicture ? item.profilePicture : 'SevenOfNine2.webp'} 
                      style={{height: '50px', borderRadius: '10px'}}
                />
              <span style={{color: 'green'}}>{item.fromUser}</span>: <span style={{color: 'whitesmoke'}}>{item.messageData}</span>
            </div>
            ))}
        </div>
              
        <input
              type='text'
              placeholder={msgType}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyUp ={(e) => e.key === "Enter" && handleEnter()}
              disabled={rateLimited}
              style={{borderRadius: '10px',
                      color: 'black',
                      width: '285px',
                      height: '20px'}}
        />

        <button type="submit" 
                className="send-btn"
                onMouseEnter={() => setpublicHovered(true)} onMouseLeave={() => setpublicHovered(false)}
                onClick={() => {sendMessage(message); setMessage('')}}
                style={{...publicSendBTN,
                        padding: '16px 20px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '285px',
                        opacity: '0.8'}}
        >Send</button>
            
        {currentUser && 
        
        <div style={{height: '350px'}} id='private-box'>

        <h2 id='private-msg-label'
            style={{color: 'purple',
                    margin: '0'}}
        >Private Messages</h2>

        <div ref={privateChatContainerRef}
              id='msg-window'
              style={{color: 'whitesmoke',
                      height: '150px',
                      border: '2px solid green',
                      borderRadius: '10px',
                      overflowY: 'auto',}}
        >

        {privateChat.map((item, index) => (
          <div key={index}
                style={{color: 'whitesmoke'}}
          >
            <img src={item.profilePicture ? item.profilePicture : 'Seven.webp'} 
            style={{height: '50px', borderRadius: '10px'}} 
            />
            <span style={{color: 'red'}}>{item.fromUser}</span> to <span style={{color: 'green'}}>{item.toUser}</span>: <span style={{color: 'whitesmoke'}}>{item.data}</span>
          </div>
        ))}
      </div>

          <select value={toUser} 
                  onChange={(e) => setToUser(e.target.value)}
                  style={{width: '95px', 
                          borderRadius: '10px', 
                          backgroundColor: 'green',
                          color: 'whitesmoke'}}
          >
            <option>Select User</option>
            {usersList.filter(item => item.status === 'online' && item.username !== currentUser).map((item, index) => (
              <option key={index} value={item.username}>{item.username}</option>
            ))}
          </select>

          <input
          type='text'
          placeholder='Enter Message'
          value={privateMessage}
          onChange={(e) => setPrivateMessage(e.target.value)}
          onKeyUp ={(e) => e.key === "Enter" && handleEnter(true)}
          disabled={rateLimited}
          onMouseEnter={() => setprivateHovered(true)} onMouseLeave={() => setprivateHovered(false)}
          style={{borderRadius: '10px',
                  color: 'black',
                  width: '185px',
                  height: '20px'}}
          />

        <button disabled={rateLimited} 
                onClick={() => handleEnter(true)}
                onMouseEnter={() => setprivateHovered(true)} onMouseLeave={() => setprivateHovered(false)}
                style={{...privateSendBTN,
                        padding: '16px 20px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '285px',
                        opacity: '0.8'}}
        >Send</button>

        <br></br>
        
        <select value={toUser} 
                onChange={(e) => setToUser(e.target.value)} 
                style={{backgroundColor: 'green', 
                        color: 'whitesmoke', 
                        borderRadius: '10px',
                        width: '135px'}}>

            <option>Select Video User</option>
                {usersList.filter(item => item.status === 'online' && item.username !== currentUser).map((item, index) => (
            <option key={index} value={item.username}>{item.username}</option>
            ))}

        </select>

            <button id='video-btn' onClick={() => setStartVideo(true)} >Video Chat</button>
              {startVideo && (
                <div style={{position: 'relative', 
                              left: '300px', 
                              top: '-366px', 
                              height: '369px', 
                              backgroundImage: 'linear-gradient(90deg, purple 0%, black 50%, purple 100%)', 
                              borderRadius: '20px'}}>
                  <VideoChat fromUser={currentUser} toUser={toUser} socket={socket} />
                </div>
            )}
      </div>
      }
        </div>
        </div>
        </div>
        )
        :
        (
        <div>
          <button id='openchat-button'
                  onClick={openForm}
                  style={{width: '260px',
                          height: '55px',
                          padding: '16px 20px',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: '0.8',
                          bottom: '23px',
                          right: '28px',
                          color: 'whitesmoke',
                          background: 'url(letoJoker.webp) left -20px top -100px',
                          backgroundSize: '300px',
                          display: 'flex',}}
            >Chat</button>
        </div>
        )}
    </div>
  )
}

export default Messenger;