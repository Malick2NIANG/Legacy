import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT } from '../brand'
import AuthCarousel from '../components/auth/AuthCarousel'
import api from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token          = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.')
    if (password.length < 8)  return setError('Le mot de passe doit comporter au moins 8 caractères.')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Lien invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  const INPUT = {
    width: '100%', padding: '11px 14px 11px 38px', boxSizing: 'border-box',
    borderRadius: 8, border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', color: '#111827', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, Segoe UI, sans-serif', overflow: 'hidden' }}>

      {/* ── Gauche : formulaire ── */}
      <div className="auth-form-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        backgroundColor: '#ffffff', boxSizing: 'border-box',
        position: 'relative', overflowY: 'auto',
      }}>
        {/* Bouton retour ancré en haut */}
        <div style={{ padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0' }}>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#6B7280', fontSize: 13, textDecoration: 'none',
          }}>
            <ArrowLeft size={14} /> Retour à la connexion
          </Link>
        </div>

        {/* Contenu centré */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(24px, 6vw, 32px) clamp(20px, 6vw, 56px) 48px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
            <img src="/Logo.png" alt="LEGACY" style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 10 }} />
            <span style={{ fontFamily: BRAND_FONT, fontSize: 22, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '4px' }}>
              {BRAND_NAME}
            </span>
          </div>

          {!token ? (
            <div style={{ textAlign: 'center' }}>
              <AlertCircle size={40} color="#DC2626" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Lien invalide</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
                Ce lien de réinitialisation est invalide ou expiré.
              </p>
              <Link to="/forgot-password" style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 8,
                backgroundColor: BRAND_GREEN, color: '#fff', fontWeight: 600,
                fontSize: 14, textDecoration: 'none',
              }}>
                Nouvelle demande
              </Link>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ECFDF5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <CheckCircle size={28} color="#10B981" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
                Mot de passe mis à jour !
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Redirection vers la connexion dans 3 secondes…
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#111827' }}>Nouveau mot de passe</h2>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6B7280' }}>
                Choisissez un mot de passe fort d'au moins 8 caractères.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6, fontWeight: 600 }}>
                    Nouveau mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="#9CA3AF" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={INPUT} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6, fontWeight: 600 }}>
                    Confirmer le mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="#9CA3AF" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" style={INPUT} />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 8, padding: '10px 14px', color: '#DC2626',
                    fontSize: 13, marginBottom: 16,
                  }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                  backgroundColor: loading ? '#9CA3AF' : BRAND_GREEN,
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
                }}>
                  {loading ? 'Mise à jour…' : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── Droite : carousel ── */}
      <div className="auth-carousel" style={{ flex: 1, display: 'flex' }}>
        <AuthCarousel />
      </div>
    </div>
  )
}
