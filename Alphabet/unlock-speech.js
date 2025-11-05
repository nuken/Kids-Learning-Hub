// Small helper to "unlock" audio / speech on desktop browsers (Chrome/Edge) requiring a user gesture.
//
// Usage: import or include this file and call unlockSpeechIfNeeded() early on page load.
// It will attach a one-time handler that resumes AudioContext and does a tiny speech-synthesis
// utterance or plays a silent buffer to allow subsequent speechSynth / audio to play without
// requiring an extra click later.
//
// This intentionally runs only on non-mobile platforms to avoid changing mobile behavior.

(function globalUnlockSpeech() {
  // Detect mobile devices - tweak as needed for your app
  function isMobile() {
    if (navigator.userAgentData && navigator.userAgentData.mobile !== undefined) {
      return navigator.userAgentData.mobile;
    }
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // Detect Windows/desktop-ish environment. You can narrow this to Windows if you prefer.
  function isDesktop() {
    return !isMobile();
  }

  // Try to resume an AudioContext and play a tiny silent buffer.
  async function resumeAudio() {
    try {
      // Use an existing context if you have one; otherwise make a short-lived one.
      const context = (window.__unlockAudioContext && window.__unlockAudioContext.context) || new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Play a very short silent buffer to unlock audio on some browsers.
      try {
        const buffer = context.createBuffer(1, 1, context.sampleRate);
        const src = context.createBufferSource();
        src.buffer = buffer;
        src.connect(context.destination);
        src.start(0);
        // keep a reference so GC doesn't free context too soon
        window.__unlockAudioContext = { context, _unlockSrc: src };
      } catch (e) {
        // Non-fatal; continue to speech fallback
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Small speechSynthesis utterance to unlock speech output if allowed.
  function speakUnlockUtterance() {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      try {
        const voices = speechSynthesis.getVoices(); // triggers voice load in some browsers
        const utter = new SpeechSynthesisUtterance('');
        utter.volume = 0; // near-silent - you can use 0 to be silent; be careful with volume 0 in some browsers
        utter.onend = () => resolve(true);
        utter.onerror = () => resolve(false);

        // Some browsers will ignore a truly empty utterance; if that happens, speak a short whitespace + zero volume
        // NOTE: if volume=0 is ignored by some browsers, consider using a very short unintrusive phrase.
        utter.text = ' '; // single space as safest "non-empty" text that remains silent with volume=0
        speechSynthesis.speak(utter);

        // Set a timeout fallback in case onend doesn't fire
        setTimeout(() => resolve(true), 500);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // Main unlock routine. Returns a promise that resolves once we've attempted unlocking.
  async function unlockRoutine() {
    const audioResumed = await resumeAudio();
    const speechRes = await speakUnlockUtterance();
    return audioResumed || speechRes;
  }

  // Public function to call on load
  window.unlockSpeechIfNeeded = function unlockSpeechIfNeeded() {
    if (!isDesktop()) {
      // don't run on mobile - preserve mobile behavior
      return Promise.resolve(false);
    }

    // If no AudioContext is present and no speechSynthesis, nothing to do.
    const mayNeedUnlock = !!(window.AudioContext || window.webkitAudioContext) || 'speechSynthesis' in window;
    if (!mayNeedUnlock) return Promise.resolve(false);

    // If AudioContext exists and is running or speechSynthesis works without gesture, we may not need to attach a handler.
    // But safest approach: attach a one-time user gesture handler that runs only if necessary.
    return new Promise((resolve) => {
      let handled = false;
      const tryUnlockNow = async (event) => {
        if (handled) return;
        handled = true;

        // Prevent interfering with other event handlers (but don't stopPropagation).
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

      // Attach one-time handlers. A natural user interaction (click anywhere) will unlock audio.
      document.addEventListener('click', tryUnlockNow, true);
      document.addEventListener('keydown', tryUnlockNow, true);
      document.addEventListener('touchstart', tryUnlockNow, true);

      // Optionally: if context already running, run immediately (no gesture required)
      try {
        const ctx = window.__unlockAudioContext && window.__unlockAudioContext.context;
        if (ctx && ctx.state === 'running') {
          // run the unlock routine without waiting for a gesture
          (async () => {
            const ok = await unlockRoutine();
            cleanup();
            resolve(ok);
          })();
        }
      } catch (e) {
        // ignore
      }

      // If nothing happens after 10s, resolve false to avoid hanging
      setTimeout(() => {
        if (!handled) {
          handled = true;
          cleanup();
          resolve(false);
        }
      }, 10000);
    });
  };

  // Optionally call automatically on load (commented out).
  // window.addEventListener('load', () => { window.unlockSpeechIfNeeded(); });
})();