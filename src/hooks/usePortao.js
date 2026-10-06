import { useEffect, useState } from 'react';
import dataService from '@/lib/dataService';

/*
 * O PORTÃO DO CARTÃO.
 *
 * Sem cartão registado, o painel não abre — nem a agenda, nem os clientes,
 * nem nada. Só a página da Subscrição. Decisão comercial do Diogo a
 * 06/10/2026: a experiência de 14 dias começa quando o cartão entra, e não
 * quando a conta é criada.
 *
 * Três coisas que este ficheiro faz de propósito, e que são o que separa um
 * portão de uma porta partida:
 *
 * 1. ENQUANTO NÃO SABE, NÃO FECHA. A resposta demora uns centésimos a
 *    chegar; fechar por omissão punha toda a gente, a pagar ou não, a ver o
 *    ecrã da venda a cada abertura do painel.
 *
 * 2. SE NÃO CONSEGUE SABER, DEIXA PASSAR. Internet a cair, Supabase a
 *    responder mal, uma coluna que falta — nenhuma dessas é razão para
 *    trancar um cliente que paga. Um portão que fecha por engano custa mais
 *    do que um que abre por engano.
 *
 * 3. Barbearias isentas e de teste nunca são tocadas: para elas o estado já
 *    vem como 'gratis' do dataService.
 *
 * Só fecha no 'sem_cartao' — nunca registou nenhum. Quem registou e falhou o
 * pagamento tem outro caminho (o aviso e o portal do Stripe); trancar o
 * painel de quem já pagou alguma vez é perder um cliente por um cartão
 * expirado.
 */
export function usePortao() {
  const [estado, setEstado] = useState('a-ver');   // a-ver | aberto | fechado

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const s = await dataService.subscricao();
        if (!vivo) return;
        setEstado(s && s.estado === 'sem_cartao' ? 'fechado' : 'aberto');
      } catch {
        if (vivo) setEstado('aberto');
      }
    })();
    return () => { vivo = false; };
  }, []);

  return estado;
}

/* As páginas que continuam a abrir sem cartão. A da subscrição, porque é
   onde se resolve; a da conta, para ele poder sair; e o arranque, que é o
   guia de primeira vez e não mostra dados nenhuns. */
export const ABERTAS_SEM_CARTAO = ['/admin/subscricao', '/admin/conta', '/admin/arranque'];
export const abertaSemCartao = (caminho) =>
  ABERTAS_SEM_CARTAO.some((c) => String(caminho || '').startsWith(c));
