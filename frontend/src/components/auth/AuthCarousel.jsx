import React, { useState, useEffect } from 'react'

const SLIDES = [
  {
    bg: '#0D2818', accent: '#2D9E60',
    phrase: 'Entraînez vos modèles ML directement depuis votre navigateur.',
    sub: 'Sklearn · HuggingFace · Computer Vision',
    visual: (
      <svg viewBox="0 0 320 200" width="320" height="200">
        {[40,80,120,55,95,130,70,110].map((h, i) => (
          <rect key={i} x={20 + i*36} y={200-h} width="24" height={h}
            rx="4" fill={i % 2 === 0 ? '#2D9E60' : '#1B4D2E'} opacity="0.85"/>
        ))}
        <line x1="12" y1="200" x2="308" y2="200" stroke="#2D9E60" strokeWidth="1.5" opacity="0.4"/>
      </svg>
    ),
  },
  {
    bg: '#0A1628', accent: '#3B82F6',
    phrase: 'Visualisez vos résultats en temps réel, comparez vos expériences.',
    sub: 'Dashboards interactifs · Métriques avancées',
    visual: (
      <svg viewBox="0 0 320 200" width="320" height="200">
        <polyline points="20,160 60,120 100,140 140,80 180,100 220,50 260,70 300,30"
          fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {[[20,160],[60,120],[100,140],[140,80],[180,100],[220,50],[260,70],[300,30]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#3B82F6"/>
        ))}
        <line x1="12" y1="175" x2="308" y2="175" stroke="#3B82F6" strokeWidth="1" opacity="0.3"/>
      </svg>
    ),
  },
  {
    bg: '#1A0E28', accent: '#A78BFA',
    phrase: 'RAG, bases vectorielles et IA générative au bout des doigts.',
    sub: 'ChromaDB · Embeddings · LLM',
    visual: (
      <svg viewBox="0 0 320 200" width="320" height="200">
        {[[160,40],[80,120],[240,120],[60,175],[160,175],[260,175]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r={i===0?18:12} fill="none" stroke="#A78BFA" strokeWidth="1.8" opacity="0.8"/>
        ))}
        {[[160,40,80,120],[160,40,240,120],[80,120,60,175],[80,120,160,175],[240,120,160,175],[240,120,260,175]].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#A78BFA" strokeWidth="1" opacity="0.4"/>
        ))}
        <circle cx="160" cy="40" r="6" fill="#A78BFA"/>
      </svg>
    ),
  },
  {
    bg: '#1A1208', accent: '#F5A227',
    phrase: 'Un héritage numérique construit pour durer. Bienvenue sur Legacy.',
    sub: 'Sécurité CIAN · JWT · Chiffrement bout en bout',
    visual: (
      <img src="/Logo.png" alt="Legacy" style={{ width: 160, height: 160, objectFit: 'contain' }} />
    ),
  },
]

export default function AuthCarousel() {
  const [active, setActive] = useState(0)
  const [fade,   setFade]   = useState(true)

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => { setActive(i => (i + 1) % SLIDES.length); setFade(true) }, 300)
    }, 4500)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDES[active]
  return (
    <div style={{
      flex: 1, width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: slide.bg, transition: 'background-color 0.6s ease',
      padding: '48px 40px', overflow: 'hidden',
    }}>
      <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease', marginBottom: 40 }}>
        {slide.visual}
      </div>
      <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease', textAlign: 'center', maxWidth: 380 }}>
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, lineHeight: 1.45, margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>
          {slide.phrase}
        </p>
        <p style={{ color: slide.accent, fontSize: 13, fontWeight: 500, margin: 0, letterSpacing: '0.5px' }}>
          {slide.sub}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
        {SLIDES.map((_, i) => (
          <button key={i}
            onClick={() => { setFade(false); setTimeout(() => { setActive(i); setFade(true) }, 300) }}
            style={{
              width: i === active ? 24 : 8, height: 8, borderRadius: 4,
              border: 'none', cursor: 'pointer', padding: 0,
              backgroundColor: i === active ? slide.accent : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
