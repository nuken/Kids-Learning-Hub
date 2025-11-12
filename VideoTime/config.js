// config.js
window.VIDEO_CONFIG = {
  // Set watch time in minutes
  WATCH_TIME_MINUTES: 30,

  // Set lockout "cooldown" time in minutes
  LOCKOUT_TIME_MINUTES: 60,

  // --- MODIFICATION: Renamed to VIDEO_ITEMS and added 'type' ---
  // Add YouTube Playlist IDs (type: 'playlist')
  // or single Video IDs (type: 'video')
  VIDEO_ITEMS: [
    {
      id: "PL-i89lrKRaYSWRV0tVDGnxpCKyBr1BXV0",
      title: "Danny Go",
      type: "playlist" // Specify type
    },
    {
      id: "PL6um4JyGrH5p90k15gSR0pUQtZV8o9WnJ",
      title: "Ben and Holly",
      type: "playlist" // Specify type
    },
    {
      id: "PLEeIyWKd-HQ7LNc7DFDF8c3Qpo7Q_Kx42",
      title: "Ms Rachel",
      type: "playlist" // Specify type
    },
    // --- NEW: Examples of single videos ---
    {
      id: "rE3oDApi3XY",
      title: "Cocomelon",
      type: "video" // Specify type
    },
    {
      id: "wFoa6lUEbhw",
      title: "Peppa Pig",
      type: "video" // Specify type
    }
    // Add more playlists or single videos here
    // {
    //   id: "YOUR_VIDEO_ID_HERE",
    //   title: "My Favorite Single Video",
    //   type: "video"
    // }
  ]
};