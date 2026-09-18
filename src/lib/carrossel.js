/*
 * O carrossel da parceria — a arte é dele, o que muda é escrito por cima.
 *
 * ── Como isto funciona ───────────────────────────────────────────────────
 *
 * Os cinco cartazes são ficheiros desenhados à mão, em public/carrossel/. O
 * código não redesenha nada: carrega a imagem, e depois faz três coisas.
 *
 *   1. Troca o amarelo da marca pela cor da barbearia.
 *   2. Apaga os marcadores («NOME DA BARBEARIA», o quadrado do `?`, o perfil
 *      de Instagram de exemplo) e escreve os dados verdadeiros.
 *   3. Devolve um PNG.
 *
 * ── Porque é que o amarelo se troca pixel a pixel e não por camadas ──────
 *
 * Porque não há camadas: o que chega aqui é um JPEG achatado. A alternativa
 * seria pedir cinco ficheiros por cada cor possível, o que é impossível — a
 * cor é a que o barbeiro escolheu em «O Meu Site», e há uma infinidade.
 *
 * O apuro está em separar o amarelo da marca de tudo o resto. O cartaz da
 * capa tem duas mãos a apertar-se, e pele é laranja-amarelada: uma selecção
 * pela cor sozinha deixava duas mãos verdes. O que os separa é a
 * SATURAÇÃO — o amarelo é muito mais vivo do que qualquer tom de pele — e é
 * por aí que se corta.
 *
 * ── E porque é que a luminosidade não muda ───────────────────────────────
 *
 * Só a matiz e a saturação vêm da cor nova; o brilho de cada pixel fica como
 * estava. Há texto PRETO por cima do amarelo nestes cartazes (a pastilha do
 * «Arrasta», o botão «Marcar agora»). Se a cor nova trouxesse também o seu
 * brilho, uma barbearia de azul-escuro ficava com texto preto sobre
 * azul-escuro — ilegível, e ninguém perceberia porquê. Assim, um azul-escuro
 * sai azul claro: não é exactamente a cor dele, mas lê-se, e continua a ser
 * a cor dele aos olhos de quem vê.
 */

const AMARELO = 0.122          // o tom da marca, na roda de cores (0..1)
const FONTE_TITULO = 'Inter'   // a letra dos cartazes, confirmada contra a arte

// O ponto do «Convecta.» no cabeçalho. É a nossa marca dentro do cartaz
// dele — muda de dono, não de cor.
const PONTO_CONVECTA = { x: 0.425, y: 0.080, X: 0.475, Y: 0.125 }

/*
 * Os cinco cartazes.
 *
 * Cada `zona` diz o que apagar e o que escrever no lugar. As medidas estão
 * em fracções da imagem, não em pixéis: assim os cartazes podem ser
 * reexportados noutro tamanho sem nada disto deixar de bater certo.
 *
 * `limpar` diz COMO se apaga:
 *   'escuro' — só os pixéis escuros passam a fundo. É o que permite apagar
 *              uma frase preta sem tocar no risco amarelo que lhe passa por
 *              baixo, e sem ter de acertar num rectângulo ao pixel.
 *   'claro'  — o contrário, para texto branco sobre fundo escuro.
 *   'tudo'   — o rectângulo inteiro, para onde se vai pôr uma imagem.
 */
export const MODELO = {
  id: 'parceria',
  nome: 'Parceria com a Convecta',
  resumo: 'Anuncia a novidade e explica como se marca. É o post para publicar no dia em que abres as marcações.',
  pasta: '/carrossel/parceria/',
  ecras: [
    {
      ficheiro: '1.jpg', larg: 1122, alt: 1402, cabecalho: true,
      zonas: [
        { tipo: 'logo',  limpar: 'tudo',   x: 0.6338, y: 0.0478, X: 0.7372, Y: 0.1220, recuo: 0.14 },
        { tipo: 'nome',  limpar: 'escuro', x: 0.500,  y: 0.1250, X: 0.830,  Y: 0.1430,
          peso: 600, tracking: 0.16, maiusculas: true, alinhar: 'centro', tamanho: 0.0165 },
        /*
         * A primeira linha do título.
         *
         * Era «A barbearia X» — e o X é o buraco onde entra o nome. Um nome
         * como «Barbearia Clássica dos Irmãos Fernandes» não cabe no lugar
         * de uma letra, e empurrar a linha para a direita punha-a por cima
         * dos raios desenhados no canto.
         *
         * Por isso a linha passa a ser o NOME, e mais nada. Lê-se melhor —
         * o nome da casa é a notícia — funciona com qualquer comprimento, e
         * as duas linhas seguintes («fechou uma parceria / com a Convecta.»)
         * continuam a fazer a frase. A letra encolhe até caber na largura do
         * risco amarelo, que fica onde sempre esteve.
         */
        { tipo: 'titulo', limpar: 'escuro', x: 0.140, y: 0.1880, X: 0.7950, Y: 0.2680,
          peso: 900, tracking: -0.035, alinhar: 'centro', tamanho: 0.068, minimo: 0.030 },
      ],
    },
    {
      ficheiro: '2.jpg', larg: 1092, alt: 1440, cabecalho: true,
      zonas: [
        { tipo: 'logo',  limpar: 'tudo',   x: 0.6452, y: 0.0688, X: 0.7487, Y: 0.1340, recuo: 0.14 },
        { tipo: 'nome',  limpar: 'escuro', x: 0.510,  y: 0.1390, X: 0.835,  Y: 0.1560,
          peso: 600, tracking: 0.16, maiusculas: true, alinhar: 'centro', tamanho: 0.0155 },
        // ── O cartão de Instagram ──
        // Entre a seta de voltar (acaba em .222) e a campainha (começa em .662).
        // A primeira medida ia até .712 e comia a campainha — os ícones do
        // cartão são arte, não marcador.
        { tipo: 'slug',  limpar: 'escuro', x: 0.240,  y: 0.5060, X: 0.594,  Y: 0.5520,
          peso: 700, alinhar: 'centro', tamanho: 0.0245 },
        { tipo: 'logo',  limpar: 'tudo',   x: 0.208,  y: 0.5940, X: 0.325,  Y: 0.6680, recuo: 0.10, redondo: true },
        { tipo: 'nome',  limpar: 'escuro', x: 0.365,  y: 0.5780, X: 0.775,  Y: 0.6060,
          peso: 600, alinhar: 'esquerda', tamanho: 0.0175 },
        /*
         * O link, que no Instagram é AZUL.
         *
         * Aqui a guarda da croma tem de ser levantada: ela existe para não
         * apagar arte colorida, e neste caso a «arte colorida» é justamente
         * o marcador que se quer substituir. A zona começa DEPOIS do ícone
         * da corrente (que também é azul, e é arte) e pára antes da seta.
         */
        { tipo: 'endereco', limpar: 'escuro', semGuarda: true, x: 0.230, y: 0.8010, X: 0.650, Y: 0.8430,
          peso: 500, alinhar: 'esquerda', tamanho: 0.0215, cor: '#1B74E4' },
      ],
    },
    {
      ficheiro: '3.jpg', larg: 1092, alt: 1440, cabecalho: true,
      zonas: [
        { tipo: 'logo',  limpar: 'tudo',   x: 0.6407, y: 0.0646, X: 0.7414, Y: 0.1292, recuo: 0.14 },
        { tipo: 'nome',  limpar: 'escuro', x: 0.505,  y: 0.1350, X: 0.830,  Y: 0.1520,
          peso: 600, tracking: 0.16, maiusculas: true, alinhar: 'centro', tamanho: 0.0155 },
        // A barra do browser, dentro do telemóvel: letra branca sobre preto.
        { tipo: 'endereco', limpar: 'claro', x: 0.345, y: 0.5400, X: 0.705, Y: 0.5730,
          peso: 500, alinhar: 'centro', tamanho: 0.0180, cor: '#FFFFFF', fundo: '#000000', cortar: true },
      ],
    },
    {
      ficheiro: '4.jpg', larg: 1122, alt: 1402, cabecalho: false,
      zonas: [
        /*
         * «Depois de teres a app da X» — outra vez o X. Aqui a linha é
         * redesenhada inteira, com a parte fixa em peso normal e o nome em
         * negrito, como estava. Redesenhar a linha toda é o que permite
         * voltar a centrá-la depois de o nome mudar de comprimento.
         */
        { tipo: 'frase', limpar: 'escuro', x: 0.110, y: 0.0530, X: 0.910, Y: 0.1040,
          antes: 'Depois de teres a app da ', alinhar: 'centro', tamanho: 0.0365, minimo: 0.022 },
      ],
    },
    { ficheiro: '5.jpg', larg: 1122, alt: 1402, cabecalho: false, zonas: [] },
  ],
}

// ── Cor ────────────────────────────────────────────────────────────────────

function hexParaHsv(hex) {
  const c = String(hex || '#C9A227').replace('#', '')
  const n = c.length === 3 ? c.split('').map(x => x + x).join('') : c
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d + 6) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return { h, s: mx ? d / mx : 0, v: mx }
}

const suave = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)))

/**
 * Troca o amarelo da marca pela cor dada, em toda a tela.
 * `protegidos` são rectângulos (em fracções) onde não se toca.
 */
export function recolorir(ctx, larg, alt, corHex, protegidos = []) {
  const alvo = hexParaHsv(corHex)
  const img = ctx.getImageData(0, 0, larg, alt)
  const d = img.data

  // Máscara dos sítios a proteger, para não perguntar por cada pixel.
  const prot = protegidos.map(p => ({
    x0: Math.floor(p.x * larg), x1: Math.ceil(p.X * larg),
    y0: Math.floor(p.y * alt),  y1: Math.ceil(p.Y * alt),
  }))

  for (let i = 0, px = 0; i < d.length; i += 4, px++) {
    const x = px % larg, y = (px / larg) | 0
    let saltar = false
    for (const p of prot) if (x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1) { saltar = true; break }
    if (saltar) continue

    const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn
    if (dl < 0.02) continue                 // cinzentos e brancos: não têm cor para trocar
    const s = mx ? dl / mx : 0, v = mx
    let h
    if (mx === r) h = ((g - b) / dl + 6) % 6
    else if (mx === g) h = (b - r) / dl + 2
    else h = (r - g) / dl + 4
    h /= 6

    let dh = Math.abs(h - AMARELO); if (dh > 0.5) dh = 1 - dh

    // 1) O amarelo forte: pastilhas, riscos, sublinhados, botões.
    const forte = Math.max(0, 1 - (dh / 0.045) ** 2) * suave(s, 0.42, 0.64) * suave(v, 0.45, 0.60)
    // 2) O amarelo pálido: o círculo esbatido atrás do telemóvel. Quase não
    //    se distingue do branco, mas ficava amarelo num cartaz verde — e uma
    //    mancha esquecida estraga o conjunto todo. A banda é mais apertada e
    //    o brilho tem de ser alto, senão apanhava a pele das mãos.
    const palido = Math.max(0, 1 - (dh / 0.030) ** 2)
      * suave(s, 0.10, 0.16) * (1 - suave(s, 0.40, 0.46)) * suave(v, 0.88, 0.93)

    const w = Math.min(1, Math.max(forte, palido))
    if (w <= 0.002) continue

    // Só matiz e saturação mudam. O brilho (v) fica — ver o comentário no topo.
    const ns = Math.min(1, s * (alvo.s / 0.80))
    const k = alvo.h * 6, ii = Math.floor(k) % 6, f = k - Math.floor(k)
    const p = v * (1 - ns), q = v * (1 - ns * f), t = v * (1 - ns * (1 - f))
    const nr = [v, q, p, p, t, v][ii], ng = [t, v, v, q, p, p][ii], nb = [p, p, t, v, v, q][ii]

    d[i]     = (r * (1 - w) + nr * w) * 255
    d[i + 1] = (g * (1 - w) + ng * w) * 255
    d[i + 2] = (b * (1 - w) + nb * w) * 255
  }
  ctx.putImageData(img, 0, 0)
}

// ── Apagar marcadores ──────────────────────────────────────────────────────

/*
 * Apaga o que estava escrito, sem apagar a arte à volta.
 *
 * Um rectângulo cheio de branco por cima seria mais simples — e comia o
 * risco amarelo que passa por baixo do título, e a borda do cartão de
 * Instagram. Em vez disso troca-se só o que É texto: os pixéis escuros (ou
 * claros, em fundo preto), com uma transição suave nas bordas para não
 * deixar um contorno serrilhado onde estavam as letras.
 */
function limparZona(ctx, z, larg, alt, fundoDado) {
  const x0 = Math.floor(z.x * larg), y0 = Math.floor(z.y * alt)
  const w = Math.ceil((z.X - z.x) * larg), h = Math.ceil((z.Y - z.y) * alt)
  if (w <= 0 || h <= 0) return

  /*
   * A cor do fundo.
   *
   * Lê-se no ANEL à volta da zona, não lá dentro. Dentro está o texto que se
   * quer apagar; à volta está o que fica. Procurar «o pixel mais escuro» lá
   * dentro devolvia a tinta das letras — e foi assim que o quadrado do
   * logótipo saiu preto na primeira tentativa.
   */
  let fr = 255, fg = 255, fb = 255
  if (fundoDado) {
    const c = fundoDado.replace('#', '')
    fr = parseInt(c.slice(0, 2), 16); fg = parseInt(c.slice(2, 4), 16); fb = parseInt(c.slice(4, 6), 16)
  } else {
    const m = Math.max(2, Math.round(Math.min(w, h) * 0.12))
    const ax = Math.max(0, x0 - m), ay = Math.max(0, y0 - m)
    const aw = Math.min(larg - ax, w + 2 * m), ah = Math.min(alt - ay, h + 2 * m)
    const anel = ctx.getImageData(ax, ay, aw, ah).data
    const rs = [], gs = [], bs = []
    for (let yy = 0; yy < ah; yy++) {
      for (let xx = 0; xx < aw; xx++) {
        const dentro = (xx >= x0 - ax && xx < x0 - ax + w && yy >= y0 - ay && yy < y0 - ay + h)
        if (dentro) continue
        const k = (yy * aw + xx) * 4
        rs.push(anel[k]); gs.push(anel[k + 1]); bs.push(anel[k + 2])
      }
    }
    if (rs.length) {
      const mediana = a => { a.sort((x, y) => x - y); return a[a.length >> 1] }
      fr = mediana(rs); fg = mediana(gs); fb = mediana(bs)
    }
  }

  if (z.limpar === 'tudo') {
    // Um pouco a mais de cada lado: a caixa do marcador tem cantos
    // arredondados, e um rectângulo exacto deixava quatro farelos nos cantos.
    const e = Math.round(Math.min(w, h) * 0.06)
    ctx.fillStyle = `rgb(${fr},${fg},${fb})`
    ctx.fillRect(x0 - e, y0 - e, w + 2 * e, h + 2 * e)
    return
  }

  const img = ctx.getImageData(x0, y0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    /*
     * Só se apaga TINTA PRETA. Um pixel com cor — o risco amarelo que passa
     * por baixo do título, a seta, o azul do link — fica intacto, mesmo que
     * seja escuro.
     *
     * Sem esta condição havia duas saídas, ambas más: ou o limiar era baixo
     * e o texto antigo ficava a fantasma por trás do novo (as bordas macias
     * das letras e o ruído do JPEG sobrevivem), ou era alto e comia o risco
     * amarelo, que tem menos brilho do que parece.
     *
     * O que distingue «tem cor» é a CROMA — a distância bruta entre o canal
     * mais forte e o mais fraco — e não a saturação. A saturação divide essa
     * distância pelo brilho, e num pixel quase preto o brilho é quase zero:
     * uma tinta de (20,18,28), que é ruído de JPEG num preto, dá saturação
     * 0,36, mais alta do que muitos amarelos. Foi assim que a primeira
     * versão protegeu exactamente a tinta que queria apagar, e o texto
     * antigo ficou salpicado por baixo do novo.
     */
    if (!z.semGuarda && mx - mn > 55) continue
    const l = (r + g + b) / 3
    // O limiar é alto de propósito: o fundo destes cartazes é branco-quente
    // (≈250) e tudo o que está abaixo de 232 é tinta ou a sombra dela. Um
    // limiar mais baixo deixava um halo cinzento com a forma das letras
    // antigas — invisível no ecrã do editor, bem visível no Instagram.
    const a = z.limpar === 'escuro' ? 1 - suave(l, 240, 253) : suave(l, 22, 80)
    if (a <= 0) continue
    d[i]     = r * (1 - a) + fr * a
    d[i + 1] = g * (1 - a) + fg * a
    d[i + 2] = b * (1 - a) + fb * a
  }
  ctx.putImageData(img, x0, y0)
}

// ── Escrever ───────────────────────────────────────────────────────────────

const fonte = (peso, tam) => `${peso} ${tam}px "${FONTE_TITULO}", system-ui, sans-serif`

/** Escreve uma linha, encolhendo a letra até caber na caixa. */
function linha(ctx, texto, z, larg, alt, opts = {}) {
  const cx0 = z.x * larg, cx1 = z.X * larg
  const cy0 = z.y * alt,  cy1 = z.Y * alt
  const util = cx1 - cx0
  const peso = opts.peso ?? z.peso ?? 700
  const tracking = opts.tracking ?? z.tracking ?? 0
  let t = (opts.tamanho ?? z.tamanho ?? 0.03) * alt
  const min = (opts.minimo ?? z.minimo ?? 0.014) * alt

  ctx.letterSpacing = `${tracking * t}px`
  ctx.font = fonte(peso, t)
  while (ctx.measureText(texto).width > util && t > min) {
    t -= 1
    ctx.letterSpacing = `${tracking * t}px`
    ctx.font = fonte(peso, t)
  }
  // Se nem no tamanho mínimo couber, corta com reticências: um nome cortado
  // lê-se, um nome que sai do cartaz não.
  let saida = texto
  if (ctx.measureText(saida).width > util && z.cortar !== false) {
    while (saida.length > 3 && ctx.measureText(saida + '…').width > util) saida = saida.slice(0, -1)
    saida += '…'
  }

  ctx.fillStyle = opts.cor ?? z.cor ?? '#111111'
  ctx.textBaseline = 'middle'
  const meio = (cy0 + cy1) / 2
  const al = opts.alinhar ?? z.alinhar ?? 'esquerda'
  ctx.textAlign = al === 'centro' ? 'center' : al === 'direita' ? 'right' : 'left'
  const x = al === 'centro' ? (cx0 + cx1) / 2 : al === 'direita' ? cx1 : cx0
  ctx.fillText(saida, x, meio)
  ctx.letterSpacing = '0px'
  return t
}

/*
 * Uma frase com duas metades — parte fixa em peso normal, nome em negrito —
 * centrada como um todo. É a linha «Depois de teres a app da NOME».
 */
function frase(ctx, z, larg, alt, antes, nome) {
  const cx0 = z.x * larg, cx1 = z.X * larg
  const util = cx1 - cx0
  let t = (z.tamanho ?? 0.036) * alt
  const min = (z.minimo ?? 0.022) * alt
  const larguras = () => {
    ctx.font = fonte(400, t); const a = ctx.measureText(antes).width
    ctx.font = fonte(800, t); const b = ctx.measureText(nome).width
    return [a, b, a + b]
  }
  let [wa, wb, tot] = larguras()
  while (tot > util && t > min) { t -= 1; [wa, wb, tot] = larguras() }

  const meio = (z.y * alt + z.Y * alt) / 2
  let x = (cx0 + cx1) / 2 - tot / 2
  ctx.fillStyle = '#111111'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = fonte(400, t); ctx.fillText(antes, x, meio); x += wa
  ctx.font = fonte(800, t); ctx.fillText(nome, x, meio)
}

/** O logótipo, encaixado num quadrado sem se deformar. */
function porLogo(ctx, z, larg, alt, logo, inicial, corMarca) {
  const x0 = z.x * larg, y0 = z.y * alt
  const w = (z.X - z.x) * larg, h = (z.Y - z.y) * alt
  const r = (z.recuo ?? 0.12)
  const ix = x0 + w * r, iy = y0 + h * r, iw = w * (1 - 2 * r), ih = h * (1 - 2 * r)

  if (logo) {
    const k = Math.min(iw / logo.width, ih / logo.height)
    ctx.drawImage(logo, ix + (iw - logo.width * k) / 2, iy + (ih - logo.height * k) / 2,
      logo.width * k, logo.height * k)
    return
  }
  // Sem logótipo: a inicial, na cor da barbearia. Melhor do que um `?`.
  ctx.fillStyle = corMarca
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = fonte(900, Math.min(iw, ih) * 0.78)
  ctx.fillText(String(inicial || 'B').toUpperCase(), ix + iw / 2, iy + ih / 2 + ih * 0.02)
}

// ── O desenho de um cartaz ─────────────────────────────────────────────────

/**
 * ecra      — um item de MODELO.ecras
 * imagem    — o <img> do ficheiro já carregado
 * barbearia — { nome, endereco, slug, logo, cor }
 */
export function desenhar(canvas, ecra, imagem, barbearia) {
  const L = ecra.larg, A = ecra.alt
  canvas.width = L; canvas.height = A
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imagem, 0, 0, L, A)

  recolorir(ctx, L, A, barbearia.cor, ecra.cabecalho ? [PONTO_CONVECTA] : [])

  for (const z of ecra.zonas) {
    limparZona(ctx, z, L, A, z.fundo)
    if (z.tipo === 'logo') {
      porLogo(ctx, z, L, A, barbearia.logo, barbearia.nome[0], barbearia.cor)
    } else if (z.tipo === 'nome') {
      linha(ctx, z.maiusculas ? barbearia.nome.toUpperCase() : barbearia.nome, z, L, A)
    } else if (z.tipo === 'titulo') {
      linha(ctx, barbearia.nome, z, L, A)
    } else if (z.tipo === 'slug') {
      linha(ctx, barbearia.slug, z, L, A)
    } else if (z.tipo === 'endereco') {
      linha(ctx, barbearia.endereco, z, L, A)
    } else if (z.tipo === 'frase') {
      frase(ctx, z, L, A, z.antes, barbearia.nome)
    }
  }
  return canvas
}

// ── Carregar coisas ────────────────────────────────────────────────────────

export function carregarImagem(url, comCors = false) {
  return new Promise(resolve => {
    if (!url) return resolve(null)
    const img = new Image()
    // O logótipo vem do Storage do Supabase, que é outro domínio. Sem isto o
    // canvas fica «contaminado» e o toBlob rebenta — o botão de descarregar
    // falhava sempre, com uma mensagem que não ajuda ninguém.
    if (comCors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/*
 * Garante que a Inter está mesmo carregada antes de escrever.
 *
 * O canvas não espera por fontes: se pedires Inter antes de ela ter chegado,
 * desenha em Arial e não avisa. Como o desenho acontece milissegundos depois
 * de abrir a página, isso acontecia quase sempre — e o cartaz saía com uma
 * letra que não é a dele.
 */
export async function garantirFonte() {
  if (typeof document === 'undefined' || !document.fonts) return
  const id = 'carrossel-inter'
  if (!document.getElementById(id)) {
    const l = document.createElement('link')
    l.id = id; l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
    document.head.appendChild(l)
  }
  try {
    await Promise.all(['400', '500', '600', '700', '800', '900']
      .map(p => document.fonts.load(`${p} 80px "Inter"`).catch(() => {})))
  } catch { /* segue com a letra de recurso */ }
}

export const paraBlob = (canvas) => new Promise(r => canvas.toBlob(r, 'image/png'))

export function nomeDoFicheiro(barbearia, i) {
  const base = String(barbearia.nome || 'barbearia').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${base}-${String(i + 1).padStart(2, '0')}.png`
}

export function legenda(b) {
  return [
    'Já podes marcar o teu corte online. 💈',
    '',
    `A ${b.nome} fechou uma parceria com a Convecta e, a partir de hoje, as marcações fazem-se pelo nosso site — a qualquer hora, sem ligar a ninguém.`,
    '',
    'Escolhes o serviço, o barbeiro e a hora. Recebes a confirmação na hora e um lembrete antes do corte.',
    '',
    `👉 ${b.endereco}`,
    '',
    '#barbearia #barbershop #marcacoesonline',
  ].join('\n')
}
