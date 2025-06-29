import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function DocumentEditor() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      const token = localStorage.getItem('token');

      try {
        const res = await fetch(`http://localhost:8080/api/document/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        setDoc(data);
        setContent(data.content.String || '');
      } catch (err) {
        console.error(err);
        setError('Failed to load document');
      }
    };

    fetchDoc();
  }, [id]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  return (
    <div style={{ padding: '2rem', background: '#1c1c1c', color: '#fff', minHeight: '100vh' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {doc ? (
        <>
          <h2>{doc.title}</h2>
          <textarea
            value={content}
            onChange={handleContentChange}
            style={{
              width: '100%',
              height: '80vh',
              marginTop: '1rem',
              padding: '1rem',
              fontSize: '1rem',
              fontFamily: 'monospace',
              background: '#2f2f2f',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '8px',
            }}
          />
        </>
      ) : (
        <p>Loading document...</p>
      )}
    </div>
  );
}
