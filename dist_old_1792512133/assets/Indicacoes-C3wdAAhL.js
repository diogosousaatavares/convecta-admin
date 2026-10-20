import{L as Q,a6 as X,r as s,ac as g,j as e,b4 as O,I as Z,a1 as d,b5 as B,K as E,aO as ee,a0 as ae,X as l,N as ie}from"./index-MSJ5Bzx4.js";import{A as se}from"./AdminPage-p1npQ__1.js";import{B as ne}from"./banknote-DjALNN3F.js";import{C as oe}from"./clock-3-BBDXB4XI.js";import"./BotaoAtualizar-DGCccYs1.js";import"./SeparadoresDaFamilia-RN2o2tRb.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],q=Q("BadgeCheck",re),n=40,te={registou:["Registou-se","var(--text-sec)"],em_teste:["Está a experimentar","var(--warning, #b45309)"],pagou:["Pagou — ganhaste 40 €","var(--success)"],caiu:["Não ficou","var(--text-ter)"]},G=[{Icone:O,t:"Partilha o link"},{Icone:q,t:"O amigo paga"},{Icone:ne,t:"Ganhas 40 €"}];function he(){const m=X(),[o,P]=s.useState(null),[p,M]=s.useState(null),[y,w]=s.useState(""),[T,z]=s.useState(!1),[W,N]=s.useState(""),[r,h]=s.useState("mbway"),[c,k]=s.useState(""),[$,C]=s.useState(!1),[L,Y]=s.useState(()=>{try{return localStorage.getItem("convecta_indicacoes_visto")!=="1"}catch{return!0}}),_=()=>{try{localStorage.setItem("convecta_indicacoes_visto","1")}catch{}Y(!1)},u=c.trim()?r==="iban"?"IBAN "+c.trim():"MB WAY "+c.trim():"";s.useEffect(()=>{g.rpc("meu_codigo_indicacao").then(({data:a,error:i})=>{i||P(a)}),g.rpc("minhas_indicacoes").then(({data:a})=>M(a||[])),g.rpc("meu_recebe_indicacao").then(({data:a})=>{const i=(a||"").trim();N(i),h(/^iban/i.test(i)?"iban":"mbway"),k(i.replace(/^(mb\s*way|iban)\s*/i,""))})},[]);const x=o?`https://convecta.pt/comecar?ref=${o}`:"",S=`Olá! Uso a Convecta para gerir as marcações e tem-me dado jeito. Se quiseres experimentar, entra por aqui que o 1.º mês fica a metade: ${x}`,A=async(a,i)=>{try{await navigator.clipboard.writeText(a),w(i),setTimeout(()=>w(""),1800)}catch{m.error("Não deu para copiar","Copia à mão, se faz favor.")}},F=async()=>{if(navigator.share)try{await navigator.share({text:S});return}catch{}window.open(`https://wa.me/?text=${encodeURIComponent(S)}`,"_blank","noopener")},V=async()=>{C(!0);try{const{error:a}=await g.rpc("guardar_recebe_indicacao",{p_texto:u});if(a)throw a;N(u),m.success("Guardado")}catch(a){m.error("Não ficou gravado",a.message)}finally{C(!1)}},f=(p||[]).filter(a=>a.estado==="pagou"),R=f.reduce((a,i)=>a+(i.valor_cents||0)/100,0),D=f.filter(a=>a.recompensa_paga_em).reduce((a,i)=>a+(i.valor_cents||0)/100,0),I=R-D;return e.jsxs(se,{title:"Traz um amigo",children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:de}}),e.jsxs("div",{className:"ind",children:[e.jsxs("section",{className:"ind-top",children:[e.jsxs("h2",{children:["Ganha ",e.jsxs("b",{children:[n," €"]})," por cada amigo"]}),e.jsx("div",{className:"ind-passos",children:G.map(({Icone:a,t:i},t)=>e.jsxs("div",{className:"ind-passo",children:[e.jsx("span",{className:"ind-passo-n",children:t+1}),e.jsx(a,{size:22}),e.jsx("p",{children:i})]},t))}),e.jsxs("p",{className:"ind-top-nota",children:["Em dinheiro, sem limite. 3 amigos são ",n*3," €."]}),e.jsxs("button",{type:"button",className:"ind-regras-link",onClick:()=>z(!0),children:["Quando é válido — ver regras ",e.jsx(Z,{size:16})]})]}),e.jsxs("div",{className:"ind-bloco",children:[e.jsx("div",{className:"nt-titulo",children:"O teu código"}),e.jsxs("button",{type:"button",className:"ind-codigo",onClick:()=>o&&A(o,"cod"),children:[e.jsx("span",{children:o||"…"}),y==="cod"?e.jsx(d,{size:18}):e.jsx(B,{size:18})]}),e.jsxs("button",{type:"button",className:"ind-link",onClick:()=>x&&A(x,"link"),children:[e.jsx("span",{className:"ind-link-txt",children:x||"a preparar…"}),y==="link"?e.jsx(d,{size:16}):e.jsx(B,{size:16})]}),e.jsxs("button",{type:"button",className:"ind-partilhar",onClick:F,disabled:!o,children:[e.jsx(O,{size:18})," Partilhar no WhatsApp"]})]}),e.jsxs("div",{className:"ind-bloco",children:[e.jsxs("div",{className:"nt-titulo",children:["Onde queres receber os ",n," €"]}),e.jsxs("div",{className:"ind-tipo",children:[e.jsx("button",{type:"button",className:r==="mbway"?"on":"",onClick:()=>h("mbway"),children:"MB WAY"}),e.jsx("button",{type:"button",className:r==="iban"?"on":"",onClick:()=>h("iban"),children:"IBAN"})]}),e.jsxs("div",{className:"ind-recebe",children:[e.jsx("input",{value:c,inputMode:r==="mbway"?"tel":"text",placeholder:r==="mbway"?"O teu número MB WAY (9xx xxx xxx)":"O teu IBAN (PT50 …)",onChange:a=>k(a.target.value)}),e.jsx("button",{type:"button",onClick:V,disabled:$||!c.trim()||u===W,children:"Guardar"})]}),e.jsxs("p",{className:"ind-nota",children:[r==="mbway"?"Enviamos por MB WAY para este número quando um amigo paga.":"Fazemos a transferência para este IBAN quando um amigo paga."," Só tu e a Convecta vêem isto."]})]}),f.length>0&&e.jsxs("div",{className:"ind-ganho",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Já ganhaste"}),e.jsx("b",{children:E(R)})]}),I>0&&e.jsxs("div",{className:"ind-ganho-sub",children:[e.jsx(oe,{size:14})," ",E(I)," a caminho"]})]}),e.jsxs("div",{className:"ind-bloco",children:[e.jsx("div",{className:"nt-titulo",children:"Os teus amigos"}),p==null?e.jsx("div",{className:"ind-vazio",children:"A carregar…"}):p.length===0?e.jsx("div",{className:"ind-vazio",children:"Ainda não indicaste ninguém. Partilha o teu link e aparece aqui."}):e.jsx("div",{className:"ind-amigos",children:p.map((a,i)=>{const[t,J]=te[a.estado]||["—","var(--text-sec)"],U=a.recompensa_paga_em?3:a.estado==="pagou"?2:1,b=a.estado==="caiu",H=b?"Não ficou desta vez.":a.recompensa_paga_em?`Recebeste os ${n} €. 🎉`:a.estado==="pagou"?`Ganhaste ${n} €! Vamos enviar para o que indicaste.`:`Falta ele pagar o 1.º mês — depois caem-te ${n} €.`;return e.jsxs("div",{className:"ind-amigo",children:[e.jsxs("div",{className:"ind-amigo-topo",children:[e.jsx("b",{className:"po-nowrap",children:a.nome||"Negócio"}),e.jsxs("span",{className:"po-nowrap",style:{color:J,fontWeight:700,fontSize:13.5},children:[a.estado==="pagou"&&a.recompensa_paga_em?e.jsx(q,{size:14,style:{verticalAlign:"-2px"}}):null," ",t]})]}),e.jsx("div",{className:"ind-passinhos",children:["Entrou","Paga o 1.º mês",`${n} € na conta`].map((K,v)=>{const j=!b&&v<U;return e.jsxs(ee.Fragment,{children:[v>0&&e.jsx("i",{className:"ind-traco"+(j?" on":"")}),e.jsxs("span",{className:"ind-marco"+(j?" on":""),children:[e.jsx("b",{children:j?"✓":""}),K]})]},v)})}),!b&&e.jsx("div",{className:"ind-amigo-prox",children:H})]},i)})})]})]}),e.jsx(ae,{open:T,onClose:()=>z(!1),title:"Regras dos 40 €",children:e.jsxs("div",{className:"ind-regras",children:[e.jsxs("div",{className:"ind-regras-g",children:[e.jsx("div",{className:"ind-regras-h ok",children:"Ganhas 40 € quando"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx(d,{size:16})," O amigo entra pelo ",e.jsx("b",{children:"teu link"})]}),e.jsxs("li",{children:[e.jsx(d,{size:16})," E paga o ",e.jsx("b",{children:"1.º mês"})]}),e.jsxs("li",{children:[e.jsx(d,{size:16})," É um negócio ",e.jsx("b",{children:"novo"})," na Convecta"]}),e.jsxs("li",{children:[e.jsx(d,{size:16})," Sem limite de amigos"]})]})]}),e.jsxs("div",{className:"ind-regras-g",children:[e.jsx("div",{className:"ind-regras-h no",children:"Não conta quando"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx(l,{size:16})," Ele ",e.jsx("b",{children:"não chega a pagar"})]}),e.jsxs("li",{children:[e.jsx(l,{size:16})," Cancela ou pede reembolso nos 1.",e.jsx("sup",{children:"os"})," 14 dias"]}),e.jsxs("li",{children:[e.jsx(l,{size:16})," Já era cliente Convecta"]}),e.jsxs("li",{children:[e.jsx(l,{size:16})," Te indicas a ti mesmo"]})]})]}),e.jsx("p",{className:"ind-regras-nota",children:"Pagamos para o MB WAY ou IBAN que indicares, depois de ele pagar."})]})}),L&&ie.createPortal(e.jsxs("div",{className:"ind-full",role:"dialog","aria-modal":"true","aria-label":"Ganha 40 € ao convidar um amigo",children:[e.jsx("button",{type:"button",className:"ind-full-x",onClick:_,"aria-label":"Fechar",children:e.jsx(l,{size:24})}),e.jsxs("div",{className:"ind-full-top",children:[e.jsx("div",{className:"ind-full-eyebrow",children:"Convida e ganha"}),e.jsx("div",{className:"ind-full-passos",children:G.map(({Icone:a,t:i},t)=>e.jsxs("div",{className:"ind-full-passo",children:[e.jsx("span",{children:e.jsx(a,{size:24})}),e.jsx("p",{children:i})]},t))}),e.jsx("button",{type:"button",className:"ind-full-btn",onClick:_,children:"Começar"})]}),e.jsxs("picture",{className:"ind-full-img",children:[e.jsx("source",{media:"(min-width: 768px)",srcSet:"/indicacoes/ganha-40-amigo.jpg"}),e.jsx("img",{src:"/indicacoes/ganha-40-amigo-tlm.jpg",alt:"Ganha 40 € ao convidar o teu amigo"})]})]}),document.body)]})}const de=`
.ind { max-width: 640px; display: grid; gap: 22px; }
.po-nowrap { white-space: nowrap; }

/* Topo — como funciona */
.ind-top { text-align: center; padding: 4px 0 2px; display: grid; gap: 16px; justify-items: center; }
.ind-top h2 { font-family: var(--font-head); font-size: clamp(26px, 6vw, 34px); margin: 0; color: var(--text); }
.ind-top h2 b { color: var(--gold-tinta); }
.ind-passos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; }
.ind-passo { position: relative; display: grid; gap: 8px; justify-items: center; padding: 18px 8px 14px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface); }
.ind-passo-n { position: absolute; top: 8px; left: 10px; font-size: 12px; font-weight: 800; color: var(--text-ter); }
.ind-passo svg { color: var(--gold-tinta); }
.ind-passo p { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--text); line-height: 1.25; }
.ind-top-nota { margin: 0; color: var(--text-sec); font-size: 14.5px; }
.ind-regras-link { display: inline-flex; align-items: center; gap: 2px; padding: 6px 2px; border: 0; background: transparent; color: var(--gold-tinta); font: inherit; font-weight: 700; font-size: 14.5px; cursor: pointer; }

.ind-bloco { display: grid; gap: 10px; }
.nt-titulo { font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-ter); }
.ind-codigo { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-radius: 14px; border: 1.5px dashed var(--gold); background: rgba(var(--gold-rgb), .06); color: var(--text); font: inherit; cursor: pointer; }
.ind-codigo span { font-family: var(--font-head); font-size: 26px; font-weight: 700; letter-spacing: .04em; }
.ind-codigo svg { color: var(--gold-tinta); flex-shrink: 0; }
.ind-link { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text-sec); font: inherit; cursor: pointer; }
.ind-link-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.ind-link svg { flex-shrink: 0; color: var(--text-ter); }
.ind-partilhar { min-height: 52px; border-radius: 999px; border: 0; background: var(--text); color: var(--surface); font: inherit; font-size: 16px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; }
.ind-partilhar:disabled { opacity: .5; }
.ind-tipo { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 999px; background: var(--elevated); border: 1px solid var(--border); max-width: 300px; }
.ind-tipo button { min-height: 40px; border: 0; border-radius: 999px; background: transparent; color: var(--text-sec); font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.ind-tipo button.on { background: var(--text); color: var(--surface); }
.ind-recebe { display: flex; gap: 8px; }
.ind-recebe input { flex: 1; min-width: 0; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-size: 15px; }
.ind-recebe button { padding: 0 18px; border-radius: 12px; border: 0; background: var(--text); color: var(--surface); font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
.ind-recebe button:disabled { opacity: .5; }
.ind-nota { margin: 0; font-size: 13px; color: var(--text-ter); line-height: 1.5; }
.ind-ganho { border-radius: 16px; border: 1px solid var(--border); background: var(--surface); padding: 18px; }
.ind-ganho > div:first-child { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ind-ganho span { color: var(--text-sec); font-size: 14px; }
.ind-ganho b { font-family: var(--font-head); font-size: 34px; color: var(--success); }
.ind-ganho-sub { margin-top: 6px; font-size: 13.5px; color: var(--text-sec); display: flex; align-items: center; gap: 6px; }
.ind-vazio { padding: 24px 0; text-align: center; color: var(--text-ter); font-size: 14.5px; }
.ind-amigos { display: grid; gap: 10px; }
.ind-amigo { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); padding: 13px 14px; display: grid; gap: 9px; }
.ind-amigo-topo { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ind-amigo-topo b { font-size: 15px; color: var(--text); }
.ind-passinhos { display: flex; align-items: center; gap: 0; flex-wrap: wrap; }
.ind-marco { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--text-ter); white-space: nowrap; }
.ind-marco.on { color: var(--text); font-weight: 700; }
.ind-marco b { display: grid; place-items: center; width: 15px; height: 15px; border-radius: 999px; border: 1.5px solid var(--border); font-size: 9px; color: #fff; }
.ind-marco.on b { background: var(--success); border-color: var(--success); }
.ind-traco { width: 16px; height: 2px; background: var(--border); margin: 0 5px; flex-shrink: 0; }
.ind-traco.on { background: var(--success); }
.ind-amigo-prox { font-size: 13px; color: var(--text-sec); line-height: 1.4; }

/* Regras (modal) */
.ind-regras { display: grid; gap: 18px; }
.ind-regras-g { display: grid; gap: 8px; }
.ind-regras-h { font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.ind-regras-h.ok { color: var(--success); }
.ind-regras-h.no { color: var(--text-ter); }
.ind-regras ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ind-regras li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: var(--text); line-height: 1.4; }
.ind-regras li svg { flex-shrink: 0; margin-top: 2px; }
.ind-regras-g:nth-child(1) li svg { color: var(--success); }
.ind-regras-g:nth-child(2) li svg { color: var(--text-ter); }
.ind-regras-nota { margin: 0; font-size: 13px; color: var(--text-ter); line-height: 1.5; }

/* Capa da 1.ª vez — passos em cima, foto cortada em baixo */
.ind-full { position: fixed; inset: 0; z-index: 9000; background: #000; display: flex; flex-direction: column; animation: ind-full-entra 240ms ease backwards; }
@keyframes ind-full-entra { from { opacity: 0; } }
.ind-full-x { position: absolute; z-index: 3; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 14px; width: 44px; height: 44px; border-radius: 999px; border: 0; background: rgba(255,255,255,.14); backdrop-filter: blur(6px); color: #fff; display: grid; place-items: center; cursor: pointer; }
.ind-full-top { position: relative; z-index: 2; padding: calc(env(safe-area-inset-top, 0px) + 56px) 24px 22px; display: grid; gap: 20px; justify-items: center; text-align: center; }
.ind-full-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }
.ind-full-top h2 { font-family: var(--font-head); font-size: clamp(30px, 8vw, 40px); line-height: 1.05; margin: 0; color: #fff; }
.ind-full-top h2 b { color: var(--gold); }
.ind-full-passos { display: flex; gap: 10px; width: 100%; max-width: 440px; }
.ind-full-passo { flex: 1; display: grid; gap: 8px; justify-items: center; padding: 14px 6px; border-radius: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
.ind-full-passo span { color: var(--gold); }
.ind-full-passo p { margin: 0; font-size: 12.5px; font-weight: 600; color: #fff; line-height: 1.2; }
.ind-full-btn { min-height: 54px; padding: 0 56px; border-radius: 999px; border: 0; background: var(--gold); color: #15120E; font: inherit; font-size: 17px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.ind-full-img { position: relative; flex: 1 1 auto; min-height: 180px; overflow: hidden; margin-top: 4px; }
.ind-full-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.ind-full-img::before { content: ''; position: absolute; inset: 0 0 auto; height: 72px; z-index: 1; background: linear-gradient(#000, transparent); }
@media (min-width: 768px) {
  .ind-full { flex-direction: row; align-items: stretch; }
  .ind-full-top { flex: 1; align-content: center; padding: 48px; max-width: 560px; margin: auto 0; }
  .ind-full-top h2 { font-size: 46px; }
  .ind-full-img { flex: 1; min-height: 0; }
  .ind-full-img img { object-position: center; }
  .ind-full-img::before { display: none; }
}
`;export{he as default};
