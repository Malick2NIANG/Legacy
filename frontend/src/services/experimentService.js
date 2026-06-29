/**
 * Service de gestion des expériences.
 * Lance les entraînements, poll le statut et récupère les résultats.
 */
import api from './api'

const experimentService = {
  getAll: async () => {
    const { data } = await api.get('/experiments/')
    return data
  },

  launch: async ({ name, dataset_id, model_id }) => {
    const { data } = await api.post('/experiments/', { name, dataset_id, model_id })
    return data
  },

  getStatus: async (id) => {
    const { data } = await api.get(`/experiments/${id}/status`)
    return data
  },

  getResults: async (id) => {
    const { data } = await api.get(`/results/${id}`)
    return data
  },

  exportResults: async (id, format = 'json') => {
    const response = await api.get(`/results/${id}/export?format=${format}`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default experimentService
