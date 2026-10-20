import{L as A,r as x,aE as E,b9 as T,S as M,b3 as D,j as a,a1 as S,b5 as _,b4 as R,aH as U,ar as q,at as $,as as F,bR as W,u as G,a as H,bS as X,bT as Y,aS as Q,O as V,bU as z,bV as Z,E as J,ah as K,Q as N,bW as aa,I as p,a3 as ia,a0 as C,bX as ea,aN as sa,am as oa,bY as ta,H as na}from"./index-MSJ5Bzx4.js";import{C as ra,a as la}from"./Caixas-BaukKhN7.js";import{l as da}from"./convectaNotifs-DNaDwIKc.js";import{M as ca}from"./message-circle-CFXaxaDp.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.93 4.93 4.24 4.24",key:"1ymg45"}],["path",{d:"m14.83 9.17 4.24-4.24",key:"1cb5xl"}],["path",{d:"m14.83 14.83 4.24 4.24",key:"q42g0n"}],["path",{d:"m9.17 14.83-4.24 4.24",key:"bqpfvv"}],["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}]],pa=A("LifeBuoy",ma);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=[["path",{d:"M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z",key:"w46dr5"}]],ha=A("Puzzle",xa);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"m9 8 6 4-6 4Z",key:"f1r3lt"}]],ba=A("SquarePlay",ua);function ga(){const[s,n]=x.useState(""),[h,v]=x.useState(!1),[u,b]=x.useState(""),o=E(),[g]=T();if(x.useEffect(()=>{let e=!0;return M.getBusiness().then(t=>{!e||!t||n(t.domain||(t.slug?`${t.slug}.${D}`:""))}).catch(()=>{}),()=>{e=!1}},[]),!s)return null;const d=o.lista.find(e=>e.id===(g==null?void 0:g.principal))||o.principal,c=s,l=`https://${c}`,w=typeof navigator<"u"&&!!navigator.share,f=async()=>{var e;try{await navigator.clipboard.writeText(l),v(!0),setTimeout(()=>v(!1),1800)}catch{(e=window.getSelection)==null||e.call(window).selectAllChildren(document.getElementById("link-da-barbearia"))}},r=e=>e.id===(d==null?void 0:d.id)?`${l}/?lado=${e.tipo}`:`https://${W(e)}`,j=async e=>{try{const t=o.ligado?o.lista.find(y=>y.id===e):null;await navigator.clipboard.writeText(t?r(t):`${l}/?lado=${e}`),b(e),setTimeout(()=>b(""),1800)}catch{}},k=async()=>{try{await navigator.share({title:"Marca a tua hora",url:l})}catch{}};return a.jsxs(a.Fragment,{children:[a.jsxs("div",{className:"link-faixa","data-tour":"link-barbearia",children:[a.jsx("span",{className:"link-faixa-rotulo",children:"O teu link"}),a.jsx("span",{id:"link-da-barbearia",className:"link-faixa-endereco",children:c}),a.jsxs("button",{type:"button",className:"link-faixa-btn",onClick:f,"aria-label":h?"Link copiado":"Copiar o link",children:[h?a.jsx(S,{size:15}):a.jsx(_,{size:15}),a.jsx("span",{children:h?"Copiado":"Copiar"})]}),w&&a.jsx("button",{type:"button",className:"link-faixa-ico",onClick:k,"aria-label":"Partilhar o link",children:a.jsx(R,{size:15})}),a.jsx("a",{className:"link-faixa-ico",href:l,target:"_blank",rel:"noreferrer","aria-label":"Abrir o site",children:a.jsx(U,{size:15})})]}),!o.ligado&&q()&&a.jsxs("div",{style:{margin:"10px 0 4px"},children:[a.jsx("div",{className:"text-sec",style:{fontSize:13,marginBottom:8,textAlign:"center"},children:"O link acima pergunta qual. Para abrir já num lado:"}),a.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},children:(o.ligado?o.lista.map(e=>({id:e.id,nome:$(e.tipo)||e.name})):F().map(e=>({id:e,nome:$(e)}))).map(({id:e,nome:t})=>a.jsxs("button",{type:"button",onClick:()=>j(e),"aria-label":`Copiar o link de ${t}`,style:{display:"flex",alignItems:"center",justifyContent:"center",gap:6,minWidth:0,padding:"11px 10px",borderRadius:12,cursor:"pointer",font:"inherit",fontSize:14,fontWeight:600,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)"},children:[u===e?a.jsx(S,{size:15,style:{flexShrink:0}}):a.jsx(_,{size:15,style:{flexShrink:0}}),a.jsx("span",{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:u===e?"Copiado":t})]},e))})]})]})}function za(){var k,e,t,y,L,P,I;const s=G(),{user:n,logout:h}=H(),v=((t=(e=(k=s.business)==null?void 0:k._settings)==null?void 0:e.demo)==null?void 0:t.ativo)===!0,u=X(v,s.isProfissional),b=new Set(["/admin/agenda","/admin/seccao/vendas","/admin/clientes","/admin/seccao/catalogo"]),o=u.map(i=>({to:i.type==="group"?Y(i):i.to,label:i.label,icon:i.icon,d:i.d})).filter(i=>!b.has(i.to)),g=u.filter(i=>i.type==="group"&&i.to&&b.has(i.to)&&(i.items||[]).some(m=>m.to&&!m.titulo&&m.to!==i.to)).map(i=>({to:`/admin/seccao/${i.id}`,label:i.label,icon:i.icon}));o.splice(o.length&&o[0].to==="/admin/dashboard"?1:0,0,...g),s.isProfissional&&o.push({to:"/admin/financeiro/conta-profissional",label:"A minha conta",icon:Q,d:"Comissões e gorjetas."}),s.isProfissional||o.push({to:"/admin/suplementos",label:"Suplementos",icon:ha,d:"Pagamentos online e mais."});const d=((y=s.business)==null?void 0:y.name)||V().Casa,c=z.find(i=>i.id===Z())||z[0],[l,w]=x.useState(0),[f,r]=x.useState(null);x.useEffect(()=>{da().then(i=>w(i.filter(m=>!m.read).length)).catch(()=>{})},[]);const j=(i,m,B,O)=>a.jsxs("button",{type:"button",className:"mais-linha",onClick:B,children:[a.jsxs("span",{children:[i,m]}),O,a.jsx(p,{size:18})]});return a.jsxs(J,{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:ja+ra}}),a.jsxs("div",{className:"mais",children:[a.jsxs("header",{className:"mais-topo",children:[(L=s.business)!=null&&L.logoUrl?a.jsx("img",{className:"mais-logo",src:s.business.logoUrl,alt:""}):a.jsx(K,{name:d,size:"lg"}),a.jsx("div",{className:"mais-nome",children:d}),((P=s.business)==null?void 0:P.founder)&&a.jsx("span",{className:"founder-selo mais-founder",title:"Fazes parte do Programa Founders da Convecta",children:"Founder"}),(n==null?void 0:n.email)&&a.jsx("div",{className:"mais-email",children:n.email}),a.jsx("div",{className:"mais-link",children:a.jsx(ga,{})})]}),a.jsx("section",{className:"mais-bloco",children:a.jsx(la,{itens:o,colunas:2,azulejos:!0})}),!s.isProfissional&&a.jsx(N,{to:"/admin/indicacoes",className:"mais-cartaz","aria-label":"Ganha 40 € ao convidar um amigo",children:a.jsx("img",{src:"/indicacoes/ganha-40-amigo.jpg",srcSet:"/indicacoes/ganha-40-amigo-640.jpg 640w, /indicacoes/ganha-40-amigo.jpg 1280w",sizes:"(max-width: 700px) 100vw, 560px",alt:"Ganha 40 € ao convidar um amigo"})}),a.jsx("section",{className:"mais-bloco",children:a.jsxs("div",{className:"mais-caixa",children:[j(a.jsx("span",{className:"mais-bandeira",children:c.bandeira}),c.nome,()=>r("idioma")),a.jsxs(N,{className:"mais-linha",to:"/admin/noticias",children:[a.jsxs("span",{children:[a.jsx(aa,{size:19}),"Notícias"]}),l>0&&a.jsx("i",{className:"mais-novas",children:l}),a.jsx(p,{size:18})]}),!s.isProfissional&&a.jsxs(N,{className:"mais-linha",to:"/admin/subscricao",children:[a.jsxs("span",{children:[a.jsx(ia,{size:19}),"A minha subscrição"]}),a.jsx(p,{size:18})]}),j(a.jsx(na,{size:19}),"Notificações da app",()=>r("push")),j(a.jsx(pa,{size:19}),"Ajuda e apoio",()=>r("apoio")),a.jsxs("a",{className:"mais-linha",href:fa,target:"_blank",rel:"noreferrer",children:[a.jsxs("span",{children:[a.jsx(ba,{size:19}),"Guias em vídeo"]}),a.jsx(p,{size:18})]})]})}),a.jsx(C,{open:f==="idioma",onClose:()=>r(null),title:"Idioma",children:a.jsx("div",{className:"mais-caixa","data-sem-traduzir":"",children:z.map(i=>a.jsxs("button",{type:"button",className:"mais-linha",onClick:()=>i.id===c.id?r(null):ea(i.id),children:[a.jsxs("span",{children:[a.jsx("span",{className:"mais-bandeira",children:i.bandeira}),i.nome]}),i.id===c.id?a.jsx(S,{size:18}):a.jsx("span",{})]},i.id))})}),a.jsx(C,{open:f==="push",onClose:()=>r(null),title:"Notificações da app",children:a.jsx(sa,{businessId:(I=s.business)==null?void 0:I.id,userId:n==null?void 0:n.id,papel:"admin",comTeste:!0,sempre:!0})}),a.jsx(C,{open:f==="apoio",onClose:()=>r(null),title:"Ajuda e apoio",children:a.jsxs("div",{className:"mais-caixa",children:[a.jsxs("a",{className:"mais-linha",href:"https://wa.me/351914874725?text="+encodeURIComponent(`Olá! Sou da ${d} e tenho uma dúvida.`),target:"_blank",rel:"noreferrer",children:[a.jsxs("span",{children:[a.jsx(ca,{size:19}),"WhatsApp"]}),a.jsx(p,{size:18})]}),a.jsxs("a",{className:"mais-linha",href:"tel:+351914874725",children:[a.jsxs("span",{children:[a.jsx(oa,{size:19}),"Ligar · 914 874 725"]}),a.jsx(p,{size:18})]}),a.jsxs("a",{className:"mais-linha",href:"mailto:geral@convecta.pt",children:[a.jsxs("span",{children:[a.jsx("span",{className:"mais-arroba",children:"@"}),"geral@convecta.pt"]}),a.jsx(p,{size:18})]})]})}),a.jsxs("button",{type:"button",className:"mais-sair",onClick:h,children:[a.jsx(ta,{size:17})," Terminar sessão"]}),a.jsx("div",{className:"mais-rodape",children:"Convecta"})]})]})}const fa="https://www.youtube.com/watch?v=96XY7C_AlTQ",ja=`
.mais-cartaz { display: block; margin: 8px 0 22px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.18); }
.mais-cartaz img { display: block; width: 100%; height: auto; }
.mais { width: 100%; max-width: 560px; min-width: 0; margin: 0 auto; box-sizing: border-box; }
.mais-topo, .mais-bloco, .mais-caixa, .mais-link { min-width: 0; max-width: 100%; }

.mais-topo { text-align: center; padding: 6px 0 26px; }
.mais-logo {
  width: 72px; height: 72px; border-radius: 999px; object-fit: contain;
  background: var(--elevated); border: 1px solid var(--border);
  display: block; margin: 0 auto 12px; padding: 6px;
}
.mais-topo .avatar { margin: 0 auto 12px; }
.mais-nome { font-size: 20px; font-weight: 700; }
.mais-founder { display: inline-block; margin-top: 8px; }
.mais-email { font-size: 14px; color: var(--text-sec); margin-top: 3px; word-break: break-all; }
.mais-link { margin-top: 16px; text-align: left; }
.mais-link .link-faixa { width: 100% !important; max-width: 100% !important; margin: 0 !important; box-sizing: border-box;
  border-radius: 14px; border: 1px solid var(--border); background: var(--surface); padding: 6px 6px 6px 16px !important; gap: 6px !important; }
.mais-link .link-faixa-endereco { font-size: 15px; flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mais-link .link-faixa-btn, .mais-link .link-faixa-ico { flex-shrink: 0; }
.mais-link .link-faixa-btn, .mais-link .link-faixa-ico { width: 40px; height: 40px; min-height: 40px; padding: 0 !important; justify-content: center; border-radius: 12px; }
.mais-link .link-faixa-btn { background: var(--text); color: var(--surface); }
.mais-link .link-faixa-ico { border-color: var(--border); color: var(--text); }

.mais-bloco { margin-bottom: 22px; }
/* O cabeçalho fica FORA da caixa, como nas listas do telemóvel: lá dentro
   leria-se como mais uma linha da lista. */
.mais-h {
  margin: 0 0 8px 14px; font-size: 12px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--text-ter);
}
.mais-caixa {
  border-radius: var(--radius-card); background: var(--elevated);
  border: 1px solid var(--border); overflow: hidden;
}
.mais-linha {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 54px; padding: 0 14px; text-decoration: none;
  color: var(--text); font-size: 16px;
  border-bottom: 1px solid var(--border);
}
.mais-linha:last-child { border-bottom: 0; }
.mais-linha:active { background: rgba(var(--gold-rgb), .10); }
.mais-linha > span { display: flex; align-items: center; gap: 10px; min-width: 0; }
.mais-linha svg:last-child { color: var(--text-ter); flex-shrink: 0; }
button.mais-linha { width: 100%; background: none; border: 0; border-bottom: 1px solid var(--border); font: inherit; cursor: pointer; text-align: left; }
.mais-caixa > .mais-linha:last-child { border-bottom: 0; }
.mais-linha > span { gap: 16px !important; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mais-linha > span > svg { flex-shrink: 0; color: var(--text) !important; }
.mais-bandeira { font-size: 19px; line-height: 1; width: 19px; text-align: center; }
.mais-arroba { width: 19px; text-align: center; font-weight: 700; }
.mais-novas { font-style: normal; min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; background: var(--gold); color: #111; font-size: 12.5px; font-weight: 700; display: inline-grid; place-items: center; flex-shrink: 0; }
.mais-linha { min-height: 58px; }

.mais-sair {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; min-height: 52px; border-radius: var(--radius-card); cursor: pointer; font: inherit;
  font-size: 16px; font-weight: 700;
  border: 1px solid rgba(239, 68, 68, .35); background: rgba(239, 68, 68, .08);
  color: #B91C1C;
}
.mais-rodape {
  text-align: center; font-size: 13px; color: var(--text-ter); padding: 20px 0 6px;
}

/* No computador o menu do lado já mostra tudo: esta página existe para o
   telemóvel, mas se alguém lá chegar não pode estar partida. */
@media (min-width: 768px) {
  .mais { max-width: 640px; }
}
`;export{za as default};
