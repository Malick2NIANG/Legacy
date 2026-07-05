/**
 * Service de gestion des experiences.
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

  retry: async (id) => {
    const { data } = await api.post(`/experiments/${id}/retry`)
    return data
  },

  delete: async (id) => {
    await api.delete(`/experiments/${id}`)
  },
}

export default experimentService
