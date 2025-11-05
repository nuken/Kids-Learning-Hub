// Small helper to "unlock" audio / speech on desktop browsers (Chrome/Edge) requiring a user gesture.
(function globalUnlockSpeech() {
  function isMobile() {
    if (navigator.userAgentData && navigator.userAgentData.mobile !== undefined) {
      return navigator.userAgentData.mobile;
    }
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isDesktop() {
    return !isMobile();
  }

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
      } catch (e) { /* Non-fatal */ }
      return true;
    } catch (e) {
      return false;
    }
  }

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
        utter.onend = () => resolve(true);
        utter.onerror = () => resolve(false);
        utter.text = ' '; // single space
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
    if (!isDesktop()) {
      // don't run on mobile
      return Promise.resolve(false);
    }

    const mayNeedUnlock = !!(window.AudioContext || window.webkitAudioContext) || 'speechSynthesis' in window;
    if (!mayNeedUnlock) return Promise.resolve(false);

    return new Promise((resolve) => {
      let handled = false;
      
      // --- THIS IS THE FIX ---
      const tryUnlockNow = (event) => {
        if (handled) return;
        handled = true;
        
        // **KEY CHANGE:** We no longer 'await' the unlockRoutine.
        // We run it in the background and let the click event
        // continue immediately. This fixes the "eaten click" delay.
        unlockRoutine().then(resolve);

        cleanup();
      };
      // --- END OF FIX ---

      const cleanup = () => {
        document.removeEventListener('click', tryUnlockNow, true);
        document.removeEventListener('keydown', tryUnlockNow, true);
        document.removeEventListener('touchstart', tryUnlockNow, true);
      };

      // Attach one-time handlers using 'true' (capturing)
      // This is necessary to unlock *before* the app tries to speak
      document.addEventListener('click', tryUnlockNow, true);
      document.addEventListener('keydown', tryUnlockNow, true);
      document.addEventListener('touchstart', tryUnlockNow, true);
    });
  };
})();