// Tema e peças de interface do super admin, num sítio só.
//
// Viviam dentro do SuperAdminPage.jsx, invisíveis a qualquer outro ficheiro.
// As áreas novas (Suporte, Tarefas, Financeiro) vivem em ficheiros próprios e
// precisam das mesmas cores e dos mesmos botões; duas cópias do tema acabam
// sempre por divergir, por isso a definição saiu de lá e passou a ser esta.
// O código é o mesmo que estava no SuperAdminPage, sem alterações de aspeto.
import React from 'react'

// ── Cores ──────────────────────────────────────────────────────────────────
export const Y='#F5D66B',YD='#C9A227',TY='#100E0B'
export const W='#16130F',W2='#1C1915',BG='#0A0807',BD='rgba(201,162,39,.15)',T='#EDE8DF',T2='#8A8272',T3='#5E584B'
export const G='#22C55E',R='#EF4444',O='#F59E0B'
// Azul dos estados "em curso" e das informações. Já era usado à mão em vários
// sítios do painel ('#3B82F6'); aqui ganha nome.
export const AZ='#3B82F6'

// ── Formatos ───────────────────────────────────────────────────────────────
// O Postgres devolve numeric como texto ("29.00"), e um texto não tem
// .toFixed — daí o Number().
export const fmtMoney=n=>`€${(Number(n)||0).toFixed(2)}`
export const fmtDate=d=>d?new Date(d).toLocaleDateString('pt-PT'):'—'

// ── Peças ──────────────────────────────────────────────────────────────────
export function Spin({size=16}){return<span style={{display:'inline-block',width:size,height:size,borderRadius:'50%',border:`2px solid ${BD}`,borderTopColor:T2,animation:'spin .7s linear infinite'}}/>}
export function Logo({size=32}){return<img src='/convecta-logo.png' style={{width:size,height:size,objectFit:'contain',flexShrink:0}} alt=''/>}
export function Badge({color,children}){return<span style={{fontSize:11,padding:'3px 9px',borderRadius:20,background:`${color}18`,color,fontWeight:700,whiteSpace:'nowrap'}}>{children}</span>}
export function Btn({v='primary',children,style:s,...p}){
  const base={padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'inherit',transition:'opacity .15s',...s}
  const themes={primary:{background:`linear-gradient(100deg,${YD},${Y} 52%,${YD})`,color:TY},secondary:{background:W2,color:T,border:`1px solid ${BD}`},danger:{background:`${R}14`,color:R,border:`1px solid ${R}35`},ghost:{background:'transparent',color:T2}}
  return<button style={{...base,...themes[v]||themes.primary}} {...p}>{children}</button>
}
export const Inp=React.forwardRef(({style:s,...p},ref)=><input ref={ref} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${BD}`,background:'rgba(255,255,255,.04)',color:T,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',...s}} {...p}/>)
export const Sel=({style:s,children,...p})=><select style={{width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${BD}`,background:W2,color:T,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',...s}} {...p}>{children}</select>
export const Lbl=({children})=><label style={{fontSize:12,color:T2,marginBottom:5,display:'block',fontWeight:600}}>{children}</label>
export const Card=({style:s,children,...p})=><div style={{background:W,borderRadius:12,border:`1px solid ${BD}`,padding:20,...s}} {...p}>{children}</div>
// Área de texto com o mesmo aspeto do Inp. Nova; o painel antigo não tinha.
export const Ta=({style:s,...p})=><textarea style={{width:'100%',minHeight:84,padding:'9px 12px',borderRadius:8,border:`1px solid ${BD}`,background:'rgba(255,255,255,.04)',color:T,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',lineHeight:1.5,resize:'vertical',...s}} {...p}/>
