import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Key, Save, Trash2, CheckCircle, AlertCircle, Loader, Cpu } from 'lucide-react'
import { getSettings, saveApiKey, removeApiKey, saveModel } from '../api'

const MODELS = [
  {
    id:    'claude-opus-4-6',
    name:  'Claude Opus',
    badge: 'Most expressive',
    desc:  'Highest quality, most nuanced responses. Best for emotionally rich conversation.',
  },
  {
    id:    'claude-sonnet-4-5',
    name:  'Claude Sonnet',
    badge: 'Balanced',
    desc:  'Strong quality at a lower cost. A great everyday choice.',
  },
  {
    id:    'claude-haiku-4-5-20251001',
    name:  'Claude Haiku',
    badge: 'Fastest',
    desc:  'Quickest responses, most economical. Good for frequent short chats.',
  },
]

export default function Settings() {
  const [maskedKey,      setMaskedKey]      = useState(null)
  const [hasApiKey,      setHasApiKey]      = useState(false)
  const [inputKey,       setInputKey]       = useState('')
  const [preferredModel, setPreferredModel] = useState('claude-opus-4-6')
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [removing,       setRemoving]       = useState(false)
  const [savingModel,    setSavingModel]    = useState(false)
  const [toast,          setToast]          = useState(null) // { type: 'success'|'error', msg }

  useEffect(() => {
    getSettings()
      .then(res => {
        setHasApiKey(res.data.hasApiKey)
        setMaskedKey(res.data.maskedKey)
        setPreferredModel(res.data.preferredModel || 'claude-opus-4-6')
      })
      .catch(() => showToast('error', 'Could not load settings'))
      .finally(() => setLoading(false))
  }, [])

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSaveKey(e) {
    e.preventDefault()
    const key = inputKey.trim()
    if (!key) return
    setSaving(true)
    try {
      const res = await saveApiKey(key)
      setMaskedKey(res.data.maskedKey)
      setHasApiKey(true)
      setInputKey('')
      showToast('success', 'API key saved — your conversations will now use your key')
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm('Remove your API key? The app will fall back to the shared server key.')) return
    setRemoving(true)
    try {
      await removeApiKey()
      setMaskedKey(null)
      setHasApiKey(false)
      showToast('success', 'API key removed')
    } catch {
      showToast('error', 'Failed to remove key')
    } finally {
      setRemoving(false)
    }
  }

  async function handleModelChange(modelId) {
    if (modelId === preferredModel) return
    setPreferredModel(modelId)
    setSavingModel(true)
    try {
      await saveModel(modelId)
      showToast('success', `Model updated to ${MODELS.find(m => m.id === modelId)?.name}`)
    } catch {
      showToast('error', 'Failed to save model preference')
    } finally {
      setSavingModel(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-warm-500
                               hover:text-warm-700 mb-6 transition-colors">
        <ArrowLeft size={15} />
        Back to companions
      </Link>

      <h1 className="font-serif text-2xl text-warm-800 font-semibold mb-1">Settings</h1>
      <p className="text-sm text-warm-500 mb-8">Manage your account preferences</p>

      {loading ? (
        <div className="flex items-center gap-2 text-warm-400 text-sm py-4">
          <Loader size={15} className="animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* ── Model picker ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <Cpu size={17} className="text-warm-500" />
              <h2 className="font-serif text-lg text-warm-800 font-semibold">AI Model</h2>
              {savingModel && <Loader size={13} className="animate-spin text-warm-400 ml-auto" />}
            </div>
            <p className="text-sm text-warm-500 mb-5 leading-relaxed">
              Choose which Claude model powers your conversations. Takes effect on the next message.
            </p>

            <div className="flex flex-col gap-2.5">
              {MODELS.map(m => {
                const active = preferredModel === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModelChange(m.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all
                                ${active
                                  ? 'border-warm-600 bg-warm-50 ring-1 ring-warm-600'
                                  : 'border-warm-200 hover:border-warm-400 hover:bg-warm-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-semibold ${active ? 'text-warm-800' : 'text-warm-700'}`}>
                        {m.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                        ${active
                                          ? 'bg-warm-600 text-white'
                                          : 'bg-warm-100 text-warm-500'}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 leading-relaxed">{m.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── API Key ───────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <Key size={17} className="text-warm-500" />
              <h2 className="font-serif text-lg text-warm-800 font-semibold">Anthropic API Key</h2>
            </div>
            <p className="text-sm text-warm-500 mb-5 leading-relaxed">
              By default the app uses the server's shared key. Enter your own key to use your
              personal Anthropic quota — useful if you chat frequently.{' '}
              <a
                href="https://console.anthropic.com/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warm-600 underline hover:text-warm-800"
              >
                Get an API key ↗
              </a>
            </p>

            {/* Current key status */}
            {hasApiKey && maskedKey && (
              <div className="flex items-center justify-between bg-warm-50 rounded-xl
                              border border-warm-200 px-4 py-3 mb-4">
                <div>
                  <p className="text-xs text-warm-500 mb-0.5">Current key</p>
                  <p className="text-sm font-mono text-warm-700">{maskedKey}</p>
                </div>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex items-center gap-1.5 text-xs text-blush-500 hover:text-blush-700
                             transition-colors disabled:opacity-50"
                >
                  {removing ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Remove
                </button>
              </div>
            )}

            {/* Add / replace key */}
            <form onSubmit={handleSaveKey} className="flex gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder={hasApiKey ? 'Enter new key to replace…' : 'sk-ant-…'}
                className="input flex-1 font-mono text-sm"
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={saving || !inputKey.trim()}
                className="btn-primary flex items-center gap-1.5 text-sm px-4 disabled:opacity-50"
              >
                {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                {hasApiKey ? 'Update' : 'Save'}
              </button>
            </form>

            <p className="text-xs text-warm-400 mt-2">
              Your key is stored on the server and never returned in full.
              It is only used to send your messages to Anthropic.
            </p>
          </div>

        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl
                         shadow-lg text-sm font-medium z-50
                         ${toast.type === 'success'
                           ? 'bg-green-50 border border-green-200 text-green-800'
                           : 'bg-red-50 border border-red-200 text-red-800'}`}
        >
          {toast.type === 'success'
            ? <CheckCircle size={15} />
            : <AlertCircle size={15} />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
