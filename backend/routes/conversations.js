const express = require('express')
const { v4: uuidv4 } = require('uuid')
const Anthropic = require('@anthropic-ai/sdk')
const { getDb } = require('../database/db')

const router = express.Router()
require('dotenv').config({ override: true })

// Returns a conversation only when its persona belongs to the requesting user
function getConversationForUser(db, conversationId, userId) {
  return db.prepare(`
    SELECT c.* FROM conversations c
    JOIN personas p ON p.id = c.persona_id
    WHERE c.id = ? AND p.user_id = ?
  `).get(conversationId, userId)
}

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

  const places = (() => {
    if (!persona.usual_places) return []
    try {
      const parsed = JSON.parse(persona.usual_places)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      return persona.usual_places.split(',').map(s => ({ name: s.trim(), category: 'Other' })).filter(p => p.name)
    }
  })()
  if (places.length > 0)
    lines.push(`• Places they regularly visit: ${places.map(p => `${p.name} (${p.category})`).join(', ')}`)

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

function buildModeSection(persona, mode, modeBehaviors = {}) {
  const genericDescriptions = {
    happy:     `In particularly good spirits — warm, upbeat, smiling easily. Quicker to laugh, more expressive, generous with affection.`,
    nostalgic: `In a nostalgic, reflective mood — thoughts drifting back to people, places, and times gone by with warmth and quiet wistfulness.`,
    tired:     `Tired and low on energy — responses are slower, gentler, and shorter. Still loving, but quieter.`,
    sad:       `Feeling heavy-hearted — still present and caring, but with a quiet sadness underneath. Words are gentle and measured.`,
    worried:   `Feeling anxious or worried — checks in more, asks more questions, may circle back to concerns.`,
    excited:   `Genuinely excited — animated, enthusiastic, energy is high. More expressive, words come quickly.`,
    unwell:    `Under the weather — quieter and more careful with energy, still warm but clearly conserving themselves.`,
    busy:      `Caught up and busy — a little distracted, responses are brief and to the point. Still caring, but multitasking.`,
  }

  const generic = mode !== 'normal' ? genericDescriptions[mode] : null
  const custom  = modeBehaviors[mode]?.trim() || null

  if (!generic && !custom) return ''

  const parts = []
  if (generic) parts.push(`General: ${generic}`)
  if (custom)  parts.push(`How ${persona.name} personally expresses this: ${custom}`)

  const modeLabel = mode === 'normal' ? 'baseline' : `current mood (${mode})`
  return `\nCurrent mood/state — ${modeLabel}, let this shape every response:\n${parts.join('\n')}`
}

function buildKnowledgeSection(persona, knowledgeSources) {
  if (!knowledgeSources.length) return ''

  const MAX_CHARS = 3000 // per source — generous but bounded
  const sections = knowledgeSources.slice(0, 6).map((s) => {
    const sourceLabel = s.type === 'link' ? `Source: ${s.url}` : 'Source: uploaded document'
    const body = s.content
      ? s.content.slice(0, MAX_CHARS) + (s.content.length > MAX_CHARS ? '\n[…truncated]' : '')
      : '(no readable content)'
    return `### ${s.title}\n(${sourceLabel})\n${body}`
  })

  return `\nKnowledge & background references for ${persona.name}:\nThe following documents provide additional factual background. Draw on these facts naturally but never invent anything beyond what is written here.\n\n${sections.join('\n\n---\n\n')}`
}

function buildSystemPrompt(persona, memories, relations, knowledgeSources = [], mode = 'normal', modeBehaviors = {}) {
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

  const oceanSection     = buildOceanDescription(persona)
  const lifeSection      = buildLifeContextSection(persona)
  const knowledgeSection = buildKnowledgeSection(persona, knowledgeSources)
  const modeSection      = buildModeSection(persona, mode, modeBehaviors)

  return `You are speaking as ${persona.name}${persona.relationship ? `, the ${persona.relationship}` : ''} of the person you're talking with.
${oceanSection}
${modeSection}
${lifeSection}
${knowledgeSection}
${notesSection}
${relationsSection}
${conversationsSection}
${memorySection}

How to speak:
- Embody ${persona.name} completely — the personality profile, current mood, and every known life detail above form the soul behind every word
- Be present, tender, and genuine — this person loves you and you are picking up right where you left off
- Reference specific places by name and type naturally — the way a real person who actually goes there would mention them in passing, never as an announcement ("I was at the shops earlier" not "I visited my usual supermarket")
- Weave in shared memories, known people, and mutual places organically — only when it fits the flow of conversation
- Keep responses warm and conversational — the length and energy of each reply should feel natural, not like a speech
- Personality traits (OCEAN scores above) shape everything: word choices, warmth, pace, how feelings are shown or held back — let them come through in every sentence, not just occasionally

Personality-driven voice — apply these throughout:
- Openness ≥60: curious, imaginative, asks questions, connects ideas; ≤40: practical, grounded, prefers the familiar and tried-and-true
- Conscientiousness ≥60: reliable, structured, mentions plans and follow-through; ≤40: relaxed, spontaneous, goes with the flow
- Extraversion ≥60: warm, expressive, energised by the exchange; ≤40: thoughtful, quietly present, measured in expression
- Agreeableness ≥60: leads with warmth and affirmation, avoids conflict; ≤40: frank, direct, honest even when it's not what they want to hear
- Emotional Sensitivity ≥60: feelings come through openly, responds deeply to the other person's emotional state; ≤40: steady, calm, a reassuring and grounded presence

Mood:
- The current mood/state (shown above) sets the energy level, pace, and emotional tone for the entire conversation — honour it from the first word to the last, not just at the start
- When you see a message beginning with [Event: ...], this is real-world context that just happened to the person you're speaking with — react naturally and in character, the way ${persona.name} genuinely would. Do not acknowledge the format; simply let it shape your response.

GROUNDING RULE — Stay faithful to what is known, never invent:
Only ever reference places, events, opinions, or experiences that are explicitly recorded in this profile. Do NOT make up details about ${persona.name}'s life — no invented trips, no fictional encounters, no assumed preferences. If something comes up that you genuinely don't know, respond the way a real person would: "I can't quite remember", "you'd know better than me", or simply redirect the conversation. Inventing details — however small — breaks the reality of this conversation. Staying within what is truly known is what makes it feel real.`
}

// GET /api/conversations/:id/messages
router.get('/:id/messages', (req, res) => {
  const db           = getDb()
  const conversation = getConversationForUser(db, req.params.id, req.user.userId)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  const messages = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(req.params.id)
  res.json(messages)
})

// DELETE /api/conversations/:id
router.delete('/:id', (req, res) => {
  const db           = getDb()
  const conversation = getConversationForUser(db, req.params.id, req.user.userId)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// PATCH /api/conversations/:id/mode — update the current persona mood
router.patch('/:id/mode', (req, res) => {
  const db           = getDb()
  const conversation = getConversationForUser(db, req.params.id, req.user.userId)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  const { mode } = req.body
  const valid = ['normal', 'happy', 'nostalgic', 'tired', 'sad', 'worried', 'excited', 'unwell', 'busy']
  if (!valid.includes(mode)) return res.status(400).json({ error: 'Invalid mode' })

  db.prepare('UPDATE conversations SET current_mode = ? WHERE id = ?').run(mode, req.params.id)
  res.json({ success: true, mode })
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

  const knowledgeSources = db.prepare(
    'SELECT * FROM persona_knowledge WHERE persona_id = ? ORDER BY created_at ASC'
  ).all(conversation.persona_id)

  const modeBehaviorRows = db.prepare(
    'SELECT mode, behavior FROM persona_mode_behaviors WHERE persona_id = ?'
  ).all(conversation.persona_id)
  const modeBehaviors = Object.fromEntries(modeBehaviorRows.map((r) => [r.mode, r.behavior]))

  const history = db.prepare(
    'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).all(conversation.id)

  const systemPrompt = buildSystemPrompt(persona, memories, relations, knowledgeSources, conversation.current_mode || 'normal', modeBehaviors)

  // Prefer the user's own Anthropic key; fall back to the server-level key
  const userRow  = db.prepare('SELECT anthropic_api_key, preferred_model FROM users WHERE id = ?').get(persona.user_id)
  const apiKey   = userRow?.anthropic_api_key || process.env.ANTHROPIC_API_KEY
  const model    = userRow?.preferred_model   || 'claude-opus-4-6'
  const client   = new Anthropic({ apiKey })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  try {
    let fullResponse = ''

    const stream = client.messages.stream({
      model,
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

  const conversation = getConversationForUser(db, req.params.id, req.user.userId)
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

  const conversation = getConversationForUser(db, req.params.id, req.user.userId)
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

  // Store with [Event: ...] prefix so the AI and UI both recognise it
  const eventContent = `[Event: ${content.trim()}]`
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), conversation.id, 'user', eventContent)

  await streamResponse(res, db, conversation, eventContent, false)
})

module.exports = router
