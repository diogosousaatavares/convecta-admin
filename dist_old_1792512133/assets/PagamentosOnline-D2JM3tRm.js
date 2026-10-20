import{L as aa,b as Ta,u as _a,a6 as $a,r as i,ac as Pa,j as a,E as qa,N as Ea,a3 as ba,X as Da,a1 as q,K as r,C as Oa,aH as fa,a0 as U,a2 as La,S as wa,I as da,bE as Va,R as Fa,a4 as Ia,ax as ya,aU as Ba,bF as Ra,bG as Ga}from"./index-MSJ5Bzx4.js";import{A as Ya}from"./AdminPage-p1npQ__1.js";import{T as Ua}from"./Toggle-D1lTDtur.js";import{a as Wa,b as Ha,s as Na,m as Ja,t as Qa}from"./extras-AJUvjiVQ.js";import{u as Xa}from"./Confirmar-p487P84g.js";import{M as ka}from"./MetodosPagamento-BL1wwVTv.js";import{S as Ka}from"./store-CTZWVXnw.js";import"./BotaoAtualizar-DGCccYs1.js";import"./SeparadoresDaFamilia-RN2o2tRb.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]],ae=aa("Building2",Za);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polygon",{points:"10 8 16 12 10 16 10 8",key:"1cimsy"}]],Ma=aa("CirclePlay",ee);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=[["path",{d:"M16 10h2",key:"8sgtl7"}],["path",{d:"M16 14h2",key:"epxaof"}],["path",{d:"M6.17 15a3 3 0 0 1 5.66 0",key:"n6f512"}],["circle",{cx:"9",cy:"11",r:"2",key:"yxgjnd"}],["rect",{x:"2",y:"5",width:"20",height:"14",rx:"2",key:"qneu4z"}]],se=aa("IdCard",oe);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=[["line",{x1:"3",x2:"21",y1:"22",y2:"22",key:"j8o0r"}],["line",{x1:"6",x2:"6",y1:"18",y2:"11",key:"10tf0k"}],["line",{x1:"10",x2:"10",y1:"18",y2:"11",key:"54lgf6"}],["line",{x1:"14",x2:"14",y1:"18",y2:"11",key:"380y"}],["line",{x1:"18",x2:"18",y1:"18",y2:"11",key:"1kevvc"}],["polygon",{points:"12 2 20 7 4 7",key:"jkujk7"}]],za=aa("Landmark",ie);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],re=aa("UserRound",te),ga=async b=>{var h,v;const{data:p,error:u}=await Pa.functions.invoke("pagamentos-ligar",{body:b});if(u){let C=u.message;try{C=((v=await((h=u.context)==null?void 0:h.json()))==null?void 0:v.erro)||C}catch{}throw new Error(C)}if(p!=null&&p.erro)throw new Error(p.erro);return p},va="https://youtu.be/ViSip1m6-K0",Sa={pago:["Pago","var(--success)"],pendente:["Por pagar","var(--warning, #b45309)"],expirou:["Não pagou","var(--text-ter)"],reembolsado:["Devolvido","var(--text-ter)"]},ua=b=>new Date(b+"T12:00:00").toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"}),Ca=b=>new Date(b).toLocaleString("pt-PT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});function fe(){var K,Z,ja;const b=Ta(),p=_a(),u=$a(),h=((K=p.business)==null?void 0:K.pagamentosOnline)||{},[v,C]=i.useState(null),[ea,m]=i.useState(""),[j,oa]=i.useState(!1),N=(p.services||[]).filter(e=>e.isActive&&!e.orcamento&&Number(e.price)>0),D=e=>e==="sinal"?"metade":e||"nada",[l,W]=i.useState(D(h.modo)),[f,O]=i.useState(null),[k,z]=i.useState(h.obrigatorio!==!1),[A,M]=i.useState([]),[t,d]=i.useState(null),[H,L]=i.useState(!1),[xa,P]=i.useState(!1),[sa,J]=i.useState(!1),[ia,E]=i.useState(!1),[V,ta]=i.useState(!1),[T,x]=i.useState(!1),[F,I]=i.useState(!1),[S,B]=i.useState(!1),[ha,ra]=Xa();i.useEffect(()=>{W(D(h.modo)),O(Array.isArray(h.servicos)?h.servicos:null),z(h.obrigatorio!==!1)},[h.modo,h.servicos,h.obrigatorio]),i.useEffect(()=>{ga({acao:"estado"}).then(e=>{C(e),e!=null&&e.ligado&&ga({acao:"saldo"}).then(d).catch(()=>d(null))}).catch(e=>{m(e.message),C({ligado:!1,ativo:!1})}),Pa.from("pagamentos_online").select("id, valor_cents, tipo, estado, criado_em, pago_em").order("criado_em",{ascending:!1}).limit(10).then(({data:e})=>M(e||[]))},[]);const na=!p.business||Wa(p.business,"pagamentos"),pa=!!(v!=null&&v.ativo),R=e=>f==null||f.includes(e),w=N.filter(e=>R(e.id)).length,ma=async e=>{oa(!0),m("");try{const s=await ga({acao:"ligar",...typeof e=="string"?{tipo:e}:{}});window.location.href=s.url}catch(s){m(s.message),oa(!1),u.error("Não foi possível abrir o Stripe",s.message)}},G=async e=>{const s={modo:l,servicos:f,obrigatorio:k,...e};if(s.modo!=="nada"&&Array.isArray(s.servicos)&&s.servicos.length===0){u.error("Escolhe pelo menos um serviço");return}"modo"in e&&W(s.modo),"servicos"in e&&O(s.servicos),"obrigatorio"in e&&z(s.obrigatorio);try{await wa.updateBusiness({pagamentosOnline:{modo:s.modo,servicos:s.modo==="nada"?null:s.servicos,obrigatorio:s.obrigatorio}}),u.success("Guardado")}catch(c){u.error("Não ficou gravado",c.message)}},ca=async e=>{try{return await wa.updateBusiness({pagamentosOnline:{modo:e.modo,servicos:e.servicos,obrigatorio:e.obrigatorio}}),W(e.modo),O(e.servicos),z(e.obrigatorio),!0}catch(s){return u.error("Não ficou gravado",s.message),!1}},y=e=>{const s=f??N.map($=>$.id),c=s.includes(e)?s.filter($=>$!==e):[...s,e];O(N.every($=>c.includes($.id))?null:c)},_=["anual","quinzenal"].includes((Z=p.business)==null?void 0:Z.billingPeriod)?p.business.billingPeriod:"mensal",Q=Ha("pagamentos"),la=()=>ha({titulo:"Juntar os pagamentos online?",texto:Qa(Q,_,r),botao:"Sim, juntar",perigoso:!1,aoConfirmar:async()=>{B(!0);try{await Ja("pagamentos",!0),u.success("Pagamentos online juntos à subscrição"),setTimeout(()=>window.location.reload(),700)}catch(e){throw u.error("Não foi possível",e.message),B(!1),e}}});if(!pa){const e=()=>window.history.length>1?b(-1):b("/admin/dashboard");return a.jsxs(qa,{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:Aa}}),Ea.createPortal(a.jsxs("section",{className:"po-capa po-capa-cheia",children:[a.jsxs("div",{className:"po-capa-cabeca",children:[a.jsxs("div",{className:"po-selo",children:[a.jsx("span",{children:a.jsx(ba,{size:16})}),"Pagamentos online"]}),a.jsx("button",{type:"button",className:"po-capa-fechar",onClick:e,"aria-label":"Fechar",children:a.jsx(Da,{size:26})})]}),a.jsx("div",{className:"po-capa-fundo","aria-hidden":"true"}),a.jsx("img",{className:"po-capa-fones",src:"/pagamentos/pagamentos-online-telemoveis-v4-900.png",srcSet:"/pagamentos/pagamentos-online-telemoveis-v4-900.png 778w, /pagamentos/pagamentos-online-telemoveis-v4.png 1557w",sizes:"(max-width: 767px) 92vw, 50vw",alt:""}),a.jsxs("div",{className:"po-capa-texto",children:[a.jsxs("h2",{className:"po-h",children:["O cliente paga ao marcar. ",a.jsx("em",{children:"Acabam as faltas."})]}),a.jsxs("ul",{className:"po-checks",children:[a.jsxs("li",{children:[a.jsx(q,{size:17})," Metade ou tudo, nos serviços que escolheres"]}),a.jsxs("li",{children:[a.jsx(q,{size:17})," Cartão, Apple Pay, Google Pay e MB WAY"]}),a.jsxs("li",{children:[a.jsx(q,{size:17})," O dinheiro vai direto para o teu banco"]})]}),a.jsx("div",{className:"po-preco",children:"1,5 % + 0,25 € por pagamento"}),!na&&a.jsxs("div",{className:"po-preco-sub",children:["+",r(Q.precos[_]),Na(_)," na subscrição · incluído no Profissional e Business"]}),ea&&a.jsx("div",{className:"text-sm",style:{color:"var(--error)",marginTop:10},children:ea}),a.jsxs("div",{className:"po-acoes",children:[a.jsx("button",{type:"button",className:"po-btn",disabled:j,onClick:()=>L(!0),children:j?"A abrir o Stripe…":"Começar já"}),a.jsx("a",{className:"po-link",href:"https://convecta.pt/pagamentos-online",target:"_blank",rel:"noreferrer",children:"Saber mais"}),a.jsxs("a",{className:"po-link po-link-video",href:va,target:"_blank",rel:"noreferrer",children:[a.jsx(Ma,{size:18})," Ver o vídeo"]})]}),a.jsxs("div",{className:"po-capa-stripe",children:[a.jsxs("span",{children:["Pagamentos seguros com ",a.jsx("b",{children:"Stripe"})]}),a.jsx(ka,{altura:15})]})]})]}),document.body),H&&a.jsx(pe,{fechar:()=>L(!1),temExtra:na,juntar:la,aJuntar:S,irStripe:ma,aAbrir:j,jaLigado:!!(v!=null&&v.ligado),precoExtra:`+${r(Q.precos[_])}${Na(_)}`,servicos:N.map(s=>({...s,price:Number(s.price)})),inicial:{modo:l,obrigatorio:k,servicos:f},guardar:ca}),a.jsx(ra,{})]})}const Y=(ja=t==null?void 0:t.aCaminho)==null?void 0:ja[0],o={nada:"Nada",metade:"Metade",total:"Tudo"},n=e=>e.estado==="pendente"&&Date.now()-new Date(e.criado_em).getTime()>35*6e4?"expirou":e.estado,g=(e,s,c,$)=>a.jsxs("button",{type:"button",className:"nt-row po-linha-botao",onClick:c,children:[a.jsx("span",{className:"nt-txt",children:a.jsxs("b",{className:"po-nowrap",children:[e,$]})}),a.jsx("span",{className:"text-sec po-nowrap po-valor",children:s}),a.jsx(da,{size:18,className:"po-seta"})]}),X=(e,s,c)=>a.jsxs("a",{className:"nt-row po-linha-botao",href:c,target:"_blank",rel:"noreferrer",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{className:"po-nowrap",children:e})}),a.jsx("span",{className:"text-sec po-nowrap po-valor",children:s}),a.jsx(fa,{size:16,className:"po-seta"})]});return a.jsxs(Ya,{title:"Pagamentos online",children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:Aa}}),a.jsxs("div",{className:"po-pagina",children:[a.jsxs("div",{className:"po-resumo",children:[a.jsxs("span",{className:"po-ligados",children:[a.jsx(q,{size:15})," Pagamentos ligados"]}),a.jsx("span",{className:"po-rotulo",children:"Recebes este mês"}),a.jsx("b",{className:"po-grande",children:t?r(t.mes.liquido):"—"}),a.jsx("span",{className:"po-sub",children:t?`${t.mes.pagamentos} ${t.mes.pagamentos===1?"pagamento":"pagamentos"} · ${r(t.mes.bruto)} pagos · Stripe ${r(t.mes.taxas)}`:"A ler o Stripe…"})]}),a.jsxs("div",{className:"nt-lista",children:[t&&g("Próximo depósito",Y?`${r(Y.valor)} · ${ua(Y.dia)}`:"Nada a caminho",()=>ta(!0)),t&&!t.depositos.some(e=>e.estado==="paid")&&a.jsxs("div",{className:"po-primeiro",children:[a.jsx(Oa,{size:15}),a.jsx("span",{children:"O primeiro depósito demora 7 dias. Depois é todos os dias."})]}),t&&!t.automatico&&a.jsxs("a",{className:"nt-row po-linha-botao po-alerta",href:"https://dashboard.stripe.com/balance/overview",target:"_blank",rel:"noreferrer",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{className:"po-nowrap",children:"Ligar os depósitos automáticos"})}),a.jsx(fa,{size:16,className:"po-seta"})]})]}),a.jsxs("div",{className:"nt-titulo po-titulo-sec",children:[a.jsx("span",{children:"As tuas regras"}),a.jsx("em",{children:"mudas aqui"})]}),a.jsxs("div",{className:"nt-lista",children:[g("Quanto pagam ao marcar",o[l],()=>J(!0)),l!=="nada"&&a.jsxs(a.Fragment,{children:[g("Pagamento",k?"Obrigatório":"Opcional",()=>E(!0)),g("Em que serviços",f==null?`Todos (${N.length})`:`${w} de ${N.length}`,()=>P(!0))]})]}),A.length>0&&a.jsxs(a.Fragment,{children:[a.jsx("div",{className:"nt-titulo",children:"Pagamentos recebidos"}),a.jsxs("div",{className:"nt-lista",children:[A.slice(0,3).map(e=>{const[s,c]=Sa[n(e)]||[e.estado,"var(--text-sec)"];return a.jsxs("div",{className:"nt-row",children:[a.jsxs("span",{className:"nt-txt",children:[a.jsx("b",{className:"po-nowrap",children:r(e.valor_cents/100)}),a.jsx("span",{className:"po-nowrap",children:Ca(e.pago_em||e.criado_em)})]}),a.jsx("span",{className:"fw-600 text-sm po-nowrap",style:{color:c},children:s})]},e.id)}),A.length>3&&g("Ver todos",`${A.length}`,()=>x(!0))]})]}),a.jsxs("div",{className:"nt-titulo po-titulo-sec",children:[a.jsx("span",{children:"Conta Stripe"}),a.jsx("em",{children:"mudas no Stripe"})]}),a.jsxs("div",{className:"nt-lista",children:[g("O que o Stripe cobra","1,5 % + 0,25 €",()=>I(!0)),X("MB WAY","Ligar no Stripe","https://dashboard.stripe.com/settings/payment_methods"),X("Abrir o Stripe","IBAN, depósitos","https://dashboard.stripe.com/"),X("Vídeo: como funciona","YouTube",va)]})]}),a.jsxs(U,{open:sa,onClose:()=>J(!1),title:"O cliente paga ao marcar",children:[a.jsx("div",{className:"po-escolhas",children:[["nada","Nada","Paga tudo na loja, como hoje."],["metade","Metade","Metade ao marcar, o resto na loja."],["total","Tudo","O serviço todo ao marcar. Na loja não paga nada."]].map(([e,s,c])=>a.jsxs("button",{type:"button",className:`po-escolha${l===e?" on":""}`,onClick:()=>{G({modo:e}),J(!1)},children:[a.jsx("span",{className:"po-escolha-bola",children:l===e&&a.jsx(q,{size:14})}),a.jsxs("span",{children:[a.jsx("b",{children:s}),a.jsx("span",{children:c})]})]},e))}),a.jsx(ka,{altura:14,style:{marginTop:14}})]}),a.jsx(U,{open:ia,onClose:()=>E(!1),title:"O pagamento é…",children:a.jsx("div",{className:"po-escolhas",children:[[!0,"Obrigatório","O cliente paga ao marcar. Sem pagar, não há marcação e a hora continua livre. Acaba com as faltas."],[!1,"Opcional","O cliente escolhe «Pagar já» ou «Pagar na loja». A marcação fica sempre."]].map(([e,s,c])=>a.jsxs("button",{type:"button",className:`po-escolha${k===e?" on":""}`,onClick:()=>{G({obrigatorio:e}),E(!1)},children:[a.jsx("span",{className:"po-escolha-bola",children:k===e&&a.jsx(q,{size:14})}),a.jsxs("span",{children:[a.jsx("b",{children:s}),a.jsx("span",{children:c})]})]},s))})}),a.jsx(U,{open:xa,onClose:()=>{P(!1),G({servicos:f})},title:"Em que serviços",footer:a.jsx("div",{className:"botoes-iguais",children:a.jsx(La,{onClick:()=>{P(!1),G({servicos:f})},children:"Feito"})}),children:a.jsxs("div",{className:"nt-lista",children:[a.jsxs("label",{className:"nt-row",style:{cursor:"pointer"},children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Todos os serviços"})}),a.jsx(Ua,{checked:f==null,onChange:e=>O(e?null:[])})]}),N.map(e=>a.jsxs("label",{className:"nt-row",style:{cursor:"pointer"},children:[a.jsx("input",{type:"checkbox",checked:R(e.id),onChange:()=>y(e.id),style:{width:18,height:18,accentColor:"var(--gold)",flexShrink:0}}),a.jsx("span",{className:"nt-txt",style:{minWidth:0},children:a.jsx("b",{className:"po-nowrap",style:{overflow:"hidden",textOverflow:"ellipsis"},children:e.name})}),a.jsx("span",{className:"text-sec text-sm po-nowrap",children:R(e.id)?r(l==="metade"?Math.round(e.price*50)/100:e.price):"na loja"})]},e.id))]})}),a.jsxs(U,{open:V,onClose:()=>ta(!1),title:"O teu dinheiro",children:[t&&a.jsxs("div",{className:"nt-lista",children:[a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Pago este mês"})}),a.jsx("span",{className:"fw-600 po-nowrap",children:r(t.mes.bruto)})]}),a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Ficou para o Stripe"})}),a.jsx("span",{className:"fw-600 po-nowrap",children:r(t.mes.taxas)})]}),a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Recebes"})}),a.jsx("span",{className:"fw-600 po-nowrap",style:{color:"var(--success)"},children:r(t.mes.liquido)})]}),t.aCaminho.map(e=>a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"A caminho do banco"})}),a.jsxs("span",{className:"fw-600 po-nowrap",children:[r(e.valor)," · ",ua(e.dia)]})]},e.dia)),t.disponivel>0&&a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Pronto a ir para o banco"})}),a.jsx("span",{className:"fw-600 po-nowrap",children:r(t.disponivel)})]}),t.depositos.map((e,s)=>a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:e.estado==="paid"?"Depositado":"Depósito a caminho"})}),a.jsxs("span",{className:"fw-600 po-nowrap",children:[r(e.valor)," · ",ua(e.chega)]})]},s))]}),a.jsx("p",{className:"text-sec text-sm",style:{marginTop:14,lineHeight:1.55},children:"Nas contas novas o primeiro pagamento espera 7 dias no Stripe. Depois o Stripe deposita todos os dias o que estiver disponível; chega ao banco em 1 a 2 dias úteis."})]}),a.jsx(U,{open:T,onClose:()=>x(!1),title:"Pagamentos",children:a.jsx("div",{className:"nt-lista",children:A.map(e=>{const[s,c]=Sa[n(e)]||[e.estado,"var(--text-sec)"];return a.jsxs("div",{className:"nt-row",children:[a.jsxs("span",{className:"nt-txt",children:[a.jsx("b",{className:"po-nowrap",children:r(e.valor_cents/100)}),a.jsxs("span",{className:"po-nowrap",children:[e.tipo==="total"?"Serviço":"Metade"," · ",Ca(e.pago_em||e.criado_em)]})]}),a.jsx("span",{className:"fw-600 text-sm po-nowrap",style:{color:c},children:s})]},e.id)})})}),a.jsxs(U,{open:F,onClose:()=>I(!1),title:"O que o Stripe cobra",children:[a.jsxs("div",{className:"nt-lista",children:[a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Cartões europeus, Apple Pay, Google Pay, MB WAY"})}),a.jsx("span",{className:"fw-600 po-nowrap",children:"1,5 % + 0,25 €"})]}),a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Cartões do Reino Unido"})}),a.jsx("span",{className:"fw-600 po-nowrap",children:"2,5 % + 0,25 €"})]}),a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Cartões de fora da Europa"})}),a.jsx("span",{className:"fw-600 po-nowrap",children:"3,15 % + 0,25 €"})]}),a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Depósitos para o banco"})}),a.jsx("span",{className:"fw-600 po-nowrap",style:{color:"var(--success)"},children:"Grátis"})]}),a.jsxs("div",{className:"nt-row",children:[a.jsx("span",{className:"nt-txt",children:a.jsx("b",{children:"Convecta"})}),a.jsx("span",{className:"fw-600 po-nowrap",style:{color:"var(--success)"},children:"0 %"})]})]}),a.jsx("p",{className:"text-sec text-sm",style:{marginTop:14},children:"Num corte de 15 € recebes 14,52 €; em 25 € recebes 24,38 €."})]}),a.jsx(ra,{})]})}const ne=[15,20,25,30,40,50,75,100,150];function pe({fechar:b,temExtra:p,juntar:u,aJuntar:h,irStripe:v,aAbrir:C,precoExtra:ea,servicos:m,inicial:j,guardar:oa,jaLigado:N}){const D=["intro","taxas","quanto","obrigatorio","servicos",...N?[]:["tipo"],"pronto"],[l,W]=i.useState(0),[f,O]=i.useState("frente"),k=j.modo==="metade"||j.modo==="total",[z,A]=i.useState(k?j.modo:null),[M,t]=i.useState(k?j.obrigatorio:null),[d,H]=i.useState(Array.isArray(j.servicos)?"escolho":k?"todos":null),[L,xa]=i.useState(Array.isArray(j.servicos)?j.servicos:[]),[P,sa]=i.useState(null),[J,ia]=i.useState(!1),E=ne.filter(o=>{const n=m.filter(g=>g.price>=o).length;return n>0&&n<m.length}).slice(0,4),[V,ta]=i.useState(E[Math.floor((E.length-1)/2)]??null),T=V==null?[]:m.filter(o=>o.price>=V).map(o=>o.id);i.useEffect(()=>{const o=document.body.style.overflow;document.body.style.overflow="hidden";const n=g=>{g.key==="Escape"&&b()};return window.addEventListener("keydown",n),()=>{document.body.style.overflow=o,window.removeEventListener("keydown",n)}},[b]);const x=D[l],F=o=>{O(o<l?"tras":"frente"),W(o)},I=o=>F(D.indexOf(o)),S=(o,n)=>{o(n),setTimeout(()=>F(l+1),240)},B=d==="todos"?null:d==="caros"?T:L,ha=B==null?m.length:B.length,ra=["quanto","obrigatorio","tipo"].includes(x)||x==="servicos"&&d!=="caros"&&d!=="escolho",na={intro:!0,taxas:!0,quanto:!!z,obrigatorio:M!=null,servicos:d!=null&&ha>0,tipo:!!P,pronto:!0}[x],pa=x==="pronto",R=[...m].sort((o,n)=>o.price-n.price),w=R[Math.floor(R.length/2)],ma=w?Math.round(w.price*50)/100:0,G=async()=>{ia(!0);const o=await oa({modo:z,obrigatorio:M,servicos:B});ia(!1),o&&(p?v(P):u())},ca=C||h||J,y=(o,n,g,X,K,Z)=>a.jsxs("button",{type:"button",className:`pa-cartao${o?" on":""}`,onClick:X,children:[a.jsxs("span",{className:"pa-cartao-txt",children:[a.jsxs("b",{children:[n,Z&&a.jsx("i",{className:"pa-selo",children:Z})]}),a.jsx("span",{children:g})]}),K&&a.jsx("span",{className:"pa-ico pa-ico-p",children:a.jsx(K,{size:20})})]}),_=o=>xa(n=>n.includes(o)?n.filter(g=>g!==o):[...n,o]),Q=d==="todos"?`Todos (${m.length})`:d==="caros"?`A partir de ${V} € (${T.length})`:`${L.length} de ${m.length}`,la=D.slice(2),Y=la.indexOf(x);return Ea.createPortal(a.jsxs("div",{className:"pa",role:"dialog","aria-modal":"true","aria-label":"Ligar os pagamentos online",children:[Y>=0&&a.jsx("div",{className:"pa-barra",children:la.map((o,n)=>a.jsx("span",{className:n<=Y?"on":""},o))}),a.jsxs("div",{className:"pa-topo",children:[l>0?a.jsx("button",{type:"button",className:"pa-redondo",onClick:()=>F(l-1),"aria-label":"Voltar",children:a.jsx(Va,{size:20})}):a.jsx("span",{}),a.jsxs("div",{className:"pa-botoes",children:[a.jsx("button",{type:"button",className:"pa-fechar",onClick:b,children:"Fechar"}),!ra&&a.jsxs("button",{type:"button",className:"pa-seguinte",disabled:!na||ca,onClick:()=>pa?G():F(l+1),children:[pa?ca?"A abrir…":p?"Ir para o Stripe":"Juntar e continuar":"Continuar"," ",a.jsx(Fa,{size:17})]})]})]}),a.jsx("div",{className:"pa-corpo",children:a.jsxs("div",{className:`pa-passo ${f}`,children:[x==="intro"&&a.jsxs("div",{className:"pa-duas",children:[a.jsx("h2",{className:"pa-h",children:"Recebe ao marcar, de forma rápida e segura com Stripe"}),a.jsxs("div",{className:"pa-lista",children:[a.jsxs("div",{children:[a.jsxs("div",{children:[a.jsx("h3",{children:"O cliente paga ao marcar"}),a.jsx("p",{children:"Metade ou o serviço todo, só nos serviços que escolheres. Sem pagamento, não há marcação: acabam as faltas."})]}),a.jsx("span",{className:"pa-ico",children:a.jsx(ba,{size:24})})]}),a.jsxs("div",{children:[a.jsxs("div",{children:[a.jsx("h3",{children:"Cartão, Apple Pay, Google Pay e MB WAY"}),a.jsx("p",{children:"O cliente paga no telemóvel em segundos, numa página segura do Stripe."})]}),a.jsx("span",{className:"pa-ico",children:a.jsx(Ia,{size:24})})]}),a.jsxs("div",{children:[a.jsxs("div",{children:[a.jsx("h3",{children:"O dinheiro é teu"}),a.jsx("p",{children:"Vai para a tua conta Stripe e daí para o teu banco, todos os dias. A Convecta não fica com nada."})]}),a.jsx("span",{className:"pa-ico",children:a.jsx(za,{size:24})})]})]})]}),x==="taxas"&&a.jsxs("div",{className:"pa-meio",children:[a.jsx("h2",{className:"pa-h",children:"Taxas simples"}),a.jsx("p",{className:"pa-sub",children:"Sem mensalidade no Stripe: só pagas quando recebes."}),a.jsxs("div",{className:"pa-tabela",children:[a.jsxs("div",{children:[a.jsxs("span",{children:[a.jsx("b",{children:"Depósitos para o teu banco"}),"Todos os dias, sozinhos"]}),a.jsx("em",{className:"gratis",children:"Grátis"})]}),a.jsxs("div",{children:[a.jsxs("span",{children:[a.jsx("b",{children:"Cartões europeus, Apple Pay, Google Pay, MB WAY"}),"Por pagamento"]}),a.jsx("em",{children:"1,5 % + 0,25 €"})]}),a.jsxs("div",{children:[a.jsxs("span",{children:[a.jsx("b",{children:"Cartões do Reino Unido"}),"Por pagamento"]}),a.jsx("em",{children:"2,5 % + 0,25 €"})]}),a.jsxs("div",{children:[a.jsxs("span",{children:[a.jsx("b",{children:"Cartões de fora da Europa"}),"Por pagamento"]}),a.jsx("em",{children:"3,15 % + 0,25 €"})]}),a.jsxs("div",{children:[a.jsxs("span",{children:[a.jsx("b",{children:"Convecta"}),"Não ficamos com nada"]}),a.jsx("em",{className:"gratis",children:"0 %"})]}),!p&&a.jsxs("div",{children:[a.jsxs("span",{children:[a.jsx("b",{children:"Na tua subscrição"}),"Incluído no Profissional e Business"]}),a.jsx("em",{children:ea})]})]}),a.jsx("p",{className:"pa-nota",children:"Num corte de 15 € recebes 14,52 €. Preços do Stripe para Portugal."})]}),x==="quanto"&&a.jsxs("div",{className:"pa-meio",children:[a.jsx("h2",{className:"pa-h",children:"Quanto paga o cliente ao marcar?"}),a.jsx("p",{className:"pa-sub",children:"Mudas quando quiseres."}),a.jsxs("div",{className:"pa-cartoes",children:[y(z==="metade","Metade",w?`${w.name} ${r(w.price)}: paga ${r(ma)} ao marcar e o resto na loja.`:"Metade ao marcar, o resto na loja.",()=>S(A,"metade"),Ba),y(z==="total","Tudo",w?`${w.name} ${r(w.price)}: paga ${r(w.price)} ao marcar. Na loja não paga nada.`:"O serviço todo ao marcar. Na loja não paga nada.",()=>S(A,"total"),ba)]})]}),x==="obrigatorio"&&a.jsxs("div",{className:"pa-meio",children:[a.jsx("h2",{className:"pa-h",children:"O cliente é obrigado a pagar?"}),a.jsx("p",{className:"pa-sub",children:"É isto que te protege das faltas."}),a.jsxs("div",{className:"pa-cartoes",children:[y(M===!0,"Sim, é obrigatório","Sem pagar, não fica marcado e a hora continua livre para outro.",()=>S(t,!0),ya,"Recomendado"),y(M===!1,"Não, ele escolhe","Aparece «Pagar já» ou «Pagar na loja». A marcação fica sempre.",()=>S(t,!1),Ka)]})]}),x==="servicos"&&a.jsxs("div",{className:"pa-meio",children:[a.jsx("h2",{className:"pa-h",children:"Em que serviços?"}),a.jsx("p",{className:"pa-sub",children:"Os outros continuam a pagar na loja."}),a.jsxs("div",{className:"pa-cartoes",children:[y(d==="todos","Todos os serviços",`Os ${m.length} serviços com preço.`,()=>S(H,"todos"),q),E.length>0&&y(d==="caros","Só os mais caros","Escolhes a partir de que preço.",()=>H("caros"),Ra),d==="caros"&&a.jsxs("div",{className:"pa-extra",children:[a.jsx("div",{className:"pa-chips",children:E.map(o=>a.jsxs("button",{type:"button",className:`pa-chip${V===o?" on":""}`,onClick:()=>ta(o),children:["A partir de ",o," €"]},o))}),a.jsxs("div",{className:"pa-conta",children:[T.length," ",T.length===1?"serviço":"serviços",": ",m.filter(o=>T.includes(o.id)).map(o=>o.name).join(", ")]})]}),y(d==="escolho","Escolho eu","Marcas um a um.",()=>H("escolho"),Ga),d==="escolho"&&a.jsx("div",{className:"pa-extra pa-servicos",children:m.map(o=>a.jsxs("label",{className:"pa-serv",children:[a.jsx("input",{type:"checkbox",checked:L.includes(o.id),onChange:()=>_(o.id)}),a.jsx("span",{className:"pa-serv-nome",children:o.name}),a.jsx("span",{className:"pa-serv-preco",children:r(o.price)})]},o.id))})]})]}),x==="tipo"&&a.jsxs("div",{className:"pa-meio",children:[a.jsx("h2",{className:"pa-h",children:"Como trabalhas?"}),a.jsx("p",{className:"pa-sub",children:"Tem de ser igual aos teus dados nas Finanças e à conta do banco onde vais receber."}),a.jsxs("div",{className:"pa-cartoes",children:[y(P==="individual","Empresário em nome individual","Trabalhas por conta própria, com atividade aberta nas Finanças.",()=>S(sa,"individual"),re),y(P==="company","Empresa","Tens uma sociedade (Lda. ou Unipessoal) com NIPC.",()=>S(sa,"company"),ae)]})]}),x==="pronto"&&a.jsxs("div",{className:"pa-duas pa-duas-pronto",children:[a.jsxs("div",{children:[a.jsx("span",{className:"pa-escudo",children:a.jsx(ya,{size:64})}),a.jsx("h2",{className:"pa-h",children:"Falta o Stripe confirmar quem és"}),a.jsx("p",{className:"pa-sub",children:"Para o dinheiro ir em segurança para a tua conta, o Stripe verifica a tua identidade e o teu banco. Estes dados não são partilhados com os teus clientes."})]}),a.jsxs("div",{children:[a.jsxs("div",{className:"pa-tabela pa-resumo",children:[a.jsxs("button",{type:"button",onClick:()=>I("quanto"),children:[a.jsx("span",{children:a.jsx("b",{children:"Quanto paga ao marcar"})}),a.jsx("em",{children:z==="total"?"Tudo":"Metade"}),a.jsx(da,{size:18})]}),a.jsxs("button",{type:"button",onClick:()=>I("obrigatorio"),children:[a.jsx("span",{children:a.jsx("b",{children:"Pagamento"})}),a.jsx("em",{children:M?"Obrigatório":"Opcional"}),a.jsx(da,{size:18})]}),a.jsxs("button",{type:"button",onClick:()=>I("servicos"),children:[a.jsx("span",{children:a.jsx("b",{children:"Em que serviços"})}),a.jsx("em",{children:Q}),a.jsx(da,{size:18})]})]}),a.jsxs("a",{className:"pa-video",href:va,target:"_blank",rel:"noreferrer",children:[a.jsx("span",{className:"pa-ico pa-ico-p",children:a.jsx(Ma,{size:20})}),a.jsxs("span",{children:[a.jsx("b",{children:"Vê como se faz no Stripe"}),"Vídeo passo a passo"]}),a.jsx(fa,{size:16})]}),a.jsx("h3",{className:"pa-h3",children:"Tem à mão"}),a.jsxs("div",{className:"pa-precisa",children:[a.jsxs("div",{children:[a.jsx("span",{className:"pa-ico pa-ico-p",children:a.jsx(se,{size:20})}),a.jsxs("span",{children:[a.jsx("b",{children:"Cartão de cidadão e NIF"}),"O Stripe pode pedir uma foto do cartão"]})]}),a.jsxs("div",{children:[a.jsx("span",{className:"pa-ico pa-ico-p",children:a.jsx(za,{size:20})}),a.jsxs("span",{children:[a.jsx("b",{children:"O IBAN"}),"Da conta onde queres receber"]})]}),a.jsxs("div",{children:[a.jsx("span",{className:"pa-ico pa-ico-p",children:a.jsx(Oa,{size:20})}),a.jsxs("span",{children:[a.jsx("b",{children:"5 minutos"}),"O 1.º depósito demora 7 dias, depois é todos os dias"]})]})]})]})]})]},l)})]}),document.body)}const Aa=`
.po-nowrap { white-space: nowrap; }
/* Apresentação */
.po-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 36px; align-items: center; max-width: 1100px; }
.po-selo { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: var(--text); }
.po-selo > span { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--gold); color: #111; }
.po-h { font-family: var(--font-head); font-weight: 700; font-size: clamp(28px, 3.6vw, 44px); line-height: 1.08; margin: 18px 0 16px; text-wrap: balance; color: var(--text); }
.po-checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.po-checks li { display: flex; gap: 10px; align-items: flex-start; font-size: 16px; color: var(--text); line-height: 1.4; }
.po-checks svg { flex-shrink: 0; margin-top: 2px; color: var(--gold-tinta); }
.po-preco { margin-top: 24px; font-size: 22px; font-weight: 700; color: var(--text); white-space: nowrap; }
.po-preco-sub { margin-top: 4px; font-size: 14px; color: var(--text-sec); }
.po-acoes { display: flex; gap: 22px; align-items: center; margin-top: 22px; flex-wrap: wrap; }
.po-btn { min-height: 52px; padding: 0 30px; border-radius: 999px; border: 0; cursor: pointer; font: inherit; font-size: 16px; font-weight: 700; background: var(--text); color: var(--surface); }
.po-btn:disabled { opacity: .6; cursor: default; }
.po-link { font-weight: 700; color: var(--text); text-decoration: none; border-bottom: 2px solid var(--gold); padding: 3px 0; }
.po-hero-img img { display: block; width: 100%; height: auto; border-radius: 22px; box-shadow: 0 22px 60px rgba(0,0,0,.22); }
@media (max-width: 860px) {
  .po-hero { grid-template-columns: 1fr; gap: 22px; }
  .po-hero-img { order: -1; }
  .po-btn { flex: 1; }
}
/* Painel */
.po-pagina { max-width: 760px; }
.po-estado { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 14px; }
.po-estado-t { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 17px; white-space: nowrap; }
.po-estado-t svg { color: var(--success); }
.po-numeros { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.po-numeros > div { display: grid; gap: 3px; padding: 16px 14px 16px 0; min-width: 0; }
.po-numeros > div + div { padding-left: 16px; border-left: 1px solid var(--border); }
.po-numeros span { font-size: 13.5px; color: var(--text-sec); white-space: nowrap; }
.po-numeros b { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.po-numeros small { font-size: 13px; color: var(--text-ter); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 1em; }
.po-aviso { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); font-weight: 600; color: var(--warning, #b45309); }
.po-seletor { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 999px; background: var(--elevated); border: 1px solid var(--border); max-width: 420px; margin-bottom: 6px; }
.po-seletor button { min-height: 42px; border: 0; border-radius: 999px; background: transparent; color: var(--text-sec); font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.po-seletor button.on { background: var(--text); color: var(--surface); }
.po-linha-botao { width: 100%; background: none; border-left: 0; border-right: 0; border-top: 0; cursor: pointer; font: inherit; color: inherit; text-align: left; }
@media (max-width: 767px) {
  .po-numeros b { font-size: 19px; }
  .po-numeros > div + div { padding-left: 10px; }
  .po-numeros > div { padding-right: 8px; }
  .po-seletor { max-width: none; }
}
/* Assistente em ecrã inteiro */
.po-ass { position: fixed; inset: 0; z-index: 1000; background: var(--bg); color: var(--text); display: flex; flex-direction: column; overflow-y: auto; }
.po-ass-topo { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; padding: 14px 20px; position: sticky; top: 0; background: var(--bg); }
.po-ass-botoes { display: flex; gap: 10px; justify-content: flex-end; }
.po-ass-redondo { width: 46px; height: 46px; border-radius: 999px; border: 1px solid var(--border); background: transparent; color: var(--text); display: grid; place-items: center; cursor: pointer; }
.po-ass-fechar, .po-ass-seguinte { min-height: 46px; padding: 0 20px; border-radius: 999px; font: inherit; font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; }
.po-ass-fechar { background: transparent; color: var(--text); border: 1px solid var(--border); }
.po-ass-seguinte { background: var(--text); color: var(--surface); border: 0; }
.po-ass-seguinte:disabled { opacity: .6; }
.po-ass-pontos { display: flex; gap: 6px; }
.po-ass-pontos span { width: 8px; height: 8px; border-radius: 999px; background: var(--border); }
.po-ass-pontos span.on { background: var(--text); width: 22px; }
.po-ass-corpo { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 24px 48px; }
.po-ass h2 { font-family: var(--font-head); font-weight: 700; font-size: clamp(28px, 4vw, 46px); line-height: 1.08; margin: 0; text-wrap: balance; }
.po-ass-duas { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 56px; align-items: center; max-width: 1100px; width: 100%; }
.po-ass-lista > div { display: flex; gap: 18px; align-items: flex-start; padding: 22px 0; }
.po-ass-lista > div + div { border-top: 1px solid var(--border); }
.po-ass-lista h3 { margin: 0 0 6px; font-size: 20px; }
.po-ass-lista p, .po-ass-nota { margin: 0; color: var(--text-sec); line-height: 1.55; font-size: 15.5px; }
.po-ass-ico { width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; display: grid; place-items: center; background: var(--gold); color: #111; }
.po-ass-meio { width: 100%; max-width: 700px; }
.po-ass-tabela { margin-top: 24px; border: 1px solid var(--border); border-radius: 18px; padding: 6px 22px; background: var(--surface); }
.po-ass-tabela > div { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; }
.po-ass-tabela > div + div { border-top: 1px solid var(--border); }
.po-ass-tabela span { display: grid; gap: 3px; font-size: 14px; color: var(--text-sec); min-width: 0; }
.po-ass-tabela b { font-size: 15.5px; color: var(--text); }
.po-ass-tabela em { font-style: normal; font-weight: 700; white-space: nowrap; color: var(--gold-tinta); }
.po-ass-tabela em.gratis { color: var(--success); }
.po-ass-com-ico { display: flex !important; gap: 14px; align-items: center; }
.po-ass-com-ico > svg { color: var(--gold-tinta); flex-shrink: 0; }
.po-ass-nota { margin-top: 16px; font-size: 14.5px; }
@media (max-width: 767px) {
  .po-ass-topo { grid-template-columns: auto 1fr auto; padding: 12px 14px; }
  .po-ass-pontos { justify-content: center; }
  .po-ass-fechar { padding: 0 12px; }
  .po-ass-fechar svg { display: none; }
  .po-ass-seguinte { padding: 0 16px; }
  .po-ass-duas { grid-template-columns: 1fr; gap: 18px; }
  .po-ass-corpo { align-items: flex-start; padding-top: 8px; }
  .po-ass-tabela { padding: 4px 16px; }
}

/* Assistente com perguntas (18/10) */
.po-ass-passo { width: 100%; display: flex; justify-content: center; animation: po-passo-frente 260ms cubic-bezier(0.22,1,0.36,1) backwards; }
.po-ass-passo.tras { animation-name: po-passo-tras; }
@keyframes po-passo-frente { from { opacity: 0; transform: translateX(28px); } }
@keyframes po-passo-tras { from { opacity: 0; transform: translateX(-28px); } }
@media (prefers-reduced-motion: reduce) { .po-ass-passo { animation: none; } }
.po-ass-pontos span { transition: width .25s, background .25s; }
.po-ass-pontos span.feito { background: var(--text-ter); }
.po-ass-lead { margin: 14px 0 0; font-size: 17px; color: var(--text-sec); }
.po-ass-num { display: block; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--gold-tinta); margin-bottom: 10px; }
.po-ass-escolhas { margin-top: 24px; gap: 12px; }
.po-escolha-g { padding: 18px; border-radius: 18px; transition: border-color .15s, transform .15s; }
.po-escolha-g:active { transform: scale(.99); }
.po-escolha-g b { font-size: 17px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.po-escolha-g span span { font-size: 15px; }
.po-selo-rec { font-style: normal; font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: var(--gold); color: #111; }
.po-ass-extra { margin: -4px 0 4px 34px; animation: po-passo-frente 220ms ease backwards; }
.po-ass-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
.po-chip { flex-shrink: 0; min-height: 38px; padding: 0 14px; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; color: var(--text); font: inherit; font-weight: 700; font-size: 14px; white-space: nowrap; cursor: pointer; }
.po-chip.on { background: var(--text); color: var(--surface); border-color: var(--text); }
.po-ass-conta { margin-top: 10px; font-size: 14px; color: var(--text-sec); line-height: 1.45; }
.po-ass-servicos { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); max-height: 300px; overflow-y: auto; }
.po-ass-serv { display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; }
.po-ass-serv + .po-ass-serv { border-top: 1px solid var(--border); }
.po-ass-serv input { width: 18px; height: 18px; accent-color: var(--text); flex-shrink: 0; }
.po-ass-serv-nome { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.po-ass-serv-preco { color: var(--text-sec); white-space: nowrap; font-variant-numeric: tabular-nums; }
.po-ass-resumo > button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 16px 0; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.po-ass-resumo > button + button { border-top: 1px solid var(--border); }
.po-ass-resumo > button span { flex: 1; }
.po-ass-resumo > button em { color: var(--text); }
.po-ass-resumo > button svg { color: var(--text-ter); flex-shrink: 0; }
.po-ass-h3 { margin: 26px 0 0; font-size: 17px; }
.po-primeiro { display: flex; align-items: center; gap: 8px; padding: 12px 0; font-size: 14px; color: var(--text-sec); border-bottom: 1px solid var(--border); }
.po-primeiro svg { flex-shrink: 0; color: var(--gold-tinta); }
.po-primeiro span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.po-primeiro-ass { border-bottom: 0; padding: 14px 0 0; }
.po-ass-h3 + .po-ass-tabela { margin-top: 12px; }
@media (max-width: 767px) { .po-ass-extra { margin-left: 0; } .po-ass-lead { font-size: 15.5px; } }

/* Capa v2: a imagem ocupa tudo, o texto por cima */
.po-capa { position: relative; max-width: 1100px; border-radius: 24px; overflow: hidden; isolation: isolate; color: #fff; background: #15120E; box-shadow: 0 18px 50px rgba(0,0,0,.28); }
.po-capa > picture, .po-capa > picture img { display: block; width: 100%; height: 100%; }
.po-capa > picture img { object-fit: cover; object-position: right center; min-height: 520px; max-height: min(620px, 74vh); }
.po-capa .po-h { font-size: clamp(30px, 3vw, 42px); margin: 16px 0 14px; }
.po-capa .po-checks li { font-size: 15.5px; white-space: nowrap; }
.po-capa .po-preco { margin-top: 18px; font-size: 20px; }
.po-capa .po-acoes { margin-top: 18px; flex-wrap: nowrap; }
.po-capa .po-btn { white-space: nowrap; }
.po-capa::after { content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; background: linear-gradient(90deg, rgba(21,18,14,.92) 0%, rgba(21,18,14,.7) 38%, rgba(21,18,14,0) 58%); }
.po-capa-texto { position: absolute; z-index: 1; inset: 0; width: min(50%, 500px); padding: 32px 0 32px 44px; display: flex; flex-direction: column; justify-content: center; }
.po-capa .po-selo, .po-capa .po-h, .po-capa .po-checks li, .po-capa .po-preco, .po-capa .po-link { color: #fff; }
.po-capa .po-h em { font-style: italic; color: #C9A227; }
.po-capa .po-checks svg { color: #C9A227; }
.po-capa .po-preco-sub { color: #b8b0a0; }
.po-capa .po-btn { background: #C9A227; color: #15120E; }
.po-capa .po-link { border-bottom-color: #C9A227; }
.po-capa-stripe { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 22px; font-size: 14px; color: #b8b0a0; }
.po-capa-stripe b { color: #fff; font-weight: 800; letter-spacing: -.01em; }
@media (max-width: 767px) {
  .po-capa { border-radius: 20px; }
  .po-capa > picture img { min-height: 0; height: auto; aspect-ratio: 1080 / 1500; max-height: 62vh; object-position: center top; }
  .po-capa .po-checks li { white-space: normal; }
  .po-capa::after { display: none; }
  .po-capa-texto { position: relative; width: auto; inset: auto; margin-top: -150px; padding: 120px 20px 24px; background: linear-gradient(180deg, rgba(21,18,14,0) 0, #15120E 130px); }
  .po-capa .po-h { font-size: 28px; margin: 12px 0 12px; }
  .po-capa .po-checks li { font-size: 15px; }
  .po-capa .po-preco { margin-top: 16px; font-size: 19px; }
  .po-capa .po-acoes { margin-top: 16px; }
  .po-capa-stripe { margin-top: 16px; }
}

/* Capa cheia (18/10): de ponta a ponta, sem espaço à volta, até ao fundo */
.po-capa-cheia { position: fixed; inset: 0; z-index: 900; max-width: none; border-radius: 0; box-shadow: none; margin: 0; overflow-y: auto; overscroll-behavior: contain; animation: po-capa-entra 260ms ease backwards; }
@keyframes po-capa-entra { from { opacity: 0; } }
.po-capa-fechar { width: 52px; height: 52px; border-radius: 999px; border: 0; background: transparent; color: #fff !important; display: grid; place-items: center; cursor: pointer; }
.po-capa-fechar:hover { background: rgba(255,255,255,.1); }
.po-capa-cheia .po-capa-cabeca .po-selo > span { color: #111; }
.po-capa-cheia > picture { position: absolute; inset: 0; }
.po-capa-cheia > picture img { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; max-height: none; object-fit: cover; object-position: right center; }
.po-capa-cheia .po-capa-texto { width: min(46%, 560px); padding: 96px 0 48px clamp(32px, 5vw, 80px); }
.po-capa-cheia .po-h { font-size: clamp(34px, 3.6vw, 54px); }
.po-capa-cheia .po-checks li { font-size: 16.5px; }
.po-capa-cabeca { position: absolute; z-index: 2; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 26px clamp(32px, 5vw, 80px) 0; }
.po-capa-titulo { display: flex; align-items: center; gap: 10px; }
.po-capa-titulo h1 { margin: 0; color: #fff; font-family: var(--font-head); font-size: 34px; }
.po-capa-cabeca, .po-capa-cabeca * { color: #e9e3d6; }
@media (max-width: 767px) {
  .po-capa-cheia { margin: 0; border-radius: 0; }
  .po-capa-cheia > picture, .po-capa-cheia > picture img { position: static; height: auto; }
  .po-capa-cheia > picture img { aspect-ratio: 1080 / 1500; max-height: 62vh; object-position: center top; }
  .po-capa-cabeca { position: fixed; padding: 10px 12px 0 18px; }
  .po-capa-cheia .po-capa-cabeca .po-selo { visibility: hidden; }
  .po-capa-fechar { background: rgba(21,18,14,.55); backdrop-filter: blur(8px); }
  .po-capa-cheia .po-capa-texto { width: auto; padding: 120px 20px 28px; }
  .po-capa-cheia .po-h { font-size: 30px; }
  .po-capa-cheia .po-checks li { font-size: 15px; }
}

/* Fundo + telemóveis inteiros (v4) */
.po-capa-fundo { position: absolute; inset: 0; z-index: 0; background: #15120E url(/pagamentos/pagamentos-online-fundo-v4.jpg) center / cover no-repeat; }
.po-capa-cheia .po-capa-fones { position: absolute; z-index: 1; right: clamp(16px, 4vw, 72px); top: 50%; transform: translateY(-50%); height: min(84vh, 900px); max-width: 50vw; width: auto; object-fit: contain; pointer-events: none; }
.po-capa-cheia::after { z-index: 0; }
.po-capa-cheia .po-capa-texto { z-index: 2; }
.po-capa-cheia .po-capa-cabeca { z-index: 3; }
@media (max-width: 767px) {
  .po-capa-fundo { position: fixed; background-image: url(/pagamentos/pagamentos-online-fundo-v4-telemovel.jpg); }
  .po-capa-cheia .po-capa-fones { position: relative; transform: none; top: auto; right: auto; display: block; height: auto; width: 100%; max-width: 440px; max-height: 58vh; margin: 64px auto 0; }
  .po-capa-cheia .po-capa-texto { margin-top: -40px; padding: 60px 20px 32px; }
}

/* Formulário escuro, à Fresha (18/10) — preto quente e dourado da Convecta */
.pa { position: fixed; inset: 0; z-index: 1000; background: #15120E; color: #f3eee3; display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior: contain; animation: po-capa-entra 220ms ease backwards; }
.pa-barra { position: sticky; top: 0; z-index: 3; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px; padding: 10px 24px 0; background: #15120E; }
.pa-barra span { height: 4px; border-radius: 4px; background: rgba(255,255,255,.12); transition: background .3s; }
.pa-barra span.on { background: #C9A227; }
.pa-topo { position: sticky; top: 14px; z-index: 2; display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #15120E; }
.pa-botoes { display: flex; gap: 10px; }
.pa-redondo { width: 46px; height: 46px; border-radius: 999px; border: 0; background: transparent; color: #f3eee3; display: grid; place-items: center; cursor: pointer; }
.pa-redondo:hover { background: rgba(255,255,255,.08); }
.pa-fechar, .pa-seguinte { min-height: 46px; padding: 0 22px; border-radius: 999px; font: inherit; font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; }
.pa-fechar { background: rgba(255,255,255,.04); color: #f3eee3; border: 1px solid rgba(255,255,255,.18); }
.pa-seguinte { background: #C9A227; color: #15120E; border: 0; }
.pa-seguinte:disabled { opacity: .45; cursor: default; }
.pa-corpo { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px 24px 56px; }
.pa-passo { width: 100%; display: flex; justify-content: center; animation: po-passo-frente 260ms cubic-bezier(0.22,1,0.36,1) backwards; }
.pa-passo.tras { animation-name: po-passo-tras; }
.pa-h { font-family: var(--font-head); font-weight: 700; font-size: clamp(30px, 3.8vw, 50px); line-height: 1.08; margin: 0; text-wrap: balance; color: #fff; }
.pa-meio .pa-h { font-size: clamp(28px, 3vw, 40px); }
.pa-sub { margin: 12px 0 0; font-size: 16px; line-height: 1.55; color: #b8b0a0; max-width: 620px; }
.pa-duas { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 64px; align-items: center; max-width: 1180px; width: 100%; }
.pa-lista > div { display: flex; justify-content: space-between; gap: 24px; align-items: center; padding: 24px 0; }
.pa-lista > div + div { border-top: 1px solid rgba(255,255,255,.1); }
.pa-lista h3 { margin: 0 0 8px; font-family: inherit; font-size: 20px; color: #fff; }
.pa-lista p { margin: 0; color: #b8b0a0; line-height: 1.55; font-size: 15.5px; }
.pa-ico { width: 60px; height: 60px; border-radius: 18px; flex-shrink: 0; display: grid; place-items: center; color: #15120E; background: linear-gradient(140deg, #f1d36b, #C9A227 55%, #8a6d0f); box-shadow: 0 10px 30px rgba(201,162,39,.25); }
.pa-ico-p { width: 44px; height: 44px; border-radius: 13px; box-shadow: none; }
.pa-meio { width: 100%; max-width: 700px; }
.pa-cartoes { display: grid; gap: 12px; margin-top: 26px; }
.pa-cartao { display: flex; justify-content: space-between; align-items: center; gap: 18px; width: 100%; text-align: left; padding: 20px 22px; border-radius: 16px; border: 1.5px solid rgba(255,255,255,.1); background: rgba(255,255,255,.035); color: #f3eee3; font: inherit; cursor: pointer; transition: border-color .15s, background .15s, transform .12s; }
.pa-cartao:hover { border-color: rgba(201,162,39,.55); background: rgba(255,255,255,.055); }
.pa-cartao:active { transform: scale(.99); }
.pa-cartao.on { border-color: #C9A227; background: rgba(201,162,39,.08); }
.pa-cartao-txt { display: grid; gap: 4px; min-width: 0; }
.pa-cartao b { font-size: 16.5px; color: #fff; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pa-cartao-txt > span { font-size: 14.5px; color: #b8b0a0; line-height: 1.45; }
.pa-selo { font-style: normal; font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: #C9A227; color: #15120E; }
.pa-extra { margin: -2px 0 4px; animation: po-passo-frente 220ms ease backwards; }
.pa-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
.pa-chip { flex-shrink: 0; min-height: 40px; padding: 0 16px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,.18); background: transparent; color: #f3eee3; font: inherit; font-weight: 700; font-size: 14px; white-space: nowrap; cursor: pointer; }
.pa-chip.on { background: #C9A227; color: #15120E; border-color: #C9A227; }
.pa-conta { margin-top: 10px; font-size: 14px; color: #b8b0a0; line-height: 1.45; }
.pa-servicos { border: 1px solid rgba(255,255,255,.1); border-radius: 14px; background: rgba(255,255,255,.03); max-height: 300px; overflow-y: auto; }
.pa-serv { display: flex; align-items: center; gap: 12px; padding: 13px 16px; cursor: pointer; }
.pa-serv + .pa-serv { border-top: 1px solid rgba(255,255,255,.08); }
.pa-serv input { width: 18px; height: 18px; accent-color: #C9A227; flex-shrink: 0; }
.pa-serv-nome { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.pa-serv-preco { color: #b8b0a0; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pa-tabela { margin-top: 24px; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 4px 22px; background: rgba(255,255,255,.035); }
.pa-tabela > div, .pa-tabela > button { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; width: 100%; }
.pa-tabela > * + * { border-top: 1px solid rgba(255,255,255,.08) !important; }
.pa-tabela span { display: grid; gap: 3px; font-size: 14px; color: #b8b0a0; min-width: 0; }
.pa-tabela b { font-size: 15.5px; color: #fff; }
.pa-tabela em { font-style: normal; font-weight: 700; white-space: nowrap; color: #C9A227; }
.pa-tabela em.gratis { color: #4ade80; }
.pa-resumo > button { background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.pa-resumo > button span { flex: 1; }
.pa-resumo > button em { color: #fff; }
.pa-resumo > button svg { color: #8c8577; flex-shrink: 0; }
.pa-com-ico { display: flex !important; gap: 14px; align-items: center; }
.pa-com-ico > svg { color: #C9A227; flex-shrink: 0; }
.pa-h3 { margin: 30px 0 0; font-family: inherit; font-weight: 700; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #8c8577; }
.pa-precisa { margin-top: 6px; }
.pa-precisa > div { display: flex; align-items: center; gap: 16px; padding: 14px 0; }
.pa-precisa > div + div { border-top: 1px solid rgba(255,255,255,.08); }
.pa-precisa > div > span:last-child { display: grid; gap: 3px; min-width: 0; font-size: 14.5px; color: #b8b0a0; }
.pa-precisa b { font-size: 16px; color: #fff; }
.pa { min-height: 100dvh; }
.pa-nota { margin: 16px 0 0; font-size: 14.5px; color: #b8b0a0; }
.pa-escudo { width: 116px; height: 116px; border-radius: 32px; display: grid; place-items: center; margin-bottom: 26px; color: #15120E; background: linear-gradient(140deg, #f1d36b, #C9A227 55%, #8a6d0f); box-shadow: 0 18px 50px rgba(201,162,39,.3); }
.pa-duas-pronto { align-items: start; }
@media (prefers-reduced-motion: reduce) { .pa, .pa-passo { animation: none; } }
@media (max-width: 767px) {
  .pa-barra { padding: 8px 14px 0; gap: 6px; }
  .pa-topo { padding: 10px 14px; top: 12px; }
  .pa-fechar { padding: 0 16px; }
  .pa-seguinte { padding: 0 16px; }
  .pa-corpo { align-items: flex-start; padding: 8px 18px 40px; }
  .pa-duas { grid-template-columns: 1fr; gap: 20px; }
  .pa-lista > div { padding: 18px 0; }
  .pa-ico { width: 50px; height: 50px; border-radius: 15px; }
  .pa-cartao { padding: 16px; }
  .pa-tabela { padding: 2px 16px; }
  .pa-escudo { width: 84px; height: 84px; border-radius: 24px; margin-bottom: 18px; }
  .pa-escudo svg { width: 46px; height: 46px; }
}

/* (fica depois do formulário para ganhar às regras dele: z-index, topo) */
/* Por cima de tudo (portal no body) e a ocupar o ecrã inteiro, notch incluído */
.po-capa-cheia { z-index: 9000; }
.pa { z-index: 9100; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
@media (max-width: 767px) {
  .po-capa-cheia { display: flex; flex-direction: column; min-height: 100dvh; }
  .po-capa-cheia::after { display: none; }
  .po-capa-cheia .po-capa-cabeca { position: absolute; top: 0; padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 0 18px; }
  .po-capa-cheia .po-capa-cabeca .po-selo { visibility: visible; font-size: 14px; }
  .po-capa-cheia .po-capa-fones { flex: 0 1 auto; width: auto; max-width: 92%; height: auto; max-height: 44dvh; margin: calc(env(safe-area-inset-top, 0px) + 66px) auto 0; }
  .po-capa-cheia .po-capa-texto { position: relative; inset: auto; flex: 1; margin: 0; width: auto; display: flex; flex-direction: column; justify-content: flex-end; padding: 18px 20px calc(env(safe-area-inset-bottom, 0px) + 22px); background: linear-gradient(180deg, rgba(21,18,14,0), #15120E 40px); }
  .po-capa-cheia .po-h { font-size: clamp(26px, 7.4vw, 32px); margin: 0 0 12px; }
  .po-capa-cheia .po-checks { gap: 8px; }
  .po-capa-cheia .po-checks li { font-size: 15px; white-space: nowrap; }
  .po-capa-cheia .po-preco { margin-top: 14px; font-size: 18px; }
  .po-capa-cheia .po-acoes { margin-top: 14px; gap: 18px; }
  .po-capa-cheia .po-btn { min-height: 52px; }
  .po-capa-cheia .po-capa-stripe { margin-top: 14px; gap: 8px; font-size: 13px; }
  .po-capa-fechar { width: 44px; height: 44px; }
  /* Formulário no telemóvel: compacto, ícone à esquerda, letra do corpo */
  .pa-topo { top: 0; }
  .pa-barra + .pa-topo { top: 12px; }
  .pa-h { font-size: 30px; }
  .pa-lista > div { flex-direction: row-reverse; justify-content: flex-end; align-items: flex-start; gap: 14px; padding: 16px 0; }
  .pa-lista h3 { font-family: inherit; font-size: 16.5px; margin: 0 0 4px; }
  .pa-lista p { font-size: 14.5px; line-height: 1.45; }
  .pa-lista .pa-ico { width: 44px; height: 44px; border-radius: 13px; box-shadow: none; }
  .pa-lista .pa-ico svg { width: 20px; height: 20px; }
  .pa-sub { font-size: 15px; }
}

/* Vídeo tutorial (18/10) */
.po-link-video { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
.pa-video { display: flex; align-items: center; gap: 14px; margin-top: 22px; padding: 14px 16px; border-radius: 16px; border: 1px solid rgba(201,162,39,.45); background: rgba(201,162,39,.08); color: #f3eee3; text-decoration: none; }
.pa-video > span:nth-child(2) { flex: 1; display: grid; gap: 2px; font-size: 14px; color: #b8b0a0; }
.pa-video b { font-size: 16px; color: #fff; }
.pa-video > svg { color: #C9A227; flex-shrink: 0; }
@media (max-width: 767px) { .po-capa-cheia .po-acoes { flex-wrap: wrap; row-gap: 12px; } .po-capa-cheia .po-btn { flex: 1 0 100%; } }

/* Painel v2 */
.po-titulo-sec { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.po-titulo-sec em { font-style: normal; font-weight: 600; letter-spacing: 0; text-transform: none; font-size: 12.5px; color: var(--text-ter); white-space: nowrap; }
.po-escolhas { display: grid; gap: 10px; }
.po-escolha { display: flex; gap: 12px; align-items: flex-start; text-align: left; padding: 14px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--surface); color: var(--text); font: inherit; cursor: pointer; }
.po-escolha.on { border-color: var(--text); }
.po-escolha b { display: block; font-size: 16px; margin-bottom: 3px; }
.po-escolha span span { font-size: 14px; color: var(--text-sec); line-height: 1.45; }
.po-escolha-bola { width: 22px; height: 22px; border-radius: 999px; border: 1.5px solid var(--border); flex-shrink: 0; display: grid; place-items: center; margin-top: 1px; }
.po-escolha.on .po-escolha-bola { background: var(--text); border-color: var(--text); color: var(--surface); }
.po-resumo { display: grid; gap: 4px; padding: 6px 0 18px; }
.po-ligados { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--success); margin-bottom: 8px; }
.po-rotulo { font-size: 14px; color: var(--text-sec); }
.po-grande { font-family: var(--font-head); font-size: 44px; line-height: 1.05; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text); }
.po-sub { font-size: 14px; color: var(--text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.po-valor { margin-left: auto; overflow: hidden; text-overflow: ellipsis; }
.po-seta { color: var(--text-ter); flex-shrink: 0; }
a.po-linha-botao { color: inherit; text-decoration: none; }
.po-alerta b { color: var(--warning, #b45309); }
`;export{fe as default};
