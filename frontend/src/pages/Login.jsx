import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Google's official "Sign in with Google" button SVG mark
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function Login() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  // Already signed in — go straight to the app
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user])

  // Check for error param passed back from failed OAuth
  const error = new URLSearchParams(window.location.search).get('error')

  function handleGoogleSignIn() {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4">

      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-14 h-14 bg-warm-600 rounded-full flex items-center justify-center shadow-md">
          <Heart size={24} className="text-white fill-white" />
        </div>
        <h1 className="font-serif text-3xl text-warm-900 font-semibold tracking-tight">
          My Companion
        </h1>
        <p className="text-warm-500 text-sm text-center max-w-xs leading-relaxed">
          Keep the voices of the people you love close — always.
        </p>
      </div>

      {/* Sign-in card */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-sm px-8 py-8 w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <h2 className="font-serif text-lg text-warm-800 font-medium mb-1">Welcome</h2>
          <p className="text-warm-400 text-sm">Sign in to access your companions</p>
        </div>

        {error && (
          <div className="bg-blush-50 border border-blush-200 rounded-xl px-4 py-2.5 text-blush-600 text-xs text-center">
            Sign-in failed. Please try again.
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3
                     bg-white border border-warm-300 rounded-xl shadow-sm
                     text-warm-800 text-sm font-medium
                     hover:bg-warm-50 hover:border-warm-400 hover:shadow
                     active:bg-warm-100
                     transition-all"
        >
          <GoogleMark />
          Continue with Google
        </button>

        <p className="text-center text-warm-300 text-xs leading-relaxed">
          Your companions and conversations are private to your account.
        </p>
      </div>

      <p className="text-warm-300 text-xs mt-8">
        Powered by Claude · Conversations stored securely
      </p>
    </div>
  )
}
