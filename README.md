# 🤖 MyChat — Multilingual AI Voice & Text Chatbot

A full-featured, multilingual AI chatbot with **voice input**, **text chat**, and **text-to-speech** — built with pure HTML, CSS, and JavaScript (no frameworks, no backend).

> **Live Demo:** [mychat0400.vercel.app](https://mychat0400.vercel.app)

---

## ✨ Features

### 🔐 Login System
- Full-screen login page with animated gradient orbs and glassmorphism card
- Username & password validation (accepts any non-empty credentials)
- User session persisted in `localStorage`
- Smooth page transition to chat on login

### 💬 AI Text Chat
- Real-time chat with **Sarvam AI** (`sarvam-m` model)
- Typing indicator with animated dots while AI responds
- Auto-generated chat titles from the first message
- `<think>` reasoning blocks automatically stripped from responses
- Markdown bold markers (`**`) cleaned from output
- System prompt enforces short, concise replies (1–3 sentences)

### 🎤 Voice Input (Speech-to-Text)
- Tap the microphone button to record voice
- Full-screen voice overlay with real-time **circular audio visualizer** (canvas-based)
- Live recording timer (`MM:SS`)
- Audio sent to Sarvam AI STT (`saaras:v3` model) for transcription
- Auto-language detection (`language_code: "unknown"`)
- Transcribed text auto-sends as a message

### 🔊 Text-to-Speech (TTS)
- Every AI response has a **speaker button** to hear it aloud
- Uses Sarvam AI TTS (`bulbul:v3` model)
- **10 Indian languages** supported:
  - Hindi, English, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi
- Language selectable from the sidebar dropdown

### 📁 Chat History
- Multiple chat sessions stored per user in `localStorage`
- Sidebar with searchable chat list
- Create new chats with the `+` button
- Delete current chat with the trash icon
- Active chat highlighted in the sidebar
- Auto-switches to a new chat if current is deleted

### 🎨 Theme System
- **Dark mode** (default) — deep navy/black with purple accents
- **Light mode** — clean white/gray
- Toggle via sun/moon button in sidebar
- Theme preference saved in `localStorage`

### 📱 Responsive Design
- Fully responsive for desktop, tablet, and mobile
- Collapsible sidebar (slide-in on mobile)
- `100dvh` viewport height for proper mobile browser support
- `env(safe-area-inset-bottom)` for iPhone notch/home bar
- `viewport-fit=cover` enabled

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Structure  | HTML5 (semantic)                  |
| Styling    | Vanilla CSS (custom properties)   |
| Logic      | Vanilla JavaScript (ES6+ IIFE)    |
| AI API     | [Sarvam AI](https://sarvam.ai)    |
| Font       | [Inter](https://fonts.google.com) |
| Hosting    | Vercel (static)                   |

**Zero dependencies. No frameworks. No build step.**

---

## 📂 Project Structure

```
Mychat/
├── index.html      # Complete HTML structure (login + chat page)
├── style.css       # All styles — design tokens, components, responsive
├── script.js       # Full app logic — auth, chat, API, voice, storage
└── README.md       # This file
```

---

## 🔌 API Integration

All API calls go to **Sarvam AI** (`https://api.sarvam.ai`).

### Endpoints Used

| Endpoint                    | Purpose             | Model       |
|-----------------------------|---------------------|-------------|
| `POST /v1/chat/completions` | Text chat with AI   | `sarvam-m`  |
| `POST /speech-to-text`      | Voice → transcript  | `saaras:v3` |
| `POST /text-to-speech`      | AI reply → audio    | `bulbul:v3` |

### Authentication
```
Header: "api-subscription-key": "YOUR_API_KEY"
```

### How to Get an API Key
1. Go to [sarvam.ai](https://www.sarvam.ai)
2. Sign up and create a project
3. Copy your API subscription key
4. Paste it in `script.js` line 7:
   ```javascript
   const API_KEY = 'your_key_here';
   ```

---

## 🚀 How to Run Locally

1. **Clone the repo:**
   ```bash
   git clone https://github.com/RIKASH04/Mychat.git
   cd Mychat
   ```

2. **Add your API key** in `script.js` (line 7)

3. **Serve the files** (any static server works):
   ```bash
   npx serve .
   ```
   Or simply open `index.html` in your browser.

4. **Login** with any username & password → start chatting!

---

## 🎯 UI/UX Highlights

- **Glassmorphism** login card with animated floating orbs
- **Gradient accents** — purple/indigo theme throughout
- **Smooth animations** — fade-in pages, slide-in messages, pulsing mic
- **Circular audio visualizer** — real-time frequency bars in a ring during recording
- **Typing dots** — bouncing animation while AI is thinking
- **Copy & Listen** action buttons on every AI response
- **Auto-resize** textarea that grows with content
- **Inter font** — modern, clean typography

---

## 📋 Key Design Decisions

| Decision                        | Reason                                                  |
|---------------------------------|---------------------------------------------------------|
| Single-page with no framework   | Lightweight, fast, no build step needed                 |
| 3-file split (HTML/CSS/JS)      | Clean separation of concerns while staying simple       |
| `localStorage` for persistence  | No backend needed — all data stays on user's device     |
| `100dvh` instead of `100vh`     | Fixes mobile browser viewport issues                   |
| IIFE wrapper in JS              | Avoids polluting global scope                           |
| `<think>` tag stripping         | Sarvam model includes reasoning — hidden from user      |
| System prompt: "1–3 sentences"  | Keeps AI replies short and conversational               |

---

## 🐛 Known Limitations

- **No real authentication** — any username/password works (client-side only)
- **API key is exposed** in client-side JavaScript (fine for demos, not production)
- **No server-side storage** — clearing browser data deletes all chats
- **TTS limited to 500 chars** — long responses are truncated before speech
- **WebM recording format** — depends on browser MediaRecorder support

---

## 📜 License

This project is open source and available for personal and educational use.

---

**Built with ❤️ by [RIKASH04](https://github.com/RIKASH04)**
