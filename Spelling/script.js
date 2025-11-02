// --- 1. DEFINE THE WORDS ---
// This is where we store all our game data
const words = [
  {
    word: 'cat',
    image: 'images/cat.jpg'
  },
  {
    word: 'dog',
    image: 'images/dog.jpg'
  },
  {
    word: 'sun',
    image: 'images/sun.jpg'
  },
  {
    word: 'bed',
    image: 'images/bed.jpg'
  },
  {
    word: 'girl',
    image: 'images/girl.jpg'
  },
  {
    word: 'boy',
    image: 'images/boy.jpg'
  },
  {
    word: 'cow',
    image: 'images/cow.jpg'
  },
  {
    word: 'mouse',
    image: 'images/mouse.jpg'
  }
];

// (Optional) Load the sounds
 const goodSound = new Audio('sounds/correct.mp3');
 const badSound = new Audio('sounds/wrong.mp3');

// --- 2. GET ELEMENTS FROM THE PAGE ---
const wordImage = document.getElementById('word-image');
const wordBlanksContainer = document.getElementById('word-blanks');
const letterChoicesContainer = document.getElementById('letter-choices');
const nextWordButton = document.getElementById('next-word-button');

// --- 3. GAME STATE VARIABLES ---
let currentWordIndex = 0; // Which word we are on (starts with 'cat')
let lettersToSpell = [];  // The letters we still need to guess (e.g., ['c', 'a', 't'])

// --- 4. THE MAIN FUNCTION TO START A NEW WORD ---
function loadWord(wordIndex) {
  // Get the word data from our array
  const currentWordData = words[wordIndex];
  
  // 1. Set the image
  wordImage.src = currentWordData.image;
  
  // 2. Reset the game state for the new word
  // .split('') turns 'cat' into ['c', 'a', 't']
  lettersToSpell = currentWordData.word.split(''); 
  
  // 3. Clear out old blanks and buttons
  wordBlanksContainer.innerHTML = '';
  letterChoicesContainer.innerHTML = '';
  nextWordButton.classList.add('hidden'); // Hide the "Next" button

  // 4. Create the new blanks
  for (let i = 0; i < lettersToSpell.length; i++) {
    const blank = document.createElement('div');
    blank.classList.add('blank');
    wordBlanksContainer.appendChild(blank);
  }

  // 5. Create the new letter buttons (shuffled)
  const shuffledLetters = shuffleArray([...lettersToSpell]);
  
  shuffledLetters.forEach(letter => {
    const button = document.createElement('button');
    button.classList.add('letter-button');
    button.textContent = letter.toUpperCase();
    button.dataset.letter = letter; // Store the letter data
    button.addEventListener('click', handleLetterClick);
    letterChoicesContainer.appendChild(button);
  });
}

// --- 5. HANDLE THE USER'S CLICK ---
function handleLetterClick(event) {
  const clickedButton = event.target;
  const clickedLetter = clickedButton.dataset.letter;
  
  // Get the letter they *should* be clicking
  const expectedLetter = lettersToSpell[0]; 
  
  if (clickedLetter === expectedLetter) {
    // CORRECT!
    
    // --- FIX IS HERE ---
    goodSound.currentTime = 0; // Rewind to the start
    goodSound.play();
    
    // 1. Find the first empty blank and fill it
    const firstEmptyBlank = document.querySelector('.blank:empty');
    if (firstEmptyBlank) {
      firstEmptyBlank.textContent = clickedLetter.toUpperCase();
    }
    
    // 2. Hide the button they clicked
    clickedButton.style.visibility = 'hidden';
    
    // 3. Remove the letter from our "to spell" list
    lettersToSpell.shift();
    
    // 4. Check if the word is finished
    if (lettersToSpell.length === 0) {
      // YOU WIN!
      nextWordButton.classList.remove('hidden'); // Show "Next" button
    }
    
  } else {
    // WRONG!

    // --- FIX IS HERE ---
    badSound.currentTime = 0; // Rewind to the start
    badSound.play();
    
    wordImage.classList.add('shake');
    // Remove the class after the animation finishes
    setTimeout(() => {
      wordImage.classList.remove('shake');
    }, 500);

  }
}
// --- 6. "NEXT WORD" BUTTON ---
nextWordButton.addEventListener('click', () => {
  currentWordIndex++; // Move to the next word
  
  // If we've finished all words, loop back to the start
  if (currentWordIndex >= words.length) {
    currentWordIndex = 0;
  }
  
  loadWord(currentWordIndex);
});

// --- 7. HELPER FUNCTION TO SHUFFLE THE LETTERS ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- 8. START THE GAME ---
loadWord(currentWordIndex);