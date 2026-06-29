/**
 * Service de gestion des datasets.
 * CRUD et upload vers le backend (multipart/form-data → MinIO).
 */
import api from './api'

const datasetService = {
  /** Récupère la liste des datasets de l'utilisateur */
  getAll: async () => {
    const { data } = await api.get('/datasets/')
    return data
  },

  /** Upload un fichier dataset avec son nom */
  upload: async (file, name) => {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    const { data } = await api.post('/datasets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Génère une URL présignée pour télécharger le dataset */
  getUrl: async (id) => {
    const { data } = await api.get(`/datasets/${id}/url`)
    return data.url
  },

  /** Supprime un dataset par ID */
  delete: async (id) => {
    await api.delete(`/datasets/${id}`)
  },
}

export default datasetService
