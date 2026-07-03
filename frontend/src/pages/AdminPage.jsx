import React, { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock,
         Users, Trash2, Eye, X, Plus,
         UserCheck, UserX } from 'lucide-react'
import Navbar     from '../components/common/Navbar'
import Sidebar    from '../components/common/Sidebar'
import PageFooter from '../components/common/Footer'
import useLayout  from '../hooks/useLayout'
import useAuthStore from '../store/authStore'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const GREEN = '#00853F', GREEN2 = '#1B4D2E', GOLD = '#E8A020'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : ''

const ACTION_LABELS = {
  create_user:'Compte créé',               edit_user:'Profil modifié',
  promote:'Promu admin',                   promote_requested:'Promotion demandée',
  demote:'Rétrogradé',                     demote_requested:'Rétrogradation demandée',
  activate_user:'Compte activé',           activate_user_requested:'Activation demandée',
  deactivate_user:'Compte suspendu',       deactivate_user_requested:'Suspension demandée',
  delete_user:'Compte supprimé',           delete_requested:'Suppression demandée',
  approve_action:'Action approuvée',       reject_action:'Action rejetée',
}
const ACTION_COLOR = {
  create_user:'#2563EB',             edit_user:'#6B7280',
  promote:GREEN,                     promote_requested:'#059669',
  demote:'#D97706',                  demote_requested:'#D97706',
  activate_user:GREEN,               activate_user_requested:GREEN,
  deactivate_user:'#DC2626',         deactivate_user_requested:'#DC2626',
  delete_user:'#DC2626',             delete_requested:'#DC2626',
  approve_action:GREEN,              reject_action:'#DC2626',
}
const ACTION_BG = {
  create_user:'#EFF6FF',             edit_user:'#F9FAFB',
  promote:'#E6F4ED',                 promote_requested:'#ECFDF5',
  demote:'#FFFBEB',                  demote_requested:'#FFFBEB',
  activate_user:'#E6F4ED',           activate_user_requested:'#E6F4ED',
  deactivate_user:'#FEF2F2',         deactivate_user_requested:'#FEF2F2',
  delete_user:'#FEF2F2',             delete_requested:'#FEF2F2',
  approve_action:'#E6F4ED',          reject_action:'#FEF2F2',
}

// ── Modal de confirmation ─────────────────────────────────────────────────────
function ConfirmModal({title, message, confirmLabel='Confirmer', confirmColor='#DC2626', showReason=false, reasonLabel='Motif (optionnel)', onConfirm, onClose}) {
  const [reason, setReason] = React.useState('')
  return (
    <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.45)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{backgroundColor:'#fff',borderRadius:14,width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.25)',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 22px',borderBottom:'1px solid #F3F4F6'}}>
          <h2 style={{fontSize:15,fontWeight:700,color:'#111827',margin:0}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex',alignItems:'center'}}><X size={17}/></button>
        </div>
        <div style={{padding:'20px 22px'}}>
          <p style={{fontSize:14,color:'#374151',lineHeight:1.6,margin:'0 0 16px'}}>{message}</p>
          {showReason && (
            <div style={{marginBottom:18}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:6}}>{reasonLabel}</label>
              <textarea
                value={reason} onChange={e=>setReason(e.target.value)}
                placeholder="Expliquez brièvement la raison…"
                rows={3}
                style={{width:'100%',boxSizing:'border-box',padding:'9px 12px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#F9FAFB',fontSize:13,color:'#111827',outline:'none',resize:'vertical',fontFamily:'inherit'}}
              />
            </div>
          )}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
            <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#fff',color:'#374151',cursor:'pointer',fontSize:13,fontWeight:500}}>
              Annuler
            </button>
            <button onClick={()=>{onConfirm(reason.trim());onClose()}} style={{padding:'9px 18px',borderRadius:8,border:'none',backgroundColor:confirmColor,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────
function Modal({title,onClose,children,width=480}) {
  return (
    <div style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{backgroundColor:'#fff',borderRadius:14,width:'100%',maxWidth:width,boxShadow:'0 20px 60px rgba(0,0,0,0.2)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 22px',borderBottom:'1px solid #F0F7F3'}}>
          <h2 style={{fontSize:16,fontWeight:700,color:'#111827',margin:0}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:4,display:'flex',alignItems:'center'}}><X size={18}/></button>
        </div>
        <div style={{padding:'20px 22px',overflowY:'auto',flex:1}}>{children}</div>
      </div>
    </div>
  )
}
function Field({label,value}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>{label}</div>
      <div style={{fontSize:14,color:'#111827',fontWeight:500}}>{value||''}</div>
    </div>
  )
}
function FInput({label,value,onChange,type='text',required,placeholder}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:5}}>{label}{required&&<span style={{color:'#EF4444'}}> *</span>}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{width:'100%',boxSizing:'border-box',padding:'9px 12px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#F9FAFB',fontSize:13,color:'#111827',outline:'none'}}/>
    </div>
  )
}
function Btn({onClick,color='#6B7280',bg='#F9FAFB',border='#E5E7EB',children,title,disabled}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      style={{padding:'5px 9px',borderRadius:6,border:`1px solid ${border}`,backgroundColor:bg,color,cursor:disabled?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:500,whiteSpace:'nowrap',opacity:disabled?0.5:1}}>
      {children}
    </button>
  )
}
const TH = ({children}) => <th style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{children}</th>
const TD = ({children,style={}}) => <td style={{padding:'11px 14px',...style}}>{children}</td>

function Avatar({name,email,size=32}) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(135deg,${GREEN2},${GREEN})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.35,fontWeight:700,color:'#fff',flexShrink:0}}>
      {(name||email||'?').slice(0,2).toUpperCase()}
    </div>
  )
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function Controls({search,onSearch,placeholder='Rechercher…'}) {
  return (
    <div style={{position:'relative',width:220}}>
      <Search size={14} color="#9CA3AF" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
      <input value={search} onChange={e=>onSearch(e.target.value)} placeholder={placeholder}
        style={{width:'100%',boxSizing:'border-box',padding:'8px 12px 8px 32px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#F9FAFB',fontSize:13,outline:'none',color:'#111827'}}/>
    </div>
  )
}
function Pager({page,totalPages,setPage,total,rowsPerPage,onRows}) {
  const from=(page-1)*rowsPerPage+1, to=Math.min(page*rowsPerPage,total)
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,fontSize:13,color:'#6B7280',flexWrap:'wrap',gap:8}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span>{total>0?`${from}–${to} sur ${total}`:'Aucun résultat'}</span>
        <span style={{color:'#D1D5DB'}}>·</span>
        <span>Lignes :</span>
        <select value={rowsPerPage} onChange={e=>onRows(Number(e.target.value))}
          style={{padding:'4px 8px',borderRadius:6,border:'1px solid #E5E7EB',backgroundColor:'#fff',fontSize:12,color:'#374151',cursor:'pointer'}}>
          {[5,10,25,50].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      {totalPages>1&&(
        <div style={{display:'flex',gap:4}}>
          <PBtn onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><ChevronLeft size={14}/></PBtn>
          {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
            const p=totalPages<=5?i+1:Math.max(1,Math.min(totalPages-4,page-2))+i
            return <PBtn key={p} onClick={()=>setPage(p)} active={p===page}>{p}</PBtn>
          })}
          <PBtn onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}><ChevronRight size={14}/></PBtn>
        </div>
      )}
    </div>
  )
}
function PBtn({children,onClick,disabled,active}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:'5px 10px',borderRadius:7,border:`1px solid ${active?GREEN:'#E5E7EB'}`,backgroundColor:active?GREEN:disabled?'#F9FAFB':'#fff',color:active?'#fff':disabled?'#D1D5DB':'#374151',cursor:disabled?'default':'pointer',fontWeight:active?700:400,fontSize:13,display:'flex',alignItems:'center'}}>
      {children}
    </button>
  )
}
function useTable(data,filterFn) {
  const [search,setSearch]=useState('')
  const [page,setPage]=useState(1)
  const [rowsPerPage,setRowsPerPage]=useState(10)
  const filtered=data.filter(r=>filterFn(r,search))
  const totalPages=Math.max(1,Math.ceil(filtered.length/rowsPerPage))
  const safePage=Math.min(page,totalPages)
  const paginated=filtered.slice((safePage-1)*rowsPerPage,safePage*rowsPerPage)
  const onSearch=v=>{setSearch(v);setPage(1)}
  const onRows=v=>{setRowsPerPage(v);setPage(1)}
  return {search,onSearch,page:safePage,setPage,rowsPerPage,onRows,paginated,filtered,totalPages}
}

// ── Modales ───────────────────────────────────────────────────────────────────
const ML={beginner:'Débutant',intermediate:'Intermédiaire',advanced:'Avancé',expert:'Expert'}
function ViewModal({user,onClose}) {
  return (
    <Modal title="Profil utilisateur" onClose={onClose}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22,padding:'14px 16px',backgroundColor:'#F4F7F5',borderRadius:10}}>
        <Avatar name={user.full_name} email={user.email} size={48}/>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:'#111827'}}>{user.full_name||''}</div>
          <div style={{fontSize:13,color:'#6B7280'}}>{user.email}</div>
          <div style={{display:'flex',gap:6,marginTop:4}}>
            <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,backgroundColor:user.is_admin?'#E6F4ED':'#EFF6FF',color:user.is_admin?GREEN:'#2563EB'}}>{user.is_admin?'Admin':'Membre'}</span>
            <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,backgroundColor:user.is_active?'#F0FDF4':'#FEF2F2',color:user.is_active?GREEN:'#DC2626'}}>{user.is_active?'Actif':'Inactif'}</span>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
        <Field label="Prénom" value={user.first_name}/>
        <Field label="Nom" value={user.last_name}/>
        <Field label="Pays" value={user.country}/>
        <Field label="Genre" value={user.gender}/>
        <Field label="Tranche d'âge" value={user.age_range}/>
        <Field label="Niveau ML" value={ML[user.ml_level]||user.ml_level}/>
        <Field label="Découverte" value={user.discovery_source}/>
        <Field label="Inscrit le" value={fmtDate(user.created_at)}/>
      </div>
      {user.usage_reasons?.length>0&&(
        <div style={{marginTop:4}}>
          <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Raisons d'utilisation</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {user.usage_reasons.map(r=><span key={r} style={{fontSize:12,padding:'3px 10px',borderRadius:20,backgroundColor:'#E6F4ED',color:GREEN,fontWeight:500}}>{r}</span>)}
          </div>
        </div>
      )}
    </Modal>
  )
}
function EditModal({user,onClose,onSave,toast}) {
  const [form,setForm]=useState({first_name:user.first_name||'',last_name:user.last_name||'',email:user.email||''})
  const [loading,setLoading]=useState(false)
  const set=k=>v=>setForm(f=>({...f,[k]:v}))
  const save=async()=>{
    if(!form.email.trim()){toast.error('Email requis.');return}
    setLoading(true)
    try{const res=await api.patch(`/admin/users/${user.id}/details`,form);toast.success('Profil mis à jour.');onSave(res.data);onClose()}
    catch(e){toast.error(e?.response?.data?.detail||'Erreur.')}
    finally{setLoading(false)}
  }
  return (
    <Modal title="Modifier l'utilisateur" onClose={onClose}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
        <FInput label="Prénom" value={form.first_name} onChange={set('first_name')} placeholder="Prénom"/>
        <FInput label="Nom"    value={form.last_name}  onChange={set('last_name')}  placeholder="Nom"/>
      </div>
      <FInput label="Email" value={form.email} onChange={set('email')} type="email" required placeholder="email@exemple.com"/>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:6}}>
        <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#fff',color:'#374151',cursor:'pointer',fontSize:13}}>Annuler</button>
        <button onClick={save} disabled={loading} style={{padding:'9px 18px',borderRadius:8,border:'none',backgroundColor:GREEN,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,opacity:loading?0.6:1}}>
          {loading?'Enregistrement…':'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}
function CreateModal({onClose,onCreated,toast}) {
  const [form,setForm]=useState({first_name:'',last_name:'',email:''})
  const [loading,setLoading]=useState(false)
  const set=k=>v=>setForm(f=>({...f,[k]:v}))
  const save=async()=>{
    if(!form.first_name.trim()||!form.last_name.trim()||!form.email.trim()){
      toast.error('Tous les champs sont requis.');return
    }
    setLoading(true)
    try{
      await api.post('/admin/users',{...form,is_admin:true})
      toast.success("Compte créé, mot de passe temporaire envoyé par email à l'approbation.")
      onCreated();onClose()
    }
    catch(e){toast.error(e?.response?.data?.detail||'Erreur.')}
    finally{setLoading(false)}
  }
  return (
    <Modal title="Créer un administrateur" onClose={onClose}>
      <p style={{fontSize:13,color:'#6B7280',margin:'0 0 18px',lineHeight:1.6}}>
        Un mot de passe temporaire sera généré et envoyé par email à l'adresse ci-dessous
        dès approbation.
      </p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
        <FInput label="Prénom" required value={form.first_name} onChange={set('first_name')} placeholder="Prénom"/>
        <FInput label="Nom"    required value={form.last_name}  onChange={set('last_name')}  placeholder="Nom"/>
      </div>
      <FInput label="Email" required value={form.email} onChange={set('email')} type="email" placeholder="email@exemple.com"/>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:6}}>
        <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E5E7EB',backgroundColor:'#fff',color:'#374151',cursor:'pointer',fontSize:13}}>Annuler</button>
        <button onClick={save} disabled={loading} style={{padding:'9px 18px',borderRadius:8,border:'none',backgroundColor:GREEN,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,opacity:loading?0.6:1}}>
          {loading?'Création…':'Soumettre la demande'}
        </button>
      </div>
    </Modal>
  )
}

// ── Modal détail action (pending / rejected) ──────────────────────────────────
function ActionDetailModal({action, onClose}) {
  const statusColor = action.status==='pending' ? '#D97706' : '#DC2626'
  const statusBg    = action.status==='pending' ? '#FFFBEB' : '#FEF2F2'
  const statusLabel = action.status==='pending' ? 'En attente' : 'Rejetée'
  return (
    <Modal title="Détail de la demande" onClose={onClose}>
      {/* Badge action + statut */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
        <span style={{fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:6,
          backgroundColor:ACTION_BG[action.action_type]||'#F9FAFB',
          color:ACTION_COLOR[action.action_type]||'#6B7280'}}>
          {ACTION_LABELS[action.action_type]||action.action_type}
        </span>
        <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20,
          backgroundColor:statusBg, color:statusColor}}>
          {statusLabel}
        </span>
      </div>

      {/* Cible */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Utilisateur concerné</div>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',backgroundColor:'#F4F7F5',borderRadius:10}}>
          <Avatar name={action.target_name} email={action.target_email} size={36}/>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:'#111827'}}>{action.target_name||action.target_email}</div>
            {action.target_name && <div style={{fontSize:11,color:'#9CA3AF'}}>{action.target_email}</div>}
          </div>
        </div>
      </div>

      {/* Demandé par */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Demandé par</div>
        <div style={{padding:'10px 14px',backgroundColor:'#F4F7F5',borderRadius:10,fontSize:13,color:'#111827',fontWeight:500}}>
          {action.requested_by_name||action.requested_by_email||'—'}
          {action.requested_by_name && <div style={{fontSize:11,color:'#9CA3AF',fontWeight:400}}>{action.requested_by_email}</div>}
        </div>
      </div>

      {/* Dates */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Soumis le</div>
          <div style={{fontSize:13,color:'#374151',fontWeight:500}}>{fmt(action.created_at)}</div>
        </div>
        {action.resolved_at && (
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Résolu le</div>
            <div style={{fontSize:13,color:'#374151',fontWeight:500}}>{fmt(action.resolved_at)}</div>
          </div>
        )}
      </div>

      {/* Raison / Détails */}
      {action.details?.reason && (
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Raison</div>
          <div style={{padding:'10px 14px',backgroundColor:'#F9FAFB',borderRadius:10,fontSize:13,color:'#374151',lineHeight:1.6,borderLeft:'3px solid #D1D5DB'}}>
            {action.details.reason}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Tab Utilisateurs ──────────────────────────────────────────────────────────
function UtilisateursTab({users,actions,currentUser,reload,toast}) {
  const [filter,setFilter]=useState('approved')
  const [modal,setModal]=useState(null)      // {type:'view'|'create', ...}
  const [confirm,setConfirm]=useState(null)  // {title, message, confirmLabel, confirmColor, onConfirm}
  const [actionDetail,setActionDetail]=useState(null)

  const pending   = actions.filter(a=>a.status==='pending')
  const rejected  = actions.filter(a=>a.status==='rejected')

  // IDs de tous les users qui ont au moins une action en attente
  const usersWithPending = new Set(
    pending.map(a=>a.target_user_id).filter(Boolean)
  )

  // "Approuvés" = admin actif SANS aucune action en attente
  const actives   = users.filter(u=>u.is_active  && u.is_admin && !usersWithPending.has(u.id))
  const inactives = users.filter(u=>!u.is_active && u.is_admin && !usersWithPending.has(u.id))

  const CARDS = [
    {key:'approved', label:'Approuvés',  count:actives.length,   color:GREEN,     bg:'#E6F4ED', border:'#86EFAC', Icon:UserCheck},
    {key:'pending',  label:'En attente', count:pending.length,   color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', Icon:Clock    },
    {key:'suspended',label:'Suspendus',  count:inactives.length, color:'#6B7280', bg:'#F9FAFB', border:'#E5E7EB', Icon:UserX    },
    {key:'rejected', label:'Rejetées',   count:rejected.length,  color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', Icon:XCircle  },
  ]

  // User actions
  const doStatus=(u,active)=>{
    setConfirm({
      title: active ? 'Activer le compte' : 'Suspendre le compte',
      message: active
        ? `Réactiver le compte de ${u.full_name||u.email} ? Si vous êtes plusieurs admins, une approbation sera nécessaire.`
        : `Suspendre le compte de ${u.full_name||u.email} ? Si vous êtes plusieurs admins, une approbation sera nécessaire.`,
      confirmLabel: active ? 'Activer' : 'Suspendre',
      confirmColor: active ? GREEN : '#D97706',
      showReason: !active,
      reasonLabel: 'Motif de la suspension (optionnel)',
      onConfirm: async(reason)=>{
        try{
          const body = {is_active:active}
          if(reason) body.reason=reason
          const res=await api.patch(`/admin/users/${u.id}/status`, body)
          if(res.data?.pending){
            toast.success(active?'Demande d\'activation soumise pour approbation.':'Demande de suspension soumise pour approbation.')
          } else {
            toast.success(active?'Compte activé.':'Compte suspendu.')
          }
          reload()
        }
        catch(e){toast.error(e?.response?.data?.detail||'Erreur.')}
      }
    })
  }
  const doDelete=(u)=>{
    setConfirm({
      title: 'Supprimer le compte',
      message: `Êtes-vous sûr de vouloir supprimer le compte de ${u.full_name||u.email} ? Si vous êtes plusieurs admins, une approbation sera nécessaire.`,
      confirmLabel: 'Supprimer',
      confirmColor: '#DC2626',
      showReason: true,
      reasonLabel: 'Motif de la suppression (optionnel)',
      onConfirm: async(reason)=>{
        try{
          const params=reason?`?reason=${encodeURIComponent(reason)}`:''
          const res=await api.delete(`/admin/users/${u.id}${params}`)
          if(res.data?.pending){
            toast.success('Demande de suppression soumise pour approbation.')
          } else {
            toast.success('Compte supprimé.')
          }
          reload()
        }
        catch(e){toast.error(e?.response?.data?.detail||'Erreur.')}
      }
    })
  }
  // Action (pending) buttons
  const doApprove=async(id)=>{
    try{await api.post(`/admin/actions/${id}/approve`);toast.success('Demande approuvée.');reload()}
    catch(e){toast.error(e?.response?.data?.detail||'Erreur.')}
  }
  const doReject=(id)=>{
    setConfirm({
      title: 'Rejeter la demande',
      message: 'Êtes-vous sûr de vouloir rejeter cette demande ?',
      confirmLabel: 'Rejeter',
      confirmColor: '#DC2626',
      showReason: true,
      reasonLabel: 'Motif du rejet (optionnel)',
      onConfirm: async(reason)=>{
        try{
          await api.post(`/admin/actions/${id}/reject`, reason?{reason}:{})
          toast.success('Demande rejetée.')
          reload()
        }
        catch(e){toast.error(e?.response?.data?.detail||'Erreur.')}
      }
    })
  }

  // Tables
  const userFilter=(u,s)=>{const q=s.toLowerCase();return(u.full_name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)}
  const actionFilter=(a,s)=>{const q=s.toLowerCase();return(a.target_name||'').toLowerCase().includes(q)||(a.target_email||'').toLowerCase().includes(q)||(a.requested_by_email||'').toLowerCase().includes(q)}

  const approvedT =useTable(actives,  userFilter)
  const suspendedT=useTable(inactives, userFilter)
  const pendingT  =useTable(pending,   actionFilter)
  const rejectedT =useTable(rejected,  actionFilter)

  const isUserTab  = filter==='approved'||filter==='suspended'
  const tableState = filter==='approved'?approvedT:filter==='suspended'?suspendedT:filter==='pending'?pendingT:rejectedT
  const tableData  = filter==='approved'?actives:filter==='suspended'?inactives:filter==='pending'?pending:rejected

  return (
    <div>
      {/* Filter cards, en premier */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {CARDS.map(({key,label,count,color,bg,border,Icon})=>(
          <button key={key} onClick={()=>setFilter(key)}
            style={{textAlign:'left',padding:'18px 20px',borderRadius:12,border:`2px solid ${filter===key?color:border}`,backgroundColor:filter===key?bg:'#fff',cursor:'pointer',transition:'all 0.15s',boxShadow:filter===key?`0 2px 12px ${color}22`:'0 1px 4px rgba(27,77,46,0.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,color:filter===key?color:'#6B7280'}}>{label}</span>
              <Icon size={16} color={filter===key?color:'#D1D5DB'}/>
            </div>
            <div style={{fontSize:28,fontWeight:800,color:filter===key?color:'#111827'}}>{count}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{backgroundColor:'#fff',borderRadius:12,border:'1px solid #D6E8DC',boxShadow:'0 1px 4px rgba(27,77,46,0.06)'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid #F0F7F3'}}>
          <h3 style={{fontSize:14,fontWeight:700,color:'#111827',margin:0}}>{CARDS.find(c=>c.key===filter)?.label}</h3>
        </div>
        <div style={{padding:'16px 20px'}}>
          {/* Recherche + bouton créer sur la même ligne (Approuvés seulement) */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <Controls search={tableState.search} onSearch={tableState.onSearch}
              placeholder={isUserTab?'Nom, email…':'Cible, demandeur…'}/>
            {filter==='approved'&&(
              <button onClick={()=>setModal({type:'create'})}
                style={{flexShrink:0,display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,border:'none',backgroundColor:GREEN,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:600,whiteSpace:'nowrap',boxShadow:'0 2px 6px rgba(0,133,63,0.25)'}}>
                <Plus size={13}/> Créer un admin
              </button>
            )}
          </div>
          <div style={{overflowX:'auto'}}>
            {isUserTab ? (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{backgroundColor:GREEN2}}>
                  <TH>Administrateur</TH><TH>Email</TH><TH>Inscrit</TH><TH>Actions</TH>
                </tr></thead>
                <tbody>
                  {tableState.paginated.length===0&&<tr><td colSpan={4} style={{padding:'32px',textAlign:'center',color:'#9CA3AF',fontSize:13}}>Aucun administrateur</td></tr>}
                  {tableState.paginated.map((u,i)=>(
                    <tr key={u.id} style={{borderTop:i>0?'1px solid #F0F7F3':'none'}}>
                      <TD>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <Avatar name={u.full_name} email={u.email}/>
                          <span style={{fontWeight:600,color:'#111827'}}>{u.full_name||''}</span>
                        </div>
                      </TD>
                      <TD><span style={{color:'#6B7280',fontSize:12}}>{u.email}</span></TD>
                      <TD><span style={{color:'#9CA3AF',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(u.created_at)}</span></TD>
                      <TD>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                          <Btn onClick={()=>setModal({type:'view',user:u})} title="Voir"><Eye size={12}/> Voir</Btn>
                          {filter==='approved'
                            ? <Btn onClick={()=>doStatus(u,false)} color='#D97706' bg='#FFFBEB' border='#FDE68A'
                                title={u.id===currentUser?.id ? 'Votre propre compte' : 'Suspendre'}
                                disabled={u.id===currentUser?.id}>
                                <UserX size={12}/> Suspendre
                              </Btn>
                            : <Btn onClick={()=>doStatus(u,true)} color={GREEN} bg='#E6F4ED' border='#86EFAC' title="Activer">
                                <UserCheck size={12}/> Activer
                              </Btn>
                          }
                          <Btn onClick={()=>doDelete(u)} color='#DC2626' bg='#FEF2F2' border='#FECACA'
                            title={u.id===currentUser?.id ? 'Votre propre compte' : 'Supprimer'}
                            disabled={u.id===currentUser?.id}>
                            <Trash2 size={12}/> Supprimer
                          </Btn>
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{backgroundColor:GREEN2}}>
                  <TH>Action</TH><TH>Cible</TH><TH>Demandé par</TH><TH>Date</TH>
                  {filter==='pending'&&<TH>Décision</TH>}
                  <TH></TH>
                </tr></thead>
                <tbody>
                  {tableState.paginated.length===0&&<tr><td colSpan={filter==='pending'?6:5} style={{padding:'32px',textAlign:'center',color:'#9CA3AF',fontSize:13}}>Aucune demande</td></tr>}
                  {tableState.paginated.map((a,i)=>(
                    <tr key={a.id} style={{borderTop:i>0?'1px solid #F0F7F3':'none'}}>
                      <TD>
                        <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:6,
                          backgroundColor:ACTION_BG[a.action_type]||'#F9FAFB',
                          color:ACTION_COLOR[a.action_type]||'#6B7280'}}>
                          {ACTION_LABELS[a.action_type]||a.action_type}
                        </span>
                      </TD>
                      <TD>
                        <div style={{fontWeight:600,color:'#111827'}}>{a.target_name||''}</div>
                        <div style={{fontSize:11,color:'#9CA3AF'}}>{a.target_email}</div>
                      </TD>
                      <TD><span style={{color:'#6B7280',fontSize:12}}>{a.requested_by_name||a.requested_by_email||''}</span></TD>
                      <TD><span style={{color:'#9CA3AF',fontSize:12,whiteSpace:'nowrap'}}>{fmtDate(a.created_at)}</span></TD>
                      {filter==='pending'&&(
                        <TD>
                          {a.can_approve?(
                            <div style={{display:'flex',gap:6}}>
                              <Btn onClick={()=>doApprove(a.id)} color={GREEN} bg='#E6F4ED' border={`${GREEN}44`}><CheckCircle size={12}/> Approuver</Btn>
                              <Btn onClick={()=>doReject(a.id)}  color='#DC2626' bg='#FEF2F2' border='#FECACA'><XCircle size={12}/> Rejeter</Btn>
                            </div>
                          ):<span style={{fontSize:12,color:'#9CA3AF',fontStyle:'italic'}}>{a.requested_by_id===currentUser?.id ? 'Votre demande' : 'Vous êtes concerné'}</span>}
                        </TD>
                      )}
                      <TD>
                        <Btn onClick={()=>setActionDetail(a)} title="Voir le détail">
                          <Eye size={12}/> Voir
                        </Btn>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pager page={tableState.page} totalPages={tableState.totalPages} setPage={tableState.setPage} total={tableState.filtered.length} rowsPerPage={tableState.rowsPerPage} onRows={tableState.onRows}/>
        </div>
      </div>

      {/* Modals */}
      {modal?.type==='view'   && <ViewModal   user={modal.user} onClose={()=>setModal(null)}/>}
      {modal?.type==='create' && <CreateModal onClose={()=>setModal(null)} onCreated={reload} toast={toast}/>}
      {actionDetail && <ActionDetailModal action={actionDetail} onClose={()=>setActionDetail(null)}/>}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.confirmColor}
          showReason={confirm.showReason||false}
          reasonLabel={confirm.reasonLabel}
          onConfirm={confirm.onConfirm}
          onClose={()=>setConfirm(null)}
        />
      )}
    </div>
  )
}


// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user: currentUser } = useAuthStore()
  const { mainStyle } = useLayout()
  const toast = useToast()
  const [users,   setUsers]   = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/actions'),
      ])
      setUsers(uRes.data)
      setActions(aRes.data)
    } catch(e) { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }, [toast])

  useEffect(() => { reload() }, [reload])

  return (
    <div style={{display:'flex',height:'100vh',backgroundColor:'#F4F7F5',fontFamily:'Inter,Segoe UI,sans-serif',overflow:'hidden'}}>
      <Sidebar/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Navbar/>
        <main style={{...mainStyle,flex:1,overflowY:'auto',padding:'24px clamp(16px,3vw,32px)'}}>
          <div style={{marginBottom:24}}>
            <h1 style={{margin:'0 0 4px',fontSize:22,fontWeight:700,color:'#111827'}}>Utilisateurs</h1>
            <p style={{margin:0,fontSize:14,color:'#6B7280'}}>Gestion des administrateurs et des demandes en cours.</p>
          </div>
          {loading
            ? <p style={{color:'#9CA3AF',fontSize:14}}>Chargement...</p>
            : <UtilisateursTab users={users} actions={actions} currentUser={currentUser} reload={reload} toast={toast}/>
          }
          <PageFooter/>
        </main>
      </div>
    </div>
  )
}
