import { useState } from 'react'
import { MODES } from '../utils/modes'

// Shown as placeholder/hint below each textarea
const PLACEHOLDER_HINTS = {
  normal:    'e.g. always ends messages with a blessing, uses pet names, tends to start with "How are you eating?"',
  happy:     'e.g. starts humming old songs, tells longer stories, brings up upcoming family events',
  nostalgic: 'e.g. talks about her village growing up, mentions specific relatives who have passed',
  tired:     'e.g. shorter sentences, mentions her back is hurting, still asks about the kids but briefly',
  sad:       'e.g. gets quiet and prays, references missing people, may cry a little on the phone',
  worried:   'e.g. keeps asking if you have eaten, warns about the weather, mentions health concerns',
  excited:   'e.g. talks very fast, mixes two languages, tells everyone in the family your news',
  unwell:    'e.g. keeps saying "I am fine, don\'t worry", but sounds weak, coughs between sentences',
  busy:      'e.g. says she is cooking or at the market, cuts sentences short, promises to call back',
}

export default function ModeBehaviorsEditor({ personaName, values = {}, onChange }) {
  // Track which mode row is expanded (only one at a time for compactness)
  const [expanded, setExpanded] = useState(null)

  function toggle(modeId) {
    setExpanded((prev) => (prev === modeId ? null : modeId))
  }

  return (
    <div className="space-y-2">
      {MODES.map((m) => {
        const current = values[m.id] || ''
        const hasValue = current.trim().length > 0
        const isOpen = expanded === m.id

        return (
          <div
            key={m.id}
            className={`rounded-xl border transition-colors
              ${isOpen ? 'border-warm-300 bg-white' : 'border-warm-200 bg-warm-50'}
              ${hasValue && !isOpen ? 'border-warm-300' : ''}`}
          >
            {/* Row header — always visible */}
            <button
              type="button"
              onClick={() => toggle(m.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
            >
              <span className="text-lg leading-none flex-shrink-0">{m.emoji}</span>
              <span className="text-sm font-medium text-warm-800 flex-shrink-0 w-20">{m.label}</span>
              <span className="flex-1 text-xs text-warm-400 truncate">
                {hasValue
                  ? <span className="text-warm-600 italic">{current}</span>
                  : <span className="text-warm-300">{m.hint}</span>
                }
              </span>
              {/* Expand indicator */}
              <span className={`text-warm-400 text-xs flex-shrink-0 transition-transform
                ${isOpen ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {/* Expanded textarea */}
            {isOpen && (
              <div className="px-4 pb-4">
                <p className="text-xs text-warm-400 mb-2">
                  Describe how <span className="text-warm-600 font-medium">{personaName || 'this person'}</span> specifically
                  {m.id === 'normal'
                    ? ' behaves in general — patterns, phrases, habits the AI should always follow:'
                    : ` behaves when ${m.id === 'busy' ? 'busy' : m.id === 'unwell' ? 'unwell' : `feeling ${m.id}`}:`
                  }
                </p>
                <textarea
                  className="textarea text-sm h-20"
                  placeholder={PLACEHOLDER_HINTS[m.id]}
                  value={current}
                  onChange={(e) => onChange(m.id, e.target.value)}
                  onBlur={(e) => onChange(m.id, e.target.value, true /* persist */)}
                />
                {m.id === 'normal' && (
                  <p className="text-warm-300 text-xs mt-1.5">
                    Tip: this applies on top of the OCEAN personality in every conversation.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
