// Translate a given text into the target language using Microsoft Translator API
export async function translateText(text, targetLang = "en") {
  // Grab credentials and endpoint from environment
  const apiKey = import.meta.env.VITE_MS_TRANSLATOR_KEY;
  const apiRegion = import.meta.env.VITE_MS_TRANSLATOR_REGION;
  const apiEndpoint =
    import.meta.env.VITE_MS_TRANSLATOR_ENDPOINT ||
    "https://api.cognitive.microsofttranslator.com/";

  // If credentials are missing, just return the original text
  if (!apiKey || !apiRegion) {
    console.warn("Translator key/region missing. Check your .env file.");
    return { translatedText: text, sourceLang: null };
  }

  try {
    // Build request URL
    const requestUrl = `${apiEndpoint}translate?api-version=3.0&to=${targetLang}`;

    // Send translation request
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Ocp-Apim-Subscription-Region": apiRegion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text }]),
    });

    // Parse response JSON
    const payload = await response.json();
    console.log("Translator status:", response.status, payload);

    // If request failed, return original text
    if (!response.ok) {
      return { translatedText: text, sourceLang: null };
    }

    // Extract translated text and detected source language
    const translatedText =
      payload?.[0]?.translations?.[0]?.text || text;
    const sourceLang =
      payload?.[0]?.detectedLanguage?.language || null;

    return { translatedText, sourceLang };
  } catch (error) {
    console.error("Microsoft Translator request failed:", error);
    return { translatedText: text, sourceLang: null };
  }
}
