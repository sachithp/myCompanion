import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, UserPlus, Upload, X, BookOpen, AlertCircle, Users, MapPin, Tag, Library } from 'lucide-react'
import PersonaCard from '../components/PersonaCard'
import { getPersonas, importPersona } from '../api'

// Compact read-only OCEAN summary for the import preview
const OCEAN_LABELS = [
  { key: 'ocean_openness',          label: 'Openness',     color: '#A87040', lowPole: 'Conventional', highPole: 'Imaginative' },
  { key: 'ocean_conscientiousness', label: 'Conscient.',   color: '#6B8E6B', lowPole: 'Spontaneous',  highPole: 'Diligent'    },
  { key: 'ocean_extraversion',      label: 'Extraversion', color: '#C4956A', lowPole: 'Reserved',     highPole: 'Outgoing'    },
  { key: 'ocean_agreeableness',     label: 'Agreeable.',   color: '#C4728A', lowPole: 'Frank',        highPole: 'Warm'        },
  { key: 'ocean_neuroticism',       label: 'Sensitivity',  color: '#7A8BB5', lowPole: 'Calm',         highPole: 'Heartfelt'   },
]

function OceanPreview({ persona }) {
  const hasAny = OCEAN_LABELS.some(
    (t) => persona[t.key] !== null && persona[t.key] !== undefined
  )
  if (!hasAny) return null

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-warm-600 mb-2">Personality profile</p>
      <div className="space-y-1.5">
        {OCEAN_LABELS.map(({ key, label, color, lowPole, highPole }) => {
          const val = persona[key] ?? 50
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-warm-500 w-20 flex-shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${val}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-xs text-warm-400 w-14 text-right flex-shrink-0">
                {val <= 30 ? lowPole : val >= 70 ? highPole : 'Moderate'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Home() {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Import state
  const fileInputRef = useRef(null)
  const [importPreview, setImportPreview] = useState(null)  // parsed JSON
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    getPersonas()
      .then((res) => setPersonas(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleDeleted(id) {
    setPersonas((prev) => prev.filter((p) => p.id !== id))
  }

  // ── Import helpers ────────────────────────────────────────────────────────

  function handleFileSelected(e) {
    const file = e.target.files[0]
    e.target.value = ''           // allow re-selecting the same file
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data?.persona?.name) throw new Error('Missing persona name')
        setImportError('')
        setImportPreview(data)
      } catch {
        setImportError('This file doesn\'t look like a valid companion file. Please try another.')
      }
    }
    reader.readAsText(file)
  }

  async function handleConfirmImport() {
    if (!importPreview) return
    setImporting(true)
    setImportError('')
    try {
      const res = await importPersona(importPreview)
      setPersonas((prev) => [res.data, ...prev])
      setImportPreview(null)
    } catch (err) {
      setImportError(err.response?.data?.error || 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-warm-400">
          <div className="w-5 h-5 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin" />
          <span className="text-sm">Loading your companions…</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero area */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-warm-100
                        rounded-full mb-4 shadow-inner">
          <Heart size={26} className="text-warm-600 fill-warm-200" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-warm-900 font-semibold">
          Your Cherished Connections
        </h1>
        <p className="text-warm-500 mt-2 text-base max-w-md mx-auto leading-relaxed">
          Have a warm conversation with the people who matter most — near or far, past or present.
        </p>

        {/* Import button */}
        <button
          onClick={() => fileInputRef.current.click()}
          className="mt-5 inline-flex items-center gap-2 text-sm text-warm-500
                     hover:text-warm-700 border border-warm-200 hover:border-warm-400
                     rounded-xl px-4 py-2 transition-colors bg-white hover:bg-warm-50"
        >
          <Upload size={14} />
          Import a Companion
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {personas.length === 0 ? (
        /* Empty state */
        <div className="card max-w-md mx-auto text-center py-14 px-8">
          <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center
                          mx-auto mb-5">
            <UserPlus size={28} className="text-warm-500" />
          </div>
          <h2 className="font-serif text-xl text-warm-800 font-semibold mb-2">
            Add your first companion
          </h2>
          <p className="text-warm-500 text-sm leading-relaxed mb-6">
            Create a profile for a loved one — a parent, grandparent, old friend, or anyone whose
            presence you cherish.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/personas/new')}
              className="btn-primary mx-auto"
            >
              + Add a Loved One
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="btn-secondary mx-auto flex items-center gap-2"
            >
              <Upload size={14} /> Import
            </button>
          </div>
        </div>
      ) : (
        /* Persona grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {personas.map((p) => (
            <PersonaCard key={p.id} persona={p} onDeleted={handleDeleted} />
          ))}

          {/* Add more card */}
          <button
            onClick={() => navigate('/personas/new')}
            className="border-2 border-dashed border-warm-200 rounded-2xl p-6
                       flex flex-col items-center justify-center gap-3 text-warm-400
                       hover:border-warm-400 hover:text-warm-600 hover:bg-warm-50
                       transition-all duration-200 min-h-[200px] group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-warm-300
                            group-hover:border-warm-500 flex items-center justify-center
                            transition-colors">
              <UserPlus size={20} />
            </div>
            <span className="text-sm font-medium">Add a Loved One</span>
          </button>
        </div>
      )}

      {/* File error toast */}
      {importError && !importPreview && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                        bg-blush-50 border border-blush-200 text-blush-700
                        rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3 text-sm max-w-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{importError}</span>
          <button onClick={() => setImportError('')} className="ml-2 text-blush-400 hover:text-blush-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Import preview modal */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             onClick={(e) => { if (e.target === e.currentTarget) setImportPreview(null) }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-warm-900/40 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 z-10">
            {/* Close */}
            <button
              onClick={() => { setImportPreview(null); setImportError('') }}
              className="absolute top-4 right-4 text-warm-400 hover:text-warm-600 p-1"
            >
              <X size={18} />
            </button>

            <h2 className="font-serif text-xl text-warm-900 font-semibold mb-1">
              Import Companion
            </h2>
            <p className="text-warm-500 text-sm mb-6">
              This will add a new companion to your collection.
            </p>

            {/* Persona preview */}
            <div className="flex items-center gap-4 mb-5">
              {importPreview.persona.photo ? (
                <img
                  src={importPreview.persona.photo}
                  alt={importPreview.persona.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-warm-200 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-warm-200 flex items-center justify-center
                                text-warm-600 text-xl font-serif font-semibold flex-shrink-0 border-2 border-warm-200">
                  {importPreview.persona.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-serif text-lg text-warm-900 font-semibold leading-tight truncate">
                  {importPreview.persona.name}
                </p>
                {importPreview.persona.relationship && (
                  <p className="text-warm-500 text-sm capitalize">{importPreview.persona.relationship}</p>
                )}
              </div>
            </div>

            {/* OCEAN personality bars */}
            <OceanPreview persona={importPreview.persona} />

            {importPreview.persona.description && (
              <p className="text-warm-500 text-xs leading-relaxed mb-4 line-clamp-2 italic">
                "{importPreview.persona.description}"
              </p>
            )}

            {/* Location */}
            {importPreview.persona.location && (
              <div className="flex items-center gap-1.5 text-warm-500 text-xs mb-3">
                <MapPin size={12} className="flex-shrink-0" />
                <span>{importPreview.persona.location}</span>
              </div>
            )}

            {/* Places */}
            {importPreview.persona.usual_places?.length > 0 && (
              <div className="flex items-start gap-1.5 text-warm-500 text-xs mb-3">
                <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {importPreview.persona.usual_places.slice(0, 4).map(p => p.name).join(', ')}
                  {importPreview.persona.usual_places.length > 4 && (
                    <span className="text-warm-400"> +{importPreview.persona.usual_places.length - 4} more</span>
                  )}
                </span>
              </div>
            )}

            {/* Interests */}
            {importPreview.persona.interests?.length > 0 && (
              <div className="flex items-start gap-1.5 text-warm-500 text-xs mb-4">
                <Tag size={12} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {importPreview.persona.interests.slice(0, 6).join(', ')}
                  {importPreview.persona.interests.length > 6 && (
                    <span className="text-warm-400"> +{importPreview.persona.interests.length - 6} more</span>
                  )}
                </span>
              </div>
            )}

            {/* Counts row */}
            {(importPreview.memories?.length > 0 || importPreview.relations?.length > 0 || importPreview.knowledge?.length > 0) && (
              <div className="flex flex-wrap items-center gap-4 text-warm-400 text-xs mb-5">
                {importPreview.memories?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={12} />
                    <span>{importPreview.memories.length} {importPreview.memories.length === 1 ? 'memory' : 'memories'}</span>
                  </div>
                )}
                {importPreview.relations?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users size={12} />
                    <span>{importPreview.relations.length} {importPreview.relations.length === 1 ? 'connection' : 'connections'}</span>
                  </div>
                )}
                {importPreview.knowledge?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Library size={12} />
                    <span>{importPreview.knowledge.length} knowledge {importPreview.knowledge.length === 1 ? 'source' : 'sources'}</span>
                  </div>
                )}
              </div>
            )}

            {importError && (
              <p className="text-blush-500 text-sm mb-4 flex items-center gap-2">
                <AlertCircle size={14} />
                {importError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setImportPreview(null); setImportError('') }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="btn-primary flex-1 disabled:opacity-60"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
