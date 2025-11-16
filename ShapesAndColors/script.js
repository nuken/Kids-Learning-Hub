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
                correctSound.load();
                wrongSound.load();
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
                    fill: '#FFFFFF', // Make them solid white
                    stroke: basketColors[color],
                    strokeWidth: 10, // Thicker border
                    cornerRadius: 10,
                    opacity: 0.8 // Slightly transparent
                });
                basket.id(color); // Store the color info
                leafLayer.add(basket);
                basketTargets.push(basket);
            });

            // --- Create Leaves (Pieces) ---
            const numPerColor = 2; // <-- REDUCED FROM 3
            const leafSize = Math.min(stageW / 8, 110); // <-- INCREASED SIZE
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
                        // --- BUG FIX IS HERE ---
                        // WRONG BASKET - Play robust "up-then-down" wiggle
                        playSound(wrongSound);
                        basket.to({
                            scaleX: 1.1,
                            scaleY: 1.1,
                            duration: 0.1,
                            easing: Konva.Easings.EaseOut,
                            onFinish: () => {
                                // Chain the animation to go back down
                                basket.to({
                                    scaleX: 1,
                                    scaleY: 1,
                                    duration: 0.2,
                                    easing: Konva.Easings.EaseIn
                                });
                            }
                        });
                        // --- END BUG FIX ---
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
				window.playConfettiEffect();
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
				window.playConfettiEffect();
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
                silhouetteImage: 'images/puzzle-house.png',
                pieces: [
                    { id: 'roof', shape: 'triangle', color: '#F44336', rotation: 0 },
                    { id: 'base', shape: 'square', color: '#2196F3', rotation: 0 }
                ],
                targets: [
                    // --- CHANGED: x: 0.6 changed to 0.5 ---
                    { id: 'roof', shape: 'triangle', x: 0.5, y: 0.35, size: 0.3, rotation: 0 },
                    { id: 'base', shape: 'square', x: 0.5, y: 0.65, size: 0.25, rotation: 0 }
                ]
            },
            {
                id: 'train',
                instruction: "Let's build a train!",
                silhouetteImage: 'images/puzzle-train.png',
                pieces: [
                    { id: 'engine', shape: 'square', color: '#4CAF50', rotation: 0 },
                    { id: 'car', shape: 'square', color: '#FF9800', rotation: 0 },
                    { id: 'wheel1', shape: 'circle', color: '#607D8B', rotation: 0 },
                    { id: 'wheel2', shape: 'circle', color: '#607D8B', rotation: 0 }
                ],
                targets: [
                    // --- CHANGED: x coordinates shifted left to be centered ---
                    { id: 'engine', shape: 'square', x: 0.375, y: 0.6, size: 0.2, rotation: 0 },
                    { id: 'car', shape: 'square', x: 0.625, y: 0.6, size: 0.2, rotation: 0 },
                    { id: 'wheel1', shape: 'circle', x: 0.375, y: 0.85, size: 0.1, rotation: 0 },
                    { id: 'wheel2', shape: 'circle', x: 0.625, y: 0.85, size: 0.1, rotation: 0 }
                ]
            },
            {
                id: 'ice_cream',
                instruction: "Let's make an ice cream cone!",
                silhouetteImage: 'images/puzzle-ice-cream.png',
                pieces: [
                    { id: 'cone', shape: 'triangle', color: '#FF9800', rotation: 180 },
                    { id: 'scoop', shape: 'circle', color: '#F44336', rotation: 0 }
                ],
                targets: [
                    // --- CHANGED: x: 0.6 changed to 0.5 ---
                    { id: 'cone', shape: 'triangle', x: 0.5, y: 0.6, size: 0.25, rotation: 180 },
                    { id: 'scoop', shape: 'circle', x: 0.5, y: 0.35, size: 0.2, rotation: 0 }
                ]
            },
            {
                id: 'sailboat',
                instruction: "Let's build a sailboat!",
                silhouetteImage: 'images/puzzle-sailboat.png',
                pieces: [
                    { id: 'hull', shape: 'square', color: '#2196F3', rotation: 45 },
                    { id: 'sail', shape: 'triangle', color: '#FFEB3B', rotation: 0 }
                ],
                targets: [
                    // --- CHANGED: x: 0.6 changed to 0.5 ---
                    { id: 'hull', shape: 'square', x: 0.5, y: 0.7, size: 0.2, rotation: 45 },
                    { id: 'sail', shape: 'triangle', x: 0.5, y: 0.45, size: 0.25, rotation: 0 }
                ]
            },
            {
                id: 'fish',
                instruction: "Let's make a fish!",
                silhouetteImage: 'images/puzzle-fish.png',
                pieces: [
                    { id: 'body', shape: 'circle', color: '#FF9800', rotation: 0 },
                    // --- CHANGED 'rotation: 90' to '-90' ---
                    { id: 'tail', shape: 'triangle', color: '#FFEB3B', rotation: -90 } 
                ],
                targets: [
                    { id: 'body', shape: 'circle', x: 0.5, y: 0.5, size: 0.25, rotation: 0 },
                    // --- CHANGED 'rotation: 90' to '-90' ---
                    { id: 'tail', shape: 'triangle', x: 0.7, y: 0.5, size: 0.15, rotation: -90 }
                ]
            }
        ];

        let currentPuzzleIndex = 0;

        function haveIntersection(r1, r2) {
            // r1 = piece, r2 = target
            
            // Increase the target area by 30 pixels in every direction.
            // This makes the drop zone much more forgiving, especially for small pieces.
            const tolerance = 30; 

            // Standard collision check (AABB), but with the target (r2)
            // "inflated" by the tolerance.
            return !(
                // Piece is to the right of the inflated target
                r1.x > r2.x + r2.width + tolerance ||
                // Piece is to the left of the inflated target
                r1.x + r1.width < r2.x - tolerance ||
                // Piece is below the inflated target
                r1.y > r2.y + r2.height + tolerance ||
                // Piece is above the inflated target
                r1.y + r1.height < r2.y - tolerance
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

    // --- Define areas for pieces and targets (Existing logic) ---
    let targetArea;
    const isPortrait = stageH > stageW;
    const pieceBinPadding = 10;

    if (isPortrait) {
        const binHeight = Math.min(160, stageH * 0.25);
        puzzlePieceBin = { x: pieceBinPadding, y: stageH - binHeight, width: stageW - (pieceBinPadding * 2), height: binHeight - pieceBinPadding };
        targetArea = { x: 0, y: 0, width: stageW, height: stageH - binHeight - pieceBinPadding };
    } else {
        const binWidth = Math.min(180, stageW * 0.3);
        puzzlePieceBin = { x: pieceBinPadding, y: pieceBinPadding, width: binWidth, height: stageH - (pieceBinPadding * 2) };
        targetArea = { x: binWidth + pieceBinPadding, y: 0, width: stageW - binWidth - (pieceBinPadding * 2), height: stageH };
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

    // --- Inner function to build the puzzle ---
    const buildPuzzleContents = (silhouetteNode) => {
        
        // If a silhouette image was loaded, add it to the layer
        if (silhouetteNode) {
            puzzleLayer.add(silhouetteNode);
            silhouetteNode.moveToBottom(); // Move it behind targets
            binRect.moveToTop(); // Ensure bin is over it
        }

        // --- Draw Targets (Existing logic) ---
        puzzleData.targets.forEach(target => {
            const size = Math.min(targetArea.width, targetArea.height) * target.size;

            const targetX = silhouetteNode.x() + (silhouetteNode.width() * target.x);
            const targetY = silhouetteNode.y() + (silhouetteNode.height() * target.y);

            const targetShape = createKonvaShape(
                target.shape,
                targetX,
                targetY,
                size,
                '#999',
                target.rotation
            );
            targetShape.fill(null);
            targetShape.strokeEnabled(false);
            targetShape.id(target.id);
            targetShape.name(target.shape); // <--  ADD THIS LINE
            targetShape.listening(false);

            puzzleLayer.add(targetShape);
            puzzleTargets.push(targetShape);
        });
        // --- End Draw Targets ---


        // --- Draw Pieces (Existing logic) ---
        const pieceCount = puzzleData.pieces.length;
        let pieceSize;

        if (isPortrait) {
            let potentialSize = puzzlePieceBin.height * 0.75;
            const numCols = Math.floor(puzzlePieceBin.width / potentialSize);
            if (numCols < pieceCount) {
                potentialSize = (puzzlePieceBin.width / pieceCount) * 0.9;
            }
            pieceSize = Math.max(30, potentialSize);
        } else {
            let potentialSize = puzzlePieceBin.width * 0.75;
            const numRows = Math.floor(puzzlePieceBin.height / potentialSize);
            if (numRows < pieceCount) {
                potentialSize = (puzzlePieceBin.height / pieceCount) * 0.9;
            }
            pieceSize = Math.max(30, potentialSize);
        }

        puzzleData.pieces.forEach((piece, index) => {
            let pieceX, pieceY;
            if (isPortrait) {
                const numCols = Math.floor(puzzlePieceBin.width / pieceSize);
                const col = index % numCols;
                const row = Math.floor(index / numCols);
                const gridWidth = numCols * pieceSize;
                const startX = puzzlePieceBin.x + (puzzlePieceBin.width - gridWidth) / 2;
                pieceX = startX + (col * pieceSize) + (pieceSize / 2);
                pieceY = puzzlePieceBin.y + (row * pieceSize) + (pieceSize / 2);
            } else {
                const numRows = Math.floor(puzzlePieceBin.height / pieceSize);
                const row = index % numRows;
                const col = Math.floor(index / numRows);
                const gridHeight = numRows * pieceSize;
                const startY = puzzlePieceBin.y + (puzzlePieceBin.height - gridHeight) / 2;
                pieceX = puzzlePieceBin.x + (col * pieceSize) + (pieceSize / 2);
                pieceY = startY + (row * pieceSize) + (pieceSize / 2);
            }

            const pieceShape = createKonvaShape(
                piece.shape,
                pieceX,
                pieceY,
                pieceSize * 0.8,
                piece.color,
                piece.rotation
            );

            pieceShape.id(piece.id);
            pieceShape.name(piece.shape); // <-- ADD THIS LINE
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
        // --- End Draw Pieces ---

        // --- Finalize (Existing logic) ---
        puzzleLayer.batchDraw();
        puzzlePrompt.textContent = puzzleData.instruction;
        window.speakText(puzzleData.instruction);
        isPuzzleLoading = false;
    };
    // --- End of buildPuzzleContents function ---


    // --- Asynchronous Image Loader ---
    if (puzzleData.silhouetteImage) {
        Konva.Image.fromURL(puzzleData.silhouetteImage, (imageNode) => {
            const baseSize = Math.min(targetArea.width, targetArea.height) * 0.9;
            const imageRatio = imageNode.width() / imageNode.height();
            
            let imgW, imgH;
            if (imageRatio > 1) {
                imgW = baseSize;
                imgH = baseSize / imageRatio;
            } else {
                imgH = baseSize;
                imgW = baseSize * imageRatio;
            }
            
            imageNode.setAttrs({
                x: targetArea.x + (targetArea.width - imgW) / 2,
                y: targetArea.y + (targetArea.height - imgH) / 2,
                width: imgW,
                height: imgH,
                opacity: 0.35
            });
            
            buildPuzzleContents(imageNode);

        }, (err) => {
            console.error("Silhouette image failed to load:", err);
            buildPuzzleContents(null);
        });
    } else {
        buildPuzzleContents(null);
    }
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
    const pieceShapeType = piece.name(); // e.g., 'circle'
    
    let validTarget = null; // We'll store our matched target here

    // --- NEW LOGIC: ---
    // Loop through all *available* targets
    for (const target of puzzleTargets) {
        // Check for two things:
        // 1. Is the piece intersecting with this target?
        // 2. Is this target the same shape as the piece?
        if (haveIntersection(piece.getClientRect(), target.getClientRect()) && target.name() === pieceShapeType) {
            validTarget = target; // We found a match!
            break; // Stop looping
        }
    }
    // --- END NEW LOGIC ---

    if (validTarget) {
        // --- CORRECT DROP ---
        playSound(correctSound);
        piece.draggable(false); // Stop it from being dragged again
        piece.off('dragend');   // Remove this listener

        // 1. Define the universal properties to animate
        const targetProps = {
            x: validTarget.x(), // Use validTarget
            y: validTarget.y(), // Use validTarget
            rotation: validTarget.rotation(), // Use validTarget
            duration: 0.2,
            easing: Konva.Easings.EaseInOut
        };

        // 2. Add shape-specific size properties
        const shapeType = piece.getClassName();
        
        if (shapeType === 'Rect') {
            targetProps.width = validTarget.width();
            targetProps.height = validTarget.height();
            targetProps.offsetX = validTarget.offsetX();
            targetProps.offsetY = validTarget.offsetY();
        } else if (shapeType === 'Circle') {
            targetProps.radius = validTarget.radius();
        } else if (shapeType === 'Line') { // Triangle
            targetProps.points = validTarget.points();
        }

        // 3. Run the "Grow-and-Snap" animation
        piece.to(targetProps);
        
        // Remove the target from the layer
        validTarget.destroy();
        
        // --- CRUCIAL: Remove the target from our array ---
        // This prevents a 2nd piece from snapping to the same spot
        puzzleTargets = puzzleTargets.filter(t => t !== validTarget);

        // Check if the whole puzzle is solved
        checkPuzzleWin();

    } else {
        // --- WRONG DROP (Snap back) ---
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
				window.playConfettiEffect();
                window.speakText("Great job!");
                nextPuzzleButton.classList.remove('hidden');
            }
        }

    });

})();
