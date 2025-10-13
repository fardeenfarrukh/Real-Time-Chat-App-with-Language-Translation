import { doc, getDoc } from "firebase/firestore";
import { translateText } from "./translateText";

// Cache-aware profile fetch
export async function getProfile(uid, db, cacheRef) {
  if (!uid) return null;
  if (cacheRef.current.has(uid)) {
    return cacheRef.current.get(uid);
  }
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    if (snap.exists()) {
      const profile = snap.data();
      cacheRef.current.set(uid, profile);
      return profile;
    }
  } catch (err) {
    console.error("Profile fetch error:", err);
  }
  return null;
}

// Handle incoming WebSocket message
export async function handleIncomingMessage(
  rawData,
  setMessages,
  preferredLangRef,
  getProfileFn
) {
  try {
    const data = JSON.parse(rawData);
    if (!data.text) return;

    let enriched = { ...data };
    if (!enriched.avatar && enriched.senderId) {
      const profile = await getProfileFn(enriched.senderId);
      if (profile) {
        enriched.sender = profile.displayName || enriched.sender;
        enriched.avatar = profile.avatar || null;
      }
    }

    const { translatedText, sourceLang } = await translateText(
      enriched.text,
      preferredLangRef.current
    );

    setMessages((prev) => [
      ...prev,
      { ...enriched, translatedText, sourceLang },
    ]);
  } catch (err) {
    console.error("Failed to process incoming message:", err);
  }
}

// Notify typing event
export function notifyTyping(socketRef, currentUser) {
  if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
    return;

  const storedName = localStorage.getItem("displayName");
  const displayName =
    storedName || currentUser?.displayName || currentUser?.email || "Guest";

  socketRef.current.send(
    JSON.stringify({
      type: "typing",
      senderId: currentUser?.uid || null,
      displayName,
      isTyping: true,
    })
  );
}
