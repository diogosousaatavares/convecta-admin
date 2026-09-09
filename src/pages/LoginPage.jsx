import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useStore'
import { supabase } from '@/lib/supabase'
import Scene3D from '@/components/Scene3D'

const GOLD = '#C9A227'
const GOLD_HI = '#F5D66B'

/* ── Ícones ──────────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 16, stroke = 1.6, fill = 'none', ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
)
const IcoMail = p => <Ico {...p} d={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></>}/>
const IcoLock = p => <Ico {...p} d={<><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>}/>
const IcoEye = p => <Ico {...p} d={<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>}/>
const IcoEyeOff = p => <Ico {...p} d={<><path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.3 6.4A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.2-.9"/><path d="m2 2 20 20"/></>}/>
const IcoX = p => <Ico {...p} d={<><path d="M18 6 6 18M6 6l12 12"/></>}/>
const IcoCal = p => <Ico {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></>}/>
const IcoUsers = p => <Ico {...p} d={<><circle cx="9" cy="8" r="3.2"/><path d="M2.5 19a6.5 6.5 0 0 1 13 0"/><path d="M17 8.2a3 3 0 0 1 0 5.6M18 19a6 6 0 0 0-2-4.5"/></>}/>
const IcoScissors = p => <Ico {...p} d={<><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></>}/>
const IcoShield = p => <Ico {...p} d={<><path d="M12 2.5 20 6v6c0 4.5-3.2 8.4-8 9.5-4.8-1.1-8-5-8-9.5V6Z"/><path d="m9 12 2 2 4-4"/></>}/>

/* ── Fundo decorativo ────────────────────────────────────────────────────── */
function Fundo() {
  return (
    <>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="arcoA" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0"/>
            <stop offset="42%" stopColor={GOLD_HI} stopOpacity=".9"/>
            <stop offset="72%" stopColor={GOLD} stopOpacity=".35"/>
            <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="arcoB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0"/>
            <stop offset="50%" stopColor={GOLD_HI} stopOpacity=".55"/>
            <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
          </linearGradient>
          <filter id="brilho"><feGaussianBlur stdDeviation="7"/></filter>
        </defs>
        <circle cx="1560" cy="90" r="640" fill="none" stroke="url(#arcoA)" strokeWidth="14" opacity=".22" filter="url(#brilho)"/>
        <circle cx="1560" cy="90" r="640" fill="none" stroke="url(#arcoA)" strokeWidth="2.4"/>
        <circle cx="1500" cy="30" r="430" fill="none" stroke="url(#arcoA)" strokeWidth="1.3" opacity=".55"/>
        <circle cx="40" cy="880" r="540" fill="none" stroke="url(#arcoB)" strokeWidth="12" opacity=".16" filter="url(#brilho)"/>
        <circle cx="40" cy="880" r="540" fill="none" stroke="url(#arcoB)" strokeWidth="2"/>
        <circle cx="-30" cy="960" r="330" fill="none" stroke="url(#arcoB)" strokeWidth="1.2" opacity=".5"/>
      </svg>
      <div aria-hidden style={{ position:'absolute', top:'-22%', right:'-12%', width:760, height:760, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(201,162,39,.11) 0%, rgba(201,162,39,0) 66%)', pointerEvents:'none' }}/>
      <div aria-hidden style={{ position:'absolute', bottom:'-28%', left:'-14%', width:640, height:640, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(201,162,39,.07) 0%, rgba(201,162,39,0) 68%)', pointerEvents:'none' }}/>
    </>
  )
}

/* ── Coluna direita ──────────────────────────────────────────────────────── */
const FEATURES = [
  { Icon: IcoCal,      titulo: 'Agenda',    sub: 'Marcações sempre à mão' },
  { Icon: IcoUsers,    titulo: 'Clientes',  sub: 'Histórico e fidelização' },
  { Icon: IcoScissors, titulo: 'Serviços',  sub: 'Preços e equipa sob controlo' },
  { Icon: IcoShield,   titulo: 'Segurança', sub: 'Os seus dados protegidos' },
]

function Feature({ Icon, titulo, sub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:15, flexShrink:0, display:'grid', placeItems:'center',
        background:'linear-gradient(160deg, rgba(201,162,39,.16), rgba(201,162,39,.05))',
        border:'1px solid rgba(201,162,39,.20)', color:GOLD_HI }}>
        <Icon size={21}/>
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:600, color:'#EDE8DF', marginBottom:2 }}>{titulo}</div>
        <div style={{ fontSize:13, color:'#7E7767' }}>{sub}</div>
      </div>
    </div>
  )
}

/* ── Página ──────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  function aoMover(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width  - 0.5
    const py = (e.clientY - r.top)  / r.height - 0.5
    setTilt({ rx: -py * 10, ry: px * 12 })
  }
  const aoSair = () => setTilt({ rx: 0, ry: 0 })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const s = await login(email, password)
      if (s.role !== 'admin') {
        setError('Esta conta não tem permissões de administrador.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  async function sendReset(e) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/repor-senha',
    })
    setForgotLoading(false)
    if (error) { setForgotError(error.message || 'Erro ao enviar email.'); return }
    setForgotSent(true)
  }

  const closeForgot = () => { setForgotOpen(false); setForgotSent(false); setForgotEmail(''); setForgotError('') }

  const campo = {
    width:'100%', padding:'13px 14px 13px 44px', borderRadius:11,
    border:'1px solid rgba(201,162,39,.16)', background:'rgba(255,255,255,.035)',
    color:'#EDE8DF', fontSize:14.5, outline:'none', boxSizing:'border-box',
  }
  const iconeCampo = {
    position:'absolute', left:15, top:'50%', transform:'translateY(-50%)',
    color:'#6E6757', pointerEvents:'none', display:'flex',
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden', background:'#0A0807',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
      <style>{`
        .cv-side { display:block }
        .cv-rodape { display:block }
        .cv-grid { display:grid; grid-template-columns:1fr minmax(360px,430px) 1fr; gap:56px;
                   align-items:center; width:100%; max-width:1460px; }
        .cv-entrar { transition:filter .18s, transform .18s }
        .cv-entrar:hover:not(:disabled) { filter:brightness(1.07); transform:translateY(-1px) }
        .cv-olho:hover { color:#C9A227 !important }
        .cv-esqueci { background:none; border:none; padding:0; cursor:pointer; font-size:13;
                      color:#8A8272; transition:color .18s }
        .cv-esqueci:hover { color:#C9A227 }
        @media (max-width:1180px) {
          .cv-grid { grid-template-columns:1fr; justify-items:center; gap:0 }
          .cv-side { display:none }
        }
        @media (max-height:820px), (max-width:1180px) { .cv-rodape { display:none } }

        .cv-persp { perspective:1500px; perspective-origin:50% 45% }
        .cv-tilt  { transform-style:preserve-3d; will-change:transform;
                    transition:transform .3s cubic-bezier(.2,.7,.3,1) }
        .cv-3d    { transform-style:preserve-3d }

        @keyframes cvCardIn {
          from { opacity:0; transform:translateZ(-340px) translateY(34px) scale(.95) }
          to   { opacity:1; transform:none }
        }
        @keyframes cvUp {
          from { opacity:0; transform:translateY(24px) }
          to   { opacity:1; transform:none }
        }
        .cv-entra-cartao { animation:cvCardIn .95s cubic-bezier(.16,.84,.34,1) both;
                           transform-style:preserve-3d }
        .cv-entra { animation:cvUp .75s cubic-bezier(.16,.84,.34,1) both }

        @media (prefers-reduced-motion: reduce) {
          .cv-entra, .cv-entra-cartao { animation:none }
          .cv-tilt { transition:none; transform:none !important }
        }
      `}</style>

      <Fundo/>
      <Scene3D intensidade={1}/>

      {/* Marca no topo */}
      <div className="cv-rodape" style={{ position:'absolute', top:34, left:38, display:'flex', alignItems:'center', gap:13, zIndex:2 }}>
        <img src="/convecta-logo.png" alt="" style={{ width:40, height:40, objectFit:'contain' }}/>
        <div>
          <div style={{ fontSize:19, fontWeight:700, color:'#EDE8DF', lineHeight:1.1 }}>Convecta</div>
          <div style={{ fontSize:10, color:'#7E7767', letterSpacing:'.26em', fontWeight:600 }}>ADMIN</div>
        </div>
      </div>

      <div className="cv-grid" style={{ position:'relative', zIndex:1 }}>

        {/* Esquerda */}
        <div className="cv-side cv-entra" style={{ animationDelay:'.12s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26 }}>
            <span style={{ width:42, height:1.5, background:GOLD }}/>
            <span style={{ fontSize:11, letterSpacing:'.24em', color:'#8A8272', fontWeight:600 }}>BEM-VINDO DE VOLTA</span>
          </div>
          <h1 style={{ margin:0, fontSize:'clamp(40px,4.4vw,62px)', lineHeight:1.08, fontWeight:700,
                       color:'#F2EDE4', letterSpacing:'-.028em' }}>
            A tua barbearia,<br/>sob <span style={{ color:GOLD_HI }}>controlo.</span>
          </h1>
          <p style={{ marginTop:24, marginBottom:0, fontSize:16.5, lineHeight:1.65, color:'#8A8272', maxWidth:400 }}>
            Agenda, clientes e serviços num só painel — sempre a par do que acontece.
          </p>
        </div>

        {/* Cartão */}
        <div className="cv-persp" onMouseMove={aoMover} onMouseLeave={aoSair}>
        <div className="cv-entra-cartao">
        <div className="cv-tilt" style={{ transform:`rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}>
        <div className="cv-3d" style={{ position:'relative', borderRadius:23, padding:1.4,
          background:`linear-gradient(152deg, ${GOLD_HI} 0%, rgba(201,162,39,.42) 16%, rgba(255,255,255,.06) 42%, rgba(255,255,255,.03) 100%)`,
          boxShadow:'0 0 70px rgba(201,162,39,.12), 0 34px 80px rgba(0,0,0,.72)' }}>
          <div className="cv-3d" style={{ borderRadius:21.6, padding:'40px 36px 32px',
            background:'linear-gradient(168deg, #17140F 0%, #100E0B 100%)' }}>

            <div style={{ textAlign:'center', marginBottom:26, transform:'translateZ(55px)' }}>
              <img src="/convecta-logo.png" alt="" style={{ width:62, height:62, objectFit:'contain', margin:'0 auto 14px', display:'block' }}/>
              <div style={{ fontSize:29, fontWeight:700, color:'#F2EDE4', letterSpacing:'-.022em' }}>Convecta</div>
              <div style={{ fontSize:14, color:'#8A8272', marginTop:4 }}>Painel de Administração</div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, transform:'translateZ(34px)' }}>
              <span style={{ flex:1, height:1, background:'rgba(201,162,39,.16)' }}/>
              <span style={{ fontSize:12.5, color:'#7E7767' }}>Aceda à sua conta</span>
              <span style={{ flex:1, height:1, background:'rgba(201,162,39,.16)' }}/>
            </div>

            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:17, transform:'translateZ(26px)' }}>
              <div>
                <label style={{ fontSize:13, color:'#B8B0A0', marginBottom:8, display:'block', fontWeight:500 }}>Email</label>
                <div style={{ position:'relative' }}>
                  <span style={iconeCampo}><IcoMail size={17}/></span>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="admin@exemplo.pt" autoComplete="email" style={campo}/>
                </div>
              </div>

              <div>
                <label style={{ fontSize:13, color:'#B8B0A0', marginBottom:8, display:'block', fontWeight:500 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <span style={iconeCampo}><IcoLock size={17}/></span>
                  <input type={verPass ? 'text' : 'password'} required value={password}
                         onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                         autoComplete="current-password" style={{ ...campo, paddingRight:46 }}/>
                  <button type="button" className="cv-olho" onClick={() => setVerPass(v => !v)}
                          aria-label={verPass ? 'Ocultar password' : 'Mostrar password'}
                          style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)',
                                   background:'none', border:'none', padding:4, cursor:'pointer',
                                   color:'#6E6757', display:'flex' }}>
                    {verPass ? <IcoEyeOff size={17}/> : <IcoEye size={17}/>}
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:-4 }}>
                <button type="button" className="cv-esqueci" onClick={() => setForgotOpen(true)}>
                  Esqueci-me da palavra-passe
                </button>
              </div>

              {error && (
                <div style={{ padding:'11px 13px', borderRadius:10, background:'rgba(239,68,68,.09)',
                              border:'1px solid rgba(239,68,68,.28)', color:'#F08A8A', fontSize:13.5, lineHeight:1.45 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="cv-entrar" style={{
                marginTop:5, padding:'14px', borderRadius:11, border:'none',
                background:`linear-gradient(100deg, ${GOLD} 0%, ${GOLD_HI} 52%, ${GOLD} 100%)`,
                color:'#100E0B', fontSize:15, fontWeight:700, letterSpacing:'.01em',
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? .65 : 1,
                boxShadow:'0 8px 26px rgba(201,162,39,.24)',
              }}>
                {loading ? 'A entrar…' : 'Entrar  →'}
              </button>
            </form>

            <div style={{ marginTop:24, display:'flex', alignItems:'center', justifyContent:'center', gap:7, color:'#5E584B', transform:'translateZ(16px)' }}>
              <IcoLock size={12}/>
              <span style={{ fontSize:12 }}>Ligação segura e encriptada</span>
            </div>
          </div>
        </div>
        </div>
        </div>
        </div>

        {/* Direita */}
        <div className="cv-side" style={{ display:'flex', flexDirection:'column', gap:26, justifySelf:'start', paddingLeft:20 }}>
          {FEATURES.map((f, i) => (
            <div key={f.titulo} className="cv-entra" style={{ animationDelay:`${0.45 + i * 0.1}s` }}>
              <Feature {...f}/>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapés */}
      <div className="cv-rodape" style={{ position:'absolute', bottom:38, left:38, borderLeft:`2px solid ${GOLD}`, paddingLeft:16, zIndex:2 }}>
        <div style={{ fontSize:14.5, color:'#C4BCA9', fontWeight:500 }}>Gestão. Visão. Crescimento.</div>
        <div style={{ fontSize:10.5, color:'#6E6757', letterSpacing:'.28em', marginTop:4, fontWeight:600 }}>CONVECTA</div>
      </div>
      <div className="cv-rodape" style={{ position:'absolute', bottom:38, right:40, textAlign:'right', zIndex:2 }}>
        <div style={{ fontSize:10.5, color:'#5E584B', letterSpacing:'.26em', lineHeight:1.9, fontWeight:600 }}>
          MAIS NEGÓCIOS.<br/>MAIS POSSIBILIDADES.
        </div>
      </div>

      {/* Modal recuperar palavra-passe */}
      {forgotOpen && (
        <div onClick={closeForgot} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.78)', display:'flex',
                                            alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:400, borderRadius:19, padding:1.2,
            background:`linear-gradient(152deg, ${GOLD_HI} 0%, rgba(201,162,39,.34) 18%, rgba(255,255,255,.05) 46%, rgba(255,255,255,.02) 100%)`,
            boxShadow:'0 0 60px rgba(201,162,39,.10), 0 30px 70px rgba(0,0,0,.7)' }}>
            <div style={{ borderRadius:18, padding:'28px 28px 24px',
                          background:'linear-gradient(168deg, #17140F 0%, #100E0B 100%)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <h2 style={{ fontSize:17, fontWeight:700, margin:0, color:'#F2EDE4' }}>Recuperar palavra-passe</h2>
                <button onClick={closeForgot} aria-label="Fechar"
                        style={{ background:'none', border:'none', color:'#6E6757', cursor:'pointer', padding:4, display:'flex' }}>
                  <IcoX size={18}/>
                </button>
              </div>

              {!forgotSent ? (
                <form onSubmit={sendReset}>
                  <p style={{ fontSize:13.5, color:'#8A8272', marginTop:0, marginBottom:20, lineHeight:1.55 }}>
                    Indica o teu email e enviamos um link para criares uma nova palavra-passe.
                  </p>
                  <label style={{ fontSize:13, color:'#B8B0A0', marginBottom:8, display:'block', fontWeight:500 }}>Email</label>
                  <div style={{ position:'relative', marginBottom:16 }}>
                    <span style={iconeCampo}><IcoMail size={17}/></span>
                    <input type="email" required autoFocus value={forgotEmail}
                           onChange={e => setForgotEmail(e.target.value)}
                           placeholder="admin@exemplo.pt" style={campo}/>
                  </div>
                  {forgotError && (
                    <div style={{ padding:'11px 13px', borderRadius:10, background:'rgba(239,68,68,.09)',
                                  border:'1px solid rgba(239,68,68,.28)', color:'#F08A8A', fontSize:13.5, marginBottom:16 }}>
                      {forgotError}
                    </div>
                  )}
                  <button type="submit" disabled={forgotLoading} className="cv-entrar" style={{
                    width:'100%', padding:'13px', borderRadius:11, border:'none',
                    background:`linear-gradient(100deg, ${GOLD} 0%, ${GOLD_HI} 52%, ${GOLD} 100%)`,
                    color:'#100E0B', fontSize:14.5, fontWeight:700,
                    cursor: forgotLoading ? 'wait' : 'pointer', opacity: forgotLoading ? .65 : 1,
                    boxShadow:'0 8px 26px rgba(201,162,39,.24)',
                  }}>
                    {forgotLoading ? 'A enviar…' : 'Enviar link de recuperação'}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign:'center', padding:'8px 0' }}>
                  <div style={{ width:56, height:56, borderRadius:16, margin:'0 auto 16px', display:'grid', placeItems:'center',
                    background:'linear-gradient(160deg, rgba(201,162,39,.16), rgba(201,162,39,.05))',
                    border:'1px solid rgba(201,162,39,.20)', color:GOLD_HI }}>
                    <IcoMail size={24}/>
                  </div>
                  <div style={{ fontSize:15.5, fontWeight:600, marginBottom:8, color:'#F2EDE4' }}>Email enviado</div>
                  <div style={{ fontSize:13.5, color:'#8A8272', marginBottom:22, lineHeight:1.55 }}>
                    Verifica a caixa de entrada de <strong style={{ color:'#C4BCA9' }}>{forgotEmail}</strong> e clica no link para redefinir a palavra-passe.
                  </div>
                  <button onClick={closeForgot} style={{
                    width:'100%', padding:'13px', borderRadius:11, cursor:'pointer',
                    border:'1px solid rgba(201,162,39,.22)', background:'rgba(255,255,255,.035)',
                    color:'#C4BCA9', fontSize:14.5, fontWeight:600,
                  }}>
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
