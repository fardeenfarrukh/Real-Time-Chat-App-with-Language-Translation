import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/RoomsPage.css";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);        // list of rooms
  const [user, setUser] = useState(null);        // current logged-in user
  const [profiles, setProfiles] = useState([]);  // all user profiles
  const [selected, setSelected] = useState([]);  // selected users for new room
  const navigate = useNavigate();

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Subscribe to rooms where the user is a member, ordered by createdAt
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "rooms"),
      where("members", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRooms(list);
    });
    return () => unsub();
  }, [user]);

  // Load all profiles (for user selection when creating a room)
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const snap = await getDocs(collection(db, "profiles"));
        setProfiles(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load profiles:", err);
      }
    };
    fetchProfiles();
  }, []);

  // Toggle user selection for new room
  const toggleSelect = (uid) => {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Create a new room with selected users
  const handleCreateRoom = async () => {
    if (!user) {
      alert("You must be signed in to create a room.");
      return;
    }
    if (selected.length === 0) {
      alert("Select at least one user to create a room.");
      return;
    }

    let customName = prompt("Enter a room name (leave blank to auto-generate):");

    if (!customName) {
      const selectedProfiles = profiles.filter((u) =>
        selected.includes(u.uid)
      );
      const names = selectedProfiles.map((u) => u.displayName || u.uid);
      customName = `Private Room: ${names.join(", ")}`;
    }

    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        name: customName,
        createdBy: user.uid,
        members: [user.uid, ...selected], // include creator
        createdAt: serverTimestamp(),
        isPrivate: true,
      });
      setSelected([]);
      navigate(`/chat?room=${docRef.id}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      alert("Error creating room: " + err.message);
    }
  };

  // Delete all messages in a room, then delete the room itself
  const cascadeDeleteRoom = async (roomId) => {
    try {
      const msgsSnap = await getDocs(collection(db, "rooms", roomId, "messages"));
      const deletions = msgsSnap.docs.map((m) =>
        deleteDoc(doc(db, "rooms", roomId, "messages", m.id))
      );
      await Promise.allSettled(deletions);
      await deleteDoc(doc(db, "rooms", roomId));
    } catch (err) {
      throw err;
    }
  };

  // Delete handler
  const handleDeleteRoom = async (room) => {
    if (!user) return;
    if (room.createdBy !== user.uid) {
      alert("Only the creator of this room can delete it.");
      return;
    }
    const confirmed = window.confirm(
      `Delete room "${room.name || "Unnamed Room"}"?\nThis will remove the room and its messages.`
    );
    if (!confirmed) return;

    try {
      await cascadeDeleteRoom(room.id);
      alert("Room deleted successfully.");
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Error deleting room: " + err.message);
    }
  };

  return (
    <div className="roomsContainer">
      <h2>Your Rooms</h2>

      {/* Room creation section */}
      <div className="createRoomSection">
        <h3>Create a New Room</h3>
        <p>Select users to add:</p>
        <ul className="userList">
          {profiles
            .filter((p) => p.uid !== user?.uid) // exclude self
            .map((p) => (
              <li key={p.uid}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.uid)}
                    onChange={() => toggleSelect(p.uid)}
                  />
                  {p.displayName || p.uid}
                </label>
              </li>
            ))}
        </ul>
        <button onClick={handleCreateRoom} disabled={selected.length === 0}>
          Create Room
        </button>
      </div>

      {/* Room list section */}
      <div className="roomListSection">
        <h3>Your Existing Rooms</h3>
        {rooms.length === 0 ? (
          <p>No rooms yet. Create one to get started!</p>
        ) : (
          <ul className="roomsList">
            {rooms.map((room) => (
              <li key={room.id} className="roomItem">
                {/* Always show the assigned name */}
                <span className="roomName">{room.name || "Unnamed Room"}</span>
                <div className="roomActions">
                  <button onClick={() => navigate(`/chat?room=${room.id}`)}>
                    Join
                  </button>
                  {user && room.createdBy && room.createdBy === user.uid && (
                    <button
                      className="deleteBtn"
                      onClick={() => handleDeleteRoom(room)}
                      style={{ marginLeft: "0.5rem", color: "red" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
