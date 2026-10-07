import React, { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { listarPedidos, marcarPedido, recusarPedido } from '@/lib/orcamentosService';

/*
 * OS PEDIDOS DE ORÇAMENTO.
 *
 * Um cliente pediu um trabalho que não tem preço nem duração — umas rastas.
 * Aqui estão os pedidos à espera. O gesto é: ligar-lhe, combinar, escrever
 * quanto tempo vai ocupar, e marcar.
 *
 * O botão de ligar está em primeiro porque é a primeira coisa a fazer: SEM
 * falar com ele não há duração nenhuma para escrever. Um formulário que
 * pedisse os minutos antes da chamada estava a pedir um palpite.
 */
export default function PedidosOrcamento({ businessId, barbearia, onMarcar }) {
  const toast = useToast();
  const [pedidos, setPedidos] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [minutos, setMinutos] = useState('');
  const [preco, setPreco] = useState('');
  const [aGravar, setAGravar] = useState(false);

  const carregar = async () => {
    try { setPedidos(await listarPedidos(businessId)); }
    catch { setPedidos([]); }
  };
  useEffect(() => { if (businessId) carregar(); }, [businessId]);

  if (!pedidos || pedidos.length === 0) return null;
  const pendentes = pedidos.filter(p => p.estado === 'pendente');
  if (pendentes.length === 0) return null;

  /*
   * A hora que o cliente pediu. Escreve-se com «pediu» à frente e não como
   * um cabeçalho de marcação, porque não é uma: a vaga continua livre até o
   * barbeiro marcar. Se isto parecesse marcado, ele contava com uma hora que
   * ninguém lhe garantiu.
   */
  const quando = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const dia = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    return `${dia} às ${hora}`;
  };

  const tel = (t) => String(t || '').replace(/\D/g, '');
  const wa = (t) => { const n = tel(t); return n.length === 9 ? '351' + n : n; };

  return (
    <Card className="card-pad" style={{ marginBottom: 16, borderLeft: '4px solid var(--gold)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h3 style={{ fontSize: 18 }}>Pedidos de orçamento</h3>
        <span className="text-sec text-sm">{pendentes.length} à espera</span>
      </div>
      <p className="text-sec text-sm" style={{ marginBottom: 14 }}>
        Liga-lhe, combina o trabalho, e escreve quanto tempo vai ocupar.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {pendentes.map(p => (
          <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
              <b style={{ fontSize: 16 }}>{p.cliente}</b>
              <span className="text-sec text-sm">{p.servico}</span>
            </div>
            {p.quandoPedido && (
              <p style={{ marginTop: 7, fontSize: 15 }}>
                <b>Pediu {quando(p.quandoPedido)}</b>
                {p.profissional ? `, com ${p.profissional}` : ''}
                <span className="text-sec text-sm" style={{ display: 'block', marginTop: 2 }}>
                  A hora está livre — ninguém a ocupou. É o que lhe dá jeito.
                </span>
              </p>
            )}
            {p.descricao && <p style={{ marginTop: 7, fontSize: 15 }}>«{p.descricao}»</p>}
            {p.preferencia && !p.quandoPedido && (
              <p className="text-sec text-sm" style={{ marginTop: 4 }}>Dá-lhe jeito: {p.preferencia}</p>
            )}

            {p.telefone && (
              <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
                <a href={`tel:+${wa(p.telefone)}`} className="btn-sm"
                  style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9,
                    border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)', fontWeight: 700 }}>
                  Ligar
                </a>
                <a href={`https://wa.me/${wa(p.telefone)}`} target="_blank" rel="noreferrer"
                  style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9,
                    border: '1px solid var(--border)', textDecoration: 'none', color: '#1C8A4A', fontWeight: 700 }}>
                  WhatsApp
                </a>
              </div>
            )}

            {aberto === p.id ? (
              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Quanto tempo vai ocupar (min)</label>
                  <input className="input" type="number" min={5} max={600} value={minutos}
                    onChange={e => setMinutos(e.target.value)} placeholder="Ex.: 240" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label className="label">Preço combinado (€) — opcional</label>
                  <input className="input" type="number" min={0} value={preco}
                    onChange={e => setPreco(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  <Button variant="primary" disabled={aGravar || !minutos}
                    onClick={async () => {
                      setAGravar(true);
                      try {
                        await marcarPedido(p.id, {
                          minutos, preco,
                          businessId, customerId: p.customerId,
                          servico: p.servico, barbearia,
                        });
                        toast.success('Combinado — o cliente foi avisado',
                          'Agora marca na agenda com esse tempo. As vagas ficam ocupadas.');
                        setAberto(null); setMinutos(''); setPreco('');
                        await carregar();
                        /* A marcação faz-se na agenda, que é onde se vê o
                           que está livre. Levamos-te lá com tudo em mão. */
                        onMarcar?.({ ...p, minutos: Number(minutos), preco: preco === '' ? null : Number(preco) });
                      } catch (e) { toast.error('Não foi possível guardar', e.message); }
                      finally { setAGravar(false); }
                    }}>
                    Combinado — marcar na agenda
                  </Button>
                  <Button variant="secondary" onClick={() => setAberto(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 9, marginTop: 11, flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => { setAberto(p.id); setMinutos(''); setPreco(''); }}>
                  Já falei — combinar
                </Button>
                <Button variant="ghost" onClick={async () => {
                  if (!confirm(`Recusar o pedido de ${p.cliente}?`)) return;
                  try {
                    await recusarPedido(p.id, '', {
                      businessId, customerId: p.customerId,
                      servico: p.servico, barbearia,
                    });
                    await carregar();
                  }
                  catch (e) { toast.error('Não foi possível', e.message); }
                }}>Não dá</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
