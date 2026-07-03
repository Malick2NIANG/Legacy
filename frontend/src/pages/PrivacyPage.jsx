import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, Lock, Trash2, Mail } from 'lucide-react'
import { BRAND_NAME, BRAND_FONT, BRAND_GREEN } from '../brand'

const DARK   = '#091A0C'
const CARD   = '#0F2414'
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

export default function PrivacyPage() {
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

        <p style={{ fontSize: 12, color: MUTED, marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>Politique de confidentialité</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: CREAM, margin: '0 0 8px', lineHeight: 1.2 }}>
          Vos données vous appartiennent.
        </h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 48 }}>Dernière mise à jour : juin 2026</p>

        <div style={{ borderLeft: `2px solid ${BRAND_GREEN}`, paddingLeft: 20, marginBottom: 48 }}>
          <p style={{ fontSize: 15, color: CREAM, lineHeight: 1.8, margin: 0 }}>
            Legacy s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit quelles données nous collectons, pourquoi et comment elles sont utilisées.
          </p>
        </div>

        <Section icon={<Eye size={18} />} title="Données collectées">
          <p>Nous collectons uniquement les données nécessaires au bon fonctionnement de la plateforme :</p>
          <ul style={{ paddingLeft: 20, marginTop: 12 }}>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CREAM }}>Compte :</strong> nom complet, adresse e-mail, mot de passe (haché avec Bcrypt, jamais stocké en clair).</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CREAM }}>Fichiers :</strong> datasets et modèles que vous importez, stockés dans un espace isolé et accessible uniquement par vous.</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: CREAM }}>Logs :</strong> journaux d'activité techniques (connexions, erreurs) à des fins de sécurité.</li>
          </ul>
        </Section>

        <Section icon={<Shield size={18} />} title="Utilisation des données">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul style={{ paddingLeft: 20, marginTop: 12 }}>
            <li style={{ marginBottom: 8 }}>Vous identifier et sécuriser votre session.</li>
            <li style={{ marginBottom: 8 }}>Stocker et restituer vos fichiers (datasets, modèles, résultats d'expériences).</li>
            <li style={{ marginBottom: 8 }}>Vous envoyer un e-mail de réinitialisation de mot de passe si vous en faites la demande.</li>
          </ul>
          <p style={{ marginTop: 12 }}>Nous ne vendons, ne louons et ne partageons pas vos données avec des tiers à des fins commerciales.</p>
        </Section>

        <Section icon={<Lock size={18} />} title="Sécurité">
          <p>Toutes les communications sont chiffrées (HTTPS). Les mots de passe sont hachés avec Bcrypt. L'accès aux fichiers est isolé par utilisateur via des politiques MinIO S3. Les tokens JWT expirent après 24 h.</p>
        </Section>

        <Section icon={<Trash2 size={18} />} title="Suppression des données">
          <p>Vous pouvez demander la suppression de votre compte et de l'ensemble de vos données à tout moment en contactant notre équipe. La suppression est effective sous 30 jours.</p>
        </Section>

        <Section icon={<Mail size={18} />} title="Contact">
          <p>Pour toute question relative à vos données personnelles, écrivez-nous à :<br />
            <a href="mailto:contact@legacy-platform.io" style={{ color: BRAND_GREEN, textDecoration: 'none' }}>contact@legacy-platform.io</a>
          </p>
        </Section>

        {/* Lien vers conditions */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Link to="/" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>← Retour à l'accueil</Link>
          <Link to="/conditions" style={{ fontSize: 13, color: BRAND_GREEN, textDecoration: 'none' }}>Conditions d'utilisation →</Link>
        </div>
      </main>
    </div>
  )
}
