import{r as t,j as r,a1 as f,X as v,ao as j}from"./index-MSJ5Bzx4.js";import{n as w}from"./nomes-BVTdLNjH.js";function d(a){return(a||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()}function z({clientes:a,value:n,onChange:p,autoFocus:b}){const[l,x]=t.useState(""),[g,s]=t.useState(!1),o=t.useMemo(()=>[...a||[]].sort((e,u)=>(e.name||"").localeCompare(u.name||"","pt")),[a]),i=o.find(e=>e.id===n),h=t.useMemo(()=>{const e=d(l.trim());return(e?o.filter(c=>d(c.name).includes(e)||(c.phone||"").replace(/\s/g,"").includes(e)||d(c.email).includes(e)):o).slice(0,40)},[o,l]);return t.useEffect(()=>{n||x("")},[n]),i?r.jsxs("div",{className:"ec-escolhido",children:[r.jsx(f,{size:16}),r.jsx("span",{children:w(o,i,i.phone||i.email)}),r.jsx("button",{type:"button","aria-label":"Trocar cliente",onClick:()=>{p(""),s(!0)},children:r.jsx(v,{size:16})}),r.jsx("style",{dangerouslySetInnerHTML:{__html:m}})]}):r.jsxs("div",{className:"ec",children:[r.jsx("style",{dangerouslySetInnerHTML:{__html:m}}),r.jsxs("div",{className:"ec-caixa",children:[r.jsx(j,{size:16}),r.jsx("input",{className:"ec-input",type:"text",inputMode:"search",autoFocus:b,placeholder:"Nome ou telemóvel…",value:l,onChange:e=>{x(e.target.value),s(!0)},onFocus:()=>s(!0)})]}),g&&r.jsxs("div",{className:"ec-lista",children:[h.length===0&&r.jsx("div",{className:"ec-vazio",children:"Sem resultados"}),h.map(e=>r.jsxs("button",{type:"button",className:"ec-linha",onClick:()=>{p(e.id),s(!1)},children:[r.jsx("b",{children:e.name}),(e.phone||e.email)&&r.jsx("span",{children:e.phone||e.email})]},e.id))]})]})}const m=`
.ec-caixa {
  display: flex; align-items: center; gap: 8px; padding: 0 12px; min-height: 44px;
  border-radius: 10px; background: var(--elevated); border: 1px solid var(--border); color: var(--text-sec);
}
.ec-caixa:focus-within { border-color: var(--gold); }
.ec-input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--text); font-size: 15px; outline: none; }
.ec-lista {
  margin-top: 6px; max-height: 240px; overflow-y: auto; border-radius: 10px;
  background: var(--elevated); border: 1px solid var(--border);
}
.ec-linha {
  display: flex; flex-direction: column; align-items: flex-start; width: 100%; text-align: left;
  padding: 9px 12px; border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer;
}
.ec-linha:last-child { border-bottom: 0; }
.ec-linha:hover, .ec-linha:focus-visible { background: rgba(var(--gold-rgb), .1); outline: none; }
.ec-linha b { font-size: 14.5px; font-weight: 600; }
.ec-linha span { font-size: 12.5px; color: var(--text-sec); }
.ec-vazio { padding: 12px; font-size: 14px; color: var(--text-ter); }
.ec-escolhido {
  display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 10px 0 12px;
  border-radius: 10px; border: 1px solid rgba(var(--gold-rgb), .5); background: rgba(var(--gold-rgb), .1); font-weight: 600; font-size: 15px;
}
.ec-escolhido > svg { color: var(--gold-tinta); flex-shrink: 0; }
.ec-escolhido span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ec-escolhido button { border: 0; background: transparent; color: var(--text-sec); cursor: pointer; display: grid; place-items: center; padding: 6px; }
`;export{z as E};
