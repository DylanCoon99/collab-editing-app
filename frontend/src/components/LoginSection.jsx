import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaCommentDots } from 'react-icons/fa';

function LoginSection() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email.trim() || !password.trim()) {
      setAlert({ show: true, message: 'Please fill in all fields.', variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setAlert({ show: false, message: '', variant: '' });

    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await res.json();

      if (res.ok) {
        setAlert({ show: true, message: 'Message sent! I look forward to speaking with you.', variant: 'success' });
        setFormData({ email: '', password: '' });
      } else {
        setAlert({ show: true, message: result.message || 'Failed to send message.', variant: 'danger' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert({ show: true, message: 'Something went wrong. Please try again later.', variant: 'danger' });
    }

    setIsSubmitting(false);
  };

  return (
    <div style={{ background: '#1c1c1c', padding: '4rem 1rem', minHeight: '100vh' }}>
      <Container style={{ maxWidth: '600px', color: '#ffffff'}}>
        <Card style={{ backgroundColor: '#505050', color: 'white', border: 'none', borderRadius: '12px'}}>
          <Card.Body>
            <h2 className="mb-4 text-center fw-bold">Contact Me</h2>

            {alert.show && (
              <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
                {alert.message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="name">
                <Form.Label><FaUser className="me-2" />Email</Form.Label>
                <Form.Control

                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Email"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label><FaEnvelope className="me-2" />Password</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Password"
                />
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-100 rounded-pill"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Failed to send message'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default LoginSection;
