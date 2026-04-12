# My Companion

A warm, AI-powered companion app for people who are living alone, elderly citizens, and those who want to keep the memory of a loved one alive — whether they are far away or no longer with us.

Users can create personas of their loved ones, describe their personality, paste old letters or messages, and add cherished memories. The AI then speaks in that person's voice, offering a comforting and deeply personal conversation experience.

---

## Features

- **Loved-one personas** — Create a profile for anyone: a parent, grandparent, old friend, or partner. Add a photo, describe their personality, paste their old words, and build a library of shared memories.
- **Streaming AI conversations** — Chat in real time with a persona powered by Claude. Responses stream token by token, just like a real conversation.
- **Memory cards** — Attach specific stories and moments to a persona so the AI can reference them naturally in conversation.
- **Conversation history** — All chats are saved locally and can be resumed at any time. Start a fresh conversation whenever you like.
- **Warm, accessible UI** — Designed with care for elderly and non-technical users. Large text, soft colours, and a simple layout.

---

## Architecture

```
myCompanion/
├── backend/                  Node.js + Express API server
│   ├── server.js             Entry point — Express setup, middleware, photo upload
│   ├── database/
│   │   └── db.js             SQLite schema initialisation (better-sqlite3)
│   ├── routes/
│   │   ├── personas.js       Persona & memory card CRUD endpoints
│   │   └── conversations.js  Conversation management + Claude API streaming
│   └── uploads/photos/       Uploaded persona photos (git-ignored)
│
└── frontend/                 React single-page app (Vite)
    └── src/
        ├── App.jsx            Router setup (react-router-dom v6)
        ├── api.js             Axios API client
        ├── pages/
        │   ├── Home.jsx       Persona grid + empty state
        │   ├── NewPersona.jsx Create persona form with photo upload
        │   ├── EditPersona.jsx Edit persona + manage memory cards
        │   └── Chat.jsx       Full-screen streaming chat interface
        └── components/
            ├── Layout.jsx     Navbar + page wrapper
            └── PersonaCard.jsx Persona card with avatar, name, chat button
```

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | React 18 + Vite | Fast dev experience, component model ideal for chat UI |
| **Routing** | react-router-dom v6 | Simple declarative routing for SPA |
| **Styling** | Tailwind CSS v3 | Utility-first; custom warm colour palette defined in config |
| **Icons** | lucide-react | Lightweight, consistent icon set |
| **HTTP client** | Axios | Clean API with interceptors; streaming via native Fetch API |
| **Backend framework** | Express.js | Minimal, flexible Node.js server |
| **Database** | SQLite (better-sqlite3) | Local, zero-config, synchronous — perfect for a personal app |
| **File uploads** | Multer | Simple multipart form handling for persona photos |
| **AI model** | Claude Opus 4.6 | Anthropic's most expressive model — nuanced, emotionally warm responses |
| **AI streaming** | Anthropic Node.js SDK + SSE | Token-by-token streaming over Server-Sent Events for a natural feel |
| **Environment** | dotenv | API key and config management |

---

## How the AI Persona Works

When a user sends a message, the backend builds a system prompt from the persona's data:

1. **Personality description** — how they spoke, what they cared about
2. **Past conversations / letters** — actual words they used, pasted by the user
3. **Memory cards** — specific stories and moments the AI can reference

This context is sent to Claude Opus 4.6 along with the full conversation history. The model speaks as the persona — warmly, personally, and with continuity across the conversation.

Responses stream back to the frontend via Server-Sent Events (SSE), displaying token by token as they arrive.

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/settings/api-keys) with credits

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/sachithp/myCompanion.git
cd myCompanion

# 2. Install backend dependencies
cd backend && npm install

# 3. Add your API key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# 4. Install frontend dependencies
cd ../frontend && npm install
```

### Run

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** and add your first companion.

---

## Data & Privacy

All data — personas, memories, conversations, and photos — is stored **locally on your machine** in a SQLite database (`backend/data/companion.db`) and a local uploads folder. Nothing is sent to any external server except the conversation content, which is sent to the Anthropic API to generate responses.
