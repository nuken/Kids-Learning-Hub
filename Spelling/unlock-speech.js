/*
 * Reusable Speech Synthesis Module
 *
 * Handles:
 * 1. iOS audio context unlocking (must be called from a user-tap).
 * 2. Loading and selecting a preferred voice.
 * 3. Providing a simple 'speakText' function with rate control.
 */

// Make these global or attach to window for easy access from other scripts
window.voiceList = [];
window.preferredVoice = null;
const PREFERRED_VOICES = [
    'Google US English', // High-quality, common on Chrome
    'Daniel',              // Common on macOS/iOS
    'Samantha',            // Common on macOS/iOS
    'Microsoft David - English (United States)', // Windows
    'Microsoft Zira - English (United States)'   // Windows
];

/**
 * Loads and selects the best available voice.
 * This is triggered by 'voiceschanged' event.
 */
function loadVoices() {
    // Get the list of voices
    window.voiceList = window.speechSynthesis.getVoices()
        .filter(voice => voice.lang.startsWith('en')); // Filter for English voices

    // Find the best-matching preferred voice
    for (const name of PREFERRED_VOICES) {
        const voice = window.voiceList.find(v => v.name === name);
        if (voice) {
            window.preferredVoice = voice;
            // console.log(`Speech: Preferred voice set to ${name}`);
            return;
        }
    }

    // Fallback: If no preferred voice, use the first available US English voice
    if (!window.preferredVoice) {
        window.preferredVoice = window.voiceList.find(v => v.lang === 'en-US');
    }

    // Fallback: If still no voice, use the first English voice
    if (!window.preferredVoice) {
        window.preferredVoice = window.voiceList[0];
    }
    // console.log(`Speech: Fallback voice set to ${window.preferredVoice?.name}`);
}

/**
 * Speaks the given text aloud.
 * @param {string} text - The text to speak.
 * @param {number} [rate=0.9] - The speed of speech (0.1 to 10).
 */
window.speakText = function(text, rate = 0.9) {
    if (!window.speechSynthesis) {
        console.warn("Speech synthesis not supported.");
        return;
    }

    // Cancel any current speech to prevent overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    // Set the preferred voice if it's loaded
    if (window.preferredVoice) {
        utterance.voice = window.preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
}

/**
 * Unlocks the Web Speech API on iOS.
 * This MUST be called from within a synchronous user event (e.g., 'click').
 */
window.unlockSpeechIfNeeded = function() {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        return; // Already unlocked
    }
    
    // Create a "silent" utterance
    const utterance = new SpeechSynthesisUtterance('.');
    utterance.volume = 0; // Make it inaudible
    utterance.rate = 10;  // Make it fast
    
    window.speechSynthesis.speak(utterance);
    window.speechSynthesis.cancel(); // Immediately clear it
    
    // console.log("Speech unlocked.");
}

// --- Event Listeners ---

// Load voices when they become available
// Some browsers fire this immediately, others after a delay
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Initial load (for browsers like Chrome that might have voices ready)
loadVoices();