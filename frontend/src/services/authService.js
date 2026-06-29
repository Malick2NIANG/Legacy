/**
 * Service d'authentification.
 * Encapsule les appels API pour login, register et profil.
 */
import api from './api'

const authService = {
  /** Authentifie l'utilisateur via OAuth2PasswordRequestForm et retourne le token JWT */
  login: async (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data  // { access_token, token_type }
  },

  /** Inscrit un nouvel utilisateur */
  register: async (email, password, fullName) => {
    const { data } = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    return data  // UserRead
  },

  /** Récupère le profil de l'utilisateur connecté */
  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me')
    return data  // UserRead
  },
}

export default authService
