import{u as $,a6 as L,r as l,t as H,j as e,a0 as z,ah as P,am as k,an as D,V as E,ag as A,a2 as g,S as v,J as I,K as _,E as G,ao as q,G as U,a9 as Z,Z as B}from"./index-MSJ5Bzx4.js";import{P as J}from"./pencil-DMvWHyUZ.js";import{T as K}from"./trash-2-Ce3VD9Y0.js";import{M as Q}from"./message-circle-CFXaxaDp.js";import{M as R}from"./message-square-BcO8uyYa.js";import{S as V}from"./save-BmgWW9mn.js";import{e as W,t as O}from"./validar-COhHqK8Y.js";import{P as T}from"./plus-DNEwahbF.js";function Y({customer:s,onClose:n,onEditar:b}){var u;const x=$(),c=L(),[j,C]=l.useState((s==null?void 0:s.notes)||""),[N,d]=l.useState(!1),m=l.useMemo(()=>(x.appointments||[]).filter(i=>i.customerId===(s==null?void 0:s.id)).sort((i,o)=>(o.date+o.startTime).localeCompare(i.date+o.startTime)),[x.appointments,s==null?void 0:s.id]),t=m.find(i=>i.status!=="cancelled"&&i.date+i.startTime>=H()+new Date().toTimeString().slice(0,5));if(!s)return null;const h=async()=>{await v.updateCustomer(s.id,{notes:j}),c.success("Notas guardadas")},r=(s.phone||"").replace(/[^0-9+]/g,"");return e.jsxs(z,{open:!!s,onClose:n,title:"",children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:ee}}),e.jsxs("div",{className:"cf",children:[e.jsxs("div",{className:"cf-accoes-topo",children:[b&&e.jsx("button",{type:"button",className:"cf-ico",onClick:()=>b(s),"aria-label":"Editar",children:e.jsx(J,{size:17})}),e.jsx("button",{type:"button",className:"cf-ico",onClick:()=>d(!0),"aria-label":"Apagar",children:e.jsx(K,{size:17})})]}),e.jsxs("div",{className:"cf-cabeca",children:[e.jsx(P,{name:s.name,size:"lg"}),e.jsx("div",{className:"cf-nome",children:s.name})]}),e.jsxs("div",{className:"cf-botoes",children:[e.jsxs("a",{className:`cf-btn${r?"":" off"}`,href:r?`tel:${r}`:void 0,children:[e.jsx("i",{children:e.jsx(k,{size:20})}),"Ligar"]}),e.jsxs("a",{className:`cf-btn${r?"":" off"}`,href:r?`https://wa.me/${r.replace(/\D/g,"")}`:void 0,target:"_blank",rel:"noreferrer",children:[e.jsx("i",{children:e.jsx(Q,{size:20})}),"WhatsApp"]}),e.jsxs("a",{className:`cf-btn${r?"":" off"}`,href:r?`sms:${r}`:void 0,children:[e.jsx("i",{children:e.jsx(R,{size:20})}),"SMS"]}),e.jsxs("a",{className:`cf-btn${s.email?"":" off"}`,href:s.email?`mailto:${s.email}`:void 0,children:[e.jsx("i",{children:e.jsx(D,{size:20})}),"E-mail"]})]}),e.jsxs("div",{className:"cf-dados",children:[e.jsxs("div",{className:"cf-dado",children:[e.jsxs("span",{children:[e.jsx(k,{size:15})," Telemóvel"]}),e.jsx("b",{children:s.phone||"—"})]}),e.jsxs("div",{className:"cf-dado",children:[e.jsxs("span",{children:[e.jsx(D,{size:15})," E-mail"]}),e.jsx("b",{children:s.email||"—"})]}),s.birthDate&&e.jsxs("div",{className:"cf-dado",children:[e.jsxs("span",{children:[e.jsx(E,{size:15})," Aniversário"]}),e.jsx("b",{children:A(s.birthDate)})]})]}),N&&e.jsxs("div",{className:"cf-apagar",children:[e.jsxs("b",{children:["Apagar ",s.name,"?"]}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx(g,{size:"sm",variant:"danger",onClick:async()=>{try{await v.deleteCustomer(s.id),c.success("Cliente apagado",s.name),d(!1),n()}catch(i){c.error(i.temHistorico?"Não dá para apagar":"Erro ao apagar",i.message||String(i)),d(!1)}},children:"Apagar"}),e.jsx(g,{size:"sm",variant:"secondary",onClick:()=>d(!1),children:"Cancelar"})]})]}),t&&e.jsxs("div",{className:"cf-proxima",children:[e.jsx(E,{size:16}),e.jsxs("span",{children:[I(t.date)," · ",t.startTime," · ",(u=x.services.find(i=>i.id===t.serviceId))==null?void 0:u.name]})]}),e.jsxs("div",{className:"cf-seccao",children:[e.jsx("div",{className:"cf-h",children:"Notas"}),e.jsx("textarea",{className:"textarea",rows:2,value:j,onChange:i=>C(i.target.value)}),j!==(s.notes||"")&&e.jsx("div",{className:"mt-8",children:e.jsxs(g,{size:"sm",variant:"primary",onClick:h,children:[e.jsx(V,{size:14})," Guardar"]})})]}),m.length>0&&e.jsxs("div",{className:"cf-seccao",children:[e.jsxs("div",{className:"cf-h",children:["Marcações · ",m.length]}),e.jsx("div",{className:"cf-hist",children:m.slice(0,8).map(i=>{const o=x.services.find(y=>y.id===i.serviceId);return e.jsxs("div",{className:`cf-hist-linha ${i.status}`,children:[e.jsx("span",{children:A(i.date)}),e.jsx("span",{className:"cf-hist-svc",children:(o==null?void 0:o.name)||"—"}),e.jsx("span",{children:o?_(o.price):""})]},i.id)})})]})]})]})}const ee=`
.cf { position: relative; padding-top: 4px; }
.cf-accoes-topo { position: absolute; top: -6px; right: 0; display: flex; gap: 6px; }
.cf-ico {
  width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center;
  border: 1px solid var(--border); background: var(--elevated); color: var(--text-sec); cursor: pointer;
}
.cf-cabeca { text-align: center; padding: 10px 0 18px; }
.cf-cabeca .avatar { margin: 0 auto 10px; }
.cf-nome { font-size: 20px; font-weight: 700; }

.cf-botoes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
.cf-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-size: 12.5px; color: var(--text-sec); text-decoration: none;
}
.cf-btn i {
  width: 50px; height: 50px; border-radius: 999px; display: grid; place-items: center;
  background: var(--elevated); border: 1px solid var(--border); color: var(--text);
}
.cf-btn.off { opacity: .35; pointer-events: none; }

.cf-dados { border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; margin-bottom: 14px; }
.cf-dado {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 48px; padding: 0 14px; border-bottom: 1px solid var(--border); font-size: 15px;
}
.cf-dado:last-child { border-bottom: 0; }
.cf-dado span { display: flex; align-items: center; gap: 8px; color: var(--text-sec); flex-shrink: 0; }
.cf-dado b { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cf-apagar {
  display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; border-radius: 12px;
  border: 1px solid rgba(239,68,68,.45); background: rgba(239,68,68,.08); margin-bottom: 14px;
}
.cf-proxima {
  display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 12px;
  background: rgba(var(--gold-rgb), .12); border: 1px solid rgba(var(--gold-rgb), .4);
  font-size: 14.5px; font-weight: 600; margin-bottom: 14px; color: var(--text);
}
.cf-proxima svg { color: var(--gold-tinta); flex-shrink: 0; }
.cf-seccao { margin-bottom: 14px; }
.cf-h { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-ter); margin: 0 0 8px 2px; }
.cf-hist { border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; }
.cf-hist-linha {
  display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 14px;
  border-bottom: 1px solid var(--border); font-size: 14px;
}
.cf-hist-linha:last-child { border-bottom: 0; }
.cf-hist-linha.cancelled { opacity: .45; text-decoration: line-through; }
.cf-hist-svc { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`,M={name:"",email:"",phone:"",birthDate:""};function de(){const s=$(),n=L(),[b,x]=l.useState(s.customers),[c,j]=l.useState(""),[C,N]=l.useState(null),[d,m]=l.useState(null),[t,h]=l.useState(M);l.useEffect(()=>{x(s.customers)},[s.customers]);const[r,u]=l.useState(null),i=()=>{h(M),m("new")},o=a=>{h({name:a.name,email:a.email||"",phone:a.phone||"",birthDate:a.birthDate||""}),m(a.id)},y=()=>m(null),X=async()=>{if(!t.name.trim()){n.error("Nome obrigatório");return}if(W(t.email||"")){n.error("Email inválido","Falta o @ ou o ponto. Deixa vazio se não souberes.");return}if(O(t.phone||"")){n.error("Telefone inválido","Só números, pelo menos nove. Deixa vazio se não souberes.");return}try{d==="new"?(await v.createCustomer({...t,name:t.name.trim()}),n.success("Cliente criado")):(await v.updateCustomer(d,{...t,name:t.name.trim()}),n.success("Cliente atualizado")),x([...await v.listCustomers()]),y()}catch(a){n.error("Erro ao guardar: "+(a.message||a))}},S=l.useMemo(()=>{const a=c.trim().toLowerCase();return[...b.filter(f=>!a||f.name.toLowerCase().includes(a)||(f.email||"").toLowerCase().includes(a)||(f.phone||"").includes(a))].sort((f,w)=>f.name.localeCompare(w.name,"pt"))},[b,c]),F=l.useMemo(()=>{const a=[];for(const p of S){const f=(p.name.trim()[0]||"#").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),w=/[A-Z]/.test(f)?f:"#";(!a.length||a[a.length-1].letra!==w)&&a.push({letra:w,itens:[]}),a[a.length-1].itens.push(p)}return a},[S]);return e.jsxs(G,{children:[e.jsx("style",{dangerouslySetInnerHTML:{__html:ae}}),e.jsxs("div",{className:"cli-topo","data-tour":"clientes",children:[e.jsxs("div",{className:"cli-procura",children:[e.jsx(q,{size:17}),e.jsx("input",{className:"cli-input",placeholder:"Procurar",value:c,onChange:a=>j(a.target.value)})]}),e.jsx("button",{type:"button",className:"cli-novo",onClick:i,"aria-label":"Novo cliente",children:e.jsx(T,{size:20})})]}),S.length===0?e.jsx(U,{className:"card-pad",children:e.jsx(Z,{icon:()=>e.jsx(B,{}),title:c?"Sem resultados":"Sem clientes",action:!c&&e.jsxs(g,{variant:"primary",onClick:i,children:[e.jsx(T,{size:16})," Novo cliente"]})})}):e.jsx("div",{className:"cli-lista",children:F.map(a=>e.jsxs("section",{children:[e.jsx("div",{className:"cli-letra",children:a.letra}),e.jsx("div",{className:"cli-caixa",children:a.itens.map(p=>e.jsxs("button",{type:"button",className:"cli-linha",onClick:()=>N(p),children:[e.jsx(P,{name:p.name}),e.jsx("span",{className:"cli-nome",children:p.name}),e.jsx("span",{className:"cli-tel",children:p.phone||"—"})]},p.id))})]},a.letra))}),e.jsxs(z,{open:!!d,onClose:y,title:d==="new"?"Novo cliente":"Editar cliente",footer:e.jsxs(e.Fragment,{children:[e.jsx(g,{variant:"ghost",onClick:y,children:"Cancelar"}),e.jsx(g,{variant:"primary",onClick:X,children:"Guardar"})]}),children:[e.jsxs("div",{className:"field",children:[e.jsx("label",{className:"label",children:"Nome *"}),e.jsx("input",{className:"input",value:t.name,onChange:a=>h({...t,name:a.target.value}),placeholder:"Nome completo"})]}),e.jsxs("div",{className:"field",children:[e.jsx("label",{className:"label",children:"Email"}),e.jsx("input",{className:"input",type:"email",value:t.email,onChange:a=>h({...t,email:a.target.value}),placeholder:"email@exemplo.com"})]}),e.jsxs("div",{className:"field",children:[e.jsx("label",{className:"label",children:"Telefone"}),e.jsx("input",{className:"input",type:"tel",value:t.phone,onChange:a=>h({...t,phone:a.target.value}),placeholder:"+351 9XX XXX XXX"})]}),e.jsxs("div",{className:"field",children:[e.jsx("label",{className:"label",children:"Data de nascimento"}),e.jsx("input",{className:"input",type:"date",value:t.birthDate,onChange:a=>h({...t,birthDate:a.target.value})})]})]}),e.jsx(z,{open:!!r,onClose:()=>u(null),title:"Apagar este cliente?",footer:e.jsxs(e.Fragment,{children:[e.jsx(g,{variant:"secondary",onClick:()=>u(null),children:"Cancelar"}),e.jsx(g,{variant:"danger",onClick:async()=>{try{await v.deleteCustomer(r.id),n.success("Cliente apagado",r.name),x([...await v.listCustomers()]),u(null)}catch(a){n.error(a.temHistorico?"Não dá para apagar":"Erro ao apagar",a.message||String(a)),a.temHistorico&&u(null)}},children:"Apagar"})]}),children:e.jsxs("p",{children:["A ficha de ",e.jsx("strong",{children:r==null?void 0:r.name})," desaparece do painel. Não há volta a dar."]})}),e.jsx(Y,{customer:C,onClose:()=>N(null),onEditar:a=>{N(null),o(a)}})]})}const ae=`
.cli-topo { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; }
.cli-procura {
  flex: 1; display: flex; align-items: center; gap: 9px; min-height: 46px;
  padding: 0 14px; border-radius: 12px;
  background: var(--elevated); border: 1px solid var(--border); color: var(--text-sec);
}
.cli-input {
  flex: 1; min-width: 0; border: 0; background: transparent; color: var(--text);
  font: inherit; font-size: 16px; outline: none;
}
.cli-novo {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; cursor: pointer;
  display: grid; place-items: center; border: 0;
  background: var(--text); color: var(--surface);
}
.cli-lista { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
.cli-letra {
  font-size: 12px; font-weight: 700; letter-spacing: .08em; color: var(--text-ter);
  margin: 0 0 6px 14px;
}
.cli-caixa {
  border-radius: var(--radius-card); background: var(--elevated); border: 1px solid var(--border);
  overflow: hidden;
}
.cli-linha {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 58px;
  padding: 8px 14px; border: 0; border-bottom: 1px solid var(--border);
  background: transparent; cursor: pointer; text-align: left; font: inherit; color: var(--text);
}
.cli-linha:last-child { border-bottom: 0; }
.cli-linha:active { background: rgba(var(--gold-rgb), .10); }
.cli-nome { flex: 1; min-width: 0; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cli-tel { font-size: 14px; color: var(--text-sec); flex-shrink: 0; font-variant-numeric: tabular-nums; }
`;export{de as default};
