(function() {
    const STORAGE_KEY = 'klh_sticker_inventory';

    // Define the Stickers
    const STICKERS = {
        'alpha_star': { name: 'Alphabet Star', icon: '⭐', color: '#FFD700', desc: 'Mastered the ABCs!' },
        'number_ninja': { name: 'Number Ninja', icon: '🥷', color: '#333333', desc: 'Counted like a pro!' },
        'shape_shifter': { name: 'Shape Shifter', icon: '🔷', color: '#2196F3', desc: 'Solved shape puzzles!' },
        'color_captain': { name: 'Color Captain', icon: '🎨', color: '#FF5722', desc: 'Sorted all the colors!' },
        'spelling_bee': { name: 'Spelling Bee', icon: '🐝', color: '#FFC107', desc: 'Spelled words correctly!' },
        'book_worm': { name: 'Book Worm', icon: '📚', color: '#4CAF50', desc: 'Read the sentences!' }
    };

    // Helper to get data
    function getInventory() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Create and show a popup notification dynamically
    function showNotification(stickerId) {
        const sticker = STICKERS[stickerId];
        if (!sticker) return;

        // Create overlay elements
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            animation: fadeIn 0.5s;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            background: white; padding: 30px; border-radius: 20px; text-align: center;
            border: 5px solid ${sticker.color}; box-shadow: 0 0 20px white;
            transform: scale(0.5); animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        `;

        card.innerHTML = `
            <h2 style="margin:0; font-family:'Comic Neue', sans-serif; color:#333;">New Sticker!</h2>
            <div style="font-size: 80px; margin: 20px 0;">${sticker.icon}</div>
            <h3 style="margin:0; font-family:'Comic Neue', sans-serif; color:${sticker.color};">${sticker.name}</h3>
            <p style="font-family:'Comic Neue', sans-serif; color:#666;">${sticker.desc}</p>
            <button id="close-sticker-pop" style="
                margin-top: 20px; padding: 10px 20px; font-size: 1.2em; border-radius: 10px;
                border: none; background: ${sticker.color}; color: white; cursor: pointer; font-family: 'Comic Neue', sans-serif;
            ">Awesome!</button>
        `;

        // Keyframe animations via JS
        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(styleSheet);

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Close interaction
        document.getElementById('close-sticker-pop').onclick = () => overlay.remove();

        // Sound effect
        if(window.playConfettiEffect) window.playConfettiEffect();
        if(window.speakText) window.speakText(`Wow! You earned the ${sticker.name} sticker!`);
    }

    // Public API
    window.StickerManager = {
        awardSticker: function(stickerId) {
            const inv = getInventory();
            if (!inv.includes(stickerId)) {
                inv.push(stickerId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
                showNotification(stickerId);
                return true;
            }
            return false;
        },
        getInventory: getInventory,
        getStickerData: () => STICKERS
    };
})();
