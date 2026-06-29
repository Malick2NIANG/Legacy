/**
 * Indicateur de chargement réutilisable.
 * Affiché pendant les appels API ou les traitements longs.
 */
import React from 'react'

function LoadingSpinner({ size = 'md', message = 'Chargement...' }) {
  return (
    <div className="loading-spinner">
      {/* Cercle animé */}
      <span>{message}</span>
    </div>
  )
}

export default LoadingSpinner
