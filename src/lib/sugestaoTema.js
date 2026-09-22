/*
 * Sugestão de tema a partir do logótipo.
 *
 * Não há IA aqui, e por isso não se chama IA: lê-se o logótipo num canvas,
 * encontram-se as cores que ele usa e montam-se três propostas de tema com
 * as regras que um designer usaria — fundo da família da cor da marca,
 * contraste suficiente para ler, e a cor da marca nos botões e preços.
 * É instantâneo, gratuito, e dá sempre o mesmo resultado para o mesmo logo.
 *
 * Devolve temas no contrato do `applyTheme` da app de cliente
 * (theme.colors / theme.fonts / theme.radius) — ver contrato-tema.md.
 */

// ── Cores: conversões ─────────────────────────────────────────────────────
export function hexParaRgb(hex) {
  const h = String(hex || '').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

export function hslParaHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
      : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const hex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

// Contraste WCAG entre duas cores (1 a 21).
function luminancia(hex) {
  const [r, g, b] = hexParaRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Mexe só na luminosidade até a cor ter o contraste pedido contra o fundo.
function comContraste(h, s, l, fundo, minimo, sentido) {
  let hex = hslParaHex(h, s, l);
  for (let i = 0; i < 40 && contraste(hex, fundo) < minimo; i++) {
    l += sentido * 0.015;
    hex = hslParaHex(h, s, l);
  }
  return hex;
}

// ── Ler o logótipo ────────────────────────────────────────────────────────
function carregarImagem(src) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error('Não foi possível abrir a imagem.'));
    img.src = src;
  });
}

/*
 * As cores do logótipo.
 *
 * Aceita um URL ou um File. Devolve:
 *   marca        a cor principal (a mais presente das que têm cor), ou null
 *                se o logótipo for preto/branco/cinzento
 *   segunda      outra cor com cor, se houver
 *   fundoEscuro  true se o logótipo foi desenhado sobre fundo escuro
 *   paleta       as cores encontradas, da mais para a menos presente
 */
export async function coresDoLogotipo(origem) {
  const src = typeof origem === 'string' ? origem : URL.createObjectURL(origem);
  try {
    const img = await carregarImagem(src);
    const L = 96;
    const esc = Math.min(L / img.naturalWidth, L / img.naturalHeight, 1);
    const w = Math.max(1, Math.round(img.naturalWidth * esc));
    const h = Math.max(1, Math.round(img.naturalHeight * esc));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    let px;
    try { px = ctx.getImageData(0, 0, w, h).data; }
    catch { throw new Error('O browser não deixou ler esta imagem. Volta a carregar o logótipo em Marca e tenta outra vez.'); }

    // O fundo: a média dos quatro cantos (se forem opacos).
    const cantos = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]
      .map(([x, y]) => (y * w + x) * 4)
      .filter(i => px[i + 3] > 200)
      .map(i => [px[i], px[i + 1], px[i + 2]]);
    const fundo = cantos.length >= 3
      ? cantos.reduce((a, c) => a.map((v, k) => v + c[k] / cantos.length), [0, 0, 0])
      : null;
    const perto = (r, g, b, c) => c && Math.hypot(r - c[0], g - c[1], b - c[2]) < 48;

    // Agrupar as cores em caixas de 16 tons por canal.
    const caixas = new Map();
    let desenho = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      if (perto(r, g, b, fundo)) continue;
      desenho++;
      const k = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
      const c = caixas.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      c.n++; c.r += r; c.g += g; c.b += b;
      caixas.set(k, c);
    }
    const paleta = [...caixas.values()]
      .map(c => {
        const r = c.r / c.n, g = c.g / c.n, b = c.b / c.n;
        return { ...rgbParaHsl(r, g, b), n: c.n, hex: hslParaHex(...Object.values(rgbParaHsl(r, g, b))) };
      })
      .sort((a, b) => b.n - a.n);

    const minimo = Math.max(3, desenho * 0.02);
    const comCor = paleta
      .filter(c => c.s > 0.28 && c.l > 0.14 && c.l < 0.88 && c.n >= minimo)
      .sort((a, b) => b.n * (0.6 + b.s) - a.n * (0.6 + a.s));
    const marca = comCor[0] || null;
    const segunda = marca
      ? comCor.find(c => Math.min(Math.abs(c.h - marca.h), 360 - Math.abs(c.h - marca.h)) > 35) || null
      : null;

    // Sem fundo opaco (PNG transparente): decide-se pela cor do desenho.
    const lumFundo = fundo ? rgbParaHsl(...fundo).l : (paleta[0]?.l ?? 0.5);
    const fundoEscuro = fundo ? lumFundo < 0.45 : lumFundo > 0.6;

    return { marca, segunda, fundoEscuro, paleta: paleta.slice(0, 8).map(c => c.hex) };
  } finally {
    if (typeof origem !== 'string') URL.revokeObjectURL(src);
  }
}

// ── As propostas ──────────────────────────────────────────────────────────
const DOURADO = { h: 45, s: 0.68, l: 0.47 };

export function propostasDeTema(cores) {
  const m = cores?.marca || null;
  const base = m || DOURADO;
  const h = base.h;
  const s = Math.max(base.s, 0.45);
  const monocromatico = !m;

  // 1. Escuro — a família do costume, tingida pela cor da marca.
  const escuroBg = hslParaHex(h, monocromatico ? 0.1 : 0.16, 0.045);
  const escuro = {
    id: 'escuro',
    nome: 'Escuro com a tua cor',
    porque: monocromatico
      ? 'O teu logótipo é a preto e branco — um fundo escuro com um dourado discreto fica elegante e deixa o logo brilhar.'
      : 'Fundo quase preto, puxado para a cor do teu logótipo, com a tua cor nos botões e nos preços.',
    colors: {
      bg: escuroBg,
      surface: hslParaHex(h, monocromatico ? 0.08 : 0.12, 0.08),
      elevated: hslParaHex(h, monocromatico ? 0.08 : 0.11, 0.115),
      gold: comContraste(h, s, Math.max(base.l, 0.52), escuroBg, 4.5, +1),
      text: hslParaHex(h, 0.2, 0.92),
      textSec: hslParaHex(h, 0.08, 0.6),
      border: hslParaHex(h, 0.1, 0.15),
    },
    fonts: { heading: 'Playfair Display', body: 'Inter' },
    radius: 12,
  };

  // 2. Claro — branco quente, a cor da marca escurecida para se ler.
  const claroBg = hslParaHex(h, 0.25, 0.975);
  const claro = {
    id: 'claro',
    nome: 'Claro e limpo',
    porque: 'Fundo claro, como uma revista. A tua cor fica mais escura nos botões para se ler bem ao sol.',
    colors: {
      bg: claroBg,
      surface: '#FFFFFF',
      elevated: hslParaHex(h, 0.18, 0.93),
      gold: comContraste(h, s, Math.min(base.l, 0.42), claroBg, 4.6, -1),
      text: hslParaHex(h, 0.25, 0.1),
      textSec: comContraste(h, 0.08, 0.42, claroBg, 4.5, -1),
      border: hslParaHex(h, 0.14, 0.86),
    },
    fonts: { heading: 'Montserrat', body: 'Inter' },
    radius: 14,
  };

  // 3. Moderno — preto neutro, cor viva, letra de cartaz e cantos vivos.
  const modernoBg = '#0B0B0C';
  const moderno = {
    id: 'moderno',
    nome: 'Moderno e forte',
    porque: 'Preto neutro, a tua cor bem viva e títulos em letra de cartaz. Para uma barbearia com atitude.',
    colors: {
      bg: modernoBg,
      surface: '#151517',
      elevated: '#1D1D20',
      gold: comContraste(h, Math.max(s, 0.62), Math.max(base.l, 0.55), modernoBg, 5, +1),
      text: '#F4F4F5',
      textSec: '#9A9AA2',
      border: '#26262A',
    },
    fonts: { heading: 'Bebas Neue', body: 'DM Sans' },
    radius: 6,
  };

  // A primeira é a que combina com o fundo em que o logótipo foi desenhado.
  const ordem = cores?.fundoEscuro === false ? [claro, escuro, moderno] : [escuro, moderno, claro];
  ordem[0] = { ...ordem[0], recomendada: true };
  return ordem;
}
