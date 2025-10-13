import { useEffect, useState } from "react";
import { fetchSupportedLanguages } from "../utils/fetchLanguages";

export default function LanguageSelector({ value, onChange }) {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    async function loadLanguages() {
      const langs = await fetchSupportedLanguages();
      const formatted = Object.entries(langs).map(([code, { name }]) => ({
        code,
        name,
      }));
      setLanguages(formatted);
    }
    loadLanguages();
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
