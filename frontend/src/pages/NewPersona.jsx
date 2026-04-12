import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, User, Plus, X } from 'lucide-react'
import { createPersona, addMemory, uploadPhoto } from '../api'

export default function NewPersona() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    relationship: '',
    description: '',
    past_conversations: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [memories, setMemories] = useState([])
  const [memoryDraft, setMemoryDraft] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function addMemoryDraft() {
    if (!memoryDraft.title.trim() || !memoryDraft.content.trim()) return
    setMemories((prev) => [...prev, { ...memoryDraft, id: Date.now() }])
    setMemoryDraft({ title: '', content: '' })
  }

  function removeMemoryDraft(id) {
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Please enter a name.'); return }
    setSaving(true)
    setError('')

    try {
      let photo_path = null
      if (photoFile) {
        const uploadRes = await uploadPhoto(photoFile)
        photo_path = uploadRes.data.path
      }

      const personaRes = await createPersona({ ...form, photo_path })
      const personaId = personaRes.data.id

      for (const mem of memories) {
        await addMemory(personaId, { title: mem.title, content: mem.content })
      }

      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1.5 mb-6 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="font-serif text-2xl text-warm-900 font-semibold mb-1">Add a Loved One</h1>
      <p className="text-warm-500 text-sm mb-8">
        The more you share, the more naturally the AI will speak in their voice.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo + Name + Relationship */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-5">Who they are</h2>

          {/* Photo */}
          <div className="flex items-start gap-5 mb-5">
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="relative flex-shrink-0 w-20 h-20 rounded-full bg-warm-100
                         border-2 border-dashed border-warm-300 hover:border-warm-500
                         flex items-center justify-center overflow-hidden transition-colors group"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-warm-400
                                group-hover:text-warm-600 transition-colors">
                  <Camera size={20} />
                  <span className="text-xs">Photo</span>
                </div>
              )}
            </button>
            <input type="file" accept="image/*" ref={fileRef} onChange={handlePhotoChange} className="hidden" />

            <div className="flex-1 space-y-3">
              <div>
                <label className="label">Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Grandma Rose, Dad, Michael…"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input
                  className="input"
                  placeholder="e.g. grandmother, father, best friend…"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Their personality</h2>
          <p className="text-warm-400 text-xs mb-4">
            Describe how they spoke, what they cared about, their warmth, their humor, their quirks.
          </p>
          <textarea
            className="textarea h-36"
            placeholder="e.g. She always had a warm smile and called everyone 'dear'. She loved gardening and would talk about her roses for hours. She had a dry wit and a contagious laugh…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Past conversations */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Their words</h2>
          <p className="text-warm-400 text-xs mb-4">
            Paste old texts, letters, emails, or things they often said. This helps the AI speak more like them.
          </p>
          <textarea
            className="textarea h-40"
            placeholder={"e.g. \"Don't forget to eat, sweetheart.\" / \"I'm so proud of you, no matter what.\" / Paste a letter or message here\u2026"}
            value={form.past_conversations}
            onChange={(e) => setForm({ ...form, past_conversations: e.target.value })}
          />
        </div>

        {/* Memories */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Cherished memories</h2>
          <p className="text-warm-400 text-xs mb-4">
            Add specific memories or stories the AI can reference in conversation.
          </p>

          {/* Existing memory drafts */}
          {memories.length > 0 && (
            <div className="space-y-2 mb-4">
              {memories.map((m) => (
                <div key={m.id} className="flex items-start gap-3 bg-warm-50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800">{m.title}</p>
                    <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{m.content}</p>
                  </div>
                  <button type="button" onClick={() => removeMemoryDraft(m.id)}
                    className="text-warm-400 hover:text-blush-500 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add memory */}
          <div className="space-y-2">
            <input
              className="input text-sm"
              placeholder="Memory title (e.g. Sunday dinners)"
              value={memoryDraft.title}
              onChange={(e) => setMemoryDraft({ ...memoryDraft, title: e.target.value })}
            />
            <textarea
              className="textarea h-20 text-sm"
              placeholder="Describe the memory…"
              value={memoryDraft.content}
              onChange={(e) => setMemoryDraft({ ...memoryDraft, content: e.target.value })}
            />
            <button
              type="button"
              onClick={addMemoryDraft}
              disabled={!memoryDraft.title.trim() || !memoryDraft.content.trim()}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
            >
              <Plus size={14} /> Add Memory
            </button>
          </div>
        </div>

        {error && <p className="text-blush-500 text-sm text-center">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/')} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Companion'}
          </button>
        </div>
      </form>
    </div>
  )
}
