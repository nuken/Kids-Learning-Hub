// /nuken/kids-learning-hub/Kids-Learning-Hub-df4b973cb4b0e26387e4589e950b6c6658a57547/ShapesAndColors/script.js

(function() {

    document.addEventListener('DOMContentLoaded', () => {

        // --- ADD THIS LINE --- (From Number/script.js)
        if (window.unlockSpeechIfNeeded) {
            window.unlockSpeechIfNeeded();
        }

        // --- 1. NAVIGATION ---
        const screens = document.querySelectorAll('.game-screen');
        const menuButtons = {
            'start-leaf-sort-btn': 'leaf-sort-game',
            'start-shape-web-btn': 'shape-web-game',

            // --- ADD THIS LINE ---
            'start-shape-puzzle-btn': 'shape-puzzle-game'
        };
        const backButtons = document.querySelectorAll('.back-btn');

        function showScreen(screenId) {
            screens.forEach(screen => screen.classList.remove('visible'));
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('visible');
            }

            // Start/Reset the game when its screen is shown
            if (screenId === 'leaf-sort-game') {
                startLeafSortGame();
            } else if (screenId === 'shape-web-game') {
                startShapeGame();
            }
            // --- ADD THIS LINE ---
            else if (screenId === 'shape-puzzle-game') {
                startShapePuzzleGame();
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

        // --- 2. AUDIO & HELPERS ---
        const correctSound = new Audio('sounds/correct.mp3');
        const wrongSound = new Audio('sounds/wrong.mp3');

        // --- REMOVE THIS OBJECT ---
        // const sounds = { ... };

        // --- ADD THIS ENTIRE SPEECH SYSTEM (from Number/script.js) ---
        let voiceList = [];
        function loadVoices() {
            if (voiceList.length > 0) return;
            voiceList = window.speechSynthesis.getVoices();
        }
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        function speakText(text, onEndCallback) {
            window.speechSynthesis.cancel();
            if (voiceList.length === 0) {
                loadVoices();
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.lang = 'en-US';
            if (onEndCallback) {
                utterance.onend = onEndCallback;
            }
            if (voiceList.length > 0) {
                let selectedVoice = voiceList.find(v => v.name === 'Samantha' && v.lang === 'en-US') ||
                                    voiceList.find(v => v.lang === 'en-US' && v.default) ||
                                    voiceList.find(v => v.lang === 'en-US');
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    utterance.lang = selectedVoice.lang;
                }
            }
            window.speechSynthesis.speak(utterance);
        }
        // --- END OF NEW SPEECH SYSTEM ---

        /**
         * Plays a sound.
         * (Copied from Spelling/script.js)
         */
        async function playSound(sound) {
            sound.currentTime = 0; // Rewind to start
            try {
                await sound.play();
            } catch (err) {
                console.error("Audio play failed:", err);
            }
        }

        /**
         * Shuffles an array in place.
         * (Copied from Spelling/script.js)
         */
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }


        // --- 3. GAME 1: LEAF COLOR SORT (Tap-to-Sort logic) ---
        const leafPileContainer = document.getElementById('leaf-pile-container');
        const basketContainer = document.getElementById('basket-container');
        const leafColors = ['green', 'red', 'yellow', 'brown'];
        let selectedLeaf = null; // Tracks the currently selected leaf

        function startLeafSortGame() {
            leafPileContainer.innerHTML = '';
            basketContainer.innerHTML = '';
            selectedLeaf = null;

            let leavesToCreate = [];
            const numPerColor = 3;

            for (const color of leafColors) {
                for (let i = 0; i < numPerColor; i++) {
                    leavesToCreate.push(color);
                }
            }
            shuffleArray(leavesToCreate);

            leavesToCreate.forEach((color, index) => {
                const leaf = document.createElement('div');
                leaf.className = `leaf ${color}`;
                leaf.id = `leaf-${index}`;
                leaf.dataset.color = color;
                leaf.style.left = `${Math.floor(Math.random() * 80) + 10}%`;
                leaf.style.top = `${Math.floor(Math.random() * 80) + 10}%`;
                leaf.addEventListener('click', handleLeafClick);
                leafPileContainer.appendChild(leaf);
            });

            leafColors.forEach(color => {
                const basket = document.createElement('div');
                basket.className = `basket ${color}`;
                basket.dataset.color = color;
                basket.addEventListener('click', handleBasketClick);
                basketContainer.appendChild(basket);
            });

            // --- MODIFY THIS LINE ---
            speakText("Sort the leaves!");
        }

        function handleLeafClick(e) {
            if (selectedLeaf) {
                selectedLeaf.classList.remove('selected');
            }
            selectedLeaf = e.currentTarget;
            selectedLeaf.classList.add('selected');
        }

        function handleBasketClick(e) {
            if (!selectedLeaf) return;

            const basket = e.currentTarget;
            const basketColor = basket.dataset.color;
            const leafColor = selectedLeaf.dataset.color;

            if (leafColor === basketColor) {
                playSound(correctSound);
                basket.appendChild(selectedLeaf);
                selectedLeaf.classList.remove('selected');
                selectedLeaf.style.position = 'static';
                selectedLeaf.style.left = '';
                selectedLeaf.style.top = '';
                selectedLeaf.removeEventListener('click', handleLeafClick);
                selectedLeaf = null;
                checkLeafSortWin();
            } else {
                playSound(wrongSound);
                if (!basket.classList.contains('shake')) {
                    basket.classList.add('shake');
                    setTimeout(() => basket.classList.remove('shake'), 500);
                }
                selectedLeaf.classList.remove('selected');
                selectedLeaf = null;
            }
        }

        function checkLeafSortWin() {
            if (leafPileContainer.children.length === 0) {
                setTimeout(startLeafSortGame, 1500);
            }
        }


        // --- 4. GAME 2: SPIDER'S SHAPE WEB ---
        const shapeGameData = [
            // --- MODIFY THIS DATA ---
            { shape: 'square', webImage: 'images/web-square-gap.png', filledImage: 'images/web-square-filled.png', instruction: "Find the square", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'circle', webImage: 'images/web-circle-gap.png', filledImage: 'images/web-circle-filled.png', instruction: "Find the circle", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'triangle', webImage: 'images/web-triangle-gap.png', filledImage: 'images/web-triangle-filled.png', instruction: "Find the triangle", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'star', webImage: 'images/web-star-gap.png', filledImage: 'images/web-star-filled.png', instruction: "Find the star", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'hexagon', webImage: 'images/web-hexagon-gap.png', filledImage: 'images/web-hexagon-filled.png', instruction: "Find the hexagon", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] }
        ];

        const webDisplay = document.getElementById('spider-web-display');
        const shapeChoicesContainer = document.getElementById('shape-choices-container');
        const nextShapeButton = document.getElementById('next-shape-button');

        let currentShapeProblem = {};
        let shapeGameInitialized = false;
        let currentShapeIndex = 0;

        function startShapeGame() {
            shuffleArray(shapeGameData);
            currentShapeIndex = 0;
            loadShapeProblem();

            if (!shapeGameInitialized) {
                nextShapeButton.addEventListener('click', loadNextShapeProblem);
                shapeGameInitialized = true;
            }
        }

        function loadNextShapeProblem() {
            currentShapeIndex++;
            if (currentShapeIndex >= shapeGameData.length) {
                currentShapeIndex = 0; // Loop back
            }
            loadShapeProblem();
        }

        function loadShapeProblem() {
            currentShapeProblem = shapeGameData[currentShapeIndex];
            webDisplay.style.backgroundImage = `url('${currentShapeProblem.webImage}')`;

            // --- MODIFY THIS LINE ---
            speakText(currentShapeProblem.instruction);

            shapeChoicesContainer.innerHTML = '';
            nextShapeButton.classList.add('hidden');

            const choices = shuffleArray([...currentShapeProblem.choices]);
            choices.forEach(shapeName => {
                const button = document.createElement('button');
                button.className = 'letter-button shape-choice-btn';
                button.dataset.shape = shapeName;
                button.innerHTML = `<img src="images/shape-${shapeName}.png" alt="${shapeName}">`;
                button.disabled = false;

                button.addEventListener('click', handleShapeClick);
                shapeChoicesContainer.appendChild(button);
            });
        }

        function handleShapeClick(e) {
            const clickedButton = e.currentTarget;
            const clickedShape = clickedButton.dataset.shape;

            shapeChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

            if (clickedShape === currentShapeProblem.shape) {
                playSound(correctSound);
                webDisplay.style.backgroundImage = `url('${currentShapeProblem.filledImage}')`;
                nextShapeButton.classList.remove('hidden');

            } else {
                playSound(wrongSound);
                webDisplay.classList.add('shake');
                setTimeout(() => {
                    webDisplay.classList.remove('shake');
                    shapeChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 500);
            }
        }


        // --- 5. MODIFY THIS ENTIRE SECTION FOR GAME 3 ---

        // ==========================================================
        // --- GAME 3: SHAPE PUZZLES (Konva Drag-and-Drop) ---
        // ==========================================================

        const puzzleCanvasContainer = document.getElementById('shape-puzzle-canvas');
        const puzzlePrompt = document.getElementById('puzzle-prompt');
        const nextPuzzleButton = document.getElementById('next-puzzle-button');

        let puzzleStage, puzzleLayer;
        let puzzleGameInitialized = false;
        let currentPuzzle = {};
        let puzzlePieces = [];
        let puzzleTargets = [];
        let puzzlePieceBin = { x: 10, y: 10, width: 180, height: 500 };

        // === MODIFY THIS CONSTANT ===
        const PUZZLE_DATA = [
            {
                id: 'house',
                instruction: "Let's build a house!",
                pieces: [
                    { id: 'roof', shape: 'triangle', color: '#F44336', rotation: 0 }, // Red
                    { id: 'base', shape: 'square', color: '#2196F3', rotation: 0 }  // Blue
                ],
                targets: [
                    { id: 'roof', shape: 'triangle', x: 0.6, y: 0.35, size: 0.3, rotation: 0 },
                    { id: 'base', shape: 'square', x: 0.6, y: 0.65, size: 0.25, rotation: 0 }
                ]
            },
            {
                id: 'train',
                instruction: "Let's build a train!",
                pieces: [
                    { id: 'engine', shape: 'square', color: '#4CAF50', rotation: 0 }, // Green
                    { id: 'car', shape: 'square', color: '#FF9800', rotation: 0 },    // Orange
                    { id: 'wheel1', shape: 'circle', color: '#607D8B', rotation: 0 }, // Grey
                    { id: 'wheel2', shape: 'circle', color: '#607D8B', rotation: 0 }
                ],
                targets: [
                    { id: 'engine', shape: 'square', x: 0.45, y: 0.6, size: 0.2, rotation: 0 },
                    { id: 'car', shape: 'square', x: 0.7, y: 0.6, size: 0.2, rotation: 0 },
                    { id: 'wheel1', shape: 'circle', x: 0.45, y: 0.85, size: 0.1, rotation: 0 },
                    { id: 'wheel2', shape: 'circle', x: 0.7, y: 0.85, size: 0.1, rotation: 0 }
                ]
            },
            // --- NEW PUZZLES START HERE ---
            {
                id: 'ice_cream',
                instruction: "Let's make an ice cream cone!",
                pieces: [
                    { id: 'cone', shape: 'triangle', color: '#FF9800', rotation: 180 }, // Orange
                    { id: 'scoop', shape: 'circle', color: '#F44336', rotation: 0 }   // Red
                ],
                targets: [
                    { id: 'cone', shape: 'triangle', x: 0.6, y: 0.6, size: 0.25, rotation: 180 },
                    { id: 'scoop', shape: 'circle', x: 0.6, y: 0.35, size: 0.2, rotation: 0 }
                ]
            },
            {
                id: 'sailboat',
                instruction: "Let's build a sailboat!",
                pieces: [
                    // Use 45 deg rotation on a square to make a diamond-like hull
                    { id: 'hull', shape: 'square', color: '#2196F3', rotation: 45 }, // Blue
                    { id: 'sail', shape: 'triangle', color: '#FFEB3B', rotation: 0 } // Yellow
                ],
                targets: [
                    { id: 'hull', shape: 'square', x: 0.6, y: 0.7, size: 0.2, rotation: 45 },
                    { id: 'sail', shape: 'triangle', x: 0.6, y: 0.45, size: 0.25, rotation: 0 }
                ]
            },
            {
                id: 'fish',
                instruction: "Let's make a fish!",
                pieces: [
                    { id: 'body', shape: 'circle', color: '#FF9800', rotation: 0 }, // Orange
                    { id: 'tail', shape: 'triangle', color: '#FFEB3B', rotation: 90 } // Yellow, rotated
                ],
                targets: [
                    { id: 'body', shape: 'circle', x: 0.55, y: 0.5, size: 0.25, rotation: 0 },
                    { id: 'tail', shape: 'triangle', x: 0.75, y: 0.5, size: 0.15, rotation: 90 }
                ]
            }
            // --- END OF NEW PUZZLES ---
        ];
        // === END OF MODIFICATION ===

        let currentPuzzleIndex = 0;

        function haveIntersection(r1, r2) {
            const tolerance = 0.2;
            return !(
                r2.x > r1.x + r1.width - (r1.width * tolerance) ||
                r2.x + r2.width < r1.x + (r1.width * tolerance) ||
                r2.y > r1.y + r1.height - (r1.height * tolerance) ||
                r2.y + r2.height < r1.y + (r1.height * tolerance)
            );
        }

        function startShapePuzzleGame() {
            if (!puzzleGameInitialized) {
                puzzleStage = new Konva.Stage({
                    container: 'shape-puzzle-canvas',
                    width: puzzleCanvasContainer.clientWidth,
                    height: puzzleCanvasContainer.clientHeight
                });

                puzzleLayer = new Konva.Layer();
                puzzleStage.add(puzzleLayer);

                new ResizeObserver(() => {
                    if (puzzleStage && puzzleCanvasContainer) {
                        puzzleStage.width(puzzleCanvasContainer.clientWidth);
                        puzzleStage.height(puzzleCanvasContainer.clientHeight);
                        loadPuzzle(currentPuzzle);
                    }
                }).observe(puzzleCanvasContainer);

                nextPuzzleButton.addEventListener('click', () => {
                    currentPuzzleIndex++;
                    if (currentPuzzleIndex >= PUZZLE_DATA.length) {
                        // --- ADD SHUFFLE ---
                        shuffleArray(PUZZLE_DATA);
                        currentPuzzleIndex = 0;
                    }
                    loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
                });

                puzzleGameInitialized = true;
            }

            // --- ADD SHUFFLE ---
            shuffleArray(PUZZLE_DATA);
            currentPuzzleIndex = 0;
            loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
        }

        function loadPuzzle(puzzleData) {
            currentPuzzle = puzzleData;
            puzzlePieces = [];
            puzzleTargets = [];
            puzzleLayer.destroyChildren();
            nextPuzzleButton.classList.add('hidden');

            const stageW = puzzleStage.width();
            const stageH = puzzleStage.height();
            const isPortrait = stageH > stageW;

            if (isPortrait) {
                puzzlePieceBin = { x: 10, y: stageH - 160, width: stageW - 20, height: 150 };
            } else {
                puzzlePieceBin = { x: 10, y: 10, width: 180, height: stageH - 20 };
            }

            const binRect = new Konva.Rect({
                ...puzzlePieceBin,
                fill: '#ffffff',
                stroke: '#ccc',
                strokeWidth: 4,
                dash: [10, 5],
                cornerRadius: 10
            });
            puzzleLayer.add(binRect);

            puzzleData.targets.forEach(target => {
                const size = Math.min(stageW, stageH) * target.size;
                const targetShape = createKonvaShape(
                    target.shape,
                    stageW * target.x,
                    stageH * target.y,
                    size,
                    '#999',
                    // --- PASS ROTATION ---
                    target.rotation
                );

                targetShape.stroke('#999');
                targetShape.strokeWidth(4);
                targetShape.dash([10, 5]);
                targetShape.fill(null);
                targetShape.id(target.id);
                targetShape.listening(false);

                puzzleLayer.add(targetShape);
                puzzleTargets.push(targetShape);
            });

            const pieceSize = Math.min(puzzlePieceBin.width, puzzlePieceBin.height) * 0.5;
            puzzleData.pieces.forEach((piece, index) => {
                let pieceX, pieceY;
                if (isPortrait) {
                    pieceX = puzzlePieceBin.x + (pieceSize * 1.5 * index) + pieceSize;
                    pieceY = puzzlePieceBin.y + puzzlePieceBin.height / 2;
                } else {
                    pieceX = puzzlePieceBin.x + puzzlePieceBin.width / 2;
                    pieceY = puzzlePieceBin.y + (pieceSize * 1.5 * index) + pieceSize;
                }

                const pieceShape = createKonvaShape(
                    piece.shape,
                    pieceX,
                    pieceY,
                    pieceSize,
                    piece.color,
                    // --- PASS ROTATION ---
                    piece.rotation
                );

                pieceShape.id(piece.id);
                pieceShape.draggable(true);
                pieceShape.data = { originalX: pieceX, originalY: pieceY };

                pieceShape.on('dragstart', (e) => {
                    e.target.moveToTop();
                    puzzleLayer.batchDraw();
                });

                pieceShape.on('dragend', handlePieceDragEnd);

                puzzleLayer.add(pieceShape);
                puzzlePieces.push(pieceShape);
            });

            puzzleLayer.batchDraw();
            puzzlePrompt.textContent = puzzleData.instruction;
            speakText(puzzleData.instruction);
        }

        // === MODIFY THIS FUNCTION ===
        function createKonvaShape(shape, x, y, size, color, rotation = 0) { // Added rotation
            let konvaShape;
            const shapeProps = {
                x: x,
                y: y,
                fill: color,
                stroke: '#333',
                strokeWidth: 2,
                rotation: rotation // Apply rotation
            };

            if (shape === 'square') {
                konvaShape = new Konva.Rect({
                    ...shapeProps,
                    width: size,
                    height: size,
                    offsetX: size / 2,
                    offsetY: size / 2
                });
            } else if (shape === 'circle') {
                konvaShape = new Konva.Circle({
                    ...shapeProps,
                    radius: size / 2
                });
            } else if (shape === 'triangle') {
                konvaShape = new Konva.Line({
                    ...shapeProps,
                    points: [0, -size / 2, -size / 2, size / 2, size / 2, size / 2], // Equilateral
                    closed: true,
                });
            }
            return konvaShape;
        }
        // === END OF MODIFICATION ===

        function handlePieceDragEnd(e) {
            const piece = e.target;
            const target = puzzleTargets.find(t => t.id() === piece.id());

            if (target && haveIntersection(piece.getClientRect(), target.getClientRect())) {
                playSound(correctSound);
                piece.position(target.position());

                // --- ADD THIS LINE ---
                piece.rotation(target.rotation()); // Snap rotation

                piece.draggable(false);
                piece.off('dragend');

                target.destroy();
                puzzleLayer.batchDraw();

                checkPuzzleWin();

            } else {
                playSound(wrongSound);
                piece.to({
                    x: piece.data.originalX,
                    y: piece.data.originalY,
                    duration: 0.3,
                    easing: Konva.Easings.ElasticEaseOut
                });
            }
        }

        function checkPuzzleWin() {
            const allSolved = puzzlePieces.every(p => !p.draggable());
            if (allSolved) {
                speakText("Great job!");
                nextPuzzleButton.classList.remove('hidden');
            }
        }
        // ==========================================================
        // --- END OF NEW GAME 3 SECTION ---
        // ==========================================================

    });

})();
