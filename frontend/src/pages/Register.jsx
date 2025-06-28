import React from 'react';
import RegisterSection from '../components/RegisterSection';
import { Container, Row, Col, Card, Image, Figure } from 'react-bootstrap';
import './login.css'

function Register() {
  return (
      <Container id="login" className="my-5 p-4 rounded shadow-sm" style={{ backgroundColor: '#1c1c1c', maxWidth: '600px' }}>
        <h2 style={{ color: '#ffffff', fontSize: '2.5rem'}}className="text-center mb-4">Create Account</h2>
        <RegisterSection />
      </Container>
  );
}

export default Register;