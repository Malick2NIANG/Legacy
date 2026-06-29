/**
 * Service de gestion des modèles ML.
 * CRUD des configurations de modèles stockées en base.
 */
import api from './api'

const modelService = {
  getAll: async () => {
    const { data } = await api.get('/models/')
    return data
  },

  create: async (modelData) => {
    const { data } = await api.post('/models/', modelData)
    return data
  },

  update: async (id, modelData) => {
    const { data } = await api.put(`/models/${id}`, modelData)
    return data
  },

  delete: async (id) => {
    await api.delete(`/models/${id}`)
  },
}

export default modelService
