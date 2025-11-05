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
     * The robust text-to-speech function.
     * @param {string} text - The text to speak.
     * @param {function} [onEndCallback] - Optional: A function to run when speech finishes.
     */
    function speakText(text, onEndCallback) {
        // Cancel any previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set desired language
        utterance.rate = 0.9;

        // Handle the optional callback
        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }

        // Check if voiceList is empty and try to load it synchronously
        if (voiceList.length === 0) {
            voiceList = window.speechSynthesis.getVoices();
        }

        // Use the pre-loaded voice list if available
        if (voiceList.length > 0) {

            let selectedVoice = null;

            // --- OS-Specific Logic ---
            const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // --- Mobile Logic (iOS & Android) ---
                // 1. Try iOS high-quality ("Samantha")
                selectedVoice = voiceList.find(v => v.name === 'Samantha' && v.lang.startsWith('en-'));

                // 2. Try Android high-quality ("Google")
                if (!selectedVoice) {
                    selectedVoice = voiceList.find(v => v.lang.startsWith('en-') && v.name.includes('Google'));
                }

                // 3. Fallback for other high-quality mobile (e.g., "Daniel")
                if (!selectedVoice) {
                    const preferredVoiceNames = ['Daniel', 'Alex', 'Allison'];
                    for (const name of preferredVoiceNames) {
                        selectedVoice = voiceList.find(v => v.name === name && v.lang.startsWith('en-'));
                        if (selectedVoice) break;
                    }
                }

                // 4. Fallback for any en- on mobile
                if (!selectedVoice) {
                    selectedVoice = voiceList.find(v => v.lang.startsWith('en-'));
                }

            } else {
                // --- PC/Other Logic ---
                selectedVoice = voiceList.find(v => v.name.includes('Google') && v.lang.includes('en'));
                if (!selectedVoice) {
                    selectedVoice = voiceList.find(v => v.lang.includes('en-US') || v.default);
                }
            }

            // Assign the voice if we found one
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                
                // --- THIS IS THE FIX FOR THE FRENCH VOICE ---
                // Always set the utterance's lang to match the found voice's lang.
                // This prevents iOS from ignoring the language and defaulting to French.
                utterance.lang = selectedVoice.lang;
                // --- END OF FIX ---
            }

            window.speechSynthesis.speak(utterance);

        } else {
            // Fallback: just speak
            window.speechSynthesis.speak(utterance);
        }
    }
// --- END: NEW SPEECH SYSTEM ---

    // Wait for the page to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        // --- ADD THIS LINE TO UNLOCK SPEECH ---
        if (window.unlockSpeechIfNeeded) {
            window.unlockSpeechIfNeeded();
        }
        // --- END OF ADDITION ---
        const container = document.getElementById('alphabet-container');
        const resetButton = document.getElementById('reset-button');
        const colorPalette = document.getElementById('color-palette');
        const bodyElement = document.body;

        const speechToggleButton = document.getElementById('speech-toggle-button');

        // --- MODIFICATION ---
        // Get the new button
        const caseToggleButton = document.getElementById('case-toggle-button');
        // --- END MODIFICATION ---

        // --- MODIFIED: State names and button text ---
        let speechMode = 'letter'; // Can be 'letter' or 'letterAndWord'
        speechToggleButton.textContent = 'Switch to Words'; // Set initial button text

        // --- MODIFICATION ---
        // Add state for letter case
        let caseMode = 'upper'; // Can be 'upper' or 'lower'
        // --- END MODIFICATION ---

        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
        alphabet.forEach(letter => {
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
            // Check if it's a letter box and hasn't been visited yet (using our new data-hasVisited flag)
            if (targetElement.classList.contains('letter-box') && !targetElement.dataset.hasVisited) {

                // --- MODIFICATION ---
                // We always use the 'letter' dataset (which is uppercase)
                // for speech and logic, regardless of what's displayed.
                const letter = targetElement.dataset.letter;
                // --- END MODIFICATION ---

                // Generate a random bright background color
                const randomBgColor = getRandomBrightColor();

                // Set the background color directly
                targetElement.style.backgroundColor = randomBgColor;

                // Set the text color to white for contrast
                targetElement.style.color = 'white';

                // Make the border match the background
                targetElement.style.borderColor = randomBgColor;

                // Apply the scale effect directly
                targetElement.style.transform = 'scale(1.05)';

                // Mark this letter as visited using a data attribute
                targetElement.dataset.hasVisited = 'true';

                // Speak the letter
                speakLetter(letter);
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
            // Find the element that is *currently* under the user's finger
            const touch = event.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);

            if (element) {
                handleInteraction(element);
            }
        });

        // This does the same for a mouse (for testing on your computer)
        container.addEventListener('mouseover', (event) => {
            // 'event.buttons === 1' means it only works if the mouse button is held down
            if (event.buttons === 1) {
                handleInteraction(event.target);
            }
        });

        // --- 5. Make the reset button work --- (Now #6)
        resetButton.addEventListener('click', () => {
            const allBoxes = document.querySelectorAll('.letter-box'); // Select ALL letter boxes
            allBoxes.forEach(box => {
                // Clear the inline styles and the 'hasVisited' flag
                box.style.backgroundColor = ''; // Reverts to default from CSS
                box.style.color = '';           // Reverts to default from CSS
                box.style.borderColor = '';     // Reverts to default from CSS
                box.style.transform = '';       // Reverts to default
                delete box.dataset.hasVisited;  // Remove the flag
            });

            // --- MODIFICATION ---
            // Also reset the case mode and button text
            caseMode = 'upper';
            caseToggleButton.textContent = 'Switch to Lowercase';
            updateCase(); // Update the letters back to uppercase
            // --- END MODIFICATION ---

            // Optional: announce "Reset"
            //speakText('Reset!');
        });

    });

})();
