// Get supported translation languages from Microsoft Translator
export async function fetchSupportedLanguages() {
  try {
    // Translator endpoint for language metadata
    const apiUrl =
      "https://api.cognitive.microsofttranslator.com/languages?api-version=3.0&scope=translation";

    // Make the request
    const langRes = await fetch(apiUrl);

    // Parse the JSON payload
    const langJson = await langRes.json();

    // Return translation section (e.g. { en: { name: "English" }, fr: { name: "French" }, ... })
    return langJson.translation;
  } catch (error) {
    console.error("Unable to fetch supported languages:", error);
    return {};
  }
}
