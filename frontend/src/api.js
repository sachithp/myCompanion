import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach the JWT on every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Personas
export const getPersonas = () => api.get('/personas')
export const getPersona = (id) => api.get(`/personas/${id}`)
export const createPersona = (data) => api.post('/personas', data)
export const updatePersona = (id, data) => api.put(`/personas/${id}`, data)
export const deletePersona = (id) => api.delete(`/personas/${id}`)

// Memories
export const addMemory = (personaId, data) => api.post(`/personas/${personaId}/memories`, data)
export const deleteMemory = (personaId, memoryId) =>
  api.delete(`/personas/${personaId}/memories/${memoryId}`)

// Relations
export const addRelation = (personaId, data) => api.post(`/personas/${personaId}/relations`, data)
export const deleteRelation = (personaId, relationId) =>
  api.delete(`/personas/${personaId}/relations/${relationId}`)

// Mode behaviors
export const saveModeBehavior = (personaId, mode, behavior) =>
  api.put(`/personas/${personaId}/mode-behaviors/${mode}`, { behavior })

// Knowledge sources
export const getKnowledge = (personaId) => api.get(`/personas/${personaId}/knowledge`)
export const addKnowledge = (personaId, data) => api.post(`/personas/${personaId}/knowledge`, data)
export const deleteKnowledge = (personaId, kId) =>
  api.delete(`/personas/${personaId}/knowledge/${kId}`)

// Conversations
export const getConversations = (personaId) => api.get(`/personas/${personaId}/conversations`)
export const createConversation = (personaId) => api.post(`/personas/${personaId}/conversations`)
export const getMessages = (conversationId) => api.get(`/conversations/${conversationId}/messages`)
export const deleteConversation = (id) => api.delete(`/conversations/${id}`)
export const setMode = (conversationId, mode) => api.patch(`/conversations/${conversationId}/mode`, { mode })

// Import / Export
export const importPersona = (data) => api.post('/personas/import', data)
export const exportPersona = (id, name) => {
  const a = document.createElement('a')
  a.href = `/api/personas/${id}/export`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Photo upload
export const uploadPhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post('/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default api
