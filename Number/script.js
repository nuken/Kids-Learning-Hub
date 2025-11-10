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


// Wait for the page to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

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
        screens.forEach(screen => screen.classList.remove('visible'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('visible');

            // Initialize game *after* screen is visible
            if (screenId === 'counting-game') startCountingGame();
            if (screenId === 'tracing-game') initTracingGame();
            if (screenId === 'patterns-game') startPatternsGame();
            if (screenId === 'egg-dition-game') startEggDitionGame();
        }
    }

    // --- MODIFIED: Added async and await unlockAudio() ---
    // Add click listeners to main menu buttons
    for (const btnId in gameButtons) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', async () => {
                await unlockAudio(); // Unlock on game selection
                showScreen(gameButtons[btnId]);
            });
        }
    }

    // --- MODIFIED: Added async and await unlockAudio() ---
    // Add click listeners to all "Back" buttons
    backButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            await unlockAudio(); // Unlock on going "Back"
            showScreen('main-menu');
        });
    });

    // ==========================================================
    // --- GAME 1: COUNTING GAME ---
    // ==========================================================
    const countingPrompt = document.getElementById('counting-prompt');
    const countingGrid = document.getElementById('counting-grid');
    let targetNumber = 0;
    let currentCount = 0;
    const items = ['🦆', '⭐️', '🍎', '🚗', '🎈', '🐶', '🍕'];

    function startCountingGame() {
        countingGrid.innerHTML = ''; 
        currentCount = 0;
        targetNumber = Math.floor(Math.random() * 9) + 1; 
        const currentItem = items[Math.floor(Math.random() * items.length)];
        countingPrompt.textContent = `Tap ${targetNumber} ${currentItem}`;
        speakText(['tap.mp3', `${targetNumber}.mp3`]);
        const totalItems = targetNumber + Math.floor(Math.random() * 4);
        for (let i = 0; i < totalItems; i++) {
            const itemEl = document.createElement('div');
            itemEl.classList.add('counting-item');
            itemEl.textContent = currentItem;
            itemEl.addEventListener('click', handleCountClick);
            countingGrid.appendChild(itemEl);
        }
    }

    // --- REMOVED: async and await from here ---
    function handleCountClick(e) {
        if (e.target.classList.contains('counted') || currentCount >= targetNumber) {
            return;
        }
        currentCount++;
        e.target.classList.add('counted');

        if (currentCount === targetNumber) {
            const speechFiles = [
                `${currentCount}.mp3`,
                'you-did-it.mp3',
                'you-tapped.mp3',
                `${targetNumber}.mp3`
            ];
            speakText(speechFiles, () => {
                startCountingGame();
            });
        } else {
            speakText(`${currentCount}.mp3`);
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
    let traceStartTime = 0;
    const MIN_TRACE_DURATION = 1000; 

    function initTracingGame() {
        if (konvaInitialized) {
            loadNumberToTrace(currentNumberToTrace);
            return;
        }

        traceStage = new Konva.Stage({
            container: 'tracing-container',
            width: traceContainer.clientWidth,
            height: traceContainer.clientHeight,
        });

        textLayer = new Konva.Layer();
        drawingLayer = new Konva.Layer();
        traceStage.add(textLayer, drawingLayer);
        loadNumberToTrace(currentNumberToTrace);

        // --- REMOVED: async and await from here ---
        traceStage.on('mousedown touchstart', (e) => {
            // Note: The unlock already happened when the user
            // clicked "Start Tracing Game"
            isTracing = true;
            traceStartTime = Date.now();
            const pos = traceStage.getPointerPosition();
            lastTraceLine = new Konva.Line({
                stroke: '#007bff',
                strokeWidth: 15,
                globalCompositeOperation: 'source-over',
                lineCap: 'round',
                lineJoin: 'round',
                points: [pos.x, pos.y, pos.x, pos.y],
            });
            drawingLayer.add(lastTraceLine);
        });

        traceStage.on('mouseup touchend', () => {
            isTracing = false;
            const traceDuration = Date.now() - traceStartTime;
            if (traceDuration > MIN_TRACE_DURATION) {
                playStarEffect();
            }
        });

        traceStage.on('mousemove touchmove', (e) => {
            if (!isTracing) return;
            e.evt.preventDefault();
            const pos = traceStage.getPointerPosition();
            const newPoints = lastTraceLine.points().concat([pos.x, pos.y]);
            lastTraceLine.points(newPoints);
            drawingLayer.batchDraw();
        });

        traceClearBtn.addEventListener('click', () => {
            drawingLayer.destroyChildren(); 
            drawingLayer.batchDraw();
        });

        traceNextBtn.addEventListener('click', () => {
            currentNumberToTrace++;
            if (currentNumberToTrace > 9) {
                currentNumberToTrace = 1; 
            }
            loadNumberToTrace(currentNumberToTrace);
        });

        konvaInitialized = true;
    }

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
                duration: 0.8 + Math.random() * 0.5, 
                easing: Konva.Easings.EaseOut,
                onFinish: () => {
                    star.destroy();
                }
            });
        }
    }

    function loadNumberToTrace(number) {
        textLayer.destroyChildren();
        drawingLayer.destroyChildren();
        const stageWidth = traceStage.width();
        const stageHeight = traceStage.height();
        const numberText = new Konva.Text({
            text: String(number),
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
        speakText(`${number}.mp3`);
    }

    new ResizeObserver(() => {
        if (!traceStage) return;
        const container = document.getElementById('tracing-container');
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            traceStage.width(container.clientWidth);
            traceStage.height(container.clientHeight);
            textLayer.destroyChildren();
            drawingLayer.destroyChildren();
            const stageWidth = traceStage.width();
            const stageHeight = traceStage.height();
            const numberText = new Konva.Text({
                text: String(currentNumberToTrace),
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
        }
    }).observe(traceContainer);


    // ==========================================================
    // --- GAME 3: PATTERNS GAME ---
    // ==========================================================
    const patternSequence = document.getElementById('pattern-sequence');
    const patternChoices = document.getElementById('pattern-choices');
    let currentPattern = {};

    function generateChoices(answer) {
        let choices = [answer];
        let choice1 = Math.random() > 0.5 ? answer + 1 : answer - 1;
        if (choice1 < 1) choice1 = answer + 1; 
        choices.push(choice1);
        let choice2 = Math.random() > 0.5 ? answer + 2 : answer - 2;
        if (choice2 < 1 || choice2 === choice1) {
             choice2 = answer + 2;
             if (choice2 === choice1) choice2 = answer + 3;
        }
        choices.push(choice2);
        return choices;
    }

    function generatePattern() {
        const patternType = Math.floor(Math.random() * 3); 
        let sequence, answer, choices;
        let start = Math.floor(Math.random() * 5) + 1; 
        switch (patternType) {
            case 0: 
                sequence = [start, start + 1, ''];
                answer = start + 2;
                break;
            case 1: 
                start = Math.floor(Math.random() * 4) + 1;
                sequence = [start, start + 2, ''];
                answer = start + 4;
                break;
            case 2: 
                sequence = [start, start, start + 1, start + 1, ''];
                answer = start + 2;
                break;
        }
        choices = generateChoices(answer);
        return { sequence, answer, choices };
    }


    function startPatternsGame() {
        patternSequence.innerHTML = '';
        patternChoices.innerHTML = '';
        currentPattern = generatePattern(); 

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

        currentPattern.choices.sort(() => Math.random() - 0.5); 
        currentPattern.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.classList.add('choice-btn');
            btn.textContent = choice;
            btn.dataset.value = choice;
            btn.addEventListener('click', handlePatternClick);
            patternChoices.appendChild(btn);
        });

        const speechFiles = ['what-comes-next.mp3'];
        const sequenceFiles = speakableSequence.map(item => {
            return (item === 'blank') ? 'blank.mp3' : `${item}.mp3`;
        });
        speakText(speechFiles.concat(sequenceFiles));
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
    
    // --- REMOVED: async and await from here ---
    function handlePatternClick(e) {
        const clickedValue = parseInt(e.target.dataset.value);
        patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = true);

        if (clickedValue === currentPattern.answer) {
            e.target.classList.add('correct');
            const speechFiles = ['thats-right.mp3', `${currentPattern.answer}.mp3`];
            speakText(speechFiles, () => {
                setTimeout(startPatternsGame, 500); 
            });
        } else {
            e.target.classList.add('incorrect');
            speakText('oops-try-again.mp3');
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
    const num1 = Math.floor(Math.random() * 4) + 1; 
    let num2 = Math.floor(Math.random() * 4) + 1; 
    let answer = num1 + num2;
    if (answer > 8) {
        num2 = 1; 
        answer = num1 + num2; // Recalculate answer
    }
    currentEggProblem = { num1, num2, answer };
    const color1 = eggColors[Math.floor(Math.random() * eggColors.length)];
    let color2 = eggColors[Math.floor(Math.random() * eggColors.length)];
    while (color1 === color2) {
        color2 = eggColors[Math.floor(Math.random() * eggColors.length)];
    }

    eggGroup1.innerHTML = '';
    eggGroup2.innerHTML = '';
    eggSolutionContainer.innerHTML = '';
    eggChoicesContainer.innerHTML = ''; 

    for (let i = 0; i < num1; i++) {
        eggGroup1.appendChild(createEgg(color1));
    }
    for (let i = 0; i < num2; i++) {
        eggGroup2.appendChild(createEgg(color2));
    }
    for (let i = 0; i < num1; i++) {
        eggSolutionContainer.appendChild(createEgg(color1));
    }
    // --- BUG FIX: This loop was starting at 'm2' ---
    for (let i = 0; i < num2; i++) {
        eggSolutionContainer.appendChild(createEgg(color2));
    }

    const choices = generateChoices(answer);
    choices.sort(() => Math.random() - 0.5); 
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.classList.add('choice-btn'); 
        btn.textContent = choice;
        btn.dataset.value = choice;
        btn.addEventListener('click', handleEggChoiceClick);
        eggChoicesContainer.appendChild(btn);
    });

    speakText(['what-is.mp3', `${num1}.mp3`, 'plus.mp3', `${num2}.mp3`]);
}

// --- REMOVED: async and await from here ---
function handleEggChoiceClick(e) {
    const clickedValue = parseInt(e.target.dataset.value);
    eggChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

    if (clickedValue === currentEggProblem.answer) {
        e.target.classList.add('correct');
        const speechFiles = [
            'thats-right.mp3',
            `${currentEggProblem.num1}.mp3`,
            'plus.mp3',
            `${currentEggProblem.num2}.mp3`,
            'equals.mp3',
            `${currentEggProblem.answer}.mp3`
        ];
        speakText(speechFiles, () => {
            setTimeout(generateEggProblem, 500); 
        });
    } else {
        e.target.classList.add('incorrect');
        speakText("oops-try-again.mp3");
        setTimeout(() => {
            e.target.classList.remove('incorrect');
            eggChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }, 1000);
    }
}

    // --- NEW: Preload static audio files ---
    const staticAudioFiles = [
        'tap.mp3', 'you-did-it.mp3', 'you-tapped.mp3',
        'what-comes-next.mp3', 'blank.mp3', 'thats-right.mp3', 'oops-try-again.mp3',
        'what-is.mp3', 'plus.mp3', 'equals.mp3'
    ];
    const numberFiles = ['1.mp3', '2.mp3', '3.mp3', '4.mp3', '5.mp3', '6.mp3', '7.mp3', '8.mp3', '9.mp3', '10.mp3'];
    preloadAudio(staticAudioFiles.concat(numberFiles));

});