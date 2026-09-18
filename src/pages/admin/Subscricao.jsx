import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CreditCard, ShieldCheck, Check, ExternalLink, AlertTriangle, Clock,
  Lock, Zap, CalendarCheck, ChevronDown, CalendarDays, MessageCircle, Sparkles,
} from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
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
.sub-hero {
  position: relative; overflow: hidden;
  border: 1px solid var(--border); border-radius: 18px;
  background:
    radial-gradient(900px 420px at 100% 0%, rgba(201,162,39,.16), transparent 60%),
    var(--surface);
  padding: clamp(22px, 4vw, 40px);
  display: grid; gap: 28px;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, .9fr);
  align-items: center;
}
.sub-hero-olho { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--gold); font-weight: 600; }
.sub-hero-h1 { font-family: var(--font-head); font-size: clamp(30px, 4.6vw, 46px); line-height: 1.05; margin: 10px 0 0; letter-spacing: -.01em; }
.sub-hero-sub { font-size: clamp(16px, 2vw, 19px); color: var(--gold); font-weight: 600; margin: 10px 0 0; line-height: 1.35; }
.sub-hero-p { color: var(--text-sec); font-size: 15px; line-height: 1.55; margin: 14px 0 0; max-width: 56ch; }
.sub-chips { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }
.sub-chip { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; background: rgba(255,255,255,.02); min-width: 0; }
.sub-chip-ico { width: 34px; height: 34px; border-radius: 10px; background: rgba(201,162,39,.14); color: var(--gold); display: grid; place-items: center; flex-shrink: 0; }
.sub-chip b { display: block; font-size: 13px; }
.sub-chip span { display: block; font-size: 12px; color: var(--text-sec); }
.sub-cta { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 24px; }
.sub-cta-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px 26px; border-radius: 999px; border: 0; cursor: pointer;
  background: var(--gold); color: #111; font: inherit; font-weight: 700; font-size: 16px;
  box-shadow: var(--shadow-gold); animation: subRespira 2.8s ease-in-out infinite;
  transition: transform .15s ease;
}
.sub-cta-btn:hover { transform: translateY(-1px); }
.sub-cta-btn:disabled { opacity: .7; cursor: default; animation: none; }
.sub-cta-nota { font-size: 13px; color: var(--text-sec); }
@keyframes subRespira {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,162,39,.35), var(--shadow-gold); }
  50%      { box-shadow: 0 0 0 12px rgba(201,162,39,0), var(--shadow-gold); }
}

/* O cartão desenhado. Sem imagem nenhuma: é CSS, pesa zero e segue o tema. */
.sub-cartoes { position: relative; height: 200px; max-width: 340px; margin: 0 auto; }
.sub-cartao { position: absolute; inset: 0; border-radius: 16px; transform: rotate(-8deg); }
.sub-cartao.ouro { background: linear-gradient(135deg, #E8C547, #B8901E); transform: rotate(-14deg) translate(18px, -14px); opacity: .95; }
.sub-cartao.preto { background: linear-gradient(135deg, #2A2621, #0F0D0B); border: 1px solid rgba(255,255,255,.08); box-shadow: 0 24px 50px -20px rgba(0,0,0,.8); }
.sub-cartao .chip { position: absolute; left: 24px; top: 26px; width: 42px; height: 30px; border-radius: 6px; background: linear-gradient(135deg, #F1D36B, #C9A227); }
.sub-cartao .num { position: absolute; left: 24px; bottom: 44px; font-size: 15px; letter-spacing: .18em; color: rgba(255,255,255,.75); font-variant-numeric: tabular-nums; }
.sub-cartao .nome { position: absolute; left: 24px; bottom: 20px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.5); }
.sub-cartao .zero { position: absolute; right: 22px; top: 22px; font-family: var(--font-head); font-size: 26px; color: var(--gold); }
.sub-cartao .zero small { display: block; font-family: var(--font-body); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.55); text-align: right; }

.sub-linha { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.sub-passo { position: relative; padding: 16px 12px 14px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); }
.sub-passo-n { width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; font-size: 13px; border: 1px solid var(--border); color: var(--text-sec); }
.sub-passo.agora .sub-passo-n { background: var(--gold); color: #111; border-color: var(--gold); }
.sub-passo b { display: block; margin-top: 10px; font-size: 14px; }
.sub-passo span { display: block; margin-top: 3px; font-size: 12px; color: var(--text-sec); line-height: 1.4; }
.sub-passo em { display: block; margin-top: 8px; font-style: normal; font-size: 12px; color: var(--gold); font-weight: 600; }

.sub-duas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.sub-titulo { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 16px; }
.sub-titulo svg { color: var(--gold); }
.sub-agora { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 14px; }
.sub-agora li { display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; }
.sub-agora li i { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; font-style: normal; font-size: 12px; font-weight: 700; border: 1px solid var(--border); color: var(--text-sec); }
.sub-agora li:first-child i { background: var(--gold); color: #111; border-color: var(--gold); }
.sub-agora b { display: block; font-size: 14px; }
.sub-agora span { display: block; font-size: 13px; color: var(--text-sec); margin-top: 2px; line-height: 1.45; }
.sub-faq { margin-top: 14px; display: grid; gap: 8px; }
.sub-faq details { border: 1px solid var(--border); border-radius: 10px; background: rgba(255,255,255,.02); }
.sub-faq summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; font-size: 14px; font-weight: 600; }
.sub-faq summary::-webkit-details-marker { display: none; }
.sub-faq summary svg { transition: transform .2s; flex-shrink: 0; color: var(--text-sec); }
.sub-faq details[open] summary svg { transform: rotate(180deg); }
.sub-faq p { margin: 0; padding: 0 14px 14px; font-size: 13px; color: var(--text-sec); line-height: 1.5; }

.sub-planos { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); margin-top: 16px; }
.sub-plano { position: relative; display: flex; flex-direction: column; }
.sub-plano.teu { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold) inset; }
.sub-plano-etq { position: absolute; top: -11px; left: 16px; padding: 3px 10px; border-radius: 999px; background: var(--gold); color: #111; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }

.sub-fecho { margin-top: 16px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; justify-content: space-between; }

@media (max-width: 860px) {
  .sub-hero { grid-template-columns: 1fr; gap: 18px; }
  .sub-cartoes { height: 150px; max-width: 260px; order: -1; margin: 6px auto 0; }
  .sub-chips { grid-template-columns: 1fr; }
  .sub-cta-btn { width: 100%; }
  .sub-linha { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sub-duas { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .sub-cta-btn { animation: none; }
}
`;

function Cartoes({ nome }) {
  return (
    <div className="sub-cartoes" aria-hidden="true">
      <div className="sub-cartao ouro" />
      <div className="sub-cartao preto">
        <div className="chip" />
        <div className="zero"><small>Hoje pagas</small>0,00 €</div>
        <div className="num">•••• •••• •••• 7 dias</div>
        <div className="nome">{nome || 'A tua barbearia'}</div>
      </div>
    </div>
  );
}

const PERGUNTAS = [
  {
    q: 'Quando é que sou cobrado?',
    r: 'Só no 8.º dia. Hoje o Stripe guarda o cartão e não tira nada. Recebes um email uns dias antes da primeira cobrança, com o valor e a data.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    r: 'Sim, sozinho, aqui no painel, em «Gerir subscrição». Se cancelares durante os 7 dias, não pagas nada. Depois disso, cancelas e não há mês seguinte. Sem telefonemas nem justificações.',
  },
  {
    q: 'É seguro dar o cartão?',
    r: 'O cartão é escrito numa página do Stripe — a mesma empresa que trata dos pagamentos da Shopify, da Uber ou da Amazon. Nós nunca vemos nem guardamos o número.',
  },
  {
    q: 'E se ainda não tiver tudo pronto?',
    r: 'Não faz mal. O cartão abre as marcações; o resto — serviços, horários, cores — continuas a mudar quando quiseres. Muitos começam pela agenda e afinam o resto na primeira semana.',
  },
];

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

  const irAosPlanos = () => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  return (
    <AdminPage
      title="Subscrição"
      subtitle={precisaDeCartao
        ? 'A tua barbearia está montada. Falta abrir a porta.'
        : 'O teu plano na Convecta. Sem fidelização — cancelas quando quiseres.'}
    >
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

      {/* ── A venda ─────────────────────────────────────────────────────── */}
      {precisaDeCartao && (
        <>
          {/* 1. O que ele ganha, o que paga hoje, o que paga depois. Tudo
                 acima da dobra, tudo em letras grandes. */}
          <section className="sub-hero">
            <div>
              <div className="sub-hero-olho">
                {sub?.estado === 'cancelada' ? 'Subscrição cancelada' : 'A tua barbearia está no ar'}
              </div>
              <h2 className="sub-hero-h1">
                {sub?.estado === 'cancelada' ? 'Volta a receber marcações.' : 'Activa as marcações.'}
              </h2>
              <p className="sub-hero-sub">
                Regista o cartão, tens 7 dias grátis, e a tua agenda abre hoje.
              </p>
              <p className="sub-hero-p">
                Hoje pagas <strong style={{ color: 'var(--text)' }}>0 €</strong>. A primeira cobrança é a{' '}
                <strong style={{ color: 'var(--text)' }}>{diaDaCobranca}</strong>
                {precoDaCasa ? <> — {euros(precoDaCasa.centimos)} do plano {nomeDoPlano}{periodo === 'anual' ? ' por ano' : ' por mês'}</> : null}.
                Avisamos-te por email antes. Se cancelares até lá, não pagas nada — e cancelas sozinho, aqui.
              </p>

              <div className="sub-chips">
                <div className="sub-chip"><div className="sub-chip-ico"><Lock size={16} /></div><div><b>Pagamento seguro</b><span>Pela Stripe. Nunca vemos o cartão.</span></div></div>
                <div className="sub-chip"><div className="sub-chip-ico"><Zap size={16} /></div><div><b>2 minutos</b><span>Uma página, e está.</span></div></div>
                <div className="sub-chip"><div className="sub-chip-ico"><CalendarCheck size={16} /></div><div><b>0 € durante 7 dias</b><span>Só pagas se ficares.</span></div></div>
              </div>

              <div className="sub-cta">
                {precoDaCasa ? (
                  <button className="sub-cta-btn" onClick={() => assinar(precoDaCasa, true)} disabled={!!aAbrir}>
                    <CreditCard size={18} />
                    {aAbrir ? 'A abrir o Stripe…' : `Activar com 7 dias grátis`}
                  </button>
                ) : (
                  <button className="sub-cta-btn" onClick={irAosPlanos}>
                    <CreditCard size={18} /> Escolher o plano
                  </button>
                )}
                <button
                  type="button"
                  onClick={irAosPlanos}
                  className="sub-cta-nota"
                  style={{ background: 'none', border: 0, cursor: 'pointer', textDecoration: 'underline', color: 'var(--text-sec)', font: 'inherit', fontSize: 13 }}
                >
                  {precoDaCasa ? `Plano ${nomeDoPlano} · ${euros(precoDaCasa.centimos)}${periodo === 'anual' ? '/ano' : '/mês'} · ver os outros` : 'Ver os planos'}
                </button>
              </div>
            </div>
            <Cartoes nome={negocio?.name} />
          </section>

          {/* 2. A linha do tempo, com datas a sério. «Dia 7» é abstracto;
                 «25 de setembro» é um dia na vida dele. */}
          <div className="sub-linha">
            <div className="sub-passo agora"><div className="sub-passo-n">1</div><b>Registas o cartão</b><span>Numa página do Stripe.</span><em>Agora · 2 minutos</em></div>
            <div className="sub-passo"><div className="sub-passo-n">2</div><b>A agenda abre</b><span>Os clientes já podem marcar pelo teu site.</span><em>Hoje</em></div>
            <div className="sub-passo"><div className="sub-passo-n">3</div><b>Sete dias à experiência</b><span>Tudo a funcionar. Pagas 0 €.</span><em>Até {daquiA(6)}</em></div>
            <div className="sub-passo"><div className="sub-passo-n">4</div><b>Primeira cobrança</b><span>Só se ficares. Avisamos-te antes por email.</span><em>{diaDaCobranca}</em></div>
          </div>

          {/* 3. O que acontece a seguir + as perguntas que travam a venda. */}
          <div className="sub-duas">
            <Card className="card-pad">
              <div className="sub-titulo"><CalendarDays size={18} /> O que acontece a seguir</div>
              <ul className="sub-agora">
                <li><i>1</i><div><b>Carregas em «Activar» e escreves o cartão</b><span>Na página do Stripe. Voltas para aqui sozinho.</span></div></li>
                <li><i>2</i><div><b>A agenda fica aberta no mesmo minuto</b><span>Partilha o endereço da tua barbearia no Instagram e no WhatsApp. O telemóvel toca a cada marcação.</span></div></li>
                <li><i>3</i><div><b>Durante 7 dias, usas tudo sem pagar</b><span>Agenda, clientes, caixa, comissões, avisos. Se não for para ti, cancelas e acabou.</span></div></li>
              </ul>
            </Card>

            <Card className="card-pad">
              <div className="sub-titulo"><MessageCircle size={18} /> As perguntas de quem está a decidir</div>
              <div className="sub-faq">
                {PERGUNTAS.map(p => (
                  <details key={p.q}>
                    <summary>{p.q} <ChevronDown size={16} /></summary>
                    <p>{p.r}</p>
                  </details>
                ))}
              </div>
            </Card>
          </div>

          {/* 4. Os planos. O dele vem marcado; os outros estão lá para quem
                 quiser mudar, não para o fazer hesitar. */}
          <div id="planos" style={{ scrollMarginTop: 80, marginTop: 28 }}>
            <div className="sub-titulo"><Sparkles size={18} /> Os planos</div>
            <div className="text-sec" style={{ fontSize: 13, marginTop: 4 }}>
              A plataforma é a mesma nos três. O que muda é quantos profissionais cabem.
            </div>

            {haAnual && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {['mensal', 'anual'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodo(p)}
                    className="fw-600"
                    style={{
                      padding: '8px 16px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                      border: `1px solid ${periodo === p ? 'var(--gold)' : 'var(--border)'}`,
                      background: periodo === p ? 'var(--gold)' : 'transparent',
                      color: periodo === p ? '#111' : 'var(--text-sec)',
                    }}
                  >
                    {p === 'mensal' ? 'Mensal' : 'Anual (mais barato)'}
                  </button>
                ))}
              </div>
            )}

            {!planos && <div style={{ marginTop: 16 }}><Spinner label="A ler os planos…" /></div>}

            {planos && planos.length === 0 && (
              <Card className="card-pad" style={{ marginTop: 16 }}>
                <div className="text-sm">
                  Não foi possível ler os planos. Fala connosco pelo WhatsApp e tratamos disto contigo.
                </div>
              </Card>
            )}

            {planos && planos.length > 0 && (
              <div className="sub-planos">
                {planos.map(plano => {
                  const preco = plano.precos?.[periodo] || plano.precos?.mensal;
                  if (!preco) return null;
                  const ehAnual = !!plano.precos?.[periodo] && periodo === 'anual';
                  const mensal = plano.precos?.mensal?.centimos;
                  const poupa = ehAnual && mensal ? mensal * 12 - preco.centimos : 0;
                  const teu = plano.id === planoDaCasa?.id;
                  const id = preco.lookupKey || preco.precoId;

                  return (
                    <Card key={plano.id} className={`card-pad sub-plano${teu ? ' teu' : ''}`}>
                      {teu && <div className="sub-plano-etq">O teu plano</div>}
                      <div className="fw-600" style={{ fontSize: 17 }}>{plano.nome}</div>
                      {plano.descricao && (
                        <div className="text-sec" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{plano.descricao}</div>
                      )}

                      <div style={{ margin: '16px 0 4px' }}>
                        <span className="fw-600" style={{ fontSize: 30 }}>{euros(preco.centimos)}</span>
                        <span className="text-sec" style={{ fontSize: 13 }}>{ehAnual ? ' /ano' : ' /mês'}</span>
                      </div>
                      {poupa > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--gold)' }}>Poupas {euros(poupa)} por ano</div>
                      )}
                      <div className="text-sec" style={{ fontSize: 12, marginTop: 4 }}>Hoje 0 € · primeira cobrança a {diaDaCobranca}</div>

                      {plano.caracteristicas?.length > 0 && (
                        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {plano.caracteristicas.map((c, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <Check size={15} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                              <span className="text-sm">{c}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                        <Button
                          block
                          onClick={() => assinar(preco, true)}
                          disabled={!!aAbrir}
                          icon={<CreditCard size={16} />}
                        >
                          {aAbrir === id + ':teste' ? 'A abrir…' : 'Experimentar 7 dias grátis'}
                        </Button>
                        {/* Quem já decidiu não quer um contador de dias a correr.
                            Dar-lhe o caminho curto é respeitar isso. */}
                        <Button
                          block
                          variant="ghost"
                          onClick={() => assinar(preco, false)}
                          disabled={!!aAbrir}
                        >
                          {aAbrir === id + ':ja' ? 'A abrir…' : 'Pagar já e ficar despachado'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. O fecho. Uma verdade, não uma pressão. */}
          <Card className="card-pad sub-fecho">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="sub-chip-ico" style={{ width: 44, height: 44 }}><ShieldCheck size={20} /></div>
              <div>
                <div className="fw-600" style={{ fontSize: 15 }}>Cada dia sem marcações online é um cliente que te liga enquanto estás a cortar.</div>
                <div className="text-sec" style={{ fontSize: 13, marginTop: 2 }}>Abre a agenda hoje, decide daqui a 7 dias. Precisas de ajuda? Fala connosco pelo WhatsApp.</div>
              </div>
            </div>
            {precoDaCasa && (
              <button className="sub-cta-btn" style={{ animation: 'none' }} onClick={() => assinar(precoDaCasa, true)} disabled={!!aAbrir}>
                Activar com 7 dias grátis
              </button>
            )}
          </Card>
        </>
      )}
    </AdminPage>
  );
}
