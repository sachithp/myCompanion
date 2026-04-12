import { useState } from 'react'
import { Plus, X, Users } from 'lucide-react'

const EMPTY_DRAFT = { name: '', relation_to_persona: '', relation_to_user: '', notes: '' }

/**
 * RelationsEditor — manages a list of people connected to the persona.
 *
 * Props:
 *   personaName  — used for label text (e.g. "Grandma Rose's relationship to them")
 *   relations    — array of relation objects
 *   onAdd        — async (draft) => relation  (called when the user clicks Add)
 *   onDelete     — async (id) => void
 *   readOnly     — bool, disables editing (used in import preview)
 */
export default function RelationsEditor({ personaName, relations, onAdd, onDelete }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  function setField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAdd() {
    if (!draft.name.trim()) { setError('Please enter their name.'); return }
    setError('')
    setAdding(true)
    try {
      await onAdd({ ...draft })
      setDraft(EMPTY_DRAFT)
    } catch {
      setError('Could not add this person. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const label = personaName || 'them'

  return (
    <div>
      {/* Existing relations */}
      {relations.length > 0 && (
        <div className="space-y-2 mb-5">
          {relations.map((r) => (
            <div key={r.id ?? r._draftId}
              className="flex items-start gap-3 bg-warm-50 rounded-xl px-4 py-3 border border-warm-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-warm-900">{r.name}</span>
                  {r.relation_to_persona && (
                    <span className="text-xs bg-warm-200 text-warm-700 px-2 py-0.5 rounded-full">
                      {label}'s {r.relation_to_persona}
                    </span>
                  )}
                  {r.relation_to_user && (
                    <span className="text-xs bg-blush-100 text-blush-700 px-2 py-0.5 rounded-full">
                      your {r.relation_to_user}
                    </span>
                  )}
                </div>
                {r.notes && (
                  <p className="text-xs text-warm-500 mt-1">{r.notes}</p>
                )}
              </div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(r.id ?? r._draftId)}
                  className="text-warm-400 hover:text-blush-500 flex-shrink-0 mt-0.5"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {relations.length === 0 && (
        <div className="flex items-center gap-2 text-warm-300 text-xs mb-4 italic">
          <Users size={13} />
          No people added yet — add family members, friends, or anyone they both knew.
        </div>
      )}

      {/* Add new relation form */}
      <div className="space-y-2 bg-warm-50 rounded-xl p-4 border border-warm-100">
        <p className="text-xs font-medium text-warm-600 mb-3">Add a person</p>

        {/* Name */}
        <input
          className="input text-sm"
          placeholder="Their name (e.g. John)"
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          {/* Relation to persona */}
          <div>
            <label className="block text-xs text-warm-500 mb-1">
              {label}'s relationship to them
            </label>
            <input
              className="input text-sm"
              placeholder="e.g. grandson, best friend"
              value={draft.relation_to_persona}
              onChange={(e) => setField('relation_to_persona', e.target.value)}
            />
          </div>

          {/* Relation to user */}
          <div>
            <label className="block text-xs text-warm-500 mb-1">
              Your relationship to them
            </label>
            <input
              className="input text-sm"
              placeholder="e.g. brother, colleague"
              value={draft.relation_to_user}
              onChange={(e) => setField('relation_to_user', e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <input
          className="input text-sm"
          placeholder="Optional: a note about them (e.g. lives in London, loves football)"
          value={draft.notes}
          onChange={(e) => setField('notes', e.target.value)}
        />

        {error && <p className="text-blush-500 text-xs">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !draft.name.trim()}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Plus size={14} />
          {adding ? 'Adding…' : 'Add Person'}
        </button>
      </div>
    </div>
  )
}
