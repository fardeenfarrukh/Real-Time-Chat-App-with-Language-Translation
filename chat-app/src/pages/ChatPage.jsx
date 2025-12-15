import { useState, useEffect, useRef } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import LanguageSelector from "../components/LanguageSelector";
import { usePreferredLanguage } from "../hooks/usePreferredLanguage";
import { useNavigate, useLocation } from "react-router-dom";
import { getProfile, handleIncomingMessage, notifyTyping } from "../utils/chatHelpers";
import "../styles/ChatPage.css";
import menu from "../assets/menu.svg";
import { playSpeech } from "../utils/speechHelpers";

export default function ChatPage() {
  // state
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [active, setActive] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [langPref, setLangPref] = usePreferredLanguage("en");
  const [avatar, setAvatar] = useState(null);
  const [typing, setTyping] = useState(new Map());
  const [roomId, setRoomId] = useState("default");
  const [roomName, setRoomName] = useState("Default Room");

  // refs
  const socketRef = useRef(null);
  const langRef = useRef(langPref);
  const profileCache = useRef(new Map());
  const endRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // keep language in sync
  useEffect(() => {
    langRef.current = langPref;
  }, [langPref]);

  // read roomId from query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setRoomId(params.get("room") || "default");
  }, [location]);

  // fetch room name
  useEffect(() => {
    const fetchRoom = async () => {
      if (roomId === "default") {
        setRoomName("Default Room");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "rooms", roomId));
        setRoomName(snap.exists() ? snap.data().name || "Unnamed Room" : "Unnamed Room");
      } catch (err) {
        console.error("Error fetching room name:", err);
        setRoomName("Unnamed Room");
      }
    };
    fetchRoom();
  }, [roomId]);

  // websocket
  useEffect(() => {
    const socket = new WebSocket("wss://my-chatapp-server.onrender.com");
    socketRef.current = socket;

    socket.onopen = () => console.log("WebSocket connected.");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "typing" && data.senderId) {
        const name = data.displayName || data.senderId;
        setTyping((prev) => new Map(prev).set(data.senderId, name));
        setTimeout(() => {
          setTyping((prev) => {
            const next = new Map(prev);
            next.delete(data.senderId);
            return next;
          });
        }, 2000);
      } else if (data.text) {
        handleIncomingMessage(event.data, setMsgs, langRef, (uid) =>
          getProfile(uid, db, profileCache)
        );
      }
    };
    socket.onerror = (err) => console.error("WebSocket error:", err);
    socket.onclose = () => console.log("WebSocket disconnected.");

    return () => socket.close();
  }, []);

  // auth + presence
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, "profiles", u.uid));
          if (snap.exists() && snap.data().active === false) {
            alert("Your account has been deactivated.");
            await signOut(auth);
            navigate("/");
            return;
          }
          setActive(true);
        } catch (err) {
          console.error("Error checking profile:", err);
        }
        setUser(u);
      } else {
        setUser(null);
      }
    });

    const socket = socketRef.current;
    if (!socket) return;

    const sendPresence = () => {
      if (socket.readyState === WebSocket.OPEN && user) {
        socket.send(JSON.stringify({ type: "presence", senderId: user.uid, status: "online" }));
      }
    };

    if (socket.readyState === WebSocket.OPEN) sendPresence();
    else socket.addEventListener("open", sendPresence);

    return () => {
      unsub();
      socket.removeEventListener("open", sendPresence);
      if (socket.readyState === WebSocket.OPEN && user) {
        socket.send(JSON.stringify({ type: "presence", senderId: user.uid, status: "offline" }));
      }
    };
  }, [user, navigate]);

  // scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // chat listener
  useEffect(() => {
    if (!user || !roomId) {
      setMsgs([]);
      return;
    }
    const q = query(collection(db, "rooms", roomId, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, roomId]);

  // load avatar
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "profiles", user.uid));
      if (snap.exists()) setAvatar(snap.data().avatar || null);
    };
    loadAvatar();
  }, [user]);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (user && !active) {
      alert("You cannot send messages because your account is deactivated.");
      return;
    }

    const storedName = localStorage.getItem("displayName");
    const storedAvatar = localStorage.getItem("avatar");

    let senderName = storedName || "Guest";
    let senderAvatar = storedAvatar || null;
    let senderId = null;

    if (user) {
      senderId = user.uid;
      const profile = await getProfile(senderId, db, profileCache);
      senderName = profile?.displayName || user.displayName || "User";
      senderAvatar = profile?.avatar || storedAvatar || null;
    }

    const msg = {
      text: text.trim(),
      sender: senderName,
      avatar: senderAvatar,
      senderId,
      timestamp: serverTimestamp(),
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }

    if (user) {
      try {
        await addDoc(collection(db, "rooms", roomId, "messages"), msg);
      } catch (err) {
        console.error("Failed to save message:", err);
      }
    }

    setText("");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("displayName");
      localStorage.removeItem("avatar");
      localStorage.removeItem("preferredLang");
      navigate("/");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <div className="chatContainer">
      <div className="chatHeader">
        <h2>Chat Room: {roomName}</h2>
        <div className="chatActions">
          <button onClick={() => navigate("/rooms")}>Rooms</button>
          {user && <button onClick={handleSignOut}>Sign Out</button>}
        </div>
        <div className="profileActions">
          <button onClick={() => navigate("/profile")}>
            {avatar ? (
              <img src={avatar} alt="Clickable Avatar" className="avatar-image" />
            ) : (
              <img src={menu} alt="Menu icon" className="button-image" />
            )}
          </button>
        </div>
      </div>

      <div className="controls">
        <label>Translate to:</label>
        <LanguageSelector value={langPref} onChange={setLangPref} />
        <button onClick={() => setShowTrans((prev) => !prev)}>
          {showTrans ? "Show Original Only" : "Show Translations"}
        </button>
      </div>

      <div className="messageList">
        {msgs.map((m) => (
          <div key={m.id} className="message">
            {m.avatar && <img src={m.avatar} alt="avatar" className="avatar" />}
            <div>
              <strong>{m.sender}:</strong> {m.text}
              {showTrans && m.translatedText && (
                <div className="translation">
                  → {m.translatedText}
                                    {m.sourceLang && <span> (translated from {m.sourceLang})</span>}
                </div>
              )}
              <button
                className="speakerButton"
                onClick={() =>
                  playSpeech(m.translatedText || m.text, m.sourceLang || langPref)
                }
              >
                🔊
              </button>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {typing.size > 0 && (
        <div className="typingIndicator">
          {Array.from(typing.values()).join(", ")}{" "}
          {typing.size === 1 ? "is typing..." : "are typing..."}
        </div>
      )}

      <form
        className="inputRow"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            notifyTyping(socketRef, user);
          }}
          placeholder={!active ? "Your account is deactivated" : "Type a message..."}
          disabled={!active}
        />
        <button type="submit" disabled={!active}>
          Send
        </button>
      </form>
    </div>
  );
}
