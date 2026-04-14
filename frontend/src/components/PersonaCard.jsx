import { useNavigate } from 'react-router-dom'
import { MessageCircle, Pencil, Trash2, BookOpen, Download } from 'lucide-react'
import { deletePersona, exportPersona } from '../api'

const AVATAR_COLORS = ['#C4956A', '#A87040', '#8B5E3C', '#D4A5A5', '#6B8E6B', '#7A8BB5']

function getColor(name) {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PersonaCard({ persona, onDeleted }) {
  const navigate = useNavigate()

  async function handleDelete() {
    if (!confirm(`Remove ${persona.name} from your companions?`)) return
    try {
      await deletePersona(persona.id)
      onDeleted(persona.id)
    } catch {
      alert('Could not delete. Please try again.')
    }
  }

  return (
    <div className="card group hover:shadow-warm-lg transition-shadow duration-300">
      <div className="p-6">
        {/* Avatar */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            {persona.photo_path ? (
              <img
                src={persona.photo_path}
                alt={persona.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-warm-200"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center
                           text-white text-xl font-serif font-semibold border-2 border-warm-200"
                style={{ backgroundColor: getColor(persona.name) }}
              >
                {getInitials(persona.name)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => exportPersona(persona.id, persona.name).catch(() => alert('Export failed. Please try again.'))}
              className="p-1.5 rounded-lg text-warm-400 hover:text-warm-600 hover:bg-warm-100
                         transition-colors"
              title="Export"
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => navigate(`/personas/${persona.id}/edit`)}
              className="p-1.5 rounded-lg text-warm-400 hover:text-warm-600 hover:bg-warm-100
                         transition-colors"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-warm-400 hover:text-blush-500 hover:bg-blush-50
                         transition-colors"
              title="Remove"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Name & relationship */}
        <h3 className="font-serif text-xl text-warm-900 font-semibold leading-tight">
          {persona.name}
        </h3>
        {persona.relationship && (
          <p className="text-warm-500 text-sm mt-0.5 capitalize">{persona.relationship}</p>
        )}

        {/* Memory count */}
        {persona.memory_count > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-warm-400 text-xs">
            <BookOpen size={12} />
            <span>{persona.memory_count} {persona.memory_count === 1 ? 'memory' : 'memories'}</span>
          </div>
        )}
      </div>

      {/* Chat button */}
      <div className="px-6 pb-5">
        <button
          onClick={() => navigate(`/personas/${persona.id}/chat`)}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <MessageCircle size={16} />
          Start Chatting
        </button>
      </div>
    </div>
  )
}
