/*
 * =================================================================
 * MASTER SPEECH MODULE (Updated for iOS Quality)
 * =================================================================
 */

// --- PART 1: ROBUST SPEECH SYNTHESIS LOGIC ---

window.voiceList = [];
window.preferredVoice = null; // Store the selected voice globally

/**
 * Loads voices and intelligently picks the best "human-sounding" one
 * available on the device (prioritizing iOS premium voices).
 */
window.loadVoices = function() {
    if (window.voiceList.length > 0) return; // Already loaded

    window.voiceList = window.speechSynthesis.getVoices();

    // Run the Smart Voice Hunting Logic
    if (!window.preferredVoice && window.voiceList.length > 0) {

        // 1. Check for a saved preference (if you add settings later)
        const savedName = localStorage.getItem('klh_preferred_voice');
        if (savedName) {
            window.preferredVoice = window.voiceList.find(v => v.name === savedName);
        }

        // 2. If no preference, hunt for high-quality Apple voices
        if (!window.preferredVoice) {
            const iosFavorites = ['Samantha', 'Daniel', 'Karen', 'Moira', 'Rishi', 'Tessa'];
            window.preferredVoice = window.voiceList.find(v => iosFavorites.includes(v.name) && v.lang.startsWith('en'));
        }

        // 3. Look for any "Enhanced" or "Siri" voice (often hidden high-quality gems)
        if (!window.preferredVoice) {
            window.preferredVoice = window.voiceList.find(v =>
                (v.name.includes('Enhanced') || v.name.includes('Siri')) && v.lang.startsWith('en')
            );
        }

        // 4. Fallback: Default US English
        if (!window.preferredVoice) {
            window.preferredVoice = window.voiceList.find(v => v.lang === 'en-US' && v.default);
        }

        // 5. Final Fallback: Any US English voice
        if (!window.preferredVoice) {
            window.preferredVoice = window.voiceList.find(v => v.lang === 'en-US');
        }
    }
};

// Try to load immediately
window.loadVoices();
// Ensure we load again when the browser reports voices are ready (vital for Safari)
window.speechSynthesis.onvoiceschanged = window.loadVoices;


/**
 * Speaks text with specific optimizations for iOS devices.
 * @param {string} text - The text to speak.
 * @param {function} [onEndCallback] - Optional callback.
 */
window.speakText = function(text, onEndCallback) {
    window.speechSynthesis.cancel(); // Stop any overlap

    // Safari sometimes returns an empty list initially. Try loading again.
    if (window.voiceList.length === 0) {
        window.loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // --- iOS OPTIMIZATIONS ---
    // Detect if we are on an Apple mobile device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
        // iOS default voices are often deep/slow.
        // We speed them up and raise pitch slightly to sound friendlier.
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
    } else {
        // Standard settings for Windows/Android
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
    }

    // Assign the voice found by our Smart Hunter
    if (window.preferredVoice) {
        utterance.voice = window.preferredVoice;
        // **CRITICAL FIX**: Explicitly set the lang matching the voice.
        // This prevents Safari from using a French accent if the voice has a hidden lang tag.
        utterance.lang = window.preferredVoice.lang;
    } else {
        utterance.lang = 'en-US';
    }

    if (onEndCallback) {
        utterance.onend = onEndCallback;
    }

    window.speechSynthesis.speak(utterance);
};

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
    // 1. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // 2. Config
    const colors = ['#f44336', '#2196F3', '#4CAF50', '#FFEB3B', '#FF9800', '#9C27B0'];
    // Shapes: 0=Circle, 1=Square, 2=Triangle
    const particles = [];
    const numParticles = 100; 

    // 3. Create Particles
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height, // Start above screen
            vx: Math.random() * 2 - 1,          // Horizontal drift
            vy: Math.random() * 3 + 2,          // Falling speed
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: Math.floor(Math.random() * 3), 
            size: Math.random() * 10 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }

    // 4. Animation Loop
    let startTime = Date.now();
    const duration = 5000; // 5 seconds

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;

        if (elapsed > duration) {
            canvas.remove(); // Cleanup
            return;
        }

        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            // Update
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            // Draw
            ctx.fillStyle = p.color;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);

            if (p.shape === 0) { // Circle
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.shape === 1) { // Square
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.shape === 2) { // Triangle
                ctx.beginPath();
                ctx.moveTo(0, -p.size / 2);
                ctx.lineTo(p.size / 2, p.size / 2);
                ctx.lineTo(-p.size / 2, p.size / 2);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // Reset if off screen (optional loop)
            if (p.y > height + 20) {
                 // Only reset if we are in the first 3 seconds, else let them fall out
                 if (elapsed < duration - 2000) {
                     p.y = -20;
                     p.x = Math.random() * width;
                 }
            }
        });

        requestAnimationFrame(animate);
    }

    // Handle resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }, { once: true }); // Just do it once or managing listener removal becomes complex

    animate();
}
/**
 * Creates a localized "burst" of confetti from a target element.
 * @param {HTMLElement} targetElement - The DOM element to burst from.
 */
window.playBurstEffect = function(targetElement) {
    const numConfetti = 30; // A good number for a burst
    const colors = ['#f44336', '#2196F3', '#4CAF50', '#FFEB3B', '#FF9800', '#9C27B0'];
    const shapes = ['★', '●', '▲']; // Simpler shapes for a clean burst
    const container = document.body;

    // Get the absolute center coordinates of the button
    const rect = targetElement.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + rect.height / 2 + window.scrollY;

    for (let i = 0; i < numConfetti; i++) {
        const particle = document.createElement('div');
        particle.classList.add('burst-particle'); // Use our new CSS class
        
        // Set the shape and a random color
        particle.innerHTML = shapes[Math.floor(Math.random() * shapes.length)];
        particle.style.color = colors[Math.floor(Math.random() * colors.length)];

        // Set the particle's starting position (fixed to the screen)
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        // Calculate a random destination for the particle to fly to
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 100 + 50; // Fly 50-150px outwards
        
        // We use 'translate' in the CSS, so the destination is relative
        const destX = Math.cos(angle) * distance;
        const destY = Math.sin(angle) * distance;

        // Set the CSS variables that the @keyframe animation will use
        particle.style.setProperty('--dest-x', `${destX}px`);
        particle.style.setProperty('--dest-y', `${destY}px`);
        
        container.appendChild(particle);

        // Clean up the particle after the animation (800ms)
        setTimeout(() => {
            particle.remove();
        }, 800);
    }
}
