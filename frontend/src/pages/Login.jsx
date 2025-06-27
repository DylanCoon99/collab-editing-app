import React from 'react';
import LoginSection from '../components/LoginSection';
import { Container, Row, Col, Card, Image, Figure } from 'react-bootstrap';

function Login() {
  return (
      <Container id="login" className="my-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#1c1c1c', maxWidth: '600px' }}>
        <h2 style={{ color: '#ffffff', fontSize: '2.5rem'}}className="text-center mb-4">Login</h2>
        <LoginSection />
      </Container>

  );
}

export default Login;