/**
 * Service de gestion des datasets.
 */
import api from './api'

const datasetService = {
  getAll: async () => {
    const { data } = await api.get('/datasets/')
    return data
  },

  upload: async (file, name) => {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    const { data } = await api.post('/datasets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getUrl: async (id) => {
    const { data } = await api.get(`/datasets/${id}/url`)
    return data.url
  },

  preview: async (id, rows = 5) => {
    const { data } = await api.get(`/datasets/${id}/preview?rows=${rows}`)
    return data
  },

  delete: async (id) => {
    await api.delete(`/datasets/${id}`)
  },
}

export default datasetService
