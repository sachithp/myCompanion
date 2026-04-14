import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader } from 'lucide-react'
import axios from 'axios'
import { useAuth, TOKEN_KEY } from '../context/AuthContext'

/**
 * Landing page for the Google OAuth redirect.
 * The backend redirects here as: /auth/callback?token=<jwt>
 *
 * Steps:
 *  1. Read token from URL search params
 *  2. Persist token in localStorage
 *  3. Verify token + fetch user profile from /api/auth/me
 *  4. Set user in AuthContext and navigate home
 */
export default function AuthCallback() {
  const { setUser } = useAuth()
  const navigate    = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')

    if (!token) {
      navigate('/login?error=no_token', { replace: true })
      return
    }

    localStorage.setItem(TOKEN_KEY, token)

    axios
      .get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data)
        navigate('/', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        navigate('/login?error=auth_failed', { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-warm-400">
        <Loader size={18} className="animate-spin" />
        <span className="text-sm">Signing you in…</span>
      </div>
    </div>
  )
}
