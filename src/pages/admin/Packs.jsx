import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, ShoppingBag, Users, Inbox, Check, X, Clock } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, EmptyState, Modal, Badge, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import dataService from '@/lib/dataService';
import { formatPrice, formatDateShortNum } from '@/lib/format';
import {
  listarPacks, guardarPack, apagarPack, listarVendas, venderPack, anularVenda,
  listarPedidos, confirmarPedido, recusarPedido,
} from '@/lib/packsService';

/*
 * Packs — o cliente paga uns quantos cortes à cabeça e vai-os marcando.
 *
 * Pedido do primeiro barbeiro parceiro: há clientes que pagam o mês e vêm
 * todas as semanas. É também o argumento contra as apps que cobram por
 * marcação — aqui o pack é dele, o dinheiro é dele, e cada corte marcado
 * pelo cliente não custa nada a ninguém.
 *
 * Duas vistas:
 *   /admin/packs           → os packs que a barbearia vende
 *   /admin/packs/clientes  → quem comprou, quanto lhe resta, até quando
 *   /admin/packs/pedidos   → quem pediu o pack na app e espera que o
 *                            barbeiro confirme que recebeu o dinheiro
 *
 * O pedido da app nunca dá cortes. Só quando o barbeiro carrega em
 * «Confirmar pagamento» é que o pack nasce e o cliente pode marcar com ele.
 *
 * O dinheiro recebe-se na loja, como sempre. Aqui regista-se a venda — o
 * saldo é que é da app.
 */

const METODOS = ['Dinheiro', 'MB WAY', 'Cartão', 'Transferência'];
const PACK_VAZIO = {
  nome: 'Pack mensal', cortes: 4, preco: '', servicos: [], transitaMeses: 1, ativo: true,
  descricao: '', validadeTipo: 'mes', validadeDias: 30, intervaloDias: 0, pedidoNaApp: true,
};

const transitaTexto = (p) => p.validadeTipo === 'dias'
  ? `Vale ${p.validadeDias} dias a contar do pagamento`
  : p.transitaMeses === 0
    ? 'Só vale no mês da compra'
    : `O que sobrar passa ${p.transitaMeses === 1 ? 'para o mês seguinte' : `mais ${p.transitaMeses} meses`}`;

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// A validade de um pack vendido hoje (igual à base de dados): fim do mês +
// os meses que transita, ou N dias a contar de hoje.
function validadeSeVendidoHoje(pack) {
  const d = new Date();
  if (pack?.validadeTipo === 'dias') {
    const fim = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (Number(pack.validadeDias) || 30) - 1);
    return ymd(fim);
  }
  const fim = new Date(d.getFullYear(), d.getMonth() + (Number(pack?.transitaMeses) || 0) + 1, 0);
  return ymd(fim);
}

// Há quanto tempo o cliente pediu, dito como se diz ao balcão.
function haQuanto(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

const ESTADO_PEDIDO = {
  confirmado: { texto: 'Pago · pack ativo', variante: 'success' },
  recusado: { texto: 'Recusado', variante: 'default' },
  cancelado: { texto: 'Cancelado pelo cliente', variante: 'default' },
};

function estadoDaVenda(v) {
  if (v.anulado) return { texto: 'Anulado', variante: 'default' };
  if (v.expirado) return { texto: 'Expirou', variante: 'default' };
  if (v.restantes === 0) return { texto: 'Esgotado', variante: 'default' };
  return { texto: 'Ativo', variante: 'success' };
}

export default function Packs() {
  const data = useStore();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const businessId = data.business?.id;
  const tab = location.pathname.endsWith('/clientes') ? 'clientes'
    : location.pathname.endsWith('/pedidos') ? 'pedidos' : 'packs';

  const [packs, setPacks] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  // Confirmar: o barbeiro diz quanto recebeu e como. Recusar: com um motivo
  // opcional, que o cliente vê na app.
  const [confirmacao, setConfirmacao] = useState(null); // { pedido, metodo, preco }
  const [recusa, setRecusa] = useState(null);            // { pedido, motivo }
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState('');
  const [soActivos, setSoActivos] = useState(true);

  const [packModal, setPackModal] = useState(false);
  const [pack, setPack] = useState(PACK_VAZIO);
  const [vendaModal, setVendaModal] = useState(false);
  const [venda, setVenda] = useState({ packId: '', customerId: '', metodo: 'Dinheiro', preco: '' });
  const [aGravar, setAGravar] = useState(false);

  // O programa de packs, ligado ou desligado. Desligado (e por omissao), o
  // cliente nao ve rasto nenhum de packs na app, a agenda nao os oferece, e a
  // base de dados nao gasta nenhum. Os saldos ficam guardados para quando se
  // voltar a ligar — como os carimbos do cartao de fidelidade.
  const ligado = data.business?.packs?.ativo === true;
  const [aMudar, setAMudar] = useState(false);
  const alternarPrograma = async () => {
    setAMudar(true);
    try {
      await dataService.updateBusiness({ packs: { ...(data.business?.packs || {}), ativo: !ligado } });
      toast.success(!ligado ? 'Packs ligados' : 'Packs desligados', !ligado
        ? 'Os clientes com pack já vêem o cartão na app e podem usá-lo ao marcar.'
        : 'Deixam de aparecer aos clientes. Os saldos ficam guardados.');
    } catch (e) { toast.error('Não foi possível mudar', e.message); }
    finally { setAMudar(false); }
  };

  const carimbos = data.business?.packs?.carimbos === true;
  const alternarCarimbos = async () => {
    setAMudar(true);
    try {
      await dataService.updateBusiness({ packs: { ...(data.business?.packs || {}), carimbos: !carimbos } });
      toast.success(!carimbos ? 'Os cortes do pack passam a dar carimbo' : 'Os cortes do pack deixam de dar carimbo');
    } catch (e) { toast.error('Não foi possível mudar', e.message); }
    finally { setAMudar(false); }
  };

  const carregar = useCallback(async () => {
    if (!businessId) return;
    setErro('');
    try {
      const [p, v, q] = await Promise.all([
        listarPacks(businessId), listarVendas(businessId), listarPedidos(businessId),
      ]);
      setPacks(p); setVendas(v); setPedidos(q);
      // A Caixa e os relatórios lêem as vendas de packs do estado geral.
      dataService.recarregarVendasPacks?.().catch(() => {});
    } catch (e) {
      setErro(e.message);
    } finally {
      setACarregar(false);
    }
  }, [businessId]);

  useEffect(() => { carregar(); }, [carregar]);

  // Um pedido chega enquanto o painel está aberto noutra aba ou no bolso:
  // ao voltar à página, a lista acompanha sem ter de recarregar.
  useEffect(() => {
    const aoVoltar = () => { if (!document.hidden) carregar(); };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('focus', aoVoltar);
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('focus', aoVoltar);
    };
  }, [carregar]);

  const pendentes = pedidos.filter(p => p.estado === 'pendente');
  const resolvidos = pedidos.filter(p => p.estado !== 'pendente').slice(0, 30);

  const nomeCliente = (id) => data.customers.find(c => c.id === id)?.name || 'Cliente sem nome';
  const telefoneCliente = (id) => data.customers.find(c => c.id === id)?.phone || '';
  const nomeServico = (id) => data.services.find(s => s.id === id)?.name || 'serviço apagado';
  const clientesOrdenados = useMemo(
    () => [...data.customers].filter(c => c.name).sort((a, b) => a.name.localeCompare(b.name, 'pt')),
    [data.customers]);
  const servicosActivos = data.services.filter(s => s.isActive);

  const vendasVisiveis = soActivos ? vendas.filter(v => v.activo) : vendas;
  const packEscolhido = packs.find(p => p.id === venda.packId);

  const abrirNovoPack = () => { setPack(PACK_VAZIO); setPackModal(true); };
  const abrirVenda = (packId = '') => {
    const p = packs.find(x => x.id === packId) || packs.find(x => x.ativo);
    setVenda({ packId: p?.id || '', customerId: '', metodo: 'Dinheiro', preco: p ? String(p.preco) : '' });
    setVendaModal(true);
  };

  const gravarPack = async () => {
    setAGravar(true);
    try {
      await guardarPack(businessId, pack);
      toast.success(pack.id ? 'Pack actualizado' : 'Pack criado');
      setPackModal(false);
      carregar();
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
    finally { setAGravar(false); }
  };

  const removerPack = async (p) => {
    if (!window.confirm(`Apagar o «${p.nome}»? Quem já o comprou fica com os cortes que tem.`)) return;
    try { await apagarPack(p.id); carregar(); }
    catch (e) { toast.error('Não foi possível apagar', e.message); }
  };

  const gravarVenda = async () => {
    if (!venda.packId || !venda.customerId) { toast.error('Escolhe o cliente e o pack'); return; }
    // Dinheiro com a caixa fechada não fica em sessão nenhuma: no fecho,
    // ninguém sabe dele.
    if (venda.metodo === 'Dinheiro' && !dataService.caixaAberta()) { toast.error('Caixa fechada', 'A caixa está fechada. Abre a caixa para receber em dinheiro, ou escolhe outro método.'); return; }
    setAGravar(true);
    try {
      // O cliente já tinha pedido este pack na app: vender ao balcão é
      // confirmar esse pedido — senão ficava lá pendurado, e o cliente com
      // «à espera do barbeiro» depois de já ter pago.
      const pedidoDele = pendentes.find(p => p.customerId === venda.customerId && p.packId === venda.packId);
      const v = pedidoDele
        ? await confirmarPedido(pedidoDele, venda.metodo, venda.preco, { businessId, nomeBarbearia: data.business?.name })
        : await venderPack(venda.packId, venda.customerId, venda.metodo, venda.preco);
      toast.success('Pack vendido', `${nomeCliente(v.customerId)} tem ${v.total} cortes até ${formatDateShortNum(v.validoAte)}.`);
      setVendaModal(false);
      carregar();
      if (tab !== 'clientes') navigate('/admin/packs/clientes');
    } catch (e) { toast.error('Não foi possível vender', e.message); }
    finally { setAGravar(false); }
  };

  const abrirConfirmacao = (pedido) => {
    setConfirmacao({ pedido, metodo: pedido.mbwayEnviadoEm ? 'MB WAY' : 'Dinheiro', preco: String(pedido.preco) });
  };
  const verPrint = async (pedido) => {
    const url = await dataService.urlDoComprovativo?.(pedido.comprovativo);
    if (url) window.open(url, '_blank', 'noopener');
    else toast.error('Não foi possível abrir o print');
  };

  const gravarConfirmacao = async () => {
    const { pedido, metodo, preco } = confirmacao;
    if (metodo === 'Dinheiro' && !dataService.caixaAberta()) { toast.error('Caixa fechada', 'A caixa está fechada. Abre a caixa para receber em dinheiro, ou escolhe outro método.'); return; }
    setAGravar(true);
    try {
      const v = await confirmarPedido(pedido, metodo, preco, { businessId, nomeBarbearia: data.business?.name });
      toast.success('Pagamento confirmado',
        `${nomeCliente(pedido.customerId)} já pode marcar: ${v.total} cortes até ${formatDateShortNum(v.validoAte)}.`);
      setConfirmacao(null);
      carregar();
    } catch (e) { toast.error('Não foi possível confirmar', e.message); carregar(); }
    finally { setAGravar(false); }
  };

  const gravarRecusa = async () => {
    const { pedido, motivo } = recusa;
    setAGravar(true);
    try {
      await recusarPedido(pedido, motivo.trim(), { businessId, nomeBarbearia: data.business?.name });
      toast.success('Pedido recusado', `${nomeCliente(pedido.customerId)} vê na app que o pedido não foi aceite.`);
      setRecusa(null);
      carregar();
    } catch (e) { toast.error('Não foi possível recusar', e.message); carregar(); }
    finally { setAGravar(false); }
  };

  const anular = async (v) => {
    if (!window.confirm(`Anular o pack de ${nomeCliente(v.customerId)}? Os ${v.restantes} cortes que restam deixam de valer. As marcações já feitas ficam.`)) return;
    try { await anularVenda(v.id); carregar(); }
    catch (e) { toast.error('Não foi possível anular', e.message); }
  };

  const alternarServico = (id) => setPack(f => ({
    ...f,
    servicos: f.servicos.includes(id) ? f.servicos.filter(x => x !== id) : [...f.servicos, id],
  }));

  const accoes = !ligado || tab === 'pedidos' ? null : tab === 'packs'
    ? <Button variant="primary" onClick={abrirNovoPack}><Plus size={16} /> Novo pack</Button>
    : <Button variant="primary" onClick={() => abrirVenda()} disabled={!packs.some(p => p.ativo)}><ShoppingBag size={16} /> Vender pack</Button>;

  return (
    <AdminPage
      title={tab === 'packs' ? 'Packs' : tab === 'pedidos' ? 'Pedidos de pack' : 'Clientes com pack'}
      subtitle={tab === 'packs'
        ? 'Cortes pagos à cabeça. O cliente vai marcando pela app, e cada marcação gasta um.'
        : tab === 'pedidos'
          ? 'Clientes que pediram o pack na app. Confirma quando receberes o dinheiro — só aí o pack fica ativo.'
          : 'Quem comprou, quantos cortes lhe restam, e até quando valem.'}
      actions={accoes}
    >
      {erro && <Card className="card-pad" style={{ borderColor: 'var(--error)', marginBottom: 16 }}>{erro}</Card>}

      <Card className="card-pad" style={{ marginBottom: 16 }}>
        <label className="loyalty-toggle-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="fw-600 text-sm">Programa de packs {ligado ? 'ligado' : 'desligado'}</div>
            <div className="text-sec text-xs" style={{ marginTop: 3, lineHeight: 1.5, maxWidth: 560 }}>
              {ligado
                ? 'O cliente com pack vê o cartão do pack na app, ao lado do cartão de fidelidade, e usa-o ao marcar. A cada corte feito, o cartão é picotado.'
                : 'Desligado, os packs não aparecem em lado nenhum da app do cliente e a agenda não os oferece. Liga para começares a vender.'}
            </div>
          </div>
          <input type="checkbox" checked={ligado} disabled={aMudar} onChange={alternarPrograma} style={{ width: 20, height: 20 }} />
        </label>
        {ligado && (
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div>
              <div className="fw-600 text-sm">Os cortes do pack dão carimbo no cartão de fidelidade</div>
              <div className="text-sec text-xs" style={{ marginTop: 3, lineHeight: 1.5, maxWidth: 560 }}>
                {data.business?.loyalty?.ativo !== true
                  ? 'O cartão de fidelidade está desligado, por isso isto não conta agora.'
                  : carimbos
                    ? 'Cada corte do pack conta também para o cartão de fidelidade.'
                    : 'Desligado (recomendado): o pack já é o desconto. Os dois cartões continuam na app, mas só os cortes pagos à parte levam carimbo.'}
              </div>
            </div>
            <input type="checkbox" checked={carimbos} disabled={aMudar} onChange={alternarCarimbos} style={{ width: 20, height: 20 }} />
          </label>
        )}
      </Card>

      {tab !== 'pedidos' && pendentes.length > 0 && (
        <Card className="card-pad" style={{ marginBottom: 16, borderColor: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="flex items-center gap-12">
            <span className="notif-ico"><Inbox size={18} /></span>
            <div>
              <div className="fw-600 text-sm">
                {pendentes.length === 1 ? '1 cliente pediu um pack' : `${pendentes.length} clientes pediram um pack`}
              </div>
              <div className="text-sec text-xs" style={{ marginTop: 2 }}>Confirma o pagamento para o pack ficar ativo na app dele.</div>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate('/admin/packs/pedidos')}>Ver pedidos</Button>
        </Card>
      )}

      <div style={{ opacity: ligado ? 1 : 0.45, pointerEvents: ligado ? 'auto' : 'none', transition: 'opacity .2s' }}>

      {tab === 'pedidos' && !aCarregar && (
        <>
          {pendentes.length === 0 ? (
            <Card className="card-pad">
              <EmptyState icon={() => <Inbox />} title="Nenhum pedido à espera"
                description="Quando um cliente pedir o pack na app, aparece aqui e recebes uma notificação. Confirmas quando ele te pagar na barbearia." />
            </Card>
          ) : (
            <div className="grid-3">
              {pendentes.map(q => {
                const pack = packs.find(p => p.id === q.packId);
                const tel = telefoneCliente(q.customerId);
                return (
                  <Card key={q.id} className="card-pad">
                    <div className="flex justify-between items-center mb-16">
                      <div className="flex items-center gap-8">
                        <Avatar name={nomeCliente(q.customerId)} />
                        <div>
                          <div className="fw-600 text-sm">{nomeCliente(q.customerId)}</div>
                          {tel && <div className="text-sec text-xs">{tel}</div>}
                        </div>
                      </div>
                      <Badge variant="warning"><Clock size={12} style={{ marginRight: 4 }} />À espera</Badge>
                    </div>
                    <h3 style={{ fontSize: 16 }}>{q.nome}</h3>
                    <div className="text-gold fw-600 mt-8" style={{ fontFamily: 'var(--font-head)', fontSize: 20 }}>
                      {formatPrice(q.preco)}
                      <span className="text-sec text-sm" style={{ fontFamily: 'var(--font-body)' }}> · {q.cortes} cortes</span>
                    </div>
                    {q.mbwayEnviadoEm && (
                      <div className="flex items-center gap-8 mt-8" style={{ flexWrap: 'wrap' }}>
                        <Badge variant="success">Pagou por MB WAY · {haQuanto(q.mbwayEnviadoEm)}</Badge>
                        {q.comprovativo && <button className="btn btn-ghost btn-sm" onClick={() => verPrint(q)}>Ver print</button>}
                      </div>
                    )}
                    <p className="text-sec text-xs mt-8" style={{ lineHeight: 1.55 }}>
                      {q.mbwayEnviadoEm ? 'Confirma só depois de veres o dinheiro no teu MB WAY. ' : ''}
                      Pediu {haQuanto(q.criadoEm)}.{' '}
                      {pack
                        ? `Se confirmares hoje, vale até ${formatDateShortNum(validadeSeVendidoHoje(pack))}.`
                        : 'Este pack já foi apagado — recusa o pedido e vende-lhe outro.'}
                    </p>
                    <div className="flex gap-8 mt-16">
                      <Button size="sm" variant="primary" block disabled={!q.packId} onClick={() => abrirConfirmacao(q)}>
                        <Check size={14} /> Confirmar pagamento
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setRecusa({ pedido: q, motivo: '' })}>
                        <X size={14} /> Recusar
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {resolvidos.length > 0 && (
            <>
              <h3 className="text-sm fw-600" style={{ margin: '24px 0 10px' }}>Últimos pedidos tratados</h3>
              <Card className="card-pad" style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr><th>Cliente</th><th>Pack</th><th>Pedido</th><th>Tratado</th><th>Estado</th></tr></thead>
                  <tbody>
                    {resolvidos.map(q => {
                      const est = ESTADO_PEDIDO[q.estado] || { texto: q.estado, variante: 'default' };
                      return (
                        <tr key={q.id}>
                          <td className="text-sm fw-600">{nomeCliente(q.customerId)}</td>
                          <td className="text-sm">{q.nome} · {formatPrice(q.preco)}</td>
                          <td className="text-sm">{formatDateShortNum(String(q.criadoEm).slice(0, 10))}</td>
                          <td className="text-sm">{q.resolvidoEm ? formatDateShortNum(String(q.resolvidoEm).slice(0, 10)) : '—'}</td>
                          <td>
                            <Badge variant={est.variante}>{est.texto}</Badge>
                            {q.estado === 'recusado' && q.motivo && <div className="text-sec text-xs" style={{ marginTop: 4 }}>{q.motivo}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </>
      )}

      {tab === 'packs' && !aCarregar && (
        packs.length === 0 ? (
          <Card className="card-pad">
            <EmptyState icon={() => <Package />} title="Ainda não vendes packs"
              description="Cria o primeiro — por exemplo, 4 cortes por mês. Depois vendes ao balcão e o cliente marca cada corte pela app." />
          </Card>
        ) : (
          <div className="grid-3">
            {packs.map(p => (
              <Card key={p.id} className="card-pad card-hover">
                <div className="flex justify-between items-center mb-16">
                  <span className="notif-ico"><Package size={18} /></span>
                  <Badge variant={p.ativo ? 'success' : 'default'}>{p.ativo ? 'À venda' : 'Parado'}</Badge>
                </div>
                <h3 style={{ fontSize: 17 }}>{p.nome}</h3>
                <div className="text-gold fw-600 mt-8" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>
                  {formatPrice(p.preco)}
                  <span className="text-sec text-sm" style={{ fontFamily: 'var(--font-body)' }}> · {p.cortes} cortes</span>
                </div>
                <p className="text-sec text-sm mt-8" style={{ lineHeight: 1.55 }}>
                  {formatPrice(p.cortes ? p.preco / p.cortes : 0)} por corte.{' '}
                  {p.servicos.length ? `Vale para: ${p.servicos.map(nomeServico).join(', ')}.` : 'Vale para qualquer serviço.'}{' '}
                  {transitaTexto(p)}.
                  {p.intervaloDias > 0 ? ` Um corte a cada ${p.intervaloDias} dias.` : ''}
                  {p.pedidoNaApp ? ' Pede-se na app.' : ' Só ao balcão.'}
                </p>
                <div className="flex gap-8 mt-16">
                  <Button size="sm" variant="primary" block onClick={() => abrirVenda(p.id)} disabled={!p.ativo}>
                    <ShoppingBag size={14} /> Vender
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setPack({ ...p, preco: String(p.preco) }); setPackModal(true); }}>
                    <Edit size={14} />
                  </Button>
                  <button className="btn btn-ghost btn-icon" aria-label="Apagar pack" title="Apagar pack" onClick={() => removerPack(p)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'clientes' && !aCarregar && (
        <>
          <label className="text-sm text-sec" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={soActivos} onChange={e => setSoActivos(e.target.checked)} />
            Mostrar só os packs que ainda se podem usar
          </label>
          {vendasVisiveis.length === 0 ? (
            <Card className="card-pad">
              <EmptyState icon={() => <Users />}
                title={soActivos ? 'Ninguém tem um pack activo' : 'Ainda não vendeste packs'}
                description="Quando venderes um pack ao balcão, regista-o aqui. O cliente passa a ver o saldo na app." />
            </Card>
          ) : (
            <Card className="card-pad" style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Cliente</th><th>Pack</th><th>Cortes</th><th>Válido até</th><th>Pago</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {vendasVisiveis.map(v => {
                    const est = estadoDaVenda(v);
                    return (
                      <tr key={v.id}>
                        <td><div className="flex items-center gap-8"><Avatar name={nomeCliente(v.customerId)} /><span className="text-sm fw-600">{nomeCliente(v.customerId)}</span></div></td>
                        <td className="text-sm">{v.nome}</td>
                        <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>
                          <b>{v.restantes}</b> de {v.total} por usar
                        </td>
                        <td className="text-sm">{formatDateShortNum(v.validoAte)}</td>
                        <td className="text-sm">{formatPrice(v.precoPago)}{v.metodo ? ` · ${v.metodo}` : ''}</td>
                        <td><Badge variant={est.variante}>{est.texto}</Badge></td>
                        <td>
                          {!v.anulado && (
                            <Button size="sm" variant="secondary" onClick={() => anular(v)}>Anular</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      </div>

      <Modal open={packModal} onClose={() => setPackModal(false)} title={pack.id ? 'Editar pack' : 'Novo pack'}>
        <div className="field">
          <label className="label">Nome</label>
          <input className="input" value={pack.nome} onChange={e => setPack(f => ({ ...f, nome: e.target.value }))} placeholder="Pack mensal" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Cortes</label>
            <input type="number" min={1} max={60} className="input" value={pack.cortes}
              onChange={e => setPack(f => ({ ...f, cortes: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Preço do pack (€)</label>
            <input type="number" min={0} step="0.01" className="input" value={pack.preco}
              onChange={e => setPack(f => ({ ...f, preco: e.target.value }))} placeholder="40" />
          </div>
        </div>
        <div className="field">
          <label className="label">Validade</label>
          <select className="select" value={pack.validadeTipo}
            onChange={e => setPack(f => ({ ...f, validadeTipo: e.target.value }))}>
            <option value="mes">Mês de calendário (até ao fim do mês)</option>
            <option value="dias">Um número de dias a contar do pagamento</option>
          </select>
        </div>
        {pack.validadeTipo === 'dias' ? (
          <div className="field">
            <label className="label">Dias de validade</label>
            <input type="number" min={1} max={366} className="input" value={pack.validadeDias}
              onChange={e => setPack(f => ({ ...f, validadeDias: e.target.value }))} />
            <div className="text-sec text-xs mt-8">
              Vendido hoje, vale até {formatDateShortNum(validadeSeVendidoHoje(pack))}. Os cortes que sobrarem perdem-se.
            </div>
          </div>
        ) : (
          <div className="field">
            <label className="label">Os cortes que sobram</label>
            <select className="select" value={pack.transitaMeses}
              onChange={e => setPack(f => ({ ...f, transitaMeses: Number(e.target.value) }))}>
              <option value={0}>Perdem-se no fim do mês</option>
              <option value={1}>Passam para o mês seguinte (recomendado)</option>
              <option value={2}>Passam mais 2 meses</option>
              <option value={3}>Passam mais 3 meses</option>
            </select>
            <div className="text-sec text-xs mt-8">
              Vendido hoje, vale até {formatDateShortNum(validadeSeVendidoHoje(pack))}.
            </div>
          </div>
        )}
        <div className="field">
          <label className="label">Espaço entre cortes</label>
          <select className="select" value={pack.intervaloDias}
            onChange={e => setPack(f => ({ ...f, intervaloDias: Number(e.target.value) }))}>
            <option value={0}>Sem limite — pode marcar os cortes quando quiser</option>
            <option value={5}>Um corte a cada 5 dias</option>
            <option value={7}>Um corte por semana (7 dias)</option>
            <option value={10}>Um corte a cada 10 dias</option>
            <option value={14}>Um corte a cada 15 dias (14)</option>
          </select>
          <div className="text-sec text-xs mt-8">
            Evita que o cliente gaste o pack todo na mesma semana. A app apaga os dias perto de outro corte dele.
          </div>
        </div>
        <div className="field">
          <label className="label">Texto para o cliente (opcional)</label>
          <textarea className="textarea" rows={2} maxLength={240} value={pack.descricao}
            onChange={e => setPack(f => ({ ...f, descricao: e.target.value }))}
            placeholder="Ex.: 4 cortes por mês, um por semana. Marca todos de uma vez e não pagas mais nada." />
        </div>
        <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 12px' }}>
          <input type="checkbox" checked={pack.pedidoNaApp} onChange={e => setPack(f => ({ ...f, pedidoNaApp: e.target.checked }))} />
          O cliente pode pedir este pack na app (tu confirmas quando ele pagar)
        </label>
        <div className="field">
          <label className="label">Serviços que o pack cobre</label>
          <div className="text-sec text-xs" style={{ marginBottom: 8 }}>
            Sem nenhum marcado, vale para qualquer serviço.
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {servicosActivos.map(s => (
              <label key={s.id} className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={pack.servicos.includes(s.id)} onChange={() => alternarServico(s.id)} />
                {s.name} <span className="text-sec">· {formatPrice(s.price)}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 16px' }}>
          <input type="checkbox" checked={pack.ativo} onChange={e => setPack(f => ({ ...f, ativo: e.target.checked }))} />
          À venda
        </label>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setPackModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={gravarPack} disabled={aGravar}>{pack.id ? 'Guardar' : 'Criar pack'}</Button>
        </div>
      </Modal>

      <Modal open={vendaModal} onClose={() => setVendaModal(false)} title="Vender pack">
        <div className="field">
          <label className="label">Cliente</label>
          <select className="select" value={venda.customerId} onChange={e => setVenda(f => ({ ...f, customerId: e.target.value }))}>
            <option value="">Escolher…</option>
            {clientesOrdenados.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Pack</label>
          <select className="select" value={venda.packId}
            onChange={e => { const p = packs.find(x => x.id === e.target.value); setVenda(f => ({ ...f, packId: e.target.value, preco: p ? String(p.preco) : f.preco })); }}>
            {packs.filter(p => p.ativo).map(p => <option key={p.id} value={p.id}>{p.nome} · {p.cortes} cortes</option>)}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Recebido (€)</label>
            <input type="number" min={0} step="0.01" className="input" value={venda.preco}
              onChange={e => setVenda(f => ({ ...f, preco: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Como pagou</label>
            <select className="select" value={venda.metodo} onChange={e => setVenda(f => ({ ...f, metodo: e.target.value }))}>
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        {pendentes.some(p => p.customerId === venda.customerId) && (
          <p className="text-sm" style={{ lineHeight: 1.55, color: 'var(--gold)' }}>
            {pendentes.some(p => p.customerId === venda.customerId && p.packId === venda.packId)
              ? 'Este cliente pediu este pack na app. Registar a venda confirma o pedido dele.'
              : 'Este cliente tem um pedido de outro pack na app. Esse pedido fica à espera — recusa-o em «Pedidos» se não fizer sentido.'}
          </p>
        )}
        {packEscolhido && (
          <p className="text-sec text-sm" style={{ lineHeight: 1.55 }}>
            O cliente fica com {packEscolhido.cortes} cortes até {formatDateShortNum(validadeSeVendidoHoje(packEscolhido))}
            {' '}e vê o saldo na app. Cada marcação com o pack fica a 0 € na agenda — o corte já foi pago agora.
          </p>
        )}
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setVendaModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={gravarVenda} disabled={aGravar}>Registar venda</Button>
        </div>
      </Modal>
      <Modal open={!!confirmacao} onClose={() => setConfirmacao(null)} title="Confirmar pagamento">
        {confirmacao && (() => {
          const q = confirmacao.pedido;
          const pack = packs.find(p => p.id === q.packId);
          return (
            <>
              <p className="text-sm" style={{ lineHeight: 1.6, marginBottom: 14 }}>
                <b>{nomeCliente(q.customerId)}</b> pediu o <b>{q.nome}</b> ({q.cortes} cortes, {formatPrice(q.preco)}).
                Confirma só depois de receberes o dinheiro.
              </p>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Recebido (€)</label>
                  <input type="number" min={0} step="0.01" className="input" value={confirmacao.preco}
                    onChange={e => setConfirmacao(c => ({ ...c, preco: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="label">Como pagou</label>
                  <select className="select" value={confirmacao.metodo} onChange={e => setConfirmacao(c => ({ ...c, metodo: e.target.value }))}>
                    {METODOS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-sec text-sm" style={{ lineHeight: 1.55 }}>
                Ao confirmar, o pack fica ativo na app do cliente
                {pack ? ` com ${q.cortes} cortes até ${formatDateShortNum(validadeSeVendidoHoje(pack))}` : ''},
                ele recebe uma notificação e passa a poder marcar com o pack.
              </p>
              <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setConfirmacao(null)}>Cancelar</Button>
                <Button variant="primary" onClick={gravarConfirmacao} disabled={aGravar}>Recebi, ativar o pack</Button>
              </div>
            </>
          );
        })()}
      </Modal>

      <Modal open={!!recusa} onClose={() => setRecusa(null)} title="Recusar pedido">
        {recusa && (
          <>
            <p className="text-sm" style={{ lineHeight: 1.6, marginBottom: 14 }}>
              O pedido de <b>{nomeCliente(recusa.pedido.customerId)}</b> ({recusa.pedido.nome}) deixa de estar à espera.
              Não lhe é dado nenhum corte.
            </p>
            <div className="field">
              <label className="label">Motivo (opcional — o cliente vê)</label>
              <input className="input" value={recusa.motivo} maxLength={200}
                onChange={e => setRecusa(r => ({ ...r, motivo: e.target.value }))}
                placeholder="Ex.: não chegou a pagar — pede de novo quando vieres" />
            </div>
            <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setRecusa(null)}>Voltar</Button>
              <Button variant="primary" onClick={gravarRecusa} disabled={aGravar}>Recusar pedido</Button>
            </div>
          </>
        )}
      </Modal>
    </AdminPage>
  );
}
