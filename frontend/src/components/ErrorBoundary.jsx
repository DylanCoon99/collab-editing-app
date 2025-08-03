
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#fff', background: '#1c1c1c' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'red' }}>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.href = '/home'}
            style={{ padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Back to Document List
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;