/**
 * Instance Axios configurée avec l'URL de base de l'API.
 * Inclut les intercepteurs pour ajouter le token JWT et gérer les erreurs 401.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
})

// Intercepteur requête : injecte le token JWT depuis le localStorage
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ds-platform-auth')
  if (stored) {
    const { state } = JSON.parse(stored)
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`
    }
  }
  return config
})

// Intercepteur réponse : redirige vers /login si token expiré (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ds-platform-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
