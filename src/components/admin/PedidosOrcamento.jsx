import React, { useEffect, useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { listarPedidos, recusarPedido } from '@/lib/orcamentosService';
import { proporDoPedido, proporNovaHora, recusouComSugestao } from '@/lib/propostasService';
import { todayStr } from '@/lib/format';

/*
 * OS PEDIDOS DE ORÇAMENTO, E A CONVERSA QUE SE SEGUE.
 *
 * Um cliente pediu um trabalho que não tem preço nem duração — umas rastas.
 * O gesto é: ligar-lhe, combinar, e marcar por ele.
 *
 * O botão de ligar está em primeiro porque é a primeira coisa a fazer: SEM
 * falar com ele não há duração nenhuma para escrever, e sem duração não há
 * hora que se possa dar. Um formulário que pedisse os minutos antes da
 * chamada estava a pedir um palpite.
 *
 * Depois da chamada o barbeiro escolhe a hora que lhe dá jeito e marca. A
 * marcação entra na agenda já com a vaga tomada, mas por confirmar: o
 * cliente ainda tem de aceitar. Se não puder, diz que hora quer, e o
 * barbeiro volta a ver a agenda — é o que acontece ao telefone, e é só isso
 * que isto escreve.
 */

const quando = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' às ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};
const diaHora = (data, hora) => {
  if (!data) return '';
  const d = new Date(data + 'T12:00:00');
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }) + (hora ? ` às ${hora}` : '');
};

export default function PedidosOrcamento({ businessId, barbearia, onMarcar }) {
  const toast = useToast();
  const loja = useStore();
  const [pedidos, setPedidos] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [f, setF] = useState({ profissional: '', dia: '', hora: '', minutos: '', preco: '' });
  const [aGravar, setAGravar] = useState(false);
  /*
   * As horas livres do dia escolhido. Escrever a hora à mão era pedir ao
   * barbeiro que se lembrasse do que tem ocupado — e o erro só aparecia no
   * fim, quando a base de dados recusasse a sobreposição.
   */
  const [horas, setHoras] = useState(null);
  useEffect(() => {
    let vivo = true;
    const m = Math.round(Number(f.minutos) || 0);
    if (!aberto || !f.dia || !f.profissional || !(m > 0)) { setHoras(null); return; }
    setHoras('a-ir');
    dataService.getAvailableSlots(f.dia, f.profissional, m)
      .then(l => { if (vivo) setHoras((l || []).filter(x => !x.isBooked && !x.isPast)); })
      .catch(() => { if (vivo) setHoras([]); });
    return () => { vivo = false; };
  }, [aberto, f.dia, f.profissional, f.minutos]);

  const carregar = async () => {
    try { setPedidos(await listarPedidos(businessId)); }
    catch { setPedidos([]); }
  };
  useEffect(() => { if (businessId) carregar(); }, [businessId]);

  if (!pedidos) return null;
  const abertos = pedidos.filter(p => p.estado === 'pendente' || p.estado === 'proposto');
  if (abertos.length === 0) return null;

  const tel = (t) => String(t || '').replace(/\D/g, '');
  const wa = (t) => { const n = tel(t); return n.length === 9 ? '351' + n : n; };

  // A marcação que está em cima da mesa para este pedido, se houver.
  const marcacaoDe = (p) => (loja.appointments || []).find(a => a.proposta?.pedidoId === p.id);

  const abrirForm = (p) => {
    const a = marcacaoDe(p);
    const sugestao = recusouComSugestao(a);
    setAberto(p.id);
    setF({
      profissional: a?.professionalId || loja.professionals?.[0]?.id || '',
      // Parte-se do que ELE pediu, não do dia de hoje: é a hora dele que
      // está em cima da mesa, e começar noutro dia era ignorá-la.
      dia: (sugestao?.querQuando || p.quandoPedido || '').slice(0, 10) || a?.date || todayStr(),
      hora: '',
      minutos: a?.proposta?.minutos || p.minutos || '',
      preco: a?.proposta?.preco ?? p.preco ?? '',
    });
    if (sugestao?.querQuando) toast.info('Ele quer outra altura', quando(sugestao.querQuando));
  };

  const marcar = async (p) => {
    setAGravar(true);
    try {
      const jaHa = marcacaoDe(p);
      if (jaHa) {
        await proporNovaHora(jaHa, {
          date: f.dia, startTime: f.hora, businessId, barbearia,
          motivo: 'Combinámos esta hora.',
        });
      } else {
        await proporDoPedido(p, {
          date: f.dia, startTime: f.hora, professionalId: f.profissional,
          minutos: f.minutos, preco: f.preco, businessId, barbearia,
        });
      }
      toast.success('Marcado — o cliente foi avisado',
        'Fica por confirmar até ele aceitar. A hora já está tomada na tua agenda.');
      setAberto(null);
      await carregar();
      onMarcar?.(p);
    } catch (e) {
      toast.error('Não foi possível marcar', e.message);
    } finally { setAGravar(false); }
  };

  return (
    <Card className="card-pad" style={{ marginBottom: 16, borderLeft: '4px solid var(--gold)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <h3 style={{ fontSize: 18 }}>Pedidos abertos</h3>
        <span className="text-sec text-sm">{abertos.length}</span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {abertos.map(p => {
          const a = marcacaoDe(p);
          const sugestao = recusouComSugestao(a);
          const aEsperar = p.estado === 'proposto' && a && !sugestao;

          return (
            <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 16 }}>{p.cliente}</b>
                <span className="text-sec text-sm">{p.servico}</span>
                {sugestao ? <Badge variant="warning">Não pôde</Badge>
                  : aEsperar ? <Badge variant="default">À espera dele</Badge> : null}
              </div>

              {p.descricao && <p style={{ marginTop: 7, fontSize: 15 }}>«{p.descricao}»</p>}
              {p.quandoPedido && !a && (
                <p className="text-sec text-sm" style={{ marginTop: 4 }}>Dá-lhe jeito {quando(p.quandoPedido)}</p>
              )}

              {/* O que está em cima da mesa agora. Sem isto, quem abre o
                  ecrã não sabe se já propôs alguma coisa a esta pessoa. */}
              {a && (
                <p style={{ marginTop: 7, fontSize: 15 }}>
                  <b>{diaHora(a.date, a.startTime)}</b>
                  <span className="text-sec text-sm">{sugestao ? ' — ele não pode' : ' — por confirmar'}</span>
                </p>
              )}

              {sugestao?.querQuando && (
                <p style={{ marginTop: 7, fontSize: 15, color: 'var(--gold)' }}>
                  Ele quer {quando(sugestao.querQuando)}
                </p>
              )}

              {p.telefone && (
                <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
                  <a href={`tel:+${wa(p.telefone)}`}
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
                  {/* A ordem é a da conversa: quem, quanto tempo, quanto
                      custa, que dia — e só então as horas que sobram. As
                      horas dependem do tempo, por isso não podem vir antes. */}
                  {!a && (
                    <>
                      <div className="field" style={{ margin: 0 }}>
                        <label className="label">Quem o atende</label>
                        <select className="input" value={f.profissional}
                          onChange={e => setF(v => ({ ...v, profissional: e.target.value, hora: '' }))}>
                          <option value="">Escolhe…</option>
                          {(loja.professionals || []).map(pr => (
                            <option key={pr.id} value={pr.id}>{pr.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="field" style={{ margin: 0 }}>
                          <label className="label">Tempo (min)</label>
                          <input className="input" type="number" min={5} max={600} value={f.minutos}
                            onChange={e => setF(v => ({ ...v, minutos: e.target.value, hora: '' }))} placeholder="240" />
                        </div>
                        <div className="field" style={{ margin: 0 }}>
                          <label className="label">Preço (€)</label>
                          <input className="input" type="number" min={0} value={f.preco}
                            onChange={e => setF(v => ({ ...v, preco: e.target.value }))} placeholder="45" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">Dia</label>
                    <input className="input" type="date" value={f.dia}
                      onChange={e => setF(v => ({ ...v, dia: e.target.value, hora: '' }))} />
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">Hora</label>
                    {horas === null ? (
                      <div className="text-sec text-sm">
                        {a ? 'Escolhe o dia.' : 'Escolhe quem atende, o tempo e o dia.'}
                      </div>
                    ) : horas === 'a-ir' ? (
                      <div className="text-sec text-sm">A ver o que está livre…</div>
                    ) : horas.length === 0 ? (
                      <div className="text-sec text-sm">Nada livre nesse dia com esse tempo.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {horas.map(h => (
                          <button key={h.startTime} type="button"
                            onClick={() => setF(v => ({ ...v, hora: h.startTime }))}
                            style={{
                              padding: '9px 13px', borderRadius: 9, fontWeight: 700, fontSize: 15,
                              cursor: 'pointer',
                              border: '1px solid ' + (f.hora === h.startTime ? 'var(--gold)' : 'var(--border)'),
                              background: f.hora === h.startTime ? 'rgba(var(--gold-rgb),0.15)' : 'transparent',
                              color: 'var(--text)',
                            }}>
                            {h.startTime}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                    <Button variant="primary" disabled={aGravar || !f.dia || !f.hora || (!a && (!f.minutos || !f.profissional))}
                      onClick={() => marcar(p)}>
                      {aGravar ? 'A marcar…' : 'Marcar e avisar'}
                    </Button>
                    <Button variant="secondary" onClick={() => setAberto(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 9, marginTop: 11, flexWrap: 'wrap' }}>
                  <Button variant="primary" onClick={() => abrirForm(p)}>
                    {a ? 'Combinar outra hora' : 'Já falei — marcar'}
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
          );
        })}
      </div>
    </Card>
  );
}
