import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CreditCard, Check, ExternalLink, AlertTriangle, Clock,
  ChevronDown, ChevronRight, MessageCircle, Lock, Zap, ShieldCheck, CalendarDays, Headphones, ArrowRight, Receipt, FileDown,
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminLayout from '@/components/AdminLayout';
import { DOMINIO_BASE } from '@/lib/designService';
import { Card, Button, Spinner } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

/*
 * A subscrição da barbearia na Convecta.
 *
 * Nada a ver com o módulo «Assinaturas», que é o clube que a barbearia vende
 * aos clientes dela. Isto é o que ELA nos paga.
 *
 * Dois ecrãs numa página só, conforme o estado:
 *
 *   sem cartão  →  a venda. É o ecrã mais importante do painel: é aqui que
 *                  um barbeiro que já montou a casa decide se a abre.
 *   com cartão  →  o estado da subscrição e um botão para o portal do Stripe.
 *
 * ── Como se vende aqui, e como NÃO se vende ────────────────────────────
 *
 * Vende-se com clareza, não com truques. O que faz um barbeiro tirar o
 * cartão é saber EXACTAMENTE três coisas: o que paga hoje (nada), o que paga
 * e quando (o plano, no dia X), e como sai (sozinho, aqui). Cada uma delas
 * está escrita em letras grandes, uma vez, no sítio onde os olhos caem.
 *
 * O que não há: contadores falsos, «só hoje», «centenas de barbearias» que
 * não existem. Um barbeiro apanha-nos numa mentira e nunca mais acredita no
 * resto — e o resto é o que lhe vai pedir dinheiro todos os meses.
 *
 * Os preços NÃO estão escritos neste ficheiro. Vêm do Stripe, que é quem vai
 * cobrar. Um preço escrito no painel é um preço que um dia mostra 29,99 € a
 * quem vai ser cobrado 34,99 €.
 */

const ESTADOS = {
  sem_cartao: { texto: 'Sem cartão registado', cor: 'var(--text-sec)' },
  em_teste:   { texto: 'Em experiência',       cor: 'var(--gold)' },
  activa:     { texto: 'Activa',               cor: 'var(--success, #22C55E)' },
  em_atraso:  { texto: 'Pagamento em atraso',  cor: '#F59E0B' },
  cancelada:  { texto: 'Cancelada',            cor: 'var(--error, #EF4444)' },
};

const ETIQUETAS = { pago: 'Pago', gratis: 'Grátis', por_pagar: 'Por pagar', falhou: 'Falhou', anulado: 'Anulado', rascunho: '—' };

const NOMES_DOS_PLANOS = { essencial: 'Essencial', profissional: 'Profissional', business: 'Business' };

const euros = (centimos) =>
  (Number(centimos || 0) / 100).toFixed(2).replace('.', ',') + ' €';

const dataCurta = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const diasAte = (iso) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
};

const daquiA = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
};

/*
 * O CSS desta página vive aqui e não no index.css: são regras que só servem
 * a um ecrã, e um ecrã que se quer poder afinar sem tocar no resto do
 * painel. Usa os tokens do tema, por isso funciona no escuro e no claro.
 */
const CSS = `
.sub { display: grid; gap: 14px; max-width: 900px; }
.sub-card { border: 1px solid var(--border); border-radius: 18px; background: var(--surface); padding: 20px; }

/* 1. O cabeçalho da venda */
.sub-hero { position: relative; overflow: hidden; background:
  radial-gradient(520px 260px at 85% 30%, rgba(201,162,39,.18), transparent 65%), var(--surface); }
.sub-hero-topo { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.sub-ico { width: 52px; height: 52px; border-radius: 14px; background: rgba(201,162,39,.16); color: var(--gold); display: grid; place-items: center; }
.sub-pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,.03); font-size: 12px; font-weight: 600; white-space: nowrap; }
.sub-hero-h1 { font-family: var(--font-body); font-weight: 700; font-size: clamp(26px, 6vw, 34px); line-height: 1.1; margin: 18px 0 0; letter-spacing: -.01em; }
.sub-hero-sub { font-size: 16px; color: var(--text-sec); line-height: 1.4; margin: 8px 0 0; max-width: 30ch; }
.sub-linhas { display: grid; gap: 14px; margin-top: 22px; max-width: 360px; position: relative; z-index: 1; }
.sub-linha { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center; }
.sub-linha i { width: 44px; height: 44px; border-radius: 999px; border: 1px solid rgba(201,162,39,.45); color: var(--gold); display: grid; place-items: center; }
.sub-linha b { display: block; font-size: 15px; }
.sub-linha span { display: block; font-size: 13px; color: var(--text-sec); margin-top: 2px; }
.sub-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%;
  margin-top: 22px; padding: 17px 20px; border-radius: 14px; border: 0; cursor: pointer;
  background: var(--gold); color: #111; font: inherit; font-weight: 700; font-size: 17px;
  box-shadow: var(--shadow-gold); position: relative; z-index: 1;
}
.sub-btn:disabled { opacity: .7; cursor: default; }
.sub-plano-linha { margin-top: 12px; text-align: center; font-size: 13px; color: var(--text-sec); position: relative; z-index: 1; }
.sub-plano-linha button { background: none; border: 0; color: var(--gold); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }

/* Os cartões desenhados, à direita, atrás das linhas */
.sub-cartoes { position: absolute; right: -6px; top: 118px; width: 190px; height: 118px; pointer-events: none; }
.sub-cartao { position: absolute; inset: 0; border-radius: 14px; }
.sub-cartao.ouro { background: linear-gradient(135deg, #E8C547, #B8901E); transform: rotate(-14deg) translate(26px, -12px); }
.sub-cartao.preto { background: linear-gradient(135deg, #2A2621, #0F0D0B); border: 1px solid rgba(255,255,255,.1); box-shadow: 0 18px 40px -14px rgba(0,0,0,.9); transform: rotate(-14deg); }
.sub-cartao .chip { position: absolute; left: 16px; top: 18px; width: 26px; height: 20px; border-radius: 4px; background: linear-gradient(135deg, #F1D36B, #C9A227); }
.sub-cartao .circ { position: absolute; right: 16px; bottom: 14px; width: 22px; height: 22px; border-radius: 999px; background: #EB001B; opacity: .9; }
.sub-cartao .circ + .circ { right: 4px; background: #F79E1B; }

/* 2. Os quatro passos */
.sub-passos { display: grid; grid-template-columns: repeat(4, 1fr); padding: 6px 4px 0; }
.sub-passo { position: relative; text-align: center; }
.sub-passo i { width: 36px; height: 36px; border-radius: 999px; display: inline-grid; place-items: center; font-style: normal; font-weight: 700; font-size: 14px; background: var(--elevated); color: var(--text-sec); border: 1px solid var(--border); position: relative; z-index: 1; }
.sub-passo.agora i { background: var(--gold); color: #111; border-color: var(--gold); }
.sub-passo::after { content: ''; position: absolute; top: 18px; left: 50%; width: 100%; height: 2px; background: var(--border); }
.sub-passo.agora::after { background: linear-gradient(90deg, var(--gold), var(--border)); }
.sub-passo:last-child::after { display: none; }
.sub-passo span { display: block; margin-top: 10px; font-size: 12px; line-height: 1.3; color: var(--text-sec); padding: 0 4px; }
.sub-passo.agora span { color: var(--text); font-weight: 600; }

/* 3. O que vai acontecer */
.sub-titulo { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 16px; }
.sub-titulo svg { color: var(--gold); }
.sub-titulo .dir { margin-left: auto; font-size: 13px; color: var(--text-sec); font-weight: 500; display: inline-flex; align-items: center; gap: 2px; text-decoration: none; }
.sub-agora { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 0; }
.sub-agora li { display: grid; grid-template-columns: 36px 1fr; gap: 14px; align-items: start; position: relative; padding-bottom: 18px; }
.sub-agora li:last-child { padding-bottom: 0; }
.sub-agora li::before { content: ''; position: absolute; left: 17px; top: 36px; bottom: 0; border-left: 1px dashed var(--border); }
.sub-agora li:last-child::before { display: none; }
.sub-agora i { width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; font-style: normal; font-size: 14px; font-weight: 700; background: var(--elevated); color: var(--text-sec); border: 1px solid var(--border); }
.sub-agora li:first-child i { background: var(--gold); color: #111; border-color: var(--gold); }
.sub-agora b { display: block; font-size: 15px; margin-top: 6px; }
.sub-agora span { display: block; font-size: 13px; color: var(--text-sec); margin-top: 2px; line-height: 1.45; }

/* 4. Dúvidas */
.sub-faq { margin-top: 14px; display: grid; gap: 8px; }
.sub-faq details { border: 1px solid var(--border); border-radius: 12px; background: var(--elevated); }
.sub-faq summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 13px 14px; font-size: 14px; font-weight: 600; }
.sub-faq summary::-webkit-details-marker { display: none; }
.sub-faq summary svg { transition: transform .2s; flex-shrink: 0; color: var(--text-sec); }
.sub-faq details[open] summary svg { transform: rotate(180deg); }
.sub-faq p { margin: 0; padding: 0 14px 14px; font-size: 13px; color: var(--text-sec); line-height: 1.5; }

/* 5. Ajuda */
.sub-ajuda { display: flex; align-items: center; gap: 14px; }
.sub-ajuda .sub-ico { width: 44px; height: 44px; border-radius: 999px; }
.sub-ajuda b { display: block; font-size: 15px; }
.sub-ajuda span { display: block; font-size: 13px; color: var(--text-sec); }
.sub-ajuda a { margin-left: auto; flex-shrink: 0; padding: 11px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--elevated); color: var(--text); text-decoration: none; font-size: 14px; font-weight: 600; }

/* 7. Pagamentos */
.sub-pag { list-style: none; margin: 14px 0 0; padding: 0; display: grid; }
.sub-pag li { display: grid; grid-template-columns: 1fr auto; gap: 6px 14px; align-items: center; padding: 12px 0; border-top: 1px solid var(--border); }
.sub-pag li:first-child { border-top: 0; padding-top: 0; }
.sub-pag b { display: block; font-size: 14px; font-variant-numeric: tabular-nums; }
.sub-pag span { display: block; font-size: 12px; color: var(--text-sec); margin-top: 2px; }
.sub-pag .valor { text-align: right; font-weight: 600; font-size: 15px; font-variant-numeric: tabular-nums; }
.sub-pag .etq { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.sub-pag .etq.pago, .sub-pag .etq.gratis { background: rgba(34,197,94,.14); color: var(--success, #22C55E); }
.sub-pag .etq.por_pagar { background: rgba(245,158,11,.14); color: #F59E0B; }
.sub-pag .etq.falhou { background: rgba(239,68,68,.14); color: var(--error, #EF4444); }
.sub-pag .etq.anulado { background: var(--elevated); color: var(--text-sec); }
.sub-pag .links { grid-column: 1 / -1; display: flex; gap: 14px; }
.sub-pag .links a { font-size: 12px; color: var(--gold); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }

/* 6. Planos, escondidos até ele pedir */
.sub-planos { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 14px; }
.sub-plano { position: relative; display: flex; flex-direction: column; }
.sub-plano.teu { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold) inset; }
.sub-plano-etq { position: absolute; top: -11px; left: 16px; padding: 3px 10px; border-radius: 999px; background: var(--gold); color: #111; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }

@media (max-width: 480px) {
  .sub-card { padding: 18px 16px; }
  .sub-cartoes { width: 160px; height: 100px; top: 124px; right: -12px; }
  .sub-hero-sub { max-width: 24ch; }
  .sub-ajuda { flex-wrap: wrap; }
  .sub-ajuda a { margin-left: 58px; }
}
@media (min-width: 720px) {
  .sub-cartoes { width: 260px; height: 160px; top: 60px; right: 28px; }
  .sub-linhas { max-width: 420px; }
}
`;

function Cartoes() {
  return (
    <div className="sub-cartoes" aria-hidden="true">
      <div className="sub-cartao ouro" />
      <div className="sub-cartao preto"><div className="chip" /><div className="circ" /><div className="circ" /></div>
    </div>
  );
}

const PERGUNTAS = [
  { q: 'Quando sou cobrado?', r: 'Só no 8.º dia. Hoje o Stripe guarda o cartão e não tira nada. Avisamos-te por email antes.' },
  { q: 'Posso cancelar quando quiser?', r: 'Sim, aqui no painel, sozinho. Durante os 7 dias não pagas nada; depois, cancelas e não há mês seguinte.' },
  { q: 'É seguro adicionar o meu cartão?', r: 'O cartão é escrito numa página do Stripe. Nós nunca o vemos nem o guardamos.' },
];

const WHATSAPP = 'https://wa.me/351914874725?text=' + encodeURIComponent('Olá! Estou a activar a minha barbearia e tenho uma dúvida.');

export default function Subscricao() {
  const toast = useToast();
  const location = useLocation();

  const [sub, setSub] = useState(null);
  const [negocio, setNegocio] = useState(null);
  const [planos, setPlanos] = useState(null);
  const [periodo, setPeriodo] = useState('mensal');
  const [aCarregar, setACarregar] = useState(true);
  const [aAbrir, setAAbrir] = useState('');
  const [erro, setErro] = useState('');
  const [verPlanos, setVerPlanos] = useState(false);
  const [pagamentos, setPagamentos] = useState(null);

  /*
   * O barbeiro volta do Stripe para aqui. Mas o estado quem o escreve é o
   * webhook, do lado do servidor, e isso pode chegar um ou dois segundos
   * depois dele. Sem esta espera, ele pagava e via "sem cartão" — e a
   * primeira coisa que faria era pagar outra vez.
   */
  const voltouDoStripe = new URLSearchParams(location.search).get('estado');

  const carregar = async () => {
    try {
      const s = await dataService.subscricao();
      setSub(s);
      return s;
    } catch (e) {
      setErro(e.message);
      return null;
    }
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [s, b] = await Promise.all([carregar(), dataService.getBusiness().catch(() => null)]);
      if (!vivo) return;
      setNegocio(b);

      if (voltouDoStripe === 'sucesso' && s?.estado === 'sem_cartao') {
        // Tenta mais três vezes, de dois em dois segundos. Se ao fim disso o
        // webhook ainda não escreveu, diz-se a verdade em vez de fingir.
        for (let i = 0; i < 3; i++) {
          await new Promise(r => setTimeout(r, 2000));
          if (!vivo) return;
          const outra = await carregar();
          if (outra?.estado !== 'sem_cartao') break;
        }
      }

      if (!vivo) return;
      setACarregar(false);
    })();
    return () => { vivo = false; };
  }, [voltouDoStripe]);

  // Os planos só se vão buscar a quem ainda não pagou: quem já paga não tem
  // nada que escolher aqui, muda no portal do Stripe.
  useEffect(() => {
    if (aCarregar) return;
    if (sub && sub.estado !== 'sem_cartao' && sub.estado !== 'cancelada') return;
    if (planos) return;
    (async () => {
      try {
        const lista = await dataService.listarPlanos();
        setPlanos(lista);
      } catch (e) {
        setErro(e.message);
        setPlanos([]);
      }
    })();
  }, [aCarregar, sub, planos]);

  // Os pagamentos só interessam a quem já passou pelo Stripe.
  useEffect(() => {
    if (aCarregar || !sub?.temCliente || pagamentos) return;
    (async () => {
      try { setPagamentos(await dataService.listarPagamentos()); }
      catch { setPagamentos([]); }
    })();
  }, [aCarregar, sub, pagamentos]);

  // Só se mostra o interruptor mensal/anual se houver mesmo preços anuais no
  // Stripe. Um botão «Anual» que não faz nada é pior do que não existir.
  const haAnual = useMemo(() => (planos || []).some(p => p.precos?.anual), [planos]);
  useEffect(() => { if (!haAnual && periodo === 'anual') setPeriodo('mensal'); }, [haAnual, periodo]);

  // O plano que ele escolheu no site (ou o que lhe foi atribuído pelo número
  // de barbeiros). É a escolha por omissão: o botão grande vai directo a ele.
  const planoDaCasa = useMemo(() => {
    if (!planos?.length) return null;
    return planos.find(p => p.id === sub?.plano) || planos[0];
  }, [planos, sub]);
  const precoDaCasa = planoDaCasa?.precos?.[periodo] || planoDaCasa?.precos?.mensal || null;

  const assinar = async (preco, comTeste) => {
    const chave = (preco?.lookupKey || preco?.precoId || '') + (comTeste ? ':teste' : ':ja');
    setAAbrir(chave);
    try {
      const url = await dataService.abrirCheckout(preco, comTeste);
      window.location.href = url;
    } catch (e) {
      toast.error('Não foi possível abrir o pagamento', e.message);
      setAAbrir('');
    }
  };

  const abrirPortal = async () => {
    setAAbrir('portal');
    try {
      const url = await dataService.abrirPortal();
      window.location.href = url;
    } catch (e) {
      toast.error('Não foi possível abrir o portal', e.message);
      setAAbrir('');
    }
  };


  if (aCarregar) {
    return (
      <AdminPage title="Subscrição" subtitle="O teu plano na Convecta.">
        <Spinner label="A confirmar o estado da subscrição…" />
      </AdminPage>
    );
  }

  const estado = ESTADOS[sub?.estado] || ESTADOS.sem_cartao;
  const precisaDeCartao = !sub || sub.estado === 'sem_cartao' || sub.estado === 'cancelada';
  const nomeDoPlano = planoDaCasa?.nome || NOMES_DOS_PLANOS[sub?.plano] || 'o teu plano';
  const diaDaCobranca = daquiA(7);

  // Na venda não há cabeçalho de página nem botão de actualizar: é um ecrã
  // só, limpo, com uma coisa para fazer. Quando já há subscrição, é uma
  // página normal do painel.
  const conteudo = (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {erro && (
        <Card className="card-pad" style={{ marginBottom: 16, borderColor: 'var(--error, #EF4444)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ color: 'var(--error, #EF4444)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="fw-600 text-sm">Não foi possível ler a subscrição</div>
              <div className="text-sec" style={{ fontSize: 12, marginTop: 2 }}>{erro}</div>
            </div>
          </div>
        </Card>
      )}

      {voltouDoStripe === 'cancelado' && precisaDeCartao && (
        <Card className="card-pad" style={{ marginBottom: 16 }}>
          <div className="text-sm">
            Não chegaste a concluir — não foi cobrado nada. Quando quiseres, o botão está em baixo.
          </div>
        </Card>
      )}

      {/* ── O estado, quando já há subscrição ───────────────────────────── */}
      {!precisaDeCartao && (
        <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="text-sec" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: .8 }}>Estado</div>
              <div className="fw-600" style={{ fontSize: 20, color: estado.cor, marginTop: 4 }}>{estado.texto}</div>
              <div className="text-sec" style={{ fontSize: 13, marginTop: 6 }}>
                Plano <strong style={{ color: 'var(--text)' }}>{NOMES_DOS_PLANOS[sub.plano] || sub.plano || '—'}</strong>
                {sub.periodo ? ` · ${sub.periodo}` : ''}
                {sub.limiteProfissionais ? ` · até ${sub.limiteProfissionais} profissionais` : ''}
              </div>
            </div>
            {/* Uma barbearia criada antes dos pagamentos automáticos está
                marcada como activa mas nunca passou pelo Stripe: não tem lá
                cliente, e não há portal nenhum para abrir. Mostrar-lhe o botão
                era prometer uma porta que não existe. */}
            {sub.temCliente ? (
              <Button onClick={abrirPortal} disabled={aAbrir === 'portal'} icon={<ExternalLink size={16} />}>
                {aAbrir === 'portal' ? 'A abrir…' : 'Gerir subscrição'}
              </Button>
            ) : (
              <div className="text-sec" style={{ fontSize: 12, maxWidth: 260, textAlign: 'right' }}>
                Esta barbearia foi criada antes dos pagamentos automáticos.
                A subscrição é tratada connosco directamente.
              </div>
            )}
          </div>

          {sub.estado === 'em_teste' && sub.fimDoTeste && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <Clock size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
              <div className="text-sm">
                {/* Dizer a data E os dias: a data é o que conta, os dias é o
                    que a pessoa sente. */}
                A experiência acaba a <strong>{dataCurta(sub.fimDoTeste)}</strong>
                {diasAte(sub.fimDoTeste) >= 0 ? ` (faltam ${diasAte(sub.fimDoTeste)} dias)` : ''}.
                Se não cancelares até lá, o cartão é cobrado nesse dia.
                <div className="text-sec" style={{ fontSize: 12, marginTop: 4 }}>
                  Cancelar durante a experiência não custa nada — não é cobrado nenhum valor.
                </div>
              </div>
            </div>
          )}

          {sub.estado === 'activa' && sub.fimDoPeriodo && (
            <div className="text-sec" style={{ fontSize: 13, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              Próxima cobrança a <strong style={{ color: 'var(--text)' }}>{dataCurta(sub.fimDoPeriodo)}</strong>.
            </div>
          )}

          {sub.estado === 'em_atraso' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
              <div className="text-sm">
                O último pagamento não passou. <strong>A barbearia continua a funcionar normalmente</strong> —
                vamos tentar cobrar outra vez nos próximos dias.
                <div className="text-sec" style={{ fontSize: 12, marginTop: 4 }}>
                  Se o cartão expirou ou mudou, actualiza-o em «Gerir subscrição» e fica resolvido.
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Os pagamentos, quando já há subscrição ──────────────────────── */}
      {!precisaDeCartao && sub?.temCliente && (
        <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
          <div className="sub-titulo"><Receipt size={18} /> Pagamentos</div>
          <div className="text-sec" style={{ fontSize: 12, marginTop: 4 }}>
            Os recibos do Stripe, do mais recente para o mais antigo.
          </div>
          {!pagamentos && <div style={{ marginTop: 12 }}><Spinner label="A ler os pagamentos…" /></div>}
          {pagamentos && pagamentos.length === 0 && (
            <div className="text-sec text-sm" style={{ marginTop: 12 }}>Ainda não há pagamentos. O primeiro aparece aqui no dia em que for cobrado.</div>
          )}
          {pagamentos && pagamentos.length > 0 && (
            <ul className="sub-pag">
              {pagamentos.map(p => (
                <li key={p.id}>
                  <div>
                    <b>{dataCurta(p.data)}<span className={`etq ${p.estado}`} style={{ display: 'inline-block', marginTop: 0 }}>{ETIQUETAS[p.estado] || p.estado}</span></b>
                    <span>
                      {p.descricao || 'Subscrição'}
                      {p.periodoInicio && p.periodoFim && p.centimos > 0 ? ` · ${dataCurta(p.periodoInicio)} a ${dataCurta(p.periodoFim)}` : ''}
                    </span>
                  </div>
                  <div className="valor">{euros(p.centimos)}</div>
                  {(p.recibo || p.pdf) && (
                    <div className="links">
                      {p.recibo && <a href={p.recibo} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Ver recibo</a>}
                      {p.pdf && <a href={p.pdf} target="_blank" rel="noreferrer"><FileDown size={12} /> PDF</a>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── A venda ─────────────────────────────────────────────────────── */}
      {precisaDeCartao && (
        <>
          {/* 1. Cabeçalho: o que fazer, porquê, e o botão. */}
          <section className="sub-card sub-hero">
            <div className="sub-hero-topo">
              <div className="sub-ico"><CreditCard size={24} /></div>
              <div className="sub-pill"><Lock size={13} style={{ color: 'var(--gold)' }} /> Pagamento seguro</div>
            </div>
            <h2 className="sub-hero-h1">{sub?.estado === 'cancelada' ? 'Reactiva a tua conta' : 'Activa a tua conta'}</h2>
            <p className="sub-hero-sub">Adiciona o teu cartão para começares a receber marcações.</p>
            <Cartoes />
            <div className="sub-linhas">
              <div className="sub-linha"><i><Zap size={18} /></i><div><b>Rápido e simples</b><span>Em menos de 2 minutos.</span></div></div>
              <div className="sub-linha"><i><ShieldCheck size={18} /></i><div><b>Seguro</b><span>Processado pela Stripe.</span></div></div>
              <div className="sub-linha"><i><CalendarDays size={18} /></i><div><b>Só depois da experiência</b><span>Primeiro pagamento a {diaDaCobranca}. Hoje, 0 €.</span></div></div>
            </div>
            {precoDaCasa ? (
              <button className="sub-btn" onClick={() => assinar(precoDaCasa, true)} disabled={!!aAbrir}>
                {aAbrir ? 'A abrir…' : 'Activar 7 dias grátis'} <ArrowRight size={20} />
              </button>
            ) : (
              <button className="sub-btn" onClick={() => setVerPlanos(true)}>Escolher o plano <ArrowRight size={20} /></button>
            )}
            {precoDaCasa && (
              <div className="sub-plano-linha">
                Plano {nomeDoPlano} · {euros(precoDaCasa.centimos)}{periodo === 'anual' ? '/ano' : '/mês'} · <button type="button" onClick={() => setVerPlanos(v => !v)}>{verPlanos ? 'fechar' : 'mudar'}</button>
              </div>
            )}
          </section>

          {/* 6. Os planos, só quando ele pede. */}
          {verPlanos && (
            <section id="planos">
              {haAnual && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  {['mensal', 'anual'].map(p => (
                    <button key={p} onClick={() => setPeriodo(p)} className="fw-600" style={{
                      padding: '8px 16px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                      border: `1px solid ${periodo === p ? 'var(--gold)' : 'var(--border)'}`,
                      background: periodo === p ? 'var(--gold)' : 'transparent',
                      color: periodo === p ? '#111' : 'var(--text-sec)',
                    }}>{p === 'mensal' ? 'Mensal' : 'Anual (mais barato)'}</button>
                  ))}
                </div>
              )}
              {!planos && <Spinner label="A ler os planos…" />}
              {planos && planos.length === 0 && (
                <div className="sub-card text-sm">Não foi possível ler os planos. Fala connosco pelo WhatsApp e tratamos disto contigo.</div>
              )}
              {planos && planos.length > 0 && (
                <div className="sub-planos">
                  {planos.map(plano => {
                    const preco = plano.precos?.[periodo] || plano.precos?.mensal;
                    if (!preco) return null;
                    const ehAnual = !!plano.precos?.[periodo] && periodo === 'anual';
                    const teu = plano.id === planoDaCasa?.id;
                    const id = preco.lookupKey || preco.precoId;
                    return (
                      <div key={plano.id} className={`sub-card sub-plano${teu ? ' teu' : ''}`}>
                        {teu && <div className="sub-plano-etq">O teu plano</div>}
                        <div className="fw-600" style={{ fontSize: 17 }}>{plano.nome}</div>
                        {plano.descricao && <div className="text-sec" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{plano.descricao}</div>}
                        <div style={{ margin: '14px 0 12px' }}>
                          <span className="fw-600" style={{ fontSize: 28 }}>{euros(preco.centimos)}</span>
                          <span className="text-sec" style={{ fontSize: 13 }}>{ehAnual ? ' /ano' : ' /mês'}</span>
                        </div>
                        {plano.caracteristicas?.length > 0 && (
                          <div style={{ margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {plano.caracteristicas.map((c, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <Check size={15} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                                <span className="text-sm">{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <Button block onClick={() => assinar(preco, true)} disabled={!!aAbrir} icon={<CreditCard size={16} />}>
                            {aAbrir === id + ':teste' ? 'A abrir…' : 'Activar · 7 dias grátis'}
                          </Button>
                          <Button block variant="ghost" onClick={() => assinar(preco, false)} disabled={!!aAbrir}>
                            {aAbrir === id + ':ja' ? 'A abrir…' : 'Pagar já, sem experiência'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 2. Os quatro passos. */}
          <section className="sub-card" style={{ padding: '18px 8px 16px' }}>
            <div className="sub-passos">
              <div className="sub-passo agora"><i>1</i><span>Activar</span></div>
              <div className="sub-passo"><i>2</i><span>Confirmar</span></div>
              <div className="sub-passo"><i>3</i><span>Começar a receber</span></div>
              <div className="sub-passo"><i>4</i><span>Primeiro pagamento</span></div>
            </div>
          </section>

          {/* 3. O que vai acontecer. */}
          <section className="sub-card">
            <div className="sub-titulo"><CalendarDays size={18} /> O que vai acontecer agora?</div>
            <ul className="sub-agora">
              <li><i>1</i><div><b>Activas os 7 dias grátis</b><span>Com o cartão, numa página segura. Menos de 2 minutos.</span></div></li>
              <li><i>2</i><div><b>A tua conta fica activa</b><span>Começas a receber marcações imediatamente.</span></div></li>
              <li><i>3</i><div><b>Primeiro pagamento só a {diaDaCobranca}</b><span>Até lá usas tudo, sem pagar nada.</span></div></li>
            </ul>
          </section>

          {/* 4. Dúvidas. */}
          <section className="sub-card">
            <div className="sub-titulo"><MessageCircle size={18} /> Dúvidas frequentes <a className="dir" href={WHATSAPP} target="_blank" rel="noreferrer">Perguntar <ChevronRight size={15} /></a></div>
            <div className="sub-faq">
              {PERGUNTAS.map(p => (
                <details key={p.q}><summary>{p.q} <ChevronDown size={16} /></summary><p>{p.r}</p></details>
              ))}
            </div>
          </section>

          {/* 5. Ajuda. */}
          <section className="sub-card sub-ajuda">
            <div className="sub-ico"><Headphones size={20} /></div>
            <div><b>Precisas de ajuda?</b><span>Fala connosco, estamos aqui para ajudar.</span></div>
            <a href={WHATSAPP} target="_blank" rel="noreferrer">Contactar</a>
          </section>
        </>
      )}
    </>
  );

  return precisaDeCartao
    ? <AdminLayout><div className="sub">{conteudo}</div></AdminLayout>
    : <AdminPage title="Subscrição" subtitle="O teu plano na Convecta. Sem fidelização — cancelas quando quiseres.">{conteudo}</AdminPage>;
}
