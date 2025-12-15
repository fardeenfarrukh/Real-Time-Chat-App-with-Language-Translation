// Keep track of available voices
let availableVoices = [];

// Refresh the list whenever the browser updates voices
window.speechSynthesis.onvoiceschanged = () => {
  availableVoices = window.speechSynthesis.getVoices();
};

// Speak out some text in the closest matching language
export function playSpeech(message, preferredLang = "en") {
  if (!message) return;

  const speech = new SpeechSynthesisUtterance(message);

  // Try to find a voice that matches the language hint
  const voiceChoice = availableVoices.find(v =>
    v.lang.toLowerCase().startsWith(preferredLang.toLowerCase())
  );

  if (voiceChoice) {
    speech.voice = voiceChoice;
    speech.lang = voiceChoice.lang;
  } else {
    // Fallback to the first voice if nothing matches
    speech.voice = availableVoices[0];
    speech.lang = availableVoices[0]?.lang || "en-US";
  }

  // Stop anything currently speaking before starting new speech
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}
