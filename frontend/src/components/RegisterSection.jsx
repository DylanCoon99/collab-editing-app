import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaCommentDots } from 'react-icons/fa';


function RegisterSection() {

  const navigate = useNavigate();

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
      const res = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await res.json();

      if (res.ok) {
          

        // navigate user to the login page
        setAlert({ show: true, message: 'Account creation successful!', variant: 'success' });
        setTimeout(() => {
          navigate('/login'); // redirect after success
        }, 800);


      } else {
        setAlert({ show: true, message: 'Failed to create account', variant: 'danger' });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setAlert({ show: true, message: 'Something went wrong. Please try again later.', variant: 'danger' });
    }

    setIsSubmitting(false);

  };

  return (
    <div style={{ background: '#1c1c1c', padding: '4rem 1rem', minHeight: '100vh' }}>
      <Container style={{ maxWidth: '600px', color: '#ffffff'}}>
        <Card style={{ backgroundColor: '#505050', color: 'white', border: 'none', borderRadius: '12px'}}>
          <Card.Body>
            <h2 className="mb-4 text-center fw-bold">Create Account</h2>

            {alert.show && (
              <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
                {alert.message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label><FaUser className="me-2" />Email</Form.Label>
                <Form.Control

                  type="email"
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
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default RegisterSection;
