// config.js
window.VIDEO_CONFIG = {
  // Set watch time in minutes
  WATCH_TIME_MINUTES: 30,

  // Set lockout "cooldown" time in minutes
  LOCKOUT_TIME_MINUTES: 60,

  // Add the YouTube Playlist IDs you want to allow
  // You find these in the playlist's URL
  // Example: https://www.youtube.com/playlist?list=PLrk81j1wBLCs0mU4_skvl5dD4_YmD-mJk
  // The ID is "PLrk81j1wBLCs0mU4_skvl5dD4_YmD-mJk"
  PLAYLISTS: [
    {
      id: "PL-i89lrKRaYSWRV0tVDGnxpCKyBr1BXV0",
      title: "Danny Go"
    },
    {
      id: "PL6um4JyGrH5p90k15gSR0pUQtZV8o9WnJ",
      title: "Ben and Holly"
    },
    {
      id: "PLEeIyWKd-HQ7LNc7DFDF8c3Qpo7Q_Kx42",
      title: "Ms Rachel"
    }
    // Add more playlists here
    // {
    //   id: "YOUR_PLAYLIST_ID_HERE",
    //   title: "My Favorite Videos"
    // }
  ]
};