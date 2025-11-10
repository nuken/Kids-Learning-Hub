// --- START: Robust Audio Unlocker ---
// This unlocker plays a silent sound and waits for it to finish,
// guaranteeing the audio system is "awake" before any real
// sounds are played.
let audioUnlocked = false;
async function unlockAudio() {
    if (audioUnlocked) return; // Only run once
    
    // A tiny, silent WAV file encoded in base64.
    const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
    
    try {
        // We MUST 'await' this play() promise.
        // This ensures the browser has fully un-paused its
        // audio system before we continue.
        await silentAudio.play();
    } catch (error) {
        // This is fine. The user interaction still registered.
    }
    
    console.log("Audio Unlocked");
    audioUnlocked = true;
}
// --- END: Robust Audio Unlocker ---


// --- START: Pre-generated Audio Player ---
// (No changes here, this part is correct)

const audioCache = {};
const audioQueue = [];
let isPlaying = false;
const SOUND_DIR = 'sounds/'; // Path to your new audio files

/**
 * Pre-loads audio files into a cache.
 * @param {string[]} filenames - An array of filenames (e.g., ['tap.mp3', 'plus.mp3'])
 */
function preloadAudio(filenames) {
    filenames.forEach(file => {
        const fullPath = `${SOUND_DIR}${file}`;
        if (!audioCache[fullPath]) {
            audioCache[fullPath] = new Audio(fullPath);
        }
    });
}

/**
 * Plays one or more audio files in sequence.
 * @param {string|string[]} audioFiles - A single filename or an array of filenames.
 * @param {function} [onEndCallback] - Optional: A function to run when the *entire sequence* finishes.
 */
function speakText(audioFiles, onEndCallback) {
    // 1. Ensure audioFiles is an array
    const filesToPlay = Array.isArray(audioFiles) ? audioFiles : [audioFiles];
    
    // 2. Add this "job" to the queue
    audioQueue.push({
        files: filesToPlay,
        callback: onEndCallback
    });

    // 3. If nothing is currently playing, start the queue
    if (!isPlaying) {
        playNextInQueue();
    }
}

function playNextInQueue() {
    if (audioQueue.length === 0) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    const job = audioQueue[0]; // Get the next job (files + callback)

    function playFile(index) {
        if (index >= job.files.length) {
            // This job is done
            if (job.callback) {
                job.callback();
            }
            // Remove this job and play the next one
            audioQueue.shift(); 
            playNextInQueue();
            return;
        }
        
        const filename = job.files[index];
        const fullPath = `${SOUND_DIR}${filename}`;
        let audio = audioCache[fullPath];
        
        if (!audio) {
            // Load on-demand if not pre-cached
            audio = new Audio(fullPath);
            audioCache[fullPath] = audio;
        }

        audio.currentTime = 0;
        
        audio.onended = () => {
            // When this file finishes, play the next file in the job
            playFile(index + 1);
        };
        
        audio.onerror = () => {
            console.error(`Could not play audio: ${fullPath}`);
            // Skip this file and play the next
            playFile(index + 1);
        };

        audio.play().catch(e => {
            console.error(`Audio play error: ${e.message}`);
            // Skip this file and play the next
            playFile(index + 1);
        });
    }

    // Start playing the first file in this job
    playFile(0);
}
// --- END: Pre-generated Audio Player ---


// --- This is your original list, which is correct ---
const EXAMPLE_WORDS = {
    'A': 'Apple',
    'B': 'Boy',
    'C': 'Cat',
    'D': 'Dog',
    'E': 'Egg',
    'F': 'Fish',
    'G': 'Goat',
    'H': 'Hat',
    'I': 'Igloo',
    'J': 'Jar',
    'K': 'Kite',
    'L': 'Lion',
    'M': 'Moon',
    'N': 'Nest',
    'O': 'Octopus',
    'P': 'Pig',
    'Q': 'Queen',
    'R': 'Ring',
    'S': 'Sun',
    'T': 'Turtle',
    'U': 'Umbrella',
    'V': 'Volcano',
    'W': 'Watch',
    'X': 'X-ray',
    'Y': 'Yo-yo',
    'Z': 'Zebra'
};

// NEW: Full alphabet for Level 2
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// This function generates a random bright color (RGB between 100-250)
function getRandomBrightColor() {
    let r = Math.floor(Math.random() * 150) + 100; // 100-250
    let g = Math.floor(Math.random() * 150) + 100; // 100-250
    let b = Math.floor(Math.random() * 150) + 100; // 100-250

    const toHex = (c) => `0${c.toString(16)}`.slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


// --- KEPT: Your original function for instant sound effects ---
async function playSound(sound) {
    sound.currentTime = 0; // Rewind to start
    try {
        await sound.play();
    } catch (err) {
        // Log the error but don't crash the app
        console.error("Audio play failed:", err);
    }
}


// Wait for the page to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    const container = document.getElementById('alphabet-container');
    const level1Button = document.getElementById('level-1-button');
    const colorPalette = document.getElementById('color-palette');
    const bodyElement = document.body;
    const speechToggleButton = document.getElementById('speech-toggle-button');
    const caseToggleButton = document.getElementById('case-toggle-button');
    const level2Button = document.getElementById('level-2-button');
    const alphabetPrompt = document.getElementById('alphabet-prompt');

    // --- Corrected path to sounds folder ---
    const goodSound = new Audio('sounds/correct.mp3');
    const badSound = new Audio('sounds/wrong.mp3');

    let currentGameMode = 'level1';
    let currentTargetLetter = null; 
    let lettersToFind = [];
    let speechMode = 'letter'; 
    speechToggleButton.textContent = 'Switch to Words'; 
    let caseMode = 'upper'; 

    // ... your colorPalette listener ...
    colorPalette.addEventListener('click', (event) => {
        if (event.target.classList.contains('color-swatch')) {
            const newColor = event.target.dataset.color;
            bodyElement.style.backgroundColor = newColor;
        }
    });

    speechToggleButton.addEventListener('click', () => {
        if (speechMode === 'letter') {
            speechMode = 'letterAndWord';
            speechToggleButton.textContent = 'Switch to Letters';
        } else {
            speechMode = 'letter';
            speechToggleButton.textContent = 'Switch to Words';
        }
    });

    caseToggleButton.addEventListener('click', () => {
        if (caseMode === 'upper') {
            caseMode = 'lower';
            caseToggleButton.textContent = 'Switch to Uppercase';
        } else {
            caseMode = 'upper';
            caseToggleButton.textContent = 'Switch to Lowercase';
        }
        updateCase();
    });

    // --- 1. Create all the letter blocks ---
    ALPHABET.forEach(letter => {
        const letterBox = document.createElement('div');
        letterBox.classList.add('letter-box');
        letterBox.textContent = (caseMode === 'upper') ? letter : letter.toLowerCase();
        letterBox.dataset.letter = letter;
        letterBox.dataset.letterUpper = letter;
        letterBox.dataset.letterLower = letter.toLowerCase();
        container.appendChild(letterBox);
    });

    // --- 2. Create the function that handles the interaction ---
    // --- REMOVED: async and await from here ---
    function handleInteraction(targetElement) {
        // Check if it's a letter box
        if (!targetElement.classList.contains('letter-box')) return;

        // Route logic based on game mode
        if (currentGameMode === 'level1') {
            handleLevel1Click(targetElement);
        } else if (currentGameMode === 'level2') {
            handleLevel2Click(targetElement);
        }
    }
    
    /**
     * Creates a DOM-based starburst effect on a target element.
     * @param {HTMLElement} targetElement - The element to burst from.
     */
    function playDomStarEffect(targetElement) {
        const numStars = 10; 
        const container = document.body; 

        const rect = targetElement.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.classList.add('star-particle');
            star.style.backgroundColor = `hsl(${Math.random() * 360}, 90%, 70%)`;
            container.appendChild(star);
            star.style.left = `${startX}px`;
            star.style.top = `${startY}px`;
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 80 + 50; 
            const destX = Math.cos(angle) * distance;
            const destY = Math.sin(angle) * distance;
            star.style.setProperty('--dest-x', `${destX}px`);
            star.style.setProperty('--dest-y', `${destY}px`);
            star.style.animation = `starburst 0.8s ease-out forwards`;
            setTimeout(() => {
                star.remove();
            }, 800);
        }
    }

    function handleLevel1Click(targetElement) {
        if (!targetElement.dataset.hasVisited) {
            const letter = targetElement.dataset.letter;
            const randomBgColor = getRandomBrightColor();
            targetElement.style.backgroundColor = randomBgColor;
            targetElement.style.color = 'white';
            targetElement.style.borderColor = randomBgColor;
            targetElement.style.transform = 'scale(1.05)';
            targetElement.dataset.hasVisited = 'true';
            speakLetter(letter);
        }
    }

    function handleLevel2Click(targetElement) {
        if (targetElement.classList.contains('found') || targetElement.classList.contains('wrong')) {
            return;
        }

        const clickedLetter = targetElement.dataset.letter;

        if (clickedLetter === currentTargetLetter) {
            playSound(goodSound); 
            playDomStarEffect(targetElement);
            const randomBgColor = getRandomBrightColor();
            targetElement.style.backgroundColor = randomBgColor;
            targetElement.style.color = 'white';
            targetElement.style.borderColor = randomBgColor;
            targetElement.classList.add('found'); 
            lettersToFind = lettersToFind.filter(l => l !== currentTargetLetter);

            if (lettersToFind.length === 0) {
                finishLevel2();
            } else {
                const foundLetter = currentTargetLetter; 
                currentTargetLetter = lettersToFind[Math.floor(Math.random() * lettersToFind.length)];
                alphabetPrompt.textContent = `Find the letter: ${currentTargetLetter}`;
                const speechFiles = [
                    'you-found.mp3',
                    `${foundLetter.toLowerCase()}.mp3`,
                    'now-find-the-letter.mp3',
                    `${currentTargetLetter.toLowerCase()}.mp3`
                ];
                speakText(speechFiles);
            }
            } else {
            playSound(badSound); 
            targetElement.classList.add('wrong');
            setTimeout(() => {
                targetElement.classList.remove('wrong');
            }, 500);
        }
    }


    // --- 3. Create the function that speaks ---
    function speakLetter(letter) {
        const nameSound = `${letter.toLowerCase()}.mp3`;   
        const exampleWordFilename = `${EXAMPLE_WORDS[letter].toLowerCase()}.mp3`; 

        if (speechMode === 'letterAndWord') {
            speakText([nameSound, exampleWordFilename]);
        } else {
            speakText(nameSound);
        }
    }

    // --- 4. Create the function to update letter case ---
    function updateCase() {
        const allBoxes = document.querySelectorAll('.letter-box');
        allBoxes.forEach(box => {
            if (caseMode === 'upper') {
                box.textContent = box.dataset.letterUpper;
            } else {
                box.textContent = box.dataset.letterLower;
            }
        });
    }

    // --- 5. Set up all the event listeners ---

    // --- MODIFIED: Added async and await unlockAudio() ---
    container.addEventListener('click', async (event) => {
        await unlockAudio();
        handleInteraction(event.target);
    });

    // --- MODIFIED: Added async and await unlockAudio() ---
    container.addEventListener('touchmove', async (event) => {
        if (currentGameMode !== 'level1') return;
        await unlockAudio(); // Unlock on first drag
        const touch = event.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element) {
            handleInteraction(element);
        }
    });

    // --- MODIFIED: Added async and await unlockAudio() ---
    container.addEventListener('mouseover', async (event) => {
        if (currentGameMode !== 'level1') return;
        if (event.buttons === 1) {
            await unlockAudio(); // Unlock on first mouse drag
            handleInteraction(event.target);
        }
    });

    // --- 6. Make the level buttons work ---

    // --- MODIFIED: Added async and await unlockAudio() ---
    level1Button.addEventListener('click', async () => {
        await unlockAudio();
        startLevel1();
    });

    // --- MODIFIED: Added async and await unlockAudio() ---
    level2Button.addEventListener('click', async () => {
        await unlockAudio();
        startLevel2();
    });


    // --- Functions to start/reset levels ---
    function clearAllBoxes() {
        const allBoxes = document.querySelectorAll('.letter-box');
        allBoxes.forEach(box => {
            box.style.backgroundColor = '';
            box.style.color = '';
            box.style.borderColor = '';
            box.style.transform = '';
            delete box.dataset.hasVisited;
            box.classList.remove('found', 'wrong');
        });
    }

    function startLevel1() {
        currentGameMode = 'level1';
        bodyElement.classList.remove('level-2-active');
        clearAllBoxes();
        caseMode = 'upper';
        caseToggleButton.textContent = 'Switch to Lowercase';
        updateCase(); 
    }

    function startLevel2() {
        currentGameMode = 'level2';
        bodyElement.classList.add('level-2-active'); 
        clearAllBoxes();
        lettersToFind = [...ALPHABET];
        pickNewTargetLetter();
    }

    function pickNewTargetLetter() {
        if (lettersToFind.length === 0) {
            finishLevel2();
            return;
        }
        currentTargetLetter = lettersToFind[Math.floor(Math.random() * lettersToFind.length)];
        alphabetPrompt.textContent = `Find the letter: ${currentTargetLetter}`;
        speakText(['okay-find-the-letter.mp3', `${currentTargetLetter.toLowerCase()}.mp3`]);
    }

    function finishLevel2() {
        alphabetPrompt.textContent = "You found them all!";
        speakText("you-found-them-all.mp3", () => {
            setTimeout(startLevel2, 2000);
        });
    }

    // --- Preload static audio files ---
    const staticAudioFiles = [
        'you-found.mp3', 'now-find-the-letter.mp3', 
        'okay-find-the-letter.mp3', 'you-found-them-all.mp3'
    ];
    const letterFiles = ALPHABET.map(l => `${l.toLowerCase()}.mp3`);
    const wordFiles = Object.values(EXAMPLE_WORDS).map(w => `${w.toLowerCase()}.mp3`);
    preloadAudio(staticAudioFiles.concat(letterFiles).concat(wordFiles));

});