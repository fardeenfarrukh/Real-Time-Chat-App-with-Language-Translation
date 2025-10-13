import { useState, useEffect } from 'react';

export function usePreferredLanguage(defaultLang = 'en') {
  const [lang, setLang] = useState(defaultLang);

  useEffect(() => {
    const saved = localStorage.getItem('preferredLang');
    if (saved) setLang(saved);
  }, []);

  const updateLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('preferredLang', newLang);
  };

  return [lang, updateLang];
}
