/*
 * =================================================================
 * MASTER SPEECH MODULE (Optimized for Windows & iOS)
 * =================================================================
 */

// --- PART 1: ROBUST SPEECH SYNTHESIS LOGIC ---

window.voiceList = [];
window.preferredVoice = null; // Store the selected voice globally

/**
 * Loads voices and intelligently picks the best "human-sounding" one
 * available on the device (prioritizing iOS premium and Windows Natural voices).
 */
window.loadVoices = function() {
    if (window.voiceList.length > 0) return; // Already loaded
    
    window.voiceList = window.speechSynthesis.getVoices();

    if (window.voiceList.length > 0) {
        // Reset preferred voice to ensure we pick the best one if the list changed
        window.preferredVoice = null; 

        // 1. Check for a manually saved preference (if you add settings later)
        const savedName = localStorage.getItem('klh_preferred_voice');
        if (savedName) {
            window.preferredVoice = window.voiceList.find(v => v.name === savedName);
        }

        // 2. Windows/Edge "Natural" Voices (Best quality on Windows)
        //    Looks for "Microsoft Aria Online (Natural)", "Guy", etc.
        if (!window.preferredVoice) {
            const winHighQuality = ['Natural', 'Online', 'Google US English'];
            window.preferredVoice = window.voiceList.find(v => 
                v.lang.startsWith('en') && 
                winHighQuality.some(keyword => v.name.includes(keyword))
            );
        }

        // 3. iOS/Mac High-Quality Favorites
        if (!window.preferredVoice) {
            const iosFavorites = ['Samantha', 'Daniel', 'Karen', 'Moira', 'Rishi', 'Tessa'];
            window.preferredVoice = window.voiceList.find(v => 
                v.lang.startsWith('en') && iosFavorites.includes(v.name)
            );
        }

        // 4. iOS "Enhanced" or "Siri" (Hidden gems)
        if (!window.preferredVoice) {
            window.preferredVoice = window.voiceList.find(v => 
                v.lang.startsWith('en') && 
                (v.name.includes('Enhanced') || v.name.includes('Siri'))
            );
        }

        // 5. Fallback: Default US English
        if (!window.preferredVoice) {
            window.preferredVoice = window.voiceList.find(v => v.lang === 'en-US' && v.default);
        }

        // 6. Final Fallback: Any US English voice
        if (!window.preferredVoice) {
            window.preferredVoice = window.voiceList.find(v => v.lang === 'en-US');
        }
        
        if (window.preferredVoice) {
            console.log("Selected Voice:", window.preferredVoice.name);
        }
    }
};

// Try to load immediately
window.loadVoices();
// Ensure we load again when the browser reports voices are ready
window.speechSynthesis.onvoiceschanged = window.loadVoices;


/**
 * Speaks text with specific optimizations for iOS (Pitch/Rate) and Windows (Wake-up Primer).
 * @param {string} text - The text to speak.
 * @param {function} [onEndCallback] - Optional callback.
 */
window.speakText = function(text, onEndCallback) {
    window.speechSynthesis.cancel(); // Stop any overlap

    // Safari/Chrome sometimes return an empty list initially. Try loading again.
    if (window.voiceList.length === 0) {
        window.loadVoices();
    }

    // --- WINDOWS FIX: Audio Wake-Up ---
    // Windows audio drivers often sleep, cutting off the first word.
    // We queue a fast, nearly silent "primer" to wake it up first.
    if (navigator.platform.indexOf('Win') > -1) {
        const primer = new SpeechSynthesisUtterance("_");
        primer.volume = 0.01; // Just enough to engage the speaker
        primer.rate = 10;     // Super fast to minimize delay
        window.speechSynthesis.speak(primer);
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
// (Keeps mobile browsers happy by unlocking audio on the first touch)

;(function globalUnlockSpeech() {
  function isMobile() {
    if (navigator.userAgentData && navigator.userAgentData.mobile !== undefined) {
      return navigator.userAgentData.mobile;
    }
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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
      } catch (e) {}
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
        const utter = new SpeechSynthesisUtterance('');
        utter.volume = 0;
        utter.text = ' '; 
        utter.onend = () => resolve(true);
        utter.onerror = () => resolve(false);
        speechSynthesis.speak(utter);
        setTimeout(() => resolve(true), 500); 
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

  window.unlockSpeechIfNeeded = function unlockSpeechIfNeeded() {
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
window.playConfettiEffect = function() {
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

    const colors = ['#f44336', '#2196F3', '#4CAF50', '#FFEB3B', '#FF9800', '#9C27B0'];
    const particles = [];
    const numParticles = 100; 

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 3 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: Math.floor(Math.random() * 3), 
            size: Math.random() * 10 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }

    let startTime = Date.now();
    const duration = 5000; 

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        if (elapsed > duration) {
            canvas.remove();
            return;
        }
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            ctx.fillStyle = p.color;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            if (p.shape === 0) {
                ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
            } else if (p.shape === 1) {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.shape === 2) {
                ctx.beginPath(); ctx.moveTo(0, -p.size / 2);
                ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
            if (p.y > height + 20) {
                 if (elapsed < duration - 2000) { p.y = -20; p.x = Math.random() * width; }
            }
        });
        requestAnimationFrame(animate);
    }
    window.addEventListener('resize', () => {
        width = window.innerWidth; height = window.innerHeight;
        canvas.width = width; canvas.height = height;
    }, { once: true });
    animate();
}

/**
 * Creates a localized "burst" of confetti from a target element.
 */
window.playBurstEffect = function(targetElement) {
    const numConfetti = 30;
    const colors = ['#f44336', '#2196F3', '#4CAF50', '#FFEB3B', '#FF9800', '#9C27B0'];
    const shapes = ['★', '●', '▲'];
    const container = document.body;
    const rect = targetElement.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + rect.height / 2 + window.scrollY;

    for (let i = 0; i < numConfetti; i++) {
        const particle = document.createElement('div');
        particle.classList.add('burst-particle');
        particle.innerHTML = shapes[Math.floor(Math.random() * shapes.length)];
        particle.style.color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 100 + 50;
        const destX = Math.cos(angle) * distance;
        const destY = Math.sin(angle) * distance;
        particle.style.setProperty('--dest-x', `${destX}px`);
        particle.style.setProperty('--dest-y', `${destY}px`);
        container.appendChild(particle);
        setTimeout(() => { particle.remove(); }, 800);
    }
}