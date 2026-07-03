/**
 * Zone d'upload de dataset avec drag-and-drop et icônes Lucide.
 */
import React, { useState, useRef } from 'react'
import { UploadCloud, FileText, CheckCircle, AlertCircle, FolderArchive } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

function DatasetUpload({ onUploadSuccess }) {
  const [dragging, setDragging]   = useState(false)
  const [name, setName]           = useState('')
  const [file, setFile]           = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef()
  const toast    = useToast()

  const handleFile = (f) => {
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !name.trim()) return
    setUploading(true)
    setError('')
    try {
      const created = await onUploadSuccess(file, name.trim())
      if (created?.version > 1) {
        toast.info(`"${created.name}" — nouvelle version v${created.version} créée`)
      } else {
        toast.success(`"${created?.name || name.trim()}" importé avec succès`)
      }
      setFile(null)
      setName('')
    } catch (err) {
      const msg = err?.response?.data?.detail || "Erreur lors de l'upload"
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <form onSubmit={handleSubmit}>
        {/* Zone drag-and-drop */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#4361EE' : '#D1D5DB'}`,
            borderRadius: 12, padding: '32px 24px', textAlign: 'center',
            backgroundColor: dragging ? '#EEF2FF' : '#F9FAFB',
            cursor: 'pointer', transition: 'all 0.2s', marginBottom: 14,
          }}
        >
          <input
            ref={inputRef} type="file"
            accept=".csv,.json,.xlsx,.parquet,.txt,.zip"
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />

          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {file.name.endsWith('.zip')
                ? <FolderArchive size={20} color="#D97706" />
                : <CheckCircle size={20} color="#10B981" />}
              <span style={{ fontWeight: 600, color: file.name.endsWith('.zip') ? '#D97706' : '#10B981', fontSize: 14 }}>
                {file.name}
              </span>
              {file.name.endsWith('.zip') && (
                <span style={{ fontSize: 11, color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 10, border: '1px solid #FCD34D' }}>
                  CV / Audio / Video
                </span>
              )}
            </div>
          ) : (
            <>
              <UploadCloud size={32} color={dragging ? '#4361EE' : '#9CA3AF'} style={{ marginBottom: 10 }} />
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151', fontSize: 14 }}>
                Glissez un fichier ou cliquez pour parcourir
              </p>
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: 12 }}>
                CSV, JSON, Excel, Parquet, TXT &nbsp;·&nbsp;
                <span style={{ color: '#D97706', fontWeight: 500 }}>ZIP</span> pour CV / Audio / Video
              </p>
            </>
          )}
        </div>

        {/* Champ nom + bouton */}
        {file && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <FileText size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nom du dataset"
                required
                style={{
                  width: '100%', padding: '10px 12px 10px 34px',
                  borderRadius: 8, border: '1px solid #D1D5DB',
                  fontSize: 13, outline: 'none', color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit" disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 22px', borderRadius: 8,
                backgroundColor: uploading ? '#93C5FD' : '#4361EE',
                color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
            >
              <UploadCloud size={14} />
              {uploading ? 'Envoi…' : 'Importer'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 12, marginTop: 8 }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}
      </form>
    </div>
  )
}

export default DatasetUpload
