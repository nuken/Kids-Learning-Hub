(function() {

    document.addEventListener('DOMContentLoaded', () => {
        if (window.unlockSpeechIfNeeded) {
            window.unlockSpeechIfNeeded();
        }

        // --- GLOBAL STATE ---
        let currentLevel = 1; // 1 or 2

        const screens = document.querySelectorAll('.game-screen');
        const backButtons = document.querySelectorAll('.back-btn');
        const levelBtn = document.getElementById('level-toggle-btn');

        // --- Main Navigation ---
        const gameButtons = {
            'start-counting-btn': 'counting-game',
            'start-tracing-btn': 'tracing-game',
            'start-patterns-btn': 'patterns-game',
            'start-egg-dition-btn': 'egg-dition-game'
        };

        // --- Level Toggle Logic ---
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

            // --- NEW: Reset Games on Toggle ---

            // 1. Reset Tracing Number
            currentNumberToTrace = (currentLevel === 1) ? 1 : 10;

            // 2. If Tracing Game is open, reload it immediately
            if (document.getElementById('tracing-game').classList.contains('visible')) {
                loadNumberToTrace(currentNumberToTrace);
            }
            // 3. If Counting or Egg games are open, restart them
            if (document.getElementById('counting-game').classList.contains('visible')) startCountingGame();
            if (document.getElementById('egg-dition-game').classList.contains('visible')) startEggDitionGame();
             // Patterns resets itself on next click, which is fine
        });

        function showScreen(screenId) {
            screens.forEach(screen => screen.classList.remove('visible'));
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('visible');

                if (screenId === 'counting-game') startCountingGame();
                // For tracing, we ensure the number matches the level when entering
                if (screenId === 'tracing-game') {
                    // If we are in Level 1 but number is 10+, reset to 1
                    if (currentLevel === 1 && currentNumberToTrace > 9) currentNumberToTrace = 1;
                    // If we are in Level 2 but number is < 10, reset to 10
                    if (currentLevel === 2 && currentNumberToTrace < 10) currentNumberToTrace = 10;
                    initTracingGame();
                }
                if (screenId === 'patterns-game') startPatternsGame();
                if (screenId === 'egg-dition-game') startEggDitionGame();
            }
        }

        for (const btnId in gameButtons) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => showScreen(gameButtons[btnId]));
            }
        }

        backButtons.forEach(btn => {
            btn.addEventListener('click', () => showScreen('main-menu'));
        });


        // ==========================================================
        // --- GAME 1: COUNTING GAME ---
        // ==========================================================
        const countingPrompt = document.getElementById('counting-prompt');
        const countingGrid = document.getElementById('counting-grid');
        let targetNumber = 0;
        let currentCount = 0;
        const items = ['🦆', '⭐️', '🍎', '🚗', '🎈', '🐶', '🍕', '🐞', '🍪'];
        let correctCountsSession = 0;
        function startCountingGame() {
            countingGrid.innerHTML = '';
            currentCount = 0;

            // --- LEVEL LOGIC ---
            if (currentLevel === 1) {
                targetNumber = Math.floor(Math.random() * 9) + 1; // 1 to 9
            } else {
                // Level 2: 10 to 15
                targetNumber = Math.floor(Math.random() * 6) + 10;
            }

            const currentItem = items[Math.floor(Math.random() * items.length)];

            countingPrompt.textContent = `Tap ${targetNumber} ${currentItem}`;
            window.speakText(`Tap ${targetNumber}`);

            // Add exact number of items for Level 2 to avoid clutter,
            // or just a few extras for Level 1
            const totalItems = (currentLevel === 1)
                ? targetNumber + Math.floor(Math.random() * 3)
                : targetNumber; // Exact count for higher numbers to fit screen

            for (let i = 0; i < totalItems; i++) {
                const itemEl = document.createElement('div');
                itemEl.classList.add('counting-item');
                itemEl.textContent = currentItem;
                itemEl.addEventListener('click', handleCountClick);
                countingGrid.appendChild(itemEl);
            }
        }

        function handleCountClick(e) {
            if (e.target.classList.contains('counted') || currentCount >= targetNumber) {
                return;
            }

            currentCount++;
            e.target.classList.add('counted');

            if (currentCount === targetNumber) {
                if(window.playBurstEffect) window.playBurstEffect(e.target);
                correctCountsSession++;
    if (correctCountsSession >= 3) {
        window.StickerManager.awardSticker('number_ninja');
    }
                window.speakText(currentCount, () => {
                    window.speakText("You did it!");
                    setTimeout(startCountingGame, 1500);
                });
            } else {
                window.speakText(currentCount);
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
        const MIN_TRACE_DURATION = 500;

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

            traceStage.on('mousedown touchstart', (e) => {
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

                // --- LEVEL LOGIC for Next Button ---
                if (currentLevel === 1) {
                    if (currentNumberToTrace > 9) currentNumberToTrace = 1;
                } else {
                    // Level 2: 10 to 19
                    if (currentNumberToTrace > 19) currentNumberToTrace = 10;
                }

                loadNumberToTrace(currentNumberToTrace);
            });

            konvaInitialized = true;
        }

        function playStarEffect() {
            const stageWidth = traceStage.width();
            const stageHeight = traceStage.height();
            const numStars = 15;

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
                const distance = Math.random() * (stageWidth / 4) + 50;
                const destX = (stageWidth / 2) + Math.cos(angle) * distance;
                const destY = (stageHeight / 2) + Math.sin(angle) * distance;

                star.to({
                    x: destX,
                    y: destY,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    opacity: 0,
                    duration: 0.8,
                    onFinish: () => star.destroy()
                });
            }
        }

        function loadNumberToTrace(number) {
            textLayer.destroyChildren();
            drawingLayer.destroyChildren();
            const stageWidth = traceStage.width();
            const stageHeight = traceStage.height();

            // --- SMART FONT SIZING ---
            // If number is >= 10, we need a smaller font to fit two digits
            const isTwoDigits = number >= 10;
            const fontMultiplier = isTwoDigits ? 0.5 : 0.8;

            const numberText = new Konva.Text({
                text: String(number),
                fontSize: Math.min(stageWidth, stageHeight) * fontMultiplier,
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
            window.speakText(String(number));
        }

        // Resize observer for Tracing Game
        new ResizeObserver(() => {
             if (!traceStage) return;
             const container = document.getElementById('tracing-container');
             if (container.clientWidth > 0) {
                 traceStage.width(container.clientWidth);
                 traceStage.height(container.clientHeight);
                 loadNumberToTrace(currentNumberToTrace); // Reloads visual but speaks again
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

            // Level 1: Start 1-5. Level 2: Start 5-15.
            const maxStart = (currentLevel === 1) ? 5 : 15;
            let start = Math.floor(Math.random() * maxStart) + 1;

            switch (patternType) {
                case 0: // Add 1
                    sequence = [start, start + 1, ''];
                    answer = start + 2;
                    break;
                case 1: // Add 2
                    sequence = [start, start + 2, ''];
                    answer = start + 4;
                    break;
                case 2: // Repeat (A A B B)
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

            currentPattern.sequence.forEach(item => {
                const el = document.createElement('div');
                if (item === '') {
                    el.classList.add('blank');
                } else {
                    el.classList.add('pattern-item');
                    el.textContent = item;
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

            window.speakText('What comes next?');
        }

        function handlePatternClick(e) {
            const clickedValue = parseInt(e.target.dataset.value);
            patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = true);

            if (clickedValue === currentPattern.answer) {
                e.target.classList.add('correct');
                if(window.playBurstEffect) window.playBurstEffect(e.target);
                window.speakText(`That's right, ${currentPattern.answer}!`);
                setTimeout(startPatternsGame, 1500);
            } else {
                e.target.classList.add('incorrect');
                window.speakText("Oops, try again!");
                setTimeout(() => {
                    e.target.classList.remove('incorrect');
                    patternChoices.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 1000);
            }
        }


        // ==========================================================
        // --- GAME 4: EGG-DITION (AND SUBTRACTION!) ---
        // ==========================================================
        const eggGroup1 = document.getElementById('egg-group-1');
        const eggGroup2 = document.getElementById('egg-group-2');
        const eggSolutionContainer = document.getElementById('egg-solution-container');
        const eggChoicesContainer = document.getElementById('egg-choices');
        const mathOperator = document.getElementById('math-operator');

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
            // Clear previous
            eggGroup1.innerHTML = '';
            eggGroup2.innerHTML = '';
            eggSolutionContainer.innerHTML = '';
            eggChoicesContainer.innerHTML = '';

            // Common colors for this round
            const color1 = eggColors[Math.floor(Math.random() * eggColors.length)];
            let color2 = eggColors[Math.floor(Math.random() * eggColors.length)];
            while (color1 === color2) color2 = eggColors[Math.floor(Math.random() * eggColors.length)];

            let num1, num2, answer;

            if (currentLevel === 1) {
                // --- LEVEL 1: ADDITION ---
                mathOperator.textContent = '+';

                num1 = Math.floor(Math.random() * 4) + 1; // 1-4
                num2 = Math.floor(Math.random() * 4) + 1; // 1-4
                answer = num1 + num2;
                if (answer > 8) num2 = 1; // Cap sum at 8

                currentEggProblem = { num1, num2, answer, type: 'add' };

                // Visuals: Group 1 + Group 2
                for (let i = 0; i < num1; i++) eggGroup1.appendChild(createEgg(color1));
                for (let i = 0; i < num2; i++) eggGroup2.appendChild(createEgg(color2));

                // Solution box shows Total
                for (let i = 0; i < num1; i++) eggSolutionContainer.appendChild(createEgg(color1));
                for (let i = 0; i < num2; i++) eggSolutionContainer.appendChild(createEgg(color2));

                window.speakText(`What is ${num1} plus ${num2}?`);

            } else {
                // --- LEVEL 2: SUBTRACTION ---
                mathOperator.textContent = '-';

                // Subtraction: Start with a bigger number (3-7)
                num1 = Math.floor(Math.random() * 5) + 3;
                // Subtract something smaller (1 to num1-1)
                num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
                answer = num1 - num2;

                currentEggProblem = { num1, num2, answer, type: 'sub' };

                // Visuals: Group 1 (Total) - Group 2 (Taken away)
                for (let i = 0; i < num1; i++) eggGroup1.appendChild(createEgg(color1));
                for (let i = 0; i < num2; i++) eggGroup2.appendChild(createEgg(color2));

                // Solution box shows Remaining (The Answer)
                for (let i = 0; i < answer; i++) eggSolutionContainer.appendChild(createEgg(color1));

                window.speakText(`What is ${num1} minus ${num2}?`);
            }

            // Choices
            const choices = generateChoices(answer); // Reuse helper
            choices.sort(() => Math.random() - 0.5);

            choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.classList.add('choice-btn');
                btn.textContent = choice;
                btn.dataset.value = choice;
                btn.addEventListener('click', handleEggChoiceClick);
                eggChoicesContainer.appendChild(btn);
            });
        }

        function handleEggChoiceClick(e) {
            const clickedValue = parseInt(e.target.dataset.value);
            eggChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

            if (clickedValue === currentEggProblem.answer) {
                e.target.classList.add('correct');
                if(window.playBurstEffect) window.playBurstEffect(e.target);

                const p = currentEggProblem;
                const operatorWord = (p.type === 'add') ? 'plus' : 'minus';

                window.speakText(`That's right! ${p.num1} ${operatorWord} ${p.num2} equals ${p.answer}.`, () => {
                    setTimeout(generateEggProblem, 500);
                });

            } else {
                e.target.classList.add('incorrect');
                window.speakText("Oops, try again!");
                setTimeout(() => {
                    e.target.classList.remove('incorrect');
                    eggChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 1000);
            }
        }

    });
})();
