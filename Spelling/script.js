(function() {
    let audioPrimed = false;

    // --- GLOBAL STATE ---
    let currentLevel = 1; // 1 or 2

    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. NAVIGATION & MENU ---
        const screens = document.querySelectorAll('.game-screen');
        const menuButtons = {
            'start-image-game-btn': 'spell-image-game',
            'start-missing-game-btn': 'spell-missing-game',
            'start-color-game-btn': 'spell-color-game',
            'start-reading-game-btn': 'read-match-game' // NEW
        };
        const backButtons = document.querySelectorAll('.back-btn');
        const levelBtn = document.getElementById('level-toggle-btn');

        // Level Toggle Logic
        levelBtn.addEventListener('click', () => {
            if (currentLevel === 1) {
                currentLevel = 2;
                levelBtn.textContent = "Level 2: Challenge";
                levelBtn.classList.add('level-2');
                window.speakText("Level Two");
            } else {
                currentLevel = 1;
                levelBtn.textContent = "Level 1: Easy";
                levelBtn.classList.remove('level-2');
                window.speakText("Level One");
            }
        });

        function showScreen(screenId) {
            primeAudioAndSpeech();
            screens.forEach(screen => screen.classList.remove('visible'));
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('visible');
            }

            if (screenId === 'spell-image-game') {
                if (window.speakText) window.speakText("Spell the word!");
                startGameImage();
            } else if (screenId === 'spell-missing-game') {
                if (window.speakText) window.speakText("Find the missing letter!");
                startGameMissing();
            } else if (screenId === 'spell-color-game') {
                if (window.speakText) window.speakText("Spell the color!");
                startGameColor();
            } else if (screenId === 'read-match-game') {
                if (window.speakText) window.speakText("Read and match!");
                startGameReading();
            }
        }

        for (const btnId in menuButtons) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => showScreen(menuButtons[btnId]));
            }
        }

        backButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                showScreen('main-menu');
            });
        });

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

        async function playSound(sound) {
            sound.currentTime = 0;
            try { await sound.play(); } catch (err) { console.error(err); }
        }

        function primeAudioAndSpeech() {
            if (audioPrimed) return;
            try { goodSound.load(); badSound.load(); } catch (err) {}
            if (window.unlockSpeechIfNeeded) window.unlockSpeechIfNeeded();
            if (window.loadVoices) window.loadVoices();
            audioPrimed = true;
        }

        // Generates 'count' unique random letters that are NOT in 'excludeString'
        function getDistractors(count, excludeString) {
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            const distractors = [];
            while (distractors.length < count) {
                const letter = alphabet[Math.floor(Math.random() * alphabet.length)];
                if (!excludeString.includes(letter) && !distractors.includes(letter)) {
                    distractors.push(letter);
                }
            }
            return distractors;
        }

        // --- 3. DATA ---
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

        // --- 4. GAME 1: IMAGE SPELLING ---
        const wordImage = document.getElementById('word-image');
        const wordBlanksContainerImage = document.getElementById('word-blanks-image');
        const letterChoicesContainerImage = document.getElementById('letter-choices-image');
        const nextWordButtonImage = document.getElementById('next-word-button-image');
        let currentImageWordIndex = 0;
        let lettersToSpell = [];
        let imageGameInitialized = false;

        function startGameImage() {
            currentImageWordIndex = 0;
            loadWord(currentImageWordIndex);
            if (imageGameInitialized) return;
            nextWordButtonImage.addEventListener('click', () => {
                currentImageWordIndex = (currentImageWordIndex + 1) % imageGameData.length;
                loadWord(currentImageWordIndex);
            });
            imageGameInitialized = true;
        }

        function loadWord(wordIndex) {
            const currentWordData = imageGameData[wordIndex];
            wordImage.src = currentWordData.image;
            if (window.speakText) window.speakText(currentWordData.word);

            lettersToSpell = currentWordData.word.split('');
            wordBlanksContainerImage.innerHTML = '';
            letterChoicesContainerImage.innerHTML = '';
            nextWordButtonImage.classList.add('hidden');

            // Create Blanks
            lettersToSpell.forEach(() => {
                const blank = document.createElement('div');
                blank.classList.add('blank');
                wordBlanksContainerImage.appendChild(blank);
            });

            // Create Choices
            let choices = [...lettersToSpell];

            // --- LEVEL 2 LOGIC: Add Distractors ---
            if (currentLevel === 2) {
                // Add 3 random wrong letters
                const distractors = getDistractors(3, currentWordData.word);
                choices = choices.concat(distractors);
            }

            const shuffledChoices = shuffleArray(choices);

            shuffledChoices.forEach(letter => {
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

                // In Level 1, we hide the used button.
                // In Level 2 (with distractors), we also hide it to avoid confusion.
                clickedButton.style.visibility = 'hidden';

                lettersToSpell.shift();

                if (lettersToSpell.length === 0) {
                    if(window.playConfettiEffect) window.playConfettiEffect();
                    nextWordButtonImage.classList.remove('hidden');
                }
            } else {
                playSound(badSound);
                wordImage.classList.add('shake');
                setTimeout(() => wordImage.classList.remove('shake'), 500);
            }
        }

        // --- 5. GAME 2: MISSING LETTER ---
        const wordImageMissing = document.getElementById('word-image-missing');
        const wordBlanksContainerMissing = document.getElementById('word-blanks-missing');
        const letterChoicesContainerMissing = document.getElementById('letter-choices-missing');
        const nextWordButtonMissing = document.getElementById('next-word-button-missing');
        let currentMissingWordIndex = 0;
        let missingGameInitialized = false;
        let expectedMissingLetter = '';

        function startGameMissing() {
            currentMissingWordIndex = Math.floor(Math.random() * imageGameData.length);
            loadMissingWord(currentMissingWordIndex);
            if (missingGameInitialized) return;
            nextWordButtonMissing.addEventListener('click', () => {
                currentMissingWordIndex = (currentMissingWordIndex + 1) % imageGameData.length;
                loadMissingWord(currentMissingWordIndex);
            });
            missingGameInitialized = true;
        }

        function loadMissingWord(wordIndex) {
            const currentWordData = imageGameData[wordIndex];
            const word = currentWordData.word;
            if (window.speakText) window.speakText(word);

            const missingIndex = Math.floor(Math.random() * word.length);
            expectedMissingLetter = word[missingIndex];

            wordImageMissing.src = currentWordData.image;
            wordBlanksContainerMissing.innerHTML = '';
            letterChoicesContainerMissing.innerHTML = '';
            nextWordButtonMissing.classList.add('hidden');

            for (let i = 0; i < word.length; i++) {
                const blank = document.createElement('div');
                if (i === missingIndex) {
                    blank.classList.add('blank');
                } else {
                    blank.classList.add('blank', 'filled');
                    blank.textContent = word[i].toUpperCase();
                }
                wordBlanksContainerMissing.appendChild(blank);
            }

            // --- LEVEL 2 LOGIC: More Choices ---
            // Level 1: 3 choices. Level 2: 5 choices.
            const numChoices = (currentLevel === 1) ? 3 : 5;

            let choiceSet = new Set();
            choiceSet.add(expectedMissingLetter);

            const distractors = getDistractors(numChoices - 1, expectedMissingLetter);
            distractors.forEach(d => choiceSet.add(d));

            const choices = shuffleArray(Array.from(choiceSet));

            choices.forEach(letter => {
                const button = document.createElement('button');
                button.classList.add('letter-button');
                button.textContent = letter.toUpperCase();
                button.dataset.letter = letter;
                button.addEventListener('click', handleMissingLetterClick);
                letterChoicesContainerMissing.appendChild(button);
            });
        }

        function handleMissingLetterClick(event) {
            const clickedButton = event.target;
            const clickedLetter = clickedButton.dataset.letter;
            letterChoicesContainerMissing.querySelectorAll('.letter-button').forEach(btn => btn.disabled = true);

            if (clickedLetter === expectedMissingLetter) {
                playSound(goodSound);
                const firstEmptyBlank = wordBlanksContainerMissing.querySelector('.blank:empty');
                if (firstEmptyBlank) firstEmptyBlank.textContent = clickedLetter.toUpperCase();
                if(window.playConfettiEffect) window.playConfettiEffect();
                nextWordButtonMissing.classList.remove('hidden');
            } else {
                playSound(badSound);
                wordImageMissing.classList.add('shake');
                setTimeout(() => {
                    wordImageMissing.classList.remove('shake');
                    letterChoicesContainerMissing.querySelectorAll('.letter-button').forEach(btn => btn.disabled = false);
                }, 500);
            }
        }

        // --- 6. GAME 3: SPELL COLOR (Simplified for consistency) ---
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

        function startGameColor() {
            currentColorWordIndex = 0;
            loadColorWord(currentColorWordIndex);
            if (colorGameInitialized) return;
            nextWordButtonColor.addEventListener('click', () => {
                currentColorWordIndex = (currentColorWordIndex + 1) % colorGameData.length;
                loadColorWord(currentColorWordIndex);
            });
            colorGameInitialized = true;
        }

        function loadColorWord(wordIndex) {
            const currentWordData = colorGameData[wordIndex];
            const word = currentWordData.word;
            const correctLetter = word[0];
            if (window.speakText) window.speakText(word);

            colorBoxDisplay.style.backgroundColor = currentWordData.color;
            colorBoxDisplay.style.borderColor = (word === 'white') ? '#999' : '#ccc';

            wordBlanksContainerColor.innerHTML = '';
            letterChoicesContainerColor.innerHTML = '';
            nextWordButtonColor.classList.add('hidden');

            const blank = document.createElement('div');
            blank.classList.add('blank'); // First letter missing
            wordBlanksContainerColor.appendChild(blank);

            for (let i = 1; i < word.length; i++) {
                const filledBlank = document.createElement('div');
                filledBlank.classList.add('blank', 'filled');
                filledBlank.textContent = word[i].toUpperCase();
                wordBlanksContainerColor.appendChild(filledBlank);
            }

            // --- LEVEL 2 LOGIC: More Choices ---
            const numChoices = (currentLevel === 1) ? 3 : 5;
            let choiceSet = new Set();
            choiceSet.add(correctLetter);
            const distractors = getDistractors(numChoices - 1, correctLetter);
            distractors.forEach(d => choiceSet.add(d));

            const choices = shuffleArray(Array.from(choiceSet));

            choices.forEach(letter => {
                const button = document.createElement('button');
                button.classList.add('letter-button');
                button.textContent = letter.toUpperCase();
                button.dataset.letter = letter;
                button.addEventListener('click', (e) => {
                    // Inline handler for color game (logic is same as Missing)
                    const btn = e.target;
                    letterChoicesContainerColor.querySelectorAll('.letter-button').forEach(b => b.disabled = true);
                    if (letter === correctLetter) {
                        playSound(goodSound);
                        const blnk = wordBlanksContainerColor.querySelector('.blank:empty');
                        if (blnk) blnk.textContent = letter.toUpperCase();
                        if(window.playConfettiEffect) window.playConfettiEffect();
                        nextWordButtonColor.classList.remove('hidden');
                    } else {
                        playSound(badSound);
                        colorBoxDisplay.classList.add('shake');
                        setTimeout(() => {
                            colorBoxDisplay.classList.remove('shake');
                            letterChoicesContainerColor.querySelectorAll('.letter-button').forEach(b => b.disabled = false);
                        }, 500);
                    }
                });
                letterChoicesContainerColor.appendChild(button);
            });
        }

        // --- 7. NEW GAME: READ & MATCH ---

        const readingData = [
            { image: 'images/cat.jpg', correct: 'The cat sits.', foils: ['The dog runs.', 'The sun is hot.'] },
            { image: 'images/dog.jpg', correct: 'The dog is happy.', foils: ['The cat is orange.', 'The cow says moo.'] },
            { image: 'images/sun.jpg', correct: 'The sun is hot.', foils: ['The bed is soft.', 'The boy is happy.'] },
            { image: 'images/bed.jpg', correct: 'It is time for bed.', foils: ['It is time to run.', 'The mouse eats.'] },
            { image: 'images/boy.jpg', correct: 'The boy waves.', foils: ['The girl smiles.', 'The cat runs.'] },
            { image: 'images/girl.jpg', correct: 'The girl smiles.', foils: ['The boy jumps.', 'The sun is blue.'] },
            { image: 'images/cow.jpg', correct: 'The cow has spots.', foils: ['The mouse is small.', 'The dog is red.'] },
            { image: 'images/mouse.jpg', correct: 'The mouse is small.', foils: ['The cow is big.', 'The cat is green.'] }
        ];

        const readingImage = document.getElementById('reading-image');
        const sentenceList = document.getElementById('sentence-list');
        const nextReadingButton = document.getElementById('next-reading-button');
        let readingIndex = 0;
        let readingGameInitialized = false;

        function startGameReading() {
            readingIndex = 0;
            loadReadingLevel(readingIndex);
            if (readingGameInitialized) return;
            nextReadingButton.addEventListener('click', () => {
                readingIndex = (readingIndex + 1) % readingData.length;
                loadReadingLevel(readingIndex);
            });
            readingGameInitialized = true;
        }

        function loadReadingLevel(index) {
            const data = readingData[index];
            readingImage.src = data.image;
            sentenceList.innerHTML = '';
            nextReadingButton.classList.add('hidden');

            // Combine and shuffle
            const allSentences = shuffleArray([data.correct, ...data.foils]);

            allSentences.forEach(sentence => {
                const strip = document.createElement('div');
                strip.className = 'sentence-strip';

                // Text area
                const textSpan = document.createElement('span');
                textSpan.className = 'sentence-text';
                textSpan.textContent = sentence;

                // Audio button
                const audioBtn = document.createElement('div');
                audioBtn.className = 'sentence-audio-btn';
                audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';

                // AUDIO CLICK
                audioBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Don't trigger the answer check
                    if (window.speakText) window.speakText(sentence);
                });

                // ANSWER CLICK
                strip.addEventListener('click', () => {
                    // Disable interaction if already solved
                    if (!nextReadingButton.classList.contains('hidden')) return;

                    if (sentence === data.correct) {
                        // Correct
                        strip.classList.add('correct');
                        playSound(goodSound);
                        if (window.speakText) window.speakText("That's right!");
                        if(window.playConfettiEffect) window.playConfettiEffect();
                        nextReadingButton.classList.remove('hidden');
                        // Disable others
                        document.querySelectorAll('.sentence-strip').forEach(s => s.style.pointerEvents = 'none');
                    } else {
                        // Wrong
                        strip.classList.add('wrong');
                        playSound(badSound);
                        setTimeout(() => strip.classList.remove('wrong'), 500);
                    }
                });

                strip.appendChild(textSpan);
                strip.appendChild(audioBtn);
                sentenceList.appendChild(strip);
            });
        }

    }); // End DOMContentLoaded
})();
