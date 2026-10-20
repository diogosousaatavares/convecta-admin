import{r as h,j as i,a0 as p,a2 as f}from"./index-MSJ5Bzx4.js";import{T as m}from"./trash-2-Ce3VD9Y0.js";function u({hora:l,titulo:a,valor:s,cor:n,detalhes:r=[],onApagar:d,apagarRotulo:o="Eliminar"}){const[x,t]=h.useState(!1);return i.jsxs(i.Fragment,{children:[i.jsxs("button",{type:"button",className:"ldin",onClick:()=>t(!0),children:[l&&i.jsx("span",{className:"ldin-hora",children:l}),i.jsx("span",{className:"ldin-t",children:a}),i.jsx("b",{className:"ldin-v",style:n?{color:n}:void 0,children:s})]}),x&&i.jsx(p,{open:!0,onClose:()=>t(!1),title:"",children:i.jsxs("div",{className:"ldin-ficha",children:[i.jsx("div",{className:"ldin-ficha-t",children:a}),i.jsx("div",{className:"ldin-ficha-v",style:n?{color:n}:void 0,children:s}),r.filter(e=>e&&e[1]!=null&&e[1]!==""&&e[1]!=="—").length>0&&i.jsx("div",{className:"ldin-dados",children:r.filter(e=>e&&e[1]!=null&&e[1]!==""&&e[1]!=="—").map(([e,c])=>i.jsxs("div",{children:[i.jsx("span",{children:e}),i.jsx("b",{children:c})]},e))}),d&&i.jsxs(f,{variant:"ghost",onClick:()=>{t(!1),d()},children:[i.jsx(m,{size:15})," ",o]})]})}),i.jsx("style",{dangerouslySetInnerHTML:{__html:g}})]})}const g=`
.ldin {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 50px; padding: 6px 2px;
  border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); text-align: left; cursor: pointer; font: inherit;
}
.ldin:last-child { border-bottom: 0; }
.ldin-hora { width: 44px; flex-shrink: 0; font-weight: 700; color: var(--gold-tinta); font-variant-numeric: tabular-nums; font-size: 14.5px; }
.ldin-t { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ldin-v { flex-shrink: 0; font-size: 15.5px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ldin-ficha { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.ldin-ficha-t { font-size: 19px; font-weight: 700; }
.ldin-ficha-v { font-size: 30px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ldin-dados { width: 100%; margin: 12px 0 10px; border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; text-align: left; }
.ldin-dados > div { display: flex; justify-content: space-between; gap: 12px; align-items: center; min-height: 46px; padding: 0 14px; border-bottom: 1px solid var(--border); font-size: 15px; }
.ldin-dados > div:last-child { border-bottom: 0; }
.ldin-dados span { color: var(--text-sec); flex-shrink: 0; }
.ldin-dados b { font-weight: 600; text-align: right; min-width: 0; }
`;export{u as L};
