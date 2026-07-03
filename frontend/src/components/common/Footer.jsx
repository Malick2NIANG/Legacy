import React from 'react'

export default function PageFooter() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '20px 16px',
      marginTop: 'auto',
      borderTop: '1px solid #D6E8DC',
      fontSize: 12,
      color: '#9CA3AF',
      fontFamily: 'Inter, Segoe UI, sans-serif',
      letterSpacing: '0.2px',
    }}>
      © 2026 <span style={{ fontWeight: 600, color: '#1B4D2E', textShadow: '0 0 8px rgba(0,134,63,0.45), 0 0 16px rgba(0,134,63,0.2)' }}>Legacy</span>, Tous droits réservés
    </footer>
  )
}
