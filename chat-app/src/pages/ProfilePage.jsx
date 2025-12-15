import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import LanguageSelector from "../components/LanguageSelector";
import AvatarUploader from "../components/AvatarUploader";
import "../styles/ProfilePage.css";

export default function ProfilePage() {
  // local state
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(""); // base64 avatar string
  const [langPref, setLangPref] = useState("en");
  const [langOptions, setLangOptions] = useState(["en", "fr"]);
  const navigate = useNavigate();

  useEffect(() => {
    // load cached profile values
    const cachedName = localStorage.getItem("displayName");
    const cachedLang = localStorage.getItem("preferredLang");
    const cachedAvatar = localStorage.getItem("avatar");

    if (cachedName) setName(cachedName);
    if (cachedLang) setLangPref(cachedLang);
    if (cachedAvatar) setAvatar(cachedAvatar);

    // fetch supported languages from Firestore
    const fetchLangs = async () => {
      try {
        const langDoc = await getDoc(doc(db, "config", "languages"));
        if (langDoc.exists()) {
          const langs = langDoc.data().list || ["en", "fr"];
          setLangOptions(langs);
        }
      } catch (err) {
        console.error("Failed to load supported languages:", err);
      }
    };
    fetchLangs();
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in to save your profile.");
        return;
      }

      // profile payload
      const profileData = {
        displayName: name,
        avatar,
        preferredLang: langPref,
      };

      // save to Firestore
      await setDoc(doc(db, "profiles", user.uid), profileData);

      // cache locally
      localStorage.setItem("displayName", name);
      localStorage.setItem("avatar", avatar);
      localStorage.setItem("preferredLang", langPref);

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
        value={name}
        onChange={(e) => setName(e.target.value)}
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
        value={langPref}
        onChange={(lang) => setLangPref(lang)}
        options={langOptions}
      />

      <button onClick={handleSave} style={{ marginTop: "1rem" }}>
        Save Changes
      </button>
    </div>
  );
}
