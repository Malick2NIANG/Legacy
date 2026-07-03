import React, { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import useLayout  from '../hooks/useLayout'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const GREEN = '#00853F', GREEN2 = '#1B4D2E'

const ACTION_LABELS = {
  create_user              : 'Compte créé',
  edit_user                : 'Profil modifié',
  promote                  : 'Promu admin',
  promote_requested        : 'Promotion demandée',
  demote                   : 'Rétrogradé',
  demote_requested         : 'Rétrogradation demandée',
  activate_user            : 'Compte activé',
  activate_user_requested  : 'Activation demandée',
  deactivate_user          : 'Compte suspendu',
  deactivate_user_requested: 'Suspension demandée',
  delete_user              : 'Compte supprimé',
  delete_requested         : 'Suppression demandée',
  approve_action           : 'Action approuvée',
  reject_action            : 'Action rejetée',
}
const ACTION_COLOR = {
  create_user              : '#2563EB', edit_user                : '#6B7280',
  promote                  : GREEN,     promote_requested        : '#059669',
  demote                   : '#D97706', demote_requested         : '#D97706',
  activate_user            : GREEN,     activate_user_requested  : GREEN,
  deactivate_user          : '#DC2626', deactivate_user_requested: '#DC2626',
  delete_user              : '#DC2626', delete_requested         : '#DC2626',
  approve_action           : GREEN,     reject_action            : '#DC2626',
}
const ACTION_BG = {
  create_user              : '#EFF6FF', edit_user                : '#F9FAFB',
  promote                  : '#E6F4ED', promote_requested        : '#ECFDF5',
  demote                   : '#FFFBEB', demote_requested         : '#FFFBEB',
  activate_user            : '#E6F4ED', activate_user_requested  : '#E6F4ED',
  deactivate_user          : '#FEF2F2', deactivate_user_requested: '#FEF2F2',
  delete_user              : '#FEF2F2', delete_requested         : '#FEF2F2',
  approve_action           : '#E6F4ED', reject_action            : '#FEF2F2',
}

const DETAIL_KEYS = {
  action_id        : "ID de l'action",
  action_type      : "Type d'action",
  target_email     : 'Email cible',
  email            : 'Email',
  pending_action_id: 'Action en attente n°',
  old_email        : 'Ancien email',
  new_email        : 'Nouvel email',
  reason           : 'Raison',
  note             : 'Note',
}

const fmt = (iso) => iso
  ? new Date(iso).toLocaleString('fr-FR', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
  : ''

const TH = ({children}) => (
  <th style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,
    color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>
    {children}
  </th>
)
const TD = ({children, style={}}) => (
  <td style={{padding:'11px 14px', verticalAlign:'middle', ...style}}>{children}</td>
)

function PBtn({children, onClick, disabled, active}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:'5px 10px',borderRadius:7,
        border:`1px solid ${active ? GREEN : '#E5E7EB'}`,
        backgroundColor: active ? GREEN : disabled ? '#F9FAFB' : '#fff',
        color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: active ? 700 : 400,
        fontSize:13, display:'flex', alignItems:'center'}}>
      {children}
    </button>
  )
}

function Avatar({name, email, size=32}) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',
      background:`linear-gradient(135deg,${GREEN2},${GREEN})`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*0.35,fontWeight:700,color:'#fff',flexShrink:0}}>
      {(name||email||'?').slice(0,2).toUpperCase()}
    </div>
  )
}

function DetailsModal({log, onClose}) {
  const hasDetails = log.details && Object.keys(log.details).length > 0
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',zIndex:1100,
        display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{backgroundColor:'#fff',borderRadius:14,width:'100%',maxWidth:480,
        boxShadow:'0 20px 60px rgba(0,0,0,0.22)',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          padding:'16px 20px',borderBottom:'1px solid #F0F7F3',backgroundColor:'#F9FAFB'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,
              backgroundColor:ACTION_BG[log.action_type]||'#F9FAFB',
              color:ACTION_COLOR[log.action_type]||'#6B7280'}}>
              {ACTION_LABELS[log.action_type]||log.action_type}
            </span>
            <span style={{fontSize:12,color:'#9CA3AF'}}>{fmt(log.created_at)}</span>
          </div>
          <button onClick={onClose}
            style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex',alignItems:'center'}}>
            <X size={17}/>
          </button>
        </div>
        <div style={{padding:'20px'}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',
              letterSpacing:'0.5px',marginBottom:8}}>Administrateur</div>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
              backgroundColor:'#F4F7F5',borderRadius:10}}>
              <Avatar name={log.admin_name} email={log.admin_email} size={36}/>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:'#111827'}}>{log.admin_name||log.admin_email}</div>
                {log.admin_name && <div style={{fontSize:11,color:'#9CA3AF'}}>{log.admin_email}</div>}
              </div>
            </div>
          </div>
          {(log.target_name||log.target_email) && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',
                letterSpacing:'0.5px',marginBottom:8}}>Utilisateur cible</div>
              <div style={{padding:'10px 14px',backgroundColor:'#F4F7F5',borderRadius:10}}>
                <div style={{fontWeight:600,fontSize:13,color:'#111827'}}>{log.target_name||''}</div>
                {log.target_email && <div style={{fontSize:11,color:'#9CA3AF'}}>{log.target_email}</div>}
              </div>
            </div>
          )}
          {hasDetails && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',
                letterSpacing:'0.5px',marginBottom:8}}>Informations</div>
              <div style={{borderRadius:10,border:'1px solid #E5E7EB',overflow:'hidden'}}>
                {Object.entries(log.details).map(([k,v],i)=>(
                  <div key={k} style={{display:'flex',alignItems:'center',
                    padding:'9px 14px',
                    backgroundColor:i%2===0?'#FAFAFA':'#fff',
                    borderTop: i>0?'1px solid #F3F4F6':'none'}}>
                    <span style={{fontSize:12,color:'#6B7280',width:180,flexShrink:0}}>
                      {DETAIL_KEYS[k]||k}
                    </span>
                    <span style={{fontSize:12,fontWeight:600,color:'#111827',
                      fontFamily:'monospace',wordBreak:'break-all'}}>
                      {k==='action_type' ? (ACTION_LABELS[v]||v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!hasDetails && !(log.target_name||log.target_email) && (
            <p style={{fontSize:13,color:'#9CA3AF',textAlign:'center',margin:'8px 0'}}>
              Aucun détail supplémentaire.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuditPage() {
  const {mainStyle} = useLayout()
  const toast       = useToast()
  const [logs,setLogs]           = useState([])
  const [total,setTotal]         = useState(0)
  const [loading,setLoading]     = useState(true)
  const [search,setSearch]       = useState('')
  const [actionFilter,setAction] = useState('')
  const [page,setPage]           = useState(1)
  const [rowsPerPage,setRows]    = useState(20)
  const [detailLog,setDetailLog] = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({page, per_page:rowsPerPage})
      if (actionFilter) params.set('action_type', actionFilter)
      if (search)       params.set('admin_email', search)
      const res = await api.get(`/admin/audit?${params}`)
      setLogs(res.data.items)
      setTotal(res.data.total)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }, [page, rowsPerPage, actionFilter, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))
  const ALL_ACTIONS = Object.entries(ACTION_LABELS).map(([k,v]) => ({key:k,label:v}))
  const from = total > 0 ? (page-1)*rowsPerPage+1 : 0
  const to   = Math.min(page*rowsPerPage, total)

  return (
    <div style={{fontFamily:'Inter, Segoe UI, sans-serif',backgroundColor:'#F4F7F5',minHeight:'100vh'}}>
      <Sidebar/><Navbar/>
      <main style={{...mainStyle, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'clamp(16px,3vw,32px)'}}>
          <div style={{marginBottom:24}}>
            <h1 style={{fontSize:22,fontWeight:700,color:'#111827',margin:'0 0 4px'}}>Journal d&apos;audit</h1>
            <p style={{color:'#6B7280',fontSize:14,margin:0}}>Traçabilité de toutes les actions administratives.</p>
          </div>

          <div style={{backgroundColor:'#fff',borderRadius:12,border:'1px solid #D6E8DC',
            boxShadow:'0 1px 4px rgba(27,77,46,0.06)'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #F0F7F3',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#111827',margin:0}}>Entrées</h3>
              <span style={{fontSize:12,color:'#6B7280'}}>{total} entrée{total!==1?'s':''}</span>
            </div>

            <div style={{padding:'16px 20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{position:'relative',flex:1,minWidth:200,maxWidth:380}}>
                  <Search size={14} color="#9CA3AF"
                    style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                  <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
                    placeholder="Filtrer par email admin…"
                    style={{width:'100%',boxSizing:'border-box',padding:'8px 12px 8px 32px',
                      borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#F9FAFB',
                      fontSize:13,outline:'none',color:'#111827'}}/>
                </div>
                <select value={actionFilter} onChange={e=>{setAction(e.target.value);setPage(1)}}
                  style={{padding:'8px 12px',borderRadius:8,border:'1px solid #E5E7EB',
                    backgroundColor:'#F9FAFB',fontSize:13,color:'#374151',cursor:'pointer',flexShrink:0}}>
                  <option value="">Toutes les actions</option>
                  {ALL_ACTIONS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>

              {loading ? (
                <div style={{padding:40,textAlign:'center',color:'#9CA3AF',fontSize:14}}>Chargement…</div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead>
                      <tr style={{backgroundColor:GREEN2}}>
                        <TH>Date &amp; heure</TH>
                        <TH>Admin</TH>
                        <TH>Action</TH>
                        <TH>Cible</TH>
                        <TH>Détails</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length===0 && (
                        <tr><td colSpan={5} style={{padding:'40px',textAlign:'center',color:'#9CA3AF',fontSize:13}}>
                          Aucune entrée dans le journal
                        </td></tr>
                      )}
                      {logs.map((l,i)=>{
                        const hasDetails = l.details && Object.keys(l.details).length > 0
                        const hasInfo    = hasDetails || l.target_name || l.target_email
                        return (
                          <tr key={l.id}
                            style={{borderTop:i>0?'1px solid #F0F7F3':'none'}}
                            onMouseEnter={e=>e.currentTarget.style.backgroundColor='#FAFFFE'}
                            onMouseLeave={e=>e.currentTarget.style.backgroundColor=''}>
                            <TD>
                              <span style={{color:'#6B7280',fontSize:12,whiteSpace:'nowrap'}}>
                                {fmt(l.created_at)}
                              </span>
                            </TD>
                            <TD>
                              <div style={{display:'flex',alignItems:'center',gap:9}}>
                                <Avatar name={l.admin_name} email={l.admin_email} size={30}/>
                                <div>
                                  <div style={{fontWeight:600,color:'#111827',fontSize:12,lineHeight:1.3}}>
                                    {l.admin_name||l.admin_email}
                                  </div>
                                  {l.admin_name && (
                                    <div style={{fontSize:11,color:'#9CA3AF'}}>{l.admin_email}</div>
                                  )}
                                </div>
                              </div>
                            </TD>
                            <TD>
                              <span style={{fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:6,
                                whiteSpace:'nowrap',
                                backgroundColor:ACTION_BG[l.action_type]||'#F9FAFB',
                                color:ACTION_COLOR[l.action_type]||'#6B7280'}}>
                                {l.action_label||ACTION_LABELS[l.action_type]||l.action_type}
                              </span>
                            </TD>
                            <TD>
                              {(l.target_name||l.target_email) ? (
                                <div>
                                  <div style={{fontWeight:500,color:'#374151',fontSize:12}}>{l.target_name||''}</div>
                                  <div style={{fontSize:11,color:'#9CA3AF'}}>{l.target_email}</div>
                                </div>
                              ) : (
                                <span style={{color:'#D1D5DB',fontSize:12}}>—</span>
                              )}
                            </TD>
                            <TD>
                              {hasInfo ? (
                                <button onClick={()=>setDetailLog(l)}
                                  style={{display:'inline-flex',alignItems:'center',gap:5,
                                    padding:'5px 9px',borderRadius:6,border:'1px solid #E5E7EB',
                                    backgroundColor:'#F9FAFB',color:'#374151',cursor:'pointer',
                                    fontSize:12,fontWeight:500,whiteSpace:'nowrap'}}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor=GREEN;e.currentTarget.style.color=GREEN;e.currentTarget.style.backgroundColor='#E6F4ED'}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#374151';e.currentTarget.style.backgroundColor='#F9FAFB'}}>
                                  <Eye size={12}/> Voir
                                </button>
                              ) : (
                                <span style={{color:'#D1D5DB',fontSize:12}}>—</span>
                              )}
                            </TD>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                marginTop:14,fontSize:13,color:'#6B7280',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span>{total>0 ? `${from}–${to} sur ${total}` : 'Aucun résultat'}</span>
                  <span style={{color:'#D1D5DB'}}>·</span>
                  <span>Lignes :</span>
                  <select value={rowsPerPage} onChange={e=>{setRows(Number(e.target.value));setPage(1)}}
                    style={{padding:'4px 8px',borderRadius:6,border:'1px solid #E5E7EB',
                      backgroundColor:'#fff',fontSize:12,color:'#374151',cursor:'pointer'}}>
                    {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {totalPages>1 && (
                  <div style={{display:'flex',gap:4}}>
                    <PBtn onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>
                      <ChevronLeft size={14}/>
                    </PBtn>
                    {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                      const p = totalPages<=5 ? i+1 : Math.max(1,Math.min(totalPages-4,page-2))+i
                                      return <PBtn key={p} onClick={()=>setPage(p)} active={p===page}>{p}</PBtn>
                    })}
                    <PBtn onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>
                      <ChevronRight size={14}/>
                    </PBtn>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <PageFooter/>
      </main>

      {detailLog && <DetailsModal log={detailLog} onClose={()=>setDetailLog(null)}/>}
    </div>
  )
}
