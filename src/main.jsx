import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Messenger from './Messenger.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
          <Route path='/' element={<App />} />
          <Route path='/messenger' element={<Messenger />} />
      </Routes>
    </Router>
  </StrictMode>,
)
