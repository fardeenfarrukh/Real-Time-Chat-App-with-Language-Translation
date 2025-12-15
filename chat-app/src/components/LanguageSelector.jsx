import { useEffect, useState } from "react";
import { fetchSupportedLanguages } from "../utils/fetchLanguages";

// A simple dropdown for picking a language.
// Fetches the list once, formats it, and hands back the chosen code.
export default function LanguageSelector({ value, onChange }) {
  // Local state for the list of languages
  const [langOptions, setLangOptions] = useState([]);

  useEffect(() => {
    const grabLanguages = async () => {
      try {
        const langs = await fetchSupportedLanguages();
        // Turn the object { en: { name: "English" }, ... } into an array
        const formatted = Object.entries(langs).map(([code, { name }]) => ({
          code,
          name,
        }));
        setLangOptions(formatted);
      } catch (error) {
        console.error("Could not load languages:", error);
        setLangOptions([]);
      }
    };
    grabLanguages();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="language-selector"
    >
      {/* Friendly default option */}
      <option value="" disabled>
        🌐 Select a language...
      </option>

      {langOptions.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name} ({lang.code})
        </option>
      ))}
    </select>
  );
}
