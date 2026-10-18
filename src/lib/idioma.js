/*
 * IDIOMA DO PAINEL (18/10/2026, pedido do Diogo: «Idioma» tem de deixar mudar).
 *
 * O painel está escrito em português, texto a texto, em centenas de
 * ficheiros. Em vez de mexer em todos, a tradução faz-se por cima: um
 * dicionário revisto (src/lib/traducoes/en.json — frases inteiras, não
 * tradução automática) e um observador que troca o TEXTO de cada nó pelo
 * texto em inglês, sem tirar nem pôr nós. Assim o React não parte: quando
 * ele volta a escrever o português, o observador volta a trocar.
 *
 * O que não se traduz: o que o barbeiro escreveu (nomes, serviços — só se
 * coincidirem com uma frase do painel), campos de texto, e o que estiver
 * dentro de [data-sem-traduzir].
 *
 * Para acrescentar uma frase nova: pô-la no en.json, em «plano» (frase
 * inteira) ou «padroes» (com {0}, {1} no lugar dos valores).
 */
const CHAVE = 'convecta_idioma';
export const IDIOMAS = [
  { id: 'pt', nome: 'Português (Portugal)', bandeira: '🇵🇹' },
  { id: 'en', nome: 'English', bandeira: '🇬🇧' },
];

export function lerIdioma() {
  try { return localStorage.getItem(CHAVE) === 'en' ? 'en' : 'pt'; } catch { return 'pt'; }
}
export function mudarIdioma(id) {
  try { localStorage.setItem(CHAVE, id); } catch { /* sem armazenamento: fica como está */ }
  window.location.reload();
}

let plano = null, padroes = [], datas = null, reDatas = null;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function preparar(dic) {
  plano = new Map(Object.entries(dic.plano || {}));
  padroes = Object.entries(dic.padroes || {}).map(([pt, en]) => {
    const partes = pt.split(/(\{\d+\})/);
    const ordem = [];
    const re = partes.map(p => { const m = p.match(/^\{(\d+)\}$/); if (m) { ordem.push(Number(m[1])); return '(.+?)'; } return esc(p); }).join('');
    return { re: new RegExp('^' + re + '$'), ordem, en, fixo: partes.filter(p => !/^\{\d+\}$/.test(p)).join('').length };
  }).filter(p => p.fixo >= 3).sort((a, b) => b.fixo - a.fixo);
  datas = dic.datas || {};
  const ks = Object.keys(datas).sort((a, b) => b.length - a.length).map(esc);
  reDatas = ks.length ? new RegExp('(^|[^\\p{L}])(' + ks.join('|') + ')(?=$|[^\\p{L}])', 'giu') : null;
}

function traduzirTexto(txt) {
  const m = txt.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const nucleo = m[2].replace(/\s+/g, ' ');
  if (!nucleo || !/[a-zà-ú]/i.test(nucleo)) return null;
  let en = plano.get(nucleo);
  if (en == null) { const n = nucleo.match(/^(\d+) de (\d+)$/); if (n) en = `${n[1]} of ${n[2]}`; }
  if (en == null) {
    for (const p of padroes) {
      const r = nucleo.match(p.re);
      if (r) {
        en = p.en.replace(/\{(\d+)\}/g, (_, i) => { const v = r[p.ordem.indexOf(Number(i)) + 1] ?? ''; return plano.get(v.trim()) ?? v; });
        break;
      }
    }
  }
  if (en == null && reDatas && reDatas.test(nucleo)) {
    reDatas.lastIndex = 0;
    en = nucleo.replace(/(\d{1,2}) de (\p{L}+)( de (\d{4}))?/gu, (t, d, mes, _x, ano) => (datas[mes.toLowerCase()] ? `${d} ${datas[mes.toLowerCase()]}${ano ? ' ' + ano : ''}` : t))
      .replace(reDatas, (t, a, w) => a + (datas[w.toLowerCase()] || w));
    if (en === nucleo) en = null;
  }
  reDatas && (reDatas.lastIndex = 0);
  return en == null ? null : m[1] + en + m[3];
}

const SALTAR = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);
function deixar(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    if (SALTAR.has(e.tagName) || e.isContentEditable || e.hasAttribute?.('data-sem-traduzir')) return true;
  }
  return false;
}
function noTexto(n) {
  const p = n.parentElement;
  if (!p || deixar(p)) return;
  const en = traduzirTexto(n.nodeValue);
  if (en != null && en !== n.nodeValue) n.nodeValue = en;
}
const ATRIBUTOS = ['placeholder', 'title', 'aria-label'];
function noElemento(el) {
  if (deixar(el)) return;
  for (const a of ATRIBUTOS) {
    const v = el.getAttribute?.(a);
    if (v) { const en = traduzirTexto(v); if (en != null && en !== v) el.setAttribute(a, en); }
  }
  if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) {
    const en = traduzirTexto(el.value); if (en) el.value = en;
  }
}
function percorrer(raiz) {
  if (raiz.nodeType === 3) return noTexto(raiz);
  if (raiz.nodeType !== 1) return;
  if (SALTAR.has(raiz.tagName)) return;
  noElemento(raiz);
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) noTexto(n); else noElemento(n); }
}

export async function iniciarIdioma() {
  if (lerIdioma() !== 'en') return;
  document.documentElement.lang = 'en';
  const dic = (await import('./traducoes/en.json')).default;
  preparar(dic);
  const titulo = document.title; const t = traduzirTexto(titulo); if (t) document.title = t;
  const obs = new MutationObserver(lista => {
    for (const m of lista) {
      if (m.type === 'characterData') noTexto(m.target);
      else if (m.type === 'attributes') noElemento(m.target);
      else m.addedNodes.forEach(percorrer);
    }
  });
  const arrancar = () => {
    percorrer(document.body);
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  };
  if (document.body) arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);
}
