import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import useSocket from './useSocket'
import Messenger from './Messenger'
import VideoChat from './JokerVideoChat'

function App() {

  //Database Connections

function register() {
  // Makes a request to our server's port, specifically to the 'register' endpoint
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

//User Variables
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [avatarPicture, setAvatarPicture] = useState('');
const [message, setMessage] = useState('');
const [rateLimited, setRateLimited] = useState(false);
const [msgTimestamps, setMsgTimestamps] = useState([]);
const [currentUser, setCurrentUser] = useState('');
const [toUser, setToUser] = useState('');
const [fromUser, setFromUser] = useState(randomUsername());
const [startVideo, setStartVideo] = useState(false);
const [profilePicture, setProfilePicture] = useState('ProfilePlaceholder.png');

function randomUsername() {
  const newUser = 'Guest';
  const generate = Math.floor(Math.random() * 999999) + 1;

  return newUser + generate;
}

useEffect(() => {
  console.log();
  // console.log(password);
}, ['currentUser']);

const { chat, sendMessage, usersList, sendLogin, privateChat, sendPrivateMessage, socket, updatePic } = useSocket();

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
    sendPrivateMessage( message, currentUser, toUser )
    } else {
    sendMessage(message, currentUser ? currentUser : fromUser);
  }
  setMessage('');
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

  return (
    <div>
      {/* 
      Private message button
      dropdown menu with online users to choose from 
      seperate chat box for private messages
      */}
      <Messenger />

      {currentUser ? (
                    <div>
                        
                        <h5 >You are logged in as <br></br>{currentUser}</h5>
                        <input type='file' accept='image/*' onChange={handlePicture} />
                        <br></br>
                        <img src={profilePicture} style={{height: '100px', borderRadius: '50%' }}></img>
                        {/* <img id='user-pic' alt='User Avatar' style={{borderRadius: '10px', height: '50px'}}title='You are logged in.' src={`data:image/webp;base64,${avatarPicture}`}></img> */}
                        
                        <button style={{backgroundColor: 'red', color: 'black'}}onClick={() => setCurrentUser('')}>Logout</button>
                    </div>
                    )
                    :
                    (
                    <div>   
                        
                        <h4 style={{ padding: '8px 0px'}}>You are not logged in</h4>
                        
                        <img id='login-pic' alt='Login Avatar' title='Please log in.' style={{height: '60px'}}src='ProfilePlaceholder.png'></img>
                        
                        <button style={{backgroundColor: 'purple', color: 'green'}} onClick={login}>Login</button>
                    </div>
                    )
                  }
      <br></br>
      <input
        type='text'
        placeholder='Username'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        />
        <br></br>
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyUp ={(e) => e.key === "Enter" && login()}
        />
        <br></br>
        <input type='file' id='image_file' accept='image/jpeg image/gif' onChange={handleFileChange}></input>
        <br></br>
        <button onClick={register}>Register</button>
        <br></br>

      <div>
        <h2 id='userList'>User List</h2>
        {usersList.map((item, index) => (
          <div key={index} style={item.status === 'online' ? {color: 'green'} : {color: 'red'}}>
            {item.username}: {item.status}
          </div>
        ))}
      </div>
        

        <h2>Messages</h2>
        <input
          type='text'
          placeholder='Enter Message'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp ={(e) => e.key === "Enter" && handleEnter(false)}
          disabled={rateLimited}
        />
        {/* onClick can also be onClick={() => handleEnter()} to trigger the spam filter as that functionality exists in the handleEnter function*/}
      <button disabled={rateLimited} style={{backgroundColor: 'black', color: 'whitesmoke'}}onClick={() => {handleEnter(false)}}>Send</button>

      <div id='msg-window'>
        {chat.map((item, index) => (
          <div key={index}>
            <img src={item.profilePicture ? item.profilePicture : 'Seven.webp'} 
            style={{height: '50px', borderRadius: '50%'}} 
            />
            {item.fromUser}: {item.Data}
          </div>
        ))}
      </div>
      
      {currentUser &&

      <div id='private-box'>

      <h2>Private Messages</h2>
      <div id='msg-window'>
        {privateChat.map((item, index) => (
          <div key={index}>
            <img src={item.profilePicture ? item.profilePicture : 'Seven.webp'} 
            style={{height: '50px', borderRadius: '50%'}} 
            />
            {item.fromUser} to {item.toUser}: {item.data}
          </div>
        ))}
      </div>
          <input
          type='text'
          placeholder='Enter Message'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp ={(e) => e.key === "Enter" && handleEnter(true)}
          disabled={rateLimited}
          />
        <select value={toUser} onChange={(e) => setToUser(e.target.value)}>
          <option>Select Private MSG User</option>
          {usersList.filter(item => item.status === 'online' && item.username !== currentUser).map((item, index) => (
            <option key={index} value={item.username}>{item.username}</option>
          ))}
        </select>
        <button disabled={rateLimited} onClick={() => handleEnter(true)} style={{backgroundColor: 'purple', color: 'green'}}>Send</button>
        <br></br>
        <select value={toUser} onChange={(e) => setToUser(e.target.value)}>
          <option>Select Video User</option>
          {usersList.filter(item => item.status === 'online' && item.username !== currentUser).map((item, index) => (
            <option key={index} value={item.username}>{item.username}</option>
          ))}
        </select>
        {/* <button onClick={() => setStartVideo(true)} style={{backgroundColor: 'red', color: 'black'}}>Video Chat</button> */}
        {/* {startVideo && ( */}
          <VideoChat fromUser={currentUser} toUser={toUser} socket={socket} />
        {/* )} */}
      </div>
      }
    </div>
  )
}

export default App
