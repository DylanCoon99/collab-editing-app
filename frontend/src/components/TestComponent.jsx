// TestComponent.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

export default function TestComponent() {
  const params = useParams();
  return (
    <div>
      <h2>Test Component</h2>
      <p>Params: {JSON.stringify(params)}</p>
    </div>
  );
}