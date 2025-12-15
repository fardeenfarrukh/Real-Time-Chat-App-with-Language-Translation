import { useNavigate } from 'react-router-dom';
import "../styles/HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>🌐 Live Translation Chat</h1>
      <p>Real-time messaging with automatic language translation</p>

      <div className="home-buttons">
        <button onClick={() => navigate('/login')}>Sign In</button>
        <button onClick={() => navigate('/login?mode=signup')}>Sign Up</button>
        <button onClick={() => navigate('/chat')}>Enter as Guest</button>
      </div>

      <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
        Supports English, French, Japanese, and more
      </p>
    </div>
  );
}
