/**
 * RegisterPage — inscription en 4 étapes (stepper sur une seule page)
 */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, User, Globe, BarChart2, Lightbulb, CheckCircle } from 'lucide-react'
import { BRAND_NAME, BRAND_GREEN, BRAND_FONT } from '../brand'
import AuthCarousel from '../components/auth/AuthCarousel'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

const GREEN  = '#00853F'
const GREEN2 = '#1B4D2E'

const COUNTRIES = [
  "Algérie","Allemagne","Belgique","Bénin","Burkina Faso","Cameroun","Canada",
  "Côte d'Ivoire","Congo (RDC)","Espagne","États-Unis","France","Gabon","Ghana",
  "Guinée","Italie","Madagascar","Mali","Maroc","Mauritanie","Niger","Nigeria",
  "Pays-Bas","Portugal","République du Congo","Rwanda","Sénégal","Suisse",
  "Togo","Tunisie","Royaume-Uni","Autre"
].sort()

const USAGE_OPTIONS = [
  { value: 'studies',  label: 'Études'               },
  { value: 'work',     label: 'Projet professionnel'  },
  { value: 'research', label: 'Recherche académique'  },
  { value: 'personal', label: 'Curiosité personnelle' },
  { value: 'other',    label: 'Autre'                 },
]

const DISCOVERY_OPTIONS = [
  { value: 'word_of_mouth', label: 'Bouche à oreille'   },
  { value: 'social',        label: 'Réseaux sociaux'    },
  { value: 'web',           label: 'Web / Google'       },
  { value: 'school',        label: 'Université / École' },
  { value: 'other',         label: 'Autre'              },
]

const STEPS = [
  { icon: User,      label: 'Compte'     },
  { icon: Globe,     label: 'Profil'     },
  { icon: BarChart2, label: 'Usage'      },
  { icon: Lightbulb, label: 'Découverte' },
]

function InputField({ label, icon: Icon, type='text', value, onChange, placeholder, required, rightEl }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4 }}>
        {label}{required && <span style={{ color:'#EF4444' }}> *</span>}
      </label>
      <div style={{ position:'relative' }}>
        {Icon && <Icon size={14} color="#9CA3AF" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          style={{ width:'100%', boxSizing:'border-box', padding:`9px ${rightEl?'36px':'12px'} 9px ${Icon?'34px':'12px'}`, borderRadius:8, border:'1px solid #E5E7EB', backgroundColor:'#F9FAFB', color:'#111827', fontSize:13, outline:'none' }} />
        {rightEl && <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)' }}>{rightEl}</div>}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:4 }}>
        {label}{required && <span style={{ color:'#EF4444' }}> *</span>}
      </label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', backgroundColor:'#F9FAFB', color:value?'#111827':'#9CA3AF', fontSize:13, outline:'none' }}>
        <option value="">Sélectionner…</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function PillGroup({ options, value, onChange, multi=false }) {
  const sel = (v) => multi ? (value||[]).includes(v) : value===v
  const tog = (v) => {
    if (multi) {
      const cur = value||[]
      onChange(cur.includes(v) ? cur.filter(x=>x!==v) : [...cur,v])
    } else onChange(v)
  }
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
      {options.map(({value:v,label})=>(
        <button key={v} type="button" onClick={()=>tog(v)} style={{ padding:'6px 13px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:`1.5px solid ${sel(v)?GREEN:'#E5E7EB'}`, backgroundColor:sel(v)?'#E6F4ED':'#F9FAFB', color:sel(v)?GREEN2:'#6B7280', display:'flex', alignItems:'center', gap:5 }}>
          {sel(v) && <CheckCircle size={10}/>}
          {label}
        </button>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPwd,  setShowPwd]  = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [form, setForm] = useState({
    first_name:'', last_name:'', email:'', password:'', confirm:'',
    country:'', gender:'', age_range:'',
    usage_reasons:[], ml_level:'',
    discovery_source:'',
  })
  const set = (k) => (v) => setForm(f=>({...f,[k]:v?.target?v.target.value:v}))

  const validate = () => {
    if (step===1) {
      if (!form.first_name.trim())          return 'Le prénom est requis.'
      if (!form.last_name.trim())           return 'Le nom est requis.'
      if (!form.email.trim())               return "L'email est requis."
      if (form.password.length<8)           return 'Le mot de passe doit faire au moins 8 caractères.'
      if (form.password!==form.confirm)     return 'Les mots de passe ne correspondent pas.'
    }
    if (step===2) {
      if (!form.country)   return 'Veuillez sélectionner votre pays.'
      if (!form.age_range) return "Veuillez sélectionner votre tranche d'âge."
    }
    if (step===3) {
      if (!form.usage_reasons.length) return "Sélectionnez au moins une raison d'utilisation."
      if (!form.ml_level)             return 'Indiquez votre niveau en Data Science.'
    }
    if (step===4) {
      if (!form.discovery_source) return 'Indiquez comment vous avez découvert Legacy.'
    }
    return null
  }

  const next = () => { const e=validate(); if(e){toast.error(e);return} setStep(s=>s+1) }

  const submit = async () => {
    const e=validate(); if(e){toast.error(e);return}
    setLoading(true)
    try {
      await api.post('/auth/register', {
        first_name:form.first_name, last_name:form.last_name,
        email:form.email, password:form.password,
        country:form.country, gender:form.gender||'unspecified',
        age_range:form.age_range, usage_reasons:form.usage_reasons,
        ml_level:form.ml_level, discovery_source:form.discovery_source,
      })
      toast.success('Bienvenue ! Votre compte a bien été créé.')
      navigate('/login')
    } catch(err) {
      const d=err?.response?.data?.detail||''
      if(d.includes('existe')) toast.error('Un compte avec cet email existe déjà.')
      else toast.error("Une erreur est survenue lors de l'inscription.")
    } finally { setLoading(false) }
  }

  const EyeBtn = ({show,onToggle}) => (
    <button type="button" onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:2 }}>
      {show ? <EyeOff size={14}/> : <Eye size={14}/>}
    </button>
  )

  const progress = ((step-1)/(STEPS.length-1))*100

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'Inter, Segoe UI, sans-serif', overflow:'hidden' }}>
      <div className="auth-form-panel" style={{ flex:1, display:'flex', flexDirection:'column', backgroundColor:'#fff', overflow:'hidden' }}>

        <div style={{ padding:'12px clamp(16px,4vw,40px) 0', flexShrink:0 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#6B7280', fontSize:13, textDecoration:'none' }}
            onMouseEnter={e=>e.currentTarget.style.color=GREEN} onMouseLeave={e=>e.currentTarget.style.color='#6B7280'}>
            <ArrowLeft size={14}/> Retour à l'accueil
          </Link>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 clamp(20px,6vw,56px)' }}>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:12 }}>
            <img src="/Logo.png" alt="LEGACY" style={{ width:34, height:34, objectFit:'contain', marginBottom:5 }}/>
            <span style={{ fontFamily:BRAND_FONT, fontSize:15, fontWeight:700, color:BRAND_GREEN, letterSpacing:'4px' }}>{BRAND_NAME}</span>
          </div>

          <h2 style={{ margin:'0 0 2px', fontSize:17, fontWeight:700, color:'#111827', textAlign:'center' }}>Créer un compte</h2>
          <p style={{ margin:'0 0 10px', fontSize:12, color:'#6B7280', textAlign:'center' }}>
            Déjà inscrit ?{' '}<Link to="/login" style={{ color:GREEN, fontWeight:600, textDecoration:'none' }}>Se connecter</Link>
          </p>

          {/* Stepper */}
          <div style={{ marginBottom:12 }}>
            <div style={{ height:3, backgroundColor:'#E5E7EB', borderRadius:4, marginBottom:8, overflow:'hidden' }}>
              <div style={{ height:'100%', backgroundColor:GREEN, borderRadius:4, width:`${progress}%`, transition:'width 0.3s ease' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              {STEPS.map(({icon:Icon,label},i)=>{
                const n=i+1, done=n<step, cur=n===step
                return (
                  <div key={n} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:done?GREEN:cur?'#E6F4ED':'#F3F4F6', border:`2px solid ${done||cur?GREEN:'#E5E7EB'}`, transition:'all 0.25s' }}>
                      {done ? <CheckCircle size={12} color="#fff"/> : <Icon size={11} color={cur?GREEN:'#9CA3AF'}/>}
                    </div>
                    <span style={{ fontSize:10, fontWeight:cur?700:400, color:cur?GREEN2:'#9CA3AF' }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Étape 1 — Compte */}
          {step===1 && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <InputField label="Prénom" icon={User} value={form.first_name} onChange={set('first_name')} placeholder="Malick" required/>
                <InputField label="Nom"    icon={User} value={form.last_name}  onChange={set('last_name')}  placeholder="Niang"  required/>
              </div>
              <InputField label="Email" icon={Mail} type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com" required/>
              <InputField label="Mot de passe" icon={Lock} type={showPwd?'text':'password'} value={form.password} onChange={set('password')} placeholder="8 caractères minimum" required
                rightEl={<EyeBtn show={showPwd} onToggle={()=>setShowPwd(v=>!v)}/>}/>
              <InputField label="Confirmer" icon={Lock} type={showConf?'text':'password'} value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required
                rightEl={<EyeBtn show={showConf} onToggle={()=>setShowConf(v=>!v)}/>}/>
            </div>
          )}

          {/* Étape 2 — Profil */}
          {step===2 && (
            <div>
              <SelectField label="Pays" value={form.country} onChange={set('country')} options={COUNTRIES} required/>
              <div style={{ marginBottom:10 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 7px' }}>Sexe</p>
                <PillGroup options={[{value:'male',label:'Homme'},{value:'female',label:'Femme'},{value:'unspecified',label:'Non précisé'}]} value={form.gender} onChange={set('gender')}/>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 7px' }}>Tranche d'âge <span style={{ color:'#EF4444' }}>*</span></p>
                <PillGroup options={[{value:'18-24',label:'18–24 ans'},{value:'25-34',label:'25–34 ans'},{value:'35-44',label:'35–44 ans'},{value:'45+',label:'45 ans et +'}]} value={form.age_range} onChange={set('age_range')}/>
              </div>
            </div>
          )}

          {/* Étape 3 — Usage */}
          {step===3 && (
            <div>
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 7px' }}>
                  Pourquoi utilisez-vous Legacy ? <span style={{ color:'#EF4444' }}>*</span>
                  <span style={{ fontWeight:400, color:'#9CA3AF', marginLeft:4 }}>(plusieurs choix)</span>
                </p>
                <PillGroup options={USAGE_OPTIONS} value={form.usage_reasons} onChange={set('usage_reasons')} multi/>
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 7px' }}>Niveau en Data Science <span style={{ color:'#EF4444' }}>*</span></p>
                <PillGroup options={[{value:'beginner',label:'Débutant'},{value:'intermediate',label:'Intermédiaire'},{value:'advanced',label:'Avancé'}]} value={form.ml_level} onChange={set('ml_level')}/>
              </div>
            </div>
          )}

          {/* Étape 4 — Découverte */}
          {step===4 && (
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 3px' }}>
                Comment avez-vous entendu parler de Legacy ? <span style={{ color:'#EF4444' }}>*</span>
              </p>
              {DISCOVERY_OPTIONS.map(({value:v,label})=>(
                <label key={v} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:10, cursor:'pointer', border:`1.5px solid ${form.discovery_source===v?GREEN:'#E5E7EB'}`, backgroundColor:form.discovery_source===v?'#E6F4ED':'#F9FAFB', transition:'all 0.15s' }}>
                  <input type="radio" name="discovery" value={v} checked={form.discovery_source===v} onChange={()=>set('discovery_source')(v)} style={{ accentColor:GREEN, flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight:form.discovery_source===v?600:400, color:form.discovery_source===v?GREEN2:'#374151' }}>{label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            {step>1 && (
              <button type="button" onClick={()=>setStep(s=>s-1)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #D6E8DC', backgroundColor:'transparent', color:'#374151', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <ArrowLeft size={14}/> Précédent
              </button>
            )}
            {step<4 ? (
              <button type="button" onClick={next} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', backgroundColor:GREEN, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                Suivant <ArrowRight size={14}/>
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={loading} style={{ flex:1, padding:'10px', borderRadius:8, border:'none', backgroundColor:loading?'#9CA3AF':GREEN, color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer' }}>
                {loading?'Création…':'Créer mon compte'}
              </button>
            )}
          </div>

          <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', margin:'8px 0 0' }}>Étape {step} sur {STEPS.length}</p>
        </div>
      </div>

      <AuthCarousel/>
    </div>
  )
}
