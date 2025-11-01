// Wait for the page to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Global Speech Function ---
    let voiceList = [];
    function loadVoices() {
        voiceList = window.speechSynthesis.getVoices();
    }
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // --- MODIFIED: initAudio() to "warm up" the speech engine ---
    let isAudioInitialized = false;
    function initAudio() {
        if (isAudioInitialized) return;
        isAudioInitialized = true;
        console.log("Audio system warm-up...");
        
        // This is the most reliable trick to "wake up" the speech engine
        // We make it speak a silent, empty string.
        const primer = new SpeechSynthesisUtterance('');
        primer.volume = 0;
        window.speechSynthesis.speak(primer);
    
        // Also try to load voices
        loadVoices();
    }
    // --- END: MODIFIED FUNCTION ---

    function speakText(text, onEndCallback) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }

        // --- MODIFIED: Better voice-finding logic ---
        if (voiceList.length === 0) {
            voiceList = window.speechSynthesis.getVoices();
        }

        if (voiceList.length > 0) {
            let selectedVoice = null;

            // 1. Try for Google voice (desktop)
            selectedVoice = voiceList.find(v => v.name.includes('Google') && v.lang.startsWith('en-US'));

            // 2. Try for "Samantha" (common iOS high-quality)
            if (!selectedVoice) {
                selectedVoice = voiceList.find(v => v.name === 'Samantha' && v.lang.startsWith('en-US'));
            }

            // 3. Try for any other explicit en-US voice
            if (!selectedVoice) {
                selectedVoice = voiceList.find(v => v.lang.startsWith('en-US'));
            }
            
            // 4. Fallback to default
            if (!selectedVoice) {
                selectedVoice = voiceList.find(v => v.default);
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        // --- END: MODIFIED LOGIC ---
        
        window.speechSynthesis.speak(utterance);
    }
    
    // Call initAudio() on the very first click
    document.body.addEventListener('click', initAudio, { once: true });

    
    // --- Global Screen Navigation ---
    const allScreens = document.querySelectorAll('.game-screen');
    
    function showScreen(screenId) {
        // Hide all screens
        allScreens.forEach(screen => screen.classList.remove('visible'));
        
        // Show the target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('visible');
        }

        // --- Initialize the specific game if it's being opened ---
        if (screenId === 'alphabet-screen' && !alphabetApp.isInitialized) {
            alphabetApp.init();
        }
        if (screenId === 'tracing-screen' && !numbersApp.isTracingInitialized) {
            numbersApp.initTracingGame();
        }
        if (screenId === 'counting-screen') {
            numbersApp.startCountingGame();
        }
        if (screenId === 'patterns-screen') {
            numbersApp.startPatternsGame();
        }
    }

    // Main Menu buttons
    document.querySelectorAll('#main-menu-screen .menu-btn[data-target]').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.target));
    });

    // Numbers Menu buttons
    document.querySelectorAll('#numbers-screen .menu-btn[data-target]').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.target));
    });
    
    // All "Home" buttons
    document.querySelectorAll('.home-btn').forEach(btn => {
        btn.addEventListener('click', () => showScreen('main-menu-screen'));
    });
    
    // All "Back" buttons (for Numbers Fun)
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.target));
    });


    // ==========================================================
    // --- APP 1: ALPHABET FUN ---
    // ==========================================================
    const alphabetApp = {
        isInitialized: false,
        speechMode: 'letter',
        EXAMPLE_WORDS: {
            'A': 'Apple', 'B': 'Boy', 'C': 'Cat', 'D': 'Dog', 'E': 'Egg',
            'F': 'Fish', 'G': 'Goat', 'H': 'Hat', 'I': 'Igloo', 'J': 'Jar',
            'K': 'Kite', 'L': 'Lion', 'M': 'Moon', 'N': 'Nest', 'O': 'Octopus',
            'P': 'Pig', 'Q': 'Queen', 'R': 'Ring', 'S': 'Sun', 'T': 'Turtle',
            'U': 'Umbrella', 'V': 'Volcano', 'W': 'Watch', 'X': 'X-ray',
            'Y': 'Yo-yo', 'Z': 'Zebra'
        },
        
        init() {
            console.log("Initializing Alphabet Fun...");
            this.container = document.getElementById('alphabet-container');
            this.resetButton = document.getElementById('reset-button');
            this.colorPalette = document.getElementById('color-palette');
            this.speechToggleButton = document.getElementById('speech-toggle-button');
            this.alphabetScreen = document.getElementById('alphabet-screen');

            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            alphabet.forEach(letter => {
                const letterBox = document.createElement('div');
                letterBox.classList.add('letter-box');
                letterBox.textContent = letter;
                letterBox.dataset.letter = letter;
                this.container.appendChild(letterBox);
            });

            this.colorPalette.addEventListener('click', this.handlePaletteClick.bind(this));
            this.speechToggleButton.addEventListener('click', this.toggleSpeech.bind(this));
            this.resetButton.addEventListener('click', this.reset.bind(this));
            
            this.container.addEventListener('click', e => this.handleInteraction(e.target));
            this.container.addEventListener('touchmove', e => {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element) this.handleInteraction(element);
            });
            this.container.addEventListener('mouseover', e => {
                if (e.buttons === 1) this.handleInteraction(e.target);
            });
            
            this.isInitialized = true;
        },
        
        handlePaletteClick(event) {
            if (event.target.classList.contains('color-swatch')) {
                this.alphabetScreen.style.backgroundColor = event.target.dataset.color;
            }
        },
        
        toggleSpeech() {
            if (this.speechMode === 'letter') {
                this.speechMode = 'letterAndWord';
                this.speechToggleButton.textContent = 'Switch to Letters';
            } else {
                this.speechMode = 'letter';
                this.speechToggleButton.textContent = 'Switch to Words';
            }
        },
        
        handleInteraction(targetElement) {
            if (targetElement.classList.contains('letter-box') && !targetElement.dataset.hasVisited) {
                const letter = targetElement.dataset.letter;
                
                // Generate a random bright color
                let r = Math.floor(Math.random() * 150) + 100;
                let g = Math.floor(Math.random() * 150) + 100;
                let b = Math.floor(Math.random() * 150) + 100;
                const toHex = (c) => `0${c.toString(16)}`.slice(-2);
                const randomBgColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                
                targetElement.style.backgroundColor = randomBgColor;
                targetElement.style.color = 'white';
                targetElement.style.borderColor = randomBgColor;
                targetElement.style.transform = 'scale(1.05)';
                targetElement.dataset.hasVisited = 'true';
                
                this.speakLetter(letter);
            }
        },
        
        speakLetter(letter) {
            const nameSound = letter.toLowerCase();
            const exampleWord = this.EXAMPLE_WORDS[letter];
            
            if (this.speechMode === 'letterAndWord') {
                speakText(nameSound, () => speakText(exampleWord));
            } else {
                speakText(nameSound);
            }
        },
        
        reset() {
            this.container.querySelectorAll('.letter-box').forEach(box => {
                box.style.backgroundColor = '';
                box.style.color = '';
                box.style.borderColor = '';
                box.style.transform = '';
                delete box.dataset.hasVisited;
            });
            speakText('Reset!');
        }
    };

    
    // ==========================================================
    // --- APP 2: NUMBERS FUN ---
    // ==========================================================
    const numbersApp = {
        // Counting Game
        countingPrompt: document.getElementById('counting-prompt'),
        countingGrid: document.getElementById('counting-grid'),
        targetNumber: 0,
        currentCount: 0,
        items: ['🦆', '⭐️', '🍎', '🚗', '🎈', '🐶', '🍕'],
        
        // Tracing Game
        isTracingInitialized: false,
        traceContainer: document.getElementById('tracing-container'),
        traceClearBtn: document.getElementById('trace-clear-btn'),
        traceNextBtn: document.getElementById('trace-next-btn'),
        traceStage: null,
        drawingLayer: null,
        textLayer: null,
        isTracing: false,
        lastTraceLine: null,
        currentNumberToTrace: 1,

        // Patterns Game
        patternSequence: document.getElementById('pattern-sequence'),
        patternChoices: document.getElementById('pattern-choices'),
        currentPattern: {},
        
        // --- COUNTING ---
        startCountingGame() {
            this.countingGrid.innerHTML = '';
            this.currentCount = 0;
            this.targetNumber = Math.floor(Math.random() * 9) + 1;
            const currentItem = this.items[Math.floor(Math.random() * this.items.length)];
            
            this.countingPrompt.textContent = `Tap ${this.targetNumber} ${currentItem}`;
            speakText(`Tap ${this.targetNumber}`);
            
            const totalItems = this.targetNumber + Math.floor(Math.random() * 4);
            for (let i = 0; i < totalItems; i++) {
                const itemEl = document.createElement('div');
                itemEl.classList.add('counting-item');
                itemEl.textContent = currentItem;
                itemEl.addEventListener('click', this.handleCountClick.bind(this));
                this.countingGrid.appendChild(itemEl);
            }
        },
        
        handleCountClick(e) {
            // Prevent clicking if already counted or game is over
            if (e.target.classList.contains('counted') || this.currentCount >= this.targetNumber) {
                return;
            }
            
            this.currentCount++;
            e.target.classList.add('counted');
            
            if (this.currentCount === this.targetNumber) {
                // Speak the final number, and on completion, say "You did it!"
                speakText(this.currentCount, () => {
                    speakText("You did it!");
                });
                // We need a longer delay to allow both speech parts to play
                setTimeout(this.startCountingGame.bind(this), 2500); 
            } else {
                // This is not the final number, so just speak it
                speakText(this.currentCount);
            }
        },

        // --- TRACING ---
        initTracingGame() {
            if (this.isTracingInitialized) {
                this.loadNumberToTrace(this.currentNumberToTrace);
                return;
            }
            console.log("Initializing Tracing Game...");
            this.traceStage = new Konva.Stage({
                container: 'tracing-container',
                width: this.traceContainer.clientWidth,
                height: this.traceContainer.clientHeight,
            });
            
            this.textLayer = new Konva.Layer();
            this.drawingLayer = new Konva.Layer();
            this.traceStage.add(this.textLayer, this.drawingLayer);
            
            this.loadNumberToTrace(this.currentNumberToTrace);
            
            this.traceStage.on('mousedown touchstart', (e) => {
                this.isTracing = true;
                const pos = this.traceStage.getPointerPosition();
                this.lastTraceLine = new Konva.Line({
                    stroke: '#007bff', strokeWidth: 15,
                    globalCompositeOperation: 'source-over',
                    lineCap: 'round', lineJoin: 'round',
                    points: [pos.x, pos.y, pos.x, pos.y],
                });
                this.drawingLayer.add(this.lastTraceLine);
            });
            this.traceStage.on('mouseup touchend', () => { this.isTracing = false; });
            this.traceStage.on('mousemove touchmove', (e) => {
                if (!this.isTracing) return;
                e.evt.preventDefault();
                const pos = this.traceStage.getPointerPosition();
                const newPoints = this.lastTraceLine.points().concat([pos.x, pos.y]);
                this.lastTraceLine.points(newPoints);
                this.drawingLayer.batchDraw();
            });
            
            this.traceClearBtn.addEventListener('click', () => {
                this.drawingLayer.destroyChildren();
                this.drawingLayer.batchDraw();
            });
            this.traceNextBtn.addEventListener('click', () => {
                this.currentNumberToTrace = (this.currentNumberToTrace % 9) + 1;
                this.loadNumberToTrace(this.currentNumberToTrace);
            });
            
            new ResizeObserver(this.onTraceResize.bind(this)).observe(this.traceContainer);
            this.isTracingInitialized = true;
        },
        loadNumberToTrace(number) {
            this.textLayer.destroyChildren();
            this.drawingLayer.destroyChildren();
            const stageWidth = this.traceStage.width();
            const stageHeight = this.traceStage.height();
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
            });
            this.textLayer.add(numberText);
            this.textLayer.batchDraw();
            this.drawingLayer.batchDraw();
            speakText(String(number));
        },
        onTraceResize() {
            if (!this.traceStage) return;
            if (this.traceContainer.clientWidth > 0 && this.traceContainer.clientHeight > 0) {
                this.traceStage.width(this.traceContainer.clientWidth);
                this.traceStage.height(this.traceContainer.clientHeight);
                this.loadNumberToTrace(this.currentNumberToTrace);
            }
        },

        // --- PATTERNS ---
        generateChoices(answer) {
            let choices = [answer];
            let choice1 = Math.random() > 0.5 ? answer + 1 : answer - 1;
            if (choice1 < 1) choice1 = answer + 1;
            choices.push(choice1);
            
            let choice2 = Math.random() > 0.5 ? answer + 2 : answer - 2;
            if (choice2 < 1 || choice2 === choice1) choice2 = answer + 2;
            if (choice2 === choice1) choice2 = answer + 3;
            choices.push(choice2);
            
            return choices;
        },
        generatePattern() {
            const patternType = Math.floor(Math.random() * 3);
            let sequence, answer, choices;
            let start = Math.floor(Math.random() * 5) + 1;
            
            switch (patternType) {
                case 0: // Add 1
                    sequence = [start, start + 1, '']; answer = start + 2; break;
                case 1: // Add 2
                    start = Math.floor(Math.random() * 4) + 1;
                    sequence = [start, start + 2, '']; answer = start + 4; break;
                case 2: // Repeat
                    sequence = [start, start, start + 1, start + 1, '']; answer = start + 2; break;
            }
            choices = this.generateChoices(answer);
            return { sequence, answer, choices };
        },
        startPatternsGame() {
            this.patternSequence.innerHTML = '';
            this.patternChoices.innerHTML = '';
            this.currentPattern = this.generatePattern();
            
            let speakableSequence = [];
            this.currentPattern.sequence.forEach(item => {
                const el = document.createElement('div');
                if (item === '') {
                    el.classList.add('blank');
                    speakableSequence.push('blank');
                } else {
                    el.classList.add('pattern-item');
                    el.textContent = item;
                    speakableSequence.push(item);
                }
                this.patternSequence.appendChild(el);
            });
            
            this.currentPattern.choices.sort(() => Math.random() - 0.5);
            this.currentPattern.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.classList.add('choice-btn');
                btn.textContent = choice;
                btn.dataset.value = choice;
                btn.addEventListener('click', this.handlePatternClick.bind(this));
                this.patternChoices.appendChild(btn);
            });
            speakText('What comes next? ' + speakableSequence.join(', '));
        },
        handlePatternClick(e) {
            const clickedValue = parseInt(e.target.dataset.value);
            this.patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = true);
            
            if (clickedValue === this.currentPattern.answer) {
                e.target.classList.add('correct');
                speakText(`That's right, ${this.currentPattern.answer}!`);
                setTimeout(this.startPatternsGame.bind(this), 1500);
            } else {
                e.target.classList.add('incorrect');
                speakText("Oops, try again!");
                setTimeout(() => {
                    e.target.classList.remove('incorrect');
                    this.patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 1000);
            }
        }
    };

});