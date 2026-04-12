const express = require('express')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')
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
  const {
    name, relationship, description, past_conversations, photo_path,
    ocean_openness, ocean_conscientiousness, ocean_extraversion,
    ocean_agreeableness, ocean_neuroticism,
  } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  const id = uuidv4()
  db.prepare(`
    INSERT INTO personas (
      id, name, relationship, description, past_conversations, photo_path,
      ocean_openness, ocean_conscientiousness, ocean_extraversion,
      ocean_agreeableness, ocean_neuroticism
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name.trim(), relationship || null, description || null,
    past_conversations || null, photo_path || null,
    ocean_openness ?? 50, ocean_conscientiousness ?? 50, ocean_extraversion ?? 50,
    ocean_agreeableness ?? 50, ocean_neuroticism ?? 50,
  )

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(id)
  res.status(201).json(persona)
})

// POST /api/personas/import — create persona from exported JSON
router.post('/import', (req, res) => {
  const db = getDb()
  const { persona, memories } = req.body

  if (!persona?.name?.trim()) {
    return res.status(400).json({ error: 'Invalid file: persona name is required' })
  }

  // Save base64 photo to disk if present
  let photo_path = null
  if (persona.photo) {
    try {
      const matches = persona.photo.match(/^data:(image\/[\w+]+);base64,(.+)$/)
      if (matches) {
        const mimeType = matches[1]
        const ext = mimeType.split('/')[1].replace('jpeg', 'jpg').split('+')[0]
        const buffer = Buffer.from(matches[2], 'base64')
        const filename = `${uuidv4()}.${ext}`
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'photos')
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
        fs.writeFileSync(path.join(uploadsDir, filename), buffer)
        photo_path = `/uploads/photos/${filename}`
      }
    } catch {
      photo_path = null
    }
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO personas (
      id, name, relationship, description, past_conversations, photo_path,
      ocean_openness, ocean_conscientiousness, ocean_extraversion,
      ocean_agreeableness, ocean_neuroticism
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    persona.name.trim(),
    persona.relationship || null,
    persona.description || null,
    persona.past_conversations || null,
    photo_path,
    persona.ocean_openness ?? 50,
    persona.ocean_conscientiousness ?? 50,
    persona.ocean_extraversion ?? 50,
    persona.ocean_agreeableness ?? 50,
    persona.ocean_neuroticism ?? 50,
  )

  if (Array.isArray(memories)) {
    for (const m of memories) {
      if (m.title?.trim() && m.content?.trim()) {
        db.prepare(
          'INSERT INTO memory_cards (id, persona_id, title, content) VALUES (?, ?, ?, ?)'
        ).run(uuidv4(), id, m.title.trim(), m.content.trim())
      }
    }
  }

  const newPersona = db.prepare(`
    SELECT p.*, COUNT(m.id) as memory_count
    FROM personas p LEFT JOIN memory_cards m ON m.persona_id = p.id
    WHERE p.id = ? GROUP BY p.id
  `).get(id)
  res.status(201).json(newPersona)
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

  const {
    name, relationship, description, past_conversations, photo_path,
    ocean_openness, ocean_conscientiousness, ocean_extraversion,
    ocean_agreeableness, ocean_neuroticism,
  } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  db.prepare(`
    UPDATE personas
    SET name = ?, relationship = ?, description = ?, past_conversations = ?, photo_path = ?,
        ocean_openness = ?, ocean_conscientiousness = ?, ocean_extraversion = ?,
        ocean_agreeableness = ?, ocean_neuroticism = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name.trim(), relationship || null, description || null,
    past_conversations || null, photo_path || null,
    ocean_openness ?? 50, ocean_conscientiousness ?? 50, ocean_extraversion ?? 50,
    ocean_agreeableness ?? 50, ocean_neuroticism ?? 50,
    req.params.id,
  )

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

// GET /api/personas/:id/export — export persona as JSON with base64 photo
router.get('/:id/export', (req, res) => {
  const db = getDb()
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const memories = db.prepare(
    'SELECT title, content FROM memory_cards WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)

  let photoData = null
  if (persona.photo_path) {
    try {
      const filePath = path.join(__dirname, '..', persona.photo_path)
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(persona.photo_path).toLowerCase().replace('.', '')
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'png' ? 'image/png'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg'
      photoData = `data:${mime};base64,${buffer.toString('base64')}`
    } catch {
      photoData = null
    }
  }

  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    persona: {
      name: persona.name,
      relationship: persona.relationship,
      description: persona.description,
      past_conversations: persona.past_conversations,
      photo: photoData,
      ocean_openness: persona.ocean_openness,
      ocean_conscientiousness: persona.ocean_conscientiousness,
      ocean_extraversion: persona.ocean_extraversion,
      ocean_agreeableness: persona.ocean_agreeableness,
      ocean_neuroticism: persona.ocean_neuroticism,
    },
    memories,
  }

  const safeName = persona.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_companion.json"`)
  res.json(exportData)
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
