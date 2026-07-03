/**
 * Carte dataset avec apercu colonnes.
 */
import React, { useState } from 'react'
import { Database, Trash2, Download, HardDrive, Calendar, Eye, X, Table2 } from 'lucide-react'
import datasetService from '../../services/datasetService'

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

  React.useEffect(() => {
    datasetService.preview(dataset.id, 5)
      .then(setPreview)
      .catch(() => setError('Impossible de charger l\'apercu.'))
      .finally(() => setLoading(false))
  }, [dataset.id])

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
  return (
    <>
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
            <button onClick={() => onDelete(dataset.id)} style={{
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
