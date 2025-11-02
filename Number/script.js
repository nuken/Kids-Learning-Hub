// Wait for the page to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements ---
    const screens = document.querySelectorAll('.game-screen');
    const mainMenu = document.getElementById('main-menu');
    const backButtons = document.querySelectorAll('.back-btn');

    // --- Main Navigation ---
    const gameButtons = {
        'start-counting-btn': 'counting-game',
        'start-tracing-btn': 'tracing-game',
        'start-patterns-btn': 'patterns-game'
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

// --- Speech Function (Adapted from alphabet-fun) ---
    function speakText(text, onEndCallback) {
        // Cancel any previous speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set desired language
        utterance.rate = 0.9;
        
        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }

        // Get available voices
        let voices = window.speechSynthesis.getVoices();
        
        if (voices.length > 0) {
            let selectedVoice = null;
            
            // --- OS-Specific Logic ---
            // This now checks for iOS devices OR Android
            const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
            // --- Mobile Logic (iOS & Android) ---
            // Use .startsWith('en-') to be more flexible and catch en-US, en-GB, etc.

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
                    // --- THIS IS THE CRITICAL FIX ---
                    // Must check for name AND language
                    selectedVoice = voiceList.find(v => v.name === name && v.lang.startsWith('en-'));
                    if (selectedVoice) break;
                }
            }

            // 4. Fallback for any en-US on mobile
            if (!selectedVoice) {
                // Find *any* English voice
                selectedVoice = voiceList.find(v => v.lang.startsWith('en-'));
            }
            
        } else {
            // --- PC/Other Logic (The original, working version) ---
            selectedVoice = voiceList.find(v => v.name.includes('Google') && v.lang.includes('en'));
            if (!selectedVoice) {
                selectedVoice = voiceList.find(v => v.lang.includes('en-US') || v.default);
            }
        }
            // --- End OS-Specific Logic ---
            
            // Assign the voice if we found one
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                if (selectedVoice.lang === 'en-GB') {
                    utterance.lang = 'en-GB';
                }
            }
        }
        
        window.speechSynthesis.speak(utterance);
    }
    // "Warm up" the speech API on first user interaction
    document.body.addEventListener('click', () => window.speechSynthesis.getVoices(), { once: true });

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
        });

        traceStage.on('mousemove touchmove', (e) => {
            if (!isTracing) return;
            e.evt.preventDefault();
            const pos = traceStage.getPointerPosition();
            const newPoints = lastTraceLine.points().concat([pos.x, pos.y]);
            lastTraceLine.points(newPoints);
            drawingLayer.batchDraw();
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
        });
        
        textLayer.add(numberText);
        
        // Redraw layers
        textLayer.batchDraw();
        drawingLayer.batchDraw();
        
        speakText(String(number));
    }
    
    // Handle resizing (important for tablets)
    new ResizeObserver(() => {
        if (!traceStage) return;
        const container = document.getElementById('tracing-container');
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            traceStage.width(container.clientWidth);
            traceStage.height(container.clientHeight);
            loadNumberToTrace(currentNumberToTrace);
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
        
        speakText('What comes next? ' + speakableSequence.join(', '));
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

});