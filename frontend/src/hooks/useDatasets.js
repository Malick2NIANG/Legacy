/**
 * Hook de gestion des datasets.
 * Récupère la liste, gère l'upload et la suppression.
 */
import { useState, useEffect, useCallback } from 'react'
import datasetService from '../services/datasetService'

function useDatasets() {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDatasets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await datasetService.getAll()
      setDatasets(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  const uploadDataset = useCallback(async (file, name) => {
    const created = await datasetService.upload(file, name)
    setDatasets((prev) => [created, ...prev])
    return created
  }, [])

  const deleteDataset = useCallback(async (id) => {
    await datasetService.delete(id)
    setDatasets((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { datasets, loading, error, uploadDataset, deleteDataset, refetch: fetchDatasets }
}

export default useDatasets
