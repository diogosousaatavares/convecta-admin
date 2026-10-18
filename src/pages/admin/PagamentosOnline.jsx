import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, ArrowRight, ArrowLeft, X, ChevronRight, CreditCard, Landmark, IdCard, Clock } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import Ajuda from '@/components/admin/Ajuda';
import Toggle from '@/components/admin/Toggle';
import { Button, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';
import { formatPrice } from '@/lib/format';
import { extraAtivo, extraDe, mudarExtra, sufixoPeriodo, textoJuntarExtra } from '@/lib/extras';
import { useConfirmar } from '@/components/ui/Confirmar';
import MetodosPagamento from '@/components/MetodosPagamento';

/*
 * PAGAMENTOS ONLINE — à Fresha (18/10/2026, pedido do Diogo).
 *
 * Dois ecrãs, conforme o estado:
 *
 *  · AINDA NÃO RECEBE: a página de apresentação (imagem à direita, o que
 *    ganha em três linhas, o que custa, «Começar já» e «Saber mais»). Em
 *    «Começar já» abre o assistente em ecrã inteiro, três passos —
 *    o que é, o que custa, o que precisas — e no fim vai para o Stripe.
 *    Sem o extra (plano Essencial), o último passo junta-o à subscrição.
 *
 *  · JÁ RECEBE: o resumo do dinheiro em cima (este mês, recebes, a caminho
 *    do banco), as escolhas por baixo — Nada / Metade / Tudo num seletor,
 *    «Só fica marcado depois de pagar», os serviços numa linha que abre a
 *    lista (antes eram doze linhas seguidas) —, os últimos pagamentos e a
 *    conta Stripe. Grava sozinho, sem botão Guardar.
 *
 * O dinheiro vai direto para a conta Stripe do negócio (Connect); a
 * Convecta não fica com nada. Funções: pagamentos-ligar (ligar, estado,
 * saldo), pagar-marcacao, stripe-connect-eventos.
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

const ESTADO = { pago: ['Pago', 'var(--success)'], pendente: ['Por pagar', 'var(--warning, #b45309)'], expirou: ['Não pagou', 'var(--text-ter)'], reembolsado: ['Devolvido', 'var(--text-ter)'] };
const MODOS = [['nada', 'Nada'], ['metade', 'Metade'], ['total', 'Tudo']];
const dia = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
const quando = iso => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function PagamentosOnline() {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business?.pagamentosOnline || {};
  const [estado, setEstado] = useState(null);     // { ligado, ativo, dadosEntregues, falta }
  const [erro, setErro] = useState('');
  const [aAbrir, setAAbrir] = useState(false);
  const servicosPagaveis = (data.services || []).filter(s => s.isActive && !s.orcamento && Number(s.price) > 0);
  const modoDe = m => (m === 'sinal' ? 'metade' : m || 'nada');   // o antigo «sinal» passa a «metade»
  const [modo, setModo] = useState(modoDe(cfg.modo));
  const [escolhidos, setEscolhidos] = useState(null);             // null = todos
  const [obrigatorio, setObrigatorio] = useState(cfg.obrigatorio !== false);
  const [lista, setLista] = useState([]);
  const [saldo, setSaldo] = useState(null);
  const [assistente, setAssistente] = useState(false);
  const [verServicos, setVerServicos] = useState(false);
  const [verModo, setVerModo] = useState(false);
  const [verDinheiro, setVerDinheiro] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [verTaxas, setVerTaxas] = useState(false);
  const [aJuntar, setAJuntar] = useState(false);
  const [pedir, Confirmacao] = useConfirmar();

  useEffect(() => {
    setModo(modoDe(cfg.modo));
    setEscolhidos(Array.isArray(cfg.servicos) ? cfg.servicos : null);
    setObrigatorio(cfg.obrigatorio !== false);
  }, [cfg.modo, cfg.servicos, cfg.obrigatorio]);

  useEffect(() => {
    invocar({ acao: 'estado' }).then(est => {
      setEstado(est);
      if (est?.ligado) invocar({ acao: 'saldo' }).then(setSaldo).catch(() => setSaldo(null));
    }).catch(e => { setErro(e.message); setEstado({ ligado: false, ativo: false }); });
    supabase.from('pagamentos_online').select('id, valor_cents, tipo, estado, criado_em, pago_em')
      .order('criado_em', { ascending: false }).limit(10)
      .then(({ data: l }) => setLista(l || []));
  }, []);

  const temExtra = !data.business || extraAtivo(data.business, 'pagamentos');
  const ativo = !!estado?.ativo;
  const marcado = id => escolhidos == null || escolhidos.includes(id);
  const nEscolhidos = servicosPagaveis.filter(s => marcado(s.id)).length;

  const ligar = async () => {
    setAAbrir(true); setErro('');
    try { const r = await invocar({ acao: 'ligar' }); window.location.href = r.url; }
    catch (e) { setErro(e.message); setAAbrir(false); toast.error('Não foi possível abrir o Stripe', e.message); }
  };

  // Grava sozinho a cada escolha (como as Notificações): sem botão Guardar.
  const gravar = async (mudancas) => {
    const novo = { modo, servicos: escolhidos, obrigatorio, ...mudancas };
    if (novo.modo !== 'nada' && Array.isArray(novo.servicos) && novo.servicos.length === 0) {
      toast.error('Escolhe pelo menos um serviço'); return;
    }
    if ('modo' in mudancas) setModo(novo.modo);
    if ('servicos' in mudancas) setEscolhidos(novo.servicos);
    if ('obrigatorio' in mudancas) setObrigatorio(novo.obrigatorio);
    try {
      await dataService.updateBusiness({ pagamentosOnline: { modo: novo.modo, servicos: novo.modo === 'nada' ? null : novo.servicos, obrigatorio: novo.obrigatorio } });
      toast.success('Guardado');
    } catch (e) { toast.error('Não ficou gravado', e.message); }
  };
  const alternar = id => {
    const atual = escolhidos == null ? servicosPagaveis.map(s => s.id) : escolhidos;
    const novo = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id];
    setEscolhidos(servicosPagaveis.every(s => novo.includes(s.id)) ? null : novo);
  };

  // Sem o extra: junta-se à subscrição (pergunta com a conta ao mês e à semana).
  const periodo = ['anual', 'quinzenal'].includes(data.business?.billingPeriod) ? data.business.billingPeriod : 'mensal';
  const extra = extraDe('pagamentos');
  const juntar = () => pedir({
    titulo: 'Juntar os pagamentos online?',
    texto: textoJuntarExtra(extra, periodo, formatPrice),
    botao: 'Sim, juntar',
    perigoso: false,
    aoConfirmar: async () => {
      setAJuntar(true);
      try { await mudarExtra('pagamentos', true); toast.success('Pagamentos online juntos à subscrição'); setTimeout(() => window.location.reload(), 700); }
      catch (err) { toast.error('Não foi possível', err.message); setAJuntar(false); throw err; }
    },
  });

  /* ── AINDA NÃO RECEBE: a apresentação ─────────────────────────────── */
  if (!ativo) {
    const continuarNoStripe = estado?.ligado;
    return (
      <AdminPage title="Pagamentos online">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <section className="po-hero">
          <div className="po-hero-texto">
            <div className="po-selo"><span><CreditCard size={16} /></span>Pagamentos online</div>
            <h2 className="po-h">O cliente paga ao marcar. Acabam as faltas.</h2>
            <ul className="po-checks">
              <li><Check size={17} /> Metade ou o serviço todo, só nos serviços que escolheres</li>
              <li><Check size={17} /> Cartão, Apple Pay, Google Pay e MB WAY</li>
              <li><Check size={17} /> O dinheiro vai para o teu banco. A Convecta não fica com nada</li>
            </ul>
            <div className="po-preco">1,5 % + 0,25 € por pagamento</div>
            {!temExtra && <div className="po-preco-sub">+{formatPrice(extra.precos[periodo])}{sufixoPeriodo(periodo)} na subscrição · incluído no Profissional e Business</div>}
            {erro && <div className="text-sm" style={{ color: 'var(--error)', marginTop: 10 }}>{erro}</div>}
            <div className="po-acoes">
              <button type="button" className="po-btn" disabled={!estado || aAbrir}
                onClick={() => (continuarNoStripe ? ligar() : setAssistente(true))}>
                {!estado ? 'A ver…' : aAbrir ? 'A abrir o Stripe…' : continuarNoStripe ? 'Continuar no Stripe' : 'Começar já'}
              </button>
              <a className="po-link" href="https://convecta.pt/pagamentos-online" target="_blank" rel="noreferrer">Saber mais</a>
            </div>
            <MetodosPagamento altura={16} style={{ marginTop: 22 }} />
          </div>
          <div className="po-hero-img"><img src="/pagamentos/pagamentos-online-capa-v1-900.jpg" alt="" /></div>
        </section>

        {assistente && (
          <Assistente
            fechar={() => setAssistente(false)}
            temExtra={temExtra} juntar={juntar} aJuntar={aJuntar}
            irStripe={ligar} aAbrir={aAbrir}
            precoExtra={`+${formatPrice(extra.precos[periodo])}${sufixoPeriodo(periodo)}`}
          />
        )}
        <Confirmacao />
      </AdminPage>
    );
  }

  /* ── JÁ RECEBE: o painel (v2, 18/10/2026) ───────────────────────────
     Como as definições da Fresha: um número grande em cima (o que recebes),
     e por baixo poucas linhas, cada uma com o valor à direita e uma seta —
     tocar abre o detalhe. Nada de listas compridas na página. */
  const proximo = saldo?.aCaminho?.[0];
  const MODO_NOME = { nada: 'Nada', metade: 'Metade', total: 'Tudo' };
  // Um pedido de pagamento que ficou por pagar mais de 35 min já não é
  // «por pagar»: a hora foi libertada.
  const estadoDe = p => (p.estado === 'pendente' && Date.now() - new Date(p.criado_em).getTime() > 35 * 60000 ? 'expirou' : p.estado);
  const linha = (rotulo, valor, onClick, extraRotulo) => (
    <button type="button" className="nt-row po-linha-botao" onClick={onClick}>
      <span className="nt-txt"><b className="po-nowrap">{rotulo}{extraRotulo}</b></span>
      <span className="text-sec po-nowrap po-valor">{valor}</span>
      <ChevronRight size={18} className="po-seta" />
    </button>
  );
  const ligacao = (rotulo, valor, href) => (
    <a className="nt-row po-linha-botao" href={href} target="_blank" rel="noreferrer">
      <span className="nt-txt"><b className="po-nowrap">{rotulo}</b></span>
      <span className="text-sec po-nowrap po-valor">{valor}</span>
      <ExternalLink size={16} className="po-seta" />
    </a>
  );
  return (
    <AdminPage title="Pagamentos online">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="po-pagina">
        {/* O dinheiro */}
        <div className="po-resumo">
          <span className="po-ligados"><Check size={15} /> Pagamentos ligados</span>
          <span className="po-rotulo">Recebes este mês</span>
          <b className="po-grande">{saldo ? formatPrice(saldo.mes.liquido) : '—'}</b>
          <span className="po-sub">{saldo ? `${saldo.mes.pagamentos} ${saldo.mes.pagamentos === 1 ? 'pagamento' : 'pagamentos'} · ${formatPrice(saldo.mes.bruto)} pagos · Stripe ${formatPrice(saldo.mes.taxas)}` : 'A ler o Stripe…'}</span>
        </div>
        <div className="nt-lista">
          {saldo && linha('Próximo depósito', proximo ? `${formatPrice(proximo.valor)} · ${dia(proximo.dia)}` : 'Nada a caminho', () => setVerDinheiro(true))}
          {saldo && !saldo.automatico && (
            <a className="nt-row po-linha-botao po-alerta" href="https://dashboard.stripe.com/balance/overview" target="_blank" rel="noreferrer">
              <span className="nt-txt"><b className="po-nowrap">Ligar os depósitos automáticos</b></span>
              <ExternalLink size={16} className="po-seta" />
            </a>
          )}
        </div>

        {/* As escolhas */}
        <div className="nt-titulo">Ao marcar</div>
        <div className="nt-lista">
          {linha('O cliente paga', MODO_NOME[modo], () => setVerModo(true))}
          {modo !== 'nada' && (
            <>
              {linha('Serviços', escolhidos == null ? `Todos (${servicosPagaveis.length})` : `${nEscolhidos} de ${servicosPagaveis.length}`, () => setVerServicos(true))}
              <div className="nt-row">
                <span className="nt-txt"><b className="po-nowrap">Só marca depois de pagar <Ajuda titulo="Pagar para marcar" texto={<>
                  <p><b>Ligado:</b> sem pagamento não há marcação, e a hora continua livre.</p>
                  <p><b>Desligado:</b> o cliente escolhe «Pagar já» ou «Pagar na loja».</p>
                </>} /></b></span>
                <Toggle checked={obrigatorio} onChange={v => gravar({ obrigatorio: v })} />
              </div>
            </>
          )}
        </div>

        {/* Pagamentos */}
        {lista.length > 0 && (
          <>
            <div className="nt-titulo">Pagamentos</div>
            <div className="nt-lista">
              {lista.slice(0, 3).map(p => {
                const [l, cor] = ESTADO[estadoDe(p)] || [p.estado, 'var(--text-sec)'];
                return (
                  <div key={p.id} className="nt-row">
                    <span className="nt-txt"><b className="po-nowrap">{formatPrice(p.valor_cents / 100)}</b><span className="po-nowrap">{quando(p.pago_em || p.criado_em)}</span></span>
                    <span className="fw-600 text-sm po-nowrap" style={{ color: cor }}>{l}</span>
                  </div>
                );
              })}
              {lista.length > 3 && linha('Ver todos', `${lista.length}`, () => setVerTodos(true))}
            </div>
          </>
        )}

        {/* A conta */}
        <div className="nt-titulo">Conta Stripe</div>
        <div className="nt-lista">
          {linha('O que o Stripe cobra', '1,5 % + 0,25 €', () => setVerTaxas(true))}
          {ligacao('MB WAY', 'Ligar no Stripe', 'https://dashboard.stripe.com/settings/payment_methods')}
          {ligacao('Abrir o Stripe', 'IBAN, depósitos', 'https://dashboard.stripe.com/')}
        </div>
      </div>

      {/* O que o cliente paga */}
      <Modal open={verModo} onClose={() => setVerModo(false)} title="O cliente paga ao marcar">
        <div className="nt-lista">
          {[['nada', 'Nada', 'Paga na loja, como hoje.'], ['metade', 'Metade', 'Metade ao marcar, o resto na loja.'], ['total', 'Tudo', 'O serviço todo ao marcar.']].map(([v, t, d]) => (
            <label key={v} className="nt-row" style={{ cursor: 'pointer' }}>
              <span className="nt-txt"><b>{t}</b><span>{d}</span></span>
              <input type="radio" name="modo" checked={modo === v} onChange={() => { gravar({ modo: v }); setVerModo(false); }} style={{ width: 20, height: 20, accentColor: 'var(--gold)' }} />
            </label>
          ))}
        </div>
        <MetodosPagamento altura={14} style={{ marginTop: 14 }} />
      </Modal>

      {/* Serviços */}
      <Modal open={verServicos} onClose={() => { setVerServicos(false); gravar({ servicos: escolhidos }); }} title="Em que serviços"
        footer={<div className="botoes-iguais"><Button onClick={() => { setVerServicos(false); gravar({ servicos: escolhidos }); }}>Feito</Button></div>}>
        <div className="nt-lista">
          <label className="nt-row" style={{ cursor: 'pointer' }}>
            <span className="nt-txt"><b>Todos os serviços</b></span>
            <Toggle checked={escolhidos == null} onChange={v => setEscolhidos(v ? null : [])} />
          </label>
          {servicosPagaveis.map(s => (
            <label key={s.id} className="nt-row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={marcado(s.id)} onChange={() => alternar(s.id)} style={{ width: 18, height: 18, accentColor: 'var(--gold)', flexShrink: 0 }} />
              <span className="nt-txt" style={{ minWidth: 0 }}><b className="po-nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</b></span>
              <span className="text-sec text-sm po-nowrap">{marcado(s.id) ? formatPrice(modo === 'metade' ? Math.round(s.price * 50) / 100 : s.price) : 'na loja'}</span>
            </label>
          ))}
        </div>
      </Modal>

      {/* O dinheiro, em detalhe */}
      <Modal open={verDinheiro} onClose={() => setVerDinheiro(false)} title="O teu dinheiro">
        {saldo && (
          <div className="nt-lista">
            <div className="nt-row"><span className="nt-txt"><b>Pago este mês</b></span><span className="fw-600 po-nowrap">{formatPrice(saldo.mes.bruto)}</span></div>
            <div className="nt-row"><span className="nt-txt"><b>Ficou para o Stripe</b></span><span className="fw-600 po-nowrap">{formatPrice(saldo.mes.taxas)}</span></div>
            <div className="nt-row"><span className="nt-txt"><b>Recebes</b></span><span className="fw-600 po-nowrap" style={{ color: 'var(--success)' }}>{formatPrice(saldo.mes.liquido)}</span></div>
            {saldo.aCaminho.map(c => (
              <div key={c.dia} className="nt-row"><span className="nt-txt"><b>A caminho do banco</b></span><span className="fw-600 po-nowrap">{formatPrice(c.valor)} · {dia(c.dia)}</span></div>
            ))}
            {saldo.disponivel > 0 && <div className="nt-row"><span className="nt-txt"><b>Pronto a ir para o banco</b></span><span className="fw-600 po-nowrap">{formatPrice(saldo.disponivel)}</span></div>}
            {saldo.depositos.map((p, k) => (
              <div key={k} className="nt-row"><span className="nt-txt"><b>{p.estado === 'paid' ? 'Depositado' : 'Depósito a caminho'}</b></span><span className="fw-600 po-nowrap">{formatPrice(p.valor)} · {dia(p.chega)}</span></div>
            ))}
          </div>
        )}
        <p className="text-sec text-sm" style={{ marginTop: 14, lineHeight: 1.55 }}>Nas contas novas o primeiro pagamento espera 7 dias no Stripe. Depois o Stripe deposita todos os dias o que estiver disponível; chega ao banco em 1 a 2 dias úteis.</p>
      </Modal>

      {/* Todos os pagamentos */}
      <Modal open={verTodos} onClose={() => setVerTodos(false)} title="Pagamentos">
        <div className="nt-lista">
          {lista.map(p => {
            const [l, cor] = ESTADO[estadoDe(p)] || [p.estado, 'var(--text-sec)'];
            return (
              <div key={p.id} className="nt-row">
                <span className="nt-txt"><b className="po-nowrap">{formatPrice(p.valor_cents / 100)}</b><span className="po-nowrap">{p.tipo === 'total' ? 'Serviço' : 'Metade'} · {quando(p.pago_em || p.criado_em)}</span></span>
                <span className="fw-600 text-sm po-nowrap" style={{ color: cor }}>{l}</span>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* As taxas */}
      <Modal open={verTaxas} onClose={() => setVerTaxas(false)} title="O que o Stripe cobra">
        <div className="nt-lista">
          <div className="nt-row"><span className="nt-txt"><b>Cartões europeus, Apple Pay, Google Pay, MB WAY</b></span><span className="fw-600 po-nowrap">1,5 % + 0,25 €</span></div>
          <div className="nt-row"><span className="nt-txt"><b>Cartões do Reino Unido</b></span><span className="fw-600 po-nowrap">2,5 % + 0,25 €</span></div>
          <div className="nt-row"><span className="nt-txt"><b>Cartões de fora da Europa</b></span><span className="fw-600 po-nowrap">3,15 % + 0,25 €</span></div>
          <div className="nt-row"><span className="nt-txt"><b>Depósitos para o banco</b></span><span className="fw-600 po-nowrap" style={{ color: 'var(--success)' }}>Grátis</span></div>
          <div className="nt-row"><span className="nt-txt"><b>Convecta</b></span><span className="fw-600 po-nowrap" style={{ color: 'var(--success)' }}>0 %</span></div>
        </div>
        <p className="text-sec text-sm" style={{ marginTop: 14 }}>Num corte de 15 € recebes 14,52 €; em 25 € recebes 24,38 €.</p>
      </Modal>
      <Confirmacao />
    </AdminPage>
  );
}

/* O assistente em ecrã inteiro, como o da Fresha: Fechar e Continuar em
   cima, um passo de cada vez. */
function Assistente({ fechar, temExtra, juntar, aJuntar, irStripe, aAbrir, precoExtra }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const tecla = e => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('keydown', tecla);
    return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', tecla); };
  }, [fechar]);
  const ultimo = i === 2;
  const final = () => (temExtra ? irStripe() : juntar());
  return (
    <div className="po-ass" role="dialog" aria-modal="true" aria-label="Ligar os pagamentos online">
      <div className="po-ass-topo">
        {i > 0 ? <button type="button" className="po-ass-redondo" onClick={() => setI(i - 1)} aria-label="Voltar"><ArrowLeft size={20} /></button> : <span />}
        <div className="po-ass-pontos">{[0, 1, 2].map(k => <span key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="po-ass-botoes">
          <button type="button" className="po-ass-fechar" onClick={fechar}><X size={16} /> Fechar</button>
          <button type="button" className="po-ass-seguinte" disabled={aAbrir || aJuntar}
            onClick={() => (ultimo ? final() : setI(i + 1))}>
            {ultimo ? (aAbrir || aJuntar ? 'A abrir…' : temExtra ? 'Ir para o Stripe' : 'Juntar e continuar') : 'Continuar'} <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div className="po-ass-corpo">
        {i === 0 && (
          <div className="po-ass-duas">
            <h2>Recebe ao marcar, de forma rápida e segura</h2>
            <div className="po-ass-lista">
              <div><span className="po-ass-ico"><CreditCard size={22} /></span><div><h3>O cliente paga ao marcar</h3><p>Metade ou o serviço todo. Sem pagamento, não há marcação — acabam as faltas.</p></div></div>
              <div><span className="po-ass-ico"><Landmark size={22} /></span><div><h3>O dinheiro é teu</h3><p>Vai direto para a tua conta Stripe e daí para o teu banco. A Convecta não fica com nada.</p></div></div>
            </div>
          </div>
        )}
        {i === 1 && (
          <div className="po-ass-meio">
            <h2>O que custa</h2>
            <div className="po-ass-tabela">
              <div><span><b>Depósitos para o teu banco</b>Todos os dias, sozinhos</span><em className="gratis">Grátis</em></div>
              <div><span><b>Cartões europeus, Apple Pay, Google Pay, MB WAY</b>Por pagamento</span><em>1,5 % + 0,25 €</em></div>
              <div><span><b>Cartões do Reino Unido</b>Por pagamento</span><em>2,5 % + 0,25 €</em></div>
              <div><span><b>Cartões de fora da Europa</b>Por pagamento</span><em>3,15 % + 0,25 €</em></div>
              <div><span><b>Convecta</b>Não ficamos com nada</span><em className="gratis">0 %</em></div>
              {!temExtra && <div><span><b>Na tua subscrição</b>Incluído no Profissional e Business</span><em>{precoExtra}</em></div>}
            </div>
            <p className="po-ass-nota">Num corte de 15 € recebes 14,52 €. Preços do Stripe para Portugal.</p>
          </div>
        )}
        {i === 2 && (
          <div className="po-ass-meio">
            <h2>O que vais precisar</h2>
            <div className="po-ass-tabela">
              <div><span className="po-ass-com-ico"><Clock size={20} /><span><b>5 minutos</b>Uma vez, e fica feito</span></span></div>
              <div><span className="po-ass-com-ico"><IdCard size={20} /><span><b>Cartão de cidadão e NIF</b>O Stripe pode pedir uma foto do cartão</span></span></div>
              <div><span className="po-ass-com-ico"><Landmark size={20} /><span><b>O IBAN</b>Da conta onde queres receber</span></span></div>
            </div>
            <p className="po-ass-nota">No Stripe: tipo de empresa «Empresário em nome individual» (ou «Sociedade» se tens empresa), e no site o endereço da tua app de marcações. No fim volta sozinho para aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.po-nowrap { white-space: nowrap; }
/* Apresentação */
.po-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 36px; align-items: center; max-width: 1100px; }
.po-selo { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: var(--text); }
.po-selo > span { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--gold); color: #111; }
.po-h { font-family: var(--font-head); font-weight: 700; font-size: clamp(28px, 3.6vw, 44px); line-height: 1.08; margin: 18px 0 16px; text-wrap: balance; color: var(--text); }
.po-checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.po-checks li { display: flex; gap: 10px; align-items: flex-start; font-size: 16px; color: var(--text); line-height: 1.4; }
.po-checks svg { flex-shrink: 0; margin-top: 2px; color: var(--gold-tinta); }
.po-preco { margin-top: 24px; font-size: 22px; font-weight: 700; color: var(--text); white-space: nowrap; }
.po-preco-sub { margin-top: 4px; font-size: 14px; color: var(--text-sec); }
.po-acoes { display: flex; gap: 22px; align-items: center; margin-top: 22px; flex-wrap: wrap; }
.po-btn { min-height: 52px; padding: 0 30px; border-radius: 999px; border: 0; cursor: pointer; font: inherit; font-size: 16px; font-weight: 700; background: var(--text); color: var(--surface); }
.po-btn:disabled { opacity: .6; cursor: default; }
.po-link { font-weight: 700; color: var(--text); text-decoration: none; border-bottom: 2px solid var(--gold); padding: 3px 0; }
.po-hero-img img { display: block; width: 100%; height: auto; border-radius: 22px; box-shadow: 0 22px 60px rgba(0,0,0,.22); }
@media (max-width: 860px) {
  .po-hero { grid-template-columns: 1fr; gap: 22px; }
  .po-hero-img { order: -1; }
  .po-btn { flex: 1; }
}
/* Painel */
.po-pagina { max-width: 760px; }
.po-estado { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 14px; }
.po-estado-t { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 17px; white-space: nowrap; }
.po-estado-t svg { color: var(--success); }
.po-numeros { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.po-numeros > div { display: grid; gap: 3px; padding: 16px 14px 16px 0; min-width: 0; }
.po-numeros > div + div { padding-left: 16px; border-left: 1px solid var(--border); }
.po-numeros span { font-size: 13.5px; color: var(--text-sec); white-space: nowrap; }
.po-numeros b { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.po-numeros small { font-size: 13px; color: var(--text-ter); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 1em; }
.po-aviso { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); font-weight: 600; color: var(--warning, #b45309); }
.po-seletor { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 999px; background: var(--elevated); border: 1px solid var(--border); max-width: 420px; margin-bottom: 6px; }
.po-seletor button { min-height: 42px; border: 0; border-radius: 999px; background: transparent; color: var(--text-sec); font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.po-seletor button.on { background: var(--text); color: var(--surface); }
.po-linha-botao { width: 100%; background: none; border-left: 0; border-right: 0; border-top: 0; cursor: pointer; font: inherit; color: inherit; text-align: left; }
@media (max-width: 767px) {
  .po-numeros b { font-size: 19px; }
  .po-numeros > div + div { padding-left: 10px; }
  .po-numeros > div { padding-right: 8px; }
  .po-seletor { max-width: none; }
}
/* Assistente em ecrã inteiro */
.po-ass { position: fixed; inset: 0; z-index: 1000; background: var(--bg); color: var(--text); display: flex; flex-direction: column; overflow-y: auto; }
.po-ass-topo { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; padding: 14px 20px; position: sticky; top: 0; background: var(--bg); }
.po-ass-botoes { display: flex; gap: 10px; justify-content: flex-end; }
.po-ass-redondo { width: 46px; height: 46px; border-radius: 999px; border: 1px solid var(--border); background: transparent; color: var(--text); display: grid; place-items: center; cursor: pointer; }
.po-ass-fechar, .po-ass-seguinte { min-height: 46px; padding: 0 20px; border-radius: 999px; font: inherit; font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; }
.po-ass-fechar { background: transparent; color: var(--text); border: 1px solid var(--border); }
.po-ass-seguinte { background: var(--text); color: var(--surface); border: 0; }
.po-ass-seguinte:disabled { opacity: .6; }
.po-ass-pontos { display: flex; gap: 6px; }
.po-ass-pontos span { width: 8px; height: 8px; border-radius: 999px; background: var(--border); }
.po-ass-pontos span.on { background: var(--text); width: 22px; }
.po-ass-corpo { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 24px 48px; }
.po-ass h2 { font-family: var(--font-head); font-weight: 700; font-size: clamp(28px, 4vw, 46px); line-height: 1.08; margin: 0; text-wrap: balance; }
.po-ass-duas { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 56px; align-items: center; max-width: 1100px; width: 100%; }
.po-ass-lista > div { display: flex; gap: 18px; align-items: flex-start; padding: 22px 0; }
.po-ass-lista > div + div { border-top: 1px solid var(--border); }
.po-ass-lista h3 { margin: 0 0 6px; font-size: 20px; }
.po-ass-lista p, .po-ass-nota { margin: 0; color: var(--text-sec); line-height: 1.55; font-size: 15.5px; }
.po-ass-ico { width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; display: grid; place-items: center; background: var(--gold); color: #111; }
.po-ass-meio { width: 100%; max-width: 700px; }
.po-ass-tabela { margin-top: 24px; border: 1px solid var(--border); border-radius: 18px; padding: 6px 22px; background: var(--surface); }
.po-ass-tabela > div { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; }
.po-ass-tabela > div + div { border-top: 1px solid var(--border); }
.po-ass-tabela span { display: grid; gap: 3px; font-size: 14px; color: var(--text-sec); min-width: 0; }
.po-ass-tabela b { font-size: 15.5px; color: var(--text); }
.po-ass-tabela em { font-style: normal; font-weight: 700; white-space: nowrap; color: var(--gold-tinta); }
.po-ass-tabela em.gratis { color: var(--success); }
.po-ass-com-ico { display: flex !important; gap: 14px; align-items: center; }
.po-ass-com-ico > svg { color: var(--gold-tinta); flex-shrink: 0; }
.po-ass-nota { margin-top: 16px; font-size: 14.5px; }
@media (max-width: 767px) {
  .po-ass-topo { grid-template-columns: auto 1fr auto; padding: 12px 14px; }
  .po-ass-pontos { justify-content: center; }
  .po-ass-fechar { padding: 0 12px; }
  .po-ass-fechar svg { display: none; }
  .po-ass-seguinte { padding: 0 16px; }
  .po-ass-duas { grid-template-columns: 1fr; gap: 18px; }
  .po-ass-corpo { align-items: flex-start; padding-top: 8px; }
  .po-ass-tabela { padding: 4px 16px; }
}

/* Painel v2 */
.po-resumo { display: grid; gap: 4px; padding: 6px 0 18px; }
.po-ligados { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--success); margin-bottom: 8px; }
.po-rotulo { font-size: 14px; color: var(--text-sec); }
.po-grande { font-family: var(--font-head); font-size: 44px; line-height: 1.05; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text); }
.po-sub { font-size: 14px; color: var(--text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.po-valor { margin-left: auto; overflow: hidden; text-overflow: ellipsis; }
.po-seta { color: var(--text-ter); flex-shrink: 0; }
a.po-linha-botao { color: inherit; text-decoration: none; }
.po-alerta b { color: var(--warning, #b45309); }
`;
