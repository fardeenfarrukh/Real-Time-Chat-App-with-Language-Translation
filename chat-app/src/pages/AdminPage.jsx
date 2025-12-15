import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import "../styles/AdminPage.css";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [newLang, setNewLang] = useState("");
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const profileSnap = await getDoc(doc(db, "profiles", user.uid));
          if (profileSnap.exists() && profileSnap.data().isAdmin) {
            setIsAdmin(true);
            await loadUsers();
            await loadLanguages();
            await loadMessages();
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Failed to check admin status:", err);
          setIsAdmin(false);
        }
      } else {
        navigate("/");
      }
    });
    return () => unsub();
  }, [navigate]);

  const loadUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "profiles"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load users:", err);
      alert("Failed to load users: " + err.message);
    }
  };

  const toggleActive = async (uid, active) => {
    try {
      await updateDoc(doc(db, "profiles", uid), { active: !active });
      setUsers(prev =>
        prev.map(u => (u.id === uid ? { ...u, active: !active } : u))
      );
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update user: " + err.message);
    }
  };

  const setAdminStatus = async (uid, makeAdmin) => {
    try {
      await updateDoc(doc(db, "profiles", uid), { isAdmin: makeAdmin });
      setUsers(prev =>
        prev.map(u => (u.id === uid ? { ...u, isAdmin: makeAdmin } : u))
      );
    } catch (err) {
      console.error("Failed to update admin status:", err);
      alert("Failed to update admin status: " + err.message);
    }
  };

  const loadLanguages = async () => {
    try {
      const langDoc = await getDoc(doc(db, "config", "languages"));
      if (langDoc.exists()) {
        setLanguages(langDoc.data().list || []);
      } else {
        await setDoc(doc(db, "config", "languages"), { list: ["en", "fr"] });
        setLanguages(["en", "fr"]);
      }
    } catch (err) {
      console.error("Failed to load languages:", err);
      alert("Failed to load languages: " + err.message);
    }
  };

  const addLanguage = async () => {
    if (!newLang.trim()) return;
    try {
      const updated = [...languages, newLang.trim()];
      await updateDoc(doc(db, "config", "languages"), { list: updated });
      setLanguages(updated);
      setNewLang("");
    } catch (err) {
      console.error("Failed to add language:", err);
      alert("Failed to add language: " + err.message);
    }
  };

  const removeLanguage = async (lang) => {
    try {
      const updated = languages.filter((l) => l !== lang);
      await updateDoc(doc(db, "config", "languages"), { list: updated });
      setLanguages(updated);
    } catch (err) {
      console.error("Failed to remove language:", err);
      alert("Failed to remove language: " + err.message);
    }
  };

  const loadMessages = async () => {
    try {
      const roomsSnap = await getDocs(collection(db, "rooms"));
      let allMessages = [];
      for (const room of roomsSnap.docs) {
        const q = query(
          collection(db, "rooms", room.id, "messages"),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const snap = await getDocs(q);
        allMessages = [
          ...allMessages,
          ...snap.docs.map((d) => ({ room: room.id, ...d.data() })),
        ];
      }
      allMessages.sort((a, b) => b.timestamp - a.timestamp);
      setMessages(allMessages);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      alert("Failed to fetch messages: " + err.message);
    }
  };

  // ✅ fallback rendering
  if (!currentUser) {
    return <div className="adminContainer">Loading...</div>;
  }

  if (currentUser && !isAdmin) {
    return (
      <div className="adminContainer">
        Access denied. Admins only.
        <p>Ask a project owner to set <code>isAdmin: true</code> on your profile in Firestore.</p>
      </div>
    );
  }

  return (
    <div className="adminContainer">
      <h2>Admin Dashboard</h2>

      <section>
        <h3>User Management</h3>
        <table className="userTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.displayName || u.id}</td>
                <td>{u.active ? "Active" : "Inactive"}</td>
                <td>{u.isAdmin ? "Admin" : "User"}</td>
                <td className="actionsCell">
                  <button
                    onClick={() => toggleActive(u.id, u.active)}
                    className={u.active ? "deactivateBtn" : "activateBtn"}
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => setAdminStatus(u.id, !u.isAdmin)}
                    className={u.isAdmin ? "removeAdminBtn" : "makeAdminBtn"}
                  >
                    {u.isAdmin ? "Remove Admin" : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Supported Languages</h3>
        <ul>
          {languages.map((lang) => (
            <li key={lang}>
              {lang}{" "}
              <button onClick={() => removeLanguage(lang)}>Remove</button>
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
          placeholder="Add new language code"
        />
        <button onClick={addLanguage}>Add</button>
      </section>

      <section>
        <h3>Recent Messages (Logs)</h3>
        <ul>
          {messages.map((m, i) => (
            <li key={i}>
              [{m.room}] {m.sender}: {m.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
