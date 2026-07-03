import useLayout from '../hooks/useLayout'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Brain, Trash2, Save, X, AlertCircle, Pencil, Search, Package } from 'lucide-react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import modelService from '../services/modelService'
import api from '../services/api'

const GREEN = '#00853F'

const MODEL_TYPES = [
  { value: 'sklearn',         label: 'Scikit-learn',    desc: 'RandomForest, SVM, GradientBoosting...', color: '#00853F' },
  { value: 'huggingface',     label: 'HuggingFace',     desc: 'BERT, GPT-2, DistilBERT - via cle API',  color: '#F59E0B' },
  { value: 'computer_vision', label: 'Computer Vision', desc: 'Classification images (ZIP par classe)',   color: '#10B981' },
  { value: 'audio',           label: 'Audio',            desc: 'Classification audio WAV/MP3 via MFCC',   color: '#3B82F6' },
  { value: 'video',           label: 'Video',            desc: 'Classification video MP4 via frames',      color: '#EC4899' },
  { value: 'tensorflow',      label: 'TensorFlow',       desc: 'Reseau Dense, export .h5',                 color: '#FF6F00' },
  { value: 'pytorch',         label: 'PyTorch',          desc: 'Reseau Dense, export .pt',                 color: '#EE4C2C' },
  { value: 'rag',             label: 'RAG',              desc: 'Retrieval Augmented Generation',           color: '#8B5CF6' },
]

const SKLEARN_ALGOS = ['random_forest','gradient_boosting','logistic_regression','svm','decision_tree']
const CV_TASKS = [
  { value: 'classification',        label: "Classification d'images"   },
  { value: 'object_detection',      label: "Detection d'objets"        },
  { value: 'segmentation',          label: 'Segmentation semantique'   },
  { value: 'instance_segmentation', label: "Segmentation d'instances"  },
]
const VERSIONS = ['v1 - initial', 'v2 - optimise', 'v3 - changement de parametre']

// ── Schéma hyperparamètres par algo/type ──────────────────────────────────────
const HP_SCHEMA = {
  sklearn_random_forest: [
    { key: 'n_estimators',    label: 'Nb estimateurs',    type: 'int',    default: 100,    min: 1,   max: 2000 },
    { key: 'max_depth',       label: 'Profondeur max',    type: 'int',    default: '',     min: 1,   placeholder: 'Illimitée' },
    { key: 'min_samples_split', label: 'Min samples split', type: 'int', default: 2,      min: 2 },
    { key: 'min_samples_leaf',  label: 'Min samples leaf',  type: 'int', default: 1,      min: 1 },
  ],
  sklearn_gradient_boosting: [
    { key: 'n_estimators',  label: 'Nb estimateurs',       type: 'int',   default: 100,  min: 1, max: 2000 },
    { key: 'learning_rate', label: 'Taux apprentissage',   type: 'float', default: 0.1,  min: 0.001, max: 1, step: 0.01 },
    { key: 'max_depth',     label: 'Profondeur max',       type: 'int',   default: 3,    min: 1, max: 20 },
  ],
  sklearn_logistic_regression: [
    { key: 'C',        label: 'C (régularisation)', type: 'float',  default: 1.0, min: 0.001, step: 0.1 },
    { key: 'max_iter', label: 'Itérations max',     type: 'int',    default: 100, min: 10 },
    { key: 'solver',   label: 'Solveur',            type: 'select', default: 'lbfgs', options: ['lbfgs','liblinear','saga','newton-cg'] },
  ],
  sklearn_svm: [
    { key: 'C',      label: 'C (régularisation)', type: 'float',  default: 1.0,   min: 0.001, step: 0.1 },
    { key: 'kernel', label: 'Noyau',              type: 'select', default: 'rbf', options: ['rbf','linear','poly','sigmoid'] },
    { key: 'gamma',  label: 'Gamma',              type: 'select', default: 'scale', options: ['scale','auto'] },
  ],
  sklearn_decision_tree: [
    { key: 'max_depth',        label: 'Profondeur max',   type: 'int',    default: '',    min: 1, placeholder: 'Illimitée' },
    { key: 'min_samples_split', label: 'Min samples split', type: 'int', default: 2,     min: 2 },
    { key: 'criterion',        label: 'Critère',          type: 'select', default: 'gini', options: ['gini','entropy'] },
  ],
  computer_vision: [
    { key: 'n_estimators', label: 'Nb estimateurs RF', type: 'int', default: 100, min: 1, max: 500 },
    { key: 'max_depth',    label: 'Profondeur max RF', type: 'int', default: '',  min: 1, placeholder: 'Illimitée' },
  ],
  audio: [
    { key: 'n_estimators', label: 'Nb estimateurs RF',     type: 'int', default: 100, min: 1, max: 500 },
    { key: 'n_mfcc',       label: 'Coefficients MFCC',     type: 'int', default: 40,  min: 10, max: 128 },
  ],
  video: [
    { key: 'n_estimators', label: 'Nb estimateurs RF',     type: 'int', default: 100, min: 1,   max: 500 },
    { key: 'frame_step',   label: 'Pas frames (1 frame/N)',type: 'int', default: 30,  min: 1,   max: 100 },
    { key: 'img_size',     label: 'Taille frame (px)',      type: 'int', default: 32,  min: 16,  max: 128 },
  ],
  huggingface: [
    { key: 'hf_api_key',   label: 'Clé API HuggingFace', type: 'text',  default: '', placeholder: 'hf_xxxxxxxxxxxxxxxx', wide: true },
    { key: 'max_samples',  label: 'Échantillons max',     type: 'int',   default: 50, min: 1, max: 1000 },
  ],
  tensorflow: [
    { key: 'epochs',        label: 'Epochs',               type: 'int',   default: 20,    min: 1,      max: 200 },
    { key: 'learning_rate', label: 'Taux apprentissage',   type: 'float', default: 0.001, min: 0.0001, max: 0.1, step: 0.0001 },
    { key: 'batch_size',    label: 'Batch size',           type: 'int',   default: 32,    min: 8,      max: 512 },
    { key: 'hidden_units',  label: 'Neurones couche cachée', type: 'int', default: 128,   min: 16,     max: 1024 },
    { key: 'dropout',       label: 'Dropout',              type: 'float', default: 0.2,   min: 0.0,    max: 0.8, step: 0.05 },
  ],
  pytorch: [
    { key: 'epochs',        label: 'Epochs',               type: 'int',   default: 20,    min: 1,      max: 200 },
    { key: 'learning_rate', label: 'Taux apprentissage',   type: 'float', default: 0.001, min: 0.0001, max: 0.1, step: 0.0001 },
    { key: 'batch_size',    label: 'Batch size',           type: 'int',   default: 32,    min: 8,      max: 512 },
    { key: 'hidden_units',  label: 'Neurones couche cachée', type: 'int', default: 128,   min: 16,     max: 1024 },
    { key: 'dropout',       label: 'Dropout',              type: 'float', default: 0.2,   min: 0.0,    max: 0.8, step: 0.05 },
  ],
  rag: [],
}

function getHpSchema(modelType, algorithm) {
  if (modelType === 'sklearn') return HP_SCHEMA[`sklearn_${algorithm}`] || []
  return HP_SCHEMA[modelType] || []
}

// ── Composant champs hyperparamètres ─────────────────────────────────────────
function HyperparamsFields({ modelType, algorithm, values, onChange }) {
  const schema = getHpSchema(modelType, algorithm)
  if (schema.length === 0) return (
    <p style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
      Aucun hyperparamètre configurable pour ce type.
    </p>
  )
  const handle = (key, raw, type) => {
    let val = raw
    if ((type === 'int' || type === 'float') && raw !== '') {
      val = type === 'int' ? parseInt(raw, 10) : parseFloat(raw)
      if (isNaN(val)) val = undefined
    }
    if (raw === '') val = undefined
    const next = { ...values }
    if (val === undefined) delete next[key]; else next[key] = val
    onChange(next)
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
      {schema.map(f => {
        const cur = values[f.key] !== undefined ? values[f.key] : f.default
        const span = f.wide ? { gridColumn: '1 / -1' } : {}
        return (
          <div key={f.key} style={span}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              {f.label}
              {f.placeholder && f.default === '' &&
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>({f.placeholder})</span>}
            </label>
            {f.type === 'select' ? (
              <select value={cur} onChange={e => handle(f.key, e.target.value, 'select')} style={INPUT}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={f.type === 'text' ? 'text' : 'number'}
                value={cur === undefined ? '' : cur}
                onChange={e => handle(f.key, e.target.value, f.type)}
                placeholder={f.placeholder ?? String(f.default ?? '')}
                min={f.min} max={f.max} step={f.step ?? (f.type === 'float' ? 0.01 : 1)}
                style={INPUT}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const EMPTY_FORM = {
  name: '', description: '', model_type: 'sklearn',
  algorithm: 'random_forest', hf_model_id: '', cv_task: 'classification',
  version: 'v1 - initial', hyperparameters: {},
}

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
}

function Badge({ type }) {
  const t = MODEL_TYPES.find(m => m.value === type) || MODEL_TYPES[0]
  return (
    <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20,
      backgroundColor: `${t.color}18`, color: t.color, fontWeight: 600 }}>
      {t.label}
    </span>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function ModelCard({ model, onDelete, onEdit }) {
  const [downloading, setDownloading] = React.useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { data } = await api.get(`/models/${model.id}/download-model`)
      window.open(data.download_url, '_blank')
    } catch {
      alert('Aucun modèle .pkl disponible — lancez une expérience avec ce modèle d\'abord.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #D6E8DC',
      borderRadius: 12, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#E6F4ED',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Brain size={16} color={GREEN} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111827' }}>{model.name}</p>
            <Badge type={model.model_type} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={handleDownload} disabled={downloading} title="Télécharger le modèle .pkl"
            style={{ background: 'none', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
              color: GREEN, padding: 4, borderRadius: 6, transition: 'background 0.15s',
              opacity: downloading ? 0.5 : 1 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E6F4ED'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Package size={14} />
          </button>
          <button onClick={() => onEdit(model)} title="Modifier"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4,
              borderRadius: 6, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(model.id)} title="Supprimer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4,
              borderRadius: 6, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {model.description && (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6B7280' }}>{model.description}</p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {model.algorithm && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: '#F3F4F6', color: '#374151' }}>
            {model.algorithm}
          </span>
        )}
        {model.version && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: '#F0FDF4', color: '#059669' }}>
            {model.version}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ModelsPage() {
  const { mainStyle } = useLayout()
  const [models,  setModels]  = useState([])
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState(null)   // model en cours d'edition
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [searchParams] = useSearchParams()
  const [filter,  setFilter]  = useState(() => searchParams.get('type') || 'all')
  const [search,  setSearch]  = useState('')

  useEffect(() => { fetchModels() }, [])

  // Sync filtre si on arrive via ?type=xxx
  useEffect(() => {
    const t = searchParams.get('type')
    if (t) setFilter(t)
  }, [searchParams])

  const fetchModels = async () => {
    try { setModels(await modelService.getAll()) }
    catch {} finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setOpen(true)
  }

  const openEdit = (model) => {
    setEditing(model)
    setForm({
      name:            model.name || '',
      description:     model.description || '',
      model_type:      model.model_type || 'sklearn',
      algorithm:       model.algorithm || 'random_forest',
      hf_model_id:     model.hf_model_id || '',
      cv_task:         model.cv_task || 'classification',
      version:         model.version || 'v1 - initial',
      hyperparameters: model.hyperparameters || {},
    })
    setError('')
    setOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name:            form.name,
        description:     form.description,
        model_type:      form.model_type,
        algorithm:       form.model_type === 'sklearn'         ? form.algorithm   : undefined,
        hf_model_id:     form.model_type === 'huggingface'     ? form.hf_model_id : undefined,
        cv_task:         form.model_type === 'computer_vision' ? form.cv_task     : undefined,
        version:         form.version,
        hyperparameters: form.hyperparameters,
      }
      if (editing) {
        const updated = await modelService.update(editing.id, payload)
        setModels(prev => prev.map(m => m.id === editing.id ? updated : m))
      } else {
        const created = await modelService.create(payload)
        setModels(prev => [created, ...prev])
      }
      setOpen(false)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce modele ?')) return
    await modelService.delete(id)
    setModels(prev => prev.filter(m => m.id !== id))
  }

  const set = (key, val) => setForm(f => {
    // Reset hyperparams si on change d'algo ou de type pour eviter les conflits
    const reset = (key === 'algorithm' || key === 'model_type') ? { hyperparameters: {} } : {}
    return { ...f, [key]: val, ...reset }
  })

  // Filtrage
  const visible = models.filter(m => {
    const matchType   = filter === 'all' || m.model_type === filter
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
                        (m.description || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const FILTER_CARDS = [
    { value: 'all', label: 'Tous', desc: `${models.length} modele${models.length !== 1 ? 's' : ''}`, color: '#374151' },
    ...MODEL_TYPES,
  ]

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />
      <main className="main-content" style={mainStyle}>
        <div style={{ padding: '32px', flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Modeles</h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Sklearn · TensorFlow · PyTorch · Computer Vision · Audio · Video · HuggingFace · RAG
              </p>
            </div>
            <button onClick={openCreate} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: GREEN, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Nouveau modele
            </button>
          </div>

          {/* Filtres (cartes cliquables) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10, marginBottom: 20 }}>
            {FILTER_CARDS.map(({ value, label, desc, color }) => {
              const active = filter === value
              return (
                <button key={value} onClick={() => setFilter(value)} style={{
                  backgroundColor: active ? `${color}12` : '#fff',
                  border: `2px solid ${active ? color : '#D6E8DC'}`,
                  borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? color : '#374151', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{desc}</div>
                </button>
              )
            })}
          </div>

          {/* Barre de recherche */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un modele..."
              style={{ ...INPUT, paddingLeft: 34 }}
            />
          </div>

          {/* Liste */}
          {loading ? (
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement...</p>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
              <Brain size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                {models.length === 0 ? 'Aucun modele - cliquez sur Nouveau modele' : 'Aucun modele pour ce filtre'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {visible.map(m => <ModelCard key={m.id} model={m} onDelete={handleDelete} onEdit={openEdit} />)}
            </div>
          )}
        </div>
        <PageFooter />
      </main>

      {/* Modal creation / edition */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16,
            width: 'min(520px, 92vw)', maxHeight: '90vh', overflowY: 'auto',
            padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                {editing ? 'Modifier le modele' : 'Nouveau modele'}
              </h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <FormField label="Nom">
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Mon modele" required style={INPUT} />
              </FormField>
              <FormField label="Description (optionnelle)">
                <input value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Courte description" style={INPUT} />
              </FormField>
              <FormField label="Type">
                <select value={form.model_type} onChange={e => set('model_type', e.target.value)} style={INPUT}>
                  {MODEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>
              {form.model_type === 'sklearn' && (
                <FormField label="Algorithme">
                  <select value={form.algorithm} onChange={e => set('algorithm', e.target.value)} style={INPUT}>
                    {SKLEARN_ALGOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </FormField>
              )}
              {form.model_type === 'huggingface' && (
                <FormField label="Identifiant HuggingFace (ex: bert-base-uncased)">
                  <input value={form.hf_model_id} onChange={e => set('hf_model_id', e.target.value)}
                    placeholder="bert-base-uncased" style={INPUT} />
                </FormField>
              )}
              {form.model_type === 'computer_vision' && (
                <FormField label="Tache CV">
                  <select value={form.cv_task} onChange={e => set('cv_task', e.target.value)} style={INPUT}>
                    {CV_TASKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </FormField>
              )}
              {(form.model_type === 'tensorflow' || form.model_type === 'pytorch') && (
                <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#FFF7ED', borderRadius: 8, border: '1px solid #FED7AA', fontSize: 12, color: '#9A3412' }}>
                  Dataset attendu : CSV tabulaire (meme format que Scikit-learn).<br/>
                  {form.model_type === 'tensorflow' ? 'Export : modele .h5 (Keras/TF)' : 'Export : modele .pt (PyTorch state_dict)'}
                </div>
              )}
              {form.model_type === 'audio' && (
                <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE', fontSize: 12, color: '#1E40AF' }}>
                  Dataset attendu : ZIP avec un sous-dossier par classe contenant des fichiers WAV, MP3 ou FLAC.<br/>
                  Exemple : <code>dataset.zip/chien/aboiement1.wav</code>
                </div>
              )}
              {form.model_type === 'video' && (
                <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#FDF2F8', borderRadius: 8, border: '1px solid #F9A8D4', fontSize: 12, color: '#9D174D' }}>
                  Dataset attendu : ZIP avec un sous-dossier par classe contenant des fichiers MP4, AVI ou MOV.<br/>
                  Exemple : <code>dataset.zip/course/video1.mp4</code>
                </div>
              )}
              <FormField label="Version">
                <select value={form.version} onChange={e => set('version', e.target.value)} style={INPUT}>
                  {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormField>
              <FormField label="Hyperparamètres">
                <HyperparamsFields
                  modelType={form.model_type}
                  algorithm={form.algorithm}
                  values={form.hyperparameters}
                  onChange={val => set('hyperparameters', val)}
                />
              </FormField>

              {error && (
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', color: '#EF4444', fontSize: 12, marginBottom: 14 }}>
                  <AlertCircle size={13} />{error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setOpen(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: '1px solid #D1D5DB', background: '#fff',
                  fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px', borderRadius: 8,
                  backgroundColor: saving ? '#9CA3AF' : GREEN, color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  <Save size={14} />
                  {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Creer le modele'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
