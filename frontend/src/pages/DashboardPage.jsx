/**
 * Page tableau de bord — vue différenciée utilisateur / admin
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database, Brain, FlaskConical, BarChart2, Plus, Play,
  CheckCircle, Circle, Users, Activity, TrendingUp,
  Shield, ArrowRight,
} from 'lucide-react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import useLayout  from '../hooks/useLayout'
import useAuthStore from '../store/authStore'
import api from '../services/api'

const GREEN  = '#00853F'
const GREEN2 = '#1B4D2E'
const GOLD   = '#E8A020'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'En attente', color: '#D97706', bg: '#FEF3C7' },
  running:   { label: 'En cours',   color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Terminé',    color: GREEN,     bg: '#E6F4ED' },
  failed:    { label: 'Échoué',     color: '#DC2626', bg: '#FEF2F2' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      backgroundColor: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
      {children}
    </h2>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 12,
      border: '1px solid #D6E8DC',
      boxShadow: '0 1px 4px rgba(27,77,46,0.06)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VUE UTILISATEUR
// ══════════════════════════════════════════════════════════════════════════════
function UserDashboard({ user }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const counts      = data?.counts      || { datasets: 0, models: 0, experiments: 0, results: 0 }
  const onboarding  = data?.onboarding  || {}
  const recentExps  = data?.recent_experiments || []
  const onboardingDone = onboarding.has_dataset && onboarding.has_model && onboarding.has_experiment && onboarding.has_result

  const onboardingSteps = [
    { key: 'has_dataset',    label: 'Importez votre premier dataset',  to: '/datasets',    done: onboarding.has_dataset    },
    { key: 'has_model',      label: 'Configurez un modèle',            to: '/models',      done: onboarding.has_model      },
    { key: 'has_experiment', label: 'Lancez une expérience',           to: '/experiments', done: onboarding.has_experiment },
    { key: 'has_result',     label: 'Consultez vos résultats',         to: '/results',     done: onboarding.has_result     },
  ]
  const doneCount = onboardingSteps.filter(s => s.done).length

  const STATS = [
    { label: 'Datasets',    value: counts.datasets,    color: GREEN,     bg: '#E6F4ED', Icon: Database    },
    { label: 'Modèles',     value: counts.models,      color: GREEN2,    bg: '#D4E8DC', Icon: Brain       },
    { label: 'Expériences', value: counts.experiments, color: GOLD,      bg: '#FDF3DC', Icon: FlaskConical },
    { label: 'Résultats',   value: counts.results,     color: '#7C3AED', bg: '#EDE9FE', Icon: BarChart2   },
  ]

  const QUICK = [
    { label: 'Nouveau dataset',     to: '/datasets',    Icon: Database,    color: GREEN  },
    { label: 'Nouveau modèle',      to: '/models',      Icon: Brain,       color: GREEN2 },
    { label: 'Nouvelle expérience', to: '/experiments', Icon: FlaskConical, color: GOLD  },
  ]

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 32px)' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Bonjour, {user?.full_name?.split(' ')[0] || user?.email} 👋
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
          Bienvenue sur votre espace Data Science.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))',
        gap: 16, marginBottom: 28,
      }}>
        {STATS.map(({ label, value, color, bg, Icon }) => (
          <Card key={label} style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6B7280' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111827' }}>
                  {loading ? '—' : value}
                </p>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10, backgroundColor: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* Checklist onboarding */}
        {!onboardingDone && (
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionTitle>Premiers pas</SectionTitle>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{doneCount}/4 complétés</span>
            </div>
            <div style={{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 18, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, backgroundColor: GREEN,
                width: `${(doneCount / 4) * 100}%`, transition: 'width 0.4s ease',
              }} />
            </div>
            {onboardingSteps.map(({ key, label, to, done }) => (
              <Link key={key} to={done ? '#' : to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                  backgroundColor: done ? '#F0FDF4' : '#F9FAFB',
                  border: `1px solid ${done ? '#BBF7D0' : '#F3F4F6'}`,
                  opacity: done ? 0.7 : 1,
                }}>
                  {done ? <CheckCircle size={16} color={GREEN} /> : <Circle size={16} color="#D1D5DB" />}
                  <span style={{ fontSize: 13, color: done ? '#6B7280' : '#111827', fontWeight: done ? 400 : 500,
                    textDecoration: done ? 'line-through' : 'none' }}>
                    {label}
                  </span>
                  {!done && <ArrowRight size={13} color="#9CA3AF" style={{ marginLeft: 'auto' }} />}
                </div>
              </Link>
            ))}
          </Card>
        )}

        {/* Raccourcis rapides */}
        <Card style={{ padding: 24 }}>
          <SectionTitle>Accès rapides</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUICK.map(({ label, to, Icon, color }) => (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10,
                    border: '1px solid #D6E8DC', backgroundColor: '#F9FBFA',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E6F4ED'; e.currentTarget.style.borderColor = '#A8D5BB' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F9FBFA'; e.currentTarget.style.borderColor = '#D6E8DC' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</span>
                  <ArrowRight size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Expériences récentes */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F7F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionTitle>Expériences récentes</SectionTitle>
          <Link to="/experiments" style={{ fontSize: 12, color: GREEN, textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
        </div>
        {loading ? (
          <p style={{ padding: '24px', color: '#9CA3AF', fontSize: 14 }}>Chargement…</p>
        ) : recentExps.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <FlaskConical size={32} color="#D1D5DB" style={{ marginBottom: 10 }} />
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Aucune expérience lancée pour l'instant.</p>
            <Link to="/experiments" style={{ display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600, color: GREEN, textDecoration: 'none' }}>
              Lancer ma première expérience →
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F4F7F5' }}>
                {['Nom', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentExps.map((e, i) => (
                <tr key={e.id} style={{ borderTop: i > 0 ? '1px solid #F0F7F3' : 'none' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 500, color: '#111827' }}>{e.name}</td>
                  <td style={{ padding: '12px 20px' }}><StatusBadge status={e.status} /></td>
                  <td style={{ padding: '12px 20px', color: '#6B7280' }}>{formatDate(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Bannière CTA si rien encore */}
      {!loading && counts.experiments === 0 && (
        <div style={{
          borderRadius: 16, padding: '28px 32px', color: '#fff', marginBottom: 24,
          backgroundImage: `linear-gradient(135deg, ${GREEN2} 0%, #0F3320 100%)`,
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Commencez votre analyse</h2>
          <p style={{ margin: '0 0 18px', color: '#A8C9B5', fontSize: 13 }}>
            Importez un dataset, configurez un modèle, lancez un entraînement.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/datasets" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 8, backgroundColor: GREEN,
              color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              <Plus size={13} /> Importer un dataset
            </Link>
            <Link to="/experiments" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              <Play size={13} /> Lancer une expérience
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VUE ADMIN
// ══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ user }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const STATS = data ? [
    { label: 'Utilisateurs',       value: data.users.total,         color: GREEN2,    bg: '#D4E8DC', Icon: Users       },
    { label: 'Comptes actifs',      value: data.users.active,        color: GREEN,     bg: '#E6F4ED', Icon: Activity    },
    { label: 'Expériences totales', value: data.experiments,         color: GOLD,      bg: '#FDF3DC', Icon: FlaskConical },
    { label: 'En cours',           value: data.running_experiments, color: '#2563EB', bg: '#EFF6FF', Icon: TrendingUp  },
    { label: 'Datasets',           value: data.datasets,            color: '#7C3AED', bg: '#EDE9FE', Icon: Database    },
    { label: 'Modèles',            value: data.models,              color: '#0891B2', bg: '#CFFAFE', Icon: Brain       },
  ] : []

  const recentUsers = data?.recent_users        || []
  const recentExps  = data?.recent_experiments  || []

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 32px)' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Vue d'ensemble — Plateforme
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
          Activité globale et santé de la plateforme Legacy.
        </p>
      </div>

      {/* Stats globales */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))',
        gap: 14, marginBottom: 28,
      }}>
        {loading
          ? Array(6).fill(0).map((_, i) => <Card key={i} style={{ padding: 20, height: 80 }} />)
          : STATS.map(({ label, value, color, bg, Icon }) => (
            <Card key={label} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 5px', fontSize: 12, color: '#6B7280' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#111827' }}>{value}</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
              </div>
            </Card>
          ))
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Derniers inscrits */}
        <Card>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F0F7F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>Derniers inscrits</SectionTitle>
            <Link to="/admin" style={{ fontSize: 12, color: GREEN, textDecoration: 'none', fontWeight: 600 }}>Gérer →</Link>
          </div>
          {loading ? <p style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Chargement…</p> : (
            <div>
              {recentUsers.length === 0 ? (
                <p style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Aucun utilisateur.</p>
              ) : recentUsers.map((u, i) => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 22px', borderTop: i > 0 ? '1px solid #F0F7F3' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${GREEN2}, ${GREEN})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {(u.full_name || u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.full_name || u.email}
                      {u.is_admin && <Shield size={11} color="#EF4444" />}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{formatDate(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Dernières expériences plateforme */}
        <Card>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F0F7F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle>Expériences récentes</SectionTitle>
            <span style={{ fontSize: 11, color: '#6B7280' }}>Toute la plateforme</span>
          </div>
          {loading ? <p style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Chargement…</p> : (
            <div>
              {recentExps.length === 0 ? (
                <p style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Aucune expérience.</p>
              ) : recentExps.map((e, i) => (
                <div key={e.id} style={{ padding: '11px 22px', borderTop: i > 0 ? '1px solid #F0F7F3' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{e.name}</span>
                    <StatusBadge status={e.status} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    par {e.owner_name || e.owner_email} · {formatDate(e.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Accès rapides admin */}
      <Card style={{ padding: 24 }}>
        <SectionTitle>Accès rapides</SectionTitle>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Gérer les utilisateurs', to: '/admin',       Icon: Users,        color: GREEN2    },
            { label: 'Voir les datasets',      to: '/datasets',    Icon: Database,     color: GREEN     },
            { label: 'Toutes les expériences', to: '/experiments', Icon: FlaskConical, color: GOLD      },
            { label: 'Tous les résultats',     to: '/results',     Icon: BarChart2,    color: '#7C3AED' },
          ].map(({ label, to, Icon, color }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none', flex: '1 1 180px' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 16px', borderRadius: 10,
                  border: '1px solid #D6E8DC', backgroundColor: '#F9FBFA', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E6F4ED'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F9FBFA'}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{label}</span>
                <ArrowRight size={13} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { mainStyle } = useLayout()
  const { user }      = useAuthStore()

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />
      <main style={{ ...mainStyle, display: 'flex', flexDirection: 'column' }}>
        {user?.is_admin
          ? <AdminDashboard user={user} />
          : <UserDashboard  user={user} />
        }
        <PageFooter />
      </main>
    </div>
  )
}
