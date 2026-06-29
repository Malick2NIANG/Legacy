/**
 * AdminPage — gestion utilisateurs + statistiques démographiques
 */
import React, { useState, useEffect } from 'react'
import { Users, Shield, ShieldOff, UserCheck, UserX, Trash2, RefreshCw, BarChart2, Globe, Brain, TrendingUp } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import Sidebar    from '../components/common/Sidebar'
import Navbar     from '../components/common/Navbar'
import PageFooter from '../components/common/Footer'
import useLayout  from '../hooks/useLayout'
import { useToast } from '../context/ToastContext'

const GREEN  = '#00853F'
const GREEN2 = '#1B4D2E'
const GOLD   = '#E8A020'

// ── Badges ────────────────────────────────────────────────────────────────────
function RoleBadge({ isAdmin }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, backgroundColor:isAdmin?'rgba(239,68,68,0.1)':'#E6F4ED', color:isAdmin?'#EF4444':GREEN2 }}>
      {isAdmin ? <Shield size={10}/> : <Users size={10}/>}
      {isAdmin ? 'Admin' : 'Utilisateur'}
    </span>
  )
}
function StatusBadge({ isActive }) {
  return (
    <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:600, backgroundColor:isActive?'#E6F4ED':'rgba(156,163,175,0.15)', color:isActive?GREEN:'#6B7280' }}>
      {isActive ? 'Actif' : 'Désactivé'}
    </span>
  )
}

// ── Graphiques ────────────────────────────────────────────────────────────────
const CHART_COLORS = ['#00853F','#1B4D2E','#E8A020','#2563EB','#7C3AED','#0891B2','#DC2626','#D97706']

function HBarChart({ data, title, maxItems = 8 }) {
  const top = [...data].sort((a,b)=>b.count-a.count).slice(0, maxItems)
  const max = top[0]?.count || 1
  return (
    <div>
      {top.map(({ label, count }, i) => (
        <div key={label} style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
            <span style={{ color:'#374151', fontWeight:500, maxWidth:'70%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
            <span style={{ color:'#6B7280', fontWeight:600 }}>{count}</span>
          </div>
          <div style={{ height:8, backgroundColor:'#F0F7F3', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4, backgroundColor:CHART_COLORS[i % CHART_COLORS.length], width:`${(count/max)*100}%`, transition:'width 0.6s ease' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, size=120 }) {
  const total = data.reduce((s,d)=>s+d.count,0)||1
  let offset = 0
  const r = 40, cx = size/2, cy = size/2
  const circ = 2*Math.PI*r
  const slices = data.map((d,i)=>{
    const pct = d.count/total
    const dash = pct*circ
    const gap  = circ - dash
    const slice = { ...d, dash, gap, offset, color: CHART_COLORS[i % CHART_COLORS.length] }
    offset += dash
    return slice
  })
  const LABELS = {
    male:'Homme', female:'Femme', unspecified:'Non précisé',
    beginner:'Débutant', intermediate:'Intermédiaire', advanced:'Avancé',
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F7F3" strokeWidth={18}/>
        {slices.map((s,i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={18}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`}/>
        ))}
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={14} fontWeight={700} fill={GREEN2}>{total}</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {slices.map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11 }}>
            <div style={{ width:10, height:10, borderRadius:3, backgroundColor:s.color, flexShrink:0 }}/>
            <span style={{ color:'#374151' }}>{LABELS[s.label]||s.label}</span>
            <span style={{ color:'#9CA3AF', marginLeft:'auto', paddingLeft:8 }}>{Math.round(s.count/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, color='#111827', bg='#F4F7F5', Icon }) {
  return (
    <div style={{ backgroundColor:'#fff', border:'1px solid #D6E8DC', borderRadius:10, padding:'16px', boxShadow:'0 1px 4px rgba(27,77,46,0.06)', display:'flex', alignItems:'center', gap:12 }}>
      {Icon && <div style={{ width:38, height:38, borderRadius:9, backgroundColor:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={17} color={color}/></div>}
      <div>
        <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
        <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

function ChartCard({ title, icon: Icon, children, span=1 }) {
  return (
    <div style={{ backgroundColor:'#fff', border:'1px solid #D6E8DC', borderRadius:12, padding:'20px 22px', boxShadow:'0 1px 4px rgba(27,77,46,0.06)', gridColumn:`span ${span}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        {Icon && <Icon size={15} color={GREEN}/>}
        <h3 style={{ margin:0, fontSize:13, fontWeight:700, color:'#111827' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user: currentUser } = useAuthStore()
  const { mainStyle } = useLayout()
  const toast = useToast()

  const [tab,     setTab]     = useState('users')
  const [users,   setUsers]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [demo,    setDemo]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes, demoRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/demographics'),
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
      setDemo(demoRes.data)
    } catch { toast.error('Impossible de charger les données.') }
    finally { setLoading(false) }
  }

  const toggleRole = async (user) => {
    if (user.id===currentUser?.id) return
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/role`, { is_admin:!user.is_admin })
      setUsers(prev=>prev.map(u=>u.id===data.id?data:u))
      toast.success(data.is_admin ? `${data.full_name||data.email} est maintenant administrateur.` : `${data.full_name||data.email} a été rétrogradé en utilisateur.`)
    } catch(err) { toast.error(err?.response?.data?.detail||'Une erreur est survenue.') }
  }

  const toggleStatus = async (user) => {
    if (user.id===currentUser?.id) return
    try {
      const { data } = await api.patch(`/admin/users/${user.id}/status`, { is_active:!user.is_active })
      setUsers(prev=>prev.map(u=>u.id===data.id?data:u))
      toast.success(data.is_active ? `Le compte de ${data.full_name||data.email} a été réactivé.` : `Le compte de ${data.full_name||data.email} a été désactivé.`)
    } catch(err) { toast.error(err?.response?.data?.detail||'Une erreur est survenue.') }
  }

  const deleteUser = async (user) => {
    if (user.id===currentUser?.id) return
    if (!window.confirm(`Supprimer définitivement le compte de ${user.email} ?`)) return
    try {
      await api.delete(`/admin/users/${user.id}`)
      setUsers(prev=>prev.filter(u=>u.id!==user.id))
      toast.success(`Le compte de ${user.full_name||user.email} a été supprimé.`)
    } catch(err) { toast.error(err?.response?.data?.detail||'Une erreur est survenue.') }
  }

  const STATS_CARDS = stats ? [
    { label:'Utilisateurs total', value:stats.users.total,  color:GREEN2,    bg:'#D4E8DC', Icon:Users    },
    { label:'Comptes actifs',     value:stats.users.active, color:GREEN,     bg:'#E6F4ED', Icon:UserCheck },
    { label:'Admins',             value:stats.users.admins, color:'#EF4444', bg:'#FEE2E2', Icon:Shield   },
    { label:'Datasets',           value:stats.datasets,     color:'#D97706', bg:'#FEF3C7', Icon:BarChart2 },
    { label:'Modèles',            value:stats.models,       color:'#7C3AED', bg:'#EDE9FE', Icon:Brain    },
    { label:'Expériences',        value:stats.experiments,  color:'#0891B2', bg:'#CFFAFE', Icon:TrendingUp},
  ] : []

  const TAB_STYLE = (active) => ({
    padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:active?700:500,
    border:'none', cursor:'pointer', transition:'all 0.15s',
    backgroundColor: active ? GREEN : 'transparent',
    color: active ? '#fff' : '#6B7280',
  })

  return (
    <div style={{ fontFamily:'Inter, Segoe UI, sans-serif', backgroundColor:'#F4F7F5', minHeight:'100vh' }}>
      <Sidebar/>
      <Navbar/>
      <main style={{ ...mainStyle, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'clamp(16px,3vw,32px)' }}>

          {/* En-tête */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700, color:'#111827' }}>Administration</h1>
              <p style={{ margin:0, fontSize:14, color:'#6B7280' }}>Gestion des utilisateurs et statistiques de la plateforme.</p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ display:'flex', gap:4, backgroundColor:'#F0F7F3', borderRadius:10, padding:4 }}>
                <button onClick={()=>setTab('users')} style={TAB_STYLE(tab==='users')}>
                  <Users size={13} style={{ marginRight:6, verticalAlign:'middle' }}/>Utilisateurs
                </button>
                <button onClick={()=>setTab('stats')} style={TAB_STYLE(tab==='stats')}>
                  <BarChart2 size={13} style={{ marginRight:6, verticalAlign:'middle' }}/>Statistiques
                </button>
              </div>
              <button onClick={fetchData} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:8, border:'1px solid #D6E8DC', backgroundColor:'#fff', fontSize:13, cursor:'pointer', color:'#374151' }}>
                <RefreshCw size={13}/> Actualiser
              </button>
            </div>
          </div>

          {/* ── ONGLET UTILISATEURS ── */}
          {tab==='users' && (
            <>
              {/* Stats rapides */}
              {stats && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:12, marginBottom:24 }}>
                  {STATS_CARDS.map(({ label, value, color, bg, Icon }) => (
                    <StatCard key={label} label={label} value={value} color={color} bg={bg} Icon={Icon}/>
                  ))}
                </div>
              )}

              {/* Alerte sécurité */}
              <div style={{ backgroundColor:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:10, padding:'10px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                <Shield size={14} color="#D97706" style={{ flexShrink:0 }}/>
                <span style={{ fontSize:13, color:'#92400E' }}>
                  Le formulaire d'inscription public crée <strong>uniquement des utilisateurs normaux</strong>. La promotion en admin se fait exclusivement depuis cette interface.
                </span>
              </div>

              {/* Tableau */}
              {loading ? <p style={{ color:'#9CA3AF', fontSize:14 }}>Chargement…</p> : (
                <div style={{ backgroundColor:'#fff', border:'1px solid #D6E8DC', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(27,77,46,0.06)' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ backgroundColor:'#F4F7F5', borderBottom:'1px solid #D6E8DC' }}>
                        {['Utilisateur','Rôle','Statut','Pays','Inscrit le','Actions'].map(h=>(
                          <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u,i)=>{
                        const isSelf = u.id===currentUser?.id
                        return (
                          <tr key={u.id} style={{ borderBottom:i<users.length-1?'1px solid #F0F7F3':'none', backgroundColor:isSelf?'#E6F4ED':'transparent' }}>
                            <td style={{ padding:'14px 16px' }}>
                              <div style={{ fontWeight:600, color:'#111827' }}>
                                {u.full_name||'—'}
                                {isSelf && <span style={{ marginLeft:8, fontSize:10, padding:'1px 7px', borderRadius:10, backgroundColor:'#D4E8DC', color:GREEN2, fontWeight:700 }}>Vous</span>}
                              </div>
                              <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>{u.email}</div>
                            </td>
                            <td style={{ padding:'14px 16px' }}><RoleBadge isAdmin={u.is_admin}/></td>
                            <td style={{ padding:'14px 16px' }}><StatusBadge isActive={u.is_active}/></td>
                            <td style={{ padding:'14px 16px', color:'#6B7280', fontSize:12 }}>{u.country||'—'}</td>
                            <td style={{ padding:'14px 16px', color:'#6B7280' }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                            <td style={{ padding:'14px 16px' }}>
                              {isSelf ? <span style={{ fontSize:12, color:'#9CA3AF' }}>—</span> : (
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  <button onClick={()=>toggleRole(u)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'1px solid', fontSize:11, cursor:'pointer', fontWeight:600, borderColor:u.is_admin?'#FECACA':'#D6E8DC', backgroundColor:u.is_admin?'#FEF2F2':'#F0F7F3', color:u.is_admin?'#EF4444':GREEN2 }}>
                                    {u.is_admin ? <ShieldOff size={11}/> : <Shield size={11}/>}
                                    {u.is_admin ? 'Rétrograder' : 'Promouvoir'}
                                  </button>
                                  <button onClick={()=>toggleStatus(u)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:6, border:'1px solid', fontSize:11, cursor:'pointer', fontWeight:600, borderColor:u.is_active?'#D6E8DC':'#BBF7D0', backgroundColor:u.is_active?'#F4F7F5':'#F0FDF4', color:u.is_active?'#6B7280':'#10B981' }}>
                                    {u.is_active ? <UserX size={11}/> : <UserCheck size={11}/>}
                                    {u.is_active ? 'Désactiver' : 'Activer'}
                                  </button>
                                  <button onClick={()=>deleteUser(u)} style={{ display:'flex', alignItems:'center', padding:'5px 8px', borderRadius:6, border:'1px solid #FECACA', backgroundColor:'#FEF2F2', color:'#EF4444', cursor:'pointer' }}>
                                    <Trash2 size={11}/>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── ONGLET STATISTIQUES ── */}
          {tab==='stats' && (
            <>
              {/* KPIs */}
              {demo && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:12, marginBottom:24 }}>
                  <StatCard label="Utilisateurs total"   value={demo.total_users}  color={GREEN2} bg="#D4E8DC" Icon={Users}/>
                  <StatCard label="Profils complétés"    value={demo.with_profile} color={GREEN}  bg="#E6F4ED" Icon={Globe}/>
                  <StatCard label="Taux de complétion"   value={`${demo.total_users?Math.round(demo.with_profile/demo.total_users*100):0}%`} color={GOLD} bg="#FDF3DC" Icon={TrendingUp}/>
                </div>
              )}

              {loading ? <p style={{ color:'#9CA3AF', fontSize:14 }}>Chargement…</p> : !demo ? <p style={{ color:'#9CA3AF' }}>Aucune donnée disponible.</p> : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

                  {/* Pays */}
                  <ChartCard title="Répartition par pays" icon={Globe} span={2}>
                    {demo.countries.length===0
                      ? <p style={{ color:'#9CA3AF', fontSize:13 }}>Aucune donnée encore.</p>
                      : <HBarChart data={demo.countries} maxItems={10}/>
                    }
                  </ChartCard>

                  {/* Sexe */}
                  <ChartCard title="Répartition par sexe" icon={Users}>
                    {demo.genders.length===0
                      ? <p style={{ color:'#9CA3AF', fontSize:13 }}>Aucune donnée encore.</p>
                      : <DonutChart data={demo.genders}/>
                    }
                  </ChartCard>

                  {/* Tranche d'âge */}
                  <ChartCard title="Tranche d'âge" icon={TrendingUp}>
                    {demo.age_ranges.length===0
                      ? <p style={{ color:'#9CA3AF', fontSize:13 }}>Aucune donnée encore.</p>
                      : <HBarChart data={[
                          ...['18-24','25-34','35-44','45+'].map(a=>({
                            label:a,
                            count:(demo.age_ranges.find(d=>d.label===a)||{count:0}).count
                          }))
                        ]}/>
                    }
                  </ChartCard>

                  {/* Raisons d'usage */}
                  <ChartCard title="Raisons d'utilisation" icon={BarChart2} span={2}>
                    {demo.usage_reasons.length===0
                      ? <p style={{ color:'#9CA3AF', fontSize:13 }}>Aucune donnée encore.</p>
                      : (() => {
                          const LABELS = { studies:'Études', work:'Projet pro', research:'Recherche académique', personal:'Curiosité personnelle', other:'Autre' }
                          return <HBarChart data={demo.usage_reasons.map(d=>({...d,label:LABELS[d.label]||d.label}))}/>
                        })()
                    }
                  </ChartCard>

                  {/* Niveau ML */}
                  <ChartCard title="Niveau en Data Science" icon={Brain}>
                    {demo.ml_levels.length===0
                      ? <p style={{ color:'#9CA3AF', fontSize:13 }}>Aucune donnée encore.</p>
                      : <DonutChart data={[
                          ...['beginner','intermediate','advanced'].map(l=>({
                            label:l,
                            count:(demo.ml_levels.find(d=>d.label===l)||{count:0}).count
                          })).filter(d=>d.count>0)
                        ]}/>
                    }
                  </ChartCard>

                  {/* Source de découverte */}
                  <ChartCard title="Source de découverte" icon={Globe}>
                    {demo.discovery.length===0
                      ? <p style={{ color:'#9CA3AF', fontSize:13 }}>Aucune donnée encore.</p>
                      : (() => {
                          const LABELS = { word_of_mouth:'Bouche à oreille', social:'Réseaux sociaux', web:'Web / Google', school:'Université / École', other:'Autre' }
                          return <HBarChart data={demo.discovery.map(d=>({...d,label:LABELS[d.label]||d.label}))}/>
                        })()
                    }
                  </ChartCard>

                </div>
              )}
            </>
          )}

        </div>
        <PageFooter/>
      </main>
    </div>
  )
}
