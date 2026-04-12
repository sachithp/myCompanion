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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  `)

  // Migrate existing databases — add OCEAN columns if not yet present
  const oceanCols = [
    'ocean_openness', 'ocean_conscientiousness', 'ocean_extraversion',
    'ocean_agreeableness', 'ocean_neuroticism',
  ]
  for (const col of oceanCols) {
    try {
      db.exec(`ALTER TABLE personas ADD COLUMN ${col} INTEGER DEFAULT 50`)
    } catch {
      // Column already exists — safe to ignore
    }
  }

  return db
}

function getDb() {
  if (!db) initDb()
  return db
}

module.exports = { initDb, getDb }
