/*
 * O QUE CADA TIPO DE NEGÓCIO TRAZ DE ORIGEM (09/10/2026).
 *
 * Serviços com durações e preços de exemplo — são para CORRIGIR à porta,
 * não para ficar (ver Arranque.jsx) — e as cores com que o site nasce.
 *
 * A barbearia mantém o que sempre teve: os três serviços da Edge Function
 * create-business e o preto e branco do «O meu site».
 *
 * Este ficheiro existe igual no admin e no super admin.
 */

export const SERVICOS_SUGERIDOS = {
  barbearia: [
    { name: 'Corte de Cabelo', durationMinutes: 30, price: 15 },
    { name: 'Barba', durationMinutes: 20, price: 10 },
    { name: 'Corte + Barba', durationMinutes: 45, price: 22 },
  ],
  cabeleireiro: [
    { name: 'Corte e brushing', durationMinutes: 60, price: 25 },
    { name: 'Brushing', durationMinutes: 30, price: 15 },
    { name: 'Coloração de raiz', durationMinutes: 90, price: 35 },
    { name: 'Madeixas', durationMinutes: 120, price: 55 },
    { name: 'Corte homem', durationMinutes: 30, price: 12 },
  ],
  unhas: [
    { name: 'Manicure', durationMinutes: 30, price: 12 },
    { name: 'Verniz gel', durationMinutes: 45, price: 18 },
    { name: 'Unhas de gel', durationMinutes: 90, price: 35 },
    { name: 'Manutenção de gel', durationMinutes: 75, price: 28 },
    { name: 'Design de sobrancelhas', durationMinutes: 20, price: 8 },
    { name: 'Extensão de pestanas', durationMinutes: 90, price: 45 },
  ],
  estetica: [
    { name: 'Limpeza de pele', durationMinutes: 60, price: 35 },
    { name: 'Tratamento facial', durationMinutes: 60, price: 45 },
    { name: 'Massagem de relaxamento', durationMinutes: 60, price: 40 },
    { name: 'Depilação pernas inteiras', durationMinutes: 45, price: 20 },
    { name: 'Depilação axilas', durationMinutes: 15, price: 7 },
  ],
}

/*
 * As cores de origem. Claras para os salões — o preto e dourado é a cara de
 * uma barbearia, e é a primeira coisa que faria uma esteticista dizer «isto
 * não é para mim». Cada uma muda depois em «O meu site».
 */
export const CORES_SUGERIDAS = {
  cabeleireiro: { bg: '#FAF7F5', surface: '#FFFFFF', elevated: '#F2ECE8', gold: '#A0694B',
    text: '#2A211C', textSec: '#6E625A', border: '#E7DED7' },
  unhas: { bg: '#FDF7F8', surface: '#FFFFFF', elevated: '#F7EBEE', gold: '#B4486D',
    text: '#2B1E23', textSec: '#75636A', border: '#EED9DF' },
  estetica: { bg: '#F7F8F6', surface: '#FFFFFF', elevated: '#ECEFEA', gold: '#5E7D66',
    text: '#1F2621', textSec: '#5E6A61', border: '#DDE3DC' },
}

/** Os serviços de origem de um tipo (barbearia, se não se souber). */
export const servicosDe = tipo => SERVICOS_SUGERIDOS[tipo] || SERVICOS_SUGERIDOS.barbearia

/*
 * Um tema ainda está «de origem» se nunca foi escolhido: sem cores, ou com o
 * preto e branco com que todas as contas nascem. Só nesse caso o tipo de
 * negócio muda as cores — nunca por cima de um design que alguém fez.
 */
export function temaDeOrigem(tema) {
  const c = tema && tema.colors
  if (!c) return true
  return String(c.bg || '').toUpperCase() === '#0A0807' && String(c.gold || '').toUpperCase() === '#FFFFFF'
}

/** O tema a gravar ao escolher um tipo, ou null se não se deve mexer. */
export function temaParaTipo(tipo, temaActual) {
  const cores = CORES_SUGERIDAS[tipo]
  if (!cores || !temaDeOrigem(temaActual)) return null
  return {
    ...(temaActual || {}),
    colors: cores,
    fonts: (temaActual && temaActual.fonts) || { heading: 'Playfair Display', body: 'Inter' },
    background: { ativo: true, tipo: 'linhas', cor: cores.gold, intensidade: 0.35, velocidade: 1 },
  }
}

/** Ainda são os serviços de origem de algum tipo? (ninguém lhes mexeu) */
export function saoServicosDeOrigem(lista) {
  const nomes = (lista || []).map(s => String(s.name || '').trim()).sort().join('|')
  return Object.values(SERVICOS_SUGERIDOS).some(l => l.map(s => s.name).sort().join('|') === nomes)
}
