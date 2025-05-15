import { useState } from 'react';
import '../App.css';
import useSocket from './useSocketLuce';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [msgTimestamps, setMsgTimestamps] = useState([]);
  const [currentUser, setCurrentUser] = useState('');

  const { chat, sendMessage } = useSocket();

  const maxMessages = 5;
  const timeWindow = 5000; // ms

  function login() {
    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => {
      if (data !== 'Invalid username or password') {
        setCurrentUser(username);
      }
      alert(data);
    })
    .catch(err => alert(err))
  }

  function handleEnter() {
    const now = Date.now();

    // Filter out messages older than timeWindow
    const recentTimestamps = msgTimestamps.filter(item => now - item < timeWindow);

    if (recentTimestamps.length >= maxMessages) {
      setRateLimited(true);
      alert("You're sending too many messages. Stop it.");

      setTimeout(() => {
        setRateLimited(false);
        setMsgTimestamps([]);
      }, timeWindow);
    } else {
      setMsgTimestamps([...recentTimestamps, now]);
      sendMessage(message);
      setMessage('');
    }
  }

  function register() {
    fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => alert(data.success))
    .catch(err => console.log(err))
  }

  return (
    <>
      {currentUser && (
        <h2>You are logged in as {currentUser}</h2>
      )}
      <input 
        type='text'
        placeholder='Username'
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>
      <input 
        type='text'
        placeholder='Enter Message'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyUp={(e) => e.key === 'Enter' && handleEnter()}
        disabled={rateLimited}
      />
      <button disabled={rateLimited} onClick={() => handleEnter()}>Send</button>
      <div>
          <h2>Messages:</h2>
          {chat.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
      </div>
    </>
  )
}

export default App;
