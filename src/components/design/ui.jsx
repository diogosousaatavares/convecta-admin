// Tema e peças de interface do super admin, num sítio só.
//
// Viviam dentro do SuperAdminPage.jsx, invisíveis a qualquer outro ficheiro.
// As áreas novas (Suporte, Tarefas, Financeiro) vivem em ficheiros próprios e
// precisam das mesmas cores e dos mesmos botões; duas cópias do tema acabam
// sempre por divergir, por isso a definição saiu de lá e passou a ser esta.
// O código é o mesmo que estava no SuperAdminPage, sem alterações de aspeto.
import React from 'react'

// ── Cores ──────────────────────────────────────────────────────────────────
/*
 * ESTAS CORES SAO AS DO PAINEL, NAO AS DO SUPER ADMIN.
 *
 * Este ficheiro veio do super admin, que e escuro e so escuro — e trazia os
 * neutros escritos a mao: W='#16130F', BG='#0A0807', T='#EDE8DF'. Dentro do
 * painel do barbeiro, que e claro, isso dava uma barra de separadores preta
 * e uma caixa do link preta no meio de uma pagina branca. Nao era um
 * desacerto de gosto: eram duas paletas no mesmo ecra.
 *
 * Agora os neutros sao as variaveis do painel. Em modo claro ficam claros,
 * em modo escuro escuros, e o barbeiro ve UMA aplicacao.
 *
 * O amarelo fica em hexadecimal de proposito: ha sitios que lhe colam dois
 * digitos de transparencia (`${Y}33`), e isso nao funciona com var().
 */
export const Y='#F5D66B',YD='#C9A227',TY='#100E0B'
/* O amarelo PARA TEXTO. O Y e claro — nasceu para se ler sobre preto — e em
   cima de branco desaparece. Onde a cor serve de tinta usa-se este, que o
   painel ja escolhe conforme o tema. */
export const YT='var(--gold-tinta)'
export const W='var(--surface)',W2='var(--elevated)',BG='var(--bg)',
  BD='var(--border)',T='var(--text)',T2='var(--text-sec)',T3='var(--text-ter)'
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
/*
 * ── Porque e que estes componentes usam as classes do painel ─────────────
 *
 * Isto era um segundo conjunto de pecas, com estilos proprios escritos a
 * mao: o botao daqui era um degrade com cantos de 8px e letra de 13, o do
 * resto do painel e dourado liso com cantos maiores e letra de 14. Lado a
 * lado — o "Guardar design" do Meu Site e o botao da Agenda — pareciam de
 * dois programas diferentes, e eram.
 *
 * Passam todos a desenhar as classes do painel (.btn, .input, .card...).
 * O aspecto passa a vir de um sitio so: mexer no .btn do index.css muda o
 * painel inteiro, este ecra incluido. Os `style` que cada sitio ja passava
 * continuam a valer por cima, para os botoes pequenos e afinacoes locais.
 */
export function Btn({v='primary',children,style:s,className:c='',...p}){
  return <button className={`btn btn-${v} ${c}`.trim()} style={s} {...p}>{children}</button>
}
export const Inp=React.forwardRef(({style:s,className:c='',...p},ref)=><input ref={ref} className={`input ${c}`.trim()} style={s} {...p}/>)
export const Sel=({style:s,className:c='',children,...p})=><select className={`select ${c}`.trim()} style={s} {...p}>{children}</select>
export const Lbl=({children})=><label className="label">{children}</label>
export const Card=({style:s,className:c='',children,...p})=><div className={`card card-pad ${c}`.trim()} style={s} {...p}>{children}</div>
// Área de texto com o mesmo aspeto do Inp. Nova; o painel antigo não tinha.
export const Ta=({style:s,className:c='',...p})=><textarea className={`textarea ${c}`.trim()} style={{minHeight:84,resize:'vertical',...s}} {...p}/>
