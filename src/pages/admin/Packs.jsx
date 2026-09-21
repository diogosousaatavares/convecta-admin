import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, ShoppingBag, Users } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, EmptyState, Modal, Badge, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import dataService from '@/lib/dataService';
import { formatPrice, formatDateShortNum } from '@/lib/format';
import {
  listarPacks, guardarPack, apagarPack, listarVendas, venderPack, anularVenda,
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
 *
 * O dinheiro recebe-se na loja, como sempre. Aqui regista-se a venda — o
 * saldo é que é da app.
 */

const METODOS = ['Dinheiro', 'MB WAY', 'Cartão', 'Transferência'];
const PACK_VAZIO = { nome: 'Pack mensal', cortes: 4, preco: '', servicos: [], transitaMeses: 1, ativo: true };

const transitaTexto = (m) => m === 0
  ? 'Só vale no mês da compra'
  : `O que sobrar passa ${m === 1 ? 'para o mês seguinte' : `mais ${m} meses`}`;

// Último dia do mês da compra + os meses que transita (igual à base de dados).
function validadeSeVendidoHoje(transitaMeses) {
  const d = new Date();
  const fim = new Date(d.getFullYear(), d.getMonth() + (Number(transitaMeses) || 0) + 1, 0);
  return fim.toISOString().slice(0, 10);
}

function estadoDaVenda(v) {
  if (v.anulado) return { texto: 'Anulado', variante: 'default' };
  if (v.expirado) return { texto: 'Expirou', variante: 'default' };
  if (v.restantes === 0) return { texto: 'Esgotado', variante: 'default' };
  return { texto: 'Activo', variante: 'success' };
}

export default function Packs() {
  const data = useStore();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const businessId = data.business?.id;
  const tab = location.pathname.endsWith('/clientes') ? 'clientes' : 'packs';

  const [packs, setPacks] = useState([]);
  const [vendas, setVendas] = useState([]);
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

  const carregar = useCallback(async () => {
    if (!businessId) return;
    setErro('');
    try {
      const [p, v] = await Promise.all([listarPacks(businessId), listarVendas(businessId)]);
      setPacks(p); setVendas(v);
    } catch (e) {
      setErro(e.message);
    } finally {
      setACarregar(false);
    }
  }, [businessId]);

  useEffect(() => { carregar(); }, [carregar]);

  const nomeCliente = (id) => data.customers.find(c => c.id === id)?.name || 'Cliente sem nome';
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
    setAGravar(true);
    try {
      const v = await venderPack(venda.packId, venda.customerId, venda.metodo, venda.preco);
      toast.success('Pack vendido', `${nomeCliente(v.customerId)} tem ${v.total} cortes até ${formatDateShortNum(v.validoAte)}.`);
      setVendaModal(false);
      carregar();
      if (tab !== 'clientes') navigate('/admin/packs/clientes');
    } catch (e) { toast.error('Não foi possível vender', e.message); }
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

  const accoes = !ligado ? null : tab === 'packs'
    ? <Button variant="primary" onClick={abrirNovoPack}><Plus size={16} /> Novo pack</Button>
    : <Button variant="primary" onClick={() => abrirVenda()} disabled={!packs.some(p => p.ativo)}><ShoppingBag size={16} /> Vender pack</Button>;

  return (
    <AdminPage
      title={tab === 'packs' ? 'Packs' : 'Clientes com pack'}
      subtitle={tab === 'packs'
        ? 'Cortes pagos à cabeça. O cliente vai marcando pela app, e cada marcação gasta um.'
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
      </Card>

      <div style={{ opacity: ligado ? 1 : 0.45, pointerEvents: ligado ? 'auto' : 'none', transition: 'opacity .2s' }}>

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
                  {transitaTexto(p.transitaMeses)}.
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
          <label className="label">Os cortes que sobram</label>
          <select className="select" value={pack.transitaMeses}
            onChange={e => setPack(f => ({ ...f, transitaMeses: Number(e.target.value) }))}>
            <option value={0}>Perdem-se no fim do mês</option>
            <option value={1}>Passam para o mês seguinte (recomendado)</option>
            <option value={2}>Passam mais 2 meses</option>
            <option value={3}>Passam mais 3 meses</option>
          </select>
          <div className="text-sec text-xs mt-8">
            Vendido hoje, vale até {formatDateShortNum(validadeSeVendidoHoje(pack.transitaMeses))}.
          </div>
        </div>
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
        {packEscolhido && (
          <p className="text-sec text-sm" style={{ lineHeight: 1.55 }}>
            O cliente fica com {packEscolhido.cortes} cortes até {formatDateShortNum(validadeSeVendidoHoje(packEscolhido.transitaMeses))}
            {' '}e vê o saldo na app. Cada marcação com o pack fica a 0 € na agenda — o corte já foi pago agora.
          </p>
        )}
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setVendaModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={gravarVenda} disabled={aGravar}>Registar venda</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}
