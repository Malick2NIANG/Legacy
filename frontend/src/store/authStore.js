/**
 * Store d'authentification avec Zustand.
 * Persiste le token JWT en localStorage et expose les actions auth.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastLoginAt: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setLastLogin: (ts) => set({ lastLoginAt: ts }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'ds-platform-auth',
      partialize: (state) => ({ token: state.token, lastLoginAt: state.lastLoginAt }),
    }
  )
)

export default useAuthStore
