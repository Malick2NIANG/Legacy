/**
 * Page de gestion des expériences ML.
 * Lance des expériences avec polling du statut en temps réel.
 * Mode CPU — pas de GPU sur cette machine.
 */
import useLayout from '../hooks/useLayout'
import React, { useState, useEffect, useRef } from 'react'
import {
  FlaskConical, Play, Plus, X, AlertCircle, Cpu,
  CheckCircle, Clock, XCircle, Loader, BarChart2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import datasetService  from '../services/datasetService'
import modelService    from '../services/modelService'
import experimentService from '../services/experimentService'

const STATUS_INFO = {
  PENDING:   { label: 'En attente',    color: '#9CA3AF', Icon: Clock      },
  RUNNING:   { label: 'En cours…',     color: '#F59E0B', Icon: Loader     },
  COMPLETED: { label: 'Terminée',      color: '#10B981', Icon: CheckCircle},
  FAILED:    { label: 'Échouée',       color: '#EF4444', Icon: XCircle    },
}

const INPUT_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
}

function StatusBadge({ status }) {
  const info = STATUS_INFO[status] || STATUS_INFO.PENDING
  const { label, color, Icon } = info
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, padding: '3px 10px', borderRadius: 20,
      backgroundColor: `${color}18`, color, fontWeight: 600,
    }}>
      <Icon size={10} /> {label}
    </span>
  )
}

function ExperimentRow({ exp, onRefresh }) {
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #D6E8DC',
      borderRadius: 10, padding: '16px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: '#FEF3C7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FlaskConical size={16} color="#F59E0B" />
        </div>
        <div>
          <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: '#111827' }}>
            {exp.name || `Expérience #${exp.id}`}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
            Dataset #{exp.dataset_id} · Modèle #{exp.model_id}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <StatusBadge status={exp.status} />
        {exp.status === 'COMPLETED' && (
          <Link to={`/results/${exp.id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: '#00853F', textDecoration: 'none', fontWeight: 600,
          }}>
            <BarChart2 size={12} /> Voir résultats
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ExperimentsPage() {
  const { mainStyle } = useLayout()
  const [experiments, setExperiments] = useState([])
  const [datasets, setDatasets]       = useState([])
  const [models, setModels]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [open, setOpen]               = useState(false)
  const [form, setForm]               = useState({ name: '', dataset_id: '', model_id: '' })
  const [launching, setLaunching]     = useState(false)
  const [error, setError]             = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    fetchAll()
    return () => clearInterval(pollRef.current)
  }, [])

  const fetchAll = async () => {
    try {
      const [exps, ds, mdls] = await Promise.all([
        experimentService.getAll(),
        datasetService.getAll(),
        modelService.getAll(),
      ])
      setExperiments(exps)
      setDatasets(ds)
      setModels(mdls)
      startPolling(exps)
    } catch { } finally { setLoading(false) }
  }

  const startPolling = (exps) => {
    clearInterval(pollRef.current)
    const running = exps.filter(e => e.status === 'RUNNING' || e.status === 'PENDING')
    if (running.length === 0) return
    pollRef.current = setInterval(async () => {
      const updated = await experimentService.getAll()
      setExperiments(updated)
      const stillRunning = updated.filter(e => e.status === 'RUNNING' || e.status === 'PENDING')
      if (stillRunning.length === 0) clearInterval(pollRef.current)
    }, 3000)
  }

  const handleLaunch = async (e) => {
    e.preventDefault()
    setLaunching(true)
    setError('')
    try {
      const created = await experimentService.launch({
        name: form.name,
        dataset_id: parseInt(form.dataset_id),
        model_id: parseInt(form.model_id),
      })
      const updated = [created, ...experiments]
      setExperiments(updated)
      startPolling(updated)
      setOpen(false)
      setForm({ name: '', dataset_id: '', model_id: '' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors du lancement')
    } finally { setLaunching(false) }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />
      <main className="main-content" style={mainStyle}>
        <div style={{ padding: '32px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Expériences</h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Statut actualisé toutes les 3 secondes
              </p>
            </div>
            <button onClick={() => setOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: '#00853F', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Lancer une expérience
            </button>
          </div>

          {/* Bandeau CPU */}
          <div style={{
            backgroundColor: '#E6F4ED', border: '1px solid #DBEAFE',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Cpu size={16} color="#00853F" />
            <span style={{ fontSize: 13, color: '#1E40AF' }}>
              Ressource : CPU — Intel i7-1365U. L'entraînement tourne via Celery en tâche de fond.
            </span>
          </div>

          {/* Liste */}
          {loading ? (
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement…</p>
          ) : experiments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
              <FlaskConical size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                Aucune expérience — importez d'abord un dataset et un modèle.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {experiments.map(exp => (
                <ExperimentRow key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </div>
        <PageFooter />
      </main>

      {/* Modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 16,
            width: 'min(460px, 92vw)', padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Lancer une expérience</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <form onSubmit={handleLaunch}>
              {[
                {
                  label: 'Nom de l\'expérience',
                  field: (
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Expérience classification #1" required style={INPUT_STYLE} />
                  ),
                },
                {
                  label: 'Dataset',
                  field: (
                    <select value={form.dataset_id} onChange={e => set('dataset_id', e.target.value)}
                      required style={INPUT_STYLE}>
                      <option value="">— Sélectionner —</option>
                      {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ),
                },
                {
                  label: 'Modèle',
                  field: (
                    <select value={form.model_id} onChange={e => set('model_id', e.target.value)}
                      required style={INPUT_STYLE}>
                      <option value="">— Sélectionner —</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  ),
                },
              ].map(({ label, field }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    {label}
                  </label>
                  {field}
                </div>
              ))}

              {error && (
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', color: '#EF4444', fontSize: 12, marginBottom: 14 }}>
                  <AlertCircle size={13} />{error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setOpen(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: '1px solid #D1D5DB', background: '#fff',
                  fontSize: 13, cursor: 'pointer', color: '#374151',
                }}>Annuler</button>
                <button type="submit" disabled={launching} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px', borderRadius: 8,
                  backgroundColor: launching ? '#93C5FD' : '#00853F', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: launching ? 'not-allowed' : 'pointer',
                }}>
                  <Play size={14} />
                  {launching ? 'Lancement…' : 'Démarrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
