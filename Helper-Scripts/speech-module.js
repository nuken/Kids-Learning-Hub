/*
 * =================================================================
 * MASTER SPEECH MODULE (v2 - With iOS/Safari Fixes)
 * =================================================================
 *
 * This single file provides:
 * 1. window.loadVoices():     Loads and selects the best voice.
 * 2. window.speakText():       A robust speech function with iOS fixes.
 * 3. window.unlockSpeechIfNeeded(): A gesture-based audio unlocker.
 *
 * This code is based on the superior logic found in Alphabet/script.js.
 */

// --- PART 1: ROBUST SPEECH SYNTHESIS LOGIC ---

// Make voiceList global to persist across calls.
window.voiceList = [];

/**
 * Populates the global voiceList. This function is designed to be
 * called multiple times if needed, as Safari can be slow to load voices.
 */
window.loadVoices = function() {
    // If we've already loaded voices, don't do it again.
    if (window.voiceList.length > 0) {
        return;
    }
    window.voiceList = window.speechSynthesis.getVoices();

    // Attempt to find a preferred voice immediately
    if (!window.preferredVoice) {
         let selectedVoice = null;
         // 1. Try to find the high-quality "Samantha" voice, specific to Apple devices.
        selectedVoice = window.voiceList.find(v => v.name === 'Samantha' && v.lang === 'en-US');

        // 2. If not found, look for any voice that is the browser's default for US English.
        if (!selectedVoice) {
            selectedVoice = window.voiceList.find(v => v.lang === 'en-US' && v.default);
        }

        // 3. If still no voice, just grab the very first US English voice available.
        if (!selectedVoice) {
            selectedVoice = window.voiceList.find(v => v.lang === 'en-US');
        }

        window.preferredVoice = selectedVoice;
    }
}

// Try to load voices immediately when the script runs.
window.loadVoices();

// Also, set up the event listener which is the "correct" way to do it.
window.speechSynthesis.onvoiceschanged = window.loadVoices;


/**
 * The robust, Safari-compatible text-to-speech function.
 * @param {string} text - The text to speak.
 * @param {function} [onEndCallback] - Optional: A function to run when speech finishes.
 */
window.speakText = function(text, onEndCallback) {
    // Always cancel any previous speech to avoid overlaps.
    window.speechSynthesis.cancel();

    // ** SAFARI FIX 1: If the voice list is still empty, make another attempt to load them. **
    if (window.voiceList.length === 0) {
        window.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // A good rate for kids

    // Set the language as a fallback.
    utterance.lang = 'en-US';

    if (onEndCallback) {
        utterance.onend = onEndCallback;
    }

    // Only try to select a specific voice if the list has been populated.
    if (window.voiceList.length > 0) {

        // Use the globally pre-selected voice if available
        let selectedVoice = window.preferredVoice;

        // If preferredVoice is still null, try one last time to find one
        if (!selectedVoice) {
             selectedVoice = window.voiceList.find(v => v.name === 'Samantha' && v.lang === 'en-US');
            if (!selectedVoice) {
                selectedVoice = window.voiceList.find(v => v.lang === 'en-US' && v.default);
            }
            if (!selectedVoice) {
                selectedVoice = window.voiceList.find(v => v.lang === 'en-US');
            }
        }

        // If we successfully found a voice, assign it.
        if (selectedVoice) {
            utterance.voice = selectedVoice;

            // ** CRITICAL SAFARI FIX 2: Re-set the lang property from the
            //    voice object itself. This fixes the "French voice" issue. **
            utterance.lang = selectedVoice.lang;
        }
    }

    window.speechSynthesis.speak(utterance);
}


// --- PART 2: AUDIO UNLOCKER LOGIC ---
// (From Alphabet/unlock-speech.js)

;(function globalUnlockSpeech() {
  // Detect mobile devices
  function isMobile() {
    if (navigator.userAgentData && navigator.userAgentData.mobile !== undefined) {
      return navigator.userAgentData.mobile;
    }
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // Detect desktop
  function isDesktop() {
    return !isMobile();
  }

  // Try to resume an AudioContext
  async function resumeAudio() {
    try {
      const context = (window.__unlockAudioContext && window.__unlockAudioContext.context) || new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') {
        await context.resume();
      }
      try {
        const buffer = context.createBuffer(1, 1, context.sampleRate);
        const src = context.createBufferSource();
        src.buffer = buffer;
        src.connect(context.destination);
        src.start(0);
        window.__unlockAudioContext = { context, _unlockSrc: src };
      } catch (e) {
        // Non-fatal
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Small speechSynthesis utterance to unlock speech
  function speakUnlockUtterance() {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve(false);
        return;
      }
      try {
        const voices = speechSynthesis.getVoices();
        const utter = new SpeechSynthesisUtterance('');
        utter.volume = 0;
        utter.text = ' '; // Use a single space
        utter.onend = () => resolve(true);
        utter.onerror = () => resolve(false);
        speechSynthesis.speak(utter);
        setTimeout(() => resolve(true), 500); // Fallback timer
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function unlockRoutine() {
    const audioResumed = await resumeAudio();
    const speechRes = await speakUnlockUtterance();
    return audioResumed || speechRes;
  }

  // Public function to call on load
  window.unlockSpeechIfNeeded = function unlockSpeechIfNeeded() {

    // This was targeting desktops, but for iOS we need it on mobile too.
    // Let's just run it on all devices for simplicity.
    // if (!isDesktop()) {
    //   return Promise.resolve(false);
    // }

    const mayNeedUnlock = !!(window.AudioContext || window.webkitAudioContext) || 'speechSynthesis' in window;
    if (!mayNeedUnlock) return Promise.resolve(false);

    return new Promise((resolve) => {
      let handled = false;
      const tryUnlockNow = async (event) => {
        if (handled) return;
        handled = true;

        try {
          const ok = await unlockRoutine();
          cleanup();
          resolve(ok);
        } catch (e) {
          cleanup();
          resolve(false);
        }
      };

      const cleanup = () => {
        document.removeEventListener('click', tryUnlockNow, true);
        document.removeEventListener('keydown', tryUnlockNow, true);
        document.removeEventListener('touchstart', tryUnlockNow, true);
      };

      document.addEventListener('click', tryUnlockNow, true);
      document.addEventListener('keydown', tryUnlockNow, true);
      document.addEventListener('touchstart', tryUnlockNow, true);

      // Timeout
      setTimeout(() => {
        if (!handled) {
          handled = true;
          cleanup();
          resolve(false);
        }
      }, 10000);
    });
  };
})();

/**
 * Creates a full-screen confetti "win" animation.
 */
/**
 * Creates a full-screen confetti "win" animation.
 */
window.playConfettiEffect = function() {
    const numConfetti = 100; // How many pieces of confetti
    const colors = ['#f44336', '#2196F3', '#4CAF50', '#FFEB3B', '#FF9800', '#9C27B0'];
    const shapes = ['★', '●', '▲', '■', '♦']; // You can add more shapes here!
    const container = document.body;

    for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti-particle');
        
        // --- NEW: Pick a random shape and set it as the content ---
        confetti.innerHTML = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Set random properties
        confetti.style.left = `${Math.random() * 100}vw`; // Start anywhere at the top
        
        // --- NEW: Set the COLOR of the shape, not the background ---
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Use CSS custom properties for unique animations
        confetti.style.setProperty('--random-rotate', `${Math.random() * 720 - 360}deg`); // Spin
        confetti.style.setProperty('--random-tumble', `${Math.random() * 720 - 360}deg`); // Tumble
        confetti.style.setProperty('--random-duration', `${Math.random() * 2 + 3}s`); // 3-5 seconds
        confetti.style.setProperty('--random-delay', `${Math.random() * 0.5}s`); // Stagger start
        
        container.appendChild(confetti);

        // Remove the element after its animation finishes
        setTimeout(() => {
            confetti.remove();
        }, 5000); // 5 seconds (must be longer than --random-duration)
    }
}