/**
 * Page de gestion des datasets.
 * Liste tous les datasets, permet d'en uploader de nouveaux et d'en supprimer.
 */
import useLayout from '../hooks/useLayout'
import React from 'react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import DatasetList from '../components/datasets/DatasetList'
import DatasetUpload from '../components/datasets/DatasetUpload'
import useDatasets from '../hooks/useDatasets'
import datasetService from '../services/datasetService'
import PageFooter from '../components/common/Footer'

function DatasetsPage() {
  const { mainStyle } = useLayout()
  const { datasets, loading, error, uploadDataset, deleteDataset } = useDatasets()

  const handleDownload = async (id) => {
    try {
      const url = await datasetService.getUrl(id)
      window.open(url, '_blank')
    } catch {
      alert('Impossible de générer le lien de téléchargement.')
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />

      <main className="main-content" style={mainStyle}>
        <div style={{ padding: '32px', flex: 1 }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
              Datasets
            </h1>
            <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
              Gérez vos fichiers de données pour l'entraînement de vos modèles.
            </p>
          </div>

          <DatasetUpload onUploadSuccess={uploadDataset} />

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, padding: '12px 16px',
              color: '#EF4444', fontSize: 13, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <DatasetList
            datasets={datasets}
            loading={loading}
            onDelete={deleteDataset}
            onDownload={handleDownload}
          />

        </div>
          <PageFooter />
      </main>
    </div>
  )
}

export default DatasetsPage
