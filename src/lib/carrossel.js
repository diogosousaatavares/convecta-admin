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
        // Cabeçalho: o logótipo da barbearia do lado direito do traço, espelho
        // do logótipo da Convecta — mesma distância ao traço, mesmo centro
        // vertical. Sem o nome por baixo (pedido do Diogo, 22/09): o logótipo
        // já diz quem é, e o nome desalinhava o conjunto.
        { tipo: 'vazio', limpar: 'tudo',   x: 0.5348, y: 0.0392, X: 0.8200, Y: 0.1462 },
        { tipo: 'logo',  limpar: 'nada',   x: 0.5749, y: 0.0592, X: 0.8422, Y: 0.1234, recuo: 0, alinhar: 'esquerda' },
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
        // Cabeçalho: o logótipo da barbearia do lado direito do traço, espelho
        // do logótipo da Convecta — mesma distância ao traço, mesmo centro
        // vertical. Sem o nome por baixo (pedido do Diogo, 22/09): o logótipo
        // já diz quem é, e o nome desalinhava o conjunto.
        { tipo: 'vazio', limpar: 'tudo',   x: 0.5540, y: 0.0590, X: 0.8288, Y: 0.1611 },
        { tipo: 'logo',  limpar: 'nada',   x: 0.5897, y: 0.0750, X: 0.8645, Y: 0.1417, recuo: 0, alinhar: 'esquerda' },
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
        // Cabeçalho: o logótipo da barbearia do lado direito do traço, espelho
        // do logótipo da Convecta — mesma distância ao traço, mesmo centro
        // vertical. Sem o nome por baixo (pedido do Diogo, 22/09): o logótipo
        // já diz quem é, e o nome desalinhava o conjunto.
        { tipo: 'vazio', limpar: 'tudo',   x: 0.5495, y: 0.0556, X: 0.8242, Y: 0.1528 },
        { tipo: 'logo',  limpar: 'nada',   x: 0.5852, y: 0.0688, X: 0.8599, Y: 0.1326, recuo: 0, alinhar: 'esquerda' },
        // A barra do browser, dentro do telemóvel: letra branca sobre o cinza
        // quase preto da barra. A faixa é pintada inteira com a cor da barra
        // (#0E0E0E): apagar só a letra clara deixava o halo escuro do JPEG à
        // volta do texto antigo, a fazer de fantasma. Começa a seguir ao
        // cadeado e pára antes do «Instagram».
        { tipo: 'endereco', limpar: 'tudo', x: 0.3680, y: 0.5410, X: 0.7050, Y: 0.5625,
          peso: 500, alinhar: 'esquerda', tamanho: 0.0180, cor: '#FFFFFF', fundo: '#0E0E0E', cortar: true },
        /*
         * O site DELE por trás do menu do Instagram: a capa, a localidade, o
         * nome na letra do tema e o botão na cor dele. O menu fica por cima,
         * intacto (é o `excluir`).
         */
        { tipo: 'site', limpar: 'nada', x: 0.2198, y: 0.5889, X: 0.7775, Y: 1, esbater: 0.0417,
          excluir: { x: 0.369, y: 0.5875, X: 0.7399, Y: 0.8042, raio: 0.0201 },
          etiqueta: { x: 0.2637, y: 0.8514, tamanho: 0.0111 },
          nome: { x: 0.2537, y: 0.9125, X: 0.7436, tamanho: 0.0486, minimo: 0.025 },
          botoes: [{ x: 0.2509, y: 0.9389, X: 0.7399, Y: 0.9868, raio: 0.0128, texto: 'Marcar agora', cheio: true }] },
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
        // «…já podes marcar a tua consulta.» — numa barbearia é uma
        // MARCAÇÃO, não uma consulta (Diogo, 09/10). O risco amarelo fica.
        { tipo: 'texto', texto: 'já podes fazer a tua marcação.', limpar: 'escuro',
          x: 0.090, y: 0.1419, X: 0.910, Y: 0.1912,
          peso: 800, tracking: -0.035, alinhar: 'centro', tamanho: 0.0414, minimo: 0.026 },
        // O ícone no ecrã inicial é o DELE (o mesmo que a app instala), com
        // o nome por baixo — não um «M Marcações» qualquer.
        { tipo: 'icone', limpar: 'tudo', x: 0.3262, y: 0.3024, X: 0.4162, Y: 0.3887,
          icone: { x: 0.3351, y: 0.3074, X: 0.4082, Y: 0.3645, raio: 0.225 },
          rotulo: { y: 0.3787, tamanho: 0.0114, largura: 0.0891 } },
      ],
    },
    {
      ficheiro: '5.jpg', larg: 1122, alt: 1402, cabecalho: false,
      zonas: [
        // «e marca a tua próxima consulta.» — marcação, não consulta.
        { tipo: 'texto', texto: 'e faz a tua próxima marcação.', limpar: 'escuro',
          x: 0.170, y: 0.2625, X: 0.830, Y: 0.2946,
          peso: 400, alinhar: 'centro', tamanho: 0.0264, minimo: 0.020, cor: '#1A1A1A' },
        // O site dele no telemóvel: capa, localidade, nome e os dois botões.
        { tipo: 'site', limpar: 'nada', x: 0.2941, y: 0.3723, X: 0.7094, Y: 0.8595, esbater: 0.0499,
          etiqueta: { x: 0.3164, y: 0.6705, tamanho: 0.0086 },
          nome: { x: 0.3146, y: 0.7168, X: 0.6863, tamanho: 0.0328, minimo: 0.0185 },
          botoes: [
            { x: 0.3137, y: 0.734, X: 0.6845, Y: 0.7732, raio: 0.0089, texto: 'Marcar agora', cheio: true },
            { x: 0.3137, y: 0.7832, X: 0.6845, Y: 0.8224, raio: 0.0089, texto: 'Ver serviços' },
          ] },
      ],
    },
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
  if (w <= 0 || h <= 0 || z.limpar === 'nada') return

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
    const lx = z.alinhar === 'esquerda' ? ix : ix + (iw - logo.width * k) / 2
    ctx.drawImage(logo, lx, iy + (ih - logo.height * k) / 2, logo.width * k, logo.height * k)
    return
  }
  // Sem logótipo: a inicial, na cor da barbearia. Melhor do que um `?`.
  ctx.fillStyle = corMarca
  const esq = z.alinhar === 'esquerda'
  ctx.textAlign = esq ? 'left' : 'center'
  ctx.textBaseline = 'middle'
  ctx.font = fonte(900, Math.min(iw, ih) * 0.78)
  ctx.fillText(String(inicial || 'B').toUpperCase(), esq ? ix : ix + iw / 2, iy + ih / 2 + ih * 0.02)
}

// ── A app e o site dele, dentro dos telemóveis ─────────────────────────────

const LETRA_TITULO_BASE = 'Playfair Display'
const serifa = (peso, tam, familia) =>
  `${peso} ${tam}px "${familia || LETRA_TITULO_BASE}", "${LETRA_TITULO_BASE}", Georgia, serif`

/** Texto escuro ou claro, conforme o que se lê melhor por cima da cor. */
function corSobre(hex) {
  const c = String(hex || '#C9A227').replace('#', '')
  const n = c.length === 3 ? c.split('').map(x => x + x).join('') : c
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? '#111111' : '#FFFFFF'
}

function caixaRedonda(ctx, x, y, w, h, r) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.moveTo(x + k, y)
  ctx.arcTo(x + w, y, x + w, y + h, k)
  ctx.arcTo(x + w, y + h, x, y + h, k)
  ctx.arcTo(x, y + h, x, y, k)
  ctx.arcTo(x, y, x + w, y, k)
  ctx.closePath()
}

/** Uma imagem a encher a caixa toda, cortada ao centro (como `cover`). */
function encher(ctx, img, x, y, w, h) {
  const k = Math.max(w / img.width, h / img.height)
  const iw = img.width * k, ih = img.height * k
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
}

/** Corta com reticências até caber. */
function caber(ctx, texto, largura) {
  let t = String(texto || '')
  if (ctx.measureText(t).width <= largura) return t
  while (t.length > 1 && ctx.measureText(t + '…').width > largura) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

/*
 * O ícone da app no ecrã inicial (cartaz 4).
 *
 * É o mesmo que a app dele instala: o ícone quadrado de «O Meu Site», ou o
 * logótipo sobre o fundo do tema, ou — sem nenhum dos dois — a inicial na
 * cor dele. Por baixo, o nome, cortado como o iPhone corta.
 */
function desenharIcone(ctx, z, L, A, b) {
  const i = z.icone
  const x = i.x * L, y = i.y * A, w = (i.X - i.x) * L, h = (i.Y - i.y) * A
  const r = w * (i.raio ?? 0.225)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = w * 0.08; ctx.shadowOffsetY = w * 0.03
  ctx.beginPath(); caixaRedonda(ctx, x, y, w, h, r)
  ctx.fillStyle = b.icone ? '#000000' : (b.fundo || '#0B0B0B')
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath(); caixaRedonda(ctx, x, y, w, h, r); ctx.clip()
  if (b.icone) {
    encher(ctx, b.icone, x, y, w, h)
  } else if (b.logo) {
    const m = w * 0.16, k = Math.min((w - 2 * m) / b.logo.width, (h - 2 * m) / b.logo.height)
    const lw = b.logo.width * k, lh = b.logo.height * k
    ctx.drawImage(b.logo, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh)
  } else {
    ctx.fillStyle = b.cor
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = serifa(700, h * 0.58, b.fonteTitulo)
    ctx.fillText(String(b.nome || 'B')[0].toUpperCase(), x + w / 2, y + h * 0.53)
  }
  ctx.restore()

  const ro = z.rotulo
  ctx.save()
  ctx.font = fonte(500, ro.tamanho * A)
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 3
  ctx.fillText(caber(ctx, b.nomeCurto || b.nome, ro.largura * L), x + w / 2, ro.y * A)
  ctx.restore()
}

/*
 * O topo do site dele, dentro do telemóvel (cartazes 3 e 5).
 *
 * A fotografia de capa (ou a primeira da galeria) entra no lugar da foto
 * genérica, escurecida em baixo como no site a sério; o cimo esbate-se no
 * que já lá estava, para não haver costura junto à barra de estado. Sem
 * fotografia, fica a foto do cartaz e só a parte de baixo é repintada.
 * Depois: a localidade na cor dele, o nome na letra do tema dele e os
 * botões na cor dele — que é o que o cliente vai ver quando abrir o link.
 */
function desenharSite(ctx, z, L, A, b) {
  const x0 = Math.round(z.x * L), y0 = Math.round(z.y * A)
  const w = Math.round((z.X - z.x) * L), h = Math.round((z.Y - z.y) * A)
  const esb = (z.esbater ?? 0.04) * A

  const off = document.createElement('canvas')
  off.width = w; off.height = h
  const o = off.getContext('2d')
  let inicio = 0                                 // onde a máscara começa a ser opaca
  if (b.capa) {
    encher(o, b.capa, 0, 0, w, h)
    const g = o.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(4,3,2,0.30)')
    g.addColorStop(0.45, 'rgba(4,3,2,0.50)')
    g.addColorStop(0.75, 'rgba(4,3,2,0.86)')
    g.addColorStop(1, 'rgba(4,3,2,0.97)')
    o.fillStyle = g; o.fillRect(0, 0, w, h)
  } else {
    o.fillStyle = 'rgb(4,3,2)'; o.fillRect(0, 0, w, h)
    // Só por baixo do texto, para apagar o «A tua barbearia» do cartaz.
    inicio = Math.max(0, z.etiqueta.y * A - y0 - 0.075 * A)
  }
  // Máscara: transparente em cima, opaca a seguir ao esbatido.
  o.globalCompositeOperation = 'destination-in'
  const m = o.createLinearGradient(0, inicio, 0, inicio + esb)
  m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)')
  o.fillStyle = m; o.fillRect(0, 0, w, h)
  o.globalCompositeOperation = 'source-over'

  ctx.save()
  ctx.beginPath()
  ctx.rect(x0, y0, w, h)
  if (z.excluir) {
    const e = z.excluir
    caixaRedonda(ctx, e.x * L, e.y * A, (e.X - e.x) * L, (e.Y - e.y) * A, e.raio * L)
  }
  ctx.clip('evenodd')
  ctx.drawImage(off, x0, y0)
  ctx.restore()

  // A localidade, por cima do nome.
  const et = z.etiqueta
  ctx.save()
  const te = et.tamanho * A
  ctx.font = fonte(600, te)
  ctx.letterSpacing = `${te * 0.26}px`
  ctx.fillStyle = b.cor
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(caber(ctx, String(b.local || 'Barbearia').toUpperCase(), (z.nome.X - et.x) * L), et.x * L, et.y * A)
  ctx.restore()

  // O nome, na letra de títulos do tema. Encolhe até caber; se nem assim, corta.
  const n = z.nome
  const larg = (n.X - n.x) * L
  let t = n.tamanho * A
  const tmin = (n.minimo ?? n.tamanho * 0.6) * A
  ctx.save()
  ctx.font = serifa(700, t, b.fonteTitulo)
  while (ctx.measureText(b.nome).width > larg && t > tmin) { t -= 1; ctx.font = serifa(700, t, b.fonteTitulo) }
  ctx.fillStyle = '#F4EFE6'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(caber(ctx, b.nome, larg), n.x * L, n.y * A)
  ctx.restore()

  for (const bt of z.botoes || []) desenharBotao(ctx, bt, L, A, b)
}

function desenharBotao(ctx, bt, L, A, b) {
  const x = bt.x * L, y = bt.y * A, w = (bt.X - bt.x) * L, h = (bt.Y - bt.y) * A
  const r = (bt.raio ?? 0.01) * L
  ctx.save()
  ctx.beginPath(); caixaRedonda(ctx, x, y, w, h, r)
  if (bt.cheio) {
    ctx.fillStyle = b.cor; ctx.fill()
  } else {
    ctx.fillStyle = 'rgba(4,3,2,0.55)'; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = Math.max(1.5, h * 0.03); ctx.stroke()
  }
  const cor = bt.cheio ? corSobre(b.cor) : '#FFFFFF'
  const tam = h * 0.30
  ctx.font = fonte(600, tam)
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
  const tw = ctx.measureText(bt.texto).width
  const ic = bt.cheio ? tam * 1.05 : 0, esp = bt.cheio ? tam * 0.55 : 0
  let cx = x + (w - (ic + esp + tw)) / 2
  const cy = y + h / 2
  if (bt.cheio) {
    // O calendário do botão «Marcar agora», como no site.
    ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1.5, tam * 0.11); ctx.lineCap = 'round'
    const s = ic, top = cy - s * 0.45
    ctx.beginPath(); caixaRedonda(ctx, cx, top + s * 0.08, s, s * 0.84, s * 0.16); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, top + s * 0.36); ctx.lineTo(cx + s, top + s * 0.36)
    ctx.moveTo(cx + s * 0.3, top - s * 0.04); ctx.lineTo(cx + s * 0.3, top + s * 0.18)
    ctx.moveTo(cx + s * 0.7, top - s * 0.04); ctx.lineTo(cx + s * 0.7, top + s * 0.18)
    ctx.stroke()
    cx += ic + esp
  }
  ctx.fillStyle = cor
  ctx.fillText(bt.texto, cx, cy + tam * 0.04)
  ctx.restore()
}

// ── O desenho de um cartaz ─────────────────────────────────────────────────

/**
 * ecra      — um item de MODELO.ecras
 * imagem    — o <img> do ficheiro já carregado
 * barbearia — { nome, nomeCurto, endereco, slug, local, logo, icone, capa, cor, fundo, fonteTitulo }
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
    } else if (z.tipo === 'texto') {
      linha(ctx, z.texto, z, L, A)
    } else if (z.tipo === 'icone') {
      desenharIcone(ctx, z, L, A, barbearia)
    } else if (z.tipo === 'site') {
      desenharSite(ctx, z, L, A, barbearia)
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
export async function garantirFonte(titulo) {
  if (typeof document === 'undefined' || !document.fonts) return
  /*
   * Além da Inter, a letra de títulos do tema dele (o nome no site, dentro
   * do telemóvel, sai na mesma letra que o cliente vai ver) e a Playfair,
   * que é a de origem quando o tema não escolheu outra.
   */
  const familias = [['Inter', '400;500;600;700;800;900'], [LETRA_TITULO_BASE, '600;700']]
  if (titulo && titulo !== LETRA_TITULO_BASE && titulo !== 'Inter') familias.push([titulo, '600;700'])
  for (const [nome, pesos] of familias) {
    const id = 'carrossel-' + nome.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (document.getElementById(id)) continue
    const l = document.createElement('link')
    l.id = id; l.rel = 'stylesheet'
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nome).replace(/%20/g, '+')}:wght@${pesos}&display=swap`
    document.head.appendChild(l)
  }
  try {
    await Promise.all([
      ...['400', '500', '600', '700', '800', '900'].map(p => document.fonts.load(`${p} 80px "Inter"`).catch(() => {})),
      ...familias.slice(1).map(([nome]) => document.fonts.load(`700 80px "${nome}"`).catch(() => {})),
    ])
  } catch { /* segue com a letra de recurso */ }
}

/*
 * O ficheiro sai em JPEG, não em PNG.
 *
 * Medido: os cinco cartazes em PNG dão 3,3 MB; em JPEG a 92 dão 700 KB. São
 * 2,6 MB a menos para o telemóvel do barbeiro guardar e enviar — e ele está
 * a fazer isto com dados móveis, entre dois cortes.
 *
 * Não se perde nada: isto são cartazes com fotografias, que é exactamente o
 * que o JPEG faz bem, e o Instagram recomprime tudo para JPEG à chegada. Um
 * PNG sem perdas aqui é trabalho que se paga e que a plataforma deita fora
 * no segundo seguinte.
 */
export const paraBlob = (canvas) => new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92))

export function nomeDoFicheiro(barbearia, i) {
  const base = String(barbearia.nome || 'barbearia').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${base}-${String(i + 1).padStart(2, '0')}.jpg`
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
