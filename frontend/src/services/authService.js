/**
 * Service d authentification et profil.
 */
import api from './api'

const authService = {
  login: async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data  // { access_token, token_type }
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  updateProfile: async (payload) => {
    const { data } = await api.patch('/auth/me', payload)
    return data
  },

  changePassword: async (current_password, new_password) => {
    const { data } = await api.post('/auth/change-password', { current_password, new_password })
    return data
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (token, new_password) => {
    const { data } = await api.post('/auth/reset-password', { token, new_password })
    return data
  },
}

export default authService
