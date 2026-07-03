import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
})

// Injecte le token JWT depuis le localStorage
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('ds-platform-auth')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = 'Bearer ' + state.token
      }
    } catch (_) {}
  }
  return config
})

// Redirige vers /login si token expire (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('ds-platform-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
