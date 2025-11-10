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


        // --- 3. GAME 1: LEAF COLOR SORT (Tap-to-Sort logic) ---
        const leafPileContainer = document.getElementById('leaf-pile-container');
        const basketContainer = document.getElementById('basket-container');
        const leafColors = ['green', 'red', 'yellow', 'brown'];
        let selectedLeaf = null; // Tracks the currently selected leaf

        function startLeafSortGame() {
            leafPileContainer.innerHTML = '';
            basketContainer.innerHTML = '';
            selectedLeaf = null; // Reset selected leaf

            let leavesToCreate = [];
            const numPerColor = 3; // 3 leaves of each color

            for (const color of leafColors) {
                for (let i = 0; i < numPerColor; i++) {
                    leavesToCreate.push(color);
                }
            }
            shuffleArray(leavesToCreate);

            // Create and append leaves
            leavesToCreate.forEach((color, index) => {
                const leaf = document.createElement('div');
                leaf.className = `leaf ${color}`;
                leaf.id = `leaf-${index}`;
                leaf.dataset.color = color;

                // Random position within the pile container
                leaf.style.left = `${Math.floor(Math.random() * 80) + 10}%`;
                leaf.style.top = `${Math.floor(Math.random() * 80) + 10}%`;

                leaf.addEventListener('click', handleLeafClick);
                leafPileContainer.appendChild(leaf);
            });

            // Create baskets
            leafColors.forEach(color => {
                const basket = document.createElement('div');
                basket.className = `basket ${color}`;
                basket.dataset.color = color;

                basket.addEventListener('click', handleBasketClick);
                basketContainer.appendChild(basket);
            });

            playSound(sounds['sort-leaves']);
        }

        function handleLeafClick(e) {
            // If a leaf is already selected, unselect it
            if (selectedLeaf) {
                selectedLeaf.classList.remove('selected');
            }

            // Select the new leaf
            selectedLeaf = e.currentTarget;
            selectedLeaf.classList.add('selected');
        }

        function handleBasketClick(e) {
            if (!selectedLeaf) return; // Do nothing if no leaf is selected

            const basket = e.currentTarget;
            const basketColor = basket.dataset.color;
            const leafColor = selectedLeaf.dataset.color;

            if (leafColor === basketColor) {
                playSound(correctSound);

                // Move the leaf visually into the basket
                basket.appendChild(selectedLeaf);
                selectedLeaf.classList.remove('selected');
                selectedLeaf.style.position = 'static'; // Clear positioning
                selectedLeaf.removeEventListener('click', handleLeafClick); // Make un-clickable

                selectedLeaf = null; // Clear selection
                checkLeafSortWin();
            } else {
                playSound(wrongSound);
                // Shake the wrong basket
                if (!basket.classList.contains('shake')) {
                    basket.classList.add('shake');
                    setTimeout(() => basket.classList.remove('shake'), 500);
                }
                // Unselect the leaf
                selectedLeaf.classList.remove('selected');
                selectedLeaf = null;
            }
        }

        function checkLeafSortWin() {
            // If the leaf pile is empty, restart the game
            if (leafPileContainer.children.length === 0) {
                setTimeout(startLeafSortGame, 1500);
            }
        }


        // --- 4. GAME 2: SPIDER'S SHAPE WEB ---
        // (Modeled after Spelling/script.js 'Missing Letter' game)

        const shapeGameData = [
            { shape: 'square', webImage: 'images/web-square-gap.png', filledImage: 'images/web-square-filled.png', instruction: sounds['find-square'], choices: ['square', 'circle', 'triangle'] },
            { shape: 'circle', webImage: 'images/web-circle-gap.png', filledImage: 'images/web-circle-filled.png', instruction: sounds['find-circle'], choices: ['square', 'circle', 'triangle'] },
            { shape: 'triangle', webImage: 'images/web-triangle-gap.png', filledImage: 'images/web-triangle-filled.png', instruction: sounds['find-triangle'], choices: ['square', 'circle', 'triangle', 'star'] }
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
                // Re-use Spelling app's class name
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

                // Show "Next" button
                nextShapeButton.classList.remove('hidden');

            } else {
                // WRONG!
                playSound(wrongSound);

                // Shake the web display
                webDisplay.classList.add('shake');
                setTimeout(() => {
                    webDisplay.classList.remove('shake');
                    // Re-enable buttons so the user can try again
                    shapeChoicesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
                }, 500);
            }
        }

    });

})();
