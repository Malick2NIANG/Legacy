/**
 * Page des résultats d'une expérience.
 * Affiche accuracy, precision, recall, F1 et matrice de confusion.
 */
import useLayout from '../hooks/useLayout'
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart2, Download, FlaskConical, ArrowLeft, Target } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import Navbar  from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import experimentService from '../services/experimentService'
import PageFooter from '../components/common/Footer'

function MetricCard({ label, value, color }) {
  const pct = value != null ? (value * 100).toFixed(1) : '—'
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #D6E8DC',
      borderRadius: 12, padding: '24px',
      textAlign: 'center',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color }}>{pct}%</p>
    </div>
  )
}

function ConfusionMatrix({ cm }) {
  if (!cm || cm.length === 0) return null
  const max = Math.max(...cm.flat())
  return (
    <div>
      <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#111827', fontSize: 14 }}>
        Matrice de confusion
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {cm.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const intensity = max > 0 ? cell / max : 0
                  return (
                    <td key={j} style={{
                      width: 48, height: 48, textAlign: 'center',
                      backgroundColor: i === j
                        ? `rgba(16,185,129,${0.15 + intensity * 0.7})`
                        : `rgba(239,68,68,${intensity * 0.4})`,
                      border: '1px solid #D6E8DC',
                      fontWeight: i === j ? 700 : 400,
                      color: '#111827',
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

export default function ResultsPage() {
  const { mainStyle } = useLayout()
  const { experimentId } = useParams()
  const [experiments, setExperiments] = useState([])
  const [selected, setSelected]       = useState(experimentId || '')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [exporting, setExporting]     = useState(false)

  useEffect(() => {
    experimentService.getAll().then(data => {
      const completed = data.filter(e => e.status === 'COMPLETED')
      setExperiments(completed)
      if (!selected && completed.length > 0) setSelected(String(completed[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    experimentService.getResults(selected)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false))
  }, [selected])

  const handleExport = async (format) => {
    if (!selected) return
    setExporting(true)
    try {
      const blob = await experimentService.exportResults(selected, format)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `resultats_${selected}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch { } finally { setExporting(false) }
  }

  const radarData = result ? [
    { metric: 'Accuracy',  value: +(result.accuracy  * 100).toFixed(1) },
    { metric: 'Precision', value: +(result.precision * 100).toFixed(1) },
    { metric: 'Recall',    value: +(result.recall    * 100).toFixed(1) },
    { metric: 'F1 Score',  value: +(result.f1_score  * 100).toFixed(1) },
  ] : []

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />
      <main className="main-content" style={mainStyle}>
        <div style={{ padding: '32px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            <div>
              <Link to="/experiments" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: '#6B7280', textDecoration: 'none', marginBottom: 6,
              }}>
                <ArrowLeft size={12} /> Expériences
              </Link>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Résultats</h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Métriques d'évaluation du modèle</p>
            </div>

            {result && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleExport('csv')} disabled={exporting} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                  backgroundColor: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151',
                }}>
                  <Download size={12} /> CSV
                </button>
                <button onClick={() => handleExport('json')} disabled={exporting} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                  backgroundColor: '#fff', fontSize: 12, cursor: 'pointer', color: '#374151',
                }}>
                  <Download size={12} /> JSON
                </button>
              </div>
            )}
          </div>

          {/* Sélecteur d'expérience */}
          {experiments.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginRight: 10 }}>
                Expérience :
              </label>
              <select value={selected} onChange={e => setSelected(e.target.value)} style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 13, color: '#111827', outline: 'none',
              }}>
                {experiments.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name || `Expérience #${e.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contenu */}
          {loading ? (
            <p style={{ color: '#9CA3AF' }}>Chargement des métriques…</p>
          ) : !result ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
              <Target size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                {experiments.length === 0
                  ? 'Aucune expérience terminée pour l\'instant.'
                  : 'Aucun résultat trouvé pour cette expérience.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Métriques */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 16 }}>
                <MetricCard label="Accuracy"  value={result.accuracy}  color="#00853F" />
                <MetricCard label="Precision" value={result.precision} color="#10B981" />
                <MetricCard label="Recall"    value={result.recall}    color="#F59E0B" />
                <MetricCard label="F1 Score"  value={result.f1_score}  color="#8B5CF6" />
              </div>

              {/* Radar + Matrice */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
                {/* Radar */}
                <div style={{
                  backgroundColor: '#fff', border: '1px solid #D6E8DC',
                  borderRadius: 12, padding: '24px',
                }}>
                  <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#111827', fontSize: 14 }}>
                    Radar des métriques
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar dataKey="value" stroke="#00853F" fill="#00853F" fillOpacity={0.2} />
                      <Tooltip formatter={v => `${v}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Matrice de confusion */}
                <div style={{
                  backgroundColor: '#fff', border: '1px solid #D6E8DC',
                  borderRadius: 12, padding: '24px',
                }}>
                  {result.confusion_matrix ? (
                    <ConfusionMatrix cm={result.confusion_matrix} />
                  ) : (
                    <p style={{ color: '#9CA3AF', fontSize: 13 }}>Matrice non disponible.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
          <PageFooter />
      </main>
    </div>
  )
}
