// /nuken/kids-learning-hub/Kids-Learning-Hub-df4b973cb4b0e26387e4589e950b6c6658a57547/ShapesAndColors/script.js

(function() {

    document.addEventListener('DOMContentLoaded', () => {


        // --- 1. NAVIGATION ---
        const screens = document.querySelectorAll('.game-screen');
        const menuButtons = {
            'start-leaf-sort-btn': 'leaf-sort-game',
            'start-shape-web-btn': 'shape-web-game',
            'start-shape-puzzle-btn': 'shape-puzzle-game'
        };
        const backButtons = document.querySelectorAll('.back-btn');

        function showScreen(screenId) {
			if (screenId !== 'main-menu') {
                primeAudio();
            }
            screens.forEach(screen => screen.classList.remove('visible'));
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('visible');
            }

            if (screenId === 'leaf-sort-game') {
                startLeafSortGame();
            } else if (screenId === 'shape-web-game') {
                startShapeGame();
            }
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
            btn.addEventListener('click', () => {
                window.speechSynthesis.cancel(); // <-- This is good, keep it.
                showScreen('main-menu');
            });
        });

        // --- 2. AUDIO & HELPERS ---
        const correctSound = new Audio('sounds/correct.mp3');
        const wrongSound = new Audio('sounds/wrong.mp3');
		let audioPrimed = false;

        // --- START: MODIFICATION ---
        //
        // The local 'loadVoices' and 'speakText' functions have been
        // DELETED from here. The script now uses the global versions
        // provided by 'speech-module.js'.
        //
        // --- END: MODIFICATION ---

        async function playSound(sound) {
            sound.currentTime = 0;
            try {
                await sound.play();
            } catch (err) {
                console.error("Audio play failed:", err);
            }
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function primeAudio() {
            if (audioPrimed) return; // Only run this once

            // 1. "Wake up" the speech engine (from speech-module.js)
            // This MUST be called from within a user interaction event on iOS.
            if (window.unlockSpeechIfNeeded) {
                window.unlockSpeechIfNeeded();
            }

            // 2. "Wake up" the sound effects
            try {
                correctSound.play().catch(() => {});
                correctSound.pause();
                correctSound.currentTime = 0;

                wrongSound.play().catch(() => {});
                wrongSound.pause();
                wrongSound.currentTime = 0;
            } catch (err) {
                console.error("Audio priming failed:", err);
            }

            // 3. "Wake up" the speech voice list (from speech-module.js)
            if (window.loadVoices) {
                window.loadVoices();
            }

            audioPrimed = true;
        }

        // --- 3. GAME 1: LEAF COLOR SORT (Konva Drag-and-Drop) ---

        const leafColors = ['green', 'red', 'yellow', 'brown'];
        const LEAF_IMAGES = {}; // To store preloaded leaf images
        let leafStage, leafLayer;
        let leafGameInitialized = false;
        let leafPieces = [];
        let basketTargets = [];

        // Helper function to load all our leaf images before starting
        function loadLeafImages(callback) {
            let imagesToLoad = leafColors.length;
            if (Object.keys(LEAF_IMAGES).length === leafColors.length) {
                callback();
                return;
            }

            leafColors.forEach(color => {
                const img = new Image();
                img.src = `images/leaf-${color}.png`;
                img.onload = () => {
                    LEAF_IMAGES[color] = img;
                    imagesToLoad--;
                    if (imagesToLoad === 0) {
                        callback();
                    }
                };
            });
        }

        function startLeafSortGame() {
			window.speakText("Sort the leaves!");
            // 1. Wait for images to be loaded
            loadLeafImages(() => {
                // 2. Setup the stage (only once)
                if (!leafGameInitialized) {
                    const canvasContainer = document.getElementById('leaf-sort-canvas');
                    leafStage = new Konva.Stage({
                        container: 'leaf-sort-canvas',
                        width: canvasContainer.clientWidth,
                        height: canvasContainer.clientHeight
                    });
                    leafLayer = new Konva.Layer();
                    leafStage.add(leafLayer);

                    // Resize observer, just like the puzzle game
                    new ResizeObserver(() => {
                        requestAnimationFrame(() => {
                            // --- ADD THIS GUARD ---
                            const parentScreen = document.getElementById('leaf-sort-game');
                            if (leafStage && canvasContainer && parentScreen.classList.contains('visible')) {
                            // --- END ADDITION ---
                                const newWidth = canvasContainer.clientWidth;
                                const newHeight = canvasContainer.clientHeight;
                                if (leafStage.width() !== newWidth || leafStage.height() !== newHeight) {
                                    leafStage.width(newWidth);
                                    leafStage.height(newHeight);
                                    // Reload the current setup if screen resizes
                                    loadLeafSortProblem();
                                }
                            }
                        });
                    }).observe(canvasContainer);

                    leafGameInitialized = true;
                }

                // 3. Load the game pieces
                loadLeafSortProblem();
            });
        }

        function loadLeafSortProblem() {
            if (!leafStage) return; // Exit if stage isn't ready

            const stageW = leafStage.width();
            const stageH = leafStage.height();

            // Clear old pieces and targets
            leafLayer.destroyChildren();
            leafPieces = [];
            basketTargets = [];

            // --- Create Baskets (Targets) ---
            const basketSize = Math.min(stageW / 4.5, stageH / 4.5, 120);
            const basketY = stageH - basketSize - 10; // Baskets at the bottom
            const basketSpacing = (stageW - (basketSize * 4)) / 5;

            const basketColors = {
                'green': '#4CAF50',
                'red': '#F44336',
                'yellow': '#FFEB3B',
                'brown': '#795548'
            };

            leafColors.forEach((color, index) => {
                const basket = new Konva.Rect({
                    x: basketSpacing + (index * (basketSize + basketSpacing)),
                    y: basketY,
                    width: basketSize,
                    height: basketSize,
                    stroke: basketColors[color],
                    strokeWidth: 8,
                    dash: [10, 5],
                    cornerRadius: 10
                });
                basket.id(color); // Store the color info
                leafLayer.add(basket);
                basketTargets.push(basket);
            });

            // --- Create Leaves (Pieces) ---
            const numPerColor = 3;
            const leafSize = Math.min(stageW / 10, 80);
            const pileHeight = stageH - basketSize - 30; // Area above baskets

            for (const color of leafColors) {
                for (let i = 0; i < numPerColor; i++) {
                    const startX = Math.random() * (stageW - leafSize) + (leafSize / 2);
                    const startY = Math.random() * (pileHeight - leafSize) + (leafSize / 2);

                    const leaf = new Konva.Image({
                        image: LEAF_IMAGES[color],
                        x: startX,
                        y: startY,
                        width: leafSize,
                        height: leafSize,
                        draggable: true,
                        offsetX: leafSize / 2,
                        offsetY: leafSize / 2
                    });

                    leaf.id(color); // Store the color info
                    leaf.data = { originalX: startX, originalY: startY }; // Store snap-back position

                    leaf.on('dragstart', (e) => {
                        e.target.moveToTop();
                        leafLayer.batchDraw();
                    });

                    leaf.on('dragend', handleLeafDragEnd);

                    leafLayer.add(leaf);
                    leafPieces.push(leaf);
                }
            }

            leafLayer.batchDraw();
            // This now calls the global window.speakText
           // window.speakText("Sort the leaves!");
        }

        function handleLeafDragEnd(e) {
            const leaf = e.target;
            const leafColor = leaf.id();

            let correctDrop = false;

            // We can reuse the haveIntersection function from the puzzle game!
            for (const basket of basketTargets) {
                if (haveIntersection(leaf.getClientRect(), basket.getClientRect())) {

                    if (basket.id() === leafColor) {
                        // CORRECT BASKET
                        playSound(correctSound);
                        leaf.draggable(false);
                        leaf.off('dragend');
                        leaf.to({
                            x: basket.x() + basket.width() / 2 + (Math.random() - 0.5) * (basket.width() / 2),
                            y: basket.y() + basket.height() / 2 + (Math.random() - 0.5) * (basket.height() / 2),
                            scaleX: 0.5,
                            scaleY: 0.5,
                            duration: 0.2
                        });
                        correctDrop = true;
                        checkLeafSortWin();
                        break;
                    } else {
                        // WRONG BASKET
                        playSound(wrongSound);
                        basket.to({
                            scaleX: 1.1,
                            scaleY: 1.1,
                            duration: 0.1,
                            yoyo: true, // Go back to normal
                            onFinish: () => basket.scaleX(1).scaleY(1)
                        });
                    }
                }
            }

            if (!correctDrop) {
                // No basket, or wrong basket - snap back
                leaf.to({
                    x: leaf.data.originalX,
                    y: leaf.data.originalY,
                    duration: 0.3,
                    easing: Konva.Easings.ElasticEaseOut
                });
            }

            leafLayer.batchDraw();
        }

        function checkLeafSortWin() {
            // Check if all pieces are no longer draggable
            const allSorted = leafPieces.every(p => !p.draggable());
            if (allSorted) {
                // This now calls the global window.speakText
                window.speakText("Great job!");
                // Reload the game
                setTimeout(loadLeafSortProblem, 1500);
            }
        }


        // --- 4. GAME 2: SPIDER'S SHAPE WEB ---
        const shapeGameData = [
            { shape: 'square', webImage: 'images/web-square-gap.png', filledImage: 'images/web-square-filled.png', instruction: "Find the square", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'circle', webImage: 'images/web-circle-gap.png', filledImage: 'images/web-circle-filled.png', instruction: "Find the circle", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'triangle', webImage: 'images/web-triangle-gap.png', filledImage: 'images/web-triangle-filled.png', instruction: "Find the triangle", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'star', webImage: 'images/web-star-gap.png', filledImage: 'images/web-star-filled.png', instruction: "Find the star", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] },
            { shape: 'hexagon', webImage: 'images/web-hexagon-gap.png', filledImage: 'images/web-hexagon-filled.png', instruction: "Find the hexagon", choices: ['square', 'circle', 'triangle', 'star', 'hexagon'] }
        ];

        const webDisplay = document.getElementById('spider-web-display');
        const shapeChoicesContainer = document.getElementById('shape-choices-container');
        const nextShapeButton = document.getElementById('next-shape-button');
        const friendlySpider = document.getElementById('friendly-spider');

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
                currentShapeIndex = 0;
            }
            loadShapeProblem();
        }

        function loadShapeProblem() {
            currentShapeProblem = shapeGameData[currentShapeIndex];
            webDisplay.style.backgroundImage = `url('${currentShapeProblem.webImage}')`;

            // This now calls the global window.speakText
            window.speakText(currentShapeProblem.instruction);

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
                if (friendlySpider) {
                    friendlySpider.classList.add('spider-bounces');
                    // Remove the class after the animation finishes (800ms)
                    setTimeout(() => {
                        friendlySpider.classList.remove('spider-bounces');
                    }, 800);
                }

            } else {
                playSound(wrongSound);
                webDisplay.classList.add('shake');
                setTimeout(() => {
                    webDisplay.classList.remove('shake');
                    shapeChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 500);
            }
        }


        // --- 5. GAME 3: SHAPE PUZZLES (Konva Drag-and-Drop) ---

        const puzzleCanvasContainer = document.getElementById('shape-puzzle-canvas');
        const puzzlePrompt = document.getElementById('puzzle-prompt');
        const nextPuzzleButton = document.getElementById('next-puzzle-button');

        let puzzleStage, puzzleLayer;
        let puzzleGameInitialized = false;
        // === ADD THIS FLAG ===
        let isPuzzleLoading = false;
        let isPuzzleSolved = false;
        let puzzlePieces = [];
        let puzzleTargets = [];
        let puzzlePieceBin = { x: 10, y: 10, width: 180, height: 500 };

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
        ];

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
                    // Use requestAnimationFrame to wait for the browser to finish its layout changes
                    requestAnimationFrame(() => {
                        if (!isPuzzleLoading && !isPuzzleSolved && puzzleStage && puzzleCanvasContainer) {
                            const newWidth = puzzleCanvasContainer.clientWidth;
                            const newHeight = puzzleCanvasContainer.clientHeight;

                            // Only redraw if the size actually changed to avoid unnecessary reloads
                            if (puzzleStage.width() !== newWidth || puzzleStage.height() !== newHeight) {
                                puzzleStage.width(newWidth);
                                puzzleStage.height(newHeight);
                                loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
                            }
                        }
                    });
                }).observe(puzzleCanvasContainer);

                nextPuzzleButton.addEventListener('click', () => {
                    currentPuzzleIndex++;
                    if (currentPuzzleIndex >= PUZZLE_DATA.length) {
                        currentPuzzleIndex = 0;
                    }
                    loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
                });

                puzzleGameInitialized = true;
            }

            shuffleArray(PUZZLE_DATA);
            currentPuzzleIndex = 0;
            loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
        }

        // === MODIFY THIS FUNCTION ===
        // --- REPLACE YOUR OLD loadPuzzle FUNCTION WITH THIS NEW ONE ---

        function loadPuzzle(puzzleData) {
            isPuzzleSolved = false;
            isPuzzleLoading = true;

            if (!puzzleStage || !puzzleData || !puzzleData.id) {
                console.warn("loadPuzzle called too early or with no data");
                isPuzzleLoading = false;
                return;
            }

            const stageW = puzzleStage.width();
            const stageH = puzzleStage.height();

            if (stageW === 0 || stageH === 0) {
                requestAnimationFrame(() => loadPuzzle(puzzleData));
                return;
            }

            currentPuzzle = puzzleData;
            puzzlePieces = [];
            puzzleTargets = [];
            puzzleLayer.destroyChildren();
            nextPuzzleButton.classList.add('hidden');

            // --- FIX: Define separate areas for pieces and targets ---
            let targetArea;
            const isPortrait = stageH > stageW;
            const pieceBinPadding = 10;

            if (isPortrait) {
                // Bin at the bottom
                const binHeight = Math.min(160, stageH * 0.25); // Bin is max 160px or 25% of screen
                puzzlePieceBin = { x: pieceBinPadding, y: stageH - binHeight, width: stageW - (pieceBinPadding * 2), height: binHeight - pieceBinPadding };
                // Target area is everything above the bin
                targetArea = { x: 0, y: 0, width: stageW, height: stageH - binHeight - pieceBinPadding };
            } else {
                // Bin on the left
                const binWidth = Math.min(180, stageW * 0.3); // Bin is max 180px or 30% of screen
                puzzlePieceBin = { x: pieceBinPadding, y: pieceBinPadding, width: binWidth, height: stageH - (pieceBinPadding * 2) };
                // Target area is everything to the right of the bin
                targetArea = { x: binWidth + pieceBinPadding, y: 0, width: stageW - binWidth - (pieceBinPadding * 2), height: stageH };
            }
            // --- END FIX ---

            const binRect = new Konva.Rect({
                ...puzzlePieceBin,
                fill: '#ffffff',
                stroke: '#ccc',
                strokeWidth: 4,
                dash: [10, 5],
                cornerRadius: 10
            });
            puzzleLayer.add(binRect);

            // --- FIX: Position targets within the targetArea ---
            puzzleData.targets.forEach(target => {
                // Calculate size based on the *smaller* dimension of the target area
                const size = Math.min(targetArea.width, targetArea.height) * target.size;
                const targetShape = createKonvaShape(
                    target.shape,
                    // Position relative to targetArea
                    targetArea.x + (targetArea.width * target.x),
                    targetArea.y + (targetArea.height * target.y),
                    size,
                    '#999',
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
            // --- END FIX ---


            // --- FIX: Grid layout for pieces in the bin ---
            const pieceCount = puzzleData.pieces.length;
            let pieceSize;

            if (isPortrait) {
                // Try to fit pieces in 1 row
                let potentialSize = puzzlePieceBin.height * 0.75;
                const numCols = Math.floor(puzzlePieceBin.width / potentialSize);
                if (numCols < pieceCount) {
                    // Not enough space, so fit all in one row and shrink them
                    potentialSize = (puzzlePieceBin.width / pieceCount) * 0.9;
                }
                pieceSize = Math.max(30, potentialSize);
            } else {
                // Try to fit pieces in 1 column
                let potentialSize = puzzlePieceBin.width * 0.75;
                const numRows = Math.floor(puzzlePieceBin.height / potentialSize);
                if (numRows < pieceCount) {
                    // Not enough space, so fit all in one col and shrink them
                    potentialSize = (puzzlePieceBin.height / pieceCount) * 0.9;
                }
                pieceSize = Math.max(30, potentialSize);
            }


            puzzleData.pieces.forEach((piece, index) => {
                let pieceX, pieceY;

                if (isPortrait) {
                    // Grid horizontally
                    const numCols = Math.floor(puzzlePieceBin.width / pieceSize);
                    const col = index % numCols;
                    const row = Math.floor(index / numCols);

                    // Center the grid of pieces horizontally
                    const gridWidth = numCols * pieceSize;
                    const startX = puzzlePieceBin.x + (puzzlePieceBin.width - gridWidth) / 2;

                    pieceX = startX + (col * pieceSize) + (pieceSize / 2);
                    pieceY = puzzlePieceBin.y + (row * pieceSize) + (pieceSize / 2);

                } else {
                    // Grid vertically
                    const numRows = Math.floor(puzzlePieceBin.height / pieceSize);
                    const row = index % numRows;
                    const col = Math.floor(index / numRows);

                    // Center the grid of pieces vertically
                    const gridHeight = numRows * pieceSize;
                    const startY = puzzlePieceBin.y + (puzzlePieceBin.height - gridHeight) / 2;

                    pieceX = puzzlePieceBin.x + (col * pieceSize) + (pieceSize / 2);
                    pieceY = startY + (row * pieceSize) + (pieceSize / 2);
                }

                const pieceShape = createKonvaShape(
                    piece.shape,
                    pieceX,
                    pieceY,
                    pieceSize * 0.8, // Make piece slightly smaller than its "cell"
                    piece.color,
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
            // --- END FIX ---

            puzzleLayer.batchDraw();
            puzzlePrompt.textContent = puzzleData.instruction;
            // This now calls the global window.speakText
            window.speakText(puzzleData.instruction);

            isPuzzleLoading = false;
        }

        function createKonvaShape(shape, x, y, size, color, rotation = 0) {
            let konvaShape;
            const shapeProps = {
                x: x,
                y: y,
                fill: color,
                stroke: '#333',
                strokeWidth: 2,
                rotation: rotation
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
                    // Use Math.max to ensure radius is never negative
                    radius: Math.max(1, size / 2)
                });
            } else if (shape === 'triangle') {
                konvaShape = new Konva.Line({
                    ...shapeProps,
                    points: [0, -size / 2, -size / 2, size / 2, size / 2, size / 2],
                    closed: true,
                });
            }
            return konvaShape;
        }

        function handlePieceDragEnd(e) {
            const piece = e.target;
            const target = puzzleTargets.find(t => t.id() === piece.id());

            if (target && haveIntersection(piece.getClientRect(), target.getClientRect())) {
                playSound(correctSound);
                piece.position(target.position());
                piece.rotation(target.rotation());
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
                isPuzzleSolved = true;
                // This now calls the global window.speakText
                window.speakText("Great job!");
                nextPuzzleButton.classList.remove('hidden');
            }
        }

    });

})();
