/**
 * Fonctions utilitaires partagées dans toute l'application.
 */

/** Formate une date ISO en chaîne lisible (ex: "08/06/2026 14:30") */
export function formatDate(isoString) {
  // TODO: implémenter le formatage
}

/** Formate une taille en octets en unité lisible (KB, MB, GB) */
export function formatFileSize(bytes) {
  // TODO: implémenter la conversion
}

/** Tronque une chaîne à maxLength caractères avec ellipse */
export function truncate(str, maxLength = 50) {
  // TODO: implémenter la troncature
}

/** Retourne une couleur CSS selon le statut d'une expérience */
export function statusColor(status) {
  const colors = {
    pending: '#f59e0b',
    running: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
  }
  return colors[status] || '#6b7280'
}
