import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { SidebarProvider } from './context/SidebarContext'
import { ToastProvider }   from './context/ToastContext'

// ── Couche 1 : publique ──────────────────────────────────────────────────────
import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import PrivacyPage        from './pages/PrivacyPage'
import TermsPage          from './pages/TermsPage'

// ── Couche 2 : utilisateur authentifié ───────────────────────────────────────
import DashboardPage   from './pages/DashboardPage'
import DatasetsPage    from './pages/DatasetsPage'
import ModelsPage      from './pages/ModelsPage'
import ExperimentsPage from './pages/ExperimentsPage'
import ResultsPage     from './pages/ResultsPage'

// ── Couche 3 : admin uniquement ───────────────────────────────────────────────
import AdminPage from './pages/AdminPage'

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route protégée — redirige vers /login si non connecté.
 */
function PrivateRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore()
  const storedRaw = localStorage.getItem('ds-platform-auth')
  const hasToken = isAuthenticated || token || (storedRaw && JSON.parse(storedRaw)?.state?.token)
  return hasToken ? children : <Navigate to="/login" replace />
}

/**
 * Route admin — redirige vers /dashboard si connecté mais pas admin.
 * Redirige vers /login si non connecté du tout.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, token, user } = useAuthStore()
  const storedRaw = localStorage.getItem('ds-platform-auth')
  const hasToken = isAuthenticated || token || (storedRaw && JSON.parse(storedRaw)?.state?.token)

  if (!hasToken) return <Navigate to="/login" replace />
  if (user && !user.is_admin) return <Navigate to="/dashboard" replace />
  return children
}

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <SidebarProvider>
      <Routes>

        {/* ── Couche 1 : publique ── */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/register"         element={<RegisterPage />} />
        <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
        <Route path="/reset-password"   element={<ResetPasswordPage />} />
        <Route path="/confidentialite"  element={<PrivacyPage />} />
        <Route path="/conditions"       element={<TermsPage />} />

        {/* ── Couche 2 : utilisateur connecté ── */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/datasets" element={
          <PrivateRoute><DatasetsPage /></PrivateRoute>
        } />
        <Route path="/models" element={
          <PrivateRoute><ModelsPage /></PrivateRoute>
        } />
        <Route path="/experiments" element={
          <PrivateRoute><ExperimentsPage /></PrivateRoute>
        } />
        <Route path="/results/:experimentId?" element={
          <PrivateRoute><ResultsPage /></PrivateRoute>
        } />

        {/* ── Couche 3 : admin uniquement ── */}
        <Route path="/admin" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />
        <Route path="/admin/*" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </SidebarProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
