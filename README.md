# My Companion

A warm, AI-powered companion app for people who are living alone, elderly citizens, and those who want to keep the memory of a loved one alive — whether they are far away or no longer with us.

Users create rich profiles of their loved ones — calibrating personality scientifically, recording their world in detail, pasting their actual words, and attaching real reference material. The AI speaks in that person's voice, grounded entirely in what is known, never inventing.

---

## Features

- **Loved-one personas** — Create a profile for anyone: a parent, grandparent, old friend, or partner. Add a photo, relationship label, personal notes, and sample words.
- **Big Five (OCEAN) personality system** — Calibrate personality scientifically with five sliders (0–100). Each slider shows a live plain-language description as you adjust it. The scores become a detailed psychological brief inside the AI's system prompt.
- **Life & world context** — Record where they live, places they regularly visit, interests and hobbies (toggle-pill selector), likes, dislikes, daily routine, and other factual details. The AI uses only what is recorded — it never invents details about their life.
- **Family & connections** — Add the people both of you know (family, friends, colleagues), with dual relationship labels — how the persona knew them and how you know them. The AI references these names naturally in conversation.
- **Memory cards** — Attach specific stories and moments so the AI can bring them up naturally, the way a real person would.
- **Knowledge & references** — Upload `.md` or `.txt` files (Wikipedia exports, interview transcripts, blog posts) or paste web links. The server fetches and stores the page text. The AI draws on these facts in conversation without inventing beyond them.
- **Mood mode selector** — Set the persona's current emotional state mid-conversation: Normal, Happy, Nostalgic, Tired, Sad, Worried, Excited, Unwell, or Busy. The AI immediately adjusts its tone, energy, and behaviour to match. The mode persists across page reloads and is stored per conversation.
- **Mood behaviours** — Define exactly how *this specific person* expresses each mood. Goes beyond the generic mood description — e.g. *"when tired, she still asks about the kids but keeps sentences short and mentions her back is hurting"*. Layered on top of the OCEAN personality for uniquely personal responses.
- **Live events** — Inject real-world context mid-conversation with a single tap: time of day, weather, how you're feeling, occasions, life moments, or a custom event. The persona reacts in character immediately.
- **Streaming AI conversations** — Responses stream token by token via Server-Sent Events, just like a real conversation.
- **Conversation history** — All chats are saved and can be resumed. Start a fresh conversation any time.
- **Import & export personas** — Export any persona as a fully self-contained `.json` file — photo, OCEAN scores, life context, likes, dislikes, relations, memories, knowledge sources, mood behaviours, and sample words all included. Import on any instance with a full preview before confirming.
- **Warm, accessible UI** — Designed for elderly and non-technical users. Soft warm palette, serif typography, clear layout.

---

## Architecture

```mermaid
flowchart TB
    User((User))

    subgraph FE[Frontend - React SPA]
        subgraph FE_UI[Pages and Components]
            HOME[Home]
            FORM[New / Edit Persona]
            CHAT[Chat]
        end
        APIJS[api.js]
    end

    subgraph BE[Backend - Node.js / Express]
        SRV[server.js]
        subgraph RT[Routes]
            PR[personas.js]
            CR[conversations.js]
        end
        subgraph SP[System Prompt Builder]
            SP1[1. OCEAN] --> SP2[2. Mood Mode] --> SP3[3. Life Context] --> SP4[4. Knowledge] --> SP5[5. Relations] --> SP6[6. Memories]
        end
        DBJS[db.js]
    end

    subgraph STORE[Storage]
        DB[(companion.db)]
        FS[(uploads / photos)]
    end

    subgraph EXT[External Services]
        ANT[Anthropic API]
        WEB[Web fetch]
    end

    User --> FE_UI
    FE_UI --> APIJS
    APIJS -->|HTTP REST| SRV
    SRV --> PR
    SRV --> CR
    PR --> DBJS --> DB
    CR --> DBJS
    SRV --> FS
    CR --> SP
    CR -->|SDK + prompt| ANT
    ANT -->|token stream| CR
    CR -->|SSE| APIJS
    PR -->|fetch url| WEB
```

### File tree

```
myCompanion/
├── nixpacks.toml             Railway build configuration
├── backend/                  Node.js + Express API server
│   ├── server.js             Entry point — middleware, photo upload, serves built frontend
│   ├── database/
│   │   └── db.js             SQLite schema + automatic migration loop for all new tables/columns
│   ├── routes/
│   │   ├── personas.js       Full CRUD, memory/relation/knowledge/mode-behavior/import/export endpoints
│   │   └── conversations.js  Streaming chat + live events + system prompt builder (all layers)
│   └── uploads/photos/       Uploaded persona photos (git-ignored)
│
└── frontend/                 React SPA (Vite)
    └── src/
        ├── App.jsx            Router (react-router-dom v6)
        ├── api.js             Axios client + all API helpers
        ├── utils/
        │   └── modes.js       Shared mood mode definitions (emoji, label, hint, generic description)
        ├── pages/
        │   ├── Home.jsx       Persona grid, import button, full import preview modal
        │   ├── NewPersona.jsx Create persona — all sections, staged drafts
        │   ├── EditPersona.jsx Edit persona + live memory/relation/knowledge management
        │   └── Chat.jsx       Full-screen streaming chat, mood picker, live event injection
        └── components/
            ├── Layout.jsx              Navbar + page wrapper
            ├── PersonaCard.jsx         Card with avatar, export/edit/delete actions
            ├── OceanSliders.jsx        Big Five sliders with gradient fill + live descriptions
            ├── LifeContextEditor.jsx   Location, places, interests, likes, dislikes, routine
            ├── RelationsEditor.jsx     Family & connections editor
            ├── KnowledgeEditor.jsx     Upload .md/.txt files or fetch web links as reference material
            ├── ModeBehaviorsEditor.jsx Per-mood custom behavior definitions (accordion list)
            └── EventPanel.jsx          Live event panel — presets + custom input
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

Every message triggers a system prompt assembled from all layers of the persona's profile. Each layer narrows the AI's voice further — from broad personality down to the exact mood of that specific person on that specific day.

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

### 2. Mood mode
The current emotional state of the persona, selected from the chat header and persisted per conversation. When a mode is active, the system prompt receives a specific directive about energy level, verbosity, and behaviour — e.g. for **Tired**: *"responses are slower, gentler, and shorter than usual — still loving, but quieter."*

Available modes: Normal · Happy 😊 · Nostalgic 💭 · Tired 😴 · Sad 😢 · Worried 😟 · Excited 🎉 · Unwell 🤒 · Busy ⚡

### 3. Mood behaviours (persona-specific)
For each mood, you can describe exactly how *this person* expresses that state. This is layered on top of the generic mood description. For example:

> **Tired** (generic): *low energy, quieter, shorter responses*
> **Tired** (this persona): *"still asks about the kids but keeps sentences short; mentions her back is hurting"*

The result is a response that sounds like a tired version of *them*, not just a generic tired person. Applies to all 9 modes including Normal, where it acts as a general behavioral baseline.

### 4. Life & world context
Known facts assembled into a grounded brief:
- Where they live and places they regularly visit
- Interests and hobbies (from the toggle-pill selector)
- Things they like and things they dislike (free-text tags)
- Typical daily routine
- Other known details (occupation, beliefs, habits)

### 5. Knowledge & references
Uploaded documents and fetched web pages are stored as text and injected into the system prompt as a factual reference section. The AI can draw on biographical details, published writing, interviews, or any structured text — but is still bound by the grounding rule not to invent beyond what is written.

### 6. Family & connections
People both the persona and the user know, with dual relationship labels. The AI references them naturally — "How's your brother John getting on?" — without being told.

### 7. Personal notes & sample words
Free-form notes for quirks and habits, plus pasted letters, texts, or emails. The model mirrors the persona's natural phrasing from these samples.

### 8. Memory cards
Specific stories and shared moments the AI can bring up naturally during conversation.

### 9. Live events
Mid-conversation context injections (e.g. *"It's Christmas morning"*, *"I just got promoted"*) stored as `[Event: ...]` messages. The persona reacts immediately in character.

### Grounding rule
Every system prompt ends with an explicit instruction:
> *Only ever reference places, events, opinions, or experiences explicitly recorded in this profile. Do NOT make up details. If something comes up that you don't know, respond the way a real person would: "I can't quite remember" or "you'd know better than me."*

This prevents hallucinated details and keeps the conversation feeling real rather than fictional.

---

## Import & Export

Personas are fully portable. Every export is a self-contained `.json` file that includes:

| Category | Fields included |
|---|---|
| Core profile | Name, relationship, personal notes, sample words |
| Personality | OCEAN scores (5 values, 0–100 each) |
| Life context | Location, usual places, daily routine, context notes |
| Preferences | Interests (array), likes (array), dislikes (array) |
| Family & connections | All relations with dual relationship labels and notes |
| Memory cards | Title + content for every memory |
| Knowledge sources | Type (file/link), title, URL, and full stored text content |
| Mood behaviours | Custom behavioral description for each of the 9 mood modes |
| Photo | Base64-encoded data URL (fully self-contained, no broken links) |

The import preview shows the personality bar chart, location, interests, memory count, and connection count before confirming. Files exported before a new field was added import cleanly — missing values default gracefully.

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

All data — personas, memories, conversations, photos, knowledge sources, mood behaviours, and all profile details — is stored **locally** in a SQLite database (`backend/data/companion.db`) and a local uploads folder. Nothing is sent to any external server except conversation messages, which are sent to the Anthropic API to generate responses.
