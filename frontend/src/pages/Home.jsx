import React, { useState } from 'react';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import DocumentList from '../components/DocumentList';
import '../styles.css';

export default function Home() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreateDocument = async (e) => {

    const token = localStorage.getItem('token');

    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      setSuccess('Document created successfully!');
      setTitle('');
      setContent('');
      setError(null);
      // Trigger a refresh of the document list
      window.dispatchEvent(new Event('documentCreated'));
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  return (
    <Container>
      <h1>Document Editor</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleCreateDocument} className="mb-4">
        <Form.Group controlId="documentTitle" className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
            required
          />
        </Form.Group>
        <Form.Group controlId="documentContent" className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter document content"
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Create Document
        </Button>
      </Form>
      <h2>Your Documents</h2>
      <DocumentList />
    </Container>
  );
}
/*

It should display the current users documents, an option 
to create a document, and an option to share a document.

It should also allow the user to click on a document and 
that will navigate them to the document editor

*/