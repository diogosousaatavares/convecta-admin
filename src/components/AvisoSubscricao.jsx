import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, AlertTriangle, CalendarDays } from 'lucide-react';
import dataService from '@/lib/dataService';

/*
 * A faixa da subscricao.
 *
 * Vive no AdminLayout, por isso corre em TODAS as paginas do painel — a
 * mesma decisao que se tomou no AvisoPush, e pela mesma razao: um barbeiro
 * que nunca abra a pagina certa nunca sabe de nada.
 *
 * Porque e que isto existe, e nao chega o erro quando ele tenta marcar:
 *
 * Um barbeiro novo entra no painel e passa vinte minutos a escrever os
 * servicos dele, os horarios, as cores. Isso e de proposito — e o trabalho
 * que ele ja teve que faz o cartao sair da carteira. Mas ao fim desses vinte
 * minutos ele tenta marcar e leva com uma parede que nunca ninguem lhe
 * anunciou. Isso nao e uma venda, e uma emboscada.
 *
 * A faixa diz-lhe desde o primeiro minuto o que falta e porque, sem o
 * impedir de nada. Quando ele chegar a marcacao, ja sabia.
 *
 * Tres estados, tres tons:
 *   sem_cartao  →  convite, dourado. E a venda.
 *   em_atraso   →  aviso calmo. NAO esta bloqueado, e importa dize-lo.
 *   cancelada   →  vermelho, direto. Ja nao entram marcacoes.
 *
 * Quem esta `em_teste` ou `activa` nao ve faixa nenhuma. Um aviso permanente
 * a quem ja pagou e ruido, e ruido ensina-se a ignorar — e no dia em que
 * houver um aviso a serio, ja ninguem o le.
 */

const AVISOS = {
  sem_cartao: {
    cor: 'var(--gold)',
    fundo: 'rgba(201, 162, 39, 0.10)',
    icone: CreditCard,
    titulo: 'Falta registar o cartão para começares a receber marcações',
    texto: 'Podes preparar tudo — serviços, horários, aparência. Só as marcações é que esperam. São 7 dias à experiência e só depois é que pagas.',
    botao: 'Ver planos',
  },
  em_atraso: {
    cor: '#F59E0B',
    fundo: 'rgba(245, 158, 11, 0.10)',
    icone: AlertTriangle,
    titulo: 'O último pagamento não passou',
    texto: 'A barbearia continua a funcionar normalmente. Vamos tentar cobrar outra vez nos próximos dias — se o cartão mudou, actualiza-o.',
    botao: 'Resolver',
  },
  a_terminar: {
    cor: 'var(--text-sec)',
    fundo: 'rgba(255,255,255,0.04)',
    icone: CalendarDays,
    titulo: 'A tua subscrição está a terminar',
    texto: 'Cancelaste e não vais ser cobrado. Até lá está tudo a funcionar — e se mudares de ideias, retomas no mesmo sítio.',
    botao: 'Ver ou retomar',
  },
  cancelada: {
    cor: 'var(--error, #EF4444)',
    fundo: 'rgba(239, 68, 68, 0.10)',
    icone: AlertTriangle,
    titulo: 'A subscrição está cancelada',
    texto: 'A agenda e os teus dados continuam aqui, mas não entram marcações novas. Volta quando quiseres.',
    botao: 'Reactivar',
  },
};

export default function AvisoSubscricao() {
  const [estado, setEstado] = useState(null);
  const [aTerminar, setATerminar] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const s = await dataService.subscricao();
        if (!vivo) return;
        setEstado(s?.estado || null);
        setATerminar(!!s?.cancelaNoFim);
      } catch {
        // Um erro a ler a subscricao NAO pode encher o painel de vermelho: na
        // duvida nao se diz nada. A trava a serio esta na base de dados.
      }
    })();
    return () => { vivo = false; };
  }, []);

  // Quem cancelou mas ainda usa nao e nenhum dos tres estados: e um quarto
  // caso, e o unico em que a faixa nao esta a pedir nada — esta a lembrar.
  const aviso = aTerminar && estado !== 'cancelada' ? AVISOS.a_terminar : AVISOS[estado];
  if (!aviso) return null;

  const Icone = aviso.icone;

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      background: aviso.fundo, border: `1px solid ${aviso.cor}`,
      borderRadius: 10, padding: '12px 14px', margin: '0 0 16px',
    }}>
      <Icone size={20} style={{ color: aviso.cor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div className="fw-600" style={{ fontSize: 13 }}>{aviso.titulo}</div>
        <div className="text-sec" style={{ fontSize: 12, marginTop: 2, lineHeight: 1.45 }}>{aviso.texto}</div>
      </div>
      <Link
        to="/admin/subscricao"
        className="fw-600"
        style={{
          flexShrink: 0, textDecoration: 'none', fontSize: 13,
          padding: '8px 14px', borderRadius: 8,
          background: aviso.cor, color: '#111',
        }}
      >
        {aviso.botao}
      </Link>
    </div>
  );
}
