import { useState, useEffect } from "react";

// Custom hook to manage a user's preferred language setting
export function usePreferredLanguage(defaultLang = "en") {
  // Track current language in state
  const [currentLang, setCurrentLang] = useState(defaultLang);

  // On mount, check localStorage for a saved preference
  useEffect(() => {
    const storedLang = localStorage.getItem("preferredLang");
    if (storedLang) {
      setCurrentLang(storedLang);
    }
  }, []);

  // Update both state and localStorage
  const saveLangPreference = (newLang) => {
    setCurrentLang(newLang);
    localStorage.setItem("preferredLang", newLang);
  };

  // Return tuple [language, updater] like useState
  return [currentLang, saveLangPreference];
}
