(function() {

    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. NAVIGATION ---
        const screens = document.querySelectorAll('.game-screen');
        const menuButtons = {
            'start-leaf-sort-btn': 'leaf-sort-game',
            'start-shape-web-btn': 'shape-web-game',
            'start-shape-puzzle-btn': 'shape-puzzle-game',
            'start-mixing-btn': 'mixing-game'
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
            } else if (screenId === 'shape-puzzle-game') {
                startShapePuzzleGame();
            } else if (screenId === 'mixing-game') {
                startMixingGame();
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
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                showScreen('main-menu');
            });
        });

        // --- 2. AUDIO & HELPERS ---
        const correctSound = new Audio('sounds/correct.mp3');
        const wrongSound = new Audio('sounds/wrong.mp3');
        let audioPrimed = false;

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
            if (audioPrimed) return;
            if (window.unlockSpeechIfNeeded) window.unlockSpeechIfNeeded();
            try {
                correctSound.load();
                wrongSound.load();
            } catch (err) {}
            if (window.loadVoices) window.loadVoices();
            audioPrimed = true;
        }

        // ============================================================
        // --- GAME 1: LEAF COLOR SORT ---
        // ============================================================
        const leafColors = ['green', 'red', 'yellow', 'brown'];
        const LEAF_IMAGES = {};
        let leafStage, leafLayer;
        let leafGameInitialized = false;
        let leafPieces = [];
        let basketTargets = [];

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
                    if (imagesToLoad === 0) callback();
                };
            });
        }

        function startLeafSortGame() {
            if (window.speakText) window.speakText("Sort the leaves!");
            loadLeafImages(() => {
                if (!leafGameInitialized) {
                    const canvasContainer = document.getElementById('leaf-sort-canvas');
                    leafStage = new Konva.Stage({
                        container: 'leaf-sort-canvas',
                        width: canvasContainer.clientWidth,
                        height: canvasContainer.clientHeight
                    });
                    leafLayer = new Konva.Layer();
                    leafStage.add(leafLayer);
                    new ResizeObserver(() => {
                        requestAnimationFrame(() => {
                            const parentScreen = document.getElementById('leaf-sort-game');
                            if (leafStage && canvasContainer && parentScreen.classList.contains('visible')) {
                                const newWidth = canvasContainer.clientWidth;
                                const newHeight = canvasContainer.clientHeight;
                                if (leafStage.width() !== newWidth || leafStage.height() !== newHeight) {
                                    leafStage.width(newWidth);
                                    leafStage.height(newHeight);
                                    loadLeafSortProblem();
                                }
                            }
                        });
                    }).observe(canvasContainer);
                    leafGameInitialized = true;
                }
                loadLeafSortProblem();
            });
        }

        function loadLeafSortProblem() {
            if (!leafStage) return;
            const stageW = leafStage.width();
            const stageH = leafStage.height();
            leafLayer.destroyChildren();
            leafPieces = [];
            basketTargets = [];

            const basketSize = Math.min(stageW / 4.5, stageH / 4.5, 120);
            const basketY = stageH - basketSize - 10;
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
                    fill: '#FFFFFF',
                    stroke: basketColors[color],
                    strokeWidth: 10,
                    cornerRadius: 10,
                    opacity: 0.8
                });
                basket.id(color);
                leafLayer.add(basket);
                basketTargets.push(basket);
            });

            const numPerColor = 2;
            const leafSize = Math.min(stageW / 8, 110);
            const pileHeight = stageH - basketSize - 30;

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
                    leaf.id(color);
                    leaf.data = {
                        originalX: startX,
                        originalY: startY
                    };
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
            for (const basket of basketTargets) {
                if (haveIntersection(leaf.getClientRect(), basket.getClientRect())) {
                    if (basket.id() === leafColor) {
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
                        playSound(wrongSound);
                        basket.to({
                            scaleX: 1.1,
                            scaleY: 1.1,
                            duration: 0.1,
                            easing: Konva.Easings.EaseOut,
                            onFinish: () => {
                                basket.to({
                                    scaleX: 1,
                                    scaleY: 1,
                                    duration: 0.2,
                                    easing: Konva.Easings.EaseIn
                                });
                            }
                        });
                    }
                }
            }
            if (!correctDrop) {
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
            const allSorted = leafPieces.every(p => !p.draggable());
            if (allSorted) {
                if (window.playConfettiEffect) window.playConfettiEffect();
                if (window.speakText) window.speakText("Great job!");
                setTimeout(loadLeafSortProblem, 1500);
            }
        }

        // ============================================================
        // --- GAME 2: SPIDER'S SHAPE WEB ---
        // ============================================================
        const shapeGameData = [{
                shape: 'square',
                webImage: 'images/web-square-gap.png',
                filledImage: 'images/web-square-filled.png',
                instruction: "Find the square",
                choices: ['square', 'circle', 'triangle', 'star', 'hexagon']
            },
            {
                shape: 'circle',
                webImage: 'images/web-circle-gap.png',
                filledImage: 'images/web-circle-filled.png',
                instruction: "Find the circle",
                choices: ['square', 'circle', 'triangle', 'star', 'hexagon']
            },
            {
                shape: 'triangle',
                webImage: 'images/web-triangle-gap.png',
                filledImage: 'images/web-triangle-filled.png',
                instruction: "Find the triangle",
                choices: ['square', 'circle', 'triangle', 'star', 'hexagon']
            },
            {
                shape: 'star',
                webImage: 'images/web-star-gap.png',
                filledImage: 'images/web-star-filled.png',
                instruction: "Find the star",
                choices: ['square', 'circle', 'triangle', 'star', 'hexagon']
            },
            {
                shape: 'hexagon',
                webImage: 'images/web-hexagon-gap.png',
                filledImage: 'images/web-hexagon-filled.png',
                instruction: "Find the hexagon",
                choices: ['square', 'circle', 'triangle', 'star', 'hexagon']
            }
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
            if (currentShapeIndex >= shapeGameData.length) currentShapeIndex = 0;
            loadShapeProblem();
        }

        function loadShapeProblem() {
            currentShapeProblem = shapeGameData[currentShapeIndex];
            webDisplay.style.backgroundImage = `url('${currentShapeProblem.webImage}')`;
            if (window.speakText) window.speakText(currentShapeProblem.instruction);
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
                if (window.playConfettiEffect) window.playConfettiEffect();
                if (friendlySpider) {
                    friendlySpider.classList.add('spider-bounces');
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

        // ============================================================
        // --- GAME 3: SHAPE PUZZLES ---
        // ============================================================
        const puzzleCanvasContainer = document.getElementById('shape-puzzle-canvas');
        const puzzlePrompt = document.getElementById('puzzle-prompt');
        const nextPuzzleButton = document.getElementById('next-puzzle-button');
        let puzzleStage, puzzleLayer;
        let puzzleGameInitialized = false;
        let isPuzzleLoading = false;
        let isPuzzleSolved = false;
        let puzzlePieces = [];
        let puzzleTargets = [];
        let puzzlePieceBin = {
            x: 10,
            y: 10,
            width: 180,
            height: 500
        };
        const PUZZLE_DATA = [{
                id: 'house',
                instruction: "Let's build a house!",
                silhouetteImage: 'images/puzzle-house.png',
                pieces: [{
                    id: 'roof',
                    shape: 'triangle',
                    color: '#F44336',
                    rotation: 0
                }, {
                    id: 'base',
                    shape: 'square',
                    color: '#2196F3',
                    rotation: 0
                }],
                targets: [{
                    id: 'roof',
                    shape: 'triangle',
                    x: 0.5,
                    y: 0.35,
                    size: 0.3,
                    rotation: 0
                }, {
                    id: 'base',
                    shape: 'square',
                    x: 0.5,
                    y: 0.65,
                    size: 0.25,
                    rotation: 0
                }]
            },
            {
                id: 'train',
                instruction: "Let's build a train!",
                silhouetteImage: 'images/puzzle-train.png',
                pieces: [{
                    id: 'engine',
                    shape: 'square',
                    color: '#4CAF50',
                    rotation: 0
                }, {
                    id: 'car',
                    shape: 'square',
                    color: '#FF9800',
                    rotation: 0
                }, {
                    id: 'wheel1',
                    shape: 'circle',
                    color: '#607D8B',
                    rotation: 0
                }, {
                    id: 'wheel2',
                    shape: 'circle',
                    color: '#607D8B',
                    rotation: 0
                }],
                targets: [{
                    id: 'engine',
                    shape: 'square',
                    x: 0.375,
                    y: 0.6,
                    size: 0.2,
                    rotation: 0
                }, {
                    id: 'car',
                    shape: 'square',
                    x: 0.625,
                    y: 0.6,
                    size: 0.2,
                    rotation: 0
                }, {
                    id: 'wheel1',
                    shape: 'circle',
                    x: 0.375,
                    y: 0.85,
                    size: 0.1,
                    rotation: 0
                }, {
                    id: 'wheel2',
                    shape: 'circle',
                    x: 0.625,
                    y: 0.85,
                    size: 0.1,
                    rotation: 0
                }]
            },
            {
                id: 'ice_cream',
                instruction: "Let's make an ice cream cone!",
                silhouetteImage: 'images/puzzle-ice-cream.png',
                pieces: [{
                    id: 'cone',
                    shape: 'triangle',
                    color: '#FF9800',
                    rotation: 180
                }, {
                    id: 'scoop',
                    shape: 'circle',
                    color: '#F44336',
                    rotation: 0
                }],
                targets: [{
                    id: 'cone',
                    shape: 'triangle',
                    x: 0.5,
                    y: 0.6,
                    size: 0.25,
                    rotation: 180
                }, {
                    id: 'scoop',
                    shape: 'circle',
                    x: 0.5,
                    y: 0.35,
                    size: 0.2,
                    rotation: 0
                }]
            },
            {
                id: 'sailboat',
                instruction: "Let's build a sailboat!",
                silhouetteImage: 'images/puzzle-sailboat.png',
                pieces: [{
                    id: 'hull',
                    shape: 'square',
                    color: '#2196F3',
                    rotation: 45
                }, {
                    id: 'sail',
                    shape: 'triangle',
                    color: '#FFEB3B',
                    rotation: 0
                }],
                targets: [{
                    id: 'hull',
                    shape: 'square',
                    x: 0.5,
                    y: 0.7,
                    size: 0.2,
                    rotation: 45
                }, {
                    id: 'sail',
                    shape: 'triangle',
                    x: 0.5,
                    y: 0.45,
                    size: 0.25,
                    rotation: 0
                }]
            },
            {
                id: 'fish',
                instruction: "Let's make a fish!",
                silhouetteImage: 'images/puzzle-fish.png',
                pieces: [{
                    id: 'body',
                    shape: 'circle',
                    color: '#FF9800',
                    rotation: 0
                }, {
                    id: 'tail',
                    shape: 'triangle',
                    color: '#FFEB3B',
                    rotation: -90
                }],
                targets: [{
                    id: 'body',
                    shape: 'circle',
                    x: 0.5,
                    y: 0.5,
                    size: 0.25,
                    rotation: 0
                }, {
                    id: 'tail',
                    shape: 'triangle',
                    x: 0.7,
                    y: 0.5,
                    size: 0.15,
                    rotation: -90
                }]
            }
        ];
        let currentPuzzleIndex = 0;

        function haveIntersection(r1, r2) {
            const tolerance = 30;
            return !(r1.x > r2.x + r2.width + tolerance || r1.x + r1.width < r2.x - tolerance || r1.y > r2.y + r2.height + tolerance || r1.y + r1.height < r2.y - tolerance);
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
                    requestAnimationFrame(() => {
                        if (!isPuzzleLoading && !isPuzzleSolved && puzzleStage && puzzleCanvasContainer) {
                            const newWidth = puzzleCanvasContainer.clientWidth;
                            const newHeight = puzzleCanvasContainer.clientHeight;
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
                    if (currentPuzzleIndex >= PUZZLE_DATA.length) currentPuzzleIndex = 0;
                    loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
                });
                puzzleGameInitialized = true;
            }
            shuffleArray(PUZZLE_DATA);
            currentPuzzleIndex = 0;
            loadPuzzle(PUZZLE_DATA[currentPuzzleIndex]);
        }

        function loadPuzzle(puzzleData) {
            isPuzzleSolved = false;
            isPuzzleLoading = true;
            if (!puzzleStage || !puzzleData || !puzzleData.id) {
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
            let targetArea;
            const isPortrait = stageH > stageW;
            const pieceBinPadding = 10;
            if (isPortrait) {
                const binHeight = Math.min(160, stageH * 0.25);
                puzzlePieceBin = {
                    x: pieceBinPadding,
                    y: stageH - binHeight,
                    width: stageW - (pieceBinPadding * 2),
                    height: binHeight - pieceBinPadding
                };
                targetArea = {
                    x: 0,
                    y: 0,
                    width: stageW,
                    height: stageH - binHeight - pieceBinPadding
                };
            } else {
                const binWidth = Math.min(180, stageW * 0.3);
                puzzlePieceBin = {
                    x: pieceBinPadding,
                    y: pieceBinPadding,
                    width: binWidth,
                    height: stageH - (pieceBinPadding * 2)
                };
                targetArea = {
                    x: binWidth + pieceBinPadding,
                    y: 0,
                    width: stageW - binWidth - (pieceBinPadding * 2),
                    height: stageH
                };
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
            const buildPuzzleContents = (silhouetteNode) => {
                if (silhouetteNode) {
                    puzzleLayer.add(silhouetteNode);
                    silhouetteNode.moveToBottom();
                    binRect.moveToTop();
                }
                puzzleData.targets.forEach(target => {
                    const size = Math.min(targetArea.width, targetArea.height) * target.size;
                    const targetX = silhouetteNode.x() + (silhouetteNode.width() * target.x);
                    const targetY = silhouetteNode.y() + (silhouetteNode.height() * target.y);
                    const targetShape = createKonvaShape(target.shape, targetX, targetY, size, '#999', target.rotation);
                    targetShape.fill(null);
                    targetShape.strokeEnabled(false);
                    targetShape.id(target.id);
                    targetShape.name(target.shape);
                    targetShape.listening(false);
                    puzzleLayer.add(targetShape);
                    puzzleTargets.push(targetShape);
                });
                const pieceCount = puzzleData.pieces.length;
                let pieceSize;
                if (isPortrait) {
                    let potentialSize = puzzlePieceBin.height * 0.75;
                    const numCols = Math.floor(puzzlePieceBin.width / potentialSize);
                    if (numCols < pieceCount) potentialSize = (puzzlePieceBin.width / pieceCount) * 0.9;
                    pieceSize = Math.max(30, potentialSize);
                } else {
                    let potentialSize = puzzlePieceBin.width * 0.75;
                    const numRows = Math.floor(puzzlePieceBin.height / potentialSize);
                    if (numRows < pieceCount) potentialSize = (puzzlePieceBin.height / pieceCount) * 0.9;
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
                    const pieceShape = createKonvaShape(piece.shape, pieceX, pieceY, pieceSize * 0.8, piece.color, piece.rotation);
                    pieceShape.id(piece.id);
                    pieceShape.name(piece.shape);
                    pieceShape.draggable(true);
                    pieceShape.data = {
                        originalX: pieceX,
                        originalY: pieceY
                    };
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
                if (window.speakText) window.speakText(puzzleData.instruction);
                isPuzzleLoading = false;
            };
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
                konvaShape = new Konva.Rect({ ...shapeProps,
                    width: size,
                    height: size,
                    offsetX: size / 2,
                    offsetY: size / 2
                });
            } else if (shape === 'circle') {
                konvaShape = new Konva.Circle({ ...shapeProps,
                    radius: Math.max(1, size / 2)
                });
            } else if (shape === 'triangle') {
                konvaShape = new Konva.Line({ ...shapeProps,
                    points: [0, -size / 2, -size / 2, size / 2, size / 2, size / 2],
                    closed: true
                });
            }
            return konvaShape;
        }

        function handlePieceDragEnd(e) {
            const piece = e.target;
            const pieceShapeType = piece.name();
            let validTarget = null;
            for (const target of puzzleTargets) {
                if (haveIntersection(piece.getClientRect(), target.getClientRect()) && target.name() === pieceShapeType) {
                    validTarget = target;
                    break;
                }
            }
            if (validTarget) {
                playSound(correctSound);
                piece.draggable(false);
                piece.off('dragend');
                const targetProps = {
                    x: validTarget.x(),
                    y: validTarget.y(),
                    rotation: validTarget.rotation(),
                    duration: 0.2,
                    easing: Konva.Easings.EaseInOut
                };
                const shapeType = piece.getClassName();
                if (shapeType === 'Rect') {
                    targetProps.width = validTarget.width();
                    targetProps.height = validTarget.height();
                    targetProps.offsetX = validTarget.offsetX();
                    targetProps.offsetY = validTarget.offsetY();
                } else if (shapeType === 'Circle') {
                    targetProps.radius = validTarget.radius();
                } else if (shapeType === 'Line') {
                    targetProps.points = validTarget.points();
                }
                piece.to(targetProps);
                validTarget.destroy();
                puzzleTargets = puzzleTargets.filter(t => t !== validTarget);
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
                if (window.playConfettiEffect) window.playConfettiEffect();
                if (window.speakText) window.speakText("Great job!");
                nextPuzzleButton.classList.remove('hidden');
            }
        }

        // ============================================================
        // --- GAME 4: COLOR MIXING ---
        // ============================================================

        const mixingData = [{
                color1: '#FF0000',
                name1: 'Red',
                color2: '#FFFF00',
                name2: 'Yellow',
                result: '#FF7F00',
                resultName: 'Orange',
                choices: ['#FF7F00', '#008000', '#800080']
            }, // Red + Yellow = Orange
            {
                color1: '#FFFF00',
                name1: 'Yellow',
                color2: '#0000FF',
                name2: 'Blue',
                result: '#008000',
                resultName: 'Green',
                choices: ['#008000', '#FF7F00', '#800080']
            }, // Yellow + Blue = Green
            {
                color1: '#FF0000',
                name1: 'Red',
                color2: '#0000FF',
                name2: 'Blue',
                result: '#800080',
                resultName: 'Purple',
                choices: ['#800080', '#FF7F00', '#008000']
            }, // Red + Blue = Purple
            // --- NEW COLORS ---
            {
                color1: '#FF0000',
                name1: 'Red',
                color2: '#FFFFFF',
                name2: 'White',
                result: '#FFC0CB',
                resultName: 'Pink',
                choices: ['#FFC0CB', '#808080', '#795548']
            }, // Red + White = Pink
            {
                color1: '#000000',
                name1: 'Black',
                color2: '#FFFFFF',
                name2: 'White',
                result: '#808080',
                resultName: 'Gray',
                choices: ['#808080', '#FFC0CB', '#000000']
            }, // Black + White = Gray
            {
                color1: '#008000',
                name1: 'Green',
                color2: '#FF0000',
                name2: 'Red',
                result: '#795548',
                resultName: 'Brown',
                choices: ['#795548', '#FF7F00', '#808080']
            } // Green + Red = Brown
        ];

        const mixingProblemContainer = document.getElementById('mixing-problem-container');
        const mixingChoicesContainer = document.getElementById('mixing-choices');
        let currentMixingIndex = 0;

        function startMixingGame() {
            shuffleArray(mixingData); // Randomize order
            currentMixingIndex = 0;
            loadMixingLevel(currentMixingIndex);
        }

        function loadMixingLevel(index) {
            // Just cycle through if we reach the end
            if (index >= mixingData.length) {
                currentMixingIndex = 0;
                index = 0;
            }

            const data = mixingData[index];

            // Speak the question
            if (window.speakText) window.speakText(`${data.name1} plus ${data.name2} makes...?`);

            // 1. Build Problem Area
            mixingProblemContainer.innerHTML = `
                <div class="paint-blob" style="background-color: ${data.color1};"></div>
                <div class="math-symbol">+</div>
                <div class="paint-blob" style="background-color: ${data.color2};"></div>
                <div class="math-symbol">=</div>
                <div class="question-mark-box">?</div>
            `;

            // 2. Build Choices Area
            mixingChoicesContainer.innerHTML = '';

            // Shuffle choices so position varies
            const levelChoices = shuffleArray([...data.choices]);

            levelChoices.forEach(colorCode => {
                const btn = document.createElement('button');
                btn.className = 'choice-blob-btn';

                // Create a blob inside the button
                const blob = document.createElement('div');
                blob.className = 'paint-blob';
                blob.style.backgroundColor = colorCode;

                btn.appendChild(blob);

                btn.addEventListener('click', () => {
                    handleMixingChoice(colorCode, data);
                });

                mixingChoicesContainer.appendChild(btn);
            });
        }

        function handleMixingChoice(selectedColor, data) {
            // Disable all buttons
            const allBtns = document.querySelectorAll('.choice-blob-btn');
            allBtns.forEach(b => b.disabled = true);

            if (selectedColor === data.result) {
                // Correct!
                playSound(correctSound);
                if (window.playConfettiEffect) window.playConfettiEffect();
                if (window.speakText) window.speakText(`${data.resultName}! That's right!`, () => {
                    // Next level after speech finishes + small delay
                    setTimeout(() => {
                        currentMixingIndex++;
                        loadMixingLevel(currentMixingIndex);
                    }, 1000);
                });

                // Visually fill the question mark
                const qBox = document.querySelector('.question-mark-box');
                qBox.innerHTML = ''; // Remove '?'
                qBox.style.backgroundColor = data.result;
                qBox.style.border = 'none';
                // Make it look like a blob
                qBox.style.borderRadius = '40% 60% 70% 30% / 40% 50% 60% 50%';
                qBox.classList.add('paint-blob'); // Add animation class

            } else {
                // Wrong
                playSound(wrongSound);
                if (window.speakText) window.speakText("Oops, try again!");

                // Re-enable buttons
                setTimeout(() => {
                    allBtns.forEach(b => b.disabled = false);
                }, 500);
            }
        }

    });

})();