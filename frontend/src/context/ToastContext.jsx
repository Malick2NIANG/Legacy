import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const ToastCtx = createContext(null)

const DURATION = 7000

const CONFIGS = {
  success: { Icon: CheckCircle,   color: '#00853F', bg: '#F0FDF4', border: '#86EFAC' },
  error:   { Icon: AlertCircle,   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  info:    { Icon: Info,          color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  warning: { Icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
}

// ── Barre de progression ──────────────────────────────────────────────────────
function ProgressBar({ color, duration, paused }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 3, borderRadius: '0 0 10px 10px',
      backgroundColor: `${color}22`,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        backgroundColor: color,
        width: '100%',
        transformOrigin: 'left',
        animation: `toast-progress ${duration}ms linear forwards`,
        animationPlayState: paused ? 'paused' : 'running',
      }} />
    </div>
  )
}

// ── Toast individuel ──────────────────────────────────────────────────────────
function ToastItem({ id, type, message, duration, onClose }) {
  const { Icon, color, bg, border } = CONFIGS[type] || CONFIGS.info
  const [mounted, setMounted] = useState(false)
  const [paused,  setPaused]  = useState(false)
  const timerRef = useRef(null)
  const remainingRef = useRef(duration)
  const startRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    startTimer()
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timerRef.current)
    }
  }, [])

  const startTimer = () => {
    startRef.current = Date.now()
    timerRef.current = setTimeout(() => onClose(id), remainingRef.current)
  }

  const handleMouseEnter = () => {
    clearTimeout(timerRef.current)
    remainingRef.current -= Date.now() - startRef.current
    setPaused(true)
  }

  const handleMouseLeave = () => {
    setPaused(false)
    startTimer()
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        padding: '12px 14px 16px 12px',
        minWidth: 290, maxWidth: 390,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        fontFamily: 'Inter, Segoe UI, sans-serif',
        transform: mounted ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.95)',
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.15,0.64,1), opacity 0.25s ease',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500, flex: 1, lineHeight: 1.5 }}>
        {message}
      </span>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', padding: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#374151'}
        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
      >
        <X size={13} />
      </button>

      <ProgressBar color={color} duration={duration} paused={paused} />
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // Injection de la keyframe une seule fois
  useEffect(() => {
    const id = 'toast-keyframes'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = `
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type, message, duration = DURATION) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, type, message, duration }])
  }, [])

  const api = {
    success: (msg, d) => add('success', msg, d),
    error:   (msg, d) => add('error',   msg, d),
    info:    (msg, d) => add('info',    msg, d),
    warning: (msg, d) => add('warning', msg, d),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={{
        position: 'fixed', top: 76, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} onClose={remove} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
