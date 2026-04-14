const express = require('express')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')
const { getDb } = require('../database/db')

const router = express.Router()

// interests is stored as a JSON string in SQLite; parse it on the way out
function parseInterests(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}
function withInterests(p) {
  if (!p) return p
  return {
    ...p,
    interests: parseInterests(p.interests),
    likes:     parseInterests(p.likes),
    dislikes:  parseInterests(p.dislikes),
  }
}

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
  res.json(personas.map(withInterests))
})

// POST /api/personas — create
router.post('/', (req, res) => {
  const db = getDb()
  const {
    name, relationship, description, past_conversations, photo_path,
    ocean_openness, ocean_conscientiousness, ocean_extraversion,
    ocean_agreeableness, ocean_neuroticism,
    location, usual_places, daily_routine, interests, likes, dislikes, context_notes,
  } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  const id = uuidv4()
  db.prepare(`
    INSERT INTO personas (
      id, name, relationship, description, past_conversations, photo_path,
      ocean_openness, ocean_conscientiousness, ocean_extraversion,
      ocean_agreeableness, ocean_neuroticism,
      location, usual_places, daily_routine, interests, likes, dislikes, context_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name.trim(), relationship || null, description || null,
    past_conversations || null, photo_path || null,
    ocean_openness ?? 50, ocean_conscientiousness ?? 50, ocean_extraversion ?? 50,
    ocean_agreeableness ?? 50, ocean_neuroticism ?? 50,
    location || null, usual_places || null, daily_routine || null,
    interests?.length ? JSON.stringify(interests) : null,
    likes?.length     ? JSON.stringify(likes)     : null,
    dislikes?.length  ? JSON.stringify(dislikes)  : null,
    context_notes || null,
  )

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(id)
  res.status(201).json(withInterests(persona))
})

// POST /api/personas/import — create persona from exported JSON
router.post('/import', (req, res) => {
  const db = getDb()
  const { persona, memories, relations, knowledge, mode_behaviors } = req.body

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
      ocean_agreeableness, ocean_neuroticism,
      location, usual_places, daily_routine, interests, likes, dislikes, context_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    persona.location || null,
    persona.usual_places || null,
    persona.daily_routine || null,
    persona.interests?.length ? JSON.stringify(persona.interests) : null,
    persona.likes?.length     ? JSON.stringify(persona.likes)     : null,
    persona.dislikes?.length  ? JSON.stringify(persona.dislikes)  : null,
    persona.context_notes || null,
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

  if (Array.isArray(relations)) {
    for (const r of relations) {
      if (r.name?.trim()) {
        db.prepare(
          'INSERT INTO persona_relations (id, persona_id, name, relation_to_persona, relation_to_user, notes) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(uuidv4(), id, r.name.trim(), r.relation_to_persona || null, r.relation_to_user || null, r.notes || null)
      }
    }
  }

  if (Array.isArray(knowledge)) {
    for (const k of knowledge) {
      if (k.title?.trim()) {
        db.prepare(
          'INSERT INTO persona_knowledge (id, persona_id, type, title, url, content) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(uuidv4(), id, k.type || 'file', k.title.trim(), k.url || null, k.content || null)
      }
    }
  }

  if (mode_behaviors && typeof mode_behaviors === 'object') {
    for (const [mode, behavior] of Object.entries(mode_behaviors)) {
      if (behavior?.trim()) {
        db.prepare(`
          INSERT INTO persona_mode_behaviors (persona_id, mode, behavior)
          VALUES (?, ?, ?)
          ON CONFLICT(persona_id, mode) DO UPDATE SET behavior = excluded.behavior
        `).run(id, mode, behavior.trim())
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

// GET /api/personas/:id — get with memories, relations, and knowledge sources
router.get('/:id', (req, res) => {
  const db = getDb()
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const memories = db.prepare(
    'SELECT * FROM memory_cards WHERE persona_id = ? ORDER BY created_at DESC'
  ).all(req.params.id)

  const relations = db.prepare(
    'SELECT * FROM persona_relations WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)

  const knowledge = db.prepare(
    'SELECT * FROM persona_knowledge WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)

  const modeBehaviorRows = db.prepare(
    'SELECT mode, behavior FROM persona_mode_behaviors WHERE persona_id = ?'
  ).all(req.params.id)
  // Convert to a plain object { mode: behavior } for easy consumption
  const mode_behaviors = Object.fromEntries(modeBehaviorRows.map((r) => [r.mode, r.behavior]))

  res.json({ ...withInterests(persona), memories, relations, knowledge, mode_behaviors })
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
    location, usual_places, daily_routine, interests, likes, dislikes, context_notes,
  } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  db.prepare(`
    UPDATE personas
    SET name = ?, relationship = ?, description = ?, past_conversations = ?, photo_path = ?,
        ocean_openness = ?, ocean_conscientiousness = ?, ocean_extraversion = ?,
        ocean_agreeableness = ?, ocean_neuroticism = ?,
        location = ?, usual_places = ?, daily_routine = ?, interests = ?,
        likes = ?, dislikes = ?, context_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name.trim(), relationship || null, description || null,
    past_conversations || null, photo_path || null,
    ocean_openness ?? 50, ocean_conscientiousness ?? 50, ocean_extraversion ?? 50,
    ocean_agreeableness ?? 50, ocean_neuroticism ?? 50,
    location || null, usual_places || null, daily_routine || null,
    interests?.length ? JSON.stringify(interests) : null,
    likes?.length     ? JSON.stringify(likes)     : null,
    dislikes?.length  ? JSON.stringify(dislikes)  : null,
    context_notes || null,
    req.params.id,
  )

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.params.id)
  const memories = db.prepare(
    'SELECT * FROM memory_cards WHERE persona_id = ? ORDER BY created_at DESC'
  ).all(req.params.id)
  res.json({ ...withInterests(persona), memories })
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

// POST /api/personas/:id/relations — add a relation
router.post('/:id/relations', (req, res) => {
  const db = getDb()
  const { name, relation_to_persona, relation_to_user, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })

  const persona = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const id = uuidv4()
  db.prepare(
    'INSERT INTO persona_relations (id, persona_id, name, relation_to_persona, relation_to_user, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, name.trim(), relation_to_persona || null, relation_to_user || null, notes || null)

  const relation = db.prepare('SELECT * FROM persona_relations WHERE id = ?').get(id)
  res.status(201).json(relation)
})

// DELETE /api/personas/:personaId/relations/:relationId
router.delete('/:personaId/relations/:relationId', (req, res) => {
  const db = getDb()
  db.prepare(
    'DELETE FROM persona_relations WHERE id = ? AND persona_id = ?'
  ).run(req.params.relationId, req.params.personaId)
  res.json({ success: true })
})

// GET /api/personas/:id/knowledge — list knowledge sources
router.get('/:id/knowledge', (req, res) => {
  const db = getDb()
  const sources = db.prepare(
    'SELECT * FROM persona_knowledge WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)
  res.json(sources)
})

// POST /api/personas/:id/knowledge — add a knowledge source (file content or web link)
router.post('/:id/knowledge', async (req, res) => {
  const db = getDb()
  const { type, title, url, content } = req.body

  const persona = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })

  let finalContent = content || null
  const finalUrl = url || null

  // For links, fetch and extract text from the page
  if (type === 'link' && url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; myCompanion/1.0)' },
        signal: AbortSignal.timeout(12000),
      })
      const html = await response.text()
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
      finalContent = text.slice(0, 12000)
    } catch (err) {
      finalContent = `[Content could not be fetched from ${url}. Reason: ${err.message}]`
    }
  }

  const id = uuidv4()
  db.prepare(
    'INSERT INTO persona_knowledge (id, persona_id, type, title, url, content) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.id, type || 'file', title.trim(), finalUrl, finalContent)

  const source = db.prepare('SELECT * FROM persona_knowledge WHERE id = ?').get(id)
  res.status(201).json(source)
})

// DELETE /api/personas/:personaId/knowledge/:kId
router.delete('/:personaId/knowledge/:kId', (req, res) => {
  const db = getDb()
  db.prepare(
    'DELETE FROM persona_knowledge WHERE id = ? AND persona_id = ?'
  ).run(req.params.kId, req.params.personaId)
  res.json({ success: true })
})

// PUT /api/personas/:id/mode-behaviors/:mode — upsert a behavior for a specific mode
// Sending an empty behavior string removes it
router.put('/:id/mode-behaviors/:mode', (req, res) => {
  const db = getDb()
  const { mode } = req.params
  const { behavior } = req.body
  const VALID_MODES = ['normal', 'happy', 'nostalgic', 'tired', 'sad', 'worried', 'excited', 'unwell', 'busy']

  if (!VALID_MODES.includes(mode)) return res.status(400).json({ error: 'Invalid mode' })

  const persona = db.prepare('SELECT id FROM personas WHERE id = ?').get(req.params.id)
  if (!persona) return res.status(404).json({ error: 'Persona not found' })

  const text = behavior?.trim() || ''
  if (text) {
    db.prepare(`
      INSERT INTO persona_mode_behaviors (persona_id, mode, behavior)
      VALUES (?, ?, ?)
      ON CONFLICT(persona_id, mode) DO UPDATE SET behavior = excluded.behavior
    `).run(req.params.id, mode, text)
  } else {
    db.prepare(
      'DELETE FROM persona_mode_behaviors WHERE persona_id = ? AND mode = ?'
    ).run(req.params.id, mode)
  }

  res.json({ success: true, mode, behavior: text || null })
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

  const relations = db.prepare(
    'SELECT name, relation_to_persona, relation_to_user, notes FROM persona_relations WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)

  const knowledge = db.prepare(
    'SELECT type, title, url, content FROM persona_knowledge WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)

  const modeBehaviorExportRows = db.prepare(
    'SELECT mode, behavior FROM persona_mode_behaviors WHERE persona_id = ?'
  ).all(req.params.id)
  const mode_behaviors = Object.fromEntries(modeBehaviorExportRows.map((r) => [r.mode, r.behavior]))

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
      location: persona.location,
      usual_places: persona.usual_places,
      daily_routine: persona.daily_routine,
      interests: parseInterests(persona.interests),
      likes:     parseInterests(persona.likes),
      dislikes:  parseInterests(persona.dislikes),
      context_notes: persona.context_notes,
    },
    memories,
    relations,
    knowledge,
    mode_behaviors,
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
