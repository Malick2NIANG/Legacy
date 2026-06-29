import React from 'react'

function PlaceholderPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1B4C',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, Segoe UI, sans-serif',
      color: '#ffffff',
    }}>
      {/* Logo / Icône */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#4361EE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        fontSize: 36,
      }}>
        &#9881;
      </div>

      {/* Titre */}
      <h1 style={{
        fontSize: 32,
        fontWeight: 700,
        margin: '0 0 12px 0',
        letterSpacing: '-0.5px',
      }}>
        Plateforme Data Science
      </h1>

      {/* Sous-titre */}
      <p style={{
        fontSize: 16,
        color: '#B0B8D4',
        margin: '0 0 40px 0',
        textAlign: 'center',
        maxWidth: 420,
        lineHeight: 1.6,
      }}>
        Interface en cours de conception.
      </p>

      {/* Barre de séparation */}
      <div style={{
        width: 60,
        height: 3,
        backgroundColor: '#4361EE',
        borderRadius: 2,
        marginBottom: 40,
      }} />

      {/* Services actifs */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 48,
      }}>
        {[
          { label: 'Backend API', url: 'http://localhost:8000/docs', status: 'up' },
          { label: 'MinIO Console', url: 'http://localhost:9001', status: 'up' },
        ].map(({ label, url, status }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              backgroundColor: 'rgba(67,97,238,0.15)',
              border: '1px solid rgba(67,97,238,0.4)',
              borderRadius: 10,
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: 14,
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: '#2ECC71',
              display: 'inline-block',
            }} />
            {label}
          </a>
        ))}
      </div>

      {/* Stack technique */}
      <div style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {['React', 'FastAPI', 'PostgreSQL', 'Redis', 'MinIO', 'Celery'].map(tech => (
          <span key={tech} style={{
            padding: '4px 12px',
            backgroundColor: 'rgba(255,255,255,0.07)',
            borderRadius: 20,
            fontSize: 12,
            color: '#B0B8D4',
            letterSpacing: '0.3px',
          }}>
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}

export default PlaceholderPage
