/**
 * Hook de gestion des expériences.
 * Récupère la liste, lance une expérience, et poll le statut en temps réel.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import experimentService from '../services/experimentService'

function useExperiments() {
  const [experiments, setExperiments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pollRefs = useRef({})  // timers de polling par experiment_id

  const fetchExperiments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await experimentService.getAll()
      setExperiments(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExperiments()
    return () => {
      // Nettoyer tous les timers de polling au démontage
      Object.values(pollRefs.current).forEach(clearInterval)
    }
  }, [fetchExperiments])

  const launchExperiment = useCallback(async (name, datasetId, modelId) => {
    const exp = await experimentService.launch(name, datasetId, modelId)
    setExperiments((prev) => [exp, ...prev])
    // Démarrer le polling pour suivre le statut
    pollStatus(exp.id)
    return exp
  }, [])

  const pollStatus = useCallback((experimentId) => {
    // Éviter les doublons de polling
    if (pollRefs.current[experimentId]) return

    const interval = setInterval(async () => {
      try {
        const { status } = await experimentService.getStatus(experimentId)
        setExperiments((prev) =>
          prev.map((e) => e.id === experimentId ? { ...e, status } : e)
        )
        // Arrêter le polling quand l'expérience est terminée
        if (status === 'completed' || status === 'failed') {
          clearInterval(pollRefs.current[experimentId])
          delete pollRefs.current[experimentId]
        }
      } catch {
        clearInterval(pollRefs.current[experimentId])
        delete pollRefs.current[experimentId]
      }
    }, 3000)

    pollRefs.current[experimentId] = interval
  }, [])

  return { experiments, loading, error, launchExperiment, refetch: fetchExperiments }
}

export default useExperiments
