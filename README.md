# Kids Learning App Collection

This project is a simple, ad-free, and fully responsive web portal that hosts five separate learning applications for children: **Alphabet Fun**, **Numbers Fun**, a **Coloring Book**, **Let's Spell**, and **Video Time**.

The main `index.html` file acts as a central hub, allowing a child to easily launch any of the five apps. Each application has been modified with a non-intrusive "Home" button, allowing for easy navigation back to this main menu.

The applications are designed to work perfectly on desktops, tablets (iPad, Android), and phones in both portrait and landscape modes.

## The Applications

### 1. Alphabet Fun

* **Location:** `/Alphabet/`
* **Description:** A classic alphabet learner where children can tap or drag their finger across letters (A-Z) to see them light up with color and hear their names spoken. **Now includes a new "Level 2" find-the-letter game.**
* **Features:**
    * Interactive touch-and-drag grid (Level 1) and a "Find the Letter" game (Level 2).
    * High-quality, platform-specific text-to-speech (Web Speech API) for clear audio on PC, iOS, and Android.
    * Controls to toggle between letter names ("Bee") and words ("Boy"), or switch between uppercase and lowercase letters.

### 2. Numbers Fun

* **Location:** `/Number/`
* **Description:** A multi-game app focused on basic number skills.
* **Features:**
    * **Counting Game:** Tap the correct number of items on the screen (e.g., "Tap 3 ducks").
    * **Tracing Game:** Uses the Konva.js canvas to let children trace numbers 1-9.
    * **Patterns Game:** A simple "What comes next?" game to teach basic number sequences.
    * **Egg-dition Game:** A visual addition game where kids combine two groups of eggs to find the total sum.
    * All games include high-quality speech for instructions and feedback.

### 3. Coloring Book

* **Location:** `/Coloring/`
* **Description:** A full-featured digital coloring book with 10 different images.
* **Features:**
    * **Brush Tool:** A free-hand brush with an adjustable size slider.
    * **Fill Tool:** A smart "flood-fill" tool to color enclosed areas with one tap.
    * **Full Palette:** 16 colors to choose from.
    * **Utility Tools:** Includes Undo, Clear, and Save (download as JPEG) functions.
    * Powered by the Konva.js canvas library for high performance.

### 4. Let's Spell

* **Location:** `/Spelling/`
* **Description:** A multi-game app focused on basic spelling skills.
* **Features:**
    * **Spell the Word:** Spell a word (like 'cat' or 'dog') by choosing letters in the correct order to match an image.
    * **Missing Letter:** Find and select the single missing letter from a word (e.g., 'C_T').
    * **Spell the Color:** Spell the name of a color (e.g., 'red', 'blue') shown in a box.
    * Provides immediate audio feedback for correct or incorrect letter choices.

### 5. Video Time

* **Location:** `/VideoTime/`
* **Description:** A simple, timer-controlled portal for watching curated, parent-approved videos.
* **Features:**
    * Loads pre-configured YouTube playlists or single videos set in `config.js`.
    * Tracks watch time against a set limit (e.g., 30 minutes).
    * Includes a lockout "cooldown" period after time is up (e.g., 60 minutes) to help manage screen time.
    * A "Back" button allows returning to the main video menu.

## How to Download

If you are on the GitHub page for this project:

1.  Click the green **"<> Code"** button near the top of the file list.
2.  Select **"Download ZIP"** from the dropdown menu.
3.  Unzip the file on your computer. You will have the main folder containing all the project files.

## How to Run This Project

Because the applications use features (like JavaScript Modules in the Coloring Book) that are restricted by browser security, you **must run this project from a local web server.**

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
* **Konva.js:** A 2D HTML5 canvas library used for the Coloring Book and the Number Tracing game.
* **YouTube iFrame API:** Used by the Video Time app to embed and control videos.
* **Font Awesome:** Used for icons (like the "Home" button).
