const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')

const router = express.Router()

// GET /api/personas — list all
router.get('/', (req, res) => {
  const db = getDb()
  const personas = db.prepare(`
    SELECT p.*, COUNT(m.id) as memory_count
    FROM personas p
    LEFT JOIN memory_cards m ON m.persona_id = p.id
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all()
  res.json(personas)
})

// POST /api/personas — create
router.post('/', (req, res) => {
  const db = getDb()
  const { name, relationship, description, past_conversations, photo_path } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  const id = uuidv4()
  db.prepare(`
    INSERT INTO personas (id, name, relationship, description, past_conversations, photo_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), relationship || null, description || null, past_conversations || null, photo_path || null)

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(id)
  res.status(201).json(persona)
})

// GET /api/personas/:id — get with memories
router.get('/:id', (req, res) => {
  const db = getDb()
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const memories = db.prepare(
    'SELECT * FROM memory_cards WHERE persona_id = ? ORDER BY created_at DESC'
  ).all(req.params.id)

  res.json({ ...persona, memories })
})

// PUT /api/personas/:id — update
router.put('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Persona not found' })

  const { name, relationship, description, past_conversations, photo_path } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  db.prepare(`
    UPDATE personas
    SET name = ?, relationship = ?, description = ?, past_conversations = ?, photo_path = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name.trim(), relationship || null, description || null, past_conversations || null, photo_path || null, req.params.id)

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id)
  const memories = db.prepare(
    'SELECT * FROM memory_cards WHERE persona_id = ? ORDER BY created_at DESC'
  ).all(req.params.id)
  res.json({ ...persona, memories })
})

// DELETE /api/personas/:id
router.delete('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Persona not found' })

  db.prepare('DELETE FROM personas WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /api/personas/:id/memories — add memory card
router.post('/:id/memories', (req, res) => {
  const db = getDb()
  const { title, content } = req.body
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'Title and content are required' })
  }

  const persona = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const id = uuidv4()
  db.prepare(
    'INSERT INTO memory_cards (id, persona_id, title, content) VALUES (?, ?, ?, ?)'
  ).run(id, req.params.id, title.trim(), content.trim())

  const memory = db.prepare('SELECT * FROM memory_cards WHERE id = ?').get(id)
  res.status(201).json(memory)
})

// DELETE /api/personas/:personaId/memories/:memoryId
router.delete('/:personaId/memories/:memoryId', (req, res) => {
  const db = getDb()
  db.prepare(
    'DELETE FROM memory_cards WHERE id = ? AND persona_id = ?'
  ).run(req.params.memoryId, req.params.personaId)
  res.json({ success: true })
})

// GET /api/personas/:id/conversations
router.get('/:id/conversations', (req, res) => {
  const db = getDb()
  const conversations = db.prepare(
    'SELECT * FROM conversations WHERE persona_id = ? ORDER BY started_at DESC'
  ).all(req.params.id)
  res.json(conversations)
})

// POST /api/personas/:id/conversations — create new conversation
router.post('/:id/conversations', (req, res) => {
  const db = getDb()
  const persona = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const id = uuidv4()
  db.prepare('INSERT INTO conversations (id, persona_id) VALUES (?, ?)').run(id, req.params.id)

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)
  res.status(201).json(conversation)
})

module.exports = router
