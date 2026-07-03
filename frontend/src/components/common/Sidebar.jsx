import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Database, FlaskConical, Brain, BarChart2,
  ChevronLeft, ChevronRight, Users, FileText, PieChart,
} from 'lucide-react'
import { BRAND_NAME, BRAND_FONT, BRAND_GLOW } from '../../brand'
import { useSidebar } from '../../context/SidebarContext'
import useResponsive from '../../hooks/useResponsive'
import useAuthStore from '../../store/authStore'

const GENERAL_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/datasets',    label: 'Datasets',    Icon: Database         },
  { to: '/models',      label: 'Modèles',     Icon: Brain            },
  { to: '/experiments', label: 'Expériences', Icon: FlaskConical     },
  { to: '/results',     label: 'Résultats',   Icon: BarChart2        },
]

const ADMIN_ITEMS = [
  { to: '/admin/stats', label: 'Statistiques',    Icon: PieChart              },
  { to: '/admin',       label: 'Utilisateurs',    Icon: Users,    end: true   },
  { to: '/admin/audit', label: "Journal d'audit", Icon: FileText              },
]

// ── Label de section ──────────────────────────────────────────────────────────
function SectionLabel({ label, visible }) {
  if (!visible) return null
  return (
    <div style={{
      padding: '12px 16px 4px',
      fontSize: 10, fontWeight: 700, letterSpacing: '1px',
      textTransform: 'uppercase', color: 'rgba(168,201,181,0.45)',
      whiteSpace: 'nowrap', overflow: 'hidden',
    }}>
      {label}
    </div>
  )
}

// ── Item de navigation ────────────────────────────────────────────────────────
function NavItem({ to, label, Icon, end, isOpen, isDesktop, isMobile, isTablet, close, setHovered }) {
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={(e) => {
        if (isDesktop && !isOpen) {
          const rect = e.currentTarget.getBoundingClientRect()
          setHovered({ to, label, y: rect.top + rect.height / 2 })
        }
      }}
      onMouseLeave={() => setHovered(null)}
    >
      <NavLink
        to={to}
        end={end}
        onClick={(isMobile || isTablet) ? close : undefined}
        style={({ isActive }) => ({
          display: 'flex', alignItems: 'center',
          gap: isOpen ? 10 : 0,
          justifyContent: (isDesktop && !isOpen) ? 'center' : 'flex-start',
          padding: (isDesktop && !isOpen) ? '11px 0' : '10px 16px',
          color: isActive ? '#ffffff' : '#A8C9B5',
          backgroundColor: isActive ? 'rgba(0,133,63,0.3)' : 'transparent',
          borderLeft: `3px solid ${isActive ? '#00853F' : 'transparent'}`,
          textDecoration: 'none', fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          transition: 'background-color 0.15s, color 0.15s',
          whiteSpace: 'nowrap', overflow: 'hidden',
        })}
      >
        <Icon size={17} style={{ flexShrink: 0 }} />
        {(isOpen || !isDesktop) && <span>{label}</span>}
      </NavLink>
    </div>
  )
}

// ── Tooltip portail (hors de l'aside pour éviter le clipping) ────────────────
function SidebarTooltip({ hovered }) {
  if (!hovered) return null
  return createPortal(
    <div style={{
      position: 'fixed',
      left: 68,
      top: hovered.y,
      transform: 'translateY(-50%)',
      backgroundColor: '#111827',
      color: '#ffffff',
      fontSize: 12,
      fontWeight: 500,
      padding: '5px 11px',
      borderRadius: 6,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
    }}>
      {/* Flèche gauche */}
      <div style={{
        position: 'absolute',
        right: '100%',
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderRight: '5px solid #111827',
      }} />
      {hovered.label}
    </div>,
    document.body
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { isOpen, toggle, close } = useSidebar()
  const { isMobile, isTablet }    = useResponsive()
  const { user }                  = useAuthStore()
  const [hovered, setHovered]     = useState(null) // { to, label, y }

  const isDesktop    = !isMobile && !isTablet
  const sidebarWidth = isDesktop ? (isOpen ? 220 : 60) : 220
  const showLabels   = isOpen || !isDesktop

  const navItemProps = { isOpen, isDesktop, isMobile, isTablet, close, setHovered }

  return (
    <>
      {/* Overlay mobile/tablette */}
      {(isMobile || isTablet) && isOpen && (
        <div className="sidebar-overlay active" onClick={close} />
      )}

      {/* Tooltip flottant, rendu dans document.body via portail */}
      <SidebarTooltip hovered={isDesktop && !isOpen ? hovered : null} />

      {/* ── Flèche collapse flottante ── */}
      {isDesktop && (
        <button
          onClick={toggle}
          title={isOpen ? 'Réduire' : 'Développer'}
          style={{
            position: 'fixed', top: 52, left: sidebarWidth - 12, zIndex: 300,
            width: 24, height: 24, borderRadius: '50%',
            backgroundColor: '#ffffff', border: '1.5px solid #D6E8DC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#1B4D2E', padding: 0,
            boxShadow: '0 2px 8px rgba(27,77,46,0.18)',
            transition: 'left 0.25s ease, background-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E6F4ED'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          {isOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      )}

      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: sidebarWidth,
        backgroundColor: '#1B4D2E',
        backgroundImage: `
          radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
          radial-gradient(ellipse at 60% 0%, rgba(0,133,63,0.25) 0%, transparent 55%),
          radial-gradient(ellipse at 20% 100%, rgba(232,160,32,0.08) 0%, transparent 50%)
        `,
        backgroundSize: '18px 18px, 100% 100%, 100% 100%',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        zIndex: 200,
        transform: (!isDesktop && !isOpen) ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'width 0.25s ease, transform 0.25s ease',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 10, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <img src="/Logo.png" alt="LEGACY" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
          {(isOpen || !isDesktop) && (
            <span style={{
              fontFamily: BRAND_FONT, fontSize: 15, fontWeight: 700,
              color: '#E8A020', letterSpacing: '2px', whiteSpace: 'nowrap', textShadow: BRAND_GLOW,
            }}>
              {BRAND_NAME}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>

          {/* Section Général, label visible admins seulement */}
          <SectionLabel label="Général" visible={showLabels && !!user?.is_admin} />
          {GENERAL_ITEMS.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} {...navItemProps} />
          ))}

          {/* Section Administration (admin uniquement) */}
          {user?.is_admin && (
            <>
              <div style={{
                margin: '10px 16px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }} />
              <SectionLabel label="Administration" visible={showLabels} />
              {ADMIN_ITEMS.map(({ to, label, Icon, end }) => (
                <NavItem key={to} to={to} label={label} Icon={Icon} end={end} {...navItemProps} />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{
          padding: isOpen ? '14px 20px' : '14px 0',
          textAlign: isOpen ? 'left' : 'center',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'rgba(168,201,181,0.5)',
          flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          {isOpen ? 'Legacy Platform · v1.0' : 'v1'}
        </div>
      </aside>
    </>
  )
}
