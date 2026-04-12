# My Companion

A warm, AI-powered companion app for people who are living alone, elderly citizens, and those who want to keep the memory of a loved one alive — whether they are far away or no longer with us.

Users create rich profiles of their loved ones — calibrating personality scientifically, recording their world in detail, and pasting their actual words. The AI speaks in that person's voice, grounded entirely in what is known, never inventing.

---

## Features

- **Loved-one personas** — Create a profile for anyone: a parent, grandparent, old friend, or partner. Add a photo, relationship label, personal notes, and sample words.
- **Big Five (OCEAN) personality system** — Calibrate personality scientifically with five sliders (0–100). Each slider shows a live plain-language description as you adjust it. The scores become a detailed psychological brief inside the AI's system prompt.
- **Life & world context** — Record where they live, places they regularly visit, interests and hobbies (toggle-pill selector), likes, dislikes, daily routine, and other factual details. The AI uses only what is recorded — it never invents details about their life.
- **Likes & dislikes** — Free-text tag inputs for specific preferences. Warm-brown tags for likes, blush-rose for dislikes. Both feed directly into the grounding section of the system prompt.
- **Family & connections** — Add the people both of you know (family, friends, colleagues), with dual relationship labels — how the persona knew them and how you know them. The AI references these names naturally in conversation.
- **Memory cards** — Attach specific stories and moments so the AI can bring them up naturally, the way a real person would.
- **Live events** — Inject real-world context mid-conversation with a single tap: time of day, weather, how you're feeling, occasions, life moments, or a custom event. The persona reacts in character immediately.
- **Streaming AI conversations** — Responses stream token by token via Server-Sent Events, just like a real conversation.
- **Conversation history** — All chats are saved and can be resumed. Start a fresh conversation any time.
- **Import & export personas** — Export any persona as a fully self-contained `.json` file — photo, OCEAN scores, life context, likes, dislikes, relations, memories, and sample words all included. The import preview shows personality bars, location, interests, and counts before you confirm.
- **Warm, accessible UI** — Designed for elderly and non-technical users. Soft warm palette, serif typography, clear layout.

---

## Architecture

```
myCompanion/
├── nixpacks.toml             Railway build configuration
├── backend/                  Node.js + Express API server
│   ├── server.js             Entry point — middleware, photo upload, serves built frontend
│   ├── database/
│   │   └── db.js             SQLite schema + automatic migration for all new columns
│   ├── routes/
│   │   ├── personas.js       Full CRUD, memory/relation/import/export endpoints
│   │   └── conversations.js  Streaming chat + live events endpoint + system prompt builder
│   └── uploads/photos/       Uploaded persona photos (git-ignored)
│
└── frontend/                 React SPA (Vite)
    └── src/
        ├── App.jsx            Router (react-router-dom v6)
        ├── api.js             Axios client + export trigger helper
        ├── pages/
        │   ├── Home.jsx       Persona grid, import button, full import preview modal
        │   ├── NewPersona.jsx Create persona — all sections
        │   ├── EditPersona.jsx Edit persona + live memory/relation management
        │   └── Chat.jsx       Full-screen streaming chat with live event injection
        └── components/
            ├── Layout.jsx          Navbar + page wrapper
            ├── PersonaCard.jsx     Card with avatar, export/edit/delete actions
            ├── OceanSliders.jsx    Big Five sliders with gradient fill + live descriptions
            ├── LifeContextEditor.jsx  Location, places, interests, likes, dislikes, routine
            ├── RelationsEditor.jsx    Family & connections editor
            └── EventPanel.jsx      Live event panel — presets + custom input
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
| **Database** | SQLite (better-sqlite3) | Local, zero-config, synchronous — no database server needed |
| **File uploads** | Multer | Simple multipart form handling for persona photos |
| **AI model** | Claude Opus 4.6 | Anthropic's most expressive model — nuanced, emotionally warm responses |
| **AI streaming** | Anthropic Node.js SDK + SSE | Token-by-token streaming for a natural, real-time feel |
| **Deployment** | Railway + Nixpacks | Single-service deploy; persistent volume for SQLite and uploads |
| **Environment** | dotenv | API key and config management |

---

## How the AI Persona Works

Every message triggers a system prompt assembled from all layers of the persona's profile.

### 1. Big Five (OCEAN) personality profile
Five calibrated scores (0–100) are translated into a trait-by-trait narrative that shapes the AI's entire voice:

| Trait | Low end | High end |
|---|---|---|
| **Openness** | Practical, conventional | Imaginative, curious |
| **Conscientiousness** | Spontaneous, flexible | Organised, diligent |
| **Extraversion** | Reserved, introspective | Outgoing, expressive |
| **Agreeableness** | Frank, direct | Warm, compassionate |
| **Emotional Sensitivity** | Calm, steady | Heartfelt, expressive |

A score of 85 on Agreeableness becomes: *"Deeply warm and compassionate — always puts others first; extraordinarily gentle and kind in every word and action."*

### 2. Life & world context
Known facts assembled into a grounded brief:
- Where they live and places they regularly visit
- Interests and hobbies (from the toggle-pill selector)
- **Things they like** and **things they dislike** (free-text tags)
- Typical daily routine
- Other known details (occupation, beliefs, habits)

### 3. Family & connections
People both the persona and the user know, with dual relationship labels. The AI references them naturally — "How's your brother John getting on?" — without being told.

### 4. Personal notes & sample words
Free-form notes for quirks and habits, plus pasted letters, texts, or emails. The model mirrors the persona's natural phrasing from these samples.

### 5. Memory cards
Specific stories and shared moments the AI can bring up naturally during conversation.

### 6. Live events
Mid-conversation context injections (e.g. *"It's Christmas morning"*, *"I just got promoted"*) stored as `[Event: ...]` messages. The persona reacts immediately in character.

### Grounding rule
Every system prompt ends with an explicit instruction:
> *Only ever reference places, events, opinions, or experiences explicitly recorded in this profile. Do NOT make up details. If something comes up that you don't know, respond the way a real person would: "I can't quite remember" or "you'd know better than me."*

This prevents hallucinated details and keeps the conversation feeling real rather than fictional.

---

## Import & Export

Personas are fully portable. Every export is a self-contained `.json` file that includes:

| Field | Included |
|---|---|
| Name, relationship, personal notes, sample words | ✅ |
| OCEAN personality scores (5 values) | ✅ |
| Life context (location, places, routine, notes) | ✅ |
| Interests, likes, dislikes | ✅ |
| Family & connections (with dual relationship labels) | ✅ |
| Memory cards | ✅ |
| Photo (base64 data URL) | ✅ |

The import preview shows the personality bar chart, location, interests, memory count, and connection count before confirming. Older exported files missing newer fields import cleanly — missing values default gracefully.

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

## Deploying to Railway

The app is configured for a single-service Railway deployment (backend serves the built frontend).

1. Push to GitHub
2. Create a new Railway project → Deploy from GitHub repo
3. Add a **Volume** mounted at `/app/data` (keeps the SQLite database and photos across restarts)
4. Set environment variables:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `DATA_DIR` | `/app/data` |
| `NODE_ENV` | `production` |

Railway detects `nixpacks.toml` automatically and handles the build and start steps.

---

## Data & Privacy

All data — personas, memories, conversations, photos, and all profile details — is stored **locally** in a SQLite database (`backend/data/companion.db`) and a local uploads folder. Nothing is sent to any external server except conversation messages, which are sent to the Anthropic API to generate responses.
