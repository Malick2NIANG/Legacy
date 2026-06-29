/**
 * Page de gestion des modèles ML.
 * Types : sklearn | huggingface | computer_vision | rag
 * Fonctionne en CPU (pas de GPU requis).
 */
import useLayout from '../hooks/useLayout'
import React, { useState, useEffect } from 'react'
import { Plus, Brain, Trash2, Save, X, AlertCircle, Cpu } from 'lucide-react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import modelService from '../services/modelService'

const MODEL_TYPES = [
  { value: 'sklearn',         label: 'Scikit-learn',     desc: 'RandomForest, SVM, GradientBoosting…',   color: '#00853F' },
  { value: 'huggingface',     label: 'HuggingFace',      desc: 'BERT, GPT-2, DistilBERT — via clé API', color: '#F59E0B' },
  { value: 'computer_vision', label: 'Computer Vision',  desc: 'Classification, détection, segmentation',color: '#10B981' },
  { value: 'rag',             label: 'RAG',               desc: 'Retrieval Augmented Generation',         color: '#8B5CF6' },
]

const SKLEARN_ALGOS = [
  'random_forest', 'gradient_boosting', 'logistic_regression', 'svm', 'decision_tree',
]

const CV_TASKS = [
  { value: 'classification',        label: 'Classification d\'images'  },
  { value: 'object_detection',      label: 'Détection d\'objets'       },
  { value: 'segmentation',          label: 'Segmentation sémantique'   },
  { value: 'instance_segmentation', label: 'Segmentation d\'instances' },
]

const VERSIONS = ['v1 — initial', 'v2 — optimisé', 'v3 — changement de paramètre']

const EMPTY_FORM = {
  name: '', description: '',
  model_type: 'sklearn',
  algorithm: 'random_forest',
  hf_model_id: '',
  cv_task: 'classification',
  version: 'v1 — initial',
  hyperparameters: '{}',
}

const INPUT_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
}

function Badge({ type }) {
  const t = MODEL_TYPES.find(m => m.value === type) || MODEL_TYPES[0]
  return (
    <span style={{
      fontSize: 11, padding: '2px 10px', borderRadius: 20,
      backgroundColor: `${t.color}18`, color: t.color, fontWeight: 600,
    }}>
      {t.label}
    </span>
  )
}

function ModelCard({ model, onDelete }) {
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #D6E8DC',
      borderRadius: 12, padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            backgroundColor: '#E6F4ED',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Brain size={16} color="#00853F" />
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: '#111827' }}>{model.name}</p>
            <Badge type={model.model_type} />
          </div>
        </div>
        <button onClick={() => onDelete(model.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4,
        }}>
          <Trash2 size={14} />
        </button>
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

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ModelsPage() {
  const { mainStyle } = useLayout()
  const [models, setModels]   = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => { fetchModels() }, [])

  const fetchModels = async () => {
    try {
      const data = await modelService.getAll()
      setModels(data)
    } catch { } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let hp = {}
      try { hp = JSON.parse(form.hyperparameters) } catch { }
      const payload = {
        name: form.name, description: form.description,
        model_type: form.model_type,
        algorithm: form.model_type === 'sklearn' ? form.algorithm : undefined,
        hf_model_id: form.model_type === 'huggingface' ? form.hf_model_id : undefined,
        cv_task: form.model_type === 'computer_vision' ? form.cv_task : undefined,
        version: form.version,
        hyperparameters: hp,
      }
      const created = await modelService.create(payload)
      setModels(prev => [created, ...prev])
      setOpen(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la création')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce modèle ?')) return
    await modelService.delete(id)
    setModels(prev => prev.filter(m => m.id !== id))
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
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Modèles</h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Sklearn, HuggingFace, Computer Vision, RAG — exécution CPU
              </p>
            </div>
            <button onClick={() => setOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 8,
              backgroundColor: '#00853F', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Nouveau modèle
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
              Exécution CPU — Intel i7-1365U (32 Go RAM). Sklearn et HuggingFace ne nécessitent pas de GPU.
            </span>
          </div>

          {/* Types */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
            {MODEL_TYPES.map(({ value, label, desc, color }) => (
              <div key={value} style={{
                backgroundColor: '#fff', border: '1px solid #D6E8DC',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Liste */}
          {loading ? (
            <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement…</p>
          ) : models.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: '#9CA3AF' }}>
              <Brain size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Aucun modèle — cliquez sur « Nouveau modèle »</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {models.map(m => <ModelCard key={m.id} model={m} onDelete={handleDelete} />)}
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
            width: 'min(520px, 92vw)', maxHeight: '90vh', overflowY: 'auto',
            padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouveau modèle</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#9CA3AF" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <FormField label="Nom">
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Mon modèle" required style={INPUT_STYLE} />
              </FormField>

              <FormField label="Description (optionnelle)">
                <input value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Courte description" style={INPUT_STYLE} />
              </FormField>

              <FormField label="Type">
                <select value={form.model_type} onChange={e => set('model_type', e.target.value)} style={INPUT_STYLE}>
                  {MODEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>

              {form.model_type === 'sklearn' && (
                <FormField label="Algorithme">
                  <select value={form.algorithm} onChange={e => set('algorithm', e.target.value)} style={INPUT_STYLE}>
                    {SKLEARN_ALGOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </FormField>
              )}

              {form.model_type === 'huggingface' && (
                <FormField label="Identifiant HuggingFace (ex: bert-base-uncased)">
                  <input value={form.hf_model_id} onChange={e => set('hf_model_id', e.target.value)}
                    placeholder="bert-base-uncased" style={INPUT_STYLE} />
                </FormField>
              )}

              {form.model_type === 'computer_vision' && (
                <FormField label="Tâche CV">
                  <select value={form.cv_task} onChange={e => set('cv_task', e.target.value)} style={INPUT_STYLE}>
                    {CV_TASKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </FormField>
              )}

              <FormField label="Version">
                <select value={form.version} onChange={e => set('version', e.target.value)} style={INPUT_STYLE}>
                  {VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormField>

              <FormField label="Hyperparamètres (JSON)">
                <textarea value={form.hyperparameters} onChange={e => set('hyperparameters', e.target.value)}
                  rows={3} placeholder='{"n_estimators": 100}'
                  style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
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
                  fontSize: 13, cursor: 'pointer', color: '#374151',
                }}>Annuler</button>
                <button type="submit" disabled={saving} style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px', borderRadius: 8,
                  backgroundColor: saving ? '#93C5FD' : '#00853F', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  <Save size={14} />
                  {saving ? 'Création…' : 'Créer le modèle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
