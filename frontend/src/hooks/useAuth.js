/**
 * Hook d'authentification.
 * Expose login/logout, l'état de connexion et le chargement initial.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import useAuthStore from '../store/authStore'

function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth, setLastLogin } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Au montage : si un token est présent, charger le profil utilisateur
  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        try {
          const me = await authService.getCurrentUser()
          setAuth(me, token)
        } catch {
          clearAuth()
        }
      }
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const { access_token } = await authService.login(email, password)
    // Forcer le token dans le localStorage avant d'appeler /me
    localStorage.setItem(
      'ds-platform-auth',
      JSON.stringify({ state: { token: access_token } })
    )
    const me = await authService.getCurrentUser()
    setAuth(me, access_token)
    setLastLogin(new Date().toISOString())
    // Redirection selon le rôle
    navigate(me.is_admin ? '/admin' : '/dashboard')
  }, [setAuth, navigate])

  const logout = useCallback(() => {
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])

  return { user, token, isAuthenticated, loading, login, logout }
}

export default useAuth
