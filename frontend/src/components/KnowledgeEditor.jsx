import { useState, useRef } from 'react'
import { FileText, Link, Plus, X, Loader, ExternalLink, BookOpen } from 'lucide-react'

export default function KnowledgeEditor({ sources = [], onAdd, onDelete }) {
  const [tab, setTab] = useState('file')     // 'file' | 'link'
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  // ── File upload ────────────────────────────────────────────────────────────
  async function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    const isValid = file.name.endsWith('.md') || file.name.endsWith('.txt')
    if (!isValid) {
      setError('Only .md and .txt files are supported.')
      e.target.value = ''
      return
    }

    setError('')
    setAdding(true)
    try {
      const content = await file.text()
      const title = file.name.replace(/\.(md|txt)$/i, '')
      await onAdd({ type: 'file', title, content })
    } catch {
      setError('Could not read the file. Please try again.')
    } finally {
      setAdding(false)
      e.target.value = ''
    }
  }

  // ── Link fetch ─────────────────────────────────────────────────────────────
  async function handleAddLink() {
    const url = linkUrl.trim()
    if (!url) return

    setAdding(true)
    setError('')
    try {
      let title = linkTitle.trim()
      if (!title) {
        try { title = new URL(url).hostname } catch { title = url }
      }
      await onAdd({ type: 'link', title, url })
      setLinkUrl('')
      setLinkTitle('')
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not fetch the link. Check the URL and try again.')
    } finally {
      setAdding(false)
    }
  }

  function handleLinkKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAddLink() }
  }

  return (
    <div className="space-y-5">

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setTab('file'); setError('') }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${tab === 'file' ? 'bg-warm-800 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}
        >
          <FileText size={13} /> Upload .md / .txt
        </button>
        <button
          type="button"
          onClick={() => { setTab('link'); setError('') }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${tab === 'link' ? 'bg-warm-800 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'}`}
        >
          <Link size={13} /> Web link
        </button>
      </div>

      {/* ── File upload panel ───────────────────────────────────────────────── */}
      {tab === 'file' && (
        <div>
          <input
            type="file"
            accept=".md,.txt"
            ref={fileRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            disabled={adding}
            className="w-full border-2 border-dashed border-warm-300 hover:border-warm-500
                       rounded-xl py-8 flex flex-col items-center gap-2
                       text-warm-400 hover:text-warm-600 transition-colors disabled:opacity-50"
          >
            {adding
              ? <Loader size={22} className="animate-spin" />
              : <FileText size={22} />
            }
            <span className="text-sm font-medium">
              {adding ? 'Reading file…' : 'Click to select a .md or .txt file'}
            </span>
            <span className="text-xs text-warm-300">
              Wikipedia exports, blog posts, bios, interview transcripts — anything in plain text
            </span>
          </button>
        </div>
      )}

      {/* ── Link panel ──────────────────────────────────────────────────────── */}
      {tab === 'link' && (
        <div className="space-y-2">
          <input
            className="input"
            placeholder="https://their-blog.com/article…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
          />
          <input
            className="input text-sm"
            placeholder="Title (optional — defaults to domain name)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            onKeyDown={handleLinkKeyDown}
          />
          <p className="text-warm-400 text-xs">
            The server will fetch the page text and store it. Works best with blogs, writeups, and articles.
          </p>
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!linkUrl.trim() || adding}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
          >
            {adding
              ? <><Loader size={13} className="animate-spin" /> Fetching…</>
              : <><Plus size={13} /> Fetch &amp; Add</>
            }
          </button>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && <p className="text-blush-500 text-xs">{error}</p>}

      {/* ── Source list ─────────────────────────────────────────────────────── */}
      {sources.length > 0 && (
        <div className="space-y-2 pt-1">
          {sources.map((s) => (
            <div
              key={s.id ?? s._draftId}
              className="flex items-start gap-3 bg-warm-50 rounded-xl px-4 py-3"
            >
              {/* Type badge */}
              <span className={`mt-0.5 flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold
                ${s.type === 'link'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-teal-100 text-teal-700'}`}>
                {s.type === 'link' ? 'link' : 'file'}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-warm-800 truncate">{s.title}</p>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-500 hover:underline flex items-center gap-0.5 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={10} className="flex-shrink-0" />
                    {s.url}
                  </a>
                )}
                {s.content && (
                  <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">
                    {s.content.slice(0, 160)}{s.content.length > 160 ? '…' : ''}
                  </p>
                )}
                {!s.content && !s.url && (
                  <p className="text-xs text-warm-300 mt-0.5 italic">No content yet</p>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete(s.id ?? s._draftId)}
                className="text-warm-400 hover:text-blush-500 flex-shrink-0 mt-0.5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {sources.length === 0 && (
        <div className="flex items-center gap-2 text-warm-300 text-xs py-1">
          <BookOpen size={13} />
          No references added yet — the AI will work from the fields above only.
        </div>
      )}
    </div>
  )
}
