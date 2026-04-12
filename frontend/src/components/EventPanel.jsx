import { useState } from 'react'
import { X, Send } from 'lucide-react'

const EVENT_GROUPS = [
  {
    label: 'Time of day',
    events: [
      'I just woke up',
      "It's morning",
      "It's lunchtime",
      'I just got home',
      "It's evening",
      "I'm about to go to bed",
    ],
  },
  {
    label: 'Weather',
    events: [
      "It's a beautiful sunny day",
      "It's raining outside",
      "It's snowing",
      "It's a cold winter day",
      "It's a warm summer evening",
    ],
  },
  {
    label: 'How I\'m feeling',
    events: [
      "I'm feeling happy today",
      "I'm feeling a bit sad",
      "I'm feeling stressed",
      "I'm feeling lonely",
      "I'm not feeling well",
      "I'm feeling nostalgic",
    ],
  },
  {
    label: 'Occasions',
    events: [
      "It's my birthday today",
      "It's your birthday",
      "It's Christmas",
      "It's New Year's Eve",
      "It's a family occasion",
      "It's a public holiday",
    ],
  },
  {
    label: 'Life moments',
    events: [
      'I just received some good news',
      'I just received some difficult news',
      'I had a great day',
      'I had a really tough day',
      'I just got promoted',
      'I need your advice on something',
    ],
  },
]

export default function EventPanel({ onAdd, onClose }) {
  const [custom, setCustom] = useState('')

  function handleCustomSubmit(e) {
    e.preventDefault()
    if (!custom.trim()) return
    onAdd(custom.trim())
    setCustom('')
  }

  return (
    <div className="bg-white border-t border-warm-200">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <p className="text-xs font-semibold text-warm-700">Add a live event</p>
          <p className="text-xs text-warm-400 mt-0.5">
            Tell {'{them}'} something that just happened — they'll respond in character.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-warm-400 hover:text-warm-600 p-1 rounded-lg hover:bg-warm-100
                     transition-colors flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>

      {/* Preset events — scrollable */}
      <div className="px-4 pb-2 max-h-52 overflow-y-auto space-y-3">
        {EVENT_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.events.map((event) => (
                <button
                  key={event}
                  type="button"
                  onClick={() => onAdd(event)}
                  className="px-3 py-1 rounded-full text-xs bg-warm-50 text-warm-700
                             border border-warm-200 hover:bg-warm-600 hover:text-white
                             hover:border-warm-600 transition-all duration-150"
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom event input */}
      <div className="px-4 pb-3 pt-2 border-t border-warm-100">
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Describe something that just happened…"
            className="flex-1 text-xs bg-warm-50 border border-warm-200 rounded-xl
                       px-3 py-2 text-warm-900 placeholder-warm-400
                       focus:outline-none focus:ring-2 focus:ring-warm-400
                       focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!custom.trim()}
            className="flex-shrink-0 w-7 h-7 bg-warm-600 hover:bg-warm-700
                       disabled:bg-warm-200 rounded-lg flex items-center justify-center
                       transition-colors"
          >
            <Send size={12} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  )
}
