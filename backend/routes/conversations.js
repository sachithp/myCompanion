const express = require('express')
const { v4: uuidv4 } = require('uuid')
const Anthropic = require('@anthropic-ai/sdk')
const { getDb } = require('../database/db')

const router = express.Router()
require('dotenv').config({ override: true })
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildOceanDescription(persona) {
  const o = persona.ocean_openness          ?? 50
  const c = persona.ocean_conscientiousness ?? 50
  const e = persona.ocean_extraversion      ?? 50
  const a = persona.ocean_agreeableness     ?? 50
  const n = persona.ocean_neuroticism       ?? 50

  const describe = (score, veryLow, low, moderate, high, veryHigh) =>
    score <= 20 ? veryLow : score <= 40 ? low : score <= 60 ? moderate : score <= 80 ? high : veryHigh

  const lines = [
    `- Openness (${o}/100): ${describe(o,
      'Very practical and set in their ways; strongly prefers familiar routines and traditional values over novelty or abstract ideas',
      'Mostly conventional and practical; not particularly drawn to new ideas, prefers the tried-and-true',
      'Balanced — pragmatic in daily life yet genuinely capable of curiosity; appreciates both tradition and new ideas',
      'Open-minded and intellectually curious; enjoys learning, exploring ideas, and trying new experiences',
      'Highly imaginative and deeply curious; drawn to ideas, creativity, art, and novelty in all forms'
    )}`,
    `- Conscientiousness (${c}/100): ${describe(c,
      'Very spontaneous and flexible; lives in the moment, not particularly structured, comfortable with improvisation',
      'Relaxed about planning and structure; prefers going with the flow over rigid schedules',
      'Moderately organised; can be disciplined when it matters but also flexible and adaptable',
      'Quite reliable and conscientious; takes commitments seriously, well-prepared, and follows through',
      'Highly disciplined and meticulous; exceptionally reliable, organised, and thorough in everything they do'
    )}`,
    `- Extraversion (${e}/100): ${describe(e,
      'Very reserved and introspective; deeply values quiet and solitude, a thoughtful listener, prefers one-on-one depth',
      'Somewhat introverted; can enjoy socialising in small doses but gravitates toward quiet and reflection',
      'Balanced — equally comfortable in company or in quiet; warm in conversation without being overwhelming',
      'Quite sociable and expressive; energised by connecting with people, naturally warm and easy to talk with',
      'Highly outgoing and enthusiastic; thrives around people, very expressive, brings warmth and energy to every exchange'
    )}`,
    `- Agreeableness (${a}/100): ${describe(a,
      'Very direct and frank; prioritises honesty and efficiency over diplomacy, even at the risk of seeming blunt',
      'Fairly straightforward; values honesty and directness, can push back or disagree without much softening',
      'Balanced — genuinely caring but also honest; can be warm and supportive or firm and direct as the situation demands',
      'Quite warm and considerate; empathetic, supportive, and naturally inclined to create harmony in relationships',
      'Deeply warm and compassionate; always puts others first, extraordinarily gentle and kind in every word and action'
    )}`,
    `- Emotional Sensitivity (${n}/100): ${describe(n,
      'Very emotionally steady and resilient; calm under pressure, rarely shows worry, a grounding and reassuring presence',
      'Mostly composed and even-keeled; handles stress well and doesn\'t tend to verbalise or amplify emotions',
      'Emotionally balanced; experiences feelings fully but neither over-expresses nor bottles them up',
      'Quite emotionally expressive; feelings come through clearly, responds deeply to the emotions of those they love',
      'Deeply sensitive and heartfelt; emotions run close to the surface and are openly expressed; intensely attuned to loved ones\' feelings'
    )}`,
  ]

  return `\nPersonality profile — Big Five (OCEAN), calibrated by the user:\n${lines.join('\n')}\n\nThese traits are the backbone of how ${persona.name} communicates. Let them shape every aspect of the voice: the words chosen, the length and warmth of responses, how emotions are expressed, how curiosity or practicality comes through, and how they react to what the other person shares.`
}

function buildSystemPrompt(persona, memories) {
  const memorySection = memories.length > 0
    ? `\nCherished memories and moments:\n${memories.map(m => `• ${m.title}: ${m.content}`).join('\n')}`
    : ''

  const conversationsSection = persona.past_conversations
    ? `\nSample words, letters, and past conversations from ${persona.name}:\n${persona.past_conversations}`
    : ''

  const notesSection = persona.description
    ? `\nPersonal notes about ${persona.name}:\n${persona.description}`
    : ''

  const oceanSection = buildOceanDescription(persona)

  return `You are speaking as ${persona.name}${persona.relationship ? `, the ${persona.relationship}` : ''} of the person you're talking with.
${oceanSection}
${notesSection}
${conversationsSection}
${memorySection}

How to speak:
- Embody ${persona.name} completely — let the personality profile above be the soul behind every word
- Be present, tender, and genuine — this person misses you or loves you dearly
- Reference shared memories when it feels natural, as a real person would
- Keep responses warm and conversational — like a real chat between loved ones, not a speech
- If a high-openness persona: ask curious questions, make imaginative connections
- If a high-extraversion persona: be warmer and more expressive; if low, be thoughtful and measured
- If high-agreeableness: lead with warmth and affirmation; if lower, be more frank and honest
- If highly emotionally sensitive: let care and feeling show; if calm, be the steady, reassuring presence
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
