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
        screens.forEach(screen => screen.classList.remove('visible'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('visible');
        }

        // Initialize the correct game (only once)
        if (screenId === 'spell-image-game') {
            initImageGame();
        } else if (screenId === 'spell-missing-game') { // NEW
            initMissingGame();
        } else if (screenId === 'spell-color-game') {
            initColorGame();
        }
    }

    for (const btnId in menuButtons) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => showScreen(menuButtons[btnId]));
        }
    }

    backButtons.forEach(btn => {
        btn.addEventListener('click', () => showScreen('main-menu'));
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

    function playSound(sound) {
        sound.currentTime = 0; // Rewind to start
        sound.play();
    }

    // RENAMED from generateColorChoices to be reusable
    function generateLetterChoices(correctLetter) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let choices = [correctLetter];

        // Add 2 random, incorrect letters
        while (choices.length < 3) {
            const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            // Ensure the letter is not already in the choices
            if (!choices.includes(randomLetter)) {
                choices.push(randomLetter);
            }
        }
        return shuffleArray(choices);
    }


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

    function initImageGame() {
        if (imageGameInitialized) return;
        nextWordButtonImage.addEventListener('click', loadNextImageWord);
        loadWord(currentImageWordIndex);
        imageGameInitialized = true;
    }

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

    function initMissingGame() {
        if (missingGameInitialized) return;
        nextWordButtonMissing.addEventListener('click', loadNextMissingWord);
        // Start with a random word
        currentMissingWordIndex = Math.floor(Math.random() * imageGameData.length);
        loadMissingWord(currentMissingWordIndex);
        missingGameInitialized = true;
    }

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

    function initColorGame() {
        if (colorGameInitialized) return;
        nextWordButtonColor.addEventListener('click', loadNextColorWord);
        loadColorWord(currentColorWordIndex);
        colorGameInitialized = true;
    }

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
