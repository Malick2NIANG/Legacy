/**
 * Page de gestion des experiences ML.
 * Lance des experiences avec polling du statut en temps reel.
 */
import useLayout from '../hooks/useLayout'
import React, { useState, useEffect, useRef } from 'react'
import {
  FlaskConical, Play, Plus, X, AlertCircle,
  CheckCircle, Clock, XCircle, Loader, BarChart2, Trash2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import datasetService    from '../services/datasetService'
import modelService      from '../services/modelService'
import experimentService from '../services/experimentService'
import { useToast }      from '../context/ToastContext'

const GREEN = '#00853F'

const STATUS_INFO = {
  pending:   { label: 'En attente', color: '#9CA3AF', Icon: Clock       },
  running:   { label: 'En cours',   color: '#F59E0B', Icon: Loader      },
  completed: { label: 'Terminee',   color: '#10B981', Icon: CheckCircle },
  failed:    { label: 'Echouee',    color: '#EF4444', Icon: XCircle     },
}

// Mapping étape Celery → pourcentage
const STEP_PCT = {
  'Chargement des donnees':               15,
  'Entrainement du modele':               45,
  "Calcul de la courbe d'apprentissage":  72,
  'Export du modele':                     88,
  'Sauvegarde des resultats':             96,
}

const INPUT_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
}

function StatusBadge({ status }) {
  const info = STATUS_INFO[status] || STATUS_INFO.pending
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

function ProgressBar({ pct }) {
  return (
    <div style={{ width: '100%', height: 5, backgroundColor: '#FEF3C7', borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        height: '100%', borderRadius: 99,
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

function ExperimentRow({ exp, step, onDelete }) {
  const created = exp.created_at ? new Date(exp.created_at).toLocaleDateString('fr-FR') : ''
  const isRunning = exp.status === 'running'
  const pct = isRunning ? (step ? (STEP_PCT[step] ?? 30) : 10) : (exp.status === 'completed' ? 100 : 0)

  return (
    <div style={{
      backgroundColor: '#fff', border: `1px solid ${isRunning ? '#FDE68A' : '#D6E8DC'}`,
      borderRadius: 10, padding: '16px 20px',
      boxShadow: isRunning ? '0 0 0 2px #FEF3C720' : 'none',
      transition: 'border-color 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            backgroundColor: isRunning ? '#FEF3C7' : '#F4F7F5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FlaskConical size={16} color={isRunning ? '#F59E0B' : '#9CA3AF'} />
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 14, color: '#111827' }}>
              {exp.name || `Experience #${exp.id}`}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
              {exp.dataset_name || `Dataset #${exp.dataset_id}`} &middot; {exp.model_name || `Modele #${exp.model_id}`} &middot; {created}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={exp.status} />
          {exp.status === 'completed' && (
            <Link to={`/results/${exp.id}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: GREEN, textDecoration: 'none', fontWeight: 600,
            }}>
              <BarChart2 size={12} /> Voir resultats
            </Link>
          )}
          <button
            onClick={() => onDelete(exp.id)}
            title="Supprimer"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#D1D5DB', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Barre de progression — visible uniquement pendant running */}
      {isRunning && (
        <div style={{ marginTop: 10 }}>
          <ProgressBar pct={pct} />
          <p style={{ margin: '5px 0 0', fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
            {step || 'Initialisation…'} · {pct}%
          </p>
        </div>
      )}
    </div>
  )
}

export default function ExperimentsPage() {
  const { mainStyle } = useLayout()
  const toast = useToast()
  const [experiments, setExperiments] = useState([])
  const [datasets, setDatasets]       = useState([])
  const [models, setModels]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [open, setOpen]               = useState(false)
  const [form, setForm]               = useState({ name: '', dataset_id: '', model_id: '' })
  const [launching, setLaunching]     = useState(false)
  const [error, setError]             = useState('')
  const [steps, setSteps]             = useState({})   // { [expId]: step string }
  const pollRef    = useRef(null)
  const prevStatus = useRef({})

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
    // Mémoriser les statuts courants pour détecter les changements
    exps.forEach(e => { prevStatus.current[e.id] = e.status })
    const running = exps.filter(e => e.status === 'running' || e.status === 'pending')
    if (running.length === 0) return
    pollRef.current = setInterval(async () => {
      const updated = await experimentService.getAll()
      // Notifier les changements de statut
      updated.forEach(e => {
        const prev = prevStatus.current[e.id]
        if (prev && prev !== e.status) {
          if (e.status === 'completed') toast.success(`Experience "${e.name}" terminee !`)
          if (e.status === 'failed')    toast.error(`Experience "${e.name}" a echoue.`)
          prevStatus.current[e.id] = e.status
        }
      })
      setExperiments(updated)

      // Récupérer l'étape Celery pour chaque expérience en cours
      const running = updated.filter(e => e.status === 'running')
      if (running.length > 0) {
        const statusResults = await Promise.allSettled(
          running.map(e => experimentService.getStatus(e.id))
        )
        const newSteps = {}
        statusResults.forEach((res, i) => {
          if (res.status === 'fulfilled' && res.value.step) {
            newSteps[running[i].id] = res.value.step
          }
        })
        setSteps(prev => ({ ...prev, ...newSteps }))
      }

      const stillRunning = updated.filter(e => e.status === 'running' || e.status === 'pending')
      if (stillRunning.length === 0) {
        clearInterval(pollRef.current)
        setSteps({})
      }
    }, 3000)
  }

  const handleLaunch = async (e) => {
    e.preventDefault()
    setLaunching(true)
    setError('')
    try {
      const created = await experimentService.launch({
        name:       form.name,
        dataset_id: parseInt(form.dataset_id),
        model_id:   parseInt(form.model_id),
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

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette experience et ses resultats ?')) return
    try {
      await experimentService.delete(id)
      setExperiments(prev => prev.filter(e => e.id !== id))
    } catch { alert('Erreur lors de la suppression.') }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />
      <main className="main-content" style={mainStyle}>
        <div style={{ padding: '32px', flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Experiences</h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Statut actualise toutes les 3 secondes pour les experiences en cours
              </p>
            </div>
            <button onClick={() => setOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: GREEN, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Lancer une experience
            </button>
          </div>

          {/* Liste */}
          {loading ? (
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement...</p>
          ) : experiments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
              <FlaskConical size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                Aucune experience - importez d'abord un dataset et un modele.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {experiments.map(exp => (
                <ExperimentRow key={exp.id} exp={exp} step={steps[exp.id]} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
        <PageFooter />
      </main>

      {/* Modal lancement */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 16,
            width: 'min(460px, 92vw)', padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Lancer une experience</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <form onSubmit={handleLaunch}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Nom de l'experience
                </label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Classification recrutement #1" required style={INPUT_STYLE} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Dataset
                </label>
                <select value={form.dataset_id} onChange={e => set('dataset_id', e.target.value)}
                  required style={INPUT_STYLE}>
                  <option value="">-- Selectionner --</option>
                  {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Modele
                </label>
                <select value={form.model_id} onChange={e => set('model_id', e.target.value)}
                  required style={INPUT_STYLE}>
                  <option value="">-- Selectionner --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.algorithm || m.model_type})</option>
                  ))}
                </select>
              </div>

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
                  backgroundColor: launching ? '#9CA3AF' : GREEN, color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: launching ? 'not-allowed' : 'pointer',
                }}>
                  <Play size={14} />
                  {launching ? 'Lancement...' : 'Demarrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
