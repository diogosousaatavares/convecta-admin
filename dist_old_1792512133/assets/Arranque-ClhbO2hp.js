import{u as J,a6 as K,b as X,r as p,b3 as Y,j as e,aI as w,aK as W,ap as Z,O as C,X as ee,C as re,a1 as ae,a3 as oe,R as ie,bQ as te,S as F}from"./index-MSJ5Bzx4.js";import{P as se}from"./plus-DNEwahbF.js";const M={barbearia:[{name:"Corte de Cabelo",durationMinutes:30,price:15},{name:"Barba",durationMinutes:20,price:10},{name:"Corte + Barba",durationMinutes:45,price:22}],cabeleireiro:[{name:"Corte e brushing",durationMinutes:60,price:25},{name:"Brushing",durationMinutes:30,price:15},{name:"Coloração de raiz",durationMinutes:90,price:35},{name:"Madeixas",durationMinutes:120,price:55},{name:"Corte homem",durationMinutes:30,price:12}],unhas:[{name:"Manicure",durationMinutes:30,price:12},{name:"Verniz gel",durationMinutes:45,price:18},{name:"Unhas de gel",durationMinutes:90,price:35},{name:"Manutenção de gel",durationMinutes:75,price:28},{name:"Design de sobrancelhas",durationMinutes:20,price:8},{name:"Extensão de pestanas",durationMinutes:90,price:45}],clinica:[{name:"Avaliação gratuita · presencial",durationMinutes:30,price:0},{name:"Avaliação gratuita · videochamada",durationMinutes:30,price:0},{name:"Aplicação de prótese capilar",durationMinutes:120,price:390},{name:"Manutenção de prótese",durationMinutes:60,price:30}],estetica:[{name:"Limpeza de pele",durationMinutes:60,price:35},{name:"Tratamento facial",durationMinutes:60,price:45},{name:"Massagem de relaxamento",durationMinutes:60,price:40},{name:"Depilação pernas inteiras",durationMinutes:45,price:20},{name:"Depilação axilas",durationMinutes:15,price:7}]},ne={cabeleireiro:{bg:"#FAF7F5",surface:"#FFFFFF",elevated:"#F2ECE8",gold:"#A0694B",text:"#2A211C",textSec:"#6E625A",border:"#E7DED7"},unhas:{bg:"#FDF7F8",surface:"#FFFFFF",elevated:"#F7EBEE",gold:"#B4486D",text:"#2B1E23",textSec:"#75636A",border:"#EED9DF"},clinica:{bg:"#F6F8FA",surface:"#FFFFFF",elevated:"#EBF0F4",gold:"#2F6F8F",text:"#1B2530",textSec:"#5B6875",border:"#DCE3EA"},estetica:{bg:"#F7F8F6",surface:"#FFFFFF",elevated:"#ECEFEA",gold:"#5E7D66",text:"#1F2621",textSec:"#5E6A61",border:"#DDE3DC"}},ce=c=>M[c]||M.barbearia;function de(c){const t=c&&c.colors;return t?String(t.bg||"").toUpperCase()==="#0A0807"&&String(t.gold||"").toUpperCase()==="#FFFFFF":!0}function le(c,t){const l=ne[c];return!l||!de(t)?null:{...t||{},colors:l,fonts:t&&t.fonts||{heading:"Playfair Display",body:"Inter"},background:{ativo:!0,tipo:"linhas",cor:l.gold,intensidade:.35,velocidade:1}}}function pe(c){const t=(c||[]).map(l=>String(l.name||"").trim()).sort().join("|");return Object.values(M).some(l=>l.map(a=>a.name).sort().join("|")===t)}const T=[["monday","Seg"],["tuesday","Ter"],["wednesday","Qua"],["thursday","Qui"],["friday","Sex"],["saturday","Sáb"],["sunday","Dom"]],ue=[15,20,30,45,60,90];function P(c,t,l){const a=(c||[]).filter(d=>d.isOpen&&d[t]);if(!a.length)return l;const h={};return a.forEach(d=>{h[d[t]]=(h[d[t]]||0)+1}),Object.entries(h).sort((d,g)=>g[1]-d[1])[0][0]}function ge(){const c=J(),t=K(),l=X(),a=c==null?void 0:c.business,[h,d]=p.useState(!1),[g,b]=p.useState([]),[N,E]=p.useState("09:00"),[S,k]=p.useState("19:00"),[j,D]=p.useState(()=>new Set(["monday","tuesday","wednesday","thursday","friday","saturday"])),[y,z]=p.useState(!1),[v,I]=p.useState((a==null?void 0:a.tipoNegocio)||"barbearia");p.useEffect(()=>{a!=null&&a.tipoNegocio&&I(a.tipoNegocio)},[a==null?void 0:a.tipoNegocio]);const R=r=>{I(r),te(r),pe(g)&&(d(!0),b(i=>{const o=i.filter(n=>n.id);return ce(r).map((n,m)=>{var x;return{...n,id:(x=o[m])==null?void 0:x.id}})}))};p.useEffect(()=>{if(h)return;const r=(c.services||[]).filter(o=>o.isActive!==!1);r.length&&b(r.map(o=>({id:o.id,name:o.name,price:o.price,durationMinutes:o.durationMinutes||30})));const i=a==null?void 0:a.openingHours;i!=null&&i.length&&(E(P(i,"open","09:00")),k(P(i,"close","19:00")),D(new Set(i.filter(o=>o.isOpen).map(o=>o.day))))},[c.services,a==null?void 0:a.openingHours]);const A=(r,i,o)=>{d(!0),b(n=>n.map((m,x)=>x===r?{...m,[i]:o}:m))},_=r=>{d(!0),b(i=>i.filter((o,n)=>n!==r))},$=()=>{d(!0),b(r=>[...r,{name:"",price:10,durationMinutes:30}])},H=r=>{d(!0),D(i=>{const o=new Set(i);return o.has(r)?o.delete(r):o.add(r),o})},O=a!=null&&a.slug?`${a.slug}.${Y}`:"";async function U(r){await F.updateBusiness({arranque:{feito:!0,em:new Date().toISOString(),...r||{}}})}async function B(r){var o;const i=g.map(n=>({...n,name:(n.name||"").trim(),price:Number(n.price)||0})).filter(n=>n.name);if(!i.length){t.error("Falta pelo menos um serviço",`Escreve o que fazes e a quanto — ${C().id==="barbearia"?"um corte":"um serviço"} chega para começar.`);return}if(S<=N){t.error("Horário ao contrário","A hora de fechar tem de ser depois da de abrir.");return}if(!j.size){t.error("Fechado a semana toda","Escolhe pelo menos um dia em que abres.");return}z(!0);try{const n=(c.services||[]).filter(s=>s.isActive!==!1),m=new Set(i.filter(s=>s.id).map(s=>s.id));for(const s of n)m.has(s.id)||await F.deleteService(s.id);for(const s of i){const u={name:s.name,price:s.price,durationMinutes:Number(s.durationMinutes)||30};if(s.id){const f=n.find(V=>V.id===s.id);f&&f.name===u.name&&f.price===u.price&&f.durationMinutes===u.durationMinutes||await F.updateService(s.id,u)}else await F.createService(u)}const x=(a==null?void 0:a.openingHours)||[],Q=T.map(([s])=>{const u=x.find(L=>L.day===s)||{};return j.has(s)?{...u,day:s,isOpen:!0,open:N,close:S}:{...u,day:s,isOpen:!1}}),q=le(v,(o=a==null?void 0:a._settings)==null?void 0:o.theme);await F.updateBusiness({openingHours:Q,tipoNegocio:v,...q?{theme:q}:{},arranque:{feito:!0,em:new Date().toISOString()}}),t.success("Está feito",`Os teus preços e o teu horário já estão no site ${C().da}.`),l(r)}catch(n){t.error("Não ficou gravado",n&&n.message||"Vê a internet e tenta outra vez.")}finally{z(!1)}}async function G(){try{await U({saltou:!0})}catch{}l("/admin/agenda")}return a?e.jsxs("div",{className:"arr",children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:me}}),e.jsxs("div",{className:"arr-folha",children:[e.jsxs("header",{className:"arr-topo",children:[e.jsx("img",{src:"/admin-logo.png?v=2",alt:"Convecta",className:"arr-marca marca-claro"}),e.jsx("img",{src:"/admin-logo-escuro.png?v=2",alt:"Convecta",className:"arr-marca marca-escuro"}),e.jsx("div",{className:"arr-olho",children:"Um minuto, e está teu"}),e.jsxs("h1",{className:"arr-h1",children:["Confirma os teus preços",e.jsx("br",{}),"e o teu horário"]}),O&&e.jsx("div",{className:"arr-endereco",children:O})]}),e.jsxs("section",{className:"arr-caixa",children:[e.jsx("h2",{className:"arr-h2",children:"O que é o teu negócio"}),v==="misto"?e.jsxs("p",{className:"text-sec",children:[w.misto.nome,": ",((a==null?void 0:a.lados)||[]).map(r=>{var i;return(i=w[r])==null?void 0:i.curto}).filter(Boolean).join(" e ")||"os dois lados definem-se nas Definições","."]}):e.jsx("div",{className:"arr-tipos",children:W.map(r=>e.jsx("button",{type:"button","aria-pressed":v===r,className:`arr-tipo${v===r?" on":""}`,onClick:()=>R(r),children:w[r].nome},r))})]}),e.jsxs("section",{className:"arr-caixa",children:[e.jsxs("h2",{className:"arr-h2",children:[e.jsx(Z,{size:16})," O que fazes, e a quanto"]}),e.jsx("div",{className:"arr-servicos",children:g.map((r,i)=>e.jsxs("div",{className:"arr-servico",children:[e.jsx("input",{className:"arr-campo arr-nome",value:r.name,placeholder:C().id==="barbearia"?"Corte":"Serviço","aria-label":"Nome do serviço",onChange:o=>A(i,"name",o.target.value)}),e.jsxs("div",{className:"arr-linha2",children:[e.jsxs("div",{className:"arr-preco",children:[e.jsx("input",{className:"arr-campo",type:"number",min:"0",step:"0.5",inputMode:"decimal","aria-label":"Preço",value:r.price,onChange:o=>A(i,"price",o.target.value)}),e.jsx("span",{className:"arr-euro",children:"€"})]}),e.jsx("select",{className:"arr-campo arr-demora",value:r.durationMinutes,"aria-label":"Duração",onChange:o=>A(i,"durationMinutes",Number(o.target.value)),children:ue.map(o=>e.jsxs("option",{value:o,children:[o," min"]},o))}),e.jsx("button",{type:"button",className:"arr-x",onClick:()=>_(i),"aria-label":`Apagar ${r.name||"serviço"}`,children:e.jsx(ee,{size:16})})]})]},r.id||`novo-${i}`))}),e.jsxs("button",{type:"button",className:"arr-juntar",onClick:$,children:[e.jsx(se,{size:16})," Juntar outro serviço"]})]}),e.jsxs("section",{className:"arr-caixa",children:[e.jsxs("h2",{className:"arr-h2",children:[e.jsx(re,{size:16})," A que horas abres"]}),e.jsxs("div",{className:"arr-horas",children:[e.jsxs("label",{className:"arr-hora",children:[e.jsx("span",{children:"Abre"}),e.jsx("input",{className:"arr-campo",type:"time",value:N,onChange:r=>{d(!0),E(r.target.value)}})]}),e.jsxs("label",{className:"arr-hora",children:[e.jsx("span",{children:"Fecha"}),e.jsx("input",{className:"arr-campo",type:"time",value:S,onChange:r=>{d(!0),k(r.target.value)}})]})]}),e.jsx("div",{className:"arr-dias",children:T.map(([r,i])=>e.jsx("button",{type:"button","aria-pressed":j.has(r),className:`arr-dia${j.has(r)?" on":""}`,onClick:()=>H(r),children:i},r))})]}),e.jsx("button",{type:"button",className:"arr-btn arr-btn-forte",disabled:y,onClick:()=>B("/admin/agenda"),children:y?"A guardar…":e.jsxs(e.Fragment,{children:[e.jsx(ae,{size:17})," Guardar e ver a minha agenda"]})}),e.jsxs("section",{className:"arr-caixa arr-cartao",children:[e.jsxs("h2",{className:"arr-h2",children:[e.jsx(oe,{size:16})," Quando quiseres receber marcações"]}),e.jsxs("button",{type:"button",className:"arr-btn",disabled:y,onClick:()=>B("/admin/subscricao"),children:["Guardar e activar com 14 dias grátis ",e.jsx(ie,{size:15})]})]}),e.jsx("button",{type:"button",className:"arr-depois",onClick:G,disabled:y,children:"Faço isto depois"})]})]}):null}const me=`
.arr {
  --cvA: #FEE96D;            /* o amarelo do site */
  --cvA-t: #8A6D0A;          /* o amarelo não se lê em texto pequeno */
  --cvI: #24201C;            /* quase preto, mas quente */
  --cvI2: #5F5852;
  --cvL: rgba(36, 32, 28, 0.10);
  --cvF: #FBFAF8;            /* branco de folha é duro */
  min-height: 100vh; background: var(--cvF); color: var(--cvI);
  padding: 32px 16px calc(40px + env(safe-area-inset-bottom, 0px));
}
.arr-folha { width: 100%; min-width: 0; box-sizing: border-box; max-width: 580px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }

.arr-topo { text-align: center; margin-bottom: 6px; }
/* Este ecra e sempre claro, mesmo com o painel em modo escuro — por isso o
   logotipo e sempre o de fundo claro. Sem isto, um barbeiro com o painel
   escuro via um logotipo branco em cima de papel branco, ou seja, nada. */
.arr .marca-claro { display: block !important; }
.arr .marca-escuro { display: none !important; }
.arr-marca { width: 46px; height: 46px; object-fit: contain; margin: 0 auto 16px; display: block; }
.arr-olho {
  font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase;
  color: var(--cvA-t);
}
.arr-h1 {
  margin: 10px 0 0; font-size: 30px; line-height: 1.15; letter-spacing: -.02em;
  font-weight: 700; color: var(--cvI); text-wrap: balance;
}
.arr-endereco {
  display: inline-block; margin-top: 12px; padding: 6px 13px; border-radius: 999px;
  background: rgba(254, 233, 109, .35); border: 1px solid rgba(254, 233, 109, .9);
  font-size: 13.5px; font-weight: 700; color: var(--cvI); word-break: break-all;
}

.arr-caixa {
  background: #FFF; border: 1px solid var(--cvL); border-radius: 16px; padding: 18px 16px;
}
.arr-h2 {
  display: flex; align-items: center; gap: 9px; margin: 0 0 14px;
  font-size: 16px; font-weight: 700; color: var(--cvI);
}
.arr-h2 svg { color: var(--cvA-t); flex-shrink: 0; }

/* ── Serviços ─────────────────────────────────────────────────────────────
   Cada serviço é um bloco, não uma linha. Nome em cima, a toda a largura —
   «Corte + Barba» numa caixa de 120px é uma caixa onde não se lê o que se
   escreveu. Preço, duração e apagar na linha de baixo, que é onde cabem. */
.arr-servicos { display: flex; flex-direction: column; gap: 12px; }
.arr-servico {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px; border-radius: 12px; background: var(--cvF); border: 1px solid var(--cvL);
}
.arr-linha2 { display: flex; gap: 8px; align-items: stretch; }
.arr-campo {
  width: 100%; min-height: 46px; padding: 0 13px; border-radius: 10px;
  border: 1px solid var(--cvL); background: #FFF; color: var(--cvI);
  font: inherit; font-size: 16px;   /* 16px: abaixo disto o iPhone faz zoom */
}
.arr-campo:focus { outline: 2px solid var(--cvA); outline-offset: 1px; border-color: transparent; }
.arr-nome { font-weight: 700; }
.arr-preco { position: relative; flex: 1 1 0; min-width: 0; }
.arr-preco .arr-campo { padding-right: 30px; }
.arr-euro {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--cvI2); font-size: 15px; pointer-events: none;
}
.arr-demora { flex: 1 1 0; min-width: 0; }
.arr-x {
  flex: 0 0 46px; width: 46px; min-height: 46px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--cvL); background: #FFF; color: #B4231F;
  display: grid; place-items: center;
}
.arr-juntar {
  margin-top: 12px; width: 100%; min-height: 46px; border-radius: 10px; cursor: pointer;
  border: 1px dashed rgba(36, 32, 28, .22); background: transparent; color: var(--cvI2);
  font: inherit; font-size: 15px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.arr-juntar:hover { border-color: var(--cvA-t); color: var(--cvI); }

/* ── Horário ───────────────────────────────────────────────────────────── */
.arr-horas { display: flex; gap: 10px; margin-bottom: 16px; }
.arr-hora { flex: 1; min-width: 0; display: block; }
.arr-hora span {
  display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--cvI2);
}
.arr-tipos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.arr-tipo { min-height: 48px; padding: 8px 10px; border-radius: 12px; border: 1px solid var(--cvL);
  background: #FFF; color: var(--cvI); font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; text-align: center; line-height: 1.25; }
.arr-tipo.on { background: var(--cvA); border-color: var(--cvA); color: var(--cvI); font-weight: 800; }
.arr-dias { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }
.arr-dia {
  min-height: 46px; padding: 0 2px; border-radius: 10px; cursor: pointer; font: inherit;
  font-size: 14px; font-weight: 600; border: 1px solid var(--cvL);
  background: #FFF; color: #9A938B;
}
.arr-dia.on {
  background: var(--cvA); border-color: var(--cvA); color: var(--cvI); font-weight: 800;
}

/* ── Botões ────────────────────────────────────────────────────────────── */
.arr-btn {
  width: 100%; min-height: 52px; border-radius: 999px; cursor: pointer; font: inherit;
  font-size: 16px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; gap: 9px;
  border: 1px solid var(--cvL); background: #FFF; color: var(--cvI);
}
.arr-btn:disabled { opacity: .55; cursor: default; }
.arr-btn-forte {
  background: var(--cvA); border-color: var(--cvA); color: var(--cvI);
  box-shadow: 0 6px 20px rgba(254, 233, 109, .55);
}
.arr-cartao { border-color: rgba(254, 233, 109, .9); background: rgba(254, 233, 109, .16); }
.arr-cartao .arr-btn { background: #FFF; }
.arr-depois {
  background: none; border: 0; cursor: pointer; font: inherit; font-size: 15px;
  color: #8A837B; text-decoration: underline; padding: 8px 0; margin-top: 2px;
}

@media (min-width: 560px) {
  .arr { padding-top: 48px; }
  .arr-caixa { padding: 22px 20px; }
  .arr-h1 { font-size: 34px; }
  /* Com espaço, o serviço volta a ser uma linha só. */
  .arr-servico { flex-direction: row; align-items: center; gap: 10px; }
  .arr-nome { flex: 1 1 auto; }
  .arr-linha2 { flex: 0 0 auto; }
  .arr-preco { flex: 0 0 104px; }
  .arr-demora { flex: 0 0 116px; }
}
`;export{ge as default};
