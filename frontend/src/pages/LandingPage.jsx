/**
 * Landing page, Legacy.
 * Ton professionnel et inclusif. Identité africaine dosée, ambition universelle.
 * Palette : vert #00853F, or #E8A020, fond sombre #091A0C.
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database, Cpu, BarChart2, Shield, Zap, Brain,
  Eye, Upload, Play, CheckCircle, ArrowRight,
  Globe, Lock, Users, Layers, Menu, X,
} from 'lucide-react'
import { BRAND_NAME, BRAND_FONT, BRAND_GLOW } from '../brand'

// ── Palette ───────────────────────────────────────────────────────────────────
const DARK   = '#091A0C'
const GREEN  = '#00853F'
const GREEN2 = '#00A651'
const GOLD   = '#E8A020'
const CREAM  = '#F5F0E8'
const MUTED  = '#7A9E85'
const CARD   = '#0F2414'
const BORDER = '#1A3A20'

// ── Données ───────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Database size={20} color={GREEN} />,
    title: 'Stockage multi-formats',
    desc: 'Import CSV pour données tabulaires, ZIP annoté pour images, audio et vidéo. Versionnage automatique par dataset. Isolement strict par utilisateur via MinIO S3.',
  },
  {
    icon: <Brain size={20} color={GOLD} />,
    title: 'Machine Learning & Deep Learning',
    desc: 'Sklearn (5 algorithmes), TensorFlow et PyTorch sur données tabulaires. Versionnage des modèles à chaque ré-entraînement. Exports .pkl, .h5, .pt.',
  },
  {
    icon: <Eye size={20} color='#60A5FA' />,
    title: 'Computer Vision',
    desc: 'Classification d\'images à partir d\'un ZIP annoté par classe. Pipeline RandomForest sur features pixels (64×64). Export .pkl.',
  },
  {
    icon: <Zap size={20} color='#A78BFA' />,
    title: 'Audio & Vidéo',
    desc: 'Pipeline audio via features MFCC (librosa). Pipeline vidéo par extraction de frames (OpenCV). Import ZIP structuré par classe, export .pkl.',
  },
  {
    icon: <BarChart2 size={20} color={GREEN2} />,
    title: 'Visualisation temps réel',
    desc: 'Accuracy, F1, Precision, Recall. Matrice de confusion, courbe d\'apprentissage, comparaison multi-expériences. Suivi Celery en direct.',
  },
  {
    icon: <Globe size={20} color={GOLD} />,
    title: 'RAG & NLP',
    desc: 'Pipeline Retrieval-Augmented Generation en feuille de route. Traitement de texte natif via scikit-learn (TF-IDF, vectorisation). Exportable en .pkl.',
  },
  {
    icon: <Shield size={20} color='#F87171' />,
    title: 'Sécurité CIAN',
    desc: 'Confidentialité, Intégrité, Authenticité, Non-répudiation. JWT, bcrypt, cloisonnement des données au repos.',
  },
  {
    icon: <Cpu size={20} color={MUTED} />,
    title: 'Calcul adaptatif',
    desc: 'Exécution CPU native. Architecture prête pour basculer sur GPU (CUDA) si disponible. Déployable sur serveur local ou distant via Docker.',
  },
]

const PIPELINE = [
  { icon: <Database size={15} />,    label: 'Collecte'      },
  { icon: <CheckCircle size={15} />, label: 'Étiquetage'    },
  { icon: <Upload size={15} />,      label: 'Import'        },
  { icon: <Play size={15} />,        label: 'Entraînement'  },
  { icon: <BarChart2 size={15} />,   label: 'Visualisation' },
  { icon: <Globe size={15} />,       label: 'Déploiement'   },
]

const ML_PIPELINES = [
  { label:'Sklearn',       sub:'CSV → .pkl',       color:'#00853F', bg:'#E6F4ED' },
  { label:'TensorFlow',    sub:'CSV → .h5',        color:'#FF6F00', bg:'#FFF3E0' },
  { label:'PyTorch',       sub:'CSV → .pt',        color:'#EE4C2C', bg:'#FEF2F0' },
  { label:'Computer Vision', sub:'ZIP → .pkl',    color:'#2563EB', bg:'#EFF6FF' },
  { label:'Audio',         sub:'ZIP → .pkl',       color:'#7C3AED', bg:'#F5F3FF' },
  { label:'Vidéo',         sub:'ZIP → .pkl',       color:'#0891B2', bg:'#ECFEFF' },
]

const PILLARS = [
  {
    icon: <Users size={18} color={GREEN} />,
    title: 'Accessible à tous',
    desc: 'Conçue pour être utilisée sans infrastructure cloud coûteuse. Déployez sur votre propre serveur, local ou distant.',
  },
  {
    icon: <Lock size={18} color={GOLD} />,
    title: 'Données sous votre contrôle',
    desc: 'Aucune donnée ne quitte votre environnement sans votre accord. Cloisonnement strict par utilisateur.',
  },
  {
    icon: <Layers size={18} color='#60A5FA' />,
    title: 'Pipeline unifié',
    desc: 'De la collecte au déploiement dans un seul outil, sans jongler entre Colab, Weights & Biases, et Kaggle.',
  },
]

const TECH = [
  'FastAPI', 'React', 'PostgreSQL', 'Redis', 'MinIO', 'Celery', 'Docker', 'scikit-learn', 'TensorFlow', 'PyTorch',
]

// ─────────────────────────────────────────────────────────────────────────────


// ── Background : motifs tech & africains ─────────────────────────────────────
function BackgroundPattern() {
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',inset:0}}>
        <defs>
          {/* Hexagone tech */}
          <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,47 30,62 2,47 2,17"
              fill="none" stroke="#00853F" strokeWidth="0.5" opacity="0.18"/>
          </pattern>
          {/* Kente diagonale */}
          <pattern id="kente" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="32" height="8"  fill="#E8A020" opacity="0.07"/>
            <rect y="8"  width="32" height="8" fill="#00853F" opacity="0.07"/>
            <rect y="16" width="32" height="8" fill="#E8A020" opacity="0.04"/>
            <rect y="24" width="32" height="8" fill="#00853F" opacity="0.04"/>
          </pattern>
        </defs>

        {/* Hex grid, centre */}
        <rect width="1440" height="900" fill="url(#hex)" opacity="0.6"/>

        {/* Kente diagonal, coin haut-droit */}
        <rect x="900" y="0" width="540" height="360" fill="url(#kente)"/>
        {/* Kente diagonal, coin bas-gauche */}
        <rect x="0" y="560" width="480" height="340" fill="url(#kente)"/>

        {/* ── Circuit board haut-gauche ── */}
        <g opacity="0.22" stroke="#00853F" strokeWidth="1" fill="none">
          <line x1="20" y1="80"  x2="200" y2="80"/>
          <line x1="200" y1="80" x2="200" y2="140"/>
          <line x1="200" y1="140" x2="320" y2="140"/>
          <line x1="60" y1="80"  x2="60"  y2="180"/>
          <line x1="60" y1="180" x2="160" y2="180"/>
          <line x1="160" y1="140" x2="160" y2="220"/>
          <line x1="160" y1="220" x2="280" y2="220"/>
          <line x1="280" y1="140" x2="280" y2="260"/>
          <line x1="20" y1="260" x2="280" y2="260"/>
          <line x1="100" y1="180" x2="100" y2="300"/>
          <line x1="100" y1="300" x2="240" y2="300"/>
          {/* noeuds */}
          <circle cx="200" cy="80"  r="3" fill="#00853F"/>
          <circle cx="60"  cy="80"  r="3" fill="#00853F"/>
          <circle cx="160" cy="140" r="3" fill="#E8A020"/>
          <circle cx="280" cy="140" r="3" fill="#00853F"/>
          <circle cx="100" cy="180" r="3" fill="#E8A020"/>
          <circle cx="60"  cy="180" r="3" fill="#00853F"/>
          <circle cx="280" cy="260" r="3" fill="#E8A020"/>
          <circle cx="100" cy="300" r="3" fill="#00853F"/>
          <circle cx="240" cy="300" r="3" fill="#E8A020"/>
        </g>

        {/* ── Circuit board bas-droit ── */}
        <g opacity="0.22" stroke="#00853F" strokeWidth="1" fill="none" transform="translate(1160,580)">
          <line x1="0"   y1="40"  x2="180" y2="40"/>
          <line x1="180" y1="40"  x2="180" y2="120"/>
          <line x1="40"  y1="40"  x2="40"  y2="140"/>
          <line x1="40"  y1="140" x2="180" y2="140"/>
          <line x1="100" y1="40"  x2="100" y2="80"/>
          <line x1="100" y1="80"  x2="260" y2="80"/>
          <line x1="260" y1="80"  x2="260" y2="160"/>
          <circle cx="40"  cy="40"  r="3" fill="#E8A020"/>
          <circle cx="180" cy="40"  r="3" fill="#00853F"/>
          <circle cx="100" cy="80"  r="3" fill="#E8A020"/>
          <circle cx="40"  cy="140" r="3" fill="#00853F"/>
          <circle cx="260" cy="80"  r="3" fill="#00853F"/>
        </g>

        {/* ── Adinkra Nyame Dua (arbre de vie), centre-gauche ── */}
        <g transform="translate(80,420)" opacity="0.12" stroke="#E8A020" strokeWidth="1.5" fill="none">
          <circle cx="0" cy="0" r="38"/>
          <circle cx="0" cy="0" r="24"/>
          <circle cx="0" cy="0" r="10"/>
          <line x1="0" y1="-38" x2="0"  y2="38"/>
          <line x1="-38" y1="0" x2="38" y2="0"/>
          <line x1="-27" y1="-27" x2="27" y2="27"/>
          <line x1="27"  y1="-27" x2="-27" y2="27"/>
        </g>

        {/* ── Adinkra Sankofa (spirale), droite ── */}
        <g transform="translate(1360,200)" opacity="0.12" stroke="#E8A020" strokeWidth="1.5" fill="none">
          <circle cx="0" cy="0" r="36"/>
          <path d="M0,-36 Q36,-36 36,0 Q36,36 0,36 Q-20,36 -28,18"/>
          <circle cx="0" cy="0" r="8"/>
          <circle cx="-28" cy="18" r="5" fill="#E8A020" opacity="0.3"/>
        </g>

        {/* ── Adinkra Gye Nyame (suprématie divine), bas-centre ── */}
        <g transform="translate(720,820)" opacity="0.1" stroke="#00853F" strokeWidth="1.2" fill="none">
          <ellipse cx="0" cy="0" rx="48" ry="24"/>
          <ellipse cx="0" cy="0" rx="28" ry="14"/>
          <line x1="-48" y1="0" x2="48"  y2="0"/>
          <line x1="0"   y1="-24" x2="0" y2="24"/>
          <path d="M-30,-8 Q-15,-20 0,-8 Q15,-20 30,-8"/>
          <path d="M-30,8  Q-15,20  0,8  Q15,20  30,8"/>
        </g>

        {/* ── Losanges Kente, coins ── */}
        <g opacity="0.15" fill="none" stroke="#E8A020" strokeWidth="0.8">
          {/* coin haut-droit */}
          <polygon points="1400,20 1420,50 1400,80 1380,50"/>
          <polygon points="1360,20 1380,50 1360,80 1340,50"/>
          <polygon points="1380,0  1400,30 1380,60 1360,30"/>
          <polygon points="1380,60 1400,90 1380,120 1360,90"/>
          {/* coin bas-gauche */}
          <polygon points="40,820 60,850 40,880 20,850"/>
          <polygon points="80,820 100,850 80,880 60,850"/>
          <polygon points="60,800 80,830 60,860 40,830"/>
          <polygon points="60,860 80,890 60,920 40,890"/>
        </g>

        {/* ── Points binaires / data ── */}
        <g opacity="0.12" fill="#00853F">
          {[...Array(24)].map((_,i)=>{
            const x = 120 + (i%8)*160 + (Math.sin(i*2.5)*30)
            const y = 440 + Math.floor(i/8)*180 + (Math.cos(i*1.8)*20)
            return <circle key={i} cx={x} cy={y} r="1.5"/>
          })}
        </g>

        {/* Dégradé masque pour que ça ne couvre pas le texte */}
        <radialGradient id="centerFade" cx="50%" cy="40%" r="45%">
          <stop offset="0%"   stopColor="#091A0C" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#091A0C" stopOpacity="0"/>
        </radialGradient>
        <rect width="1440" height="900" fill="url(#centerFade)"/>
      </svg>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const NAV_LINKS = [
    ['#fonctionnalites', 'Fonctionnalités'],
    ['#pipeline', 'Pipeline'],
    ['#tech', 'Technologies'],
  ]

  return (
    <div style={{
      fontFamily: 'Inter, Segoe UI, sans-serif',
      backgroundColor: DARK, color: CREAM, minHeight: '100vh',
      position: 'relative',
    }}>
      <BackgroundPattern/>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(9,26,12,0.96)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 clamp(16px,4vw,48px)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false) }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <img src="/Logo.png" alt="LEGACY" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <span style={{ fontFamily: BRAND_FONT, fontSize: 16, fontWeight: 700, color: '#2D6A4F', letterSpacing: '3px', textShadow: BRAND_GLOW }}>
            {BRAND_NAME}
          </span>
        </button>

        {/* Nav desktop */}
        <nav className="landing-header-nav" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} className="nav-link" style={{
              fontSize: 13, color: MUTED, textDecoration: 'none', fontWeight: 500,
            }}>{label}</a>
          ))}
          <Link to="/login" className="nav-link" style={{
            padding: '7px 18px', borderRadius: 7,
            border: `1px solid ${BORDER}`,
            color: CREAM, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            Connexion
          </Link>
          <Link to="/register" style={{
            padding: '7px 18px', borderRadius: 7,
            background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`,
            color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: `0 0 16px ${GREEN}35`,
            transition: 'opacity 0.18s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Créer un compte
          </Link>
        </nav>

        {/* Burger mobile */}
        <button
          className="landing-burger"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: CREAM }}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Menu mobile déroulant */}
      {mobileMenuOpen && (
        <div className="landing-mobile-menu" style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          backgroundColor: 'rgba(9,26,12,0.98)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BORDER}`,
          padding: '20px clamp(16px,4vw,32px) 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={{
              fontSize: 15, color: MUTED, textDecoration: 'none', fontWeight: 500,
              padding: '10px 0', borderBottom: `1px solid ${BORDER}`,
            }}>{label}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{
              padding: '11px 0', borderRadius: 8, textAlign: 'center',
              border: `1px solid ${BORDER}`,
              color: CREAM, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Connexion
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{
              padding: '11px 0', borderRadius: 8, textAlign: 'center',
              background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`,
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>
              Créer un compte
            </Link>
          </div>
        </div>
      )}


      {/* ── HERO ── */}
      <section style={{
        padding: '108px 48px 92px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* halo central */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 640, height: 640, borderRadius: '50%',
          background: `radial-gradient(circle, ${GREEN}15 0%, transparent 68%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: 60,
          width: 260, height: 260, borderRadius: '50%',
          background: `radial-gradient(circle, ${GOLD}10 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />



        <h1 className="landing-hero-title" style={{
          fontSize: 56, fontWeight: 900, margin: '0 0 10px',
          lineHeight: 1.1, letterSpacing: '-2px',
          maxWidth: 780, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Entraînez, visualisez et
          <br />
          <span style={{
            background: `linear-gradient(90deg, ${GREEN} 10%, ${GOLD} 90%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            déployez vos modèles ML
          </span>
        </h1>

        <p style={{
          fontSize: 17, color: MUTED,
          maxWidth: 560, margin: '20px auto 40px', lineHeight: 1.75,
        }}>
          Une plateforme complète et autonome, du stockage de données à la mise
          en production de modèles IA, sans dépendances cloud externes.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 30px', borderRadius: 10,
            background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`,
            color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: `0 4px 20px ${GREEN}45`,
          }}>
            Commencer gratuitement <ArrowRight size={16} />
          </Link>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 30px', borderRadius: 10,
            border: `1px solid ${BORDER}`,
            backgroundColor: CARD,
            color: CREAM, fontSize: 15, fontWeight: 600, textDecoration: 'none',
          }}>
            Se connecter
          </Link>
        </div>

        {/* mini stats */}
        <div className="landing-stats-flex" style={{
          display: 'flex', justifyContent: 'center', gap: 56,
          marginTop: 72, paddingTop: 48,
          borderTop: `1px solid ${BORDER}`,
        }}>
          {[
            { value: '7',       sub: 'Pipelines ML/DL',           color: GREEN },
            { value: 'CPU/GPU', sub: 'Calcul adaptatif',           color: GOLD  },
            { value: 'CIAN',    sub: 'Modèle de sécurité',         color: '#F87171' },
            { value: '100%',    sub: 'Données sous contrôle',      color: CREAM },
          ].map(({ value, sub, color }) => (
            <div key={sub} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PILIERS ── */}
      <section style={{
        padding: '72px 48px',
        backgroundColor: CARD,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: GOLD,
              letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12,
            }}>Pourquoi Legacy ?</p>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Un seul outil, tout le pipeline
            </h2>
          </div>

          <div className="landing-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {PILLARS.map(({ icon, title, desc }) => (
              <div key={title} style={{
                backgroundColor: DARK, borderRadius: 14,
                padding: '28px 24px', border: `1px solid ${BORDER}`,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  backgroundColor: CARD, border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: CREAM, margin: '0 0 8px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.65 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section id="pipeline" style={{ padding: '72px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: GREEN,
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12,
          }}>Pipeline</p>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 44px', letterSpacing: '-0.5px' }}>
            De la donnée brute au modèle déployé
          </h2>

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexWrap: 'wrap', gap: 0,
          }}>
            {PIPELINE.map(({ icon, label }, i) => (
              <React.Fragment key={label}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9,
                  backgroundColor: CARD, borderRadius: 12,
                  padding: '16px 18px', border: `1px solid ${BORDER}`, minWidth: 96,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    backgroundColor: `${GREEN}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: GREEN,
                  }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: CREAM }}>{label}</span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <ArrowRight size={15} color={BORDER} className="landing-pipeline-arrow" style={{ margin: '0 3px' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── ML/DL PIPELINES ── */}
      <section style={{
        padding: '56px 48px',
        borderTop: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: GREEN,
              letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10,
            }}>7 Pipelines disponibles</p>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: CREAM }}>
              Choisissez votre type de modèle
            </h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}>
            {ML_PIPELINES.map(({ label, sub, color, bg }) => (
              <div key={label} style={{
                backgroundColor: CARD, borderRadius: 12,
                padding: '16px 14px', border: `1px solid ${BORDER}`,
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: color, marginBottom: 10,
                }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: CREAM, marginBottom: 5 }}>{label}</div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: color,
                  backgroundColor: `${color}18`, borderRadius: 6,
                  padding: '2px 8px', display: 'inline-block',
                }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" style={{
        padding: '72px 48px',
        backgroundColor: CARD,
        borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: GOLD,
              letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12,
            }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Tout ce dont vous avez besoin
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))',
            gap: 14,
          }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} style={{
                backgroundColor: DARK, borderRadius: 12,
                padding: '22px 18px', border: `1px solid ${BORDER}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  backgroundColor: CARD, border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: CREAM, margin: '0 0 6px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH ── */}
      <section id="tech" style={{ padding: '64px 48px', textAlign: 'center' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: MUTED,
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 24,
        }}>Stack technique</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {TECH.map(t => (
            <span key={t} style={{
              padding: '7px 16px', borderRadius: 20,
              backgroundColor: CARD, border: `1px solid ${BORDER}`,
              color: MUTED, fontSize: 13, fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        backgroundColor: CARD,
        borderTop: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 24px',
            background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 20px ${GREEN}40`,
          }}>
            <Brain size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Prêt à entraîner vos modèles ?
          </h2>
          <p style={{ color: MUTED, fontSize: 14, margin: '0 0 32px', lineHeight: 1.75 }}>
            Créez votre espace de travail et commencez votre premier projet
            de Data Science en quelques minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10,
              background: `linear-gradient(135deg, ${GREEN}, ${GREEN2})`,
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: `0 4px 16px ${GREEN}40`,
            }}>
              Créer un compte <ArrowRight size={15} />
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10,
              border: `1px solid ${BORDER}`, backgroundColor: DARK,
              color: CREAM, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: '#060F08' }}>

        {/* Colonnes */}
        <div className="landing-footer-grid" style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 48, padding: '56px 64px 40px',
          maxWidth: 1200, margin: '0 auto',
        }}>
          {/* Colonne marque */}
          <div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}
            >
              <img src="/Logo.png" alt="LEGACY" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <span style={{ fontFamily: BRAND_FONT, fontSize: 17, fontWeight: 700, color: '#2D6A4F', letterSpacing: '3px', textShadow: BRAND_GLOW }}>
                {BRAND_NAME}
              </span>
            </button>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, marginBottom: 20 }}>
              Plateforme Data Science & IA pour entraîner, visualiser et déployer vos modèles, sans infrastructure cloud.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="28" height="18" viewBox="0 0 28 18" style={{ borderRadius: 3 }}>
                <rect x="0"  y="0" width="9"  height="18" fill="#00853F"/>
                <rect x="9"  y="0" width="10" height="18" fill="#FDEF42"/>
                <rect x="19" y="0" width="9"  height="18" fill="#DF0000"/>
                <polygon points="14,5.5 14.9,8.2 17.7,8.2 15.5,9.8 16.3,12.5 14,10.9 11.7,12.5 12.5,9.8 10.3,8.2 13.1,8.2" fill="#00853F"/>
              </svg>
              <span style={{ fontSize: 12, color: CREAM }}>Conçu au Sénégal</span>
            </div>
          </div>

          {/* Colonne Plateforme */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Plateforme</p>
            {[['#fonctionnalites','Fonctionnalités'],['#pipeline','Pipeline'],['#tech','Technologies']].map(([href, label]) => (
              <div key={href} style={{ marginBottom: 10 }}>
                <a href={href} className="footer-link" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>{label}</a>
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <Link to="/login" className="footer-link" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Connexion</Link>
            </div>
            <div style={{ marginBottom: 10 }}>
              <Link to="/register" className="footer-link" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Créer un compte</Link>
            </div>
          </div>

          {/* Colonne Technologies */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Technologies</p>
            {TECH.slice(0, 6).map(t => (
              <div key={t} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: MUTED }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Colonne Sécurité */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Sécurité</p>
            {[['JWT','Authentification sécurisée'],['Bcrypt','Hachage des mots de passe'],['MinIO S3','Stockage isolé'],['HTTPS','Chiffrement en transit']].map(([tech, desc]) => (
              <div key={tech} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: CREAM, margin: '0 0 2px' }}>{tech}</p>
                <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Barre du bas */}
        <div className="landing-footer-bottom" style={{
          borderTop: `1px solid ${BORDER}`,
          padding: '20px 64px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>© 2026 <span style={{ textShadow: BRAND_GLOW, color: '#7EC8A0' }}>Legacy</span>. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/confidentialite" className="footer-link" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Confidentialité</Link>
            <Link to="/conditions" className="footer-link" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Conditions d'utilisation</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
