import{r as s,b as c,j as t,I as l}from"./index-MSJ5Bzx4.js";import{A as p}from"./AdminPage-p1npQ__1.js";import{l as d,m as x}from"./convectaNotifs-DNaDwIKc.js";import"./BotaoAtualizar-DGCccYs1.js";import"./SeparadoresDaFamilia-RN2o2tRb.js";const m=o=>new Date(o).toLocaleDateString("pt-PT",{day:"numeric",month:"short"});function j(){const[o,n]=s.useState(null),r=c();return s.useEffect(()=>{d().then(e=>{n(e),e.filter(a=>!a.read).forEach(a=>x(a.id).catch(()=>{}))}).catch(()=>n([]))},[]),t.jsxs(p,{title:"Notícias",children:[t.jsx("style",{dangerouslySetInnerHTML:{__html:h}}),t.jsxs("div",{className:"nc",children:[o==null&&t.jsx("div",{className:"nc-vazio",children:"A carregar…"}),(o==null?void 0:o.length)===0&&t.jsx("div",{className:"nc-vazio",children:"Ainda não há notícias."}),o==null?void 0:o.map(e=>{const a=e.url&&String(e.url).startsWith("/admin"),i=a?"button":"div";return t.jsxs(i,{type:a?"button":void 0,className:"nc-item",onClick:a?()=>r(e.url):void 0,children:[t.jsx("span",{className:`nc-ponto${e.read?"":" novo"}`}),t.jsxs("span",{className:"nc-txt",children:[t.jsxs("span",{className:"nc-topo",children:[t.jsx("b",{children:e.title}),t.jsx("em",{children:m(e.created_at)})]}),e.body&&t.jsx("span",{className:"nc-corpo",children:e.body})]}),a&&t.jsx(l,{size:18,className:"nc-seta"})]},e.id)})]})]})}const h=`
.nc { max-width: 640px; }
.nc-vazio { padding: 40px 0; text-align: center; color: var(--text-sec); }
.nc-item { display: flex; gap: 12px; align-items: flex-start; width: 100%; padding: 16px 0; border: 0; border-bottom: 1px solid var(--border); background: none; font: inherit; color: var(--text); text-align: left; }
button.nc-item { cursor: pointer; }
.nc-ponto { width: 8px; height: 8px; border-radius: 999px; margin-top: 7px; flex-shrink: 0; background: transparent; }
.nc-ponto.novo { background: var(--gold); }
.nc-txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
.nc-topo { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.nc-topo b { font-size: 16px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nc-topo em { font-style: normal; font-size: 13px; color: var(--text-ter); white-space: nowrap; }
.nc-corpo { font-size: 14.5px; color: var(--text-sec); line-height: 1.5; }
.nc-seta { color: var(--text-ter); flex-shrink: 0; margin-top: 3px; }
`;export{j as default};
