import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, Plus, X, Loader } from 'lucide-react'
import { getPersona, updatePersona, addMemory, deleteMemory, uploadPhoto } from '../api'

export default function EditPersona() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', relationship: '', description: '', past_conversations: '', photo_path: '',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [memories, setMemories] = useState([])
  const [memoryDraft, setMemoryDraft] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPersona(id)
      .then((res) => {
        const p = res.data
        setForm({
          name: p.name || '',
          relationship: p.relationship || '',
          description: p.description || '',
          past_conversations: p.past_conversations || '',
          photo_path: p.photo_path || '',
        })
        if (p.photo_path) setPhotoPreview(p.photo_path)
        setMemories(p.memories || [])
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleAddMemory() {
    if (!memoryDraft.title.trim() || !memoryDraft.content.trim()) return
    try {
      const res = await addMemory(id, memoryDraft)
      setMemories((prev) => [res.data, ...prev])
      setMemoryDraft({ title: '', content: '' })
    } catch {
      alert('Could not add memory. Please try again.')
    }
  }

  async function handleDeleteMemory(memoryId) {
    if (!confirm('Remove this memory?')) return
    try {
      await deleteMemory(id, memoryId)
      setMemories((prev) => prev.filter((m) => m.id !== memoryId))
    } catch {
      alert('Could not remove memory.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Please enter a name.'); return }
    setSaving(true)
    setError('')

    try {
      let photo_path = form.photo_path
      if (photoFile) {
        const uploadRes = await uploadPhoto(photoFile)
        photo_path = uploadRes.data.path
      }
      await updatePersona(id, { ...form, photo_path })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader size={20} className="animate-spin text-warm-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1.5 mb-6 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="font-serif text-2xl text-warm-900 font-semibold mb-1">Edit Companion</h1>
      <p className="text-warm-500 text-sm mb-8">Update the details to make conversations feel more natural.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo + Name + Relationship */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-5">Who they are</h2>
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
                <div className="flex flex-col items-center gap-1 text-warm-400 group-hover:text-warm-600">
                  <Camera size={20} />
                  <span className="text-xs">Photo</span>
                </div>
              )}
            </button>
            <input type="file" accept="image/*" ref={fileRef} onChange={handlePhotoChange} className="hidden" />

            <div className="flex-1 space-y-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input className="input" placeholder="e.g. grandmother, best friend…"
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Their personality</h2>
          <p className="text-warm-400 text-xs mb-4">How they spoke, what they cared about, their warmth and quirks.</p>
          <textarea className="textarea h-36" value={form.description}
            placeholder="Describe their personality, mannerisms, and what made them special…"
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {/* Past conversations */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Their words</h2>
          <p className="text-warm-400 text-xs mb-4">Old texts, letters, or things they often said.</p>
          <textarea className="textarea h-40" value={form.past_conversations}
            placeholder="Paste messages, letters, or phrases they used…"
            onChange={(e) => setForm({ ...form, past_conversations: e.target.value })} />
        </div>

        {/* Memories */}
        <div className="card p-6">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Cherished memories</h2>
          <p className="text-warm-400 text-xs mb-4">Specific stories and moments to reference in conversation.</p>

          {memories.length > 0 && (
            <div className="space-y-2 mb-5">
              {memories.map((m) => (
                <div key={m.id} className="flex items-start gap-3 bg-warm-50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800">{m.title}</p>
                    <p className="text-xs text-warm-500 mt-0.5">{m.content}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteMemory(m.id)}
                    className="text-warm-400 hover:text-blush-500 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <input className="input text-sm" placeholder="Memory title"
              value={memoryDraft.title}
              onChange={(e) => setMemoryDraft({ ...memoryDraft, title: e.target.value })} />
            <textarea className="textarea h-20 text-sm" placeholder="Describe the memory…"
              value={memoryDraft.content}
              onChange={(e) => setMemoryDraft({ ...memoryDraft, content: e.target.value })} />
            <button type="button" onClick={handleAddMemory}
              disabled={!memoryDraft.title.trim() || !memoryDraft.content.trim()}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40">
              <Plus size={14} /> Add Memory
            </button>
          </div>
        </div>

        {error && <p className="text-blush-500 text-sm text-center">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/')} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
