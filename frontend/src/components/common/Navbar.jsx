import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, KeyRound, ChevronDown, Menu, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, Clock } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT } from '../../brand'
import { useSidebar } from '../../context/SidebarContext'
import useResponsive from '../../hooks/useResponsive'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(user) {
  if (!user) return '?'
  const name = user.full_name || user.email || ''
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
function getRole(user) {
  if (!user) return ''
  return user.is_admin ? 'Administrateur' : 'Utilisateur'
}

const DAY_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const MONTH_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function formatDateFr(date) {
  return `${DAY_FR[date.getDay()]} ${date.getDate()} ${MONTH_FR[date.getMonth()]} ${date.getFullYear()}`
}
function formatTimeFr(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function formatLastLogin(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]} ${d.getFullYear()} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

// ── Horloge live ─────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', letterSpacing: '0.2px' }}>
        {formatDateFr(now)}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#1B4D2E', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.5px' }}>
        {formatTimeFr(now)}
      </span>
    </div>
  )
}

// ── Modal changement de mot de passe ─────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const toast = useToast()
  const [form, setForm]     = useState({ old: '', new: '', confirm: '' })
  const [show, setShow]     = useState({ old: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const tog = k => () => setShow(s => ({ ...s, [k]: !s[k] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new !== form.confirm) return setError('Les deux nouveaux mots de passe ne sont pas identiques.')
    if (form.new.length < 8) return setError('Le nouveau mot de passe doit faire au moins 8 caractères.')
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        old_password: form.old,
        new_password: form.new,
      })
      setSuccess(true)
      toast.success('Votre mot de passe a bien été mis à jour.')
      setTimeout(onClose, 1600)
    } catch (err) {
      const msg = err?.response?.data?.detail === 'Mot de passe actuel incorrect.'
        ? "L'ancien mot de passe saisi est incorrect."
        : "Une erreur est survenue, veuillez réessayer."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const INPUT = {
    width: '100%', padding: '10px 36px 10px 12px', boxSizing: 'border-box',
    borderRadius: 8, border: '1px solid #D6E8DC',
    backgroundColor: '#F9FBFA', color: '#111827', fontSize: 14, outline: 'none',
  }

  const fields = [
    { key: 'old',     label: 'Mot de passe actuel'     },
    { key: 'new',     label: 'Nouveau mot de passe'     },
    { key: 'confirm', label: 'Confirmer le nouveau'     },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 14,
        padding: '28px 28px 24px',
        width: 'min(420px, 100%)',
        boxShadow: '0 16px 48px rgba(27,77,46,0.18)',
        border: '1px solid #D6E8DC',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              backgroundColor: '#E6F4ED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={17} color="#00853F" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Changer le mot de passe</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Renseignez votre ancien et nouveau mot de passe</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={40} color="#00853F" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Mot de passe mis à jour !</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={show[key] ? 'text' : 'password'}
                    value={form[key]}
                    onChange={set(key)}
                    required
                    placeholder="••••••••"
                    style={{ ...INPUT, paddingLeft: 36 }}
                  />
                  <button type="button" onClick={tog(key)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2,
                  }}>
                    {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '9px 12px',
                color: '#DC2626', fontSize: 13, marginBottom: 14,
              }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '10px', borderRadius: 8,
                border: '1px solid #D6E8DC', backgroundColor: 'transparent',
                color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                Annuler
              </button>
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                backgroundColor: loading ? '#9CA3AF' : '#00853F',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Mise à jour…' : 'Confirmer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, clearAuth, lastLoginAt } = useAuthStore()
  const navigate                         = useNavigate()
  const { isOpen, toggle }     = useSidebar()
  const { isMobile, isTablet } = useResponsive()
  const [dropdownOpen, setDropdownOpen]       = useState(false)
  const [changePassOpen, setChangePassOpen]   = useState(false)
  const dropdownRef = useRef(null)

  const isDesktop    = !isMobile && !isTablet
  const sidebarWidth = isDesktop ? (isOpen ? 220 : 60) : 0

  const handleLogout = () => { setDropdownOpen(false); clearAuth(); navigate('/login') }

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = getInitials(user)
  const role     = getRole(user)

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: sidebarWidth, right: 0, height: 64,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #D6E8DC',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 100,
        fontFamily: 'Inter, Segoe UI, sans-serif',
        transition: 'left 0.25s ease',
      }}>

        {/* Gauche : burger mobile + horloge desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isDesktop && (
            <button onClick={toggle} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              border: '1px solid #D6E8DC', backgroundColor: 'transparent',
              cursor: 'pointer', color: '#1B4D2E',
            }}>
              <Menu size={18} />
            </button>
          )}
          {!isDesktop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/Logo.png" alt="LEGACY" style={{ width: 26, height: 26, objectFit: 'contain' }} />
              <span style={{ fontFamily: BRAND_FONT, fontSize: 14, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '2px' }}>
                {BRAND_NAME}
              </span>
            </div>
          )}
          {isDesktop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, backgroundColor: '#E6F4ED',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Clock size={14} color="#00853F" />
              </div>
              <LiveClock />
            </div>
          )}
        </div>

        {/* Droite : user dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px 6px 6px', borderRadius: 10,
              border: '1px solid #D6E8DC', backgroundColor: 'transparent',
              cursor: 'pointer', transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4F7F5'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1B4D2E, #00853F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>{initials}</span>
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                  {user?.full_name || user?.email || 'Utilisateur'}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{role}</div>
              </div>
            )}
            <ChevronDown size={14} color="#6B7280"
              style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              backgroundColor: '#fff', border: '1px solid #D6E8DC',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(27,77,46,0.12)',
              minWidth: 210, zIndex: 200,
            }}>
              {/* Info */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F7F3', backgroundColor: '#F9FBFA' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1B4D2E' }}>{user?.full_name || user?.email}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{role}</div>
                {lastLoginAt && (
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    Connexion : {formatLastLogin(lastLoginAt)}
                  </div>
                )}
              </div>

              {/* Changer mot de passe */}
              <button
                onClick={() => { setDropdownOpen(false); setChangePassOpen(true) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  fontSize: 13, color: '#374151',
                  backgroundColor: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4F7F5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <KeyRound size={15} color="#6B7280" />
                Changer le mot de passe
              </button>

              {/* Déconnexion */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  fontSize: 13, color: '#DC2626',
                  backgroundColor: 'transparent', border: 'none',
                  borderTop: '1px solid #F0F7F3',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={15} color="#DC2626" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Modal changement mot de passe */}
      {changePassOpen && <ChangePasswordModal onClose={() => setChangePassOpen(false)} />}
    </>
  )
}
