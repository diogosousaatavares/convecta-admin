/*
 * QUEM FAZ O QUÊ (12/10/2026).
 *
 * Num salão a Rita faz coloração e a Ana não. Cada serviço guarda, no
 * metadata, os ids dos profissionais que o fazem (`profissionais`). Lista
 * vazia quer dizer «toda a gente» — é assim que nascem todos os serviços,
 * e é assim que uma barbearia que nunca mexeu nisto continua igual.
 *
 * Este ficheiro existe igual no painel e no site do cliente.
 */

/** Os ids de quem faz o serviço, ou [] se for toda a gente. */
export const quemFaz = servico => (Array.isArray(servico?.profissionais) ? servico.profissionais : [])

/** Este profissional faz este serviço? Sem serviço, ou sem lista, faz. */
export const fazOServico = (servico, professionalId) => {
  const lista = quemFaz(servico)
  return lista.length === 0 || lista.includes(professionalId)
}

/** Os profissionais (de uma lista) que fazem o serviço. */
export const profissionaisDe = (servico, profissionais) =>
  (profissionais || []).filter(p => fazOServico(servico, p.id))
