import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { SidebarProvider } from './context/SidebarContext'
import { ToastProvider }   from './context/ToastContext'

import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import PrivacyPage        from './pages/PrivacyPage'
import TermsPage          from './pages/TermsPage'
import DashboardPage      from './pages/DashboardPage'
import DatasetsPage       from './pages/DatasetsPage'
import ModelsPage         from './pages/ModelsPage'
import ExperimentsPage    from './pages/ExperimentsPage'
import ResultsPage        from './pages/ResultsPage'
import AdminPage          from './pages/AdminPage'
import AuditPage          from './pages/AuditPage'
import AdminStatsPage     from './pages/AdminStatsPage'

function PrivateRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore()
  const storedRaw = localStorage.getItem('ds-platform-auth')
  const hasToken = isAuthenticated || token || (storedRaw && JSON.parse(storedRaw)?.state?.token)
  return hasToken ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuthenticated, token, user } = useAuthStore()

  let stored = null
  try {
    const raw = localStorage.getItem('ds-platform-auth')
    if (raw) stored = JSON.parse(raw)?.state
  } catch (_) {}

  const hasToken    = isAuthenticated || token || stored?.token
  const effectiveUser = user ?? stored?.user

  if (!hasToken) return <Navigate to="/login" replace />
  if (effectiveUser && !effectiveUser.is_admin) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <SidebarProvider>
      <Routes>
        <Route path="/"                element={<LandingPage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route path="/conditions"      element={<TermsPage />} />

        <Route path="/dashboard"             element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/datasets"              element={<PrivateRoute><DatasetsPage /></PrivateRoute>} />
        <Route path="/models"                element={<PrivateRoute><ModelsPage /></PrivateRoute>} />
        <Route path="/experiments"           element={<PrivateRoute><ExperimentsPage /></PrivateRoute>} />
        <Route path="/results"               element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
        <Route path="/results/:experimentId" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />

        <Route path="/admin"       element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
        <Route path="/admin/stats" element={<AdminRoute><AdminStatsPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </SidebarProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
