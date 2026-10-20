import{j as e,Q as c,I as s}from"./index-MSJ5Bzx4.js";function d({itens:o,colunas:x=2,lista:i=!1,azulejos:r=!1}){return e.jsx("div",{className:`cx-grelha${i?" cx-lista":""}${r?" cx-azulejos":""}`,style:{"--cx-colunas":x},"data-grelha":!0,children:o.map(a=>{const t=a.icon;return e.jsxs(c,{to:a.to,className:"cx",children:[e.jsx("span",{className:"cx-icone",children:t?e.jsx(t,{size:22,strokeWidth:1.8}):null}),e.jsxs("span",{className:"cx-texto",children:[e.jsx("b",{children:a.label}),a.d&&!r&&e.jsx("span",{children:a.d})]}),!r&&e.jsx(s,{size:18,className:"cx-seta"})]},a.to)})})}const l=`
.cx-grelha { display: grid; grid-template-columns: 1fr; gap: 10px; }
@media (min-width: 768px) { .cx-grelha { grid-template-columns: repeat(var(--cx-colunas, 2), minmax(0, 1fr)); gap: 14px; } }
.cx { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 16px; text-decoration: none; color: var(--text);
  background: var(--surface); border: 1px solid var(--border); min-height: 72px; }
.cx:active { background: rgba(var(--gold-rgb), .10); }
@media (hover: hover) { .cx:hover { border-color: var(--text-ter); } }
.cx-icone { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: grid; place-items: center; background: rgba(var(--gold-rgb), .16); color: var(--gold-tinta, var(--gold)); }
.cx-texto { flex: 1; min-width: 0; display: grid; gap: 2px; }
.cx-texto b { font-size: 16px; font-weight: 700; }
.cx-texto span { font-size: 14px; color: var(--text-sec); line-height: 1.35; }
.cx-seta { color: var(--text-ter); flex-shrink: 0; }
.cx-azulejos { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px; }
.cx-azulejos .cx { flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 18px; min-height: 104px; padding: 16px; }
.cx-azulejos .cx-icone { width: 26px; height: 26px; border-radius: 0; background: none; color: var(--text); }
.cx-azulejos .cx-texto b { font-size: 16.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (min-width: 768px) { .cx-azulejos { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; } }
@media (max-width: 767px) {
  .cx-lista { gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .cx-lista .cx { border: 0; border-bottom: 1px solid var(--border); border-radius: 0; min-height: 56px; padding: 14px 16px; background: none; }
  .cx-lista .cx:last-child { border-bottom: 0; }
  .cx-lista .cx-icone { width: 24px; height: 24px; border-radius: 0; background: none; color: var(--text); }
  .cx-lista .cx-icone svg { width: 20px; height: 20px; }
  .cx-lista .cx-texto b { font-size: 15.5px; font-weight: 600; }
  .cx-lista .cx-texto span { display: none; }
}
`;export{l as C,d as a};
