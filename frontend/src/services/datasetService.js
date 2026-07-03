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

  download: async (id) => {
    // Récupère le token depuis le localStorage (même logique que api.js)
    let token = ''
    try {
      const stored = localStorage.getItem('ds-platform-auth')
      token = JSON.parse(stored).state.token
    } catch (_) {}

    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    const res = await fetch(`${base}/datasets/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Échec du téléchargement')

    const blob = await res.blob()
    const cd = res.headers.get('Content-Disposition') || ''
    const filename = cd.match(/filename="?([^"]+)"?/)?.[1] || 'dataset'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
