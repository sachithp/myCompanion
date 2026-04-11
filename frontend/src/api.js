import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

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

// Conversations
export const getConversations = (personaId) => api.get(`/personas/${personaId}/conversations`)
export const createConversation = (personaId) => api.post(`/personas/${personaId}/conversations`)
export const getMessages = (conversationId) => api.get(`/conversations/${conversationId}/messages`)
export const deleteConversation = (id) => api.delete(`/conversations/${id}`)

// Photo upload
export const uploadPhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post('/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default api
