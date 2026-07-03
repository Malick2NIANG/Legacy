/**
 * Page des résultats d'expériences.
 * Affiche: métriques (accuracy/F1/précision/recall), radar, matrice de confusion,
 * courbe d'apprentissage (train vs val) et comparaison multi-expériences.
 */
import useLayout from '../hooks/useLayout'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, Target, BarChart2, GitCompare, TrendingUp, Package
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import Navbar      from '../components/common/Navbar'
import Sidebar     from '../components/common/Sidebar'
import PageFooter  from '../components/common/Footer'
import experimentService from '../services/experimentService'
import api from '../services/api'

const GREEN = '#00853F', GREEN2 = '#1B4D2E'
const METRIC_COLORS = ['#00853F', '#10B981', '#F59E0B', '#8B5CF6', '#2563EB', '#DB2777']

// ── Helpers ───────────────────────────────────────────────────────────────────
const pct = (v) => v != null ? (v * 100).toFixed(1) + '%' : ''

// ── Carte métrique ────────────────────────────────────────────────────────────
function MetricCard({ label, value, color }) {
  const display = value != null ? (value * 100).toFixed(1) : ''
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #D6E8DC',
      borderRadius: 12, padding: '22px 20px', textAlign: 'center',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 34, fontWeight: 800, color }}>{display}{value != null ? '%' : ''}</p>
    </div>
  )
}

// ── Matrice de confusion ──────────────────────────────────────────────────────
function ConfusionMatrix({ cm }) {
  if (!cm || cm.length === 0) return <p style={{ color: '#9CA3AF', fontSize: 13 }}>Non disponible.</p>
  const max = Math.max(...cm.flat(), 1)
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#111827', fontSize: 14 }}>Matrice de confusion</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {cm.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const intensity = cell / max
                  return (
                    <td key={j} style={{
                      width: 48, height: 48, textAlign: 'center',
                      backgroundColor: i === j
                        ? `rgba(0,133,63,${0.15 + intensity * 0.7})`
                        : `rgba(239,68,68,${intensity * 0.4})`,
                      border: '1px solid #D6E8DC',
                      fontWeight: i === j ? 700 : 400, color: '#111827',
                    }}>
                      {cell}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9CA3AF' }}>
        Vert = vrais positifs · Rouge = erreurs de classification
      </p>
    </div>
  )
}

// ── Courbe d'apprentissage ────────────────────────────────────────────────────
function LearningCurve({ history }) {
  if (!history || !history.train_sizes || history.train_sizes.length === 0) {
    return <p style={{ color: '#9CA3AF', fontSize: 13 }}>Non disponible, dataset trop petit ou entraînement non sklearn.</p>
  }
  const data = history.train_sizes.map((size, i) => ({
    samples: size,
    Entraînement: +(history.train_scores[i] * 100).toFixed(2),
    Validation:   +(history.val_scores[i]   * 100).toFixed(2),
  }))
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#111827', fontSize: 14 }}>Courbe d'apprentissage</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F7F3" />
          <XAxis dataKey="samples" tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: "Nb échantillons", position: "insideBottomRight", offset: -4, fontSize: 10, fill: '#9CA3AF' }} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#9CA3AF' }} width={42} />
          <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Entraînement" stroke={GREEN}   strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Validation"   stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9CA3AF' }}>
        Un écart important train/val indique du sur-apprentissage.
      </p>
    </div>
  )
}

// ── Carte contenant ───────────────────────────────────────────────────────────
function Card({ title, children, style = {} }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #D6E8DC', borderRadius: 12, padding: '22px 24px', ...style }}>
      {title && <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 14, color: '#111827' }}>{title}</p>}
      {children}
    </div>
  )
}

// ── Sélecteur d'expérience ────────────────────────────────────────────────────
function ExpSelector({ experiments, value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', backgroundColor: '#fff' }}>
        <option value=""> Sélectionner </option>
        {experiments.map(e => (
          <option key={e.id} value={e.id}>{e.name || `Expérience #${e.id}`}</option>
        ))}
      </select>
    </div>
  )
}

// ── Tableau de comparaison ────────────────────────────────────────────────────
function ComparisonTab({ experiments }) {
  const [selected, setSelected] = useState([])
  const [results,  setResults]  = useState({})
  const [loading,  setLoading]  = useState({})

  const toggleExp = useCallback(async (id) => {
    if (!id) return
    const idNum = Number(id)
    if (selected.includes(idNum)) {
      setSelected(prev => prev.filter(x => x !== idNum))
    } else {
      setSelected(prev => [...prev, idNum])
      if (!results[idNum]) {
        setLoading(prev => ({ ...prev, [idNum]: true }))
        try {
          const r = await experimentService.getResults(idNum)
          setResults(prev => ({ ...prev, [idNum]: r }))
        } catch { setResults(prev => ({ ...prev, [idNum]: null })) }
        finally { setLoading(prev => ({ ...prev, [idNum]: false })) }
      }
    }
  }, [selected, results])

  const METRICS = [
    { key: 'accuracy',  label: 'Accuracy',  color: '#00853F' },
    { key: 'precision', label: 'Precision', color: '#10B981' },
    { key: 'recall',    label: 'Recall',    color: '#F59E0B' },
    { key: 'f1_score',  label: 'F1 Score',  color: '#8B5CF6' },
  ]

  const selExps = experiments.filter(e => selected.includes(e.id))

  return (
    <div>
      {/* Sélection */}
      <Card title="Sélectionner les expériences à comparer" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {experiments.map(e => {
            const active = selected.includes(e.id)
            return (
              <button key={e.id} onClick={() => toggleExp(e.id)}
                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${active ? GREEN : '#E5E7EB'}`,
                  backgroundColor: active ? '#E6F4ED' : '#fff',
                  color: active ? GREEN : '#374151' }}>
                {e.name || `Expérience #${e.id}`}
                {loading[e.id] && ' …'}
              </button>
            )
          })}
        </div>
        {experiments.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Aucune expérience terminée.</p>}
      </Card>

      {/* Tableau comparatif */}
      {selExps.length > 0 && (
        <Card title="Comparaison des métriques">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F4F7F5' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Métrique</th>
                  {selExps.map(e => (
                    <th key={e.id} style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      {e.name || `Exp. #${e.id}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(({ key, label, color }) => {
                  const vals = selExps.map(e => results[e.id]?.[key])
                  const maxVal = Math.max(...vals.filter(v => v != null))
                  return (
                    <tr key={key} style={{ borderTop: '1px solid #F0F7F3' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                          {label}
                        </span>
                      </td>
                      {selExps.map(e => {
                        const v = results[e.id]?.[key]
                        const isBest = v != null && v === maxVal && selExps.length > 1
                        return (
                          <td key={e.id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: isBest ? 700 : 400,
                            color: isBest ? GREEN : '#374151',
                            backgroundColor: isBest ? '#F0FDF4' : 'transparent' }}>
                            {loading[e.id] ? '…' : pct(v)}
                            {isBest && <span style={{ fontSize: 10, marginLeft: 4, color: GREEN }}>↑</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {selExps.length > 1 && (
            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9CA3AF' }}>
              La meilleure valeur par métrique est surlignée en vert.
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { mainStyle }  = useLayout()
  const { experimentId } = useParams()
  const [tab, setTab]            = useState('details')
  const [experiments, setExps]   = useState([])
  const [selected, setSelected]  = useState(experimentId || '')
  const [result, setResult]      = useState(null)
  const [loading, setLoading]       = useState(false)
  const [exporting, setExporting]   = useState(false)
  const [dlModel, setDlModel]       = useState(false)

  useEffect(() => {
    experimentService.getAll().then(data => {
      const done = data.filter(e => e.status === 'completed')
      setExps(done)
      if (!selected && done.length > 0) setSelected(String(done[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selected) { setResult(null); return }
    setLoading(true)
    experimentService.getResults(selected)
      .then(setResult).catch(() => setResult(null))
      .finally(() => setLoading(false))
  }, [selected])

  const handleDownloadModel = async () => {
    if (!selected) return
    setDlModel(true)
    try {
      const { data } = await api.get(`/results/${selected}/download-model`)
      window.open(data.download_url, '_blank')
    } catch {
      alert('Modèle non disponible — relancez l\'expérience pour générer le .pkl')
    } finally {
      setDlModel(false)
    }
  }

  const handleExport = async (format, ext) => {
    if (!selected) return
    setExporting(true)
    try {
      const blob = await experimentService.exportResults(selected, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const prefix = format === 'csv_history' ? 'historique' : 'resultats'
      a.href = url; a.download = `${prefix}_${selected}.${ext || format}`; a.click()
      URL.revokeObjectURL(url)
    } catch { } finally { setExporting(false) }
  }

  const radarData = result ? [
    { metric: 'Accuracy',  value: +(result.accuracy  * 100).toFixed(1) },
    { metric: 'Precision', value: +(result.precision * 100).toFixed(1) },
    { metric: 'Recall',    value: +(result.recall    * 100).toFixed(1) },
    { metric: 'F1 Score',  value: +(result.f1_score  * 100).toFixed(1) },
  ] : []

  const TABS = [
    { key: 'details',    label: 'Résultats',   Icon: BarChart2   },
    { key: 'learning',   label: 'Apprentissage',Icon: TrendingUp  },
    { key: 'compare',    label: 'Comparaison',  Icon: GitCompare  },
  ]

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar /><Navbar />
      <main className="main-content" style={mainStyle}>
        <div style={{ padding: 'clamp(16px,3vw,32px)', flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <Link to="/experiments" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', textDecoration: 'none', marginBottom: 6 }}>
                <ArrowLeft size={12} /> Expériences
              </Link>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Résultats</h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Métriques d'évaluation et courbe d'apprentissage</p>
            </div>
            {result && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Bouton téléchargement du modèle .pkl */}
                {result.model_key && (
                  <button onClick={handleDownloadModel} disabled={dlModel}
                    title="Télécharger le modèle entraîné (.pkl)"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                      border: '1.5px solid #00853F', backgroundColor: '#E6F4ED', fontSize: 12,
                      cursor: dlModel ? 'not-allowed' : 'pointer', color: '#00853F', fontWeight: 600,
                      opacity: dlModel ? 0.6 : 1 }}>
                    <Package size={13} /> {dlModel ? 'Chargement…' : 'Modèle .pkl'}
                  </button>
                )}
                <div style={{ width: 1, height: 24, backgroundColor: '#D6E8DC' }} />
                {[
                  { fmt: 'csv',         label: 'CSV Resume',     title: 'Metriques + infos experience + matrice de confusion', ext: 'csv'  },
                  { fmt: 'csv_history', label: 'CSV Historique', title: 'Historique entrainement epoch par epoch',              ext: 'csv'  },
                  { fmt: 'json',        label: 'JSON Complet',   title: 'Metriques + historique + matrice de confusion',       ext: 'json' },
                ].map(({ fmt, label, title, ext }) => (
                  <button key={fmt} onClick={() => handleExport(fmt, ext)} disabled={exporting}
                    title={title}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                      border: '1px solid #D6E8DC', backgroundColor: '#fff', fontSize: 12,
                      cursor: exporting ? 'not-allowed' : 'pointer', color: '#374151',
                      opacity: exporting ? 0.6 : 1 }}>
                    <Download size={12} /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #D6E8DC', padding: 6, width: 'fit-content' }}>
            {TABS.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: tab === key ? 700 : 500,
                  backgroundColor: tab === key ? GREEN2 : 'transparent',
                  color: tab === key ? '#fff' : '#6B7280', transition: 'all 0.15s' }}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          {/* Sélecteur expérience (onglets details & learning) */}
          {tab !== 'compare' && experiments.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <ExpSelector experiments={experiments} value={selected} onChange={setSelected} label="Expérience :" />
            </div>
          )}

          {/* ── Onglet Résultats ── */}
          {tab === 'details' && (
            loading ? (
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement des métriques…</p>
            ) : !result ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
                <Target size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  {experiments.length === 0 ? 'Aucune expérience terminée.' : 'Aucun résultat disponible.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Cartes métriques */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14 }}>
                  <MetricCard label="Accuracy"  value={result.accuracy}  color="#00853F" />
                  <MetricCard label="Precision" value={result.precision} color="#10B981" />
                  <MetricCard label="Recall"    value={result.recall}    color="#F59E0B" />
                  <MetricCard label="F1 Score"  value={result.f1_score}  color="#8B5CF6" />
                </div>
                {/* Radar + Matrice */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 16 }}>
                  <Card>
                    <p style={{ margin: '0 0 14px', fontWeight: 600, fontSize: 14, color: '#111827' }}>Radar des métriques</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar dataKey="value" stroke={GREEN} fill={GREEN} fillOpacity={0.2} />
                        <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card>
                    <ConfusionMatrix cm={result.confusion_matrix} />
                  </Card>
                </div>
              </div>
            )
          )}

          {/* ── Onglet Apprentissage ── */}
          {tab === 'learning' && (
            loading ? (
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement…</p>
            ) :             !result ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
                <TrendingUp size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <p style={{ margin: 0, fontSize: 15 }}>Aucun historique d'apprentissage disponible.</p>
              </div>
            ) : (
              <Card>
                <LearningCurve history={result.training_history} />
              </Card>
            )
          )}

          {/* ── Onglet Comparaison ── */}
          {tab === 'compare' && (
            <ComparisonTab experiments={experiments} />
          )}

        </div>
        <PageFooter />
      </main>
    </div>
  )
}
