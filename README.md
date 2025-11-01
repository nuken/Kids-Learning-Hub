
# Kids Learning App Collection

This project is a simple, ad-free, and fully responsive web portal that hosts three separate learning applications for children: **Alphabet Fun**, **Numbers Fun**, and a **Coloring Book**.

The main `index.html` file acts as a central hub, allowing a child to easily launch any of the three apps. Each application has been modified with a non-intrusive "Home" button, allowing for easy navigation back to this main menu.

The applications are designed to work perfectly on desktops, tablets (iPad, Android), and phones in both portrait and landscape modes.

## The Applications

### 1. Alphabet Fun

* **Location:** `/Alphabet/`
* **Description:** A classic alphabet learner where children can tap or drag their finger across letters (A-Z) to see them light up with color and hear their names spoken.
* **Features:**
    * Interactive touch and-drag grid.
    * Randomized colors for a fun visual effect.
    * High-quality, platform-specific text-to-speech (Web Speech API) for clear audio on PC, iOS, and Android.
    * Controls to reset the board or toggle phonics/letter sounds.

### 2. Numbers Fun

* **Location:** `/Number/`
* **Description:** A multi-game app focused on basic number skills.
* **Features:**
    * **Counting Game:** Tap the correct number of items on the screen (e.g., "Tap 3 ducks").
    * **Tracing Game:** Uses the Konva.js canvas to let children trace numbers 1-9.
    * **Patterns Game:** A simple "What comes next?" game to teach basic number sequences.
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

## Project Structure

The project is organized to keep each application separate and modular.

```

/Main/
├── Alphabet/           (Contains all files for Alphabet Fun)
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── Coloring/           (Contains all files for Coloring Book)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── images/
│
├── Number/             (Contains all files for Numbers Fun)
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── index.html          (The main start page/portal)
├── style.css           (Styles for the main start page)
└── README.md           (This file)

```

## How to Download

If you are on the GitHub page for this project:

1.  Click the green **"<> Code"** button near the top of the file list.
2.  Select **"Download ZIP"** from the dropdown menu.
3.  Unzip the file on your computer. You will have the `Main` folder containing all the project files.

## How to Run This Project

Because the applications use features (like JavaScript Modules in the Coloring Book) that are restricted by browser security, you **must run this project from a local web server.**

Do not just open the `index.html` file directly from your folder (i.e., `file:///...`).

### Simple Local Server Method (Recommended)

1.  **Using VS Code:**
    * Install the **"Live Server"** extension.
    * Right-click on the main `Main/index.html` file and choose "Open with Live Server".

2.  **Using Python:**
    * Open a terminal or command prompt in the `Main` folder.
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
* **Font Awesome:** Used for icons (like the "Home" button).
