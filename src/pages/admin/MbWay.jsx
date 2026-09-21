import React, { useEffect, useMemo, useState } from 'react';
import { Smartphone, Check, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, Badge, Avatar, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import dataService from '@/lib/dataService';
import { formatPrice, formatDateShortNum } from '@/lib/format';

/*
 * MB WAY — o cliente paga a marcação por MB WAY ao número do barbeiro.
 *
 * Em cima, as definições: ligar/desligar, o número, e «atingi o limite deste
 * mês» (o MB WAY pessoal tem um tecto de recebimentos por mês; com ele
 * ligado, a opção desaparece da app até ao mês seguinte, sozinha).
 *
 * Em baixo, os pagamentos que os clientes dizem ter feito. Nenhum fica pago
 * sem o barbeiro ver o dinheiro no telemóvel dele e carregar em «Recebi» —
 * um print pode ser editado, a conta dele não.
 */

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const soDigitos = (t) => String(t || '').replace(/\D/g, '');

export default function MbWay() {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business?.mbway || {};
  const ligado = cfg.ativo === true;
  const limiteEsteMes = cfg.limiteMes === mesAtual();

  const [numero, setNumero] = useState(cfg.numero || '');
  const [titular, setTitular] = useState(cfg.titular || '');
  const [devolucao, setDevolucao] = useState(cfg.devolucao || '');
  const [aGravar, setAGravar] = useState(false);
  const [verPrint, setVerPrint] = useState(null);     // { url, pagamento }
  const [rejeitar, setRejeitar] = useState(null);     // { pagamento, motivo }
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => { setNumero(cfg.numero || ''); setTitular(cfg.titular || ''); setDevolucao(cfg.devolucao || ''); }, [cfg.numero, cfg.titular, cfg.devolucao]);

  // Ao abrir: dados frescos, e os prints com mais de 90 dias vão-se embora.
  useEffect(() => {
    dataService.recarregarMbway?.().then(() => dataService.apagarComprovativosAntigos?.()).catch(() => {});
  }, []);

  const gravar = async (mudancas, aviso) => {
    setAGravar(true);
    try {
      await dataService.updateBusiness({ mbway: { ...cfg, ...mudancas } });
      if (aviso) toast.success(aviso);
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
    finally { setAGravar(false); }
  };

  const guardarNumero = () => {
    const d = soDigitos(numero);
    if (d.length < 9) { toast.error('Número inválido', 'Escreve o número de telemóvel com 9 dígitos.'); return; }
    gravar({ numero: d.slice(-9), titular: titular.trim(), devolucao: devolucao.trim() }, 'Guardado');
  };

  const alternar = () => {
    if (!ligado && soDigitos(numero).length < 9) {
      toast.error('Falta o número', 'Escreve primeiro o número para onde os clientes enviam.');
      return;
    }
    gravar({ ativo: !ligado, numero: soDigitos(numero).slice(-9) || cfg.numero, titular: titular.trim() },
      !ligado ? 'MB WAY ligado — os clientes já podem pagar ao marcar' : 'MB WAY desligado');
  };

  const alternarLimite = () => gravar(
    { limiteMes: limiteEsteMes ? null : mesAtual() },
    limiteEsteMes ? 'MB WAY de volta na app' : 'Até ao fim do mês, a app não oferece MB WAY');

  const pagamentos = data.pagamentosMbway || [];
  const porConfirmar = pagamentos.filter(p => p.estado === 'enviado');
  const tratados = pagamentos.filter(p => p.estado !== 'enviado');
  const tratadosVisiveis = verTodos ? tratados : tratados.slice(0, 20);

  // O que já entrou este mês — é o que conta para o limite do banco.
  const recebidoEsteMes = useMemo(() => pagamentos
    .filter(p => p.estado === 'confirmado' && String(p.resolvidoEm || '').slice(0, 7) === mesAtual())
    .reduce((t, p) => t + p.valor, 0), [pagamentos]);

  const marcacao = (id) => data.appointments.find(a => a.id === id);
  const nome = (id) => data.customers.find(c => c.id === id)?.name || 'Cliente';
  const servico = (a) => a ? (data.services.find(s => s.id === a.serviceId)?.name || a.serviceNameSnapshot || 'Serviço') : 'Marcação apagada';

  const abrirPrint = async (p) => {
    const url = await dataService.urlDoComprovativo(p.comprovativo);
    if (!url) { toast.error('Não foi possível abrir o print'); return; }
    setVerPrint({ url, pagamento: p });
  };

  const recebi = async (p) => {
    try {
      await dataService.confirmarMbway(p.id);
      toast.success('Pagamento confirmado', `${nome(p.customerId)} já vê a marcação como paga.`);
      setVerPrint(null);
    } catch (e) { toast.error('Não foi possível confirmar', e.message); dataService.recarregarMbway(); }
  };

  const gravarRejeicao = async () => {
    try {
      await dataService.rejeitarMbway(rejeitar.pagamento.id, rejeitar.motivo.trim());
      toast.success('Marcado como não recebido', 'O cliente é avisado na app.');
      setRejeitar(null); setVerPrint(null);
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
  };

  const linhaMarcacao = (p) => {
    const a = marcacao(p.appointmentId);
    return a ? `${servico(a)} · ${formatDateShortNum(a.date)} às ${a.startTime}` : 'Marcação apagada';
  };

  return (
    <AdminPage title="MB WAY" subtitle="Os clientes pagam a marcação por MB WAY para o teu número. Tu confirmas quando o dinheiro chegar.">
      <Card className="card-pad" style={{ marginBottom: 16 }}>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="fw-600 text-sm">Pagamento por MB WAY {ligado ? 'ligado' : 'desligado'}</div>
            <div className="text-sec text-xs" style={{ marginTop: 3, lineHeight: 1.5, maxWidth: 560 }}>
              {ligado
                ? 'Ao marcar, o cliente pode escolher «Pagar já por MB WAY». Continua a poder pagar na barbearia.'
                : 'Desligado, a app não fala em MB WAY. Liga depois de escreveres o número.'}
            </div>
          </div>
          <input type="checkbox" checked={ligado} disabled={aGravar} onChange={alternar} style={{ width: 20, height: 20 }} />
        </label>

        <div className="grid-2" style={{ marginTop: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Número MB WAY</label>
            <input className="input" type="tel" inputMode="tel" value={numero} placeholder="912 345 678"
              onChange={e => setNumero(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Nome que aparece ao cliente no MB WAY (opcional)</label>
            <input className="input" value={titular} placeholder="Ex.: João S."
              onChange={e => setTitular(e.target.value)} />
          </div>
        </div>
        <div className="text-sec text-xs mt-8" style={{ lineHeight: 1.5 }}>
          O nome ajuda o cliente a confirmar que está a enviar para a pessoa certa. Este número fica visível a quem marca.
        </div>
        <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
          <label className="label">Se o cliente cancelar depois de pagar</label>
          <textarea className="textarea" rows={2} maxLength={240} value={devolucao}
            onChange={e => setDevolucao(e.target.value)}
            placeholder="Ex.: devolvemos por MB WAY se cancelares até 24 h antes. Depois disso, ou se faltares, não há devolução." />
          <div className="text-sec text-xs mt-8" style={{ lineHeight: 1.5 }}>
            O cliente lê isto antes de pagar. A lei obriga a informar o que acontece ao dinheiro se cancelar ou faltar.
          </div>
        </div>
        <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <Button size="sm" variant="secondary" onClick={guardarNumero}
            disabled={aGravar || (soDigitos(numero).slice(-9) === (cfg.numero || '') && titular.trim() === (cfg.titular || '') && devolucao.trim() === (cfg.devolucao || ''))}>
            Guardar
          </Button>
        </div>

        {ligado && (
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div>
              <div className="fw-600 text-sm">Atingi o limite do MB WAY este mês</div>
              <div className="text-sec text-xs" style={{ marginTop: 3, lineHeight: 1.5, maxWidth: 560 }}>
                {limiteEsteMes
                  ? 'A app deixou de oferecer MB WAY. No dia 1 do mês que vem volta sozinha.'
                  : `Recebido este mês por aqui: ${formatPrice(recebidoEsteMes)}. O teu banco tem um limite de recebimentos por mês — quando chegares lá, liga isto.`}
              </div>
            </div>
            <input type="checkbox" checked={limiteEsteMes} disabled={aGravar} onChange={alternarLimite} style={{ width: 20, height: 20 }} />
          </label>
        )}
      </Card>

      <Card className="card-pad" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
        <div className="text-sec text-xs" style={{ lineHeight: 1.6 }}>
          Confirma só depois de veres o dinheiro na app do teu banco — um print pode ser editado.
          O MB WAY não substitui a fatura: continua a passá-la como para qualquer outro pagamento.
          Se a marcação for cancelada depois de paga, a devolução é feita por ti, pelo MB WAY.
        </div>
      </Card>

      <h3 className="text-sm fw-600" style={{ margin: '0 0 10px' }}>
        Por confirmar {porConfirmar.length > 0 && <Badge variant="warning">{porConfirmar.length}</Badge>}
      </h3>
      {porConfirmar.length === 0 ? (
        <Card className="card-pad" style={{ marginBottom: 24 }}>
          <EmptyState icon={() => <Smartphone />} title="Nada à espera"
            description="Quando um cliente pagar uma marcação por MB WAY, aparece aqui com o print. Recebes também uma notificação." />
        </Card>
      ) : (
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {porConfirmar.map(p => {
            const a = marcacao(p.appointmentId);
            const cancelada = a?.status === 'cancelled';
            return (
              <Card key={p.id} className="card-pad">
                <div className="flex justify-between items-center mb-16">
                  <div className="flex items-center gap-8">
                    <Avatar name={nome(p.customerId)} />
                    <div>
                      <div className="fw-600 text-sm">{nome(p.customerId)}</div>
                      <div className="text-sec text-xs">{linhaMarcacao(p)}</div>
                    </div>
                  </div>
                </div>
                <div className="text-gold fw-600" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>{formatPrice(p.valor)}</div>
                {cancelada && <div className="text-xs mt-8" style={{ color: 'var(--error)' }}>A marcação foi cancelada. Se o dinheiro chegou, devolve-o.</div>}
                <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                  {p.comprovativo && (
                    <Button size="sm" variant="secondary" onClick={() => abrirPrint(p)}><ImageIcon size={14} /> Ver print</Button>
                  )}
                  <Button size="sm" variant="primary" onClick={() => recebi(p)}><Check size={14} /> Recebi</Button>
                  <Button size="sm" variant="secondary" onClick={() => setRejeitar({ pagamento: p, motivo: '' })}><X size={14} /> Não recebi</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tratados.length > 0 && (
        <>
          <h3 className="text-sm fw-600" style={{ margin: '0 0 10px' }}>Histórico</h3>
          <Card className="card-pad" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Cliente</th><th>Marcação</th><th>Valor</th><th>Tratado</th><th>Estado</th></tr></thead>
              <tbody>
                {tratadosVisiveis.map(p => {
                  const a = marcacao(p.appointmentId);
                  const devolver = p.estado === 'confirmado' && a?.status === 'cancelled';
                  return (
                    <tr key={p.id}>
                      <td className="text-sm fw-600">{nome(p.customerId)}</td>
                      <td className="text-sm">{linhaMarcacao(p)}</td>
                      <td className="text-sm">{formatPrice(p.valor)}</td>
                      <td className="text-sm">{p.resolvidoEm ? formatDateShortNum(String(p.resolvidoEm).slice(0, 10)) : '—'}</td>
                      <td>
                        <Badge variant={p.estado === 'confirmado' ? 'success' : 'default'}>{p.estado === 'confirmado' ? 'Recebido' : 'Não recebido'}</Badge>
                        {devolver && <div className="text-xs" style={{ color: 'var(--error)', marginTop: 4 }}>Marcação cancelada — devolver</div>}
                        {p.estado === 'rejeitado' && p.motivo && <div className="text-sec text-xs" style={{ marginTop: 4 }}>{p.motivo}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!verTodos && tratados.length > 20 && (
              <div className="flex" style={{ justifyContent: 'center', marginTop: 12 }}>
                <Button size="sm" variant="secondary" onClick={() => setVerTodos(true)}>Ver todos ({tratados.length})</Button>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={!!verPrint} onClose={() => setVerPrint(null)} title="Comprovativo do cliente">
        {verPrint && (
          <>
            <p className="text-sm" style={{ marginBottom: 12 }}>
              <b>{nome(verPrint.pagamento.customerId)}</b> · {formatPrice(verPrint.pagamento.valor)} · {linhaMarcacao(verPrint.pagamento)}
            </p>
            <img src={verPrint.url} alt="Print do pagamento MB WAY"
              style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 10, background: 'var(--elevated)' }} />
            <p className="text-sec text-xs" style={{ margin: '12px 0' }}>Confirma na app do teu banco antes de carregar em «Recebi».</p>
            {verPrint.pagamento.estado === 'enviado' && (
              <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setRejeitar({ pagamento: verPrint.pagamento, motivo: '' })}>Não recebi</Button>
                <Button variant="primary" onClick={() => recebi(verPrint.pagamento)}>Recebi</Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={!!rejeitar} onClose={() => setRejeitar(null)} title="O dinheiro não chegou">
        {rejeitar && (
          <>
            <p className="text-sm" style={{ lineHeight: 1.6, marginBottom: 14 }}>
              A marcação de <b>{nome(rejeitar.pagamento.customerId)}</b> fica por pagar, e o cliente é avisado. A marcação não é cancelada.
            </p>
            <div className="field">
              <label className="label">Mensagem para o cliente (opcional)</label>
              <input className="input" maxLength={200} value={rejeitar.motivo}
                onChange={e => setRejeitar(r => ({ ...r, motivo: e.target.value }))}
                placeholder="Ex.: não recebi nada neste número — paga na barbearia" />
            </div>
            <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setRejeitar(null)}>Voltar</Button>
              <Button variant="primary" onClick={gravarRejeicao}>Confirmar</Button>
            </div>
          </>
        )}
      </Modal>
    </AdminPage>
  );
}
