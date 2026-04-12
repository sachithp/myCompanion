import { useState } from 'react'
import { X, Plus } from 'lucide-react'

// Structured life-context editor — location, places, interests, likes, dislikes, routine, notes
// This data grounds the AI in known facts and prevents it from inventing details.

const INTEREST_GROUPS = [
  {
    label: 'Home & Garden',
    items: ['Gardening', 'Cooking & Baking', 'Home decorating', 'DIY & repairs'],
  },
  {
    label: 'Creative',
    items: ['Knitting & Sewing', 'Art & Drawing', 'Photography', 'Writing', 'Playing music', 'Singing'],
  },
  {
    label: 'Active',
    items: ['Walking & Hiking', 'Swimming', 'Cycling', 'Dancing', 'Sport', 'Yoga & Meditation'],
  },
  {
    label: 'Social & Community',
    items: ['Family gatherings', 'Volunteering', 'Church & Faith', 'Card games', 'Board games', 'Socialising at cafés'],
  },
  {
    label: 'Culture & Learning',
    items: ['Reading', 'History', 'Travel', 'Theatre & Cinema', 'TV & Films', 'Podcasts & Radio'],
  },
  {
    label: 'Nature & Animals',
    items: ['Bird watching', 'Fishing', 'Wildlife', 'Pets & Animals'],
  },
  {
    label: 'Collecting & Pastimes',
    items: ['Stamps & Coins', 'Antiques', 'Crosswords & Puzzles', 'Model making'],
  },
]

// ── TagInput ──────────────────────────────────────────────────────────────────
// Reusable free-text tag input. Tags are added with Enter or the + button
// and dismissed with ×.
//
// Props:
//   tags       — string[]
//   onChange   — (newTags: string[]) => void
//   placeholder — string
//   tagClass   — Tailwind classes applied to each tag pill
//   addBtnClass — Tailwind classes for the + button
function TagInput({ tags, onChange, placeholder, tagClass, addBtnClass }) {
  const [draft, setDraft] = useState('')

  function add() {
    const v = draft.trim()
    if (!v) return
    if (!tags.includes(v)) onChange([...tags, v])
    setDraft('')
  }

  function remove(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); add() }
    // Backspace on empty input removes the last tag
    if (e.key === 'Backspace' && !draft && tags.length > 0) {
      remove(tags[tags.length - 1])
    }
  }

  return (
    <div>
      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                          font-medium border ${tagClass}`}>
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          className="input text-sm flex-1"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className={`flex-shrink-0 w-9 h-10 rounded-xl flex items-center justify-center
                      transition-colors disabled:opacity-30 ${addBtnClass}`}
          title="Add"
        >
          <Plus size={15} />
        </button>
      </div>
      <p className="text-xs text-warm-400 mt-1">Press Enter or click + to add · Backspace to remove last</p>
    </div>
  )
}

// ── LifeContextEditor ─────────────────────────────────────────────────────────
/**
 * Props:
 *   values   — { location, usual_places, daily_routine, interests: string[],
 *                likes: string[], dislikes: string[], context_notes }
 *   onChange — (key, value) => void
 */
export default function LifeContextEditor({ values, onChange }) {
  const interests = values.interests || []
  const likes     = values.likes     || []
  const dislikes  = values.dislikes  || []

  function toggleInterest(item) {
    const updated = interests.includes(item)
      ? interests.filter((i) => i !== item)
      : [...interests, item]
    onChange('interests', updated)
  }

  return (
    <div className="space-y-6">

      {/* Location + Usual places */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Where they live</label>
          <input
            className="input"
            placeholder="e.g. Liverpool, England"
            value={values.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Places they often visit</label>
          <input
            className="input"
            placeholder="e.g. the park, St. Mary's Church, the local library"
            value={values.usual_places || ''}
            onChange={(e) => onChange('usual_places', e.target.value)}
          />
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="label">Interests &amp; hobbies</label>
        <p className="text-xs text-warm-400 mb-3">
          Select everything that applies — the AI will only reference these, never assume others.
        </p>
        <div className="space-y-4">
          {INTEREST_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const selected = interests.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150
                        ${selected
                          ? 'bg-warm-600 text-white border-warm-600 shadow-sm'
                          : 'bg-white text-warm-600 border-warm-300 hover:border-warm-500 hover:bg-warm-50'
                        }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {interests.length > 0 && (
          <p className="text-xs text-warm-500 mt-3 italic">
            {interests.length} selected: {interests.join(', ')}
          </p>
        )}
      </div>

      {/* Likes & Dislikes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Likes */}
        <div>
          <label className="label">Things they like</label>
          <p className="text-xs text-warm-400 mb-3">
            Specific foods, places, topics, traditions, small things that brought them joy.
          </p>
          <TagInput
            tags={likes}
            onChange={(v) => onChange('likes', v)}
            placeholder="e.g. strong tea, rainy Sundays…"
            tagClass="bg-warm-100 text-warm-800 border-warm-300"
            addBtnClass="bg-warm-100 text-warm-700 hover:bg-warm-200"
          />
        </div>

        {/* Dislikes */}
        <div>
          <label className="label">Things they dislike</label>
          <p className="text-xs text-warm-400 mb-3">
            Things they avoided, complained about, or simply couldn't stand.
          </p>
          <TagInput
            tags={dislikes}
            onChange={(v) => onChange('dislikes', v)}
            placeholder="e.g. loud music, being rushed…"
            tagClass="bg-blush-50 text-blush-700 border-blush-200"
            addBtnClass="bg-blush-50 text-blush-600 hover:bg-blush-100"
          />
        </div>

      </div>

      {/* Daily routine */}
      <div>
        <label className="label">Typical daily routine</label>
        <p className="text-xs text-warm-400 mb-2">
          A rough sketch of their day — morning habits, meals, regular activities.
        </p>
        <textarea
          className="textarea h-24"
          placeholder="e.g. Up at 7am, tea and the morning paper, walks to the corner shop most days, watches the evening news before bed…"
          value={values.daily_routine || ''}
          onChange={(e) => onChange('daily_routine', e.target.value)}
        />
      </div>

      {/* Additional context */}
      <div>
        <label className="label">Other known details</label>
        <p className="text-xs text-warm-400 mb-2">
          Occupation, beliefs, favourite TV programmes — any factual details that help paint the picture.
        </p>
        <textarea
          className="textarea h-24"
          placeholder="e.g. Retired school teacher. Watches Coronation Street. Never missed Sunday Mass…"
          value={values.context_notes || ''}
          onChange={(e) => onChange('context_notes', e.target.value)}
        />
      </div>

    </div>
  )
}
