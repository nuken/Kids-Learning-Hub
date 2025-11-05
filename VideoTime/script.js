document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIG & STATE ---
    const config = window.VIDEO_CONFIG || {};
    const WATCH_LIMIT_SECONDS = (config.WATCH_TIME_MINUTES || 30) * 60;
    const LOCKOUT_MINUTES = config.LOCKOUT_TIME_MINUTES || 60;
    // --- MODIFICATION: Read from new VIDEO_ITEMS array ---
    const VIDEO_ITEMS = config.VIDEO_ITEMS || [];
    // --- END MODIFICATION ---

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
    const homeBtn = document.querySelector('.home-btn-subpage');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');

    // --- 3. CORE LOGIC ---
    
    function checkLockoutState() {
        const lockoutUntil = localStorage.getItem('videoLockoutUntil');
        if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
            showLockoutScreen(parseInt(lockoutUntil));
        } else {
            localStorage.removeItem('videoLockoutUntil'); 
            showPlaylistMenu();
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function getWatchTime() {
        return parseInt(localStorage.getItem('videoWatchTime') || '0');
    }

    function saveWatchTime(seconds) {
        localStorage.setItem('videoWatchTime', seconds.toString());
    }

    function updateTimerDisplay() {
        const remainingTime = WATCH_LIMIT_SECONDS - getWatchTime();
        timerDisplay.textContent = `Time Left: ${formatTime(remainingTime)}`;
    }

    function startWatchTimer() {
        if (watchTimerInterval) return; 
        
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

    function stopWatchTimer() {
        clearInterval(watchTimerInterval);
        watchTimerInterval = null;
    }

    function triggerLockout() {
        stopWatchTimer();
        if (player) {
            player.stopVideo();
        }

        const lockoutEndTime = Date.now() + (LOCKOUT_MINUTES * 60 * 1000);
        localStorage.setItem('videoLockoutUntil', lockoutEndTime.toString());
        localStorage.setItem('videoWatchTime', '0'); 
        
        showLockoutScreen(lockoutEndTime);
    }

    // --- 4. UI SCREEN MANAGEMENT ---
    
    function showScreen(screenElement) {
        [playlistMenu, playerContainer, lockoutScreen].forEach(el => {
            el.classList.remove('visible');
        });
        
        if (screenElement) {
            screenElement.classList.add('visible');
            
            if (screenElement.id === 'playlist-menu') {
                homeBtn.style.display = 'block'; 
            } else {
                homeBtn.style.display = 'none';
            }
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
                setTimeout(showPlaylistMenu, 2000); 
                return;
            }
            
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            lockoutTimerDisplay.textContent = `Try again in: ${formatTime(remainingSeconds)}`;
        }
        
        clearInterval(lockoutTimerInterval);
        lockoutTimerInterval = setInterval(updateLockoutTimer, 1000);
        updateLockoutTimer(); 
    }

    function showPlaylistMenu() {
        showScreen(playlistMenu);
        if (player) {
            if (player && typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
        }
        stopWatchTimer();
        clearInterval(lockoutTimerInterval);
    }

    function showPlayer() {
        showScreen(playerContainer);
        updateTimerDisplay();
    }

    // --- 5. YOUTUBE API ---

    function loadYouTubeAPI() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = function() {
        // API is ready
    }

    // --- MODIFICATION: Renamed to loadMedia and handles item object ---
    /**
     * Creates or updates the YouTube player to load a video or playlist
     * @param {object} item - The item to play, e.g. { id: '...', title: '...', type: 'video' }
     */
    function loadMedia(item) {
        // Make sure the API is loaded
        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            setTimeout(() => loadMedia(item), 100);
            return;
        }

        if (player) {
            // If player already exists, just load the new media
            if (item.type === 'playlist') {
                player.loadPlaylist({
                    list: item.id,
                    listType: 'playlist'
                });
            } else { // 'video'
                player.loadVideoById(item.id);
            }
        } else {
            // Create a new player
            let playerConfig = {
                height: '100%',
                width: '100%',
                playerVars: {
                    'playsinline': 1,
                    'modestbranding': 1,
                    'rel': 0 // Don't show related videos
                    'controls': 0
                },
                events: {
                    'onStateChange': onPlayerStateChange
                }
            };

            // Configure the player differently for playlists vs. single videos
            if (item.type === 'playlist') {
                playerConfig.playerVars['listType'] = 'playlist';
                playerConfig.playerVars['list'] = item.id;
            } else { // 'video'
                playerConfig['videoId'] = item.id;
            }
            
            player = new YT.Player('player', playerConfig);
        }
        showPlayer();
    }
    // --- END MODIFICATION ---


    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            startWatchTimer();
        } else {
            stopWatchTimer();
        }
    }

    // --- 6. INITIALIZATION ---

    function initialize() {
        // --- MODIFICATION: Use VIDEO_ITEMS and pass full object to loadMedia ---
        if (VIDEO_ITEMS.length === 0) {
            playlistButtonsContainer.innerHTML = "<p>No playlists configured.</p>";
        } else {
            VIDEO_ITEMS.forEach(item => { // Use 'item'
                const btn = document.createElement('a');
                btn.href = "#";
                btn.className = "menu-btn"; 
                btn.textContent = item.title;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadMedia(item); // Pass the whole item object
                });
                playlistButtonsContainer.appendChild(btn);
            });
        }
        // --- END MODIFICATION ---
        
        backToMenuBtn.addEventListener('click', showPlaylistMenu);
        playBtn.addEventListener('click', () => {
            if (player && typeof player.playVideo === 'function') {
                player.playVideo();
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (player && typeof player.pauseVideo === 'function') {
                player.pauseVideo();
            }
        });
        loadYouTubeAPI();
        checkLockoutState();
    }
    
    // Start the app
    initialize();
});
