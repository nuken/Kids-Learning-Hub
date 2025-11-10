// /nuken/kids-learning-hub/Kids-Learning-Hub-test/ShapesAndColors/script.js

(function() {

    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. NAVIGATION ---
        // (Logic copied from Number/script.js and Spelling/script.js)
        const screens = document.querySelectorAll('.game-screen');
        const menuButtons = {
            'start-leaf-sort-btn': 'leaf-sort-game',
            'start-shape-web-btn': 'shape-web-game'
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
        // (These sound files will need to be created and added to the /sounds/ folder)
        const correctSound = new Audio('sounds/correct.mp3');
        const wrongSound = new Audio('sounds/wrong.mp3');

        // Pre-cache instruction sounds
        const sounds = {
            'sort-leaves': new Audio('sounds/sort-the-leaves.mp3'),
            'find-square': new Audio('sounds/find-the-square.mp3'),
            'find-circle': new Audio('sounds/find-the-circle.mp3'),
            'find-triangle': new Audio('sounds/find-the-triangle.mp3')
        };

        /**
         * Plays a sound.
         * (Copied from Spelling/script.js)
         */
        async function playSound(sound) {
            sound.currentTime = 0; // Rewind to start
            try {
                await sound.play();
            } catch (err) {
                // Log the error but don't crash the app
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


        // --- 3. GAME 1: LEAF COLOR SORT ---
        const leafPileContainer = document.getElementById('leaf-pile-container');
        const basketContainer = document.getElementById('basket-container');
        const leafColors = ['green', 'red', 'yellow', 'brown'];
        let totalLeaves = 0;
        let sortedLeaves = 0;

        function startLeafSortGame() {
            leafPileContainer.innerHTML = '';
            basketContainer.innerHTML = '';
            sortedLeaves = 0;
            totalLeaves = 0;

            let leavesToCreate = [];
            const numPerColor = 3; // 3 leaves of each color
            
            for (const color of leafColors) {
                for (let i = 0; i < numPerColor; i++) {
                    leavesToCreate.push(color);
                }
            }
            totalLeaves = leavesToCreate.length;
            shuffleArray(leavesToCreate);

            // Create and append leaves
            leavesToCreate.forEach((color, index) => {
                const leaf = document.createElement('div');
                leaf.className = `leaf ${color}`;
                leaf.id = `leaf-${index}`; // ID is needed for dataTransfer
                leaf.draggable = true;
                leaf.dataset.color = color;
                
                // Random position within the pile container
                leaf.style.left = `${Math.floor(Math.random() * 80) + 10}%`; 
                leaf.style.top = `${Math.floor(Math.random() * 80) + 10}%`;
                
                leaf.addEventListener('dragstart', handleDragStart);
                leafPileContainer.appendChild(leaf);
            });

            // Create baskets
            leafColors.forEach(color => {
                const basket = document.createElement('div');
                basket.className = `basket ${color}`;
                basket.dataset.color = color;
                
                basket.addEventListener('dragover', handleDragOver);
                basket.addEventListener('drop', handleDrop);
                basketContainer.appendChild(basket);
            });

            playSound(sounds['sort-leaves']);
        }

        function handleDragStart(e) {
            e.dataTransfer.setData('text/plain', e.target.id);
            e.dataTransfer.setData('color', e.target.dataset.color);
        }

        function handleDragOver(e) {
            e.preventDefault(); // Allow dropping
        }

        function handleDrop(e) {
            e.preventDefault();
            const draggedColor = e.dataTransfer.getData('color');
            const basketColor = e.currentTarget.dataset.color;

            if (draggedColor === basketColor) {
                playSound(correctSound);
                const leafId = e.dataTransfer.getData('text/plain');
                const leafElement = document.getElementById(leafId);
                if (leafElement) {
                    leafElement.style.display = 'none'; // Hide the leaf
                }
                sortedLeaves++;
                checkLeafSortWin();
            } else {
                playSound(wrongSound);
                // Shake the basket
                if (!e.currentTarget.classList.contains('shake')) {
                    e.currentTarget.classList.add('shake');
                    setTimeout(() => e.currentTarget.classList.remove('shake'), 500);
                }
            }
        }

        function checkLeafSortWin() {
            if (sortedLeaves >= totalLeaves) {
                // (Optional: Play a "win" sound)
                // Restart game after a short delay
                setTimeout(startLeafSortGame, 1500);
            }
        }


        // --- 4. GAME 2: SPIDER'S SHAPE WEB ---
        // (Modeled after Spelling/script.js 'Missing Letter' game)

        // (These images and sounds will need to be created and added)
        const shapeGameData = [
            { shape: 'square', webImage: 'images/web-square-gap.png', filledImage: 'images/web-square-filled.png', instruction: sounds['find-square'], choices: ['square', 'circle', 'triangle'] },
            { shape: 'circle', webImage: 'images/web-circle-gap.png', filledImage: 'images/web-circle-filled.png', instruction: sounds['find-circle'], choices: ['square', 'circle', 'triangle'] },
            { shape: 'triangle', webImage: 'images/web-triangle-gap.png', filledImage: 'images/web-triangle-filled.png', instruction: sounds['find-triangle'], choices: ['square', 'circle', 'triangle', 'star'] }
            // Add more shapes here (e.g., star, rectangle)
        ];
        
        const webDisplay = document.getElementById('spider-web-display');
        const shapeChoicesContainer = document.getElementById('shape-choices-container');
        const nextShapeButton = document.getElementById('next-shape-button');

        let currentShapeProblem = {};
        let shapeGameInitialized = false;
        let currentShapeIndex = 0;

        function startShapeGame() {
            // This part runs every time to reset the game
            shuffleArray(shapeGameData);
            currentShapeIndex = 0;
            loadShapeProblem();

            // This part runs only once
            if (shapeGameInitialized) return;
            nextShapeButton.addEventListener('click', loadNextShapeProblem);
            shapeGameInitialized = true;
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
            
            // 1. Set web image and play instruction
            webDisplay.style.backgroundImage = `url('${currentShapeProblem.webImage}')`;
            playSound(currentShapeProblem.instruction);

            // 2. Clear old choices and hide 'Next' button
            shapeChoicesContainer.innerHTML = '';
            nextShapeButton.classList.add('hidden');
            
            // 3. Create new choices
            const choices = shuffleArray([...currentShapeProblem.choices]);
            choices.forEach(shapeName => {
                const button = document.createElement('button');
                // Re-use Spelling app's class names for consistent styling
                button.className = 'letter-button shape-choice-btn'; 
                button.dataset.shape = shapeName;
                button.innerHTML = `<img src="images/shape-${shapeName}.png" alt="${shapeName}">`;
                button.disabled = false; // Ensure enabled
                
                button.addEventListener('click', handleShapeClick);
                shapeChoicesContainer.appendChild(button);
            });
        }

        function handleShapeClick(e) {
            const clickedButton = e.currentTarget;
            const clickedShape = clickedButton.dataset.shape;
            
            // Disable all buttons to prevent double-clicks
            shapeChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);

            if (clickedShape === currentShapeProblem.shape) {
                playSound(correctSound);
                
                // Show the filled web
                webDisplay.style.backgroundImage = `url('${currentShapeProblem.filledImage}')`;
                
                // Show "Next" button (re-use pulse animation from Spelling/style.css)
                nextShapeButton.classList.remove('hidden');

            } else {
                // WRONG!
                playSound(wrongSound);

                // Shake the web display (requires .shake class in style.css)
                webDisplay.classList.add('shake');
                setTimeout(() => {
                    webDisplay.classList.remove('shake');
                    // Re-enable buttons so the user can try again
                    shapeChoicesContainer.querySelectorAll('button').forEach(btn => {
                        if (btn !== clickedButton) {
                            btn.disabled = false;
                        } else {
                            // Keep the wrong one disabled to encourage
                            // trying a different answer, or just re-enable all
                            btn.disabled = false; 
                        }
                    });
                }, 500);
            }
        }

    });

})();