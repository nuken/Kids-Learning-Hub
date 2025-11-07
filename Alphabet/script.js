(function() {

    // --- MODIFIED: Replaced PHONETIC_SOUNDS with EXAMPLE_WORDS ---
    // This list uses simple, common words for each letter.
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

    // --- START: NEW SPEECH SYSTEM (SAFARI-COMPATIBLE) ---

// Make voiceList global to persist across calls.
let voiceList = [];

/**
 * Populates the global voiceList. This function is designed to be
 * called multiple times if needed, as Safari can be slow to load voices.
 */
function loadVoices() {
    // If we've already loaded voices, don't do it again.
    if (voiceList.length > 0) {
        return;
    }
    voiceList = window.speechSynthesis.getVoices();
}

// Try to load voices immediately when the script runs.
loadVoices();

// Also, set up the event listener which is the "correct" way to do it.
// Safari may or may not fire this event reliably, which is why we also
// call loadVoices() manually.
window.speechSynthesis.onvoiceschanged = loadVoices;


/**
 * The robust, Safari-compatible text-to-speech function.
 * @param {string} text - The text to speak.
 * @param {function} [onEndCallback] - Optional: A function to run when speech finishes.
 */
function speakText(text, onEndCallback) {
    // Always cancel any previous speech to avoid overlaps.
    window.speechSynthesis.cancel();

    // If the voice list is still empty, make another attempt to load them.
    // This is a crucial step for Safari.
    if (voiceList.length === 0) {
        loadVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // A good rate for kids

    // Set the language as a fallback. This is the most important property
    // if a specific voice cannot be found or assigned.
    utterance.lang = 'en-US';

    if (onEndCallback) {
        utterance.onend = onEndCallback;
    }

    // Only try to select a specific voice if the list has been populated.
    if (voiceList.length > 0) {
        let selectedVoice = null;

        // --- Voice Selection Logic ---
        // 1. Try to find the high-quality "Samantha" voice, specific to Apple devices.
        selectedVoice = voiceList.find(v => v.name === 'Samantha' && v.lang === 'en-US');

        // 2. If not found, look for any voice that is the browser's default for US English.
        if (!selectedVoice) {
            selectedVoice = voiceList.find(v => v.lang === 'en-US' && v.default);
        }

        // 3. If still no voice, just grab the very first US English voice available.
        if (!selectedVoice) {
            selectedVoice = voiceList.find(v => v.lang === 'en-US');
        }

        // If we successfully found a voice, assign it to the utterance.
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            // **CRITICAL SAFARI FIX**: Re-set the lang property from the
            // voice object itself. This strongly tells Safari which synthesizer to use.
            utterance.lang = selectedVoice.lang;
        }
    }

    // Finally, speak. For Safari, this first call to speak() might be what
    // actually triggers the voice list to load for all subsequent calls.
    window.speechSynthesis.speak(utterance);
}

// --- END: NEW SPEECH SYSTEM ---

    // --- NEW: Sound playback function (from Spelling game) ---
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
        // --- ADD THIS LINE TO UNLOCK SPEECH ---
        if (window.unlockSpeechIfNeeded) {
            window.unlockSpeechIfNeeded();
        }
        // --- END OF ADDITION ---
        const container = document.getElementById('alphabet-container');

        // MODIFIED: Renamed reset button
        const level1Button = document.getElementById('level-1-button');

        const colorPalette = document.getElementById('color-palette');
        const bodyElement = document.body;
        const speechToggleButton = document.getElementById('speech-toggle-button');
        const caseToggleButton = document.getElementById('case-toggle-button');

        // --- NEW: Level 2 Elements ---
        const level2Button = document.getElementById('level-2-button');
        const alphabetPrompt = document.getElementById('alphabet-prompt');

        // --- Corrected path to sounds folder ---
        const goodSound = new Audio('sounds/correct.mp3');
        const badSound = new Audio('sounds/wrong.mp3');

        // --- NEW: Game State ---
        let currentGameMode = 'level1'; // 'level1' or 'level2'
        let currentTargetLetter = null; // For Level 2

        // --- NEW: List for "Sticker Book" mode ---
        let lettersToFind = [];

        // --- MODIFIED: State names and button text ---
        let speechMode = 'letter'; // Can be 'letter' or 'letterAndWord'
        speechToggleButton.textContent = 'Switch to Words'; // Set initial button text

        // --- MODIFICATION ---
        // Add state for letter case
        let caseMode = 'upper'; // Can be 'upper' or 'lower'
        // --- END MODIFICATION ---

        // ... your colorPalette listener ...
        colorPalette.addEventListener('click', (event) => {
            // Check that we actually clicked on a color swatch
            if (event.target.classList.contains('color-swatch')) {
                // Get the color from the 'data-color' attribute we set in the HTML
                const newColor = event.target.dataset.color;

                // Set the page's background color
                bodyElement.style.backgroundColor = newColor;
            }
        });

        // --- MODIFIED: Button logic to use new states and text ---
        speechToggleButton.addEventListener('click', () => {
            if (speechMode === 'letter') {
                speechMode = 'letterAndWord';
                speechToggleButton.textContent = 'Switch to Letters';
            } else {
                speechMode = 'letter';
                speechToggleButton.textContent = 'Switch to Words';
            }
        });

        // --- MODIFICATION ---
        // Add click listener for the new case toggle button
        caseToggleButton.addEventListener('click', () => {
            if (caseMode === 'upper') {
                caseMode = 'lower';
                caseToggleButton.textContent = 'Switch to Uppercase';
            } else {
                caseMode = 'upper';
                caseToggleButton.textContent = 'Switch to Lowercase';
            }
            updateCase(); // Call the function to update letters
        });
        // --- END MODIFICATION ---

        // --- 1. Create all the letter blocks ---
        ALPHABET.forEach(letter => {
            const letterBox = document.createElement('div');
            letterBox.classList.add('letter-box');

            // --- MODIFICATION ---
            // Set text based on initial caseMode
            letterBox.textContent = (caseMode === 'upper') ? letter : letter.toLowerCase();

            // Store the letter (uppercase) in the element for speech
            letterBox.dataset.letter = letter;

            // Store both cases for easy toggling
            letterBox.dataset.letterUpper = letter;
            letterBox.dataset.letterLower = letter.toLowerCase();
            // --- END MODIFICATION ---

            container.appendChild(letterBox);
        });

        // --- 2. Create the function that handles the interaction ---
        function handleInteraction(targetElement) {
            // Check if it's a letter box
            if (!targetElement.classList.contains('letter-box')) return;

            // --- NEW: Route logic based on game mode ---
            if (currentGameMode === 'level1') {
                handleLevel1Click(targetElement);
            } else if (currentGameMode === 'level2') {
                handleLevel2Click(targetElement);
            }
        }

        // --- NEW: Logic for Level 1 (Original Game) ---
        function handleLevel1Click(targetElement) {
            // hasn't been visited yet
            if (!targetElement.dataset.hasVisited) {
                const letter = targetElement.dataset.letter;

                // Generate a random bright background color
                const randomBgColor = getRandomBrightColor();
                targetElement.style.backgroundColor = randomBgColor;
                targetElement.style.color = 'white';
                targetElement.style.borderColor = randomBgColor;
                targetElement.style.transform = 'scale(1.05)';

                // Mark this letter as visited using a data attribute
                targetElement.dataset.hasVisited = 'true';

                // Speak the letter
                speakLetter(letter);
            }
        }

        // --- NEW: Logic for Level 2 (Sticker Book Mode) ---
        function handleLevel2Click(targetElement) {
            // Don't do anything if the box is already found or marked wrong
            if (targetElement.classList.contains('found') || targetElement.classList.contains('wrong')) {
                return;
            }

            const clickedLetter = targetElement.dataset.letter;

            if (clickedLetter === currentTargetLetter) {
                // CORRECT!
                playSound(goodSound);

                // 1. Fill it with a permanent random color
                const randomBgColor = getRandomBrightColor();
                targetElement.style.backgroundColor = randomBgColor;
                targetElement.style.color = 'white';
                targetElement.style.borderColor = randomBgColor;
                targetElement.classList.add('found'); // Mark as found

                // 2. Remove it from the list of letters to find
                lettersToFind = lettersToFind.filter(l => l !== currentTargetLetter);

                // 3. Speak feedback, then pick the next letter
                speakText(`You found ${currentTargetLetter}!`, () => {
                    // Check if the game is over
                    if (lettersToFind.length === 0) {
                        finishLevel2();
                    } else {
                        // Otherwise, pick the next letter
                        pickNewTargetLetter();
                    }
                });
            } else {
                // WRONG
                playSound(badSound);
                targetElement.classList.add('wrong');
                // Remove the 'wrong' class after the shake animation
                setTimeout(() => {
                    targetElement.classList.remove('wrong');
                }, 500);
            }
        }


        // --- 3. Create the function that speaks (--- MODIFIED ---) ---
        function speakLetter(letter) {
            // 1. Get the two different sounds
            //    'letter' is always uppercase ('A'), so this works correctly.
            const nameSound = letter.toLowerCase();           // e.g., "b" (spoken as "Bee")
            const exampleWord = EXAMPLE_WORDS[letter];        // e.g., "Boy"

            // 2. Check the speech mode
            if (speechMode === 'letterAndWord') {
                // If 'letterAndWord', speak the name, and use the callback to speak
                // the example word right after the first one finishes.
                speakText(nameSound, () => {
                    speakText(exampleWord);
                });
            } else {
                // Otherwise (speechMode === 'letter'), just speak the name.
                speakText(nameSound);
            }
        }

        // --- MODIFICATION ---
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
        // --- END MODIFICATION ---


        // --- 4. Set up all the event listeners --- (Now #5)

        // For a simple tap on a tablet or a click with a mouse
        container.addEventListener('click', (event) => {
            handleInteraction(event.target);
        });

        // This handles "running a finger over" the letters
        container.addEventListener('touchmove', (event) => {
            // --- NEW: Only run this interaction for level 1 ---
            if (currentGameMode !== 'level1') return;

            // Find the element that is *currently* under the user's finger
            const touch = event.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);

            if (element) {
                handleInteraction(element);
            }
        });

        // This does the same for a mouse (for testing on your computer)
        container.addEventListener('mouseover', (event) => {
            // --- NEW: Only run this interaction for level 1 ---
            if (currentGameMode !== 'level1') return;

            // 'event.buttons === 1' means it only works if the mouse button is held down
            if (event.buttons === 1) {
                handleInteraction(event.target);
            }
        });

        // --- 5. Make the level buttons work --- (Now #6)

        // MODIFIED: This is now the Level 1 button
        level1Button.addEventListener('click', startLevel1);

        // NEW: Add listener for Level 2
        level2Button.addEventListener('click', startLevel2);


        // --- NEW: Functions to start/reset levels ---

        function clearAllBoxes() {
            const allBoxes = document.querySelectorAll('.letter-box');
            allBoxes.forEach(box => {
                // Clear inline styles
                box.style.backgroundColor = '';
                box.style.color = '';
                box.style.borderColor = '';
                box.style.transform = '';
                // Clear state flags
                delete box.dataset.hasVisited;
                // Clear level 2 classes
                box.classList.remove('found', 'wrong');
            });
        }

        function startLevel1() {
            currentGameMode = 'level1';
            bodyElement.classList.remove('level-2-active'); // Use CSS to hide/show elements

            clearAllBoxes();

            // Also reset the case mode and button text
            caseMode = 'upper';
            caseToggleButton.textContent = 'Switch to Lowercase';
            updateCase(); // Update the letters back to uppercase
        }

        function startLevel2() {
            currentGameMode = 'level2';
            bodyElement.classList.add('level-2-active'); // Use CSS to hide/show elements

            // --- MODIFICATION ---
            // The two lines that forced uppercase have been REMOVED.
            // The game will now respect the current `caseMode`.
            // --- END OF MODIFICATION ---

            // Clear all styles and classes from all boxes
            clearAllBoxes();

            // Create a fresh list of all letters to find
            lettersToFind = [...ALPHABET];

            // Start the game by picking the first letter
            pickNewTargetLetter();
        }

        function pickNewTargetLetter() {
            // This shouldn't happen, but good to check
            if (lettersToFind.length === 0) {
                finishLevel2();
                return;
            }

            // Pick a new random letter *from the remaining list*
            currentTargetLetter = lettersToFind[Math.floor(Math.random() * lettersToFind.length)];

            // Update and speak the prompt
            alphabetPrompt.textContent = `Find the letter: ${currentTargetLetter}`;
            speakText(`Find ${currentTargetLetter}`);
        }

        function finishLevel2() {
            alphabetPrompt.textContent = "You found them all!";
            speakText("You found them all! Great job!", () => {
                // After 2 seconds, restart Level 2
                setTimeout(startLevel2, 2000);
            });
        }

        // --- END NEW FUNCTIONS ---

    });

})();
