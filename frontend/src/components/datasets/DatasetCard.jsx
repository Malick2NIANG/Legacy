/**
 * Carte dataset avec icônes Lucide.
 */
import React from 'react'
import { Database, Trash2, Download, HardDrive, Calendar } from 'lucide-react'

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function DatasetCard({ dataset, onDelete, onDownload }) {
  return (
    <div style={{
      backgroundColor: '#ffffff', border: '1px solid #E5E7EB',
      borderRadius: 12, padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Icône + nom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          backgroundColor: '#EEF2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Database size={18} color="#4361EE" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dataset.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>
            {dataset.filename}
          </p>
        </div>
      </div>

      {/* Métadonnées */}
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <HardDrive size={12} color="#9CA3AF" />
          <span style={{ fontSize: 12, color: '#6B7280' }}>{formatSize(dataset.file_size)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={12} color="#9CA3AF" />
          <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(dataset.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {onDownload && (
          <button onClick={() => onDownload(dataset.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 0', borderRadius: 6,
            border: '1px solid #D1D5DB', backgroundColor: 'transparent',
            fontSize: 12, color: '#374151', cursor: 'pointer',
          }}>
            <Download size={12} /> Télécharger
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
  )
}

export default DatasetCard
