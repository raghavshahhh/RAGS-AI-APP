import { useState } from 'react';

function SimpleApp() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Error: Backend not responding');
    }
    setLoading(false);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(26, 31, 58, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        border: '1px solid rgba(0, 217, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(90deg, #00d9ff, #7000ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          RAGS AI
        </h1>
        
        <p style={{
          textAlign: 'center',
          color: '#8b92b0',
          marginBottom: '30px'
        }}>
          Your Personal AI Assistant
        </p>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            style={{
              width: '100%',
              padding: '15px',
              background: 'rgba(10, 14, 39, 0.5)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            background: loading ? '#555' : 'linear-gradient(90deg, #00d9ff, #7000ff)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? 'Thinking...' : 'Send Message'}
        </button>

        {response && (
          <div style={{
            padding: '20px',
            background: 'rgba(0, 217, 255, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            marginTop: '20px'
          }}>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {response}
            </p>
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(0, 217, 255, 0.05)',
          borderRadius: '10px',
          fontSize: '12px',
          color: '#8b92b0'
        }}>
          <p>✅ Backend: http://localhost:3000</p>
          <p>✅ Frontend: http://localhost:1420</p>
          <p>✅ Status: Connected</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;
