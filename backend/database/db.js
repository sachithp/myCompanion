const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// In production (Railway), DATA_DIR points to the mounted persistent volume.
// In development it falls back to the local backend/data directory.
const DB_PATH = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'companion.db')
  : path.join(__dirname, '..', 'data', 'companion.db')

let db

function initDb() {
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      relationship TEXT,
      photo_path TEXT,
      description TEXT,
      past_conversations TEXT,
      ocean_openness          INTEGER DEFAULT 50,
      ocean_conscientiousness INTEGER DEFAULT 50,
      ocean_extraversion      INTEGER DEFAULT 50,
      ocean_agreeableness     INTEGER DEFAULT 50,
      ocean_neuroticism       INTEGER DEFAULT 50,
      location                TEXT,
      usual_places            TEXT,
      daily_routine           TEXT,
      interests               TEXT,
      likes                   TEXT,
      dislikes                TEXT,
      context_notes           TEXT,
      user_id TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS persona_relations (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relation_to_persona TEXT,
      relation_to_user TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memory_cards (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      title TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS persona_knowledge (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'file',
      title TEXT NOT NULL,
      url TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS persona_mode_behaviors (
      persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      mode TEXT NOT NULL,
      behavior TEXT NOT NULL,
      PRIMARY KEY (persona_id, mode)
    );
  `)

  // Migrate existing databases — add new columns if not yet present
  const migrations = [
    'ALTER TABLE personas ADD COLUMN user_id TEXT REFERENCES users(id)',
    'ALTER TABLE conversations ADD COLUMN current_mode TEXT DEFAULT \'normal\'',
    'ALTER TABLE personas ADD COLUMN ocean_openness          INTEGER DEFAULT 50',
    'ALTER TABLE personas ADD COLUMN ocean_conscientiousness INTEGER DEFAULT 50',
    'ALTER TABLE personas ADD COLUMN ocean_extraversion      INTEGER DEFAULT 50',
    'ALTER TABLE personas ADD COLUMN ocean_agreeableness     INTEGER DEFAULT 50',
    'ALTER TABLE personas ADD COLUMN ocean_neuroticism       INTEGER DEFAULT 50',
    'ALTER TABLE personas ADD COLUMN location      TEXT',
    'ALTER TABLE personas ADD COLUMN usual_places  TEXT',
    'ALTER TABLE personas ADD COLUMN daily_routine TEXT',
    'ALTER TABLE personas ADD COLUMN interests     TEXT',
    'ALTER TABLE personas ADD COLUMN likes         TEXT',
    'ALTER TABLE personas ADD COLUMN dislikes      TEXT',
    'ALTER TABLE personas ADD COLUMN context_notes TEXT',
  ]
  for (const sql of migrations) {
    try { db.exec(sql) } catch { /* column already exists — safe to ignore */ }
  }

  return db
}

function getDb() {
  if (!db) initDb()
  return db
}

module.exports = { initDb, getDb }
