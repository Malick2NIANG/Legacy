/**
 * Liste des datasets avec recherche et état vide.
 */
import React, { useState } from 'react'
import DatasetCard from './DatasetCard'

function DatasetList({ datasets, loading, onDelete, onDownload }) {
  const [search, setSearch] = useState('')

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
        Chargement des datasets…
      </div>
    )
  }

  return (
    <div>
      {/* Barre de recherche */}
      {datasets.length > 0 && (
        <input
          type="text"
          placeholder="Rechercher un dataset…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid #E5E7EB',
            fontSize: 14, marginBottom: 20,
            outline: 'none', boxSizing: 'border-box',
            color: '#111827',
          }}
        />
      )}

      {/* État vide */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          backgroundColor: '#F9FAFB', borderRadius: 12,
          border: '2px dashed #E5E7EB',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗄</div>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
            {search ? 'Aucun dataset ne correspond à cette recherche.' : 'Aucun dataset importé. Uploadez votre premier fichier !'}
          </p>
        </div>
      )}

      {/* Grille */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {filtered.map((dataset) => (
          <DatasetCard
            key={dataset.id}
            dataset={dataset}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  )
}

export default DatasetList
