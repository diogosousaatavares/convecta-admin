import dataService from '@/lib/dataService';
import { supabase } from '@/lib/supabase';
import { enviarPush, quandoPorExtenso } from '@/lib/push';

/*
 * A BARBEARIA PROPOE UMA HORA.
 *
 * Duas situacoes, a mesma conversa (ver supabase/PROPOSTAS_2026-10-07.sql):
 *
 *   ORCAMENTO    falaram ao telefone, combinaram o trabalho, e o barbeiro
 *                marca por ele. O cliente tem de aceitar.
 *   REAGENDAR    o barbeiro precisa de mudar uma marcacao. Propoe outra
 *                hora em vez de cancelar — cancelar deixa o cliente sem
 *                nada e sem resposta, e e assim que se perde um cliente
 *                por uma coisa que era so uma troca de horas.
 *
 * A marcacao fica em `pending` com a proposta dentro, e a VAGA FICA TOMADA.
 * E de proposito: foi o barbeiro que escolheu a hora, sabendo o que tem
 * livre. Deixa-la aberta era arriscar perde-la enquanto o cliente decide, e
 * aí ele estava a prometer uma hora que ja nao tinha.
 */

const erro = (e) => new Error(e?.message || 'Não foi possível falar com o servidor.');

const euros = (p) => p == null || p === '' ? '' : `${String(Number(p).toFixed(2)).replace('.', ',')} €`;
const tempo = (m) => !m ? ''
  : m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`;

/*
 * O corpo do aviso ao cliente. Leva sempre o preco e a hora — foi o que
 * ele ficou a espera de saber desde que fez o pedido, e um aviso que diga
 * so «temos novidades» obriga-o a abrir a app para descobrir se e boa.
 */
function corpoDaProposta({ barbearia, servico, data, hora, minutos, preco }) {
  const linhas = [[barbearia, servico].filter(Boolean).join(' · ')];
  linhas.push(quandoPorExtenso(data, hora));
  const extra = [tempo(minutos), euros(preco)].filter(Boolean).join(' · ');
  if (extra) linhas.push(extra);
  return linhas.join('\n');
}

async function avisar({ businessId, customerId, titulo, corpo, tag }) {
  try {
    await enviarPush({
      businessId, para: 'customer', userId: customerId,
      titulo, mensagem: corpo, url: '/marcacoes', tag,
      // Exige accao: enquanto ele nao responder, isto nao esta combinado.
      exigeAccao: true,
    });
  } catch (e) {
    console.warn('o cliente não foi avisado da proposta:', e.message);
  }
}

/*
 * ORCAMENTO → marcacao proposta.
 *
 * Cria a marcacao na agenda com a duracao combinada, grava no pedido o que
 * ficou combinado, e avisa o cliente com o preco e a hora.
 */
export async function proporDoPedido(pedido, { date, startTime, professionalId, minutos, preco, businessId, barbearia }) {
  const m = Math.round(Number(minutos) || 0);
  if (!date || !startTime) throw new Error('Falta o dia e a hora.');
  if (!(m > 0)) throw new Error('Falta dizer quanto tempo vai ocupar.');
  if (!professionalId) throw new Error('Falta dizer quem o vai atender.');

  const fim = (() => {
    const [h, mi] = startTime.split(':').map(Number);
    const t = h * 60 + mi + m;
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  })();

  const appt = await dataService.createAppointment({
    customerId: pedido.customerId,
    professionalId,
    serviceId: pedido.serviceId || null,
    date, startTime, endTime: fim,
    status: 'pending',
    durationSnapshot: m,
    unitPriceSnapshot: preco === '' || preco == null ? null : Number(preco),
    notes: pedido.descricao || '',
    proposta: {
      por: 'barbearia',
      em: new Date().toISOString(),
      origem: 'orcamento',
      pedidoId: pedido.id,
      minutos: m,
      preco: preco === '' || preco == null ? null : Number(preco),
    },
  });

  const { error } = await supabase.from('pedidos_orcamento').update({
    estado: 'proposto',
    minutos: m,
    preco: preco === '' || preco == null ? null : Number(preco),
    appointment_id: appt.id,
  }).eq('id', pedido.id);
  if (error) throw erro(error);

  await avisar({
    businessId, customerId: pedido.customerId,
    titulo: '\u{1F4C5} Temos hora para ti',
    corpo: corpoDaProposta({
      barbearia, servico: pedido.servico, data: date, hora: startTime,
      minutos: m, preco,
    }),
    tag: 'proposta-' + appt.id,
  });

  return appt;
}

/*
 * REAGENDAR → a mesma marcacao, noutra hora, outra vez por confirmar.
 *
 * Volta a `pending` de proposito, mesmo com a confirmacao automatica
 * ligada: quem mudou a hora foi a barbearia, e uma hora que a pessoa nao
 * escolheu nem aceitou nao esta confirmada coisa nenhuma — e ela que tem
 * de dizer se ainda lhe da jeito.
 */
export async function proporNovaHora(appt, { date, startTime, motivo, businessId, barbearia }) {
  if (!date || !startTime) throw new Error('Falta o dia e a hora.');
  if (date === appt.date && startTime === appt.startTime) {
    throw new Error('É a mesma hora que já estava marcada.');
  }

  const dur = Number(appt.durationSnapshot) || 30;
  const [h, mi] = startTime.split(':').map(Number);
  const t = h * 60 + mi + dur;
  const fim = `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

  const antes = { date: appt.date, startTime: appt.startTime };

  const novo = await dataService.updateAppointment(appt.id, {
    date, startTime, endTime: fim,
    status: 'pending',
    rescheduleHistory: [...(appt.rescheduleHistory || []), {
      from: antes, to: { date, startTime, endTime: fim },
      at: new Date().toISOString(), por: 'barbearia', motivo: motivo || null,
    }],
    proposta: {
      por: 'barbearia',
      em: new Date().toISOString(),
      origem: 'reagendamento',
      motivo: String(motivo || '').trim() || null,
      anterior: antes,
      minutos: dur,
      preco: appt.unitPriceSnapshot,
    },
  });

  await avisar({
    businessId, customerId: appt.customerId,
    titulo: '\u{1F504} A tua marcação mudou de hora',
    corpo: corpoDaProposta({
      barbearia, servico: appt.serviceNameSnapshot, data: date, hora: startTime,
      minutos: null, preco: appt.unitPriceSnapshot,
    }) + (String(motivo || '').trim() ? `\n${String(motivo).trim()}` : ''),
    tag: 'proposta-' + appt.id,
  });

  return novo;
}

/* A proposta está no ar e à espera dele? */
export function aEsperaDeResposta(a) {
  return !!(a && a.proposta && a.status === 'pending' && a.proposta.resposta?.aceite !== true);
}

/* Ele respondeu que não dá — e disse o que quer. */
export function recusouComSugestao(a) {
  const r = a && a.proposta && a.proposta.resposta;
  return r && r.aceite === false ? r : null;
}
