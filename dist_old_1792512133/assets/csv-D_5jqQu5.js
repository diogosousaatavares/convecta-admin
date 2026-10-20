function f(o,e){if(!e||!e.length)return;const c=Object.keys(e[0]),a=[c.join(";"),...e.map(l=>c.map(s=>`"${String(l[s]??"").replace(/"/g,'""')}"`).join(";"))].join(`
`),r=new Blob(["\uFEFF"+a],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(r),t=document.createElement("a");t.href=n,t.download=o,t.click(),URL.revokeObjectURL(n)}export{f as e};
