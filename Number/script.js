// --- MODIFICATION ---
// Wrapped entire file in an IIFE to create a private scope
(function() {

    // Wait for the page to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        // --- ADD THIS LINE TO UNLOCK SPEECH ---
        if (window.unlockSpeechIfNeeded) {
            window.unlockSpeechIfNeeded();
        }
        // --- END OF ADDITION ---
        // --- Global Elements ---
        const screens = document.querySelectorAll('.game-screen');
        const mainMenu = document.getElementById('main-menu');
        const backButtons = document.querySelectorAll('.back-btn');

        // --- Main Navigation ---
        const gameButtons = {
            'start-counting-btn': 'counting-game',
            'start-tracing-btn': 'tracing-game',
            'start-patterns-btn': 'patterns-game',
            'start-egg-dition-btn': 'egg-dition-game'
        };

        // Function to switch screens
        function showScreen(screenId) {
            // Hide all screens
            screens.forEach(screen => screen.classList.remove('visible'));

            // Show the target screen
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('visible');

                // If we are showing a game, initialize it
                if (screenId === 'counting-game') startCountingGame();
                if (screenId === 'tracing-game') initTracingGame();
                if (screenId === 'patterns-game') startPatternsGame();
                if (screenId === 'egg-dition-game') startEggDitionGame();
            }
        }

        // Add click listeners to main menu buttons
        for (const btnId in gameButtons) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => showScreen(gameButtons[btnId]));
            }
        }

        // Add click listeners to all "Back" buttons
        backButtons.forEach(btn => {
            btn.addEventListener('click', () => showScreen('main-menu'));
        });

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

        // ==========================================================
        // --- GAME 1: COUNTING GAME ---
        // ==========================================================
        const countingPrompt = document.getElementById('counting-prompt');
        const countingGrid = document.getElementById('counting-grid');
        let targetNumber = 0;
        let currentCount = 0;
        const items = ['🦆', '⭐️', '🍎', '🚗', '🎈', '🐶', '🍕'];

        function startCountingGame() {
            countingGrid.innerHTML = ''; // Clear the grid
            currentCount = 0;
            targetNumber = Math.floor(Math.random() * 9) + 1; // 1 to 9

            // Pick a random emoji for this round
            const currentItem = items[Math.floor(Math.random() * items.length)];

            countingPrompt.textContent = `Tap ${targetNumber} ${currentItem}`;
            speakText(`Tap ${targetNumber}`);

            // Add a few extra items
            const totalItems = targetNumber + Math.floor(Math.random() * 4);

            for (let i = 0; i < totalItems; i++) {
                const itemEl = document.createElement('div');
                itemEl.classList.add('counting-item');
                itemEl.textContent = currentItem;
                itemEl.addEventListener('click', handleCountClick);
                countingGrid.appendChild(itemEl);
            }
        }

        function handleCountClick(e) {
            // Check if it's already counted or if we are done
            if (e.target.classList.contains('counted') || currentCount >= targetNumber) {
                return;
            }

            currentCount++;
            e.target.classList.add('counted');

            if (currentCount === targetNumber) {
                // This is the final number. Speak it, and THEN...
                speakText(currentCount, () => {
                    // ...as a callback, say "You did it!"
                    speakText("You did it!");
                    // And start the new game
                    setTimeout(startCountingGame, 1500);
                });
            } else {
                // This is not the final number, just speak it.
                speakText(currentCount);
            }
        }


        // ==========================================================
        // --- GAME 2: TRACING GAME ---
        // ==========================================================
        const traceContainer = document.getElementById('tracing-container');
        const traceClearBtn = document.getElementById('trace-clear-btn');
        const traceNextBtn = document.getElementById('trace-next-btn');

        let traceStage, drawingLayer, textLayer;
        let isTracing = false;
        let lastTraceLine;
        let currentNumberToTrace = 1;
        let konvaInitialized = false;

        // --- NEW: Simplified trace logic ---
        let traceStartTime = 0;
        const MIN_TRACE_DURATION = 1000; // 1 second
        // --- END NEW ---


        // This logic is adapted from your coloring-book/app.js
        function initTracingGame() {
            // Only initialize Konva once
            if (konvaInitialized) {
                loadNumberToTrace(currentNumberToTrace);
                return;
            }

            // 1. Setup Stage and Layers
            traceStage = new Konva.Stage({
                container: 'tracing-container',
                width: traceContainer.clientWidth,
                height: traceContainer.clientHeight,
            });

            textLayer = new Konva.Layer();
            drawingLayer = new Konva.Layer();
            traceStage.add(textLayer, drawingLayer);

            // 2. Load the first number
            loadNumberToTrace(currentNumberToTrace);

            // 3. Add Event Listeners (copied from coloring-book/app.js)
            traceStage.on('mousedown touchstart', (e) => {
                isTracing = true;
                // --- NEW: Record start time ---
                traceStartTime = Date.now();
                // --- END NEW ---
                const pos = traceStage.getPointerPosition();
                lastTraceLine = new Konva.Line({
                    stroke: '#007bff', // Blue color
                    strokeWidth: 15,   // Nice thick line
                    globalCompositeOperation: 'source-over',
                    lineCap: 'round',
                    lineJoin: 'round',
                    points: [pos.x, pos.y, pos.x, pos.y],
                });
                drawingLayer.add(lastTraceLine);
            });

            traceStage.on('mouseup touchend', () => {
                isTracing = false;
                // --- NEW: Check trace duration ---
                const traceDuration = Date.now() - traceStartTime;
                if (traceDuration > MIN_TRACE_DURATION) {
                    playStarEffect();
                }
                // --- END NEW ---
            });

            traceStage.on('mousemove touchmove', (e) => {
                if (!isTracing) return;
                e.evt.preventDefault();
                const pos = traceStage.getPointerPosition();
                const newPoints = lastTraceLine.points().concat([pos.x, pos.y]);
                lastTraceLine.points(newPoints);
                drawingLayer.batchDraw();

                // --- REMOVED: All checkpoint logic removed from here ---
            });

            // 4. Add button listeners
            traceClearBtn.addEventListener('click', () => {
                drawingLayer.destroyChildren(); // Clear drawings
                drawingLayer.batchDraw();
            });

            traceNextBtn.addEventListener('click', () => {
                currentNumberToTrace++;
                if (currentNumberToTrace > 9) {
                    currentNumberToTrace = 1; // Loop back to 1
                }
                loadNumberToTrace(currentNumberToTrace);
            });

            konvaInitialized = true;
        }

        // --- REMOVED: checkTrace() function is no longer needed ---

        // --- NEW: Function to play star effect (unchanged from before) ---
        function playStarEffect() {
            const stageWidth = traceStage.width();
            const stageHeight = traceStage.height();
            const numStars = 30;

            for (let i = 0; i < numStars; i++) {
                const star = new Konva.Star({
                    x: stageWidth / 2,
                    y: stageHeight / 2,
                    numPoints: 5,
                    innerRadius: 10,
                    outerRadius: 20,
                    fill: `hsl(${Math.random() * 360}, 90%, 70%)`,
                    opacity: 1,
                    scaleX: 0.5,
                    scaleY: 0.5,
                });
                drawingLayer.add(star);

                const angle = Math.random() * 2 * Math.PI;
                const distance = Math.random() * (stageWidth / 3) + (stageWidth / 4);
                const destX = (stageWidth / 2) + Math.cos(angle) * distance;
                const destY = (stageHeight / 2) + Math.sin(angle) * distance;

                star.to({
                    x: destX,
                    y: destY,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    opacity: 0,
                    duration: 0.8 + Math.random() * 0.5, // 0.8 to 1.3 seconds
                    easing: Konva.Easings.EaseOut,
                    onFinish: () => {
                        star.destroy();
                    }
                });
            }
        }
        // --- END NEW ---

        function loadNumberToTrace(number) {
            // Clear both layers
            textLayer.destroyChildren();
            drawingLayer.destroyChildren();

            // Get stage dimensions
            const stageWidth = traceStage.width();
            const stageHeight = traceStage.height();

            // Create the large, faint number text
            const numberText = new Konva.Text({
                text: String(number),
                fontSize: Math.min(stageWidth, stageHeight) * 0.8, // Make it huge
                fontFamily: 'Comic Neue, sans-serif',
                fontStyle: '700',
                fill: '#e0e0e0', // Light grey
                width: stageWidth,
                height: stageHeight,
                align: 'center',
                verticalAlign: 'middle',
                // --- NEW: Disable hit detection on the number itself ---
                listening: false,
                // --- END NEW ---
            });

            textLayer.add(numberText);

            // Redraw layers
            textLayer.batchDraw();
            drawingLayer.batchDraw();

            // --- This is now the ONLY place the number is spoken ---
            speakText(String(number));
        }

        // Handle resizing (important for tablets)
        new ResizeObserver(() => {
            if (!traceStage) return;
            const container = document.getElementById('tracing-container');
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                traceStage.width(container.clientWidth);
                traceStage.height(container.clientHeight);

                // --- FIX: Call loadNumberToTrace BUT DO NOT SPEAK ---
                // We just want to reload the number, not speak it again.
                // Easiest way: create a "silent" version of the load function

                // Clear both layers
                textLayer.destroyChildren();
                drawingLayer.destroyChildren();

                // Get stage dimensions
                const stageWidth = traceStage.width();
                const stageHeight = traceStage.height();

                // Create the large, faint number text
                const numberText = new Konva.Text({
                    text: String(currentNumberToTrace), // Use the *current* number
                    fontSize: Math.min(stageWidth, stageHeight) * 0.8,
                    fontFamily: 'Comic Neue, sans-serif',
                    fontStyle: '700',
                    fill: '#e0e0e0',
                    width: stageWidth,
                    height: stageHeight,
                    align: 'center',
                    verticalAlign: 'middle',
                    listening: false,
                });

                textLayer.add(numberText);
                textLayer.batchDraw();
                drawingLayer.batchDraw();
                // --- Notice: no speakText() call here! ---
            }
        }).observe(traceContainer);


        // ==========================================================
        // --- GAME 3: PATTERNS GAME (--- MODIFIED ---) ---
        // ==========================================================
        const patternSequence = document.getElementById('pattern-sequence');
        const patternChoices = document.getElementById('pattern-choices');
        let currentPattern = {};

        // --- REMOVED ---
        // The old hard-coded 'patterns' array has been removed.

        // --- NEW ---
        // Function to generate plausible, but wrong, choices
        function generateChoices(answer) {
            let choices = [answer];

            // Add a choice that is one off
            let choice1 = Math.random() > 0.5 ? answer + 1 : answer - 1;
            if (choice1 < 1) choice1 = answer + 1; // Ensure it's not 0 or negative
            choices.push(choice1);

            // Add a second choice
            let choice2 = Math.random() > 0.5 ? answer + 2 : answer - 2;
            if (choice2 < 1 || choice2 === choice1) {
                 choice2 = answer + 2;
                 // Ensure choice2 is not the same as choice1
                 if (choice2 === choice1) choice2 = answer + 3;
            }
            choices.push(choice2);

            return choices;
        }

        // --- NEW ---
        // Function to dynamically generate a new pattern
        function generatePattern() {
            const patternType = Math.floor(Math.random() * 3); // 3 types of patterns
            let sequence, answer, choices;
            let start = Math.floor(Math.random() * 5) + 1; // Start from 1-5

            switch (patternType) {
                case 0: // Add 1 (e.g., 1, 2, __)
                    sequence = [start, start + 1, ''];
                    answer = start + 2;
                    break;
                case 1: // Add 2 (e.g., 2, 4, __)
                    start = Math.floor(Math.random() * 4) + 1; // Start 1-4 to avoid big numbers
                    sequence = [start, start + 2, ''];
                    answer = start + 4;
                    break;
                case 2: // Repeat (e.g., 3, 3, 4, 4, __)
                    sequence = [start, start, start + 1, start + 1, ''];
                    answer = start + 2;
                    break;
            }

            choices = generateChoices(answer);
            return { sequence, answer, choices };
        }


        function startPatternsGame() {
            // Clear previous game
            patternSequence.innerHTML = '';
            patternChoices.innerHTML = '';

            // --- MODIFIED ---
            // Pick a random pattern from our hard-coded list
            currentPattern = generatePattern(); // We now call our new function

            // Display the sequence
            let speakableSequence = [];
            currentPattern.sequence.forEach(item => {
                const el = document.createElement('div');
                if (item === '') {
                    el.classList.add('blank');
                    speakableSequence.push('blank');
                } else {
                    el.classList.add('pattern-item');
                    el.textContent = item;
                    speakableSequence.push(item);
                }
                patternSequence.appendChild(el);
            });

            // Create choice buttons
            currentPattern.choices.sort(() => Math.random() - 0.5); // Shuffle choices
            currentPattern.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.classList.add('choice-btn');
                btn.textContent = choice;
                btn.dataset.value = choice;
                btn.addEventListener('click', handlePatternClick);
                patternChoices.appendChild(btn);
            });

            // Speak the first part
            speakText('What comes next?', () => {
                // After the first part ends, speak the sequence
                speakText(speakableSequence.join(', '));
            });
        }

        function handlePatternClick(e) {
            const clickedValue = parseInt(e.target.dataset.value);

            // Disable all buttons
            patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = true);

            if (clickedValue === currentPattern.answer) {
                e.target.classList.add('correct');
                speakText(`That's right, ${currentPattern.answer}!`);
                setTimeout(startPatternsGame, 1500); // New game
            } else {
                e.target.classList.add('incorrect');
                speakText("Oops, try again!");
                // Re-enable buttons after a moment
                setTimeout(() => {
                    e.target.classList.remove('incorrect');
                    patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 1000);
            }
        }
        // ==========================================================
// --- GAME 4: EGG-DITION GAME ---
// ==========================================================
const eggGroup1 = document.getElementById('egg-group-1');
const eggGroup2 = document.getElementById('egg-group-2');
const eggSolutionContainer = document.getElementById('egg-solution-container');
const eggChoicesContainer = document.getElementById('egg-choices');

let currentEggProblem = {};
const eggColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7D842', '#84DCC6', '#FFA07A'];

function startEggDitionGame() {
    generateEggProblem();
}

function createEgg(color) {
    const egg = document.createElement('div');
    egg.className = 'egg';
    egg.style.backgroundColor = color;
    return egg;
}

function generateEggProblem() {
    // Simple problems, sum less than 10
    const num1 = Math.floor(Math.random() * 4) + 1; // 1 to 4
    let num2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
    const answer = num1 + num2;

    // Ensure sum is not too high, e.g., max 8
    if (answer > 8) {
        num2 = 1; // Adjust if too high
    }

    currentEggProblem = { num1, num2, answer };

    // Pick two different colors
    const color1 = eggColors[Math.floor(Math.random() * eggColors.length)];
    let color2 = eggColors[Math.floor(Math.random() * eggColors.length)];
    while (color1 === color2) {
        color2 = eggColors[Math.floor(Math.random() * eggColors.length)];
    }

    // Clear previous problem
    eggGroup1.innerHTML = '';
    eggGroup2.innerHTML = '';
    eggSolutionContainer.innerHTML = '';
    eggChoicesContainer.innerHTML = '';

    // 1. Show the first group of eggs
    for (let i = 0; i < num1; i++) {
        eggGroup1.appendChild(createEgg(color1));
    }

    // 2. Show the second group of eggs
    for (let i = 0; i < num2; i++) {
        eggGroup2.appendChild(createEgg(color2));
    }

    // 3. Show the combined eggs
    for (let i = 0; i < num1; i++) {
        eggSolutionContainer.appendChild(createEgg(color1));
    }
    for (let i = 0; i < num2; i++) {
        eggSolutionContainer.appendChild(createEgg(color2));
    }

    // 4. Create choices (re-using logic from Patterns game)
    // We can reuse the generateChoices function from the patterns game
    const choices = generateChoices(answer);
    choices.sort(() => Math.random() - 0.5); // Shuffle

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.classList.add('choice-btn'); // Reuse pattern choice style
        btn.textContent = choice;
        btn.dataset.value = choice;
        btn.addEventListener('click', handleEggChoiceClick);
        eggChoicesContainer.appendChild(btn);
    });

    // 5. Use speakText
    speakText(`What is ${num1} plus ${num2}?`);
}

function handleEggChoiceClick(e) {
    const clickedValue = parseInt(e.target.dataset.value);

    // Disable all buttons
    eggChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

    if (clickedValue === currentEggProblem.answer) {
        e.target.classList.add('correct');

        // Use speakText with the callback
        speakText(`That's right! ${currentEggProblem.num1} plus ${currentEggProblem.num2} equals ${currentEggProblem.answer}.`, () => {
            // This function will ONLY run after the speech finishes.
            // I added a small extra delay so it doesn't feel too sudden.
            setTimeout(generateEggProblem, 500); // New problem
        });

    } else {
        e.target.classList.add('incorrect');
        speakText("Oops, try again!");
        // Re-enable buttons after a moment
        setTimeout(() => {
            e.target.classList.remove('incorrect');
            eggChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }, 1000);
    }
}

    });

})(); // --- MODIFICATION --- End of IIFE
