/**
 * Liste des datasets avec recherche, filtre alphabétique et pagination.
 */
import React, { useState, useMemo } from 'react'
import { Database, ChevronLeft, ChevronRight } from 'lucide-react'
import DatasetCard from './DatasetCard'

const GREEN    = '#00853F'
const PAGE_OPTIONS = [4, 8, 16, 32]

function DatasetList({ datasets, loading, onDelete, onDownload }) {
  const [search,      setSearch]      = useState('')
  const [letterFilter,setLetterFilter]= useState('') // '' = tous
  const [page,        setPage]        = useState(1)
  const [perPage,     setPerPage]     = useState(8)

  // Lettres disponibles dans les datasets actuels
  const availableLetters = useMemo(() => {
    const letters = new Set(datasets.map(d => d.name[0]?.toUpperCase()).filter(Boolean))
    return [...letters].sort()
  }, [datasets])

  // Filtrage + tri alphabétique
  const filtered = useMemo(() => {
    return datasets
      .filter(d => {
        const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase())
        const matchLetter = !letterFilter || d.name[0]?.toUpperCase() === letterFilter
        return matchSearch && matchLetter
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [datasets, search, letterFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const handleLetter = (l) => {
    setLetterFilter(prev => prev === l ? '' : l)
    setPage(1)
  }

  const handleSearch = (v) => { setSearch(v); setPage(1) }
  const handlePerPage = (v) => { setPerPage(Number(v)); setPage(1) }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Chargement des datasets…</div>
  }

  return (
    <div>
      {datasets.length > 0 && (
        <>
          {/* ── Barre de recherche ── */}
          <input
            type="text"
            placeholder="Rechercher un dataset…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 14,
              outline: 'none', boxSizing: 'border-box', color: '#111827',
            }}
          />

          {/* ── Filtre alphabétique (select) ── */}
          <div style={{ marginBottom: 16 }}>
            <select
              value={letterFilter}
              onChange={e => { setLetterFilter(e.target.value); setPage(1) }}
              style={{
                padding: '8px 14px', borderRadius: 8, border: `1px solid ${letterFilter ? GREEN : '#E5E7EB'}`,
                fontSize: 13, color: letterFilter ? GREEN : '#6B7280', fontWeight: letterFilter ? 600 : 400,
                cursor: 'pointer', outline: 'none', backgroundColor: '#fff',
                boxShadow: letterFilter ? `0 0 0 2px ${GREEN}20` : 'none',
                minWidth: 180,
              }}
            >
              <option value="">Toutes les lettres</option>
              {availableLetters.map(l => (
                <option key={l} value={l}>Commence par "{l}"</option>
              ))}
            </select>
          </div>

          {/* ── Infos résultats + choix par page ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {filtered.length} dataset{filtered.length !== 1 ? 's' : ''}
              {letterFilter ? ` commençant par "${letterFilter}"` : ''}
              {search ? ` · recherche "${search}"` : ''}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Afficher</span>
              <select
                value={perPage}
                onChange={e => handlePerPage(e.target.value)}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB',
                  fontSize: 12, color: '#374151', cursor: 'pointer', outline: 'none',
                }}
              >
                {PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      {/* ── État vide ── */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          backgroundColor: '#F9FAFB', borderRadius: 12, border: '2px dashed #E5E7EB',
        }}>
          <Database size={36} color="#D1D5DB" style={{ marginBottom: 12 }} />
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
            {search || letterFilter
              ? 'Aucun dataset ne correspond à ce filtre.'
              : 'Aucun dataset importé. Uploadez votre premier fichier !'}
          </p>
        </div>
      )}

      {/* ── Grille cartes ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {paginated.map(dataset => (
          <DatasetCard
            key={dataset.id}
            dataset={dataset}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 8, marginTop: 24,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{
              width: 32, height: 32, borderRadius: 6, border: '1px solid #E5E7EB',
              backgroundColor: '#fff', cursor: safePage === 1 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: safePage === 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={15} color="#374151" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              style={{
                width: 32, height: 32, borderRadius: 6, fontSize: 13, fontWeight: 600,
                border: `1px solid ${n === safePage ? GREEN : '#E5E7EB'}`,
                backgroundColor: n === safePage ? GREEN : '#fff',
                color: n === safePage ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{
              width: 32, height: 32, borderRadius: 6, border: '1px solid #E5E7EB',
              backgroundColor: '#fff', cursor: safePage === totalPages ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: safePage === totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={15} color="#374151" />
          </button>
        </div>
      )}
    </div>
  )
}

export default DatasetList
