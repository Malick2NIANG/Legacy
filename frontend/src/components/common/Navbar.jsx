import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, KeyRound, ChevronDown, Menu, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, Clock, UserCircle2 } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT, BRAND_GLOW } from '../../brand'
import { useSidebar } from '../../context/SidebarContext'
import useResponsive from '../../hooks/useResponsive'
import api from '../../services/api'
import authService from '../../services/authService'
import { useToast } from '../../context/ToastContext'

// -- Helpers ------------------------------------------------------------------
function getInitials(user) {
  if (!user) return null
  // Priorité : first_name + last_name (champs individuels fiables)
  const f = (user.first_name || '').trim()
  const l = (user.last_name  || '').trim()
  if (f && l) return (f[0] + l[0]).toUpperCase()
  if (f)      return f.slice(0, 2).toUpperCase()
  if (l)      return l.slice(0, 2).toUpperCase()
  // Fallback : full_name
  const full = (user.full_name || '').trim()
  if (full) {
    const parts = full.split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : full.slice(0, 2).toUpperCase()
  }
  // Dernier recours : email
  return (user.email || '').slice(0, 2).toUpperCase() || null
}
function getRole(user) {
  if (!user) return ''
  return user.is_admin ? 'Administrateur' : 'Utilisateur'
}

const DAY_FR   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const MONTH_FR = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']

function formatDateFr(date) {
  return `${DAY_FR[date.getDay()]} ${date.getDate()} ${MONTH_FR[date.getMonth()]} ${date.getFullYear()}`
}
function formatTimeFr(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function formatLastLogin(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]} ${d.getFullYear()} a ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

// -- LiveClock ----------------------------------------------------------------
function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{formatTimeFr(now)}</span>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{formatDateFr(now)}</span>
    </div>
  )
}

// -- ChangePasswordModal ------------------------------------------------------
function ChangePasswordModal({ onClose }) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next,    setNext]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [showC,   setShowC]   = useState(false)
  const [showN,   setShowN]   = useState(false)
  const [showCf,  setShowCf]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (next.length < 8)  { setError('Le mot de passe doit faire au moins 8 caracteres.'); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password', { current_password: current, new_password: next })
      setSuccess(true)
      toast.success('Mot de passe modifie avec succes.')
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du changement.')
    } finally { setLoading(false) }
  }

  const INPUT_STYLE = {
    width: '100%', padding: '9px 42px 9px 14px', boxSizing: 'border-box',
    border: '1px solid #E5E7EB', borderRadius: 8,
    fontSize: 14, backgroundColor: '#F9FAFB', outline: 'none',
  }
  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle} style={{
      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2,
    }}>
      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
    </button>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
            <Lock size={16} style={{ marginRight: 8, verticalAlign: 'middle' }}/>
            Changer le mot de passe
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
            <X size={18}/>
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: BRAND_GREEN }}>
            <CheckCircle size={32} style={{ marginBottom: 8 }}/>
            <p style={{ margin: 0, fontWeight: 600 }}>Mot de passe modifie !</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px',
                color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
                <AlertCircle size={14}/> {error}
              </div>
            )}
            {[
              { label: 'Mot de passe actuel',    val: current, set: setCurrent, show: showC,  toggle: () => setShowC(v=>!v)  },
              { label: 'Nouveau mot de passe',   val: next,    set: setNext,    show: showN,  toggle: () => setShowN(v=>!v)  },
              { label: 'Confirmer le nouveau',   val: confirm, set: setConfirm, show: showCf, toggle: () => setShowCf(v=>!v) },
            ].map(({ label, val, set, show, toggle }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)}
                    required style={INPUT_STYLE} />
                  <EyeBtn show={show} toggle={toggle}/>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 10, borderRadius: 8, border: 'none',
              backgroundColor: loading ? '#9CA3AF' : BRAND_GREEN,
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}


// -- EditProfileModal ---------------------------------------------------------
function EditProfileModal({ user, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    first_name:       user?.first_name || '',
    last_name:        user?.last_name  || '',
    country:          user?.country    || '',
    gender:           user?.gender     || 'unspecified',
    age_range:        user?.age_range  || '',
    ml_level:         user?.ml_level   || '',
    discovery_source: user?.discovery_source || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const updated = await authService.updateProfile(form)
      toast.success('Profil mis a jour.')
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise a jour.')
    } finally { setLoading(false) }
  }

  const INPUT = {
    width: '100%', padding: '9px 14px', boxSizing: 'border-box',
    border: '1px solid #E5E7EB', borderRadius: 8,
    fontSize: 14, backgroundColor: '#F9FAFB', outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
            <UserCircle2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }}/>
            Modifier mon profil
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={18}/>
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px',
            color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        <form onSubmit={submit}>
          {[
            { label: 'Prenom', key: 'first_name' },
            { label: 'Nom',    key: 'last_name'  },
          ].map(({ label, key }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)} style={INPUT} />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Pays</label>
            <select value={form.country} onChange={e => set('country', e.target.value)} style={INPUT}>
              <option value="">-- Selectionner --</option>
              <option value="Afghanistan">Afghanistan</option>
              <option value="Afrique du Sud">Afrique du Sud</option>
              <option value="Albanie">Albanie</option>
              <option value="Algerie">Algerie</option>
              <option value="Allemagne">Allemagne</option>
              <option value="Angola">Angola</option>
              <option value="Arabie Saoudite">Arabie Saoudite</option>
              <option value="Argentine">Argentine</option>
              <option value="Australie">Australie</option>
              <option value="Autriche">Autriche</option>
              <option value="Belgique">Belgique</option>
              <option value="Benin">Benin</option>
              <option value="Bolivie">Bolivie</option>
              <option value="Bresil">Bresil</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Burundi">Burundi</option>
              <option value="Cameroun">Cameroun</option>
              <option value="Canada">Canada</option>
              <option value="Chili">Chili</option>
              <option value="Chine">Chine</option>
              <option value="Colombie">Colombie</option>
              <option value="Congo">Congo</option>
              <option value="Cote d Ivoire">Cote d'Ivoire</option>
              <option value="Danemark">Danemark</option>
              <option value="Egypte">Egypte</option>
              <option value="Espagne">Espagne</option>
              <option value="Etats-Unis">Etats-Unis</option>
              <option value="Ethiopie">Ethiopie</option>
              <option value="Finlande">Finlande</option>
              <option value="France">France</option>
              <option value="Gabon">Gabon</option>
              <option value="Ghana">Ghana</option>
              <option value="Grece">Grece</option>
              <option value="Guinee">Guinee</option>
              <option value="Guinee-Bissau">Guinee-Bissau</option>
              <option value="Haiti">Haiti</option>
              <option value="Hongrie">Hongrie</option>
              <option value="Inde">Inde</option>
              <option value="Indonesie">Indonesie</option>
              <option value="Iran">Iran</option>
              <option value="Irak">Irak</option>
              <option value="Irlande">Irlande</option>
              <option value="Israël">Israel</option>
              <option value="Italie">Italie</option>
              <option value="Japon">Japon</option>
              <option value="Jordanie">Jordanie</option>
              <option value="Kenya">Kenya</option>
              <option value="Liban">Liban</option>
              <option value="Libye">Libye</option>
              <option value="Madagascar">Madagascar</option>
              <option value="Malawi">Malawi</option>
              <option value="Mali">Mali</option>
              <option value="Maroc">Maroc</option>
              <option value="Mauritanie">Mauritanie</option>
              <option value="Maurice">Maurice</option>
              <option value="Mexique">Mexique</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Niger">Niger</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Norvege">Norvege</option>
              <option value="Nouvelle-Zelande">Nouvelle-Zelande</option>
              <option value="Pays-Bas">Pays-Bas</option>
              <option value="Peru">Peru</option>
              <option value="Philippines">Philippines</option>
              <option value="Pologne">Pologne</option>
              <option value="Portugal">Portugal</option>
              <option value="Qatar">Qatar</option>
              <option value="Republique Democratique du Congo">RD Congo</option>
              <option value="Roumanie">Roumanie</option>
              <option value="Royaume-Uni">Royaume-Uni</option>
              <option value="Russie">Russie</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Senegal">Senegal</option>
              <option value="Sierra Leone">Sierra Leone</option>
              <option value="Somalie">Somalie</option>
              <option value="Soudan">Soudan</option>
              <option value="Suede">Suede</option>
              <option value="Suisse">Suisse</option>
              <option value="Tanzanie">Tanzanie</option>
              <option value="Tchad">Tchad</option>
              <option value="Togo">Togo</option>
              <option value="Tunisie">Tunisie</option>
              <option value="Turquie">Turquie</option>
              <option value="Ukraine">Ukraine</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Zimbabwe">Zimbabwe</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Genre</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} style={INPUT}>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Tranche d'age</label>
              <select value={form.age_range} onChange={e => set('age_range', e.target.value)} style={INPUT}>
                <option value="">--</option>
                <option value="moins de 18">Moins de 18</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Niveau ML</label>
            <select value={form.ml_level} onChange={e => set('ml_level', e.target.value)} style={INPUT}>
              <option value="">-- Selectionner --</option>
              {[['beginner','Debutant'], ['intermediate','Intermediaire'], ['advanced','Avance']].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 10, borderRadius: 8, border: 'none', marginTop: 4,
            backgroundColor: loading ? '#9CA3AF' : '#00853F',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  )
}

// -- Navbar -------------------------------------------------------------------
export default function Navbar() {
  const { user, clearAuth, setAuth, token } = useAuthStore()
  const navigate = useNavigate()
  const toast    = useToast()
  const { toggle: toggleSidebar } = useSidebar()
  const { isMobile } = useResponsive()

  const [menuOpen,      setMenuOpen]      = useState(false)
  const [showPwdModal,  setShowPwdModal]  = useState(false)
  const [showProfModal, setShowProfModal] = useState(false)
  const menuRef = useRef(null)

  // Fermer le menu au clic exterieur
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
    toast.info('Deconnecte avec succes.')
  }

  const NAVBAR_H = 56

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: NAVBAR_H,
        backgroundColor: '#fff',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}>
        {/* Hamburger (mobile) */}
        {isMobile && (
          <button onClick={toggleSidebar} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6B7280', padding: 6, borderRadius: 6, display: 'flex',
          }}>
            <Menu size={20}/>
          </button>
        )}

        {/* Horloge */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          {!isMobile && <LiveClock />}

          {/* Separateur */}
          <div style={{ width: 1, height: 28, backgroundColor: '#E5E7EB' }}/>

          {/* Avatar + menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                backgroundColor: BRAND_GREEN, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', flexShrink: 0,
                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}>
                {getInitials(user)
                  ? getInitials(user)
                  : <UserCircle2 size={20} color="#fff" strokeWidth={1.8}/>}
              </div>
              {!isMobile && (
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {user?.full_name || user?.email || 'Utilisateur'}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{getRole(user)}</div>
                </div>
              )}
              <ChevronDown size={14} color="#9CA3AF" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                backgroundColor: '#fff', border: '1px solid #E5E7EB',
                borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                minWidth: 220, zIndex: 200, overflow: 'hidden',
              }}>
                {/* Header menu */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                    {user?.full_name || user?.email}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{user?.email}</div>
                  {user?.last_login && (
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10}/> Derniere connexion : {formatLastLogin(user.last_login)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ padding: '6px 0' }}>
                  <button onClick={() => { setMenuOpen(false); setShowProfModal(true) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserCircle2 size={15} color="#6B7280"/> Modifier le profil
                  </button>

                  <button onClick={() => { setMenuOpen(false); setShowPwdModal(true) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <KeyRound size={15} color="#6B7280"/> Changer le mot de passe
                  </button>

                  <div style={{ borderTop: '1px solid #F3F4F6', margin: '4px 0' }}/>

                  <button onClick={handleLogout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: '#DC2626', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={15} color="#DC2626"/> Se deconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showPwdModal   && <ChangePasswordModal onClose={() => setShowPwdModal(false)}/>}
      {showProfModal  && <EditProfileModal user={user} onClose={() => setShowProfModal(false)} onSaved={(u) => setAuth(u, token)} />}
    </>
  )
}
