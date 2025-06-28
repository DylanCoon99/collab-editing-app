// src/components/RequireAuth.jsx
import { Navigate } from 'react-router-dom';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');

  // Optional: decode and validate the token with jwt-decode
  const isAuthenticated = !!token;

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default RequireAuth;

// eventually use jwt-decode to see if the token has expired