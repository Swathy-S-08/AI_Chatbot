# Jarvis Web

Jarvis Web is a Gemini-powered chatbot that runs inside a website. It supports typed input, microphone input, speech-to-text, text-to-speech, conversation logging, and a clean space-themed interface.

This project was built for the task: **"Why Use Jarvis? Build One."**

## Features

- Text input through a chat box
- Voice input through the microphone
- Speech-to-text transcript preview before sending
- Gemini API response generation
- Text responses displayed in the website
- Text-to-speech responses using the browser speech engine
- Voice on/off toggle
- Light/dark theme toggle
- Clear chat button
- Copy button for Jarvis responses
- Download conversation log button
- Timestamped conversation logging in `logs/conversations.txt`
- Express backend to keep the Gemini API key private

## Project Structure

```text
jarvis-web/
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── logs/
│   └── conversations.txt
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

## Requirements

- Node.js LTS
- npm
- Gemini API key from Google AI Studio
- Chrome or Edge for microphone support

## Setup

Clone or download the project, then open the folder in VS Code.

Install dependencies:

```powershell
npm install
```

Create a `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=3000
```

Do not commit `.env` to GitHub. It contains your private API key.

## Getting A Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Open the API keys page.
4. Click **Create API key**.
5. Copy the key.
6. Paste it into your local `.env` file as `GEMINI_API_KEY`.

## Run The App

Start the server:

```powershell
npm start
```

Open the website:

```text
http://localhost:3000
```

For voice input, allow microphone permission in the browser.

## How To Test

Text input:

1. Type a message.
2. Click **Send**.
3. Jarvis should reply in the chat.

Voice input:

1. Click the microphone button.
2. Speak a message.
3. The converted text appears in the input box.
4. Edit it if needed.
5. Click **Send**.

Text-to-speech:

1. Keep **Voice On** enabled.
2. Send a message.
3. Jarvis should speak the reply aloud.

Conversation logging:

1. Send a message and wait for Jarvis to reply.
2. Open `logs/conversations.txt`.
3. The conversation should be saved with timestamps.

Download log:

1. Click **Download Log**.
2. The browser downloads `jarvis-conversations.txt`.

## Demo Checklist

For the demonstration video, show:

1. Text input and response.
2. Microphone input.
3. Speech-to-text preview in the input box.
4. Text-to-speech response.
5. Voice on/off toggle.
6. Light/dark theme toggle.
7. Copy response button.
8. Clear chat button.
9. Download conversation log button.
10. `logs/conversations.txt` showing timestamped conversation history.

## Useful Commands

Run normally:

```powershell
npm start
```

Run in development mode:

```powershell
npm run dev
```

Stop the server:

```powershell
Ctrl + C
```

Check backend health:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

## Notes

- The Gemini API key is used only on the backend in `server.js`.
- The frontend never directly receives the API key.
- If Gemini returns a `503 high demand` error, try again later or switch the model in `.env`.
- Conversation logs are ignored by Git by default to avoid uploading private chats.
