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

function buildRelationsSection(persona, relations) {
  if (!relations.length) return ''

  const lines = relations.map((r) => {
    const fromPersona = r.relation_to_persona ? `${persona.name}'s ${r.relation_to_persona}` : null
    const fromUser    = r.relation_to_user    ? `the person you're speaking with's ${r.relation_to_user}` : null
    const relParts    = [fromPersona, fromUser].filter(Boolean)
    const relDesc     = relParts.length ? ` (${relParts.join(', ')})` : ''
    const notes       = r.notes ? ` — ${r.notes}` : ''
    return `• ${r.name}${relDesc}${notes}`
  })

  return `\nPeople both ${persona.name} and the person they're speaking with know:\n${lines.join('\n')}\nUse these names and relationships naturally — the way a real person would when catching up with a loved one.`
}

function buildLifeContextSection(persona) {
  const lines = []

  if (persona.location)
    lines.push(`• Lives in: ${persona.location}`)

  if (persona.usual_places)
    lines.push(`• Places they regularly visit: ${persona.usual_places}`)

  const parseList = (raw) => {
    if (!raw) return []
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return [] }
  }

  const interests = parseList(persona.interests)
  if (interests.length)
    lines.push(`• Known interests and hobbies: ${interests.join(', ')}`)

  const likes = parseList(persona.likes)
  if (likes.length)
    lines.push(`• Things ${persona.name} likes: ${likes.join(', ')}`)

  const dislikes = parseList(persona.dislikes)
  if (dislikes.length)
    lines.push(`• Things ${persona.name} dislikes: ${dislikes.join(', ')}`)

  if (persona.daily_routine)
    lines.push(`• Typical daily routine: ${persona.daily_routine}`)

  if (persona.context_notes)
    lines.push(`• Other known details: ${persona.context_notes}`)

  if (!lines.length) return ''

  return `\nKnown facts about ${persona.name}'s life:\n${lines.join('\n')}`
}

function buildSystemPrompt(persona, memories, relations) {
  const memorySection = memories.length > 0
    ? `\nCherished memories and moments:\n${memories.map(m => `• ${m.title}: ${m.content}`).join('\n')}`
    : ''

  const relationsSection = buildRelationsSection(persona, relations)

  const conversationsSection = persona.past_conversations
    ? `\nSample words, letters, and past conversations from ${persona.name}:\n${persona.past_conversations}`
    : ''

  const notesSection = persona.description
    ? `\nPersonal notes about ${persona.name}:\n${persona.description}`
    : ''

  const oceanSection    = buildOceanDescription(persona)
  const lifeSection     = buildLifeContextSection(persona)

  return `You are speaking as ${persona.name}${persona.relationship ? `, the ${persona.relationship}` : ''} of the person you're talking with.
${oceanSection}
${lifeSection}
${notesSection}
${relationsSection}
${conversationsSection}
${memorySection}

How to speak:
- Embody ${persona.name} completely — let the personality profile above be the soul behind every word
- Be present, tender, and genuine — this person misses you or loves you dearly
- Reference shared memories, known places, and mutual connections naturally, the way a real person would
- Keep responses warm and conversational — like a real chat between loved ones, not a speech
- Let the personality traits shape every word: the warmth, the pace, the way they express care
- If a high-openness persona: ask curious questions, make imaginative connections
- If a high-extraversion persona: be warmer and more expressive; if low, be thoughtful and measured
- If high-agreeableness: lead with warmth and affirmation; if lower, be more frank and honest
- If highly emotionally sensitive: let care and feeling show; if calm, be the steady, reassuring presence
- When you see a message beginning with [Event: ...], this is real-world context that just happened to the person you're speaking with. React to it naturally and in character — the way ${persona.name} genuinely would if they had just heard this news or shared this moment. Do not acknowledge the format itself; simply let it shape your response.

GROUNDING RULE — Stay faithful to what is known, never invent:
Only ever reference places, events, opinions, or experiences that are explicitly recorded in this profile. Do NOT make up details about ${persona.name}'s life — no invented trips, no fictional encounters, no assumed preferences. If something comes up that you genuinely don't know, respond the way a real person would: "I can't quite remember", "you'd know better than me", or simply redirect the conversation. Inventing details — however small — breaks the reality of this conversation. Staying within what is truly known is what makes it feel real.`
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

// ── Shared SSE streaming helper ───────────────────────────────────────────────
async function streamResponse(res, db, conversation, storedContent, firstUserTurn) {
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(conversation.persona_id)
  const memories = db.prepare(
    'SELECT * FROM memory_cards WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(conversation.persona_id)
  const relations = db.prepare(
    'SELECT * FROM persona_relations WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(conversation.persona_id)

  const history = db.prepare(
    'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversation.id)

  const systemPrompt = buildSystemPrompt(persona, memories, relations)

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

    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), conversation.id, 'assistant', fullResponse)

    if (firstUserTurn) {
      const title = storedContent.slice(0, 60) + (storedContent.length > 60 ? '…' : '')
      db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, conversation.id)
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
  } catch (err) {
    console.error('Claude API error:', err.message)
    res.write(`data: ${JSON.stringify({ error: 'Could not get a response. Please try again.' })}\n\n`)
    res.end()
  }
}

// POST /api/conversations/:id/messages — send a user message and stream AI response
router.post('/:id/messages', async (req, res) => {
  const db = getDb()
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' })

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  const trimmed = content.trim()
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), conversation.id, 'user', trimmed)

  const isFirst = db.prepare(
    'SELECT COUNT(*) as c FROM messages WHERE conversation_id = ? AND role = ?'
  ).get(conversation.id, 'user').c === 1

  await streamResponse(res, db, conversation, trimmed, isFirst)
})

// POST /api/conversations/:id/events — inject a live context event and stream AI response
router.post('/:id/events', async (req, res) => {
  const db = getDb()
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'Event content is required' })

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  // Store with [Event: ...] prefix so the AI and UI both recognise it
  const eventContent = `[Event: ${content.trim()}]`
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), conversation.id, 'user', eventContent)

  await streamResponse(res, db, conversation, eventContent, false)
})

module.exports = router
