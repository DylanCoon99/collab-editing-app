import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Register from './pages/Register';
import RequireAuth from './components/RequireAuth'
//import './styles.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={
        <RequireAuth>
          <Home />
        </RequireAuth>} />
      </Routes>
    </Router>
  );
}

export default App;
