import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, ArrowRight, ArrowLeft, X, ChevronRight, CreditCard, Landmark, IdCard, Clock, Percent } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import BotaoAtualizar from '@/components/admin/BotaoAtualizar';
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
 *    «Começar já» abre o assistente em ecrã inteiro: o que é, três
 *    perguntas (quanto paga, se é obrigatório, em que serviços) e um
 *    resumo com o que vais precisar; grava as respostas e vai para o Stripe.
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
  const [verObrigatorio, setVerObrigatorio] = useState(false);
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
  // As respostas do assistente, gravadas antes de abrir o Stripe.
  const guardarAssistente = async (r) => {
    try {
      await dataService.updateBusiness({ pagamentosOnline: { modo: r.modo, servicos: r.servicos, obrigatorio: r.obrigatorio } });
      setModo(r.modo); setEscolhidos(r.servicos); setObrigatorio(r.obrigatorio);
      return true;
    } catch (e) { toast.error('Não ficou gravado', e.message); return false; }
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
      <AdminLayout>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {/* A capa ocupa tudo e o texto e os botões vivem DENTRO da imagem
            (18/10/2026, pedido do Diogo). Estilo Convecta (preto quente e
            dourado) nos dois temas, por isso as cores aqui são fixas. */}
        <section className="po-capa po-capa-cheia">
          {/* O título e o Atualizar vivem dentro da imagem (pedido do Diogo). */}
          <div className="po-capa-cabeca">
            <div className="po-capa-titulo"><h1>Pagamentos online</h1><PageInfo /></div>
            <BotaoAtualizar />
          </div>
          <picture>
            <source media="(max-width: 767px)" srcSet="/pagamentos/pagamentos-online-capa-v3-telemovel.jpg" />
            <img src="/pagamentos/pagamentos-online-capa-v3-1200.jpg" srcSet="/pagamentos/pagamentos-online-capa-v3-1200.jpg 1200w, /pagamentos/pagamentos-online-capa-v3.jpg 2400w" sizes="(max-width: 1100px) 100vw, 1100px" alt="" />
          </picture>
          <div className="po-capa-texto">
                        <h2 className="po-h">O cliente paga ao marcar. <em>Acabam as faltas.</em></h2>
            <ul className="po-checks">
              <li><Check size={17} /> Metade ou o serviço todo, só nos serviços que escolheres</li>
              <li><Check size={17} /> Cartão, Apple Pay, Google Pay e MB WAY</li>
              <li><Check size={17} /> O dinheiro vai direto para o teu banco</li>
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
            <div className="po-capa-stripe"><span>Pagamentos seguros com <b>Stripe</b></span><MetodosPagamento altura={15} /></div>
          </div>
        </section>

        {assistente && (
          <Assistente
            fechar={() => setAssistente(false)}
            temExtra={temExtra} juntar={juntar} aJuntar={aJuntar}
            irStripe={ligar} aAbrir={aAbrir}
            precoExtra={`+${formatPrice(extra.precos[periodo])}${sufixoPeriodo(periodo)}`}
            servicos={servicosPagaveis.map(sv => ({ ...sv, price: Number(sv.price) }))}
            inicial={{ modo, obrigatorio, servicos: escolhidos }}
            guardar={guardarAssistente}
          />
        )}
        <Confirmacao />
      </AdminLayout>
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
          {/* Até ao primeiro depósito chegar: um aviso calmo, numa linha. */}
          {saldo && !saldo.depositos.some(p => p.estado === 'paid') && (
            <div className="po-primeiro"><Clock size={15} /><span>O primeiro depósito demora 7 dias. Depois é todos os dias.</span></div>
          )}
          {saldo && !saldo.automatico && (
            <a className="nt-row po-linha-botao po-alerta" href="https://dashboard.stripe.com/balance/overview" target="_blank" rel="noreferrer">
              <span className="nt-txt"><b className="po-nowrap">Ligar os depósitos automáticos</b></span>
              <ExternalLink size={16} className="po-seta" />
            </a>
          )}
        </div>

        {/* As regras: o que ELE decide, aqui (18/10/2026). Separado do que
            se muda no Stripe, lá em baixo. */}
        <div className="nt-titulo po-titulo-sec"><span>As tuas regras</span><em>mudas aqui</em></div>
        <div className="nt-lista">
          {linha('Quanto pagam ao marcar', MODO_NOME[modo], () => setVerModo(true))}
          {modo !== 'nada' && (
            <>
              {linha('Pagamento', obrigatorio ? 'Obrigatório' : 'Opcional', () => setVerObrigatorio(true))}
              {linha('Em que serviços', escolhidos == null ? `Todos (${servicosPagaveis.length})` : `${nEscolhidos} de ${servicosPagaveis.length}`, () => setVerServicos(true))}
            </>
          )}
        </div>

        {/* Pagamentos */}
        {lista.length > 0 && (
          <>
            <div className="nt-titulo">Pagamentos recebidos</div>
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
        <div className="nt-titulo po-titulo-sec"><span>Conta Stripe</span><em>mudas no Stripe</em></div>
        <div className="nt-lista">
          {linha('O que o Stripe cobra', '1,5 % + 0,25 €', () => setVerTaxas(true))}
          {ligacao('MB WAY', 'Ligar no Stripe', 'https://dashboard.stripe.com/settings/payment_methods')}
          {ligacao('Abrir o Stripe', 'IBAN, depósitos', 'https://dashboard.stripe.com/')}
        </div>
      </div>

      {/* O que o cliente paga */}
      <Modal open={verModo} onClose={() => setVerModo(false)} title="O cliente paga ao marcar">
        <div className="po-escolhas">
          {[['nada', 'Nada', 'Paga tudo na loja, como hoje.'], ['metade', 'Metade', 'Metade ao marcar, o resto na loja.'], ['total', 'Tudo', 'O serviço todo ao marcar. Na loja não paga nada.']].map(([v, t, d]) => (
            <button key={v} type="button" className={`po-escolha${modo === v ? ' on' : ''}`} onClick={() => { gravar({ modo: v }); setVerModo(false); }}>
              <span className="po-escolha-bola">{modo === v && <Check size={14} />}</span>
              <span><b>{t}</b><span>{d}</span></span>
            </button>
          ))}
        </div>
        <MetodosPagamento altura={14} style={{ marginTop: 14 }} />
      </Modal>

      {/* Obrigatório ou opcional — as duas escolhas, ditas por extenso */}
      <Modal open={verObrigatorio} onClose={() => setVerObrigatorio(false)} title="O pagamento é…">
        <div className="po-escolhas">
          {[[true, 'Obrigatório', 'O cliente paga ao marcar. Sem pagar, não há marcação e a hora continua livre. Acaba com as faltas.'],
            [false, 'Opcional', 'O cliente escolhe «Pagar já» ou «Pagar na loja». A marcação fica sempre.']].map(([v, t, d]) => (
            <button key={t} type="button" className={`po-escolha${obrigatorio === v ? ' on' : ''}`} onClick={() => { gravar({ obrigatorio: v }); setVerObrigatorio(false); }}>
              <span className="po-escolha-bola">{obrigatorio === v && <Check size={14} />}</span>
              <span><b>{t}</b><span>{d}</span></span>
            </button>
          ))}
        </div>
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

/* O assistente em ecrã inteiro, como o da Fresha (18/10/2026, pedido do
   Diogo): antes de ir para o Stripe, três perguntas rápidas — quanto paga
   o cliente, se é obrigatório, em que serviços — e um resumo. As respostas
   ficam gravadas antes de abrir o Stripe; só contam quando a conta estiver
   ligada (o servidor e a app do cliente olham para pagamentos_ativos). */
const LIMIARES = [15, 20, 25, 30, 40, 50, 75, 100, 150];
function Assistente({ fechar, temExtra, juntar, aJuntar, irStripe, aAbrir, precoExtra, servicos, inicial, guardar }) {
  const [i, setI] = useState(0);
  const [para, setPara] = useState('frente');
  const [modo, setModo] = useState(inicial.modo === 'metade' || inicial.modo === 'total' ? inicial.modo : null);
  const [obrigatorio, setObrigatorio] = useState(inicial.modo === 'metade' || inicial.modo === 'total' ? inicial.obrigatorio : null);
  const [quais, setQuais] = useState(Array.isArray(inicial.servicos) ? 'escolho' : (inicial.modo === 'metade' || inicial.modo === 'total' ? 'todos' : null));
  const [escolhidos, setEscolhidos] = useState(Array.isArray(inicial.servicos) ? inicial.servicos : []);
  const [aGravar, setAGravar] = useState(false);

  // Os «mais caros»: os limiares que deixam pelo menos um de fora e um dentro.
  const limiares = LIMIARES.filter(t => { const n = servicos.filter(s => s.price >= t).length; return n > 0 && n < servicos.length; }).slice(0, 4);
  const [limiar, setLimiar] = useState(limiares[Math.floor((limiares.length - 1) / 2)] ?? null);
  const caros = limiar == null ? [] : servicos.filter(s => s.price >= limiar).map(s => s.id);

  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const tecla = e => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('keydown', tecla);
    return () => { document.body.style.overflow = antes; window.removeEventListener('keydown', tecla); };
  }, [fechar]);

  const ir = n => { setPara(n < i ? 'tras' : 'frente'); setI(n); };
  const escolherE = (fn, v) => { fn(v); setTimeout(() => ir(i + 1), 230); };   // escolha única: avança sozinho

  const lista = quais === 'todos' ? null : quais === 'caros' ? caros : escolhidos;
  const nServ = lista == null ? servicos.length : lista.length;
  const pode = [true, !!modo, obrigatorio != null, quais != null && nServ > 0, true][i];
  const ultimo = i === 4;

  // Um exemplo com um serviço verdadeiro do negócio (o do meio em preço).
  const ordenados = [...servicos].sort((a, b) => a.price - b.price);
  const ex = ordenados[Math.floor(ordenados.length / 2)];
  const metade = ex ? Math.round(ex.price * 50) / 100 : 0;

  const final = async () => {
    setAGravar(true);
    const ok = await guardar({ modo, obrigatorio, servicos: lista });
    setAGravar(false);
    if (ok) (temExtra ? irStripe() : juntar());
  };
  const ocupado = aAbrir || aJuntar || aGravar;

  const escolha = (on, titulo, texto, onClick, selo) => (
    <button type="button" className={`po-escolha po-escolha-g${on ? ' on' : ''}`} onClick={onClick}>
      <span className="po-escolha-bola">{on && <Check size={14} />}</span>
      <span><b>{titulo}{selo && <i className="po-selo-rec">{selo}</i>}</b><span>{texto}</span></span>
    </button>
  );
  const alternar = id => setEscolhidos(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));
  const nomeQuais = quais === 'todos' ? `Todos (${servicos.length})` : quais === 'caros' ? `A partir de ${limiar} € (${caros.length})` : `${escolhidos.length} de ${servicos.length}`;

  return (
    <div className="po-ass" role="dialog" aria-modal="true" aria-label="Ligar os pagamentos online">
      <div className="po-ass-topo">
        {i > 0 ? <button type="button" className="po-ass-redondo" onClick={() => ir(i - 1)} aria-label="Voltar"><ArrowLeft size={20} /></button> : <span />}
        <div className="po-ass-pontos">{[0, 1, 2, 3, 4].map(k => <span key={k} className={k === i ? 'on' : k < i ? 'feito' : ''} />)}</div>
        <div className="po-ass-botoes">
          <button type="button" className="po-ass-fechar" onClick={fechar}><X size={16} /> Fechar</button>
          <button type="button" className="po-ass-seguinte" disabled={!pode || ocupado}
            onClick={() => (ultimo ? final() : ir(i + 1))}>
            {ultimo ? (ocupado ? 'A abrir…' : temExtra ? 'Ir para o Stripe' : 'Juntar e continuar') : 'Continuar'} <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div className="po-ass-corpo">
        <div key={i} className={`po-ass-passo ${para}`}>
          {i === 0 && (
            <div className="po-ass-duas">
              <div>
                <h2>Recebe ao marcar, de forma rápida e segura</h2>
                <p className="po-ass-lead">Três perguntas e ligamos ao Stripe.</p>
              </div>
              <div className="po-ass-lista">
                <div><span className="po-ass-ico"><CreditCard size={22} /></span><div><h3>O cliente paga ao marcar</h3><p>Metade ou o serviço todo, só nos serviços que escolheres. Acabam as faltas.</p></div></div>
                <div><span className="po-ass-ico"><Landmark size={22} /></span><div><h3>O dinheiro é teu</h3><p>Vai para a tua conta Stripe e daí para o teu banco. A Convecta não fica com nada.</p></div></div>
                <div><span className="po-ass-ico"><Percent size={22} /></span><div><h3>Pagas só quando recebes</h3><p>1,5 % + 0,25 € por pagamento, ao Stripe. Num corte de 15 € recebes 14,52 €.</p></div></div>
              </div>
            </div>
          )}

          {i === 1 && (
            <div className="po-ass-meio">
              <span className="po-ass-num">Pergunta 1 de 3</span>
              <h2>Quanto paga o cliente ao marcar?</h2>
              <div className="po-escolhas po-ass-escolhas">
                {escolha(modo === 'metade', 'Metade', ex ? `${ex.name} ${formatPrice(ex.price)}: paga ${formatPrice(metade)} ao marcar e o resto na loja.` : 'Metade ao marcar, o resto na loja.', () => escolherE(setModo, 'metade'))}
                {escolha(modo === 'total', 'Tudo', ex ? `${ex.name} ${formatPrice(ex.price)}: paga ${formatPrice(ex.price)} ao marcar. Na loja não paga nada.` : 'O serviço todo ao marcar. Na loja não paga nada.', () => escolherE(setModo, 'total'))}
              </div>
            </div>
          )}

          {i === 2 && (
            <div className="po-ass-meio">
              <span className="po-ass-num">Pergunta 2 de 3</span>
              <h2>O cliente é obrigado a pagar?</h2>
              <div className="po-escolhas po-ass-escolhas">
                {escolha(obrigatorio === true, 'Sim, é obrigatório', 'Sem pagar, não fica marcado e a hora continua livre para outro. É o que acaba com as faltas.', () => escolherE(setObrigatorio, true), 'Recomendado')}
                {escolha(obrigatorio === false, 'Não, ele escolhe', 'Aparece «Pagar já» ou «Pagar na loja». A marcação fica sempre, pague ou não.', () => escolherE(setObrigatorio, false))}
              </div>
            </div>
          )}

          {i === 3 && (
            <div className="po-ass-meio">
              <span className="po-ass-num">Pergunta 3 de 3</span>
              <h2>Em que serviços?</h2>
              <div className="po-escolhas po-ass-escolhas">
                {escolha(quais === 'todos', 'Todos os serviços', `Os ${servicos.length} serviços com preço.`, () => escolherE(setQuais, 'todos'))}
                {limiares.length > 0 && escolha(quais === 'caros', 'Só os mais caros', 'Os serviços mais baratos continuam a pagar na loja.', () => setQuais('caros'))}
                {quais === 'caros' && (
                  <div className="po-ass-extra">
                    <div className="po-ass-chips">
                      {limiares.map(t => (
                        <button key={t} type="button" className={`po-chip${limiar === t ? ' on' : ''}`} onClick={() => setLimiar(t)}>A partir de {t} €</button>
                      ))}
                    </div>
                    <div className="po-ass-conta">{caros.length} {caros.length === 1 ? 'serviço' : 'serviços'}: {servicos.filter(s => caros.includes(s.id)).map(s => s.name).join(', ')}</div>
                  </div>
                )}
                {escolha(quais === 'escolho', 'Escolho eu', 'Marcas um a um.', () => setQuais('escolho'))}
                {quais === 'escolho' && (
                  <div className="po-ass-extra po-ass-servicos">
                    {servicos.map(s => (
                      <label key={s.id} className="po-ass-serv">
                        <input type="checkbox" checked={escolhidos.includes(s.id)} onChange={() => alternar(s.id)} />
                        <span className="po-ass-serv-nome">{s.name}</span>
                        <span className="po-ass-serv-preco">{formatPrice(s.price)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {i === 4 && (
            <div className="po-ass-meio">
              <h2>Está tudo. Falta o Stripe.</h2>
              <div className="po-ass-tabela po-ass-resumo">
                <button type="button" onClick={() => ir(1)}><span><b>Quanto paga ao marcar</b></span><em>{modo === 'total' ? 'Tudo' : 'Metade'}</em><ChevronRight size={18} /></button>
                <button type="button" onClick={() => ir(2)}><span><b>Pagamento</b></span><em>{obrigatorio ? 'Obrigatório' : 'Opcional'}</em><ChevronRight size={18} /></button>
                <button type="button" onClick={() => ir(3)}><span><b>Em que serviços</b></span><em>{nomeQuais}</em><ChevronRight size={18} /></button>
              </div>
              <div className="po-primeiro po-primeiro-ass"><Clock size={15} /><span>O primeiro depósito demora 7 dias. Depois é todos os dias.</span></div>
              <h3 className="po-ass-h3">No Stripe vais precisar de</h3>
              <div className="po-ass-tabela">
                <div><span className="po-ass-com-ico"><Clock size={20} /><span><b>5 minutos</b>Uma vez, e fica feito</span></span></div>
                <div><span className="po-ass-com-ico"><IdCard size={20} /><span><b>Cartão de cidadão e NIF</b>O Stripe pode pedir uma foto do cartão</span></span></div>
                <div><span className="po-ass-com-ico"><Landmark size={20} /><span><b>O IBAN</b>Da conta onde queres receber</span></span></div>
              </div>
              <p className="po-ass-nota">
                No Stripe: «Empresário em nome individual» (ou «Sociedade» se tens empresa) e, no site, o endereço da tua app de marcações. No fim volta sozinho para aqui.
                {!temExtra && <> Na tua subscrição: {precoExtra} (incluído no Profissional e Business).</>}
              </p>
            </div>
          )}
        </div>
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

/* Assistente com perguntas (18/10) */
.po-ass-passo { width: 100%; display: flex; justify-content: center; animation: po-passo-frente 260ms cubic-bezier(0.22,1,0.36,1) backwards; }
.po-ass-passo.tras { animation-name: po-passo-tras; }
@keyframes po-passo-frente { from { opacity: 0; transform: translateX(28px); } }
@keyframes po-passo-tras { from { opacity: 0; transform: translateX(-28px); } }
@media (prefers-reduced-motion: reduce) { .po-ass-passo { animation: none; } }
.po-ass-pontos span { transition: width .25s, background .25s; }
.po-ass-pontos span.feito { background: var(--text-ter); }
.po-ass-lead { margin: 14px 0 0; font-size: 17px; color: var(--text-sec); }
.po-ass-num { display: block; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--gold-tinta); margin-bottom: 10px; }
.po-ass-escolhas { margin-top: 24px; gap: 12px; }
.po-escolha-g { padding: 18px; border-radius: 18px; transition: border-color .15s, transform .15s; }
.po-escolha-g:active { transform: scale(.99); }
.po-escolha-g b { font-size: 17px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.po-escolha-g span span { font-size: 15px; }
.po-selo-rec { font-style: normal; font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: var(--gold); color: #111; }
.po-ass-extra { margin: -4px 0 4px 34px; animation: po-passo-frente 220ms ease backwards; }
.po-ass-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
.po-chip { flex-shrink: 0; min-height: 38px; padding: 0 14px; border-radius: 999px; border: 1.5px solid var(--border); background: transparent; color: var(--text); font: inherit; font-weight: 700; font-size: 14px; white-space: nowrap; cursor: pointer; }
.po-chip.on { background: var(--text); color: var(--surface); border-color: var(--text); }
.po-ass-conta { margin-top: 10px; font-size: 14px; color: var(--text-sec); line-height: 1.45; }
.po-ass-servicos { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); max-height: 300px; overflow-y: auto; }
.po-ass-serv { display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; }
.po-ass-serv + .po-ass-serv { border-top: 1px solid var(--border); }
.po-ass-serv input { width: 18px; height: 18px; accent-color: var(--text); flex-shrink: 0; }
.po-ass-serv-nome { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.po-ass-serv-preco { color: var(--text-sec); white-space: nowrap; font-variant-numeric: tabular-nums; }
.po-ass-resumo > button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 16px 0; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.po-ass-resumo > button + button { border-top: 1px solid var(--border); }
.po-ass-resumo > button span { flex: 1; }
.po-ass-resumo > button em { color: var(--text); }
.po-ass-resumo > button svg { color: var(--text-ter); flex-shrink: 0; }
.po-ass-h3 { margin: 26px 0 0; font-size: 17px; }
.po-primeiro { display: flex; align-items: center; gap: 8px; padding: 12px 0; font-size: 14px; color: var(--text-sec); border-bottom: 1px solid var(--border); }
.po-primeiro svg { flex-shrink: 0; color: var(--gold-tinta); }
.po-primeiro span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.po-primeiro-ass { border-bottom: 0; padding: 14px 0 0; }
.po-ass-h3 + .po-ass-tabela { margin-top: 12px; }
@media (max-width: 767px) { .po-ass-extra { margin-left: 0; } .po-ass-lead { font-size: 15.5px; } }

/* Capa v2: a imagem ocupa tudo, o texto por cima */
.po-capa { position: relative; max-width: 1100px; border-radius: 24px; overflow: hidden; isolation: isolate; color: #fff; background: #15120E; box-shadow: 0 18px 50px rgba(0,0,0,.28); }
.po-capa picture, .po-capa img { display: block; width: 100%; height: 100%; }
.po-capa img { object-fit: cover; object-position: right center; min-height: 520px; max-height: min(620px, 74vh); }
.po-capa .po-h { font-size: clamp(30px, 3vw, 42px); margin: 16px 0 14px; }
.po-capa .po-checks li { font-size: 15.5px; white-space: nowrap; }
.po-capa .po-preco { margin-top: 18px; font-size: 20px; }
.po-capa .po-acoes { margin-top: 18px; flex-wrap: nowrap; }
.po-capa .po-btn { white-space: nowrap; }
.po-capa::after { content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; background: linear-gradient(90deg, rgba(21,18,14,.92) 0%, rgba(21,18,14,.7) 38%, rgba(21,18,14,0) 58%); }
.po-capa-texto { position: absolute; z-index: 1; inset: 0; width: min(50%, 500px); padding: 32px 0 32px 44px; display: flex; flex-direction: column; justify-content: center; }
.po-capa .po-selo, .po-capa .po-h, .po-capa .po-checks li, .po-capa .po-preco, .po-capa .po-link { color: #fff; }
.po-capa .po-h em { font-style: italic; color: #C9A227; }
.po-capa .po-checks svg { color: #C9A227; }
.po-capa .po-preco-sub { color: #b8b0a0; }
.po-capa .po-btn { background: #C9A227; color: #15120E; }
.po-capa .po-link { border-bottom-color: #C9A227; }
.po-capa-stripe { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 22px; font-size: 14px; color: #b8b0a0; }
.po-capa-stripe b { color: #fff; font-weight: 800; letter-spacing: -.01em; }
@media (max-width: 767px) {
  .po-capa { border-radius: 20px; }
  .po-capa img { min-height: 0; height: auto; aspect-ratio: 1080 / 1500; max-height: 62vh; object-position: center top; }
  .po-capa .po-checks li { white-space: normal; }
  .po-capa::after { display: none; }
  .po-capa-texto { position: relative; width: auto; inset: auto; margin-top: -150px; padding: 120px 20px 24px; background: linear-gradient(180deg, rgba(21,18,14,0) 0, #15120E 130px); }
  .po-capa .po-h { font-size: 28px; margin: 12px 0 12px; }
  .po-capa .po-checks li { font-size: 15px; }
  .po-capa .po-preco { margin-top: 16px; font-size: 19px; }
  .po-capa .po-acoes { margin-top: 16px; }
  .po-capa-stripe { margin-top: 16px; }
}

/* Capa cheia (18/10): de ponta a ponta, sem espaço à volta, até ao fundo */
.po-capa-cheia { max-width: none; border-radius: 0; box-shadow: none; margin: -28px calc(-1 * var(--pad-lado, 32px)) -40px; width: calc(100% + 2 * var(--pad-lado, 32px)); min-height: calc(100dvh - 56px); }
.po-capa-cheia picture { position: absolute; inset: 0; }
.po-capa-cheia img { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; max-height: none; object-fit: cover; object-position: right center; }
.po-capa-cheia .po-capa-texto { width: min(46%, 560px); padding: 96px 0 48px clamp(32px, 5vw, 80px); }
.po-capa-cheia .po-h { font-size: clamp(34px, 3.6vw, 54px); }
.po-capa-cheia .po-checks li { font-size: 16.5px; }
.po-capa-cabeca { position: absolute; z-index: 2; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 26px clamp(32px, 5vw, 80px) 0; }
.po-capa-titulo { display: flex; align-items: center; gap: 10px; }
.po-capa-titulo h1 { margin: 0; color: #fff; font-family: var(--font-head); font-size: 34px; }
.po-capa-cabeca, .po-capa-cabeca * { color: #e9e3d6; }
.po-capa-cabeca button { background: rgba(255,255,255,.08) !important; border-color: rgba(255,255,255,.22) !important; color: #fff !important; }
@media (max-width: 767px) {
  .po-capa-cheia { margin: 0 calc(-1 * var(--pad-lado, 16px)); min-height: 0; }
  .po-capa-cheia picture, .po-capa-cheia img { position: static; height: auto; }
  .po-capa-cheia img { aspect-ratio: 1080 / 1500; max-height: 62vh; object-position: center top; }
  .po-capa-cabeca { display: none; }
  .po-capa-cheia .po-capa-texto { width: auto; padding: 120px 20px 28px; }
  .po-capa-cheia .po-h { font-size: 30px; }
  .po-capa-cheia .po-checks li { font-size: 15px; }
}

/* Painel v2 */
.po-titulo-sec { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.po-titulo-sec em { font-style: normal; font-weight: 600; letter-spacing: 0; text-transform: none; font-size: 12.5px; color: var(--text-ter); white-space: nowrap; }
.po-escolhas { display: grid; gap: 10px; }
.po-escolha { display: flex; gap: 12px; align-items: flex-start; text-align: left; padding: 14px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--surface); color: var(--text); font: inherit; cursor: pointer; }
.po-escolha.on { border-color: var(--text); }
.po-escolha b { display: block; font-size: 16px; margin-bottom: 3px; }
.po-escolha span span { font-size: 14px; color: var(--text-sec); line-height: 1.45; }
.po-escolha-bola { width: 22px; height: 22px; border-radius: 999px; border: 1.5px solid var(--border); flex-shrink: 0; display: grid; place-items: center; margin-top: 1px; }
.po-escolha.on .po-escolha-bola { background: var(--text); border-color: var(--text); color: var(--surface); }
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
