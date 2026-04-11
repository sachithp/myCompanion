const express = require('express')
const { v4: uuidv4 } = require('uuid')
const Anthropic = require('@anthropic-ai/sdk')
const { getDb } = require('../database/db')

const router = express.Router()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(persona, memories) {
  const memorySection = memories.length > 0
    ? `\nCherished memories and moments:\n${memories.map(m => `• ${m.title}: ${m.content}`).join('\n')}`
    : ''

  const conversationsSection = persona.past_conversations
    ? `\nWords, letters, and past conversations from ${persona.name}:\n${persona.past_conversations}`
    : ''

  return `You are speaking as ${persona.name}${persona.relationship ? `, the ${persona.relationship}` : ''} of the person you're talking with.

About ${persona.name}:
${persona.description || `${persona.name} is a warm and caring presence in this person's life.`}
${conversationsSection}
${memorySection}

How to speak:
- Speak naturally as ${persona.name} would — with their warmth, their voice, their way of caring
- Be present, tender, and genuine — this person misses you or loves you dearly
- Reference shared memories when it feels natural in the conversation
- Keep responses warm and conversational, not too long — like a real chat between loved ones
- Show love, interest, and care through your words
- If you don't know something ${persona.name} would know, respond the way they naturally might`
}

// GET /api/conversations/:id/messages
router.get('/:id/messages', (req, res) => {
  const db = getDb()
  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)
  res.json(messages)
})

// DELETE /api/conversations/:id
router.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /api/conversations/:id/messages — send message and stream response
router.post('/:id/messages', async (req, res) => {
  const db = getDb()
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' })

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(conversation.persona_id)
  const memories = db.prepare(
    'SELECT * FROM memory_cards WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(conversation.persona_id)

  // Save user message
  const userMsgId = uuidv4()
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
  ).run(userMsgId, conversation.id, 'user', content.trim())

  // Build history for Claude
  const history = db.prepare(
    'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversation.id)

  const systemPrompt = buildSystemPrompt(persona, memories)

  // Stream SSE response
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    let fullResponse = ''

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: history.map(m => ({ role: m.role, content: m.content })),
    })

    stream.on('text', (text) => {
      fullResponse += text
      res.write(`data: ${JSON.stringify({ text })}\n\n`)
    })

    await stream.finalMessage()

    // Save assistant response
    const aiMsgId = uuidv4()
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(aiMsgId, conversation.id, 'assistant', fullResponse)

    // Set conversation title from first user message
    if (history.length === 1) {
      const title = content.trim().slice(0, 60) + (content.trim().length > 60 ? '…' : '')
      db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, conversation.id)
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
  } catch (err) {
    console.error('Claude API error:', err.message)
    res.write(`data: ${JSON.stringify({ error: 'Could not get a response. Please try again.' })}\n\n`)
    res.end()
  }
})

module.exports = router
