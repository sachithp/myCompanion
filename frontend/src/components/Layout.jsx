import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const firstName = user.name?.split(' ')[0] || 'You'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                   hover:bg-warm-100 transition-colors"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-warm-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-warm-600 flex items-center justify-center
                          text-white text-sm font-medium font-serif">
            {firstName[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm text-warm-700 font-medium hidden sm:block">{firstName}</span>
        <ChevronDown size={13} className={`text-warm-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl
                        border border-warm-200 shadow-lg py-1 z-50">
          {/* User info */}
          <div className="px-4 py-2.5 border-b border-warm-100">
            <p className="text-sm font-medium text-warm-800 truncate">{user.name}</p>
            <p className="text-xs text-warm-400 truncate">{user.email}</p>
          </div>
          {/* Sign out */}
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5
                       text-sm text-warm-600 hover:bg-warm-50 hover:text-blush-600
                       transition-colors text-left"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth()

  const isHome = location.pathname === '/'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-warm-600 rounded-full flex items-center justify-center
                            group-hover:bg-warm-700 transition-colors">
              <Heart size={15} className="text-white fill-white" />
            </div>
            <span className="font-serif text-xl text-warm-800 font-semibold">My Companion</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isHome && (
              <Link to="/personas/new" className="btn-primary text-sm">
                + Add a Loved One
              </Link>
            )}
            {user && <UserMenu user={user} onLogout={handleLogout} />}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-warm-400 text-xs mt-8">
        <p>Powered by Claude AI · Your companions are private to your account</p>
      </footer>
    </div>
  )
}
