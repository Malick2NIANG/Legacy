/**
 * Carte dataset avec apercu colonnes.
 */
import React, { useState, useCallback } from 'react'
import { Database, Trash2, Download, HardDrive, Calendar, Eye, X, Table2, Archive, ImageIcon, Music, Video } from 'lucide-react'
import datasetService from '../../services/datasetService'
import { useToast } from '../../context/ToastContext'

/* ── Modal confirmation suppression ───────────────────────────────────────── */
function ConfirmDeleteModal({ dataset, onConfirm, onCancel }) {
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
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>Supprimer ce dataset ?</p>
            <p style={{ margin: 0, fontSize: 12, color: '#6B7280', marginTop: 2 }}>Cette action est irréversible.</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: '10px 14px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{dataset.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{dataset.filename}</p>
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

const ZIP_TYPES = {
  computer_vision: { icon: ImageIcon,  label: 'Images',  color: '#2563EB', bg: '#EFF6FF', desc: 'Dossiers par classe · JPG / PNG' },
  audio:           { icon: Music,       label: 'Audio',   color: '#7C3AED', bg: '#F5F3FF', desc: 'Dossiers par classe · WAV / MP3' },
  video:           { icon: Video,       label: 'Vidéo',   color: '#0891B2', bg: '#ECFEFF', desc: 'Dossiers par classe · MP4' },
  default:         { icon: Archive,     label: 'Archive', color: '#6B7280', bg: '#F9FAFB', desc: 'ZIP — contenu non prévisualisable' },
}

function detectZipType(filename) {
  const n = filename?.toLowerCase() || ''
  if (n.includes('vision') || n.includes('image') || n.includes('img')) return 'computer_vision'
  if (n.includes('audio') || n.includes('son') || n.includes('wav'))    return 'audio'
  if (n.includes('video') || n.includes('clip') || n.includes('mp4'))   return 'video'
  return 'default'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function PreviewModal({ dataset, onClose }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const isZip = dataset.filename?.toLowerCase().endsWith('.zip')

  React.useEffect(() => {
    if (isZip) { setLoading(false); return }
    datasetService.preview(dataset.id, 5)
      .then(setPreview)
      .catch(() => setError('Impossible de charger l\'apercu.'))
      .finally(() => setLoading(false))
  }, [dataset.id, isZip])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 14,
        width: 'min(860px, 95vw)', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Table2 size={18} color='#4361EE' />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>{dataset.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{dataset.filename} · {formatSize(dataset.file_size)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading && <p style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement de l'apercu...</p>}
          {error   && <p style={{ color: '#EF4444', fontSize: 13 }}>{error}</p>}

          {/* Aperçu ZIP : message informatif au lieu d'une erreur */}
          {isZip && !loading && (() => {
            const t = ZIP_TYPES[detectZipType(dataset.filename)] || ZIP_TYPES.default
            const Icon = t.icon
            return (
              <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon size={28} color={t.color} />
                </div>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 15, color: '#111827' }}>Archive {t.label}</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>{t.desc}</p>
                <div style={{ display: 'inline-flex', gap: 10, padding: '12px 20px', backgroundColor: t.bg, borderRadius: 10, border: `1px solid ${t.color}20` }}>
                  <span style={{ fontSize: 12, color: t.color, fontWeight: 600 }}>💡 Téléchargez le fichier pour inspecter son contenu</span>
                </div>
              </div>
            )
          })()}
          {preview && (
            <>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Lignes',   value: preview.row_count.toLocaleString() },
                  { label: 'Colonnes', value: preview.col_count },
                ].map(({ label, value }) => (
                  <div key={label} style={{ backgroundColor: '#F4F7F5', borderRadius: 10, padding: '12px 20px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#00853F' }}>{value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Colonnes */}
              <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#374151' }}>Colonnes</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {preview.columns.map((col, i) => (
                  <span key={col.name} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    backgroundColor: i === preview.columns.length - 1 ? '#DCFCE7' : '#EEF2FF',
                    color: i === preview.columns.length - 1 ? '#15803D' : '#4361EE',
                    border: `1px solid ${i === preview.columns.length - 1 ? '#BBF7D0' : '#C7D2FE'}`,
                  }}>
                    {col.name}
                    <span style={{ opacity: 0.6, marginLeft: 5, fontSize: 10 }}>{col.dtype}</span>
                  </span>
                ))}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 11, color: '#9CA3AF' }}>
                La derniere colonne (verte) est generalement la variable cible.
              </p>

              {/* Apercu table */}
              {preview.sample.length > 0 && (
                <>
                  <p style={{ margin: '16px 0 10px', fontWeight: 700, fontSize: 13, color: '#374151' }}>
                    Apercu ({preview.sample.length} premieres lignes)
                  </p>
                  <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9FAFB' }}>
                          {Object.keys(preview.sample[0]).map(col => (
                            <th key={col} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', borderBottom: '1px solid #E5E7EB' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((row, i) => (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} style={{ padding: '7px 12px', color: '#374151', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DatasetCard({ dataset, onDelete, onDownload }) {
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const toast = useToast()

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await onDelete(dataset.id)
      toast.success(`"${dataset.name}" supprimé`)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setShowConfirm(false)
      setDeleting(false)
    }
  }, [dataset, onDelete, toast])

  return (
    <>
      {showConfirm && <ConfirmDeleteModal dataset={dataset} onConfirm={handleDelete} onCancel={() => setShowConfirm(false)} />}
      <div style={{
        backgroundColor: '#ffffff', border: '1px solid #E5E7EB',
        borderRadius: 12, padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, backgroundColor: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Database size={18} color='#4361EE' />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dataset.name}
              </p>
              {dataset.version && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', backgroundColor: '#EDE9FE',
                  padding: '1px 7px', borderRadius: 10, flexShrink: 0, border: '1px solid #DDD6FE' }}>
                  v{dataset.version}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{dataset.filename}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <HardDrive size={12} color='#9CA3AF' />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{formatSize(dataset.file_size)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={12} color='#9CA3AF' />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(dataset.created_at)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowPreview(true)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 0', borderRadius: 6,
            border: '1px solid #C7D2FE', backgroundColor: '#EEF2FF',
            fontSize: 12, color: '#4361EE', cursor: 'pointer',
          }}>
            <Eye size={12} /> Apercu
          </button>
          {onDownload && (
            <button onClick={() => onDownload(dataset.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 0', borderRadius: 6,
              border: '1px solid #D1D5DB', backgroundColor: 'transparent',
              fontSize: 12, color: '#374151', cursor: 'pointer',
            }}>
              <Download size={12} /> Telecharger
            </button>
          )}
          {onDelete && (
            <button onClick={() => setShowConfirm(true)} disabled={deleting} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 0', borderRadius: 6,
              border: '1px solid #FECACA', backgroundColor: 'transparent',
              fontSize: 12, color: '#EF4444', cursor: 'pointer',
            }}>
              <Trash2 size={12} /> Supprimer
            </button>
          )}
        </div>
      </div>

      {showPreview && <PreviewModal dataset={dataset} onClose={() => setShowPreview(false)} />}
    </>
  )
}

export default DatasetCard
