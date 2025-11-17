# Kids Learning Hub

This project is a simple, ad-free, and fully responsive web portal that hosts five separate learning applications for children: **Alphabet Fun**, **Numbers Fun**, a **Coloring Book**, **Let's Spell**, and **Shapes & Colors**. A sixth app, **Video Time**, is also included and accessible via a link on the main hub.

The main `index.html` file acts as a central hub, allowing a child to easily launch any of the five main apps. Each application has been modified with a non-intrusive "Home" button, allowing for easy navigation back to this main menu.

The applications are designed to work perfectly on desktops, tablets (iPad, Android), and phones in both portrait and landscape modes.

## Play Online & Install

You can play the latest version of these apps directly in your browser at:

👉 **[https://klhub.org](https://klhub.org)**

### Install as an App (PWA)
This website is a **Progressive Web App (PWA)**. This means you can install it directly onto your device for a fullscreen, app-like experience without going through an app store.

* **iOS (Safari):** Tap the "Share" button (square with arrow) in the toolbar, then scroll down and tap **"Add to Home Screen"**.
* **Android (Chrome):** Tap the menu icon (three dots) in the top right, then tap **"Install App"** or **"Add to Home Screen"**.
* **Desktop (Chrome/Edge):** Look for the install icon in the address bar (usually a computer screen with a down arrow) and click it.

## The Applications

### 1. Alphabet Fun

* **Location:** `/Alphabet/`
* **Description:** A classic alphabet learner where children can tap or drag their finger across letters (A-Z) to see them light up with color and hear their names spoken.
* **Features:**
    * **Level 1 (Explore):** Interactive touch-and-drag grid to explore letters and sounds.
    * **Level 2 (Find the Letter):** A gamified mode where the app asks the child to find specific letters ("Find the letter A").
    * High-quality, platform-specific text-to-speech (Web Speech API).
    * Controls to toggle between letter names ("Bee") and words ("Boy"), or switch between uppercase and lowercase letters.

### 2. Numbers Fun

* **Location:** `/Number/`
* **Description:** A multi-game app focused on basic number skills, now with difficulty levels.
* **Features:**
    * **Two Difficulty Levels:** Toggle between **Level 1** (Numbers 1-10, Addition) and **Level 2** (Numbers 10-20, Subtraction).
    * **Counting Game:** Tap the correct number of items (e.g., "Tap 3 ducks").
    * **Tracing Game:** Trace numbers on the screen using a finger or mouse.
    * **Patterns Game:** A "What comes next?" game to teach number sequences.
    * **Egg-Math Game:** A visual math game. Level 1 focuses on **Addition** (combining eggs), while Level 2 introduces **Subtraction** (taking eggs away).

### 3. Coloring Book

* **Location:** `/Coloring/`
* **Description:** A full-featured digital coloring book with 10 different images.
* **Features:**
    * **Brush Tool:** A free-hand brush with an adjustable size slider.
    * **Fill Tool:** A smart "flood-fill" tool to color enclosed areas with a single click.
    * **Full Palette:** 16 colors to choose from.
    * **Utility Tools:** Includes Undo, Clear, and Save (download as JPEG) functions.
    * Powered by the Konva.js canvas library for high performance.

### 4. Let's Spell

* **Location:** `/Spelling/`
* **Description:** A multi-game app focused on spelling and reading skills.
* **Features:**
    * **Two Difficulty Levels:** **Level 1** provides only the correct letters. **Level 2** adds extra "distractor" letters to challenge the child.
    * **Spell the Word:** Arrange letters to spell the word matching the image (e.g., C-A-T).
    * **Missing Letter:** Find the single letter missing from a word.
    * **Spell the Color:** Identify and spell the name of the color shown.
    * **Read & Match (NEW):** Read a simple sentence (e.g., "The dog is happy") and match it to the correct picture.

### 5. Shapes & Colors

* **Location:** `/ShapesAndColors/`
* **Description:** A multi-game app focused on shapes, colors, and logic.
* **Features:**
    * **Leaf Color Sort:** Drag and drop colored leaves (red, green, brown, yellow) into the correct baskets.
    * **Spider's Shape Web:** Help the spider by finding the correct shape (circle, square, star, etc.) to fix its web.
    * **Shape Puzzles:** A drag-and-drop puzzle game to build pictures (like a house or a train) by fitting shapes into outlines.
    * **Color Mixing (NEW):** Learn how colors combine by mixing virtual paint blobs (e.g., Red + Yellow = Orange).

### 6. Video Time

* **Location:** `/VideoTime/`
* **Description:** A simple, timer-controlled portal for watching curated, parent-approved videos (Accessible via the play button link on the main hub).
* **Features:**
    * Loads pre-configured YouTube playlists or single videos set in `config.js`.
    * Tracks watch time against a set limit (e.g., 30 minutes).
    * Includes a lockout "cooldown" period after time is up (e.g., 60 minutes) to help manage screen time.

## How to Download Code

If you want to run the code locally or modify it:

1.  Click the green **"<> Code"** button near the top of the GitHub file list.
2.  Select **"Download ZIP"** from the dropdown menu.
3.  Unzip the file on your computer. You will have the main folder containing all the project files.

## How to Run Locally

Because the applications use features (like JavaScript Modules and the Web Speech API) that are restricted by browser security, you **must run this project from a local web server.**

Do not just open the `index.html` file directly from your folder (i.e., `file:///...`).

### Simple Local Server Method (Recommended)

1.  **Using VS Code:**
    * Install the **"Live Server"** extension.
    * Right-click on the main `index.html` file and choose "Open with Live Server".

2.  **Using Python:**
    * Open a terminal or command prompt in the main project folder.
    * Run the command: `python -m http.server` (or `python3 -m http.server` on Mac/Linux).
    * Open your browser and go to `http://localhost:8000`.

3.  **Using Simple Web Server:**
    * Download and run the app from [SimpleWebServer.org](https://simplewebserver.org/).

## Technologies Used

* **HTML5**
* **CSS3** (with responsive media queries)
* **JavaScript (ES6+)**
* **Web Speech API:** Provides the text-to-speech for the Alphabet and Number apps.
* **Konva.js:** A 2D HTML5 canvas library used for the Coloring Book, Number Tracing, and Leaf Sort games.
* **YouTube iFrame API:** Used by the Video Time app to embed and control videos.
* **Font Awesome:** Used for icons (like the "Home" button).
