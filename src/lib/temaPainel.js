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

/*
 * MODO CLARO — o mesmo painel com a luz acesa.
 *
 * A regra é a que já valia para o escuro, virada ao contrário: o fundo é
 * neutro, o texto está calibrado (secundário com contraste ≥ 6,5 sobre os
 * cartões), e a COR DE DESTAQUE continua a ser a que o barbeiro escolheu.
 * Um amarelo claro em cima de branco não se lê — por isso, e só no modo
 * claro, a cor é escurecida o mínimo necessário para se ver, mantendo o
 * tom e a saturação. Continua a ser o amarelo dele, não outro.
 */
const BASE_CLARO = {
  '--bg': '#F4F4F6', '--surface': '#FFFFFF', '--elevated': '#FFFFFF', '--border': '#E2E2E7',
  '--text': '#17171B', '--text-sec': '#5A5A63', '--text-ter': '#8A8A93',
};

export const MODOS = [
  { v: 'claro',  l: 'Claro',  nota: 'o normal' },
  { v: 'escuro', l: 'Escuro', nota: 'para a barbearia à noite' },
];
/*
 * O PAINEL ABRE CLARO.
 *
 * Abria escuro, e o escuro e uma escolha, nao um sitio onde se aterra: a
 * barbearia a luz do dia, o telemovel na rua e o papel quando se imprime
 * sao todos claros. Quem quiser escuro carrega no sol/lua la em cima e
 * fica assim — a escolha segue a conta (config.theme.modo), por isso
 * tambem o segue para o telemovel.
 *
 * So o 'escuro' escrito de proposito conta como escuro. Sem nada escrito,
 * e claro — incluindo em quem nunca mexeu nisto.
 */
const CHAVE_MODO = 'convecta-painel-modo';
export const lerModo = () => {
  try { return localStorage.getItem(CHAVE_MODO) === 'escuro' ? 'escuro' : 'claro' } catch { return 'claro' }
};
export const guardarModo = m => { try { localStorage.setItem(CHAVE_MODO, m === 'escuro' ? 'escuro' : 'claro') } catch {} };

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

/* ── Escurecer uma cor sem lhe mudar o tom ───────────────────────────────
 * Só se usa no modo claro, e só até a cor se ler em cima do branco. */
function hexHsl(hex) {
  const c = hexRgb(hex); if (!c) return null;
  const [r, g, b] = c.map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
}
function hslHex(h, s, l) {
  const f = n => {
    const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
/** Baixa a luminosidade em passos de 4% até a cor se ler sobre `fundo`. */
export function escurecerAte(hex, fundo, alvo = 4.5) {
  const hsl = hexHsl(hex); if (!hsl) return hex;
  let [h, s, l] = hsl, cor = hex;
  for (let i = 0; i < 24 && contraste(cor, fundo) < alvo; i++) {
    l = Math.max(0.04, l - 0.04);
    cor = hslHex(h, s, l);
  }
  return cor;
}

/** As variáveis que se calculam a partir das escolhidas. */
export function derivar(colors, modo = 'escuro') {
  const base = modo === 'claro' ? BASE_CLARO : BASE;
  // No modo claro só a cor de destaque vem das escolhas do barbeiro: os
  // fundos e os textos são os da base clara, senão ficava preto sobre preto.
  const c = modo === 'claro'
    ? { ...DEFAULT_COLORS, ...(colors || {}), ...base }
    : { ...DEFAULT_COLORS, ...(colors || {}) };
  const gold = hexRgb(c['--gold']) || [248, 207, 0];
  /*
   * Duas variáveis para uma cor, e é de propósito:
   *   --gold        preenche (botões, item ativo). Fica exatamente a cor que
   *                 o barbeiro escolheu, nos dois modos; o texto por cima
   *                 escolhe-se sozinho (--on-gold).
   *   --gold-tinta  escreve (títulos, ícones, links). No escuro é a mesma
   *                 cor; no claro é escurecida o mínimo para se ler sobre
   *                 branco — um amarelo vivo em texto sobre branco não se lê.
   */
  const tinta = modo === 'claro' ? escurecerAte(c['--gold'], c['--surface']) : c['--gold'];
  const text = hexRgb(c['--text']) || [242, 242, 242];
  return {
    ...c,
    '--gold-rgb': gold.join(','),
    '--gold-tinta': tinta,
    '--gold-tinta-rgb': (hexRgb(tinta) || gold).join(','),
    '--on-gold-tinta': textoSobre(tinta),
    '--bg-rgb': (hexRgb(c['--bg']) || [11, 11, 12]).join(','),
    '--surface-rgb': (hexRgb(c['--surface']) || [21, 21, 23]).join(','),
    '--text-rgb': text.join(','),
    '--on-gold': textoSobre(c['--gold']),
    '--gold-soft': `rgba(${gold.join(',')},${modo === 'claro' ? 0.16 : 0.25})`,
    '--shadow-gold': `0 4px 20px rgba(${gold.join(',')},${modo === 'claro' ? 0.22 : 0.28})`,
    // O véu que cobre um cartão quando se passa o rato: branco no escuro,
    // preto no claro. As 43 regras do index.css que o usavam à mão passaram
    // todas por aqui.
    '--veu': modo === 'claro' ? '0,0,0' : '255,255,255',
    '--linha-grafico': modo === 'claro' ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.06)',
    // A rampa dos gráficos. Neutra de propósito (o painel é neutro), e com
    // os tons invertidos no claro — cinzentos claros sobre branco não se veem.
    '--graf-1': modo === 'claro' ? '#3F3F46' : '#E5E5E5',
    '--graf-2': modo === 'claro' ? '#71717A' : '#B0B0B0',
    '--graf-3': modo === 'claro' ? '#A1A1AA' : '#7A7A7A',
    '--graf-4': modo === 'claro' ? '#C4C4CB' : '#4A4A4A',
    '--graf-5': modo === 'claro' ? '#E4E4E7' : '#2A2A2A',
    '--linha-agm': modo === 'claro' ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.11)',
  };
}

/**
 * Escreve o tema. O `modo` vem, por esta ordem: do que for passado aqui, do
 * que estiver guardado na conta (config.theme.modo) ou do que este
 * telemóvel escolheu da última vez.
 */
export function applyTheme(colors, modo) {
  const m = modo || (colors && colors.modo) || lerModo();
  let el = document.getElementById('convecta-theme');
  if (!el) { el = document.createElement('style'); el.id = 'convecta-theme'; document.head.appendChild(el); }
  const d = derivar(colors, m);
  delete d.modo;
  el.textContent = `:root { ${Object.entries(d).map(([k, v]) => `${k}: ${v};`).join(' ')} }`;
  // A classe é o que liga o bloco `html.theme-light` do index.css, onde
  // vivem as variáveis do Tailwind/shadcn, que não cabem aqui.
  document.documentElement.classList.toggle('theme-light', m === 'claro');
  guardarModo(m);
  return m;
}

/** Avisos de leitura: o que se lê mal com estas cores. */
export function avisosDeContraste(colors, modo = 'escuro') {
  const c = derivar(colors, modo);
  const a = [];
  if (contraste(c['--text'], c['--surface']) < 7) a.push('O texto principal lê-se mal em cima dos cartões.');
  if (contraste(c['--text-sec'], c['--surface']) < 4.5) a.push('O texto secundário (legendas, menu) lê-se mal.');
  if (contraste(c['--gold-tinta'], c['--surface']) < 3) a.push('A cor de destaque quase não se distingue do fundo.');
  if (contraste(c['--border'], c['--surface']) < 1.15) a.push('As linhas de separação não se veem.');
  return a;
}
