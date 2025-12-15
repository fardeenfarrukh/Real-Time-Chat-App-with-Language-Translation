import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup") {
      setMode("signup");
    }
  }, [location]);

  const fetchProfile = async (uid) => {
    const profileRef = doc(db, "profiles", uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();

      if (data.active === false) {
        throw new Error("Your account has been deactivated by an administrator.");
      }

      localStorage.setItem("displayName", data.displayName);
      localStorage.setItem("avatar", data.avatar);
      localStorage.setItem("preferredLang", data.preferredLang);
      return true;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Signup successful! Please set up your profile.');
        navigate('/profile');
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const hasProfile = await fetchProfile(userCred.user.uid);
        alert('Login successful!');
        navigate(hasProfile ? '/chat' : '/profile');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGuestLogin = () => {
    const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem('displayName', guestName);
    localStorage.setItem('avatar', '');
    alert(`Entering as ${guestName}...`);
    navigate('/chat');
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        if (data.active === false) {
          throw new Error("Your account has been deactivated by an administrator.");
        }
        localStorage.setItem("displayName", data.displayName);
        localStorage.setItem("avatar", data.avatar);
        localStorage.setItem("preferredLang", data.preferredLang);
        alert("Login successful with Google!");
        navigate("/chat");
      } else {
        alert("Welcome! Please set up your profile.");
        navigate("/profile");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="loginContainer">
      <h2>{mode === 'signup' ? 'Sign Up' : 'Log In'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {mode === 'signup' ? 'Create Account' : 'Log In'}
        </button>
      </form>

      <button onClick={handleGoogleLogin}>Continue with Google</button>
      <button onClick={handleGuestLogin}>Continue as Guest</button>

      <p className="privacyNotice">
        Guest sessions are temporary. Messages are not saved and will be deleted when you leave the chat.
      </p>

      <p>
        {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        >
          {mode === 'signup' ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
