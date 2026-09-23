/*
 * Preparar o logótipo que o barbeiro carrega em «O Meu Site › Marca».
 *
 * Nem todos têm o logótipo num ficheiro limpo: há quem mande uma fotografia
 * do cartão, um print do Instagram ou um PNG com margens enormes. Aqui lê-se
 * a imagem e procura-se o logótipo lá dentro:
 *
 *   1. endireita-se a foto (orientação do telemóvel);
 *   2. descobre-se o fundo pelas bordas da imagem (transparente, cor lisa,
 *      ou fotografia);
 *   3. corta-se tudo à volta do que não é fundo — as margens vazias;
 *   4. se o fundo é claro e quase liso (papel fotografado), iguala-se, para
 *      não ficarem sombras e manchas;
 *   5. sai o LOGÓTIPO na forma dele (largo fica largo, alto fica alto), justo
 *      e com pouca margem — é o que aparece no topo da app;
 *   6. e sai o ÍCONE quadrado de 512×512 com o logótipo ao centro, que é o
 *      que o telemóvel exige para o ícone no ecrã e no separador.
 *
 * Não recorta um logótipo de dentro de uma fotografia confusa (uma parede,
 * uma montra): aí só se centra e enquadra. Diz-se sempre o que se fez, e o
 * barbeiro pode voltar à imagem original.
 */

const LADO = 512;
const TRABALHO = 800;   // lado máximo para analisar — chega e é rápido
const PERTO = 42;       // distância de cor até onde ainda é «fundo»

async function abrir(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((ok, falha) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => falha(new Error('Não consegui abrir esta imagem. Experimenta um PNG ou JPG.'));
        i.src = url;
      });
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
}

const dist = (px, i, c) => Math.hypot(px[i] - c[0], px[i + 1] - c[1], px[i + 2] - c[2]);
const mediana = v => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1] ?? 0; };

/*
 * Devolve { logo, icone, ajustes, pequeno }:
 *   logo      PNG do logótipo na forma dele, sem margens a mais
 *   icone     PNG quadrado 512×512 para o ícone do telemóvel
 *   ajustes   frases curtas do que se fez, para mostrar ao barbeiro
 *   pequeno   true se o logótipo tem pouca resolução e pode ficar desfocado
 */
export async function prepararLogotipo(original) {
  if (!original?.type?.startsWith('image/') || original.type === 'image/svg+xml') {
    return { logo: original, icone: original, ajustes: [], pequeno: false };
  }
  const img = await abrir(original);
  const W0 = img.width || img.naturalWidth, H0 = img.height || img.naturalHeight;
  const esc = Math.min(1, TRABALHO / Math.max(W0, H0));
  const w = Math.max(1, Math.round(W0 * esc)), h = Math.max(1, Math.round(H0 * esc));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const dados = ctx.getImageData(0, 0, w, h);
  const px = dados.data;

  // ── O fundo, lido nas bordas ──
  const borda = [];
  const passo = Math.max(1, Math.round((w + h) / 400));
  for (let x = 0; x < w; x += passo) borda.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += passo) borda.push(y * w, y * w + w - 1);
  const idx = borda.map(p => p * 4);
  const transparentes = idx.filter(i => px[i + 3] < 40).length;
  const transparente = transparentes / idx.length > 0.6;
  const opacos = idx.filter(i => px[i + 3] >= 40);
  const fundo = transparente || !opacos.length ? null
    : [0, 1, 2].map(k => mediana(opacos.map(i => px[i + k])));
  const liso = transparente || (fundo && opacos.filter(i => dist(px, i, fundo) < PERTO).length / opacos.length > 0.7);

  // ── Onde está o logótipo ──
  // Conta-se, por linha e por coluna, quantos píxeis não são fundo; as
  // linhas com quase nada (ruído, pó, compressão JPEG) contam como vazias.
  const linhas = new Uint32Array(h), colunas = new Uint32Array(w);
  const eLogo = (i) => transparente ? px[i + 3] > 40 : px[i + 3] > 40 && dist(px, i, fundo) > PERTO;
  if (liso) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (eLogo((y * w + x) * 4)) { linhas[y]++; colunas[x]++; }
    }
  } else {
    // Fotografia: sem fundo liso, segue-se o «desenho» — onde há contraste.
    const lum = i => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const g = Math.abs(lum(i + 4) - lum(i - 4)) + Math.abs(lum(i + w * 4) - lum(i - w * 4));
      if (g > 60) { linhas[y]++; colunas[x]++; }
    }
  }
  const limite = (arr, outro) => Math.max(2, Math.round(outro * (liso ? 0.004 : 0.03)));
  const primeiro = (arr, min) => { for (let i = 0; i < arr.length; i++) if (arr[i] >= min) return i; return -1; };
  const ultimo = (arr, min) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] >= min) return i; return -1; };
  let y0 = primeiro(linhas, limite(linhas, w)), y1 = ultimo(linhas, limite(linhas, w));
  let x0 = primeiro(colunas, limite(colunas, h)), x1 = ultimo(colunas, limite(colunas, h));

  const ajustes = [];
  let cortou = false;
  if (y0 < 0 || x0 < 0 || (x1 - x0) < 8 || (y1 - y0) < 8) {
    x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1;           // nada encontrado: fica inteira
  } else {
    const area = ((x1 - x0 + 1) * (y1 - y0 + 1)) / (w * h);
    // Numa fotografia, um recorte minúsculo é quase sempre engano: fica inteira.
    if (!liso && area < 0.2) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }
    else if (area < 0.9) cortou = true;
  }
  if (cortou) ajustes.push(liso ? 'Cortámos as margens vazias à volta do logótipo.' : 'Enquadrámos a parte da foto onde está o logótipo.');

  // ── Fundo claro e quase liso (papel fotografado): iguala-se ──
  if (liso && fundo && !transparente) {
    const l = (Math.max(...fundo) + Math.min(...fundo)) / 510;
    const sujo = opacos.some(i => dist(px, i, fundo) > 6);
    if (l > 0.7 && sujo) {
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] > 40 && dist(px, i, fundo) <= PERTO) { px[i] = fundo[0]; px[i + 1] = fundo[1]; px[i + 2] = fundo[2]; }
      }
      ctx.putImageData(dados, 0, 0);
      ajustes.push('Limpámos o fundo (sombras e manchas da fotografia).');
    }
  }

  // ── Fundo liso: tira-se, e o logótipo fica transparente ──
  // Um logótipo com um quadrado branco (ou preto) à volta fica sempre mal em
  // cima da capa e do menu da app. Se o fundo é de uma cor só, apaga-se:
  // o que está à cor do fundo fica transparente, com a borda suavizada.
  if (liso && fundo && !transparente) {
    const dentro = PERTO * 0.55;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] <= 40) continue;
      const d = dist(px, i, fundo);
      if (d <= dentro) px[i + 3] = 0;
      else if (d < PERTO) px[i + 3] = Math.round(px[i + 3] * (d - dentro) / (PERTO - dentro));
    }
    ctx.putImageData(dados, 0, 0);
    ajustes.push('Tirámos o fundo — o logótipo ficou transparente.');
  }

  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const cor = fundo ? `rgb(${fundo.map(Math.round).join(',')})` : null;
  const desenhar = (largura, altura, margemX, margemY, cobrir = false, comFundo = false) => {
    const c = document.createElement('canvas');
    c.width = Math.round(largura); c.height = Math.round(altura);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    if (cor && comFundo) { g.fillStyle = cor; g.fillRect(0, 0, c.width, c.height); }
    // cobrir: numa fotografia enche-se o quadrado (corta as pontas) em vez de
    // deixar faixas de cor à volta.
    const s = (cobrir ? Math.max : Math.min)((c.width - 2 * margemX) / cw, (c.height - 2 * margemY) / ch);
    const dw = cw * s, dh = ch * s;
    g.drawImage(cv, x0, y0, cw, ch, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    return c;
  };
  const paraFicheiro = (c, nome) => new Promise(r => c.toBlob(b => r(new File([b], nome, { type: 'image/png' })), 'image/png'));

  // O logótipo: a forma dele (não quadrado), justo, com pouca margem.
  const real = Math.max(cw, ch) / esc;                    // lado maior no original
  const alvo = Math.min(900, Math.max(320, real));        // não inventa resolução a mais
  const k = alvo / Math.max(cw, ch);
  const folga = liso ? Math.round(Math.max(cw, ch) * k * 0.06) : 0;
  const logo = desenhar(cw * k + 2 * folga, ch * k + 2 * folga, folga, folga, false, !liso && !transparente);

  // O ícone do telemóvel: esse tem de ser quadrado (é a regra do Android/iPhone).
  const m = LADO * (liso ? 0.12 : 0.04);
  // O ícone leva a cor do fundo original: o iPhone não aceita ícones
  // transparentes (pinta-os de preto). O logótipo em si fica sem fundo.
  const icone = desenhar(LADO, LADO, m, m, !liso, true);

  if (cortou || Math.abs(cw - ch) / Math.max(cw, ch) > 0.03) {
    ajustes.push('O ícone do telemóvel ficou quadrado com o logótipo ao centro.');
  }

  return {
    logo: await paraFicheiro(logo, 'logotipo.png'),
    icone: await paraFicheiro(icone, 'icone.png'),
    ajustes,
    pequeno: real < 160,
  };
}
