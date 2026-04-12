# My Companion

A warm, AI-powered companion app for people who are living alone, elderly citizens, and those who want to keep the memory of a loved one alive — whether they are far away or no longer with us.

Users can create personas of their loved ones, calibrate their personality using a scientific model, paste old letters or messages, and add cherished memories. The AI then speaks in that person's voice, offering a comforting and deeply personal conversation experience.

---

## Features

- **Loved-one personas** — Create a profile for anyone: a parent, grandparent, old friend, or partner. Add a photo, define their personality, paste their old words, and build a library of shared memories.
- **Big Five (OCEAN) personality system** — Define a persona's character scientifically using five calibrated sliders: Openness, Conscientiousness, Extraversion, Agreeableness, and Emotional Sensitivity. Each slider shows a live plain-language description as you adjust it, and the scores are translated into a detailed personality brief that is baked into the AI's system prompt.
- **Streaming AI conversations** — Chat in real time with a persona powered by Claude. Responses stream token by token, just like a real conversation.
- **Memory cards** — Attach specific stories and moments to a persona so the AI can reference them naturally in conversation.
- **Conversation history** — All chats are saved locally and can be resumed at any time. Start a fresh conversation whenever you like.
- **Import & export personas** — Export any persona as a self-contained `.json` file (including photo, OCEAN scores, memories, and sample words) and share it with anyone. Importing shows a preview — name, photo, personality bars, and memory count — before adding to your collection.
- **Warm, accessible UI** — Designed with care for elderly and non-technical users. Large text, soft colours, and a simple layout.

---

## Architecture

```
myCompanion/
├── backend/                  Node.js + Express API server
│   ├── server.js             Entry point — Express setup, middleware, photo upload
│   ├── database/
│   │   └── db.js             SQLite schema + automatic OCEAN column migration
│   ├── routes/
│   │   ├── personas.js       Persona & memory CRUD, import/export endpoints
│   │   └── conversations.js  Conversation management + Claude API streaming
│   └── uploads/photos/       Uploaded persona photos (git-ignored)
│
└── frontend/                 React single-page app (Vite)
    └── src/
        ├── App.jsx            Router setup (react-router-dom v6)
        ├── api.js             Axios API client + exportPersona helper
        ├── pages/
        │   ├── Home.jsx       Persona grid, import button, import preview modal
        │   ├── NewPersona.jsx Create persona form with OCEAN sliders
        │   ├── EditPersona.jsx Edit persona + manage memory cards
        │   └── Chat.jsx       Full-screen streaming chat interface
        └── components/
            ├── Layout.jsx      Navbar + page wrapper
            ├── PersonaCard.jsx Persona card with avatar, export/edit/delete actions
            └── OceanSliders.jsx Big Five personality sliders with live descriptions
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

### 1. Big Five (OCEAN) personality profile
The user calibrates five personality dimensions using sliders (0–100). These are translated into a precise, trait-by-trait narrative that Claude uses as the psychological backbone for the entire conversation:

| Trait | Low end | High end |
|---|---|---|
| **Openness** | Practical, conventional | Imaginative, curious |
| **Conscientiousness** | Spontaneous, flexible | Organised, diligent |
| **Extraversion** | Reserved, introspective | Outgoing, expressive |
| **Agreeableness** | Frank, direct | Warm, compassionate |
| **Emotional Sensitivity** | Calm, steady | Heartfelt, expressive |

For example, a score of 85 on Agreeableness becomes: *"Deeply warm and compassionate — always puts others first; extraordinarily gentle and kind in every word and action."* These descriptions directly shape how Claude chooses words, expresses care, and reacts emotionally.

### 2. Personal notes
Free-form text for anything the sliders can't capture — quirks, favourite phrases, habits, or anything that made them uniquely themselves.

### 3. Sample words, letters, and past conversations
Actual words the user pastes in — texts, letters, emails. The model uses these to mirror the persona's natural voice and phrasing.

### 4. Memory cards
Specific stories and shared moments the AI can reference naturally during conversation.

All of this context is sent to Claude Opus 4.6 along with the full conversation history. Responses stream back via Server-Sent Events (SSE), displaying token by token as they arrive.

---

## Import & Export

Personas are fully portable. Every export is a self-contained `.json` file that includes:

- Name, relationship, personal notes, and sample words
- All five OCEAN personality scores
- All memory cards
- The persona's photo (embedded as a base64 data URL)

This makes it easy to share a persona with a family member, back one up, or restore it on another device. The import flow shows a preview — photo, name, personality bar chart, and memory count — before anything is added to your collection.

Exported files from before the OCEAN feature was introduced import cleanly; missing scores default to `50` (moderate).

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
