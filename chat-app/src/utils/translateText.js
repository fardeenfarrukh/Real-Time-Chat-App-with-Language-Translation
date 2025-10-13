export async function translateText(text, targetLang = "en") {
  const key = import.meta.env.VITE_MS_TRANSLATOR_KEY;
  const region = import.meta.env.VITE_MS_TRANSLATOR_REGION;
  const endpoint =
    import.meta.env.VITE_MS_TRANSLATOR_ENDPOINT ||
    "https://api.cognitive.microsofttranslator.com/";

  if (!key || !region) {
    console.warn("Translator key/region missing. Check your .env file.");
    return { translatedText: text, sourceLang: null };
  }

  try {
    const url = `${endpoint}translate?api-version=3.0&to=${targetLang}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text }]),
    });

    const data = await response.json();
    console.log("Translator status:", response.status, data);

    if (!response.ok) {
      return { translatedText: text, sourceLang: null };
    }

    const translatedText = data?.[0]?.translations?.[0]?.text || text;
    const sourceLang = data?.[0]?.detectedLanguage?.language || null;

    return { translatedText, sourceLang };
  } catch (err) {
    console.error("Microsoft Translator request failed:", err);
    return { translatedText: text, sourceLang: null };
  }
}
