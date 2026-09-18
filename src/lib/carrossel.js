/*
 * O carrossel para o Instagram, desenhado no browser.
 *
 * ── Porque é que não há aqui nenhum serviço ──────────────────────────────
 *
 * Gerar imagens costuma significar um servidor com fontes instaladas, ou uma
 * API paga por imagem. Nada disso é preciso: o <canvas> já sabe desenhar
 * texto, formas e imagens, e o browser já tem as fontes carregadas para
 * mostrar a app. Quem desenha é o telemóvel do barbeiro, e não nos custa
 * nada — nem a nós nem a ele.
 *
 * ── As cores e o logótipo não são escolhidos aqui ────────────────────────
 *
 * Saem do tema que o barbeiro já montou em «O Meu Site». Se ele mudou o
 * dourado para verde, o carrossel sai verde. Um gerador que impusesse a sua
 * própria paleta produziria posts que não se parecem com a casa de ninguém —
 * e um post que não parece dele, ele não publica.
 *
 * ── O que o post diz ─────────────────────────────────────────────────────
 *
 * A primeira imagem é uma notícia: a barbearia fechou uma parceria. Isso é
 * uma coisa que um cliente lê. «Instalámos um software de marcações» não é.
 * As três do meio explicam como se marca, sem adjectivos. A última tem o
 * endereço, grande, porque é a única que ele vai precisar de ler duas vezes.
 */

// Os dois formatos que interessam: o feed (4:5, o mais alto que o Instagram
// deixa) e as stories. Quadrado não entra — desperdiça um terço do ecrã.
export const FORMATOS = {
  feed:   { id: 'feed',   nome: 'Publicação', larg: 1080, alt: 1350, descricao: 'Carrossel de 5 imagens no feed' },
  story:  { id: 'story',  nome: 'Story',      larg: 1080, alt: 1920, descricao: 'Uma story por imagem' },
}

/*
 * Os cinco ecrãs.
 *
 * `olho` é a linha pequena por cima, `titulo` o que se lê de longe, `texto` a
 * explicação. Tudo o que muda com a barbearia entra como {nome} e {endereco}
 * — assim o texto é editável num sítio só e nunca há um nome escrito à mão
 * a meio de uma função de desenho.
 */
export const GUIOES = {
  parceria: {
    id: 'parceria',
    nome: 'Parceria com a Convecta',
    resumo: 'Anuncia a novidade e explica como se marca. É o post para publicar no dia em que abres as marcações.',
    ecras: [
      {
        tipo: 'capa',
        olho: 'NOVIDADE',
        titulo: 'A {nome} fechou uma parceria com a Convecta.',
        texto: 'A partir de agora as marcações fazem-se online.',
        rodape: 'Arrasta para saber como  →',
      },
      {
        olho: '01',
        titulo: 'Marcas a qualquer hora.',
        texto: 'Não é preciso ligar nem esperar por resposta. O site está aberto às duas da manhã, ao domingo, e no meio do teu turno.',
      },
      {
        olho: '02',
        titulo: 'Escolhes o serviço, o barbeiro e a hora.',
        texto: 'Só aparecem as horas que estão mesmo livres. O que vês é o que há.',
      },
      {
        olho: '03',
        titulo: 'Recebes a confirmação na hora.',
        texto: 'E um lembrete antes do corte. Se não puderes vir, desmarcas sozinho — e a hora fica livre para outra pessoa.',
      },
      {
        tipo: 'endereco',
        olho: 'MARCA AQUI',
        titulo: '{endereco}',
        texto: 'Abre no telemóvel e guarda no ecrã principal. Fica com um ícone, como uma app.',
      },
    ],
  },
}

// ── Utilitários de desenho ─────────────────────────────────────────────────

/** Quebra o texto em linhas que cabem na largura. */
function quebrar(ctx, texto, largura) {
  const linhas = []
  for (const paragrafo of String(texto).split('\n')) {
    let linha = ''
    for (const palavra of paragrafo.split(' ')) {
      const tentativa = linha ? `${linha} ${palavra}` : palavra
      if (ctx.measureText(tentativa).width > largura && linha) { linhas.push(linha); linha = palavra }
      else linha = tentativa
    }
    linhas.push(linha)
  }
  return linhas
}

/**
 * Mede um bloco de texto, encolhendo a letra até caber na altura dada.
 *
 * É isto que faz o gerador aguentar uma barbearia chamada «Zé» e outra
 * chamada «Barbearia Clássica dos Irmãos Fernandes & Filhos». Sem isto, a
 * segunda saía cortada — e ninguém repara nisso antes de publicar.
 *
 * Mede-se antes de pintar porque o corpo do ecrã é ancorado em BAIXO: só se
 * sabe onde começar a escrever depois de se saber quanto é que aquilo ocupa.
 * Um bloco ancorado em cima deixa meio cartaz vazio quando o texto é curto.
 */
function medir(ctx, texto, { largura, alturaMax, tamanho, minimo = 28, fonte, entrelinha = 1.22 }) {
  let t = tamanho, linhas
  for (;;) {
    ctx.font = fonte(t)
    linhas = quebrar(ctx, texto, largura)
    if (linhas.length * t * entrelinha <= alturaMax || t <= minimo) break
    t -= 2
  }
  return { linhas, t, fonte, entrelinha, altura: linhas.length * t * entrelinha }
}

function pintar(ctx, m, x, y, cor, alinhar = 'left') {
  ctx.font = m.fonte(m.t)
  ctx.fillStyle = cor
  ctx.textAlign = alinhar
  ctx.textBaseline = 'top'
  m.linhas.forEach((l, i) => ctx.fillText(l, x, y + i * m.t * m.entrelinha))
  return y + m.altura
}

/*
 * Uma linha só, encolhida até caber — e cortada se nem assim couber.
 *
 * O endereço de uma barbearia não tem espaços: «irmaos-fernandes.marcacoes.app»
 * é uma palavra só, e nenhuma quebra de linha a parte. O `medir` acima não
 * resolve isto (encolher por si não chega quando a palavra é enorme), por
 * isso aqui parte-se pelos pontos e pelos hífens, que é onde um endereço
 * pode partir sem deixar de se ler.
 */
function umaLinha(ctx, texto, { largura, tamanho, minimo, fonte }) {
  let t = tamanho
  while (t > minimo) {
    ctx.font = fonte(t)
    if (ctx.measureText(texto).width <= largura) return { t, texto }
    t -= 2
  }
  ctx.font = fonte(t)
  if (ctx.measureText(texto).width <= largura) return { t, texto }
  let corte = texto
  while (corte.length > 4 && ctx.measureText(corte + '…').width > largura) corte = corte.slice(0, -1)
  return { t, texto: corte + '…' }
}

/** O endereço, partido pelos pontos quando é comprido demais para uma linha. */
function partirEndereco(ctx, texto, largura, fonte, t) {
  ctx.font = fonte(t)
  if (ctx.measureText(texto).width <= largura) return [texto]
  const pedacos = texto.split(/(?<=[.\-])/)
  const linhas = []
  let actual = ''
  for (const p of pedacos) {
    const tentativa = actual + p
    if (ctx.measureText(tentativa).width > largura && actual) { linhas.push(actual); actual = p }
    else actual = tentativa
  }
  if (actual) linhas.push(actual)
  return linhas
}

/** Um rectângulo de cantos redondos. */
function caixa(ctx, x, y, l, a, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + l, y, x + l, y + a, r)
  ctx.arcTo(x + l, y + a, x, y + a, r)
  ctx.arcTo(x, y + a, x, y, r)
  ctx.arcTo(x, y, x + l, y, r)
  ctx.closePath()
}

/** A cor com transparência, a partir de um #rrggbb. */
function alfa(hex, a) {
  const h = String(hex || '#000').replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) || 0)
  return `rgba(${r},${g},${b},${a})`
}

/*
 * O logótipo, carregado de forma a poder ser desenhado.
 *
 * `crossOrigin = 'anonymous'` não é um detalhe: sem ele o canvas fica
 * «contaminado» e o `toBlob` rebenta — o browser recusa-se a deixar
 * descarregar uma imagem que misturou pixéis de outro domínio. Como o
 * logótipo vem do Storage do Supabase, que é outro domínio, sem esta linha
 * o botão de descarregar falhava sempre, e com uma mensagem que não ajuda
 * ninguém a perceber porquê.
 *
 * Se mesmo assim falhar (um CDN sem CORS, por exemplo), devolve null e o
 * desenho usa a inicial do nome. Um post com a inicial é melhor do que um
 * erro.
 */
export function carregarLogo(url) {
  return new Promise(resolve => {
    if (!url) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/*
 * Garante que as fontes do tema estão mesmo carregadas antes de desenhar.
 *
 * O canvas não espera por fontes: se pedires «Playfair Display» antes de ela
 * ter chegado, ele desenha em Times e não avisa. Como o desenho acontece
 * milissegundos depois de abrir a página, isso acontecia quase sempre.
 */
export async function garantirFontes(familias = []) {
  if (typeof document === 'undefined' || !document.fonts) return
  const nomes = [...new Set(familias.filter(Boolean))]
  if (!nomes.length) return

  const id = 'carrossel-fontes'
  if (!document.getElementById(id)) {
    const l = document.createElement('link')
    l.id = id
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?' +
      nomes.map(n => `family=${encodeURIComponent(n).replace(/%20/g, '+')}:wght@400;600;700;800`).join('&') +
      '&display=swap'
    document.head.appendChild(l)
  }

  try {
    await Promise.all(nomes.flatMap(n => ['400 80px', '700 80px', '800 80px'].map(p =>
      document.fonts.load(`${p} "${n}"`).catch(() => {}))))
  } catch { /* segue com a fonte de recurso */ }
}

/** A família a pedir ao canvas, com recurso se a do tema não chegou. */
const familia = (nome, serif) =>
  `"${nome}", ${serif ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif'}`

// ── O desenho ──────────────────────────────────────────────────────────────

/**
 * Desenha um ecrã do carrossel num canvas.
 *
 * ecra    — um item de GUIOES[x].ecras
 * barbearia — { nome, endereco, logo (HTMLImageElement|null), cores, fontes }
 */
export function desenhar(canvas, ecra, barbearia, formato = FORMATOS.feed) {
  const { larg: L, alt: A } = formato
  canvas.width = L
  canvas.height = A
  const ctx = canvas.getContext('2d')

  const c = barbearia.cores
  const fTit = t => `800 ${t}px ${familia(barbearia.fontes.titulo, true)}`
  const fTxt = t => `400 ${t}px ${familia(barbearia.fontes.corpo, false)}`
  const fFor = t => `700 ${t}px ${familia(barbearia.fontes.corpo, false)}`

  const M = Math.round(L * 0.095)          // margem
  const util = L - M * 2

  // Fundo, e um halo da cor da marca no canto de cima. Um fundo chapado de
  // uma cor só lê-se como «feito num template»; um degradé muito leve não.
  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, L, A)
  const halo = ctx.createRadialGradient(L * 0.82, A * 0.1, 0, L * 0.82, A * 0.1, L * 0.95)
  halo.addColorStop(0, alfa(c.gold, 0.16))
  halo.addColorStop(1, alfa(c.gold, 0))
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, L, A)

  // ── Cabeçalho: logótipo + nome, igual em todos os ecrãs ──
  const topo = Math.round(A * 0.075)
  const dLogo = Math.round(L * 0.105)
  if (barbearia.logo) {
    // O logótipo entra dentro de um quadrado, sem deformar: um logo esticado
    // é a primeira coisa que um dono de barbearia nota.
    const r = Math.min(dLogo / barbearia.logo.width, dLogo / barbearia.logo.height)
    const w = barbearia.logo.width * r, h = barbearia.logo.height * r
    ctx.drawImage(barbearia.logo, M + (dLogo - w) / 2, topo + (dLogo - h) / 2, w, h)
  } else {
    ctx.fillStyle = alfa(c.gold, 0.18)
    caixa(ctx, M, topo, dLogo, dLogo, dLogo * 0.26)
    ctx.fill()
    ctx.fillStyle = c.gold
    ctx.font = `800 ${Math.round(dLogo * 0.5)}px ${familia(barbearia.fontes.titulo, true)}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((barbearia.nome[0] || 'B').toUpperCase(), M + dLogo / 2, topo + dLogo / 2 + 2)
  }
  /*
   * O nome, encolhido até caber ao lado do logótipo.
   *
   * «Barbearia Clássica dos Irmãos Fernandes» saía do cartaz pela direita —
   * e sai sempre, porque nomes de barbearia são longos e o cabeçalho tem a
   * largura que tem. Encolhe-se; e se nem no tamanho mínimo couber, corta-se
   * com reticências, que é honesto e legível.
   */
  const xNome = M + dLogo + M * 0.42
  const nome = umaLinha(ctx, barbearia.nome.toUpperCase(), {
    largura: L - M - xNome,
    tamanho: Math.round(L * 0.032),
    minimo: Math.round(L * 0.021),
    fonte: fFor,
  })
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = c.text
  ctx.font = fFor(nome.t)
  ctx.letterSpacing = '1.5px'
  ctx.fillText(nome.texto, xNome, topo + dLogo / 2)
  ctx.letterSpacing = '0px'

  // ── O corpo ──
  const texto = (s) => String(s || '')
    .replace(/\{nome\}/g, barbearia.nome)
    .replace(/\{endereco\}/g, barbearia.endereco)

  const ehCapa = ecra.tipo === 'capa'
  const ehEndereco = ecra.tipo === 'endereco'

  /*
   * O corpo é ancorado em BAIXO, não em cima.
   *
   * Com o texto preso ao topo, um ecrã de duas linhas deixava metade do
   * cartaz vazio e o outro, de cinco linhas, ficava apertado — os cinco não
   * pareciam o mesmo post. Medindo primeiro e pousando o conjunto sempre à
   * mesma distância do fundo, os cinco alinham-se pela mesma linha e o
   * carrossel lê-se como uma coisa só.
   */
  const alturaOlho = Math.round(L * 0.075)
  const folga = Math.round(L * 0.045)

  const mTitulo = ehEndereco
    ? null
    : medir(ctx, texto(ecra.titulo), {
        largura: util,
        alturaMax: A * (ehCapa ? 0.34 : 0.30),
        tamanho: Math.round(L * (ehCapa ? 0.088 : 0.080)),
        minimo: Math.round(L * 0.042),
        fonte: fTit, entrelinha: 1.12,
      })

  // O endereço é uma palavra só: encolhe-se e, se preciso, parte-se pelos pontos.
  let linhasEndereco = null, tEndereco = 0
  if (ehEndereco) {
    tEndereco = umaLinha(ctx, barbearia.endereco, {
      largura: util, tamanho: Math.round(L * 0.082), minimo: Math.round(L * 0.044), fonte: fTit,
    }).t
    linhasEndereco = partirEndereco(ctx, barbearia.endereco, util, fTit, tEndereco)
  }

  const alturaTitulo = ehEndereco ? linhasEndereco.length * tEndereco * 1.12 : mTitulo.altura

  const mTexto = ecra.texto ? medir(ctx, texto(ecra.texto), {
    largura: util, alturaMax: A * 0.24,
    tamanho: Math.round(L * 0.040), minimo: Math.round(L * 0.028),
    fonte: fTxt, entrelinha: 1.45,
  }) : null

  const alturaTotal = alturaOlho + alturaTitulo + (mTexto ? folga + mTexto.altura : 0)
  // Pousa o conjunto a 78 % da altura; nunca acima do cabeçalho.
  let y = Math.max(topo + dLogo + L * 0.10, A * 0.78 - alturaTotal)

  // O olho
  ctx.font = fFor(Math.round(L * 0.026))
  ctx.fillStyle = c.gold
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '4px'
  ctx.fillText(texto(ecra.olho), M, y)
  ctx.letterSpacing = '0px'
  y += alturaOlho

  // O título
  if (ehEndereco) {
    ctx.font = fTit(tEndereco)
    ctx.fillStyle = c.text
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    linhasEndereco.forEach((l, k) => ctx.fillText(l, M, y + k * tEndereco * 1.12))
    y += alturaTitulo
  } else {
    y = pintar(ctx, mTitulo, M, y, c.text)
  }

  // O texto
  if (mTexto) {
    y += folga
    pintar(ctx, mTexto, M, y, c.textSec)
  }

  // ── O rodapé ──
  const baixo = A - Math.round(A * 0.075)

  if (ehCapa && ecra.rodape) {
    // A pastilha do «arrasta»: é o que faz a diferença entre uma imagem e um
    // carrossel visto até ao fim.
    ctx.font = fFor(Math.round(L * 0.030))
    const t = texto(ecra.rodape)
    const w = ctx.measureText(t).width + L * 0.09
    const h = Math.round(L * 0.082)
    ctx.fillStyle = c.gold
    caixa(ctx, M, baixo - h, w, h, h / 2)
    ctx.fill()
    ctx.fillStyle = c.bg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t, M + w / 2, baixo - h / 2 + 1)
  } else if (ehEndereco) {
    ctx.font = fFor(Math.round(L * 0.028))
    ctx.fillStyle = alfa(c.text, 0.55)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('marcações online · sem app para instalar', M, baixo)
  } else {
    // O risco com o número do ecrã. Diz onde se está sem ocupar espaço.
    const n = ecra.olho
    ctx.strokeStyle = alfa(c.text, 0.16)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(M, baixo - Math.round(L * 0.03))
    ctx.lineTo(L - M, baixo - Math.round(L * 0.03))
    ctx.stroke()
    ctx.font = fFor(Math.round(L * 0.026))
    ctx.fillStyle = alfa(c.text, 0.45)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(`${n} / 03`, L - M, baixo - Math.round(L * 0.018))
  }

  return canvas
}

/** O canvas em ficheiro. */
export function paraBlob(canvas) {
  return new Promise(r => canvas.toBlob(r, 'image/png'))
}

/** Nome de ficheiro previsível: ordenam-se sozinhos na galeria. */
export function nomeDoFicheiro(barbearia, i, formato) {
  const base = String(barbearia.nome || 'barbearia').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `${base}-${formato.id}-${String(i + 1).padStart(2, '0')}.png`
}

/*
 * A legenda para colar no Instagram.
 *
 * Vai junto de propósito: metade dos posts que nunca são publicados morrem
 * na pergunta «e agora o que é que eu escrevo aqui?».
 */
export function legenda(barbearia) {
  return [
    `Já podes marcar o teu corte online. 💈`,
    ``,
    `A ${barbearia.nome} fechou uma parceria com a Convecta e, a partir de hoje, as marcações fazem-se pelo nosso site — a qualquer hora, sem ligar a ninguém.`,
    ``,
    `Escolhes o serviço, o barbeiro e a hora. Recebes a confirmação na hora e um lembrete antes do corte.`,
    ``,
    `👉 ${barbearia.endereco}`,
    ``,
    `#barbearia #barbershop #marcacoesonline`,
  ].join('\n')
}
