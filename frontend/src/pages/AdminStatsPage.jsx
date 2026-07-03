import React, { useEffect, useState, useCallback } from 'react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import useLayout  from '../hooks/useLayout'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const GREEN = '#00853F', GREEN2 = '#1B4D2E', GOLD = '#E8A020'
const CHART_COLORS = [GREEN,'#2563EB','#D97706','#7C3AED','#0891B2','#DB2777','#059669','#EA580C']

// ── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { key:'datasets',    label:'Datasets',    accent:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE', inactiveBorder:'#DBEAFE' },
  { key:'models',      label:'Modeles',     accent:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', inactiveBorder:'#EDE9FE' },
  { key:'experiments', label:'Experiences', accent:'#D97706', bg:'#FFFBEB', border:'#FDE68A', inactiveBorder:'#FEF3C7' },
  { key:'demo',        label:'Demographie', accent:GREEN,     bg:'#E6F4ED', border:'#86EFAC', inactiveBorder:'#D1FAE5' },
]

// ── KPI card (couleurs drapeau senegalais avec sens) ─────────────────────────
// green=positif/reussite  gold=neutre/encours  red=alerte/echec
const PALETTE = {
  green:  { bg:'#E6F4ED', border:'#86EFAC', color:GREEN,     icon:'#D4E8DC' },
  gold:   { bg:'#FFFBEB', border:'#FDE68A', color:'#D97706', icon:'#FEF3C7' },
  red:    { bg:'#FEF2F2', border:'#FECACA', color:'#DC2626', icon:'#FEE2E2' },
}
function KpiCard({ label, value, sub, color='green', Icon }) {
  const p = PALETTE[color] || PALETTE.green
  return (
    <div style={{ position:'relative', borderRadius:16, padding:'22px 20px 20px',
      background:`linear-gradient(140deg, ${p.bg} 0%, #fff 55%)`,
      border:`1px solid ${p.border}`, overflow:'hidden',
      boxShadow:`0 1px 2px rgba(0,0,0,0.04), 0 6px 20px ${p.color}12` }}>

      {/* Valeur fantome en filigrane */}
      <div style={{ position:'absolute', right:-8, bottom:-14, fontSize:72, fontWeight:900,
        color:p.color, opacity:0.07, lineHeight:1, userSelect:'none', pointerEvents:'none',
        letterSpacing:'-2px' }}>{value}</div>

      {/* Icone avec ombre coloree */}
      {Icon && (
        <div style={{ position:'absolute', top:18, right:18, width:40, height:40,
          borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center',
          background:`linear-gradient(135deg, ${p.color} 0%, ${p.color}BB 100%)`,
          boxShadow:`0 4px 14px ${p.color}44` }}>
          <Icon size={17} color='#fff'/>
        </div>
      )}

      {/* Label pill */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginBottom:14,
        backgroundColor:p.icon, borderRadius:6, padding:'3px 8px' }}>
        <div style={{ width:5, height:5, borderRadius:'50%', backgroundColor:p.color, flexShrink:0 }}/>
        <span style={{ fontSize:10, fontWeight:700, color:p.color,
          textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
      </div>

      {/* Valeur principale */}
      <div style={{ fontSize:32, fontWeight:900, color:'#0F172A',
        lineHeight:1, letterSpacing:'-0.5px' }}>{value}</div>

      {sub && (
        <div style={{ fontSize:11, color:'#94A3B8', marginTop:7, lineHeight:1.4 }}>{sub}</div>
      )}
    </div>
  )
}

// ── Graphiques ────────────────────────────────────────────────────────────────
function HBar({ data, labelMap={}, maxItems=8 }) {
  const top = [...data].sort((a,b)=>b.count-a.count).slice(0,maxItems)
  const max = top[0]?.count || 1
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {top.map(({ label, count }, i) => (
        <div key={label}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
            <span style={{ color:'#374151', fontWeight:500, maxWidth:'72%',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {labelMap[label] || label}
            </span>
            <span style={{ color:'#6B7280', fontWeight:700 }}>{count}</span>
          </div>
          <div style={{ height:7, backgroundColor:'#F0F4F8', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:4,
              backgroundColor:CHART_COLORS[i % CHART_COLORS.length],
              width:`${(count/max)*100}%`, transition:'width 0.5s ease' }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function Donut({ data, labelMap={} }) {
  const total = data.reduce((s,d)=>s+d.count,0) || 1
  let offset = 0
  const R=44, CX=70, CY=70, C=2*Math.PI*R
  const slices = data.map((d,i) => {
    const pct=d.count/total, dash=pct*C, gap=C-dash
    const sl = { ...d, dash, gap, offset, color: d.color || CHART_COLORS[i%CHART_COLORS.length] }
    offset += pct; return sl
  })
  return (
    <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink:0 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F0F4F8" strokeWidth={20}/>
        {slices.map((s,i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={20}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset * C}
            style={{ transform:'rotate(-90deg)', transformOrigin:`${CX}px ${CY}px` }}/>
        ))}
        <text x={CX} y={CY+5} textAnchor="middle" fontSize={16} fontWeight={800} fill={GREEN2}>{total}</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {slices.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:9, fontSize:12 }}>
            <div style={{ width:10, height:10, borderRadius:3,
              backgroundColor:s.color, flexShrink:0 }}/>
            <span style={{ color:'#374151', fontWeight:500 }}>
              {labelMap[s.label] || s.label}
            </span>
            <span style={{ color:'#9CA3AF', marginLeft:'auto', paddingLeft:12, fontWeight:600 }}>
              {Math.round(s.count/total*100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartBox({ title, children, span=1 }) {
  return (
    <div style={{ backgroundColor:'#fff', borderRadius:14, border:'1px solid #E5E7EB',
      padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
      gridColumn:`span ${span}` }}>
      <h4 style={{ margin:'0 0 18px', fontSize:13, fontWeight:700, color:'#111827' }}>{title}</h4>
      {children}
    </div>
  )
}

function Empty() {
  return <p style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'20px 0', margin:0 }}>
    Aucune donnee disponible.
  </p>
}

function Loading() {
  return <p style={{ color:'#9CA3AF', fontSize:14, padding:'40px 0', textAlign:'center' }}>Chargement...</p>
}

// ── Icones inline SVG ────────────────────────────────────────────────────────
const IcoDb      = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
const IcoCal     = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoBox     = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
const IcoUsers   = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoLayers  = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
const IcoGit     = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>
const IcoCheck   = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
const IcoClock   = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoX       = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const IcoTarget  = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const IcoTimer   = ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

// ── Onglet Datasets ───────────────────────────────────────────────────────────
function DatasetsTab() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/admin/stats/datasets')
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement datasets.'))
      .finally(() => setLoading(false))
  }, [])

  const fmtStorage = (b) => {
    if (!b) return '0 o'
    if (b >= 1e9) return `${(b/1e9).toFixed(2)} Go`
    if (b >= 1e6) return `${(b/1e6).toFixed(1)} Mo`
    if (b >= 1e3) return `${(b/1e3).toFixed(0)} Ko`
    return `${b} o`
  }

  if (loading) return <Loading/>
  if (!data)   return <Empty/>

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Total datasets"      value={data.total}                  color="green" Icon={IcoDb}/>
        <KpiCard label="Ce mois-ci"          value={data.this_month}             color="gold"  Icon={IcoCal}/>
        <KpiCard label="Stockage total"      value={fmtStorage(data.storage_bytes)} color="green" Icon={IcoBox}/>
        <KpiCard label="Utilisateurs actifs" value={data.owners_count}           color="gold"  Icon={IcoUsers}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <ChartBox title="Repartition par type de fichier">
          {data.by_type?.length > 0 ? <HBar data={data.by_type}/> : <Empty/>}
        </ChartBox>
        <ChartBox title="Uploads par mois (6 derniers mois)">
          {data.monthly?.length > 0
            ? <HBar data={data.monthly.map(m => ({ ...m, label:m.label.slice(0,7) }))}/>
            : <Empty/>}
        </ChartBox>
      </div>
    </div>
  )
}

// ── Onglet Modeles ────────────────────────────────────────────────────────────
function ModelsTab() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/admin/stats/models')
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement modeles.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading/>
  if (!data)   return <Empty/>

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Total modeles"        value={data.total}         color="green" Icon={IcoLayers}/>
        <KpiCard label="Ce mois-ci"           value={data.this_month}    color="gold"  Icon={IcoCal}/>
        <KpiCard label="Algorithmes distincts" value={data.algo_count}   color="gold"  Icon={IcoGit}/>
        <KpiCard label="Createurs actifs"     value={data.owners_count}  color="green" Icon={IcoUsers}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <ChartBox title="Top algorithmes">
          {data.by_algorithm?.length > 0
            ? <HBar data={data.by_algorithm}/>
            : <Empty/>}
        </ChartBox>
        <ChartBox title="Repartition par framework">
          {data.by_model_type?.length > 0
            ? <Donut data={data.by_model_type}/>
            : <Empty/>}
        </ChartBox>
      </div>

      {data.by_export_format?.length > 0 && (
        <ChartBox title="Formats d'export generes (.pkl / .h5 / .pt)">
          <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
            {data.by_export_format.map((item, i) => {
              const colors = { '.pkl': '#00853F', '.h5': '#FF6F00', '.pt': '#EE4C2C' }
              const bgs    = { '.pkl': '#E6F4ED', '.h5': '#FFF3E0', '.pt': '#FEF2F0' }
              const color  = colors[item.label] || CHART_COLORS[i]
              const bg     = bgs[item.label]    || '#F9FAFB'
              return (
                <div key={item.label} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'14px 20px', borderRadius:12,
                  backgroundColor:bg, border:`1px solid ${color}30`, flex:'1 1 120px',
                }}>
                  <div style={{ width:10, height:10, borderRadius:3, backgroundColor:color, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color, lineHeight:1 }}>{item.count}</div>
                    <div style={{ fontSize:11, color:'#6B7280', marginTop:3, fontWeight:600 }}>{item.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </ChartBox>
      )}
    </div>
  )
}

// ── Onglet Experiences ────────────────────────────────────────────────────────
function ExperimentsTab() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/admin/stats/experiments')
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement experiences.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading/>
  if (!data)   return <Empty/>

  const rateColor = data.success_rate >= 70 ? 'green' : data.success_rate >= 40 ? 'gold' : 'red'
  const accColor  = data.avg_accuracy == null ? 'gold'
    : data.avg_accuracy >= 70 ? 'green' : data.avg_accuracy >= 50 ? 'gold' : 'red'

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <KpiCard label="Total experiences" value={data.total}              color="green"    Icon={IcoDb}/>
        <KpiCard label="Taux de reussite"  value={`${data.success_rate}%`} color={rateColor} Icon={IcoCheck}/>
        <KpiCard label="En cours"          value={data.running}            color="gold"     Icon={IcoClock}/>
        <KpiCard label="Echouees"          value={data.failed}             color="red"      Icon={IcoX}/>
      </div>

      {(data.avg_accuracy != null || data.avg_duration_min != null) && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:24 }}>
          {data.avg_accuracy != null && (
            <KpiCard label="Accuracy moyenne"
              value={`${data.avg_accuracy}%`}
              sub="sur les experiences terminees"
              color={accColor} Icon={IcoTarget}/>
          )}
          {data.avg_duration_min != null && (
            <KpiCard label="Duree moyenne"
              value={`${data.avg_duration_min} min`}
              sub="par experience terminee"
              color="gold" Icon={IcoTimer}/>
          )}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <ChartBox title="Repartition par statut">
          {data.by_status?.length > 0 ? <Donut data={data.by_status}/> : <Empty/>}
        </ChartBox>
        <ChartBox title="Experiences par mois (6 derniers mois)">
          {data.monthly?.length > 0
            ? <HBar data={data.monthly.map(m => ({ ...m, label:m.label.slice(0,7) }))}/>
            : <Empty/>}
        </ChartBox>
      </div>
    </div>
  )
}

// ── Onglet Demographie ────────────────────────────────────────────────────────
const DEMO_LABELS = {
  male:'Homme', female:'Femme', other:'Autre', unspecified:'Non precise',
  beginner:'Debutant', intermediate:'Intermediaire', advanced:'Avance', expert:'Expert',
  studies:'Etudes', work:'Projet pro', research:'Recherche', personal:'Curiosite',
  word_of_mouth:'Bouche a oreille', social:'Reseaux sociaux', web:'Web / Google', school:'Ecole',
  '18-24':'18-24 ans', '25-34':'25-34 ans', '35-44':'35-44 ans', '45+':'45 ans et +',
}

function DemoTab() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/admin/demographics')
      .then(r => setData(r.data))
      .catch(() => toast.error('Erreur chargement demographie.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading/>
  if (!data)   return <Empty/>

  const { countries=[], genders=[], age_ranges=[], ml_levels=[], usage_reasons=[], discovery=[] } = data
  const noData = arr => !arr || arr.length === 0

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <ChartBox title="Pays" span={2}>
        {noData(countries) ? <Empty/> : <HBar data={countries.slice(0,10)} labelMap={DEMO_LABELS}/>}
      </ChartBox>
      <ChartBox title="Genre">
        {noData(genders) ? <Empty/> : <Donut data={genders} labelMap={DEMO_LABELS}/>}
      </ChartBox>
      <ChartBox title="Tranche d'age">
        {noData(age_ranges) ? <Empty/> : <HBar data={age_ranges} labelMap={DEMO_LABELS}/>}
      </ChartBox>
      <ChartBox title="Niveau ML">
        {noData(ml_levels) ? <Empty/> : <Donut data={ml_levels} labelMap={DEMO_LABELS}/>}
      </ChartBox>
      <ChartBox title="Source de decouverte">
        {noData(discovery) ? <Empty/> : <HBar data={discovery} labelMap={DEMO_LABELS}/>}
      </ChartBox>
      <ChartBox title="Raisons d'utilisation" span={2}>
        {noData(usage_reasons) ? <Empty/> : <HBar data={usage_reasons} labelMap={DEMO_LABELS}/>}
      </ChartBox>
    </div>
  )
}

// ── Icones de navigation ─────────────────────────────────────────────────────
const NavIcons = {
  datasets:    ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>,
  models:      ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  experiments: ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  demo:        ({size,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
}

const TAB_LABELS = {
  datasets: 'Total datasets', models: 'Total modeles',
  experiments: 'Total experiences', demo: 'Utilisateurs'
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminStatsPage() {
  const { mainStyle } = useLayout()
  const toast = useToast()
  const [tab, setTab] = useState('datasets')
  const [counts, setCounts] = useState({ datasets:null, models:null, experiments:null, demo:null })

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/stats/datasets').then(r => r.data.total),
      api.get('/admin/stats/models').then(r => r.data.total),
      api.get('/admin/stats/experiments').then(r => r.data.total),
      api.get('/admin/users').then(r => r.data.filter(u => !u.is_admin).length),
    ]).then(([ds, mo, ex, usr]) => {
      setCounts({
        datasets:    ds.status==='fulfilled' ? ds.value : '—',
        models:      mo.status==='fulfilled' ? mo.value : '—',
        experiments: ex.status==='fulfilled' ? ex.value : '—',
        demo:        usr.status==='fulfilled' ? usr.value : '—',
      })
    })
  }, [])

  return (
    <div style={{ fontFamily:'Inter, Segoe UI, sans-serif', backgroundColor:'#F4F7F5', minHeight:'100vh' }}>
      <Sidebar/><Navbar/>
      <main style={{ ...mainStyle, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'clamp(16px,3vw,32px)' }}>

          {/* En-tete */}
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize:22, fontWeight:700, color:'#111827', margin:'0 0 4px' }}>Statistiques</h1>
            <p style={{ color:'#6B7280', fontSize:14, margin:0 }}>
              Vue d'ensemble des donnees de la plateforme.
            </p>
          </div>

          {/* Navigation — cartes cliquables style AdminPage */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            {TABS.map(t => {
              const active = tab === t.key
              const NavIcon = NavIcons[t.key]
              const cnt = counts[t.key]
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ textAlign:'left', padding:'18px 20px', borderRadius:12,
                    border:`2px solid ${active ? t.accent : t.inactiveBorder}`,
                    backgroundColor: active ? t.bg : '#fff',
                    cursor:'pointer', transition:'all 0.15s',
                    boxShadow: active ? `0 2px 12px ${t.accent}22` : '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color: active ? t.accent : '#6B7280' }}>
                      {TAB_LABELS[t.key]}
                    </span>
                    <NavIcon size={16} color={active ? t.accent : '#D1D5DB'}/>
                  </div>
                  <div style={{ fontSize:28, fontWeight:800, color: active ? t.accent : '#111827' }}>
                    {cnt === null ? '…' : cnt}
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color: active ? t.accent : '#9CA3AF',
                    marginTop:6, textTransform:'uppercase', letterSpacing:'0.4px' }}>
                    {t.label}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Contenu */}
          {tab === 'datasets'    && <DatasetsTab/>}
          {tab === 'models'      && <ModelsTab/>}
          {tab === 'experiments' && <ExperimentsTab/>}
          {tab === 'demo'        && <DemoTab/>}

        </div>
        <PageFooter/>
      </main>
    </div>
  )
}
