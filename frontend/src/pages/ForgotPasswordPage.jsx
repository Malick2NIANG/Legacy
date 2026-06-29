import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT } from '../brand'
import AuthCarousel from '../components/auth/AuthCarousel'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
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

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ECFDF5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <CheckCircle size={28} color="#10B981" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>E-mail envoyé !</h2>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 16 }}>Pensez à vérifier vos spams.</p>
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#111827' }}>Mot de passe oublié ?</h2>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
                Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6, fontWeight: 600 }}>
                    Adresse e-mail
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} color="#9CA3AF" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="vous@example.com"
                      style={{
                        width: '100%', padding: '11px 14px 11px 38px', boxSizing: 'border-box',
                        borderRadius: 8, border: '1px solid #E5E7EB',
                        backgroundColor: '#F9FAFB', color: '#111827', fontSize: 14, outline: 'none',
                      }}
                    />
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
                  {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
                </button>
              </form>

              <p style={{ marginTop: 24, fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                Vous vous souvenez ?{' '}
                <Link to="/login" style={{ color: BRAND_GREEN, fontWeight: 600, textDecoration: 'none' }}>
                  Se connecter
                </Link>
              </p>
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
