const express = require('express')
const { getDb } = require('../database/db')

const router = express.Router()

// Mask all but the last 4 chars: sk-ant-api03-...XXXX
function maskKey(key) {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 10) + '•'.repeat(Math.max(0, key.length - 14)) + key.slice(-4)
}

const ALLOWED_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-5',
  'claude-haiku-4-5-20251001',
]

// GET /api/settings — return current settings (key is masked, never returned in full)
router.get('/', (req, res) => {
  const db   = getDb()
  const user = db.prepare('SELECT anthropic_api_key, preferred_model FROM users WHERE id = ?').get(req.user.userId)
  const key  = user?.anthropic_api_key || null

  res.json({
    hasApiKey:      !!key,
    maskedKey:      key ? maskKey(key) : null,
    preferredModel: user?.preferred_model || 'claude-opus-4-6',
  })
})

// PUT /api/settings/api-key — save or update the user's Anthropic key
router.put('/api-key', (req, res) => {
  const { apiKey } = req.body
  if (!apiKey?.trim()) return res.status(400).json({ error: 'API key is required' })

  const key = apiKey.trim()
  if (!key.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'That doesn\'t look like a valid Anthropic key (should start with sk-ant-)' })
  }

  const db = getDb()
  db.prepare('UPDATE users SET anthropic_api_key = ? WHERE id = ?').run(key, req.user.userId)

  res.json({ success: true, maskedKey: maskKey(key) })
})

// PUT /api/settings/model — save the user's preferred Claude model
router.put('/model', (req, res) => {
  const { model } = req.body
  if (!model) return res.status(400).json({ error: 'Model is required' })
  if (!ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: 'Unrecognised model identifier' })
  }

  const db = getDb()
  db.prepare('UPDATE users SET preferred_model = ? WHERE id = ?').run(model, req.user.userId)
  res.json({ success: true, preferredModel: model })
})

// DELETE /api/settings/api-key — remove the stored key (falls back to server key)
router.delete('/api-key', (req, res) => {
  const db = getDb()
  db.prepare('UPDATE users SET anthropic_api_key = NULL WHERE id = ?').run(req.user.userId)
  res.json({ success: true })
})

module.exports = router
