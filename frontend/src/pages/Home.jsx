import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, UserPlus } from 'lucide-react'
import PersonaCard from '../components/PersonaCard'
import { getPersonas } from '../api'

export default function Home() {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getPersonas()
      .then((res) => setPersonas(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleDeleted(id) {
    setPersonas((prev) => prev.filter((p) => p.id !== id))
  }

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
          <button
            onClick={() => navigate('/personas/new')}
            className="btn-primary mx-auto"
          >
            + Add a Loved One
          </button>
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
    </div>
  )
}
