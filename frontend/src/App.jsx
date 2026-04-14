import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout       from './components/Layout'
import Home         from './pages/Home'
import NewPersona   from './pages/NewPersona'
import EditPersona  from './pages/EditPersona'
import Chat         from './pages/Chat'
import Login        from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import { Loader } from 'lucide-react'

// Redirects unauthenticated users to /login; shows a spinner while the
// stored token is being verified on first load.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <Loader size={20} className="animate-spin text-warm-400" />
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"         element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes — wrapped in the shared Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/"                    element={<Home />} />
        <Route path="/personas/new"        element={<NewPersona />} />
        <Route path="/personas/:id/edit"   element={<EditPersona />} />
      </Route>

      {/* Chat has its own full-screen layout but is still protected */}
      <Route
        path="/personas/:id/chat"
        element={<ProtectedRoute><Chat /></ProtectedRoute>}
      />

      {/* Catch-all — redirect unknown paths home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
