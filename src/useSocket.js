import { useState, useEffect } from "react";
import io from "socket.io-client";

// Connect to our server
// To connect to someone else's chat use their IP address then :5000 (the port)
const socket = io('http://10.128.64.16:5000');

function useSocket() {
    const [chat, setChat] = useState([]);
    const [privateChat, setPrivateChat] = useState([]);
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        socket.on('message', (messageData, fromUser, profilePicture) => {
            setChat(prev => [...prev, { messageData, fromUser, profilePicture }]); // Copies the previous array and adds the new data
        });

        socket.on('private message', (data, fromUser, toUser, profilePicture) => {
            setPrivateChat(prev => [...prev, { data, fromUser, toUser, profilePicture }]);
        });

        socket.on('updateUsers', (userData) => {
            setUsersList(userData);
        });

        // Disable the listener and disconnects when they navigate away
        return () => {
            socket.off('message');
            socket.off('updateUsers');
            socket.off('private message');
        }
    }, []);

        function sendMessage(message, fromUser) {
            //Send a 'message' event with our message data to the server
            socket.emit('message', message, fromUser); // 'event name', data
        }

        function sendPrivateMessage(message, fromUser, toUser) {
            socket.emit('private message', message, fromUser, toUser);
        }

        function sendLogin(username) {
            socket.emit('login', username);
        }

        function updatePic(user, pic) {
            socket.emit('update pic', user, pic);
        }

        // Allows our App to chat, sendMessage, userList & sendLogin from this file
        return { chat, sendMessage, usersList, sendLogin, privateChat, sendPrivateMessage, socket, updatePic }
}

export default useSocket;