/**
 * Page de gestion des experiences ML.
 * Grille de cartes, recherche, pagination et modal de confirmation.
 */
import useLayout from '../hooks/useLayout'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  FlaskConical, Play, Plus, X, AlertCircle,
  CheckCircle, Clock, XCircle, Loader, BarChart2, Trash2, Pencil,
  ChevronLeft, ChevronRight, Search, Download
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import datasetService    from '../services/datasetService'
import modelService      from '../services/modelService'
import experimentService from '../services/experimentService'
import { useToast }      from '../context/ToastContext'

const GREEN        = '#00853F'
const PAGE_OPTIONS = [4, 8, 16, 32]

const STATUS_INFO = {
  pending:   { label: 'En attente', color: '#9CA3AF', Icon: Clock       },
  running:   { label: 'En cours',   color: '#F59E0B', Icon: Loader      },
  completed: { label: 'Terminee',   color: '#10B981', Icon: CheckCircle },
  failed:    { label: 'Echouee',    color: '#EF4444', Icon: XCircle     },
}

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

/* ── Modal confirmation suppression ───────────────────────────────────────── */
function ConfirmDeleteModal({ exp, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 950,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 14, width: 'min(420px, 92vw)',
        padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={18} color="#EF4444" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>Supprimer cette expérience ?</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', marginTop: 2 }}>Cette action est irréversible.</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: '10px 14px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{exp.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
            {exp.dataset_name || `Dataset #${exp.dataset_id}`} · {exp.model_name || `Modèle #${exp.model_id}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E5E7EB',
            backgroundColor: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            backgroundColor: '#EF4444', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
          }}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

/* ── Badge statut ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const { label, color, Icon } = STATUS_INFO[status] || STATUS_INFO.pending
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

/* ── Barre de progression ─────────────────────────────────────────────────── */
function ProgressBar({ pct }) {
  return (
    <div style={{ width: '100%', height: 4, backgroundColor: '#FEF3C7', borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        height: '100%', borderRadius: 99, width: `${pct}%`,
        background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

/* ── Carte expérience ─────────────────────────────────────────────────────── */
function ExperimentCard({ exp, step, onDelete, onRetry, onEdit }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const toast = useToast()

  const created  = exp.created_at ? new Date(exp.created_at).toLocaleDateString('fr-FR') : ''
  const isRunning = exp.status === 'running'
  const isFailed  = exp.status === 'failed'
  const pct = isRunning ? (step ? (STEP_PCT[step] ?? 30) : 10) : (exp.status === 'completed' ? 100 : 0)

  const iconBg    = isRunning ? '#FEF3C7' : isFailed ? '#FEF2F2' : '#F4F7F5'
  const iconColor = isRunning ? '#F59E0B' : isFailed ? '#EF4444' : '#9CA3AF'
  const borderColor = isRunning ? '#FDE68A' : isFailed ? '#FECACA' : '#E5E7EB'

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const stored = localStorage.getItem('ds-platform-auth')
      const token  = stored ? JSON.parse(stored).state?.token : null
      const base   = import.meta.env.VITE_API_URL || '/api/v1'
      const res    = await fetch(`${base}/results/${exp.id}/download-model`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Fichier modèle non disponible')
        return
      }
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const filename = res.headers.get('Content-Disposition')
        ?.match(/filename="?([^"]+)"?/)?.[1] || `model_exp${exp.id}`
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally { setDownloading(false) }
  }

  const handleConfirmDelete = async () => {
    try {
      await onDelete(exp.id)
      toast.success(`"${exp.name}" supprimée`)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setShowConfirm(false)
    }
  }

  return (
    <>
      {showConfirm && <ConfirmDeleteModal exp={exp} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirm(false)} />}
      <div style={{
        backgroundColor: '#fff', border: `1px solid ${borderColor}`,
        borderRadius: 12, padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FlaskConical size={18} color={iconColor} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {exp.name}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
              {exp.dataset_name || `Dataset #${exp.dataset_id}`} · {exp.model_name || `Modèle #${exp.model_id}`} · {created}
            </p>
          </div>
          <StatusBadge status={exp.status} />
        </div>

        {/* Barre de progression */}
        {isRunning && (
          <div>
            <ProgressBar pct={pct} />
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
              {step || 'Initialisation…'} · {pct}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          {exp.status === 'completed' && (
            <Link to={`/results/${exp.id}`} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 0', borderRadius: 6,
              border: `1px solid ${GREEN}40`, backgroundColor: '#F0FDF4',
              fontSize: 12, color: GREEN, textDecoration: 'none', fontWeight: 600,
            }}>
              <BarChart2 size={12} /> Résultats
            </Link>
          )}
          {exp.status === 'completed' && (
            <button onClick={handleDownload} disabled={downloading} title="Télécharger le fichier modèle" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 0', borderRadius: 6,
              border: '1px solid #BFDBFE', backgroundColor: downloading ? '#F1F5F9' : '#EFF6FF',
              fontSize: 12, color: '#3B82F6', cursor: downloading ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}>
              <Download size={12} /> {downloading ? '…' : 'Modèle'}
            </button>
          )}
          {isFailed && (
            <button onClick={() => onRetry(exp)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 0', borderRadius: 6,
              border: '1px solid #FECACA', backgroundColor: '#FEF2F2',
              fontSize: 12, color: '#EF4444', cursor: 'pointer', fontWeight: 600,
            }}>
              <Play size={12} /> Réessayer
            </button>
          )}
          {!isRunning && (
            <button onClick={() => onEdit(exp)} title="Modifier et relancer" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 0', borderRadius: 6,
              border: '1px solid #E5E7EB', backgroundColor: 'transparent',
              fontSize: 12, color: '#6B7280', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4361EE'; e.currentTarget.style.color = '#4361EE' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}
            >
              <Pencil size={12} /> Modifier
            </button>
          )}
          <button onClick={() => setShowConfirm(true)} title="Supprimer" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 0', borderRadius: 6,
            border: '1px solid #FECACA', backgroundColor: 'transparent',
            fontSize: 12, color: '#EF4444', cursor: 'pointer',
          }}>
            <Trash2 size={12} /> Supprimer
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Page principale ──────────────────────────────────────────────────────── */
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
  const [steps, setSteps]             = useState({})
  const [search,  setSearch]          = useState('')
  const [page,    setPage]            = useState(1)
  const [perPage, setPerPage]         = useState(8)
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
    exps.forEach(e => { prevStatus.current[e.id] = e.status })
    const running = exps.filter(e => e.status === 'running' || e.status === 'pending')
    if (running.length === 0) return
    pollRef.current = setInterval(async () => {
      const updated = await experimentService.getAll()
      updated.forEach(e => {
        const prev = prevStatus.current[e.id]
        if (prev && prev !== e.status) {
          if (e.status === 'completed') toast.success(`Experience "${e.name}" terminee !`)
          if (e.status === 'failed')    toast.error(`Experience "${e.name}" a echoue.`)
          prevStatus.current[e.id] = e.status
        }
      })
      setExperiments(updated)
      const running = updated.filter(e => e.status === 'running')
      if (running.length > 0) {
        const statusResults = await Promise.allSettled(running.map(e => experimentService.getStatus(e.id)))
        const newSteps = {}
        statusResults.forEach((res, i) => {
          if (res.status === 'fulfilled' && res.value.step) newSteps[running[i].id] = res.value.step
        })
        setSteps(prev => ({ ...prev, ...newSteps }))
      }
      const stillRunning = updated.filter(e => e.status === 'running' || e.status === 'pending')
      if (stillRunning.length === 0) { clearInterval(pollRef.current); setSteps({}) }
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
    await experimentService.delete(id)
    setExperiments(prev => prev.filter(e => e.id !== id))
  }

  const handleEdit = (exp) => {
    setForm({
      name:       `${exp.name}_v2`,
      dataset_id: String(exp.dataset_id),
      model_id:   String(exp.model_id),
    })
    setOpen(true)
  }

  const handleRetry = async (exp) => {
    try {
      const updated_exp = await experimentService.retry(exp.id)
      const updated = experiments.map(e => e.id === exp.id ? updated_exp : e)
      setExperiments(updated)
      startPolling(updated)
      toast.info(`Relance de "${exp.name}"…`)
    } catch {
      toast.error('Erreur lors du relancement')
    }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Filtrage + pagination
  const filtered = useMemo(() => {
    if (!search) return experiments
    const q = search.toLowerCase()
    return experiments.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.dataset_name?.toLowerCase().includes(q) ||
      e.model_name?.toLowerCase().includes(q)
    )
  }, [experiments, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * perPage, safePage * perPage)

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

          {/* Contenu */}
          {loading ? (
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement...</p>
          ) : experiments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
              <FlaskConical size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Aucune experience — importez d'abord un dataset et un modele.</p>
            </div>
          ) : (
            <>
              {/* Recherche */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Rechercher une experience..."
                  style={{ ...INPUT_STYLE, paddingLeft: 34 }}
                />
              </div>

              {/* Infos + perPage */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  {filtered.length} expérience{filtered.length !== 1 ? 's' : ''}
                  {search ? ` · recherche "${search}"` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Afficher</span>
                  <select
                    value={perPage}
                    onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, color: '#374151', cursor: 'pointer', outline: 'none' }}
                  >
                    {PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                </div>
              </div>

              {/* Grille cartes */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#F9FAFB', borderRadius: 12, border: '2px dashed #E5E7EB' }}>
                  <FlaskConical size={36} color="#D1D5DB" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>Aucune expérience ne correspond à ce filtre.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {paginated.map(exp => (
                    <ExperimentCard
                      key={exp.id} exp={exp} step={steps[exp.id]}
                      onDelete={handleDelete} onRetry={handleRetry} onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: safePage === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === 1 ? 0.4 : 1 }}>
                    <ChevronLeft size={15} color="#374151" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      style={{ width: 32, height: 32, borderRadius: 6, fontSize: 13, fontWeight: 600, border: `1px solid ${n === safePage ? GREEN : '#E5E7EB'}`, backgroundColor: n === safePage ? GREEN : '#fff', color: n === safePage ? '#fff' : '#374151', cursor: 'pointer' }}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: safePage === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safePage === totalPages ? 0.4 : 1 }}>
                    <ChevronRight size={15} color="#374151" />
                  </button>
                </div>
              )}
            </>
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
