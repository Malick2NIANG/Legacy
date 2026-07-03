/**
 * NotebookPage - Editeur de scripts Python simplifie.
 * Execute du code cote serveur et affiche stdout / stderr en temps reel.
 */
import React, { useState, useRef } from 'react'
import { Play, Terminal, Trash2, Copy, CheckCheck, AlertCircle, Clock } from 'lucide-react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import useLayout  from '../hooks/useLayout'
import api        from '../services/api'

const EXAMPLES = [
  {
    label: 'Hello World',
    code: 'print("Hello from Legacy Platform!")\nprint("Python est operationnel.")',
  },
  {
    label: 'Stats basiques',
    code: `import statistics
data = [4, 8, 15, 16, 23, 42]
print(f"Moyenne  : {statistics.mean(data):.2f}")
print(f"Mediane  : {statistics.median(data):.2f}")
print(f"Ecart-type: {statistics.stdev(data):.2f}")`,
  },
  {
    label: 'NumPy / Sklearn',
    code: `import numpy as np
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = make_classification(n_samples=200, n_features=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=50, random_state=42)
clf.fit(X_train, y_train)
acc = accuracy_score(y_test, clf.predict(X_test))
print(f"Accuracy RandomForest : {acc * 100:.1f}%")`,
  },
]

export default function NotebookPage() {
  const { mainStyle } = useLayout()
  const [code,     setCode]     = useState(EXAMPLES[0].code)
  const [output,   setOutput]   = useState(null)   // { stdout, stderr, returncode, truncated }
  const [running,  setRunning]  = useState(false)
  const [elapsed,  setElapsed]  = useState(null)
  const [copied,   setCopied]   = useState(false)
  const [timeout,  setTimeout_] = useState(30)
  const timerRef = useRef(null)

  const run = async () => {
    if (!code.trim() || running) return
    setRunning(true)
    setOutput(null)
    setElapsed(null)
    const t0 = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - t0) / 1000).toFixed(1))
    }, 100)
    try {
      const res = await api.post('/notebooks/execute', { code, timeout })
      setOutput(res.data)
    } catch (err) {
      setOutput({
        stdout: '',
        stderr: err?.response?.data?.detail || 'Erreur reseau ou serveur.',
        returncode: 1,
        truncated: false,
      })
    } finally {
      setRunning(false)
      clearInterval(timerRef.current)
      setElapsed(((Date.now() - t0) / 1000).toFixed(1))
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el  = e.target
      const s   = el.selectionStart
      const end = el.selectionEnd
      const next = code.substring(0, s) + '    ' + code.substring(end)
      setCode(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4 })
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      run()
    }
  }

  const copyOutput = () => {
    const text = (output?.stdout || '') + (output?.stderr || '')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const hasStdout = output && output.stdout.trim().length > 0
  const hasStderr = output && output.stderr.trim().length > 0
  const isSuccess = output && output.returncode === 0

  return (
    <div style={{ fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#F4F7F5', minHeight: '100vh' }}>
      <Sidebar />
      <Navbar />
      <main className="main-content" style={mainStyle}>
        <div style={{ padding: '32px', flex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
                Notebook Python
              </h1>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
                Executez du code Python directement — NumPy, Pandas, Sklearn disponibles
              </p>
            </div>

            {/* Timeout selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color="#9CA3AF" />
              <span style={{ fontSize: 12, color: '#6B7280' }}>Timeout</span>
              <select
                value={timeout}
                onChange={e => setTimeout_(Number(e.target.value))}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                  fontSize: 12, color: '#374151', backgroundColor: '#fff' }}
              >
                {[10, 20, 30, 45, 60].map(t => (
                  <option key={t} value={t}>{t}s</option>
                ))}
              </select>
            </div>
          </div>

          {/* Exemples rapides */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => { setCode(ex.code); setOutput(null) }}
                style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #D1D5DB',
                  fontSize: 12, color: '#374151', backgroundColor: '#fff', cursor: 'pointer',
                  fontWeight: 500, transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Editeur */}
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}>
            {/* Barre editeur */}
            <div style={{ backgroundColor: '#1F2937', padding: '10px 16px', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={14} color="#9CA3AF" />
                <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>script.py</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCode(''); setOutput(null) }}
                  title="Effacer" style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px',
                    borderRadius: 5 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={12} /> Effacer
                </button>
                <button onClick={run} disabled={running || !code.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 16px', borderRadius: 6,
                    backgroundColor: running ? '#374151' : '#00853F',
                    color: '#fff', border: 'none',
                    fontSize: 12, fontWeight: 600,
                    cursor: (running || !code.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (!code.trim() && !running) ? 0.5 : 1,
                    transition: 'background-color 0.15s',
                  }}
                >
                  {running ? (
                    <>
                      <span style={{ display: 'inline-block', width: 12, height: 12,
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      {elapsed ? `${elapsed}s` : 'Execution...'}
                    </>
                  ) : (
                    <><Play size={12} /> Executer (Ctrl+Enter)</>
                  )}
                </button>
              </div>
            </div>

            {/* Zone de code */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKey}
              spellCheck={false}
              placeholder="# Ecrivez votre code Python ici..."
              style={{
                width: '100%', minHeight: 280, padding: '16px 20px',
                fontFamily: '"Fira Code", "Consolas", "Courier New", monospace',
                fontSize: 13, lineHeight: 1.6,
                backgroundColor: '#111827', color: '#E5E7EB',
                border: 'none', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', tabSize: 4,
                caretColor: '#10B981',
              }}
            />
          </div>

          {/* Sortie */}
          {output && (
            <div style={{ borderRadius: 12, backgroundColor: '#111827',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {/* Barre sortie */}
              <div style={{ padding: '10px 16px', backgroundColor: '#1F2937',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: isSuccess ? '#10B981' : '#EF4444',
                  }} />
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {isSuccess ? 'Execution reussie' : `Erreur (code ${output.returncode})`}
                    {elapsed && <span style={{ marginLeft: 8, color: '#6B7280' }}>· {elapsed}s</span>}
                  </span>
                </div>
                <button onClick={copyOutput} title="Copier la sortie"
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, padding: '3px 8px', borderRadius: 5 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {copied ? <><CheckCheck size={12} color="#10B981" /> Copie</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>

              {/* Contenu */}
              <div style={{ padding: '16px 20px', maxHeight: 400, overflowY: 'auto' }}>
                {hasStdout && (
                  <pre style={{ margin: 0, fontFamily: '"Fira Code","Consolas","Courier New",monospace',
                    fontSize: 12, lineHeight: 1.7, color: '#D1FAE5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {output.stdout}
                  </pre>
                )}
                {hasStderr && (
                  <pre style={{ margin: hasStdout ? '12px 0 0' : 0,
                    fontFamily: '"Fira Code","Consolas","Courier New",monospace',
                    fontSize: 12, lineHeight: 1.7, color: '#FCA5A5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {output.stderr}
                  </pre>
                )}
                {!hasStdout && !hasStderr && (
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                    (aucune sortie)
                  </p>
                )}
                {output.truncated && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                    marginTop: 10, padding: '6px 10px', backgroundColor: '#292524',
                    borderRadius: 6, fontSize: 11, color: '#D97706' }}>
                    <AlertCircle size={12} />
                    Sortie tronquee a 50 000 caracteres.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
        <PageFooter />
      </main>
    </div>
  )
}
