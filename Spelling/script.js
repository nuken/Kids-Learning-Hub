// --- MODIFICATION ---
// Wrapped entire file in an IIFE to create a private scope
(function() {
    let audioPrimed = false;
    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. NAVIGATION ---
        const screens = document.querySelectorAll('.game-screen');
        const menuButtons = {
            'start-image-game-btn': 'spell-image-game',
            'start-missing-game-btn': 'spell-missing-game', // NEW
            'start-color-game-btn': 'spell-color-game'
        };
        const backButtons = document.querySelectorAll('.back-btn');

        function showScreen(screenId) {
            // --- NEW: Prime audio on first user interaction ---
            primeAudioAndSpeech();

            screens.forEach(screen => screen.classList.remove('visible'));
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('visible');
            }

            // This ensures games are reset properly when viewed
            // --- NEW: Added speech for game titles ---
            if (screenId === 'spell-image-game') {
                if (window.speakText) window.speakText("Spell the word!");
                startGameImage();
            } else if (screenId === 'spell-missing-game') {
                if (window.speakText) window.speakText("Find the missing letter!");
                startGameMissing();
            } else if (screenId === 'spell-color-game') {
                if (window.speakText) window.speakText("Spell the color!");
                startGameColor();
            }
            // --- END NEW ---
        }

        for (const btnId in menuButtons) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => showScreen(menuButtons[btnId]));
            }
        }
backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // --- NEW: Stop any speech ---
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
                // --- END NEW ---
                showScreen('main-menu');
            });
        });

        // (Optional) Load the sounds
        const goodSound = new Audio('sounds/correct.mp3');
        const badSound = new Audio('sounds/wrong.mp3');

        // --- 2. HELPER FUNCTIONS ---
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        // --- MODIFICATION ---
        // Made function async and added error handling for .play()
        async function playSound(sound) {
            sound.currentTime = 0; // Rewind to start
            try {
                await sound.play();
            } catch (err) {
                // Log the error but don't crash the app
                console.error("Audio play failed:", err);
            }
        }
        // --- END MODIFICATION ---


        // --- NEW: Audio and Speech Priming Function ---
        function primeAudioAndSpeech() {
            if (audioPrimed) return; // Only run once

            // 1. "Wake up" the sound effects (for iOS)
            try {
                goodSound.play().catch(() => {});
                goodSound.pause();
                goodSound.currentTime = 0;

                badSound.play().catch(() => {});
                badSound.pause();
                badSound.currentTime = 0;
            } catch (err) {
                console.error("Audio priming failed:", err);
            }

            // 2. "Wake up" the speech engine (for iOS)
            if (window.unlockSpeechIfNeeded) {
                window.unlockSpeechIfNeeded();
            }
            
            // 3. "Wake up" the speech voice list
            if (window.loadVoices) {
                window.loadVoices(); 
            }
            
            audioPrimed = true;
        }
        // --- END NEW ---


        // --- 3. GAME 1: IMAGE SPELLING (Original Game Logic) ---

        // RENAMED from generateColorChoices to be reusable
        // --- MODIFICATION ---
        // Replaced with a Set-based implementation to prevent infinite loops
        function generateLetterChoices(correctLetter) {
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            // Use a Set to automatically handle uniqueness
            let choices = new Set();

            // Add the correct letter first
            choices.add(correctLetter);

            // Keep adding random letters until we have 3
            while (choices.size < 3) {
                const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
                // Set.add() will automatically do nothing if the letter is already present
                choices.add(randomLetter);
            }

            // Convert the Set back to an array and shuffle it
            return shuffleArray(Array.from(choices));
        }
        // --- END MODIFICATION ---


        // --- 3. GAME 1: IMAGE SPELLING (Original Game Logic) ---

        const imageGameData = [
          { word: 'cat', image: 'images/cat.jpg' },
          { word: 'dog', image: 'images/dog.jpg' },
          { word: 'sun', image: 'images/sun.jpg' },
          { word: 'bed', image: 'images/bed.jpg' },
          { word: 'girl', image: 'images/girl.jpg' },
          { word: 'boy', image: 'images/boy.jpg' },
          { word: 'cow', image: 'images/cow.jpg' },
          { word: 'mouse', image: 'images/mouse.jpg' }
        ];

        const wordImage = document.getElementById('word-image');
        const wordBlanksContainerImage = document.getElementById('word-blanks-image');
        const letterChoicesContainerImage = document.getElementById('letter-choices-image');
        const nextWordButtonImage = document.getElementById('next-word-button-image');

        let currentImageWordIndex = 0;
        let lettersToSpell = [];
        let imageGameInitialized = false;

        // --- MODIFICATION ---
        // Renamed from 'initImageGame' and refactored
        // to separate state reset from one-time init
        function startGameImage() {
            // This part runs every time to reset the game
            currentImageWordIndex = 0;
            loadWord(currentImageWordIndex);

            // This part runs only once
            if (imageGameInitialized) return;
            nextWordButtonImage.addEventListener('click', loadNextImageWord);
            imageGameInitialized = true;
        }
        // --- END MODIFICATION ---

        function loadNextImageWord() {
             currentImageWordIndex++;
            if (currentImageWordIndex >= imageGameData.length) {
                currentImageWordIndex = 0;
            }
            loadWord(currentImageWordIndex);
        }

        function loadWord(wordIndex) {
          const currentWordData = imageGameData[wordIndex];
          wordImage.src = currentWordData.image;
          
          // --- NEW: Speak the word ---
          if (window.speakText) {
            window.speakText(currentWordData.word);
          }
          // --- END NEW ---

          lettersToSpell = currentWordData.word.split('');

          wordBlanksContainerImage.innerHTML = '';
          letterChoicesContainerImage.innerHTML = '';
          nextWordButtonImage.classList.add('hidden');

          lettersToSpell.forEach(() => {
            const blank = document.createElement('div');
            blank.classList.add('blank');
            wordBlanksContainerImage.appendChild(blank);
          });

          const shuffledLetters = shuffleArray([...lettersToSpell]);

          shuffledLetters.forEach(letter => {
            const button = document.createElement('button');
            button.classList.add('letter-button');
            button.textContent = letter.toUpperCase();
            button.dataset.letter = letter;
            button.addEventListener('click', handleImageLetterClick);
            letterChoicesContainerImage.appendChild(button);
          });
        }

        function handleImageLetterClick(event) {
          const clickedButton = event.target;
          const clickedLetter = clickedButton.dataset.letter;
          const expectedLetter = lettersToSpell[0];

          if (clickedLetter === expectedLetter) {
            playSound(goodSound);
            const firstEmptyBlank = wordBlanksContainerImage.querySelector('.blank:empty');
            if (firstEmptyBlank) {
              firstEmptyBlank.textContent = clickedLetter.toUpperCase();
            }
            clickedButton.style.visibility = 'hidden';
            lettersToSpell.shift();

            if (lettersToSpell.length === 0) {
			  window.playConfettiEffect();
              nextWordButtonImage.classList.remove('hidden');
            }
          } else {
            playSound(badSound);
            wordImage.classList.add('shake');
            setTimeout(() => wordImage.classList.remove('shake'), 500);
          }
        }

        // --- 4. GAME 2: MISSING LETTER (NEW GAME) ---

        // Get elements for missing letter game
        const wordImageMissing = document.getElementById('word-image-missing');
        const wordBlanksContainerMissing = document.getElementById('word-blanks-missing');
        const letterChoicesContainerMissing = document.getElementById('letter-choices-missing');
        const nextWordButtonMissing = document.getElementById('next-word-button-missing');

        let currentMissingWordIndex = 0;
        let missingGameInitialized = false;
        let expectedMissingLetter = ''; // Store the correct letter for this round

        // --- MODIFICATION ---
        // Renamed from 'initMissingGame' and refactored
        // to separate state reset from one-time init
        function startGameMissing() {
            // This part runs every time to reset the game
            currentMissingWordIndex = Math.floor(Math.random() * imageGameData.length);
            loadMissingWord(currentMissingWordIndex);

            // This part runs only once
            if (missingGameInitialized) return;
            nextWordButtonMissing.addEventListener('click', loadNextMissingWord);
            missingGameInitialized = true;
        }
        // --- END MODIFICATION ---

        function loadNextMissingWord() {
            currentMissingWordIndex++;
            if (currentMissingWordIndex >= imageGameData.length) {
                currentMissingWordIndex = 0; // Loop back
            }
            loadMissingWord(currentMissingWordIndex);
        }

        function loadMissingWord(wordIndex) {
            const currentWordData = imageGameData[wordIndex];
            const word = currentWordData.word;
            
            // --- NEW: Speak the word ---
            if (window.speakText) {
                window.speakText(word);
            }
            // --- END NEW ---

            // 1. Pick a random letter to be the missing one
            const missingIndex = Math.floor(Math.random() * word.length);
            expectedMissingLetter = word[missingIndex]; // Store the correct answer

            // 2. Set the image
            wordImageMissing.src = currentWordData.image;

            // 3. Clear old blanks and buttons
            wordBlanksContainerMissing.innerHTML = '';
            letterChoicesContainerMissing.innerHTML = '';
            nextWordButtonMissing.classList.add('hidden');

            // 4. Create new blanks (some empty, some filled)
            for (let i = 0; i < word.length; i++) {
                const blank = document.createElement('div');
                if (i === missingIndex) {
                    blank.classList.add('blank'); // This one is empty
                } else {
                    blank.classList.add('blank', 'filled'); // Pre-fill this one
                    blank.textContent = word[i].toUpperCase();
                }
                wordBlanksContainerMissing.appendChild(blank);
            }

            // 5. Create 3 letter choices
            const choices = generateLetterChoices(expectedMissingLetter); // Use our helper
            choices.forEach(letter => {
                const button = document.createElement('button');
                button.classList.add('letter-button');
                button.textContent = letter.toUpperCase();
                button.dataset.letter = letter;
                button.disabled = false; // Ensure enabled
                button.addEventListener('click', handleMissingLetterClick);
                letterChoicesContainerMissing.appendChild(button);
            });
        }

        function handleMissingLetterClick(event) {
            const clickedButton = event.target;
            const clickedLetter = clickedButton.dataset.letter;

            // Disable all choice buttons
            letterChoicesContainerMissing.querySelectorAll('.letter-button').forEach(btn => btn.disabled = true);

            if (clickedLetter === expectedMissingLetter) {
                playSound(goodSound);

                // Fill the blank
                const firstEmptyBlank = wordBlanksContainerMissing.querySelector('.blank:empty');
                if (firstEmptyBlank) {
                    firstEmptyBlank.textContent = clickedLetter.toUpperCase();
                }

                // Show "Next" button
				window.playConfettiEffect();
                nextWordButtonMissing.classList.remove('hidden');

            } else {
                // WRONG!
                playSound(badSound);

                // Shake the image
                wordImageMissing.classList.add('shake');
                setTimeout(() => {
                    wordImageMissing.classList.remove('shake');
                    // Re-enable buttons so the user can try again
                    letterChoicesContainerMissing.querySelectorAll('.letter-button').forEach(btn => btn.disabled = false);
                }, 500);
            }
        }

        // --- 5. GAME 3: COLOR SPELLING (Original Logic, minor updates) ---

        const colorGameData = [
            { word: 'red', color: '#FF0000' },
            { word: 'blue', color: '#0000FF' },
            { word: 'green', color: '#008000' },
            { word: 'yellow', color: '#FFFF00' },
            { word: 'orange', color: '#FFA500' },
            { word: 'purple', color: '#800080' },
            { word: 'pink', color: '#FFC0CB' },
            { word: 'black', color: '#000000' },
            { word: 'white', color: '#FFFFFF' },
            { word: 'brown', color: '#A52A2A' }
        ];

        const colorBoxDisplay = document.getElementById('color-box-display');
        const wordBlanksContainerColor = document.getElementById('word-blanks-color');
        const letterChoicesContainerColor = document.getElementById('letter-choices-color');
        const nextWordButtonColor = document.getElementById('next-word-button-color');

        let currentColorWordIndex = 0;
        let colorGameInitialized = false;

        // --- MODIFICATION ---
        // Renamed from 'initColorGame' and refactored
        // to separate state reset from one-time init
        function startGameColor() {
            // This part runs every time to reset the game
            currentColorWordIndex = 0;
            loadColorWord(currentColorWordIndex);

            // This part runs only once
            if (colorGameInitialized) return;
            nextWordButtonColor.addEventListener('click', loadNextColorWord);
            colorGameInitialized = true;
        }
        // --- END MODIFICATION ---

        function loadNextColorWord() {
            currentColorWordIndex++;
            if (currentColorWordIndex >= colorGameData.length) {
                currentColorWordIndex = 0;
            }
            loadColorWord(currentColorWordIndex);
        }

        // No longer needed - we use the shared generateLetterChoices
        // function generateColorChoices(correctLetter) { ... }

        function loadColorWord(wordIndex) {
            const currentWordData = colorGameData[wordIndex];
            const word = currentWordData.word;
            const correctLetter = word[0];

            // --- NEW: Speak the color name ---
            if (window.speakText) {
                window.speakText(word);
            }
            // --- END NEW ---

            colorBoxDisplay.style.backgroundColor = currentWordData.color;
            if (word === 'white') {
                colorBoxDisplay.style.borderColor = '#999';
            } else {
                colorBoxDisplay.style.borderColor = '#ccc';
            }

            wordBlanksContainerColor.innerHTML = '';
            letterChoicesContainerColor.innerHTML = '';
            nextWordButtonColor.classList.add('hidden');

            const blank = document.createElement('div');
            blank.classList.add('blank');
            wordBlanksContainerColor.appendChild(blank);

            for (let i = 1; i < word.length; i++) {
                const filledBlank = document.createElement('div');
                filledBlank.classList.add('blank', 'filled');
                filledBlank.textContent = word[i].toUpperCase();
                wordBlanksContainerColor.appendChild(filledBlank);
            }

            // Use the refactored helper function
            const choices = generateLetterChoices(correctLetter);
            choices.forEach(letter => {
                const button = document.createElement('button');
                button.classList.add('letter-button');
                button.textContent = letter.toUpperCase();
                button.dataset.letter = letter;
                button.disabled = false;
                button.addEventListener('click', handleColorLetterClick);
                letterChoicesContainerColor.appendChild(button);
            });
        }

        function handleColorLetterClick(event) {
            const clickedButton = event.target;
            const clickedLetter = clickedButton.dataset.letter;
            const expectedLetter = colorGameData[currentColorWordIndex].word[0];

            letterChoicesContainerColor.querySelectorAll('.letter-button').forEach(btn => btn.disabled = true);

            if (clickedLetter === expectedLetter) {
                playSound(goodSound);

                const firstEmptyBlank = wordBlanksContainerColor.querySelector('.blank:empty');
                if (firstEmptyBlank) {
                    firstEmptyBlank.textContent = clickedLetter.toUpperCase();
                }
				
                window.playConfettiEffect();
                nextWordButtonColor.classList.remove('hidden');

            } else {
                playSound(badSound);

                colorBoxDisplay.classList.add('shake');
                setTimeout(() => {
                    colorBoxDisplay.classList.remove('shake');
                    letterChoicesContainerColor.querySelectorAll('.letter-button').forEach(btn => btn.disabled = false);
                }, 500);
            }
        }
    });

})(); // --- MODIFICATION --- End of IIFE
