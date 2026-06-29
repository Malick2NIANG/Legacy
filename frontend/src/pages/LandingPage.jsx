/**
 * Landing page — Legacy.
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
import { BRAND_NAME, BRAND_FONT } from '../brand'

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
    title: 'Stockage sécurisé',
    desc: 'Import CSV, JSON, Parquet, Excel. Chaque utilisateur accède uniquement à ses propres données via MinIO S3.',
  },
  {
    icon: <Brain size={20} color={GOLD} />,
    title: 'Modèles ML & IA Générative',
    desc: 'Sklearn, HuggingFace, RAG. Versionnage automatique — modèle initial, optimisé, puis affiné.',
  },
  {
    icon: <Eye size={20} color='#60A5FA' />,
    title: 'Computer Vision',
    desc: 'Classification, détection d\'objets, segmentation sémantique et d\'instances sur vos propres images.',
  },
  {
    icon: <BarChart2 size={20} color={GREEN2} />,
    title: 'Visualisation temps réel',
    desc: 'Accuracy, F1, matrice de confusion. Courbes d\'entraînement actualisées en direct via Celery.',
  },
  {
    icon: <Globe size={20} color={GOLD} />,
    title: 'HuggingFace & RAG',
    desc: 'Connexion aux modèles pré-entraînés via clé API. Retrieval Augmented Generation avec base de connaissances vectorielle.',
  },
  {
    icon: <Shield size={20} color='#F87171' />,
    title: 'Sécurité CIAN',
    desc: 'Confidentialité, Intégrité, Authenticité, Non-répudiation. JWT, bcrypt, chiffrement des données au repos.',
  },
  {
    icon: <Upload size={20} color='#A78BFA' />,
    title: 'Notebooks & étiquetage',
    desc: 'Upload de notebooks Jupyter, outils d\'étiquetage intégrés pour vos datasets d\'images et de texte.',
  },
  {
    icon: <Cpu size={20} color={MUTED} />,
    title: 'Calcul adaptatif',
    desc: 'Exécution CPU native. Bascule automatique sur GPU (CUDA) si disponible. Optimisé pour ressources contraintes.',
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
    desc: 'De la collecte au déploiement dans un seul outil — sans jongler entre Colab, Weights & Biases, et Kaggle.',
  },
]

const TECH = [
  'FastAPI', 'React', 'PostgreSQL', 'Redis',
  'MinIO', 'Celery', 'Docker', 'HuggingFace', 'scikit-learn', 'PyTorch',
]

// ─────────────────────────────────────────────────────────────────────────────

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
    }}>

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
          <span style={{ fontFamily: BRAND_FONT, fontSize: 16, fontWeight: 700, color: '#2D6A4F', letterSpacing: '3px' }}>
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
          Une plateforme complète et autonome — du stockage de données à la mise
          en production de modèles IA — sans dépendances cloud externes.
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
            { value: 'Sklearn',  sub: '+ HuggingFace + CV + RAG', color: GREEN },
            { value: 'CPU/GPU', sub: 'Calcul adaptatif',          color: GOLD  },
            { value: 'CIAN',    sub: 'Modèle de sécurité',        color: '#F87171' },
            { value: '100%',    sub: 'Données sous contrôle',     color: CREAM },
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
              <span style={{ fontFamily: BRAND_FONT, fontSize: 17, fontWeight: 700, color: '#2D6A4F', letterSpacing: '3px' }}>
                {BRAND_NAME}
              </span>
            </button>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, marginBottom: 20 }}>
              Plateforme Data Science & IA pour entraîner, visualiser et déployer vos modèles — sans infrastructure cloud.
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
          <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>© 2026 Legacy. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/confidentialite" className="footer-link" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Confidentialité</Link>
            <Link to="/conditions" className="footer-link" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Conditions d'utilisation</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
