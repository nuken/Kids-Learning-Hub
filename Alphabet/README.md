# Ad-Free Alphabet Learner

This is a simple, ad-free web application designed to help young children learn the alphabet. It was created as a personal project for grandkids to have a focused, interactive learning tool without ads or other distractions.

The app is built with plain HTML, CSS, and JavaScript, using the browser's built-in **Web Speech API** for audio.

## Features

* **Interactive Grid:** A-Z letters in a large, touch-friendly grid.
* **Touch & Drag:** Children can tap or drag their finger across the letters.
* **Random Colors:** Each new letter touched lights up with a random bright color.
* **Text-to-Speech:** Says the letter's name.
* **Speech Toggle:** A button lets you switch between hearing just the "Letter Name" (like "Bee") or both the "Name + Phonics" (like "Bee... buh").
* **Custom Background:** A color palette at the top to change the page's background color.
* **Fully Responsive:** Designed to work on phones and tablets in both portrait and landscape mode.
* **100% Ad-Free:** No tracking, no ads, no in-app purchases.

## Getting Started

### 1. Download the Code

You can download this project's code directly from GitHub:

1.  Click the green **<> Code** button at the top-right of the project file list.
2.  Select **Download ZIP** from the dropdown menu.
3.  Unzip the downloaded file on your computer. You will have a folder containing `index.html`, `style.css`, and `script.js`.

### 2. How to Run This App

This application uses the Web Speech API (for speaking the letters), which has security rules that stop it from working if you just open the `index.html` file directly from your folder (i.e., `file:///...`).

**To use the app, you must run it on a local server.**

A very simple way to do this is:

* **Using Simple Web Server:** You can download a simple graphical tool like [**Simple Web Server**](https://simplewebserver.org/). Just open the app, point it to your project folder, and click "Start."
* **Using VS Code:** If you are using the Visual Studio Code editor, you can install the **"Live Server"** extension. Once installed, just right-click on the `index.html` file and choose "Open with Live Server."
* **Using Python:** If you have Python installed, open a terminal or command prompt, `cd` into the project's folder, and run: `python -m http.server` (or `python3 -m http.server` on some systems). Then open your browser and go to `http://localhost:8000`.

## Platform & Testing

This application was designed and tested primarily for **tablets (e.g., iPad) and mobile phones (iOS/Android)**. It is highly responsive and works in both portrait and landscape modes on these devices.

It also functions on a desktop browser (like Chrome or Edge), but please be aware:

* The touch-and-drag feature works by holding the mouse button down while moving.
* The text-to-speech voice quality is **entirely dependent on your operating system**. It will sound great on iOS/Android, but may sound more robotic on a Windows PC, as it uses the default built-in Windows voices.

