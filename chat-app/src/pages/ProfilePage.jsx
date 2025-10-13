import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import LanguageSelector from "../components/LanguageSelector";
import AvatarUploader from "../components/AvatarUploader";
import imageCompression from "browser-image-compression";
import "../styles/ProfilePage.css";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [preferredLang, setPreferredLang] = useState("en");
  const [supportedLangs, setSupportedLangs] = useState(["en", "fr"]); // ✅ default fallback
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved profile values from localStorage
    const savedName = localStorage.getItem("displayName");
    const savedLang = localStorage.getItem("preferredLang");
    const savedAvatar = localStorage.getItem("avatar");

    if (savedName) setDisplayName(savedName);
    if (savedLang) setPreferredLang(savedLang);
    if (savedAvatar) setAvatar(savedAvatar);

    // Fetch supported languages from Firestore
    const fetchLanguages = async () => {
      try {
        const langDoc = await getDoc(doc(db, "config", "languages"));
        if (langDoc.exists()) {
          const langs = langDoc.data().list || ["en", "fr"];
          setSupportedLangs(langs);
        }
      } catch (err) {
        console.error("Failed to load supported languages:", err);
      }
    };
    fetchLanguages();
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to save your profile.");
        return;
      }

      let avatarCompressed = avatar;

      // compress avatar if it's a base64 string
      if (avatar && avatar.startsWith("data:")) {
        const res = await fetch(avatar);
        const blob = await res.blob();
        const file = new File([blob], "avatar.jpg", { type: blob.type });

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 128,
          useWebWorker: true,
        });

        avatarCompressed = await imageCompression.getDataUrlFromFile(compressedFile);

        if (avatarCompressed.length > 900000) {
          alert("Avatar is still too large. Please choose a smaller image.");
          return;
        }
      }

      const profileData = {
        displayName,
        avatar: avatarCompressed,
        preferredLang,
      };

      await setDoc(doc(db, "profiles", user.uid), profileData);

      localStorage.setItem("displayName", displayName);
      localStorage.setItem("avatar", avatarCompressed);
      localStorage.setItem("preferredLang", preferredLang);

      alert("Profile saved!");
      navigate("/chat");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Check console for details.");
    }
  };

  return (
    <div className="profile-container">
      <h2>Profile Settings</h2>

      <label>Display Name:</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Enter your name"
      />

      <label>Upload Avatar:</label>
      <AvatarUploader onAvatarChange={(base64) => setAvatar(base64)} />
      {avatar && (
        <div className="avatar-preview">
          <img
            src={avatar}
            alt="Your Avatar"
            style={{ width: "80px", height: "80px", borderRadius: "50%" }}
          />
        </div>
      )}

      <label>Preferred Language:</label>
      <LanguageSelector
        value={preferredLang}
        onChange={(lang) => setPreferredLang(lang)}
        options={supportedLangs} // pass admin‑controlled list
      />

      <button onClick={handleSave} style={{ marginTop: "1rem" }}>
        Save Changes
      </button>
    </div>
  );
}
