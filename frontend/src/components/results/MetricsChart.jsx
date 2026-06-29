/**
 * Graphiques des métriques de performance (accuracy, loss, F1-score...).
 * Utilise Recharts pour les courbes d'entraînement et de validation.
 */
import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'

function MetricsChart({ data, metricKeys }) {
  return (
    <div className="metrics-chart">
      {/* Graphique courbe métrique vs époques */}
      <LineChart width={600} height={300} data={data}>
        {/* Axes et légende */}
      </LineChart>
    </div>
  )
}

export default MetricsChart
