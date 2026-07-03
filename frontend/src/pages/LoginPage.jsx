import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT, BRAND_GLOW } from '../brand'
import AuthCarousel from '../components/auth/AuthCarousel'
import authService from '../services/authService'
import useAuthStore from '../store/authStore'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

// Modal de changement de mot de passe (apparu si must_change_password)
function ForceChangeModal({ onDone }) {
  const [oldPwd,  setOldPwd]  = useState('')
  const [newPwd,  setNewPwd]  = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCfm, setShowCfm] = useState(false)

  const FIELD = {
    width: '100%', padding: '10px 40px 10px 14px', boxSizing: 'border-box',
    borderRadius: 8, border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', fontSize: 14, outline: 'none',
  }

  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle} tabIndex={-1}
      style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
        background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',
        display:'flex',alignItems:'center',padding:2}}>
      {show ? <EyeOff size={16}/> : <Eye size={16}/>}
    </button>
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPwd !== confirm) return setError('Les mots de passe ne correspondent pas.')
    if (newPwd.length < 8)  return setError('Minimum 8 caracteres.')
    setLoading(true)
    try {
      await api.post('/auth/change-password', { old_password: oldPwd, new_password: newPwd })
      setSuccess(true)
      setTimeout(onDone, 1800)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors du changement.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, Segoe UI, sans-serif',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 16, padding: '32px 28px',
        width: 'min(420px, 92vw)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', backgroundColor: '#ECFDF5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <CheckCircle size={28} color="#10B981" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Mot de passe mis a jour !
            </h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Redirection en cours...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, backgroundColor: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <KeyRound size={16} color="#F59E0B" />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
                Personnaliser mon mot de passe
              </h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
              Vous etes connecte avec un mot de passe temporaire. Choisissez un nouveau mot de passe personnel.
            </p>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px',
                color: '#DC2626', fontSize: 13, marginBottom: 14,
              }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Mot de passe temporaire', val: oldPwd, set: setOldPwd, show: showOld, toggle: ()=>setShowOld(v=>!v) },
                { label: 'Nouveau mot de passe',    val: newPwd, set: setNewPwd, show: showNew, toggle: ()=>setShowNew(v=>!v) },
                { label: 'Confirmer',               val: confirm, set: setConfirm, show: showCfm, toggle: ()=>setShowCfm(v=>!v) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={show ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)}
                      required style={FIELD} placeholder="••••••••" />
                    <EyeBtn show={show} toggle={toggle}/>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 11, borderRadius: 8, border: 'none', marginTop: 4,
                backgroundColor: loading ? '#9CA3AF' : BRAND_GREEN,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Enregistrement...' : 'Definir mon mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { setAuth, setLastLogin } = useAuthStore()
  const navigate = useNavigate()
  const toast    = useToast()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const [forceChange, setForceChange] = useState(false)
  const [loggedToken, setLoggedToken] = useState(null)
  const [loggedUser,  setLoggedUser]  = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await authService.login(email, password)
      // Stocker token pour que getCurrentUser fonctionne
      localStorage.setItem('ds-platform-auth', JSON.stringify({ state: { token: access_token } }))
      const me = await authService.getCurrentUser()
      setLoggedToken(access_token)
      setLoggedUser(me)
      setAuth(me, access_token)
      setLastLogin(new Date().toISOString())

      if (me.must_change_password) {
        setForceChange(true)
      } else {
        navigate(me.is_admin ? '/admin' : '/dashboard')
      }
    } catch {
      const msg = 'Identifiants incorrects. Verifiez votre email et mot de passe.'
      setError(msg)
      toast.error(msg)
    } finally { setLoading(false) }
  }

  const handlePasswordChanged = async () => {
    // Rafraichir le profil (must_change_password est maintenant false)
    try {
      const me = await authService.getCurrentUser()
      setAuth(me, loggedToken)
    } catch {}
    setForceChange(false)
    navigate(loggedUser?.is_admin ? '/admin' : '/dashboard')
  }

  const INPUT = {
    width: '100%', padding: '9px 42px 9px 36px', boxSizing: 'border-box',
    borderRadius: 8, border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', color: '#111827',
    fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, Segoe UI, sans-serif', overflow: 'hidden' }}>

      {forceChange && <ForceChangeModal onDone={handlePasswordChanged} />}

      {/* ── Gauche : formulaire ── */}
      <div className="auth-form-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        backgroundColor: '#ffffff', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px clamp(16px,4vw,40px) 0', flexShrink: 0 }}>
          <Link to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = BRAND_GREEN}
            onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
          >
            <ArrowLeft size={14} /> Retour a l'accueil
          </Link>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 clamp(20px, 6vw, 56px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <img src="/Logo.png" alt="LEGACY" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 8 }} />
            <span style={{ fontFamily: BRAND_FONT, fontSize: 18, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '4px', textShadow: BRAND_GLOW }}>
              {BRAND_NAME}
            </span>
          </div>

          <h2 style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 700, color: '#111827' }}>Connexion</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: BRAND_GREEN, fontWeight: 600, textDecoration: 'none' }}>Creer un compte</Link>
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 600 }}>Adresse e-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@example.com" style={INPUT} />
              </div>
            </div>

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

            <div style={{ textAlign: 'right', marginBottom: 18 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: BRAND_GREEN, textDecoration: 'none', fontWeight: 500 }}>
                Mot de passe oublie ?
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
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              backgroundColor: loading ? '#6B7280' : BRAND_GREEN,
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Droite : carousel ── */}
      <div className="auth-carousel" style={{ flex: 1, display: 'flex' }}>
        <AuthCarousel />
      </div>
    </div>
  )
}
