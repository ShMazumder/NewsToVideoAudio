# 📰 News Recorder

An automated tool that visits a list of news websites, reads out the headlines using AI-generated voices, and creates a screen recording of the entire browsing session.

Perfect for generating daily news roundup videos automatically!

---

## 🚀 Features

- **Visit multiple news websites** using Puppeteer.
- **Text-to-Speech (TTS)** narration of news content using Google Cloud Text-to-Speech.
- **Screen recording** of browsing + narration using Puppeteer Screen Recorder.
- **Scheduled daily recording** with `node-cron`.
- **Local server** to serve the output or manage recordings (optional).

---

## 🧰 Tech Stack

- **Node.js**
- **Puppeteer**: Headless browser automation
- **puppeteer-screen-recorder**: Recording the browser sessions
- **@google-cloud/text-to-speech**: News readout with AI voice
- **Express.js**: For serving files (optional)
- **node-cron**: For daily scheduling
- **fs-extra**: For file handling

---

## 📦 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/news-recorder.git
   cd news-recorder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google Cloud credentials for Text-to-Speech:
   - Create a Google Cloud project.
   - Enable Text-to-Speech API.
   - Download your JSON credentials file.
   - Set the environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/credentials.json"
     ```

4. Configure your list of news websites in `news-recorder.js`.

---

## ⚙️ Usage

- **Start only the recorder**:
  ```bash
  npm run start
  ```

- **Start recorder and server in parallel (dev mode)**:
  ```bash
  npm run dev
  ```

- **Start the Express server manually**:
  ```bash
  npm run server
  ```

The recordings will be saved inside the project folder.

---

## 📋 Project Scripts

| Script        | Purpose                               |
|---------------|---------------------------------------|
| `start`       | Runs `news-recorder.js` only           |
| `server`      | Runs `server.js` to serve recordings   |
| `dev`         | Runs both recorder and server together |

---

## ✨ Future Enhancements

- Add OCR support to extract embedded text images.
- Add video upload automation (YouTube/TikTok).
- Enhance voice with different tones (breaking, sports, etc.)
- Add a simple dashboard to manage daily news records.

---

## 🛡 License

This project is licensed under the [ISC License](LICENSE).

---

> Built with ❤️ and a love for automating the news! 🚀
