import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT } from '../brand'
import AuthCarousel from '../components/auth/AuthCarousel'
import useAuth from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try { await login(email, password) }
    catch (err) {
      const msg = 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
      setError(msg)
      toast.error(msg)
    }
    finally { setLoading(false) }
  }

  const INPUT = {
    width: '100%', padding: '9px 42px 9px 36px', boxSizing: 'border-box',
    borderRadius: 8, border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', color: '#111827',
    fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, Segoe UI, sans-serif', overflow: 'hidden' }}>

      {/* ── Gauche : formulaire ── */}
      <div className="auth-form-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        backgroundColor: '#ffffff', overflow: 'hidden',
      }}>
        {/* Retour */}
        <div style={{ padding: '14px clamp(16px,4vw,40px) 0', flexShrink: 0 }}>
          <Link to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = BRAND_GREEN}
            onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
          >
            <ArrowLeft size={14} /> Retour à l'accueil
          </Link>
        </div>

        {/* Contenu centré — pas de scroll */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 clamp(20px, 6vw, 56px)',
        }}>
          {/* Logo + nom */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <img src="/Logo.png" alt="LEGACY" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 8 }} />
            <span style={{ fontFamily: BRAND_FONT, fontSize: 18, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '4px' }}>
              {BRAND_NAME}
            </span>
          </div>

          {/* Titre */}
          <h2 style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Connexion</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: BRAND_GREEN, fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 600 }}>Adresse e-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@example.com" style={INPUT} />
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 600 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={INPUT} />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
                  padding: 2, display: 'flex', alignItems: 'center',
                }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Mot de passe oublié */}
            <div style={{ textAlign: 'right', marginBottom: 18 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: BRAND_GREEN, textDecoration: 'none', fontWeight: 500 }}>
                Mot de passe oublié ?
              </Link>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '8px 12px',
                color: '#DC2626', fontSize: 13, marginBottom: 12,
              }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: 8, border: 'none',
              backgroundColor: loading ? '#9CA3AF' : BRAND_GREEN,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Droite : carrousel ── */}
      <div className="auth-carousel" style={{ flex: 1, display: 'flex' }}>
        <AuthCarousel />
      </div>
    </div>
  )
}
