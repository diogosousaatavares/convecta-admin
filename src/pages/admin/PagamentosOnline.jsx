import React, { useEffect, useState } from 'react';
import { CreditCard, Check, ExternalLink } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';
import { formatPrice } from '@/lib/format';
import { Link } from 'react-router-dom';
import { extraAtivo, extraDe, mudarExtra, sufixoPeriodo } from '@/lib/extras';
import MetodosPagamento from '@/components/MetodosPagamento';

/*
 * PAGAMENTOS ONLINE (13/10/2026, decisão do Diogo).
 *
 * O cliente paga ao marcar — nada, um sinal ou o serviço todo, à escolha do
 * dono. O dinheiro vai direto para a conta Stripe DELE (Stripe Connect): a
 * Convecta não toca no dinheiro nem fica com nada. O Stripe cobra-lhe as
 * taxas dele.
 *
 *   1. Ligar: cria a conta e abre o Stripe para ele pôr os dados e o IBAN.
 *   2. Escolher o que se paga (settings.pagamentosOnline): nada, metade ou
 *      tudo, e em que serviços (15/10/2026). servicos ausente = todos.
 *   3. Ver os últimos pagamentos.
 *
 * Precisa do PAGAMENTOS_ONLINE_2026-10-13.sql e das funções
 * pagamentos-ligar, pagar-marcacao e stripe-connect-eventos.
 */
const invocar = async (corpo) => {
  const { data, error } = await supabase.functions.invoke('pagamentos-ligar', { body: corpo });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context?.json())?.erro || msg; } catch { /* fica a mensagem */ }
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
};

const ESTADO = { pago: ['Pago', 'success'], pendente: ['Por pagar', 'warning'], expirou: ['Não pagou', 'default'], reembolsado: ['Devolvido', 'default'] };

export default function PagamentosOnline() {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business?.pagamentosOnline || {};
  const [estado, setEstado] = useState(null);     // { ligado, ativo, dadosEntregues, falta }
  const [erro, setErro] = useState('');
  const [aAbrir, setAAbrir] = useState(false);
  // Os serviços que se podem pagar online: ativos e com preço.
  const servicosPagaveis = (data.services || []).filter(s => s.isActive && !s.orcamento && Number(s.price) > 0);
  const modoDe = m => (m === 'sinal' ? 'metade' : m || 'nada');   // o antigo «sinal» passa a «metade»
  const [modo, setModo] = useState(modoDe(cfg.modo));
  const [escolhidos, setEscolhidos] = useState(null);             // null = todos
  const [aGravar, setAGravar] = useState(false);
  const [lista, setLista] = useState([]);

  useEffect(() => { setModo(modoDe(cfg.modo)); setEscolhidos(Array.isArray(cfg.servicos) ? cfg.servicos : null); }, [cfg.modo, cfg.servicos]);
  const marcado = id => escolhidos == null || escolhidos.includes(id);
  const alternar = id => {
    const atual = escolhidos == null ? servicosPagaveis.map(s => s.id) : escolhidos;
    const novo = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id];
    setEscolhidos(servicosPagaveis.every(s => novo.includes(s.id)) ? null : novo);
  };

  useEffect(() => {
    invocar({ acao: 'estado' }).then(setEstado).catch(e => { setErro(e.message); setEstado({ ligado: false, ativo: false }); });
    supabase.from('pagamentos_online').select('id, valor_cents, tipo, estado, criado_em, pago_em')
      .order('criado_em', { ascending: false }).limit(20)
      .then(({ data: l }) => setLista(l || []));
  }, []);

  const ligar = async () => {
    setAAbrir(true); setErro('');
    try { const r = await invocar({ acao: 'ligar' }); window.location.href = r.url; }
    catch (e) { setErro(e.message); setAAbrir(false); }
  };

  const guardar = async () => {
    if (modo !== 'nada' && escolhidos != null && escolhidos.length === 0) { toast.error('Escolhe pelo menos um serviço'); return; }
    setAGravar(true);
    try {
      await dataService.updateBusiness({ pagamentosOnline: { modo, servicos: modo === 'nada' ? null : escolhidos } });
      toast.success('Guardado');
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
    finally { setAGravar(false); }
  };

  const ativo = !!estado?.ativo;

  /* É um extra pago (13/10/2026): sem ele, a página mostra o convite. */
  const [aJuntar, setAJuntar] = useState(false);
  if (data.business && !extraAtivo(data.business, 'pagamentos')) {
    const e = extraDe('pagamentos');
    const p = ['anual', 'quinzenal'].includes(data.business.billingPeriod) ? data.business.billingPeriod : 'mensal';
    const juntar = async () => {
      setAJuntar(true);
      try { await mudarExtra('pagamentos', true); toast.success('Pagamentos online ligados'); setTimeout(() => window.location.reload(), 700); }
      catch (err) { toast.error('Não foi possível', err.message); setAJuntar(false); }
    };
    return (
      <AdminPage title="Pagamentos online">
        <Card className="card-pad" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <CreditCard size={24} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="fw-600" style={{ fontSize: 18 }}>Acaba com as faltas</div>
              <p className="text-sec" style={{ margin: '6px 0 0', lineHeight: 1.6 }}>O cliente paga ao marcar. O dinheiro cai na tua conta.</p>
              <MetodosPagamento altura={16} style={{ marginTop: 10 }} />
              <p style={{ margin: '12px 0 0', fontSize: 15 }}>
                <b>+{formatPrice(e.precos[p])}{sufixoPeriodo(p)}</b> na tua subscrição. <span className="text-sec">Incluído nos planos Profissional e Business.</span>
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <Button onClick={juntar} disabled={aJuntar}>{aJuntar ? 'A ligar…' : 'Juntar à subscrição'}</Button>
                <Link className="btn btn-secondary" to="/admin/subscricao">Ver os planos</Link>
              </div>
            </div>
          </div>
        </Card>
      </AdminPage>
    );
  }
  const opcao = (v, titulo, texto) => (
    <label key={v} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <input type="radio" name="modo" checked={modo === v} onChange={() => setModo(v)} style={{ marginTop: 4, accentColor: 'var(--gold)' }} />
      <span style={{ flex: 1 }}>
        <span className="fw-600" style={{ display: 'block' }}>{titulo}</span>
        <span className="text-sec text-sm">{texto}</span>
      </span>
    </label>
  );

  return (
    <AdminPage title="Pagamentos online" subtitle="O cliente paga ao marcar. O dinheiro cai na tua conta.">
      <Card className="card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <CreditCard size={22} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600" style={{ fontSize: 16 }}>
              {!estado ? 'A ver…' : ativo ? 'Pagamentos ligados' : estado.ligado ? 'Falta acabar no Stripe' : '1. Liga a tua conta'}
              {ativo && <Check size={16} style={{ color: 'var(--success)', marginLeft: 6, verticalAlign: -2 }} />}
            </div>
            <div className="text-sec text-sm" style={{ marginTop: 4, lineHeight: 1.55 }}>
              {ativo
                ? 'O dinheiro dos clientes cai na tua conta Stripe e passa para o teu banco. A Convecta não fica com nada; o Stripe cobra a taxa dele por pagamento.'
                : estado?.ligado
                  ? 'A conta está criada, mas o Stripe ainda precisa de alguns dados teus (identificação e IBAN) para poderes receber.'
                  : 'Crias a tua conta no Stripe em 5 minutos: os teus dados e o IBAN para onde vai o dinheiro. A Convecta não toca no dinheiro.'}
            </div>
            <MetodosPagamento altura={14} style={{ marginTop: 12 }} />
            {erro && <div className="text-sm" style={{ color: 'var(--error)', marginTop: 8 }}>{erro}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {!ativo && estado && (
                <Button onClick={ligar} disabled={aAbrir}>{aAbrir ? 'A abrir o Stripe…' : estado.ligado ? 'Continuar no Stripe' : 'Ligar pagamentos'}</Button>
              )}
              {estado?.ligado && (
                <a className="btn btn-secondary" href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Abrir o meu Stripe <ExternalLink size={14} />
                </a>
              )}
            </div>
            {estado?.ligado && (
              <div className="text-sec text-xs" style={{ marginTop: 10, lineHeight: 1.55 }}>
                Para aceitar MB WAY: no teu Stripe, Definições › Métodos de pagamento › ligar o MB WAY.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="card-pad" style={{ marginBottom: 16, opacity: ativo ? 1 : 0.55 }}>
        <div className="fw-600" style={{ fontSize: 16, marginBottom: 4 }}>{ativo ? 'O que o cliente paga ao marcar' : '2. O que o cliente paga ao marcar'}</div>
        {!ativo && <div className="text-sec text-sm" style={{ marginBottom: 6 }}>Fica disponível quando os pagamentos estiverem ligados.</div>}
        <div style={{ pointerEvents: ativo ? 'auto' : 'none' }}>
          {opcao('nada', 'Nada', 'O cliente paga na loja, como hoje.')}
          {opcao('metade', 'Metade', 'Paga metade ao marcar e o resto na loja. Acaba com as faltas.')}
          {opcao('total', 'Tudo', 'Paga o serviço todo ao marcar.')}
          {modo !== 'nada' && servicosPagaveis.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="fw-600" style={{ marginBottom: 2 }}>Em que serviços?</div>
              <div className="text-sec text-sm" style={{ marginBottom: 6 }}>Os que não marcares pagam-se na loja.</div>
              {servicosPagaveis.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={marcado(s.id)} onChange={() => alternar(s.id)} style={{ width: 18, height: 18, accentColor: 'var(--gold)' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>{s.name}</span>
                  <span className="text-sec text-sm" style={{ whiteSpace: 'nowrap' }}>
                    {marcado(s.id) ? `paga ${formatPrice(modo === 'metade' ? Math.round(s.price * 50) / 100 : s.price)} ao marcar` : 'na loja'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <Button onClick={guardar} disabled={!ativo || aGravar} style={{ marginTop: 14 }}>{aGravar ? 'A guardar…' : 'Guardar'}</Button>
      </Card>

      {lista.length > 0 && (
        <Card className="card-pad">
          <div className="fw-600" style={{ fontSize: 16, marginBottom: 8 }}>Últimos pagamentos</div>
          {lista.map(p => {
            const [l, v] = ESTADO[p.estado] || [p.estado, 'default'];
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="fw-600">{formatPrice(p.valor_cents / 100)}</span>
                  <span className="text-sec text-sm"> · {p.tipo === 'total' ? 'serviço' : 'metade'} · {new Date(p.pago_em || p.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <Badge variant={v}>{l}</Badge>
              </div>
            );
          })}
        </Card>
      )}
    </AdminPage>
  );
}
