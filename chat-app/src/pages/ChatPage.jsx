import { useState, useEffect, useRef } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import LanguageSelector from "../components/LanguageSelector";
import { usePreferredLanguage } from "../hooks/usePreferredLanguage";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getProfile,
  handleIncomingMessage,
  notifyTyping,
} from "../utils/chatHelpers";
import "../styles/ChatPage.css";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [preferredLang, setPreferredLang] = usePreferredLanguage("en");

  const [typingUsers, setTypingUsers] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  const [roomId, setRoomId] = useState("default");
  const [roomName, setRoomName] = useState("Default Room"); // NEW

  const socketRef = useRef(null);
  const preferredLangRef = useRef(preferredLang);
  const profileCacheRef = useRef(new Map());
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Track preferred language
  useEffect(() => {
    preferredLangRef.current = preferredLang;
  }, [preferredLang]);

  // Get roomId from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("room") || "default";
    setRoomId(r);
  }, [location]);

  // Fetch room name when roomId changes
  useEffect(() => {
    const fetchRoomName = async () => {
      if (roomId === "default") {
        setRoomName("Default Room");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "rooms", roomId));
        if (snap.exists()) {
          const data = snap.data();
          setRoomName(data.name || roomId);
        } else {
          setRoomName(roomId);
        }
      } catch (err) {
        console.error("Error fetching room name:", err);
        setRoomName(roomId);
      }
    };
    fetchRoomName();
  }, [roomId]);

  // Auth state and WebSocket setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, "profiles", user.uid));
          if (snap.exists()) {
            const profile = snap.data();
            if (profile.active === false) {
              alert("Your account has been deactivated by an administrator.");
              await signOut(auth);
              navigate("/");
              return;
            }
            setIsActive(true);
          }
        } catch (err) {
          console.error("Error checking active status:", err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    const socket = new WebSocket("ws://localhost:3001");
    socketRef.current = socket;

    socket.onopen = () => {
      if (currentUser) {
        socket.send(
          JSON.stringify({
            type: "presence",
            senderId: currentUser.uid,
            status: "online",
          })
        );
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "typing") {
        if (data.senderId) {
          const displayName = data.displayName || data.senderId;
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.set(data.senderId, displayName);
            return next;
          });
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(data.senderId);
              return next;
            });
          }, 2000);
        }
      } else if (data.type === "presence") {
        setOnlineUsers((prev) => {
          const next = new Map(prev);
          if (data.status === "online") {
            next.set(data.senderId, true);
          } else if (data.status === "offline") {
            next.delete(data.senderId);
          }
          return next;
        });
      } else if (data.type === "presenceSnapshot") {
        const snapshotMap = new Map(data.users.map((uid) => [uid, true]));
        setOnlineUsers(snapshotMap);
      } else if (data.text) {
        handleIncomingMessage(event.data, setMessages, preferredLangRef, (uid) =>
          getProfile(uid, db, profileCacheRef)
        );
      }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);

    socket.onclose = () => {
      if (currentUser) {
        socket.send(
          JSON.stringify({
            type: "presence",
            senderId: currentUser.uid,
            status: "offline",
          })
        );
      }
    };

    return () => {
      socket.close();
      unsubscribe();
    };
  }, [currentUser, navigate]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, "rooms", roomId, "messages"),
          orderBy("timestamp", "asc"),
          limit(50)
        );
        const snap = await getDocs(q);
        const history = snap.docs.map((d) => d.data());
        setMessages(history);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    loadHistory();
  }, [currentUser, roomId]);

  // Auto-add user to room members
  useEffect(() => {
    const addMember = async () => {
      if (!currentUser || !roomId) return;
      try {
        await updateDoc(doc(db, "rooms", roomId), {
          members: arrayUnion(currentUser.uid),
        });
      } catch (err) {
        // ignore if room doesn't exist (guest rooms)
      }
    };
    addMember();
  }, [currentUser, roomId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (currentUser && !isActive) {
      alert("You cannot send messages because your account is deactivated.");
      return;
    }

    const storedName = localStorage.getItem("displayName");
    const storedAvatar = localStorage.getItem("avatar");

    let senderName = "Guest";
    let avatar = null;
    let senderId = null;

    if (currentUser) {
      senderId = currentUser.uid;
      senderName =
        storedName || currentUser.displayName || currentUser.email || "User";
      avatar = storedAvatar || null;
    }

    const newMessage = {
      text: input.trim(),
      sender: senderName,
      avatar,
      senderId,
      timestamp: Date.now(),
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(newMessage));
    }

    if (currentUser) {
      try {
        await addDoc(collection(db, "rooms", roomId, "messages"), newMessage);
      } catch (err) {
        console.error("Failed to persist message:", err);
      }
    }

    setInput("");
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
        <h2>Chat Room: {roomName}</h2> {/* shows friendly name */}
        <div className="chatActions">
          <button
            onClick={() =>
              navigate("/create-room", {
                state: { onlineUsers: Array.from(onlineUsers.keys()) },
              })
            }
          >
            Create Private Room
          </button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
        <div className="onlineStatus">
          Online users: {onlineUsers.size}
        </div>
      </div>

      <div className="controls">
        <label>Translate to:</label>
        <LanguageSelector value={preferredLang} onChange={setPreferredLang} />
                <button onClick={() => setShowTranslation((prev) => !prev)}>
          {showTranslation ? "Show Original Only" : "Show Translations"}
        </button>
      </div>

      <div className="messageList">
        {messages.map((msg, i) => (
          <div key={i} className="message">
            {msg.avatar && (
              <img src={msg.avatar} alt="avatar" className="avatar" />
            )}
            <div>
              <strong>{msg.sender}:</strong> {msg.text}
              {showTranslation && msg.translatedText && (
                <div className="translation">
                  → {msg.translatedText}
                  {msg.sourceLang && (
                    <span> (translated from {msg.sourceLang})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.size > 0 && (
        <div className="typingIndicator">
          {Array.from(typingUsers.values()).join(", ")}{" "}
          {typingUsers.size === 1 ? "is typing..." : "are typing..."}
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
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            notifyTyping(socketRef, currentUser);
          }}
          placeholder={
            currentUser && !isActive
              ? "Your account is deactivated"
              : "Type a message..."
          }
          disabled={currentUser && !isActive}
        />
        <button type="submit" disabled={currentUser && !isActive}>
          Send
        </button>
      </form>
    </div>
  );
}
