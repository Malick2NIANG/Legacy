import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, UserCheck, AlertTriangle, RefreshCw, Scale } from 'lucide-react'
import { BRAND_NAME, BRAND_FONT, BRAND_GREEN } from '../brand'

const DARK   = '#091A0C'
const BORDER = '#1A3A20'
const MUTED  = '#7A9E85'
const CREAM  = '#F5F0E8'

const Section = ({ icon, title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ color: BRAND_GREEN }}>{icon}</span>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: CREAM, margin: 0 }}>{title}</h2>
    </div>
    <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.8 }}>{children}</div>
  </div>
)

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: DARK, fontFamily: 'Inter, Segoe UI, sans-serif', color: CREAM }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'rgba(9,26,12,0.96)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${BORDER}`, padding: '0 clamp(16px,4vw,48px)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/Logo.png" alt="LEGACY" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span style={{ fontFamily: BRAND_FONT, fontSize: 15, fontWeight: 700, color: BRAND_GREEN, letterSpacing: '3px' }}>
            {BRAND_NAME}
          </span>
        </Link>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>
      </header>

      {/* Contenu */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 96px' }}>

        <p style={{ fontSize: 12, color: MUTED, marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>Conditions d'utilisation</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: CREAM, margin: '0 0 8px', lineHeight: 1.2 }}>
          Règles d'utilisation de la plateforme.
        </h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 48 }}>Dernière mise à jour : juin 2026</p>

        <div style={{ borderLeft: `2px solid ${BRAND_GREEN}`, paddingLeft: 20, marginBottom: 48 }}>
          <p style={{ fontSize: 15, color: CREAM, lineHeight: 1.8, margin: 0 }}>
            En utilisant Legacy, vous acceptez les présentes conditions. Veuillez les lire attentivement avant de créer un compte.
          </p>
        </div>

        <Section icon={<UserCheck size={18} />} title="Accès et compte">
          <p>Pour utiliser Legacy, vous devez créer un compte avec une adresse e-mail valide. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions effectuées depuis votre compte.</p>
          <p style={{ marginTop: 12 }}>L'utilisation de la plateforme est réservée à des fins professionnelles, académiques ou de recherche légitimes.</p>
        </Section>

        <Section icon={<FileText size={18} />} title="Contenu et données">
          <p>Vous conservez la propriété entière de vos datasets, modèles et résultats. En les important sur Legacy, vous nous accordez une licence technique limitée permettant uniquement leur stockage et leur restitution à votre demande.</p>
          <p style={{ marginTop: 12 }}>Il est strictement interdit d'importer des données contenant des informations personnelles de tiers sans leur consentement explicite.</p>
        </Section>

        <Section icon={<AlertTriangle size={18} />} title="Usages interdits">
          <ul style={{ paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Toute activité illicite ou contraire aux lois en vigueur.</li>
            <li style={{ marginBottom: 8 }}>Entraîner des modèles à des fins de discrimination, de désinformation ou de nuisance.</li>
            <li style={{ marginBottom: 8 }}>Tenter de compromettre la sécurité de la plateforme ou des autres utilisateurs.</li>
            <li style={{ marginBottom: 8 }}>Utiliser la plateforme pour du scraping, de la revente de ressources ou toute exploitation commerciale non autorisée.</li>
          </ul>
        </Section>

        <Section icon={<RefreshCw size={18} />} title="Modifications du service">
          <p>Legacy se réserve le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment, avec ou sans préavis. En cas de changement majeur des conditions, nous vous en informerons par e-mail.</p>
        </Section>

        <Section icon={<Scale size={18} />} title="Responsabilité et droit applicable">
          <p>Legacy est fourni "tel quel", sans garantie d'aucune sorte quant à sa disponibilité continue. Notre responsabilité est limitée aux dommages directs prouvables causés par une faute de notre part.</p>
          <p style={{ marginTop: 12 }}>Ces conditions sont régies par le droit sénégalais. Tout litige sera soumis à la compétence des juridictions compétentes de Dakar.</p>
        </Section>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Link to="/confidentialite" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>← Politique de confidentialité</Link>
          <Link to="/" style={{ fontSize: 13, color: BRAND_GREEN, textDecoration: 'none' }}>Retour à l'accueil →</Link>
        </div>
      </main>
    </div>
  )
}
