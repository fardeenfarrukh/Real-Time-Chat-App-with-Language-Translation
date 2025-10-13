// Fetch the list of supported languages from Microsoft Translator
export async function fetchSupportedLanguages() {
  try {
    const response = await fetch(
      "https://api.cognitive.microsofttranslator.com/languages?api-version=3.0&scope=translation"
    );
    const data = await response.json();
    return data.translation; // returns an object like { en: { name: "English" }, fr: { name: "French" }, ... }
  } catch (err) {
    console.error("Failed to fetch supported languages:", err);
    return {};
  }
}
