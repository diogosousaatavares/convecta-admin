import Ajuda from '@/components/admin/Ajuda';
import Toggle from '@/components/admin/Toggle';
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
import { extraAtivo, extraDe, mudarExtra, sufixoPeriodo, textoJuntarExtra } from '@/lib/extras';
import { useConfirmar } from '@/components/ui/Confirmar';
import TutorialStripe from '@/components/admin/TutorialStripe';
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
  // Obrigatório (18/10/2026): sem pagar, a hora não fica — liberta-se sozinha
  // ao fim de 30 minutos. Desligado, o cliente escolhe «Pagar já» ou «Na loja».
  const [obrigatorio, setObrigatorio] = useState(cfg.obrigatorio !== false);
  const [aGravar, setAGravar] = useState(false);
  const [lista, setLista] = useState([]);
  // O dinheiro (18/10/2026): o que entrou, o que o Stripe ficou, o que vai a
  // caminho do banco e quando chega. Lido ao Stripe, na conta do negócio.
  const [saldo, setSaldo] = useState(null);

  useEffect(() => { setModo(modoDe(cfg.modo)); setEscolhidos(Array.isArray(cfg.servicos) ? cfg.servicos : null); setObrigatorio(cfg.obrigatorio !== false); }, [cfg.modo, cfg.servicos, cfg.obrigatorio]);
  const marcado = id => escolhidos == null || escolhidos.includes(id);
  const alternar = id => {
    const atual = escolhidos == null ? servicosPagaveis.map(s => s.id) : escolhidos;
    const novo = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id];
    setEscolhidos(servicosPagaveis.every(s => novo.includes(s.id)) ? null : novo);
  };

  useEffect(() => {
    invocar({ acao: 'estado' }).then(est => {
      setEstado(est);
      if (est?.ligado) invocar({ acao: 'saldo' }).then(setSaldo).catch(() => setSaldo(null));
    }).catch(e => { setErro(e.message); setEstado({ ligado: false, ativo: false }); });
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
      await dataService.updateBusiness({ pagamentosOnline: { modo, servicos: modo === 'nada' ? null : escolhidos, obrigatorio } });
      toast.success('Guardado');
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
    finally { setAGravar(false); }
  };

  const ativo = !!estado?.ativo;

  /* É um extra pago (13/10/2026): sem ele, a página mostra o convite. */
  const [aJuntar, setAJuntar] = useState(false);
  const [pedir, Confirmacao] = useConfirmar();
  const [tutorial, setTutorial] = useState(false);
  if (data.business && !extraAtivo(data.business, 'pagamentos')) {
    const e = extraDe('pagamentos');
    const p = ['anual', 'quinzenal'].includes(data.business.billingPeriod) ? data.business.billingPeriod : 'mensal';
    // 16/10/2026: pergunta de certeza, com a conta ao mês e à semana, antes de cobrar.
    const juntar = () => pedir({
      titulo: 'Juntar os pagamentos online?',
      texto: textoJuntarExtra(e, p, formatPrice),
      botao: 'Sim, juntar',
      perigoso: false,
      aoConfirmar: async () => {
        setAJuntar(true);
        try { await mudarExtra('pagamentos', true); toast.success('Pagamentos online ligados'); setTimeout(() => window.location.reload(), 700); }
        catch (err) { toast.error('Não foi possível', err.message); setAJuntar(false); throw err; }
      },
    });
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
        <Confirmacao />
      </AdminPage>
    );
  }
  /*
   * O desenho (18/10/2026): linhas com separador, como as Definições — sem
   * cartões brancos, sem frases por baixo dos títulos (as explicações estão
   * no (i)), e cada linha numa só linha: o nome à esquerda, o valor ou o
   * botão à direita.
   */
  const dia = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  const valor = (txt, cor) => <span className="fw-600" style={{ whiteSpace: 'nowrap', ...(cor ? { color: cor } : {}) }}>{txt}</span>;
  const opcao = (v, titulo, ajuda) => (
    <label key={v} className="nt-row" style={{ cursor: 'pointer' }}>
      <span className="nt-txt"><b>{titulo} {ajuda && <Ajuda titulo={titulo} texto={<p>{ajuda}</p>} />}</b></span>
      <input type="radio" name="modo" checked={modo === v} onChange={() => setModo(v)} style={{ width: 20, height: 20, accentColor: 'var(--gold)' }} />
    </label>
  );

  return (
    <AdminPage title="Pagamentos online">
      {/* ── A conta Stripe ─────────────────────────────────────────────── */}
      <div className="nt-lista" style={{ maxWidth: 760 }}>
        <div className="nt-row">
          <span className="nt-txt"><b style={{ whiteSpace: 'nowrap' }}>
            {!estado ? 'A ver…' : ativo ? 'Pagamentos ligados' : estado.ligado ? 'Falta acabar no Stripe' : 'Ligar pagamentos'}
            {ativo && <Check size={17} style={{ color: 'var(--success)', marginLeft: 6, verticalAlign: -3 }} />}
            {' '}<Ajuda titulo="Pagamentos online" texto={<>
              <p>O cliente paga ao marcar, com cartão, Apple Pay, Google Pay ou MB WAY. O dinheiro cai na tua conta Stripe e passa para o teu banco. A Convecta não fica com nada.</p>
              {estado?.ligado && !ativo && <p>Falta pores no Stripe a tua identificação e o IBAN.</p>}
            </>} />
          </b></span>
          {!ativo && estado && (
            <Button size="sm" onClick={() => (estado.ligado ? ligar() : setTutorial(true))} disabled={aAbrir}>{aAbrir ? 'A abrir…' : estado.ligado ? 'Continuar no Stripe' : 'Ligar'}</Button>
          )}
          {estado?.ligado && (
            <a className="btn btn-secondary btn-sm" href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              Abrir o Stripe <ExternalLink size={14} />
            </a>
          )}
        </div>
        {erro && <div className="nt-row"><span className="text-sm" style={{ color: 'var(--error)' }}>{erro}</span></div>}
        <div className="nt-row">
          <span className="nt-txt"><b>Formas de pagar</b></span>
          <MetodosPagamento altura={14} />
        </div>
        <div className="nt-row">
          <span className="nt-txt"><b>O que o Stripe cobra <Ajuda titulo="O que o Stripe cobra" texto={<>
            <p>O Stripe fica com <b>1,5 % + 0,25 €</b> por pagamento com cartão europeu, Apple Pay, Google Pay ou MB WAY. Cartões do Reino Unido: 2,5 % + 0,25 €. Cartões de fora da Europa: 3,15 % + 0,25 €.</p>
            <p>Exemplos: num corte de 15 € recebes 14,52 €; em 25 € recebes 24,38 €; em 50 € recebes 49,00 €.</p>
            <p>Passar o dinheiro para o teu banco é grátis. Preços do Stripe para Portugal a 16/10/2026.</p>
          </>} /></b></span>
          {valor('1,5 % + 0,25 €')}
        </div>
        {estado?.ligado && (
          <div className="nt-row">
            <span className="nt-txt"><b>MB WAY <Ajuda titulo="Aceitar MB WAY" texto={<p>No teu Stripe: Definições › Métodos de pagamento › ligar o MB WAY. A partir daí o cliente também vê MB WAY ao pagar. Custa o mesmo que o cartão.</p>} /></b></span>
            <a className="btn btn-ghost btn-sm" href="https://dashboard.stripe.com/settings/payment_methods" target="_blank" rel="noreferrer" style={{ whiteSpace: 'nowrap' }}>Ligar no Stripe</a>
          </div>
        )}
      </div>

      {/* ── O que o cliente paga ───────────────────────────────────────── */}
      <div style={{ maxWidth: 760, opacity: ativo ? 1 : 0.5, pointerEvents: ativo ? 'auto' : 'none' }}>
        <div className="nt-titulo">O que o cliente paga ao marcar</div>
        <div className="nt-lista">
          {opcao('nada', 'Nada', 'O cliente paga na loja, como hoje.')}
          {opcao('metade', 'Metade', 'Paga metade ao marcar e o resto na loja. Acaba com as faltas.')}
          {opcao('total', 'Tudo', 'Paga o serviço todo ao marcar.')}
          {modo !== 'nada' && (
            <div className="nt-row">
              <span className="nt-txt"><b>Só fica marcado depois de pagar <Ajuda titulo="Pagar para marcar" texto={<>
                <p><b>Ligado:</b> o cliente paga ao marcar. Se sair do pagamento sem pagar, não fica marcação nenhuma e a hora continua livre.</p>
                <p><b>Desligado:</b> o cliente escolhe «Pagar já» ou «Pagar na loja». A marcação fica sempre.</p>
              </>} /></b></span>
              <Toggle checked={obrigatorio} onChange={setObrigatorio} />
            </div>
          )}
        </div>

        {modo !== 'nada' && servicosPagaveis.length > 0 && (
          <>
            <div className="nt-titulo">Em que serviços</div>
            <div className="nt-lista">
              {servicosPagaveis.map(s => (
                <label key={s.id} className="nt-row" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={marcado(s.id)} onChange={() => alternar(s.id)} style={{ width: 18, height: 18, accentColor: 'var(--gold)', flexShrink: 0 }} />
                  <span className="nt-txt" style={{ minWidth: 0 }}><b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</b></span>
                  <span className="text-sec text-sm" style={{ whiteSpace: 'nowrap' }}>
                    {marcado(s.id) ? `${formatPrice(modo === 'metade' ? Math.round(s.price * 50) / 100 : s.price)} ao marcar` : 'na loja'}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="botoes-iguais" style={{ marginTop: 16, maxWidth: 320 }}>
          <Button onClick={guardar} disabled={!ativo || aGravar}>{aGravar ? 'A guardar…' : 'Guardar'}</Button>
        </div>
      </div>

      <TutorialStripe aberto={tutorial} fechar={() => setTutorial(false)} continuar={() => { setTutorial(false); ligar(); }} aAbrir={aAbrir} />

      {/* ── O teu dinheiro ─────────────────────────────────────────────── */}
      {saldo?.ligado && (
        <div style={{ maxWidth: 760 }}>
          <div className="nt-titulo">O teu dinheiro <Ajuda titulo="Quando chega ao banco" texto={<>
            <p>Cada pagamento fica uns dias no Stripe antes de passar para o teu banco. Nas contas novas o primeiro espera <b>7 dias</b>; depois o Stripe deposita todos os dias o que já estiver disponível (chega em 1 a 2 dias úteis).</p>
            <p>«Recebes» já tem a comissão do Stripe descontada: é o que vai para o teu IBAN.</p>
          </>} /></div>
          <div className="nt-lista">
            <div className="nt-row"><span className="nt-txt"><b>Este mês</b></span>{valor(`${saldo.mes.pagamentos} ${saldo.mes.pagamentos === 1 ? 'pagamento' : 'pagamentos'} · ${formatPrice(saldo.mes.bruto)}`)}</div>
            <div className="nt-row"><span className="nt-txt"><b>Ficou para o Stripe</b></span>{valor(formatPrice(saldo.mes.taxas))}</div>
            <div className="nt-row"><span className="nt-txt"><b>Recebes</b></span>{valor(formatPrice(saldo.mes.liquido), 'var(--success)')}</div>
            {saldo.aCaminho.map(c => (
              <div key={c.dia} className="nt-row"><span className="nt-txt"><b>A caminho do banco</b></span>{valor(`${formatPrice(c.valor)} · ${dia(c.dia)}`)}</div>
            ))}
            {saldo.disponivel > 0 && (
              <div className="nt-row"><span className="nt-txt"><b>Pronto a ir para o banco</b></span>{valor(formatPrice(saldo.disponivel))}</div>
            )}
            {saldo.depositos.map((p, i) => (
              <div key={i} className="nt-row"><span className="nt-txt"><b>{p.estado === 'paid' ? 'Depositado' : 'Depósito a caminho'}</b></span>{valor(`${formatPrice(p.valor)} · ${dia(p.chega)}`)}</div>
            ))}
            {!saldo.automatico && (
              <div className="nt-row">
                <span className="nt-txt"><b style={{ color: 'var(--warning, #b45309)', whiteSpace: 'nowrap' }}>Depósitos automáticos desligados <Ajuda titulo="Ligar os depósitos" texto={<p>No teu Stripe: Saldos › Depósitos automáticos › «Diariamente». Confirma também que o IBAN está lá. Sem isto, o dinheiro fica no Stripe até o mandares tu para o banco.</p>} /></b></span>
                <a className="btn btn-secondary btn-sm" href="https://dashboard.stripe.com/balance/overview" target="_blank" rel="noreferrer">Ligar</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Últimos pagamentos ─────────────────────────────────────────── */}
      {lista.length > 0 && (
        <div style={{ maxWidth: 760 }}>
          <div className="nt-titulo">Últimos pagamentos</div>
          <div className="nt-lista">
            {lista.map(p => {
              const [l, v] = ESTADO[p.estado] || [p.estado, 'default'];
              const cor = v === 'success' ? 'var(--success)' : v === 'warning' ? 'var(--warning, #b45309)' : 'var(--text-sec)';
              return (
                <div key={p.id} className="nt-row">
                  <span className="nt-txt" style={{ minWidth: 0 }}><b style={{ whiteSpace: 'nowrap' }}>{formatPrice(p.valor_cents / 100)} <span className="text-sec" style={{ fontWeight: 400 }}>· {p.tipo === 'total' ? 'serviço' : 'metade'} · {new Date(p.pago_em || p.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></b></span>
                  <span className="fw-600 text-sm" style={{ color: cor, whiteSpace: 'nowrap' }}>{l}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Confirmacao />
    </AdminPage>
  );
}
