/*
 * Os temas do PAINEL do barbeiro (Definições › Tema).
 *
 * Regra que os torna coerentes: o fundo é sempre o mesmo cinzento-quase-preto
 * neutro, com o texto calibrado para se ler (contraste ≥ 7 no texto
 * secundário). Só a COR DE DESTAQUE muda de tema para tema — botões, o item
 * ativo do menu, valores, marcações confirmadas. O texto por cima da cor de
 * destaque é escolhido sozinho (preto ou branco, o que se ler melhor).
 *
 * O tema «Convecta» usa o amarelo do logótipo A.
 */
const BASE = {
  '--bg': '#0B0B0C', '--surface': '#151517', '--elevated': '#1D1D20', '--border': '#2A2A2E',
  '--text': '#F2F2F2', '--text-sec': '#A3A3A8', '--text-ter': '#75757C',
};

export const PRESETS = [
  { label: 'Convecta', nota: 'o amarelo do logótipo', gold: '#F8CF00' },
  { label: 'Dourado', nota: 'o clássico', gold: '#C9A227' },
  { label: 'Grafite', nota: 'preto e branco', gold: '#EDEDED' },
  { label: 'Azul', gold: '#5B9BF0' },
  { label: 'Esmeralda', gold: '#2FBF71' },
  { label: 'Laranja', gold: '#FF8A3D' },
  { label: 'Vermelho', gold: '#E0566E' },
  { label: 'Violeta', gold: '#A77BF3' },
].map(p => ({ ...p, colors: { ...BASE, '--gold': p.gold } }));

export const DEFAULT_COLORS = PRESETS[0].colors;

export function hexRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminancia(hex) {
  const c = hexRgb(hex); if (!c) return null;
  const [r, g, b] = c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a, b) {
  const x = luminancia(a), y = luminancia(b);
  if (x == null || y == null) return 21;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Preto ou branco por cima de uma cor — o que se ler melhor. */
export function textoSobre(hex) {
  return contraste('#111111', hex) >= contraste('#FFFFFF', hex) ? '#111111' : '#FFFFFF';
}

/** As variáveis que se calculam a partir das escolhidas. */
export function derivar(colors) {
  const c = { ...DEFAULT_COLORS, ...(colors || {}) };
  const gold = hexRgb(c['--gold']) || [248, 207, 0];
  const text = hexRgb(c['--text']) || [242, 242, 242];
  return {
    ...c,
    '--gold-rgb': gold.join(','),
    '--text-rgb': text.join(','),
    '--on-gold': textoSobre(c['--gold']),
    '--gold-soft': `rgba(${gold.join(',')},0.25)`,
    '--shadow-gold': `0 4px 20px rgba(${gold.join(',')},0.28)`,
  };
}

export function applyTheme(colors) {
  let el = document.getElementById('convecta-theme');
  if (!el) { el = document.createElement('style'); el.id = 'convecta-theme'; document.head.appendChild(el); }
  const d = derivar(colors);
  el.textContent = `:root { ${Object.entries(d).map(([k, v]) => `${k}: ${v};`).join(' ')} }`;
}

/** Avisos de leitura: o que se lê mal com estas cores. */
export function avisosDeContraste(colors) {
  const c = { ...DEFAULT_COLORS, ...(colors || {}) };
  const a = [];
  if (contraste(c['--text'], c['--surface']) < 7) a.push('O texto principal lê-se mal em cima dos cartões.');
  if (contraste(c['--text-sec'], c['--surface']) < 4.5) a.push('O texto secundário (legendas, menu) lê-se mal.');
  if (contraste(c['--gold'], c['--surface']) < 3) a.push('A cor de destaque quase não se distingue do fundo.');
  if (contraste(c['--border'], c['--surface']) < 1.15) a.push('As linhas de separação não se veem.');
  return a;
}
