import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, RotateCcw, Heart, BookOpen, Loader, Zap, Smile } from 'lucide-react'
import { getPersona, getConversations, createConversation, getMessages, setMode } from '../api'
import EventPanel from '../components/EventPanel'
import { MODES, getModeById } from '../utils/modes'

const AVATAR_COLORS = ['#C4956A', '#A87040', '#8B5E3C', '#D4A5A5', '#6B8E6B', '#7A8BB5']

function getColor(name) {
  let hash = 0
  for (const ch of (name || '')) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ persona, size = 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  if (persona?.photo_path) {
    return (
      <img src={persona.photo_path} alt={persona.name}
        className={`${dim} rounded-full object-cover flex-shrink-0`} />
    )
  }
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0
                    text-white font-medium font-serif`}
      style={{ backgroundColor: getColor(persona?.name) }}>
      {getInitials(persona?.name)}
    </div>
  )
}

// Detect [Event: ...] messages and render as a context card instead of a chat bubble
function isEventMessage(content) {
  return typeof content === 'string' && content.startsWith('[Event: ') && content.endsWith(']')
}
function parseEventText(content) {
  return content.slice(8, -1)  // strip '[Event: ' prefix and ']' suffix
}

function EventCard({ content }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 message-in">
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200
                      rounded-full px-4 py-1.5 text-xs text-amber-700 max-w-sm">
        <Zap size={11} className="flex-shrink-0 text-amber-500 fill-amber-300" />
        <span className="italic">{parseEventText(content)}</span>
      </div>
    </div>
  )
}

function MessageBubble({ msg, persona }) {
  if (isEventMessage(msg.content)) return <EventCard content={msg.content} />

  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-2.5 message-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar persona={persona} size="sm" />}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
        ${isUser
          ? 'bg-warm-600 text-white rounded-br-md'
          : 'bg-white text-warm-900 rounded-bl-md border border-warm-100'
        }`}>
        {msg.content}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-warm-200 flex items-center justify-center
                        flex-shrink-0 text-warm-600">
          <Heart size={13} className="fill-warm-400" />
        </div>
      )}
    </div>
  )
}

function StreamingBubble({ content, persona }) {
  return (
    <div className="flex items-end gap-2.5 justify-start message-in">
      <Avatar persona={persona} size="sm" />
      <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed
                      shadow-sm bg-white text-warm-900 border border-warm-100">
        {content || (
          <span className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 bg-warm-300 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-warm-300 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-warm-300 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        )}
        {content && <span className="typing-cursor" />}
      </div>
    </div>
  )
}

export default function Chat() {
  const { id: personaId } = useParams()
  const navigate = useNavigate()

  const [persona, setPersona]               = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages]             = useState([])
  const [input, setInput]                   = useState('')
  const [isStreaming, setIsStreaming]        = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [showMemories, setShowMemories]     = useState(false)
  const [showEventPanel, setShowEventPanel] = useState(false)
  const [showModePanel, setShowModePanel]   = useState(false)
  const [currentMode, setCurrentMode]       = useState('normal')

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    async function init() {
      try {
        const [personaRes, convoRes] = await Promise.all([
          getPersona(personaId),
          getConversations(personaId),
        ])
        setPersona(personaRes.data)

        let convoId
        let convoMode = 'normal'
        if (convoRes.data.length > 0) {
          convoId   = convoRes.data[0].id
          convoMode = convoRes.data[0].current_mode || 'normal'
        } else {
          const newConvo = await createConversation(personaId)
          convoId   = newConvo.data.id
          convoMode = 'normal'
        }
        setConversationId(convoId)
        setCurrentMode(convoMode)

        const msgsRes = await getMessages(convoId)
        setMessages(msgsRes.data)
      } catch {
        setError('Could not load conversation. Please go back and try again.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [personaId])

  async function startNewConversation() {
    if (isStreaming) return
    try {
      const newConvo = await createConversation(personaId)
      setConversationId(newConvo.data.id)
      setMessages([])
      setCurrentMode('normal')
      setShowEventPanel(false)
      setShowModePanel(false)
    } catch {
      alert('Could not start a new conversation.')
    }
  }

  function handleInputChange(e) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  // ── Mode change ─────────────────────────────────────────────────────────
  async function handleModeChange(modeId) {
    setCurrentMode(modeId)
    setShowModePanel(false)
    try {
      await setMode(conversationId, modeId)
    } catch {
      // Non-critical — mode set locally even if persist fails
    }
  }

  // ── Shared SSE stream reader ─────────────────────────────────────────────
  async function doStream(url, displayMessage) {
    setIsStreaming(true)
    setStreamingContent('')
    setError('')

    try {
      const token = localStorage.getItem('mc_token')
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: displayMessage }),
      })
      if (!response.ok) throw new Error('Network error')

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              fullContent += data.text
              setStreamingContent(fullContent)
            }
            if (data.done) {
              setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, role: 'assistant', content: fullContent },
              ])
              setStreamingContent('')
              setIsStreaming(false)
              inputRef.current?.focus()
            }
            if (data.error) {
              setError(data.error)
              setIsStreaming(false)
            }
          } catch {}
        }
      }
    } catch {
      setError('Connection lost. Please try again.')
      setIsStreaming(false)
    }
  }

  // ── Send a regular user message ──────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text }])
    setShowEventPanel(false)

    await doStream(`/api/conversations/${conversationId}/messages`, text)
  }

  // ── Inject a live event ──────────────────────────────────────────────────
  async function sendEvent(eventText) {
    if (isStreaming || !eventText.trim()) return
    setShowEventPanel(false)
    // Add the event card to the local message list immediately
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', content: `[Event: ${eventText.trim()}]` },
    ])
    await doStream(`/api/conversations/${conversationId}/events`, eventText.trim())
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-warm-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-warm-400">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm">Opening conversation…</span>
        </div>
      </div>
    )
  }

  if (error && !conversationId) {
    return (
      <div className="h-screen bg-warm-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-warm-600 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go Back</button>
        </div>
      </div>
    )
  }

  const hasMemories = persona?.memories?.length > 0
  const personaFirstName = persona?.name?.split(' ')[0] || ''

  return (
    <div className="h-screen bg-warm-50 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-warm-100 shadow-sm flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="text-warm-400 hover:text-warm-700 p-1 rounded-lg hover:bg-warm-100
                         transition-colors -ml-1">
              <ArrowLeft size={18} />
            </button>
            <Avatar persona={persona} />
            <div>
              <h1 className="font-serif text-base font-semibold text-warm-900 leading-tight">
                {persona?.name}
              </h1>
              {persona?.relationship && (
                <p className="text-xs text-warm-400 capitalize leading-tight">{persona.relationship}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasMemories && (
              <button onClick={() => { setShowMemories((v) => !v); setShowModePanel(false) }}
                className="btn-ghost text-xs flex items-center gap-1.5 py-1.5">
                <BookOpen size={14} />
                <span className="hidden sm:inline">Memories</span>
              </button>
            )}
            {/* Mode toggle — shows emoji when non-normal */}
            <button
              onClick={() => { setShowModePanel((v) => !v); setShowMemories(false) }}
              title="Set mood"
              className={`btn-ghost text-xs flex items-center gap-1.5 py-1.5 transition-colors
                ${showModePanel ? 'bg-warm-100 text-warm-800' : ''}
                ${currentMode !== 'normal' ? 'text-warm-700 font-medium' : ''}`}
            >
              {currentMode !== 'normal'
                ? <span className="text-base leading-none">{getModeById(currentMode).emoji}</span>
                : <Smile size={14} />
              }
              <span className="hidden sm:inline">
                {currentMode !== 'normal' ? getModeById(currentMode).label : 'Mood'}
              </span>
            </button>
            <button onClick={startNewConversation}
              className="btn-ghost text-xs flex items-center gap-1.5 py-1.5"
              title="Start new conversation">
              <RotateCcw size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Memories panel */}
        {showMemories && hasMemories && (
          <div className="border-t border-warm-100 bg-warm-50 max-w-3xl mx-auto px-4 py-3">
            <p className="text-xs font-medium text-warm-600 mb-2">Memories</p>
            <div className="flex flex-wrap gap-2">
              {persona.memories.map((m) => (
                <div key={m.id} className="bg-white border border-warm-200 rounded-xl px-3 py-1.5
                                           text-xs text-warm-700 max-w-xs">
                  <span className="font-medium">{m.title}:</span>{' '}
                  <span className="text-warm-500">{m.content.slice(0, 60)}{m.content.length > 60 ? '…' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode picker panel */}
        {showModePanel && (
          <div className="border-t border-warm-100 bg-warm-50 max-w-3xl mx-auto px-4 py-4">
            <p className="text-xs font-medium text-warm-600 mb-3">
              How is {persona?.name?.split(' ')[0] || 'them'} feeling right now?
              <span className="font-normal text-warm-400 ml-1">
                — shapes their tone for the whole conversation
              </span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border
                              text-center transition-all
                    ${currentMode === m.id
                      ? 'bg-warm-800 border-warm-800 text-white shadow-sm'
                      : 'bg-white border-warm-200 text-warm-700 hover:border-warm-400 hover:bg-warm-50'
                    }`}
                >
                  <span className="text-xl leading-none">{m.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{m.label}</span>
                  <span className={`text-[10px] leading-tight
                    ${currentMode === m.id ? 'text-warm-200' : 'text-warm-400'}`}>
                    {m.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-4">
                <Avatar persona={persona} size="lg" />
              </div>
              <p className="font-serif text-warm-600 text-lg">
                Say hello to {personaFirstName}
              </p>
              <p className="text-warm-400 text-sm mt-1">
                Start the conversation — they're here with you.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
                {[
                  `I've been thinking about you, ${personaFirstName}…`,
                  'How are you doing today?',
                  'I miss you so much.',
                  'Can we talk for a while?',
                ].map((starter) => (
                  <button key={starter}
                    onClick={() => { setInput(starter); inputRef.current?.focus() }}
                    className="bg-white border border-warm-200 rounded-full px-3 py-1.5 text-xs
                               text-warm-600 hover:bg-warm-100 hover:border-warm-300 transition-colors">
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} persona={persona} />
          ))}

          {isStreaming && (
            <StreamingBubble content={streamingContent} persona={persona} />
          )}

          {error && (
            <p className="text-center text-blush-500 text-xs">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-warm-100 flex-shrink-0">
        <div className="max-w-3xl mx-auto">

          {/* Event panel — slides in above the input row */}
          {showEventPanel && (
            <EventPanel
              onAdd={sendEvent}
              onClose={() => setShowEventPanel(false)}
            />
          )}

          <div className="px-4 py-3">
            <div className="flex items-end gap-2 bg-warm-50 rounded-2xl border border-warm-200
                            focus-within:border-warm-400 focus-within:ring-2 focus-within:ring-warm-200
                            transition-all px-4 py-2.5">
              {/* ⚡ Event toggle */}
              <button
                type="button"
                onClick={() => setShowEventPanel((v) => !v)}
                disabled={isStreaming}
                title="Add a live event"
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                            transition-colors mb-0.5 disabled:opacity-40
                            ${showEventPanel
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100'
                            }`}
              >
                <Zap size={14} className={showEventPanel ? 'fill-amber-400' : ''} />
              </button>

              <textarea
                ref={(el) => { textareaRef.current = el; inputRef.current = el }}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm
                           text-warm-900 placeholder-warm-400 leading-relaxed"
                placeholder={`Message ${personaFirstName}…`}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 w-8 h-8 bg-warm-600 hover:bg-warm-700 disabled:bg-warm-200
                           rounded-xl flex items-center justify-center transition-colors mb-0.5"
              >
                {isStreaming
                  ? <Loader size={14} className="text-white animate-spin" />
                  : <Send size={14} className="text-white" />
                }
              </button>
            </div>

            <p className="text-center text-warm-300 text-xs mt-2">
              Enter to send · Shift+Enter for new line · ⚡ event · 😊 mood
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
