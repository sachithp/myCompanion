import { Outlet, Link, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-warm-600 rounded-full flex items-center justify-center
                            group-hover:bg-warm-700 transition-colors">
              <Heart size={15} className="text-white fill-white" />
            </div>
            <span className="font-serif text-xl text-warm-800 font-semibold">myCompanion</span>
          </Link>

          {isHome && (
            <Link to="/personas/new" className="btn-primary text-sm">
              + Add a Loved One
            </Link>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-warm-400 text-xs mt-8">
        <p>Powered by AI · Conversations are stored locally on your device</p>
      </footer>
    </div>
  )
}
