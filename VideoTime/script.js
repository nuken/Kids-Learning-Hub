document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIG & STATE ---
    const config = window.VIDEO_CONFIG || {};
    const WATCH_LIMIT_SECONDS = (config.WATCH_TIME_MINUTES || 30) * 60;
    const LOCKOUT_MINUTES = config.LOCKOUT_TIME_MINUTES || 60;
    const PLAYLISTS = config.PLAYLISTS || [];

    let player; // The YouTube Player object
    let watchTimerInterval; // Interval for tracking watch time
    let lockoutTimerInterval; // Interval for lockout countdown

    // --- 2. GET ELEMENTS ---
    const playlistMenu = document.getElementById('playlist-menu');
    const playerContainer = document.getElementById('player-container');
    const lockoutScreen = document.getElementById('lockout-screen');
    const playlistButtonsContainer = document.getElementById('playlist-buttons');
    const timerDisplay = document.getElementById('timer-display');
    const lockoutTimerDisplay = document.getElementById('lockout-timer-display');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    // --- 3. CORE LOGIC ---
    
    /**
     * This is the first function that runs.
     * It checks if the user is locked out.
     */
    function checkLockoutState() {
        const lockoutUntil = localStorage.getItem('videoLockoutUntil');
        if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
            // User is LOCKED OUT
            showLockoutScreen(parseInt(lockoutUntil));
        } else {
            // User is NOT locked out
            localStorage.removeItem('videoLockoutUntil'); // Clear any old key
            showPlaylistMenu();
        }
    }

    /**
     * Formats seconds into MM:SS
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    /**
     * Gets the current accumulated watch time from localStorage
     */
    function getWatchTime() {
        return parseInt(localStorage.getItem('videoWatchTime') || '0');
    }

    /**
     * Saves the current accumulated watch time
     */
    function saveWatchTime(seconds) {
        localStorage.setItem('videoWatchTime', seconds.toString());
    }

    /**
     * Updates the "Time Left: MM:SS" display
     */
    function updateTimerDisplay() {
        const remainingTime = WATCH_LIMIT_SECONDS - getWatchTime();
        timerDisplay.textContent = `Time Left: ${formatTime(remainingTime)}`;
    }

    /**
     * Starts the 1-second interval to track playing time
     */
    function startWatchTimer() {
        if (watchTimerInterval) return; // Already running
        
        watchTimerInterval = setInterval(() => {
            let currentWatchTime = getWatchTime();
            currentWatchTime++;
            saveWatchTime(currentWatchTime);
            updateTimerDisplay();

            if (currentWatchTime >= WATCH_LIMIT_SECONDS) {
                triggerLockout();
            }
        }, 1000);
    }

    /**
     * Stops the 1-second interval (when paused, buffered, or ended)
     */
    function stopWatchTimer() {
        clearInterval(watchTimerInterval);
        watchTimerInterval = null;
    }

    /**
     * Called when watch time runs out
     */
    function triggerLockout() {
        stopWatchTimer();
        if (player) {
            player.stopVideo();
        }

        const lockoutEndTime = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
        localStorage.setItem('videoLockoutUntil', lockoutEndTime.toString());
        localStorage.setItem('videoWatchTime', '0'); // Reset watch time
        
        showLockoutScreen(lockoutEndTime);
    }

    // --- 4. UI SCREEN MANAGEMENT ---
    
    function showScreen(screenElement) {
        // Hide all screens
        [playlistMenu, playerContainer, lockoutScreen].forEach(el => {
            el.classList.remove('visible');
        });
        // Show the target screen
        if (screenElement) {
            screenElement.classList.add('visible');
        }
    }

    function showLockoutScreen(lockoutEndTime) {
        showScreen(lockoutScreen);
        
        function updateLockoutTimer() {
            const now = Date.now();
            const remainingMs = lockoutEndTime - now;
            
            if (remainingMs <= 0) {
                clearInterval(lockoutTimerInterval);
                lockoutTimerDisplay.textContent = "You can watch again!";
                localStorage.removeItem('videoLockoutUntil');
                // Wait a moment, then show menu
                setTimeout(showPlaylistMenu, 2000); 
                return;
            }
            
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            lockoutTimerDisplay.textContent = `Try again in: ${formatTime(remainingSeconds)}`;
        }
        
        clearInterval(lockoutTimerInterval);
        lockoutTimerInterval = setInterval(updateLockoutTimer, 1000);
        updateLockoutTimer(); // Run once immediately
    }

    function showPlaylistMenu() {
        showScreen(playlistMenu);
        // Stop video if it's playing in the background
        if (player) {
            // Check if player and stopVideo function exist before calling
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
        }
        // Stop timers
        stopWatchTimer();
        clearInterval(lockoutTimerInterval);
    }

    function showPlayer() {
        showScreen(playerContainer);
        updateTimerDisplay();
    }

    // --- 5. YOUTUBE API ---

    /**
     * This function loads the YouTube IFrame Player API script
     */
    function loadYouTubeAPI() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    /**
     * This global function is called by the YouTube API script when it's ready.
     */
    window.onYouTubeIframeAPIReady = function() {
        // API is ready
    }

    /**
     * Creates the YouTube player instance
     */
    function createPlayer(playlistId) {
        // Make sure the API is loaded
        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            // API isn't loaded yet, wait a moment and try again
            setTimeout(() => createPlayer(playlistId), 100);
            return;
        }

        if (player) {
            // If player already exists, just load the new playlist
            player.loadPlaylist({
                list: playlistId,
                listType: 'playlist'
            });
        } else {
            // Create a new player
            player = new YT.Player('player', {
                height: '100%',
                width: '100%',
                playerVars: {
                    'playsinline': 1,
                    'modestbranding': 1,
                    'rel': 0, // Don't show related videos
                    'listType': 'playlist',
                    'list': playlistId
                },
                events: {
                    'onStateChange': onPlayerStateChange
                }
            });
        }
        showPlayer();
    }

    /**
* This function is called by the API whenever the player's state changes
* (e.g., playing, paused, ended).
*/
    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            // Video is playing
            startWatchTimer();
        } else {
            // Video is paused, ended, buffering, etc.
            stopWatchTimer();
        }
    }

    // --- 6. INITIALIZATION ---

    function initialize() {
        // Create playlist buttons from config
        if (PLAYLISTS.length === 0) {
            playlistButtonsContainer.innerHTML = "<p>No playlists configured.</p>";
        } else {
            PLAYLISTS.forEach(playlist => {
                const btn = document.createElement('a');
                btn.href = "#";
                btn.className = "menu-btn"; // Use a class from root style.css
                btn.textContent = playlist.title;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    createPlayer(playlist.id);
                });
                playlistButtonsContainer.appendChild(btn);
            });
        }
        
        // Add listener for the "Back to Menu" button
        backToMenuBtn.addEventListener('click', showPlaylistMenu);

        // Load the YouTube API
        loadYouTubeAPI();

        // Check if user is locked out or not
        checkLockoutState();
    }
    
    // Start the app
    initialize();
});