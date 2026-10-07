import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPage from '@/components/admin/AdminPage';
import PedidosOrcamento from '@/components/admin/PedidosOrcamento';
import { Card, Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { listarPedidos } from '@/lib/orcamentosService';
import { MessageSquare } from 'lucide-react';

/*
 * ORÇAMENTOS.
 *
 * Os serviços sem preço fixo — umas rastas, uma limpeza de pele — não se
 * marcam pela agenda: o cliente faz um pedido e escreve o que quer. Isto é
 * a casa desses pedidos.
 *
 * Tem porta própria no menu, e é para aqui que abre a notificação que lhe
 * toca no telemóvel. Estava só como uma faixa no topo da agenda: dava para
 * ver os que chegaram hoje, mas não havia onde voltar para ver o que ficou
 * combinado com quem — e um pedido que já tenha sido respondido desaparecia
 * sem deixar rasto.
 *
 * Em cima, os que estão à espera, com o gesto todo: ligar, combinar, marcar.
 * Em baixo, o que já foi respondido, com o tempo e o preço combinados — é a
 * memória de quanto se cobrou da última vez a cada pessoa.
 */

const ESTADOS = {
  marcado:   { etiqueta: 'Combinado', cor: 'success' },
  recusado:  { etiqueta: 'Recusado',  cor: 'danger' },
  cancelado: { etiqueta: 'Desistiu',  cor: 'default' },
};

const quando = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
    + ' às ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

const tempo = (m) => !m ? ''
  : m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`;

export default function Orcamentos() {
  const data = useStore();
  const navigate = useNavigate();
  const bid = data.business?.id;
  const [pedidos, setPedidos] = useState(null);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    let vivo = true;
    if (!bid) return;
    listarPedidos(bid)
      .then(r => { if (vivo) setPedidos(r); })
      .catch(() => { if (vivo) setPedidos([]); });
    return () => { vivo = false; };
  }, [bid, recarregar]);

  const respondidos = (pedidos || []).filter(p => p.estado !== 'pendente');
  const pendentes = (pedidos || []).filter(p => p.estado === 'pendente');

  return (
    <AdminPage title="Orçamentos">
      {/* O bloco de cima é o mesmo que estava na agenda: ligar, combinar,
          marcar. Não se reescreve — é o mesmo gesto, e dois sítios a fazer
          a mesma coisa de maneiras diferentes acabam sempre em um deles
          ficar para trás. */}
      <PedidosOrcamento
        businessId={bid}
        barbearia={data.business?.name}
        onMarcar={() => { setRecarregar(n => n + 1); navigate('/admin/agenda'); }}
      />

      {pedidos && pendentes.length === 0 && respondidos.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="Ainda não há pedidos"
          description={'Os serviços marcados como «sob orçamento» aparecem na app do cliente com um botão «Pedir orçamento». Quando alguém pedir, o pedido chega aqui e tocamos-te no telemóvel.'}
        />
      )}

      {respondidos.length > 0 && (
        <Card className="card-pad" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>Já respondidos</h3>
          <p className="text-sec text-sm" style={{ marginBottom: 14 }}>
            O que ficou combinado com cada um. Serve para saber quanto se cobrou da última vez.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {respondidos.map(p => {
              const e = ESTADOS[p.estado] || { etiqueta: p.estado, cor: 'default' };
              return (
                <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 15 }}>{p.cliente}</b>
                    <span className="text-sec text-sm">{p.servico}</span>
                    <span style={{ marginLeft: 'auto' }}><Badge variant={e.cor}>{e.etiqueta}</Badge></span>
                  </div>
                  <div className="text-sec text-sm" style={{ marginTop: 5 }}>
                    Pedido a {quando(p.criadoEm)}
                    {p.minutos ? ` · ${tempo(p.minutos)}` : ''}
                    {p.preco != null ? ` · ${String(Number(p.preco).toFixed(2)).replace('.', ',')} €` : ''}
                  </div>
                  {p.descricao && (
                    <p className="text-sec text-sm" style={{ marginTop: 5 }}>«{p.descricao}»</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </AdminPage>
  );
}
