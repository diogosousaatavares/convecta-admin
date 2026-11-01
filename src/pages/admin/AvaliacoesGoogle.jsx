import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Star, Search, ExternalLink, MapPin, X, Check, TrendingUp } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import AdminLayout from '@/components/AdminLayout';
import Toggle from '@/components/admin/Toggle';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { useConfirmar } from '@/components/ui/Confirmar';
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';
import { formatPrice } from '@/lib/format';
import { extraAtivo, extraDe, mudarExtra, sufixoPeriodo, textoJuntarExtra } from '@/lib/extras';

/*
 * SUPLEMENTO «AVALIAÇÕES GOOGLE» (01/11/2026, Diogo).
 *
 * Depois de cada corte, o cliente recebe (notificação ou email) o pedido
 * para avaliar a barbearia no Google, com o link direto para escrever.
 * Mais avaliações = mais visibilidade no Google Maps = mais clientes novos.
 *
 * Três passos: juntar o suplemento (2,99 €/mês) → escolher a ficha da
 * barbearia no Google → ligar. O envio é da função enviar-lembretes
 * (avaliacoes_por_pedir): uma vez por marcação, no máximo uma vez a cada
 * 90 dias por cliente, e a TODOS os clientes (escolher só os contentes é
 * proibido pelas regras do Google).
 */
const HORAS = [[2, '2 horas depois'], [5, '5 horas depois'], [24, 'No dia seguinte']];
const erroDe = async (error, data) => { let m = data?.erro; if (error) { try { m = (await error.context?.json())?.erro || error.message; } catch { m = error.message; } } return m; };
const invocar = async corpo => { const { data, error } = await supabase.functions.invoke('avaliacoes-google', { body: corpo }); const m = await erroDe(error, data); if (m) throw new Error(m); return data; };

export default function AvaliacoesGoogle() {
  const data = useStore();
  const toast = useToast();
  const [pedir, Confirmacao] = useConfirmar();
  const biz = data.business;
  const [ag, setAg] = useState(biz?.avaliacoesGoogle || {});
  const [texto, setTexto] = useState('');
  const [lugares, setLugares] = useState(null);
  const [aProcurar, setAProcurar] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [aJuntar, setAJuntar] = useState(false);
  const navigate = useNavigate();
  // A capa de entrada (01/11/2026, como nos Pagamentos online): aparece a quem
  // ainda não tem o suplemento e, já com ele, até escolher a ficha no Google.
  const [capaFechada, setCapaFechada] = useState(false);
  const temExtra = !biz || extraAtivo(biz, 'avaliacoes');

  useEffect(() => { if (biz) { setAg(biz.avaliacoesGoogle || {}); setTexto(t => t || `${biz.name || ''}${biz.address ? ' ' + biz.address : ''}`); } }, [biz?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!temExtra) return;
    invocar({ acao: 'nota' }).then(r => r?.avaliacoesGoogle && setAg(r.avaliacoesGoogle)).catch(() => {});
    supabase.rpc('avaliacoes_google_resumo').then(({ data: r }) => setResumo(Array.isArray(r) ? r[0] : r)).catch(() => {});
  }, [temExtra]);

  const extra = extraDe('avaliacoes');
  const periodo = ['anual', 'quinzenal'].includes(biz?.billingPeriod) ? biz.billingPeriod : 'mensal';
  const juntar = () => pedir({
    titulo: 'Juntar as Avaliações Google?',
    texto: textoJuntarExtra(extra, periodo, formatPrice),
    botao: 'Sim, juntar', perigoso: false,
    aoConfirmar: async () => {
      setAJuntar(true);
      try { await mudarExtra('avaliacoes', true); toast.success('Avaliações Google juntas à subscrição'); setTimeout(() => window.location.reload(), 700); }
      catch (e) { toast.error('Não foi possível', e.message); setAJuntar(false); throw e; }
    },
  });
  const procurar = async () => {
    setAProcurar(true);
    try { const r = await invocar({ acao: 'procurar', texto }); setLugares(r.lugares || []); }
    catch (e) { toast.error('Não consegui procurar no Google', e.message); }
    finally { setAProcurar(false); }
  };
  const escolher = async id => {
    try { const r = await invocar({ acao: 'escolher', place_id: id }); setAg(r.avaliacoesGoogle); setLugares(null); toast.success('Ficha do Google guardada'); }
    catch (e) { toast.error('Não ficou guardado', e.message); }
  };
  const gravar = async mud => {
    const novo = { ...ag, ...mud };
    setAg(novo);
    try { await dataService.updateBusiness({ avaliacoesGoogle: novo }); toast.success('Guardado'); }
    catch (e) { toast.error('Não ficou gravado', e.message); }
  };

  const ganhou = ag.placeId && ag.total != null && ag.totalInicial != null ? Math.max(0, ag.total - ag.totalInicial) : null;
  const nota = Number(ag.nota) || 0;
  const horas = ag.horasDepois || 2;

  /* ── A CAPA: ecrã inteiro, à Pagamentos online ───────────────────── */
  if (biz && (!temExtra || (!ag.placeId && !capaFechada))) {
    const sair = () => (window.history.length > 1 ? navigate(-1) : navigate('/admin/dashboard'));
    return (
      <AdminLayout>
        <style>{CSS_CAPA}</style>
        {createPortal(
          <section className="grc" role="dialog" aria-label="Google Reviews">
            <div className="grc-cabeca">
              <div className="grc-selo"><span><Star size={15} fill="currentColor" /></span>Google Reviews</div>
              <button type="button" className="grc-fechar" onClick={sair} aria-label="Fechar"><X size={24} /></button>
            </div>
            <div className="grc-corpo">
              <div className="grc-visual" aria-hidden="true">
                <div className="grc-mancha" />
                <img className="grc-tel" src="/google-reviews/telemovel.webp" alt="" />
              </div>
              <div className="grc-texto">
                <h2 className="grc-h">Mais avaliações no Google. <em>Sem teres de pedir.</em></h2>
                <ul className="grc-lista">
                  <li><span><Star size={18} /></span>Ganha mais confiança</li>
                  <li><span><TrendingUp size={18} /></span>Atrai novos clientes</li>
                  <li><span><MapPin size={18} /></span>Sobe no Google Maps</li>
                </ul>
                <p className="grc-sub"><Check size={16} /> Depois de cada corte, o cliente recebe o link para te avaliar. Tu não fazes nada.</p>
                {!temExtra && <div className="grc-preco">{formatPrice(extra.precos[periodo] ?? extra.precos.mensal)}{sufixoPeriodo(periodo)} <small>· desligas quando quiseres</small></div>}
                <div className="grc-acoes">
                  {!temExtra
                    ? <button type="button" className="grc-btn" onClick={juntar} disabled={aJuntar}>{aJuntar ? 'A ativar…' : 'Ativar agora'}</button>
                    : <button type="button" className="grc-btn" onClick={() => setCapaFechada(true)}>Começar</button>}
                  <a className="grc-link" href="https://convecta.pt/#google-reviews" target="_blank" rel="noreferrer">Saber mais</a>
                </div>
              </div>
            </div>
          </section>, document.body)}
        <Confirmacao />
      </AdminLayout>
    );
  }

  return (
    <AdminPage title="Google Reviews">
      <Confirmacao />
      <style>{CSS}</style>
      <div className={`gr${temExtra ? '' : ' venda-larga'}`}>
        {/* O CARTÃO DE CIMA: a imagem, a nota e o efeito */}
        <section className={`gr-topo${temExtra ? '' : ' venda'}`}>
          {temExtra ? <ImagemGoogle /> : (
            /* 01/11/2026: as imagens do Diogo (public/google-reviews) — larga no computador, alta no telemóvel */
            <picture>
              <source media="(max-width: 720px)" srcSet="/google-reviews/alto.webp" />
              <img className="gr-capa" src="/google-reviews/largo.webp" alt="Ganha mais confiança, atrai novos clientes e melhora o teu posicionamento no Google" />
            </picture>
          )}
          {!temExtra ? (
            <>
              <h2 className="gr-titulo">Mais avaliações no Google, sem teres de pedir</h2>
              <p className="gr-texto">Depois de cada corte, o teu cliente recebe o link para te avaliar no Google. Quem tem mais avaliações aparece primeiro no Google Maps — é aí que os clientes novos te encontram.</p>
              <button type="button" className="gr-btn" onClick={juntar} disabled={aJuntar}>
                {aJuntar ? 'A juntar…' : `Ativar por ${formatPrice(extra.precos[periodo] ?? extra.precos.mensal)}${sufixoPeriodo(periodo)}`}
              </button>
              <span className="gr-mini">Desligas quando quiseres.</span>
            </>
          ) : ag.placeId ? (
            <>
              <div className="gr-nota">
                <b>{nota ? nota.toFixed(1).replace('.', ',') : '—'}</b>
                <div>
                  <Estrelas n={nota} />
                  <span>{ag.total || 0} {ag.total === 1 ? 'avaliação' : 'avaliações'} no Google</span>
                </div>
              </div>
              <div className="gr-numeros">
                <div><b className={ganhou ? 'verde' : ''}>+{ganhou ?? 0}</b><span>desde que ativaste</span></div>
                <div><b>{resumo?.enviados_30d ?? 0}</b><span>pedidos este mês</span></div>
              </div>
            </>
          ) : (
            <>
              <h2 className="gr-titulo">Falta só escolher a tua barbearia no Google</h2>
              <p className="gr-texto">Procura aqui em baixo e toca na tua ficha.</p>
            </>
          )}
        </section>

        {temExtra && (
          <>
            {/* 1. A FICHA */}
            <section className="gr-caixa">
              <div className="gr-cab"><span className="gr-num">1</span><h3>A tua barbearia no Google</h3></div>
              {ag.placeId && !lugares ? (
                <>
                {ag.eNegocio === false && (
                  <div className="gr-aviso">Isto é uma <b>morada</b>, não a ficha da barbearia — o Google não deixa avaliar moradas. Carrega em <b>Mudar</b> e procura pelo nome da barbearia.</div>
                )}
                <div className="gr-ficha">
                  <div className="gr-ficha-ico"><MapPin size={18} /></div>
                  <div className="gr-ficha-txt"><b>{ag.nome}</b><span>{ag.morada}</span></div>
                  <div className="gr-ficha-acoes">
                    {ag.maps && <a href={ag.maps} target="_blank" rel="noreferrer">Ver <ExternalLink size={13} /></a>}
                    <button type="button" onClick={() => setLugares([])}>Mudar</button>
                  </div>
                </div>
                </>
              ) : (
                <>
                  <div className="gr-procura">
                    <Search size={17} />
                    <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && procurar()} placeholder="Nome da barbearia e localidade" />
                    <button type="button" onClick={procurar} disabled={aProcurar}>{aProcurar ? '…' : 'Procurar'}</button>
                  </div>
                  {(lugares || []).map(l => (
                    <button key={l.id} type="button" className="gr-resultado" onClick={() => escolher(l.id)}>
                      <div className="gr-ficha-txt"><b>{l.nome}</b><span>{l.morada}</span></div>
                      <span className="gr-res-nota">{l.nota != null ? <>★ {String(l.nota).replace('.', ',')} <i>({l.total})</i></> : 'sem avaliações'}</span>
                    </button>
                  ))}
                  {lugares && lugares.length === 0 && !aProcurar && <p className="gr-mini">Escreve o nome e a localidade e carrega em Procurar.</p>}
                  <details className="gr-ajuda">
                    <summary>Não aparece a tua barbearia?</summary>
                    <ol>
                      <li>Abre o <a href="https://www.google.com/business/" target="_blank" rel="noreferrer">Google Business Profile</a> com a conta Google da barbearia e cria a ficha (é grátis).</li>
                      <li>O Google confirma que a barbearia é tua — por chamada, SMS, email ou vídeo (às vezes por carta).</li>
                      <li>Volta aqui e procura outra vez.</li>
                    </ol>
                  </details>
                </>
              )}
            </section>

            {/* 2. LIGAR E QUANDO */}
            <section className={`gr-caixa${ag.placeId ? '' : ' apagado'}`}>
              <div className="gr-cab">
                <span className="gr-num">2</span><h3>Pedir avaliação depois do corte</h3>
                <Toggle checked={!!ag.ativo} onChange={v => gravar({ ativo: v })} />
              </div>
              <div className="gr-seg" role="radiogroup" aria-label="Quando sai o pedido">
                {HORAS.map(([h, l]) => (
                  <button key={h} type="button" role="radio" aria-checked={horas === h} className={horas === h ? 'on' : ''} onClick={() => gravar({ horasDepois: h })}>{l}</button>
                ))}
              </div>

              {/* O que o cliente recebe — como uma notificação no telemóvel */}
              <div className="gr-notif">
                <div className="gr-notif-ico">{biz?.logoUrl ? <img src={biz.logoUrl} alt="" /> : (biz?.name || '?').slice(0, 1)}</div>
                <div className="gr-notif-txt">
                  <b>Como correu na {biz?.name || 'tua barbearia'}?</b>
                  <span>Deixa a tua avaliação no Google — demora 30 segundos.</span>
                  <em><Star size={13} fill="currentColor" /> Avaliar no Google</em>
                </div>
              </div>
              <p className="gr-mini">Sai por notificação ou email, uma vez a cada 3 meses por cliente. Vai para todos os clientes — escolher só os contentes é contra as regras do Google.</p>
            </section>
          </>
        )}
      </div>
    </AdminPage>
  );
}

/* A imagem do topo: public/google-reviews.png (o Diogo põe a que quiser).
   Enquanto não existir, fica o título em texto. */
function ImagemGoogle() {
  const [ok, setOk] = useState(true);
  if (!ok) return <div className="gr-marca">Google Reviews</div>;
  return <img className="gr-imagem" src="/google-reviews.png" alt="Google Reviews" onError={() => setOk(false)} />;
}
function Estrelas({ n }) {
  return <span className="gr-estrelas" aria-label={`${n} de 5`}>{[0, 1, 2, 3, 4].map(i => <Star key={i} size={16} fill={i < Math.round(n) ? 'currentColor' : 'none'} />)}</span>;
}

const CSS = `
.gr { display: grid; gap: 14px; max-width: 640px; margin: 0 auto; font-family: inherit; }
.gr h2, .gr h3 { font-family: inherit; }
.gr-topo { background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 20px; padding: 24px 20px; display: grid; gap: 14px; justify-items: center; text-align: center; }
.gr-imagem { width: min(260px, 70%); height: auto; display: block; }
.gr-topo.venda { padding: 0 0 24px; overflow: hidden; }
.gr-topo.venda > :not(picture) { margin-left: 20px; margin-right: 20px; }
.gr-capa { display: block; width: 100%; height: auto; }
.gr.venda-larga { max-width: 860px; }
.gr-marca { font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
.gr-titulo { font-size: 22px; font-weight: 800; line-height: 1.25; margin: 0; text-wrap: balance; }
.gr-texto { font-size: 15px; line-height: 1.55; color: var(--text-secondary); margin: 0; max-width: 46ch; }
.gr-btn { padding: 14px 24px; border-radius: 999px; border: 0; background: var(--gold); color: var(--on-gold, #111); font: inherit; font-size: 16px; font-weight: 800; cursor: pointer; }
.gr-btn:disabled { opacity: .6; }
.gr-mini { font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin: 0; }
.gr-nota { display: flex; align-items: center; gap: 14px; }
.gr-nota > b { font-size: 54px; line-height: 1; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.03em; }
.gr-nota > div { display: grid; gap: 4px; text-align: left; font-size: 14px; color: var(--text-secondary); }
.gr-estrelas { display: inline-flex; gap: 2px; color: #F5B301; }
.gr-numeros { display: grid; grid-template-columns: 1fr 1fr; width: 100%; border-top: 1px solid var(--border); padding-top: 14px; }
.gr-numeros > div { display: grid; gap: 2px; }
.gr-numeros > div + div { border-left: 1px solid var(--border); }
.gr-numeros b { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
.gr-numeros b.verde { color: var(--success); }
.gr-numeros span { font-size: 13px; color: var(--text-secondary); }
.gr-caixa { background: var(--bg-card, #fff); border: 1px solid var(--border); border-radius: 20px; padding: 18px; display: grid; gap: 14px; }
.gr-caixa.apagado { opacity: .5; pointer-events: none; }
.gr-cab { display: flex; align-items: center; gap: 10px; }
.gr-cab h3 { flex: 1; font-size: 16.5px; font-weight: 800; margin: 0; }
.gr-num { width: 26px; height: 26px; border-radius: 999px; background: var(--gold); color: var(--on-gold, #111); display: grid; place-items: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.gr-ficha, .gr-resultado { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: var(--bg, rgba(0,0,0,.03)); border: 1px solid var(--border); }
.gr-resultado { width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer; }
.gr-resultado:hover { border-color: var(--gold); }
.gr-ficha-ico { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-card, #fff); border: 1px solid var(--border); display: grid; place-items: center; flex-shrink: 0; }
.gr-ficha-txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
.gr-ficha-txt b { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gr-ficha-txt span { font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gr-ficha-acoes { display: flex; gap: 6px; flex-shrink: 0; }
.gr-ficha-acoes a, .gr-ficha-acoes button { display: inline-flex; align-items: center; gap: 4px; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg-card, #fff); color: var(--text); font: inherit; font-size: 13.5px; font-weight: 700; text-decoration: none; cursor: pointer; }
.gr-res-nota { font-size: 13.5px; font-weight: 700; white-space: nowrap; }
.gr-res-nota i { font-style: normal; color: var(--text-secondary); font-weight: 500; }
.gr-procura { display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg, transparent); color: var(--text-secondary); }
.gr-procura input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--text); font: inherit; font-size: 15px; outline: none; padding: 6px 0; }
.gr-procura button { padding: 9px 16px; border-radius: 999px; border: 0; background: var(--gold); color: var(--on-gold, #111); font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
.gr-aviso { padding: 12px 14px; border-radius: 12px; background: rgba(220, 38, 38, .08); border: 1px solid rgba(220, 38, 38, .35); font-size: 14px; line-height: 1.5; }
.gr-ajuda { font-size: 14px; color: var(--text-secondary); }
.gr-ajuda summary { cursor: pointer; font-weight: 700; color: var(--text); }
.gr-ajuda ol { margin: 8px 0 0; padding-left: 20px; display: grid; gap: 4px; line-height: 1.5; }
.gr-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 14px; background: var(--bg, rgba(0,0,0,.04)); border: 1px solid var(--border); }
.gr-seg button { padding: 10px 6px; border-radius: 10px; border: 0; background: transparent; color: var(--text-secondary); font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.gr-seg button.on { background: var(--bg-card, #fff); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,.12); }
.gr-notif { display: flex; gap: 12px; padding: 14px; border-radius: 18px; background: var(--bg, rgba(0,0,0,.04)); border: 1px solid var(--border); }
.gr-notif-ico { width: 40px; height: 40px; border-radius: 10px; background: var(--gold); color: var(--on-gold, #111); display: grid; place-items: center; font-weight: 800; overflow: hidden; flex-shrink: 0; }
.gr-notif-ico img { width: 100%; height: 100%; object-fit: cover; }
.gr-notif-txt { display: grid; gap: 3px; font-size: 14px; }
.gr-notif-txt span { color: var(--text-secondary); line-height: 1.45; }
.gr-notif-txt em { font-style: normal; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; color: #1A73E8; }
.gr-btn:focus-visible, .gr-seg button:focus-visible, .gr-resultado:focus-visible, .gr-procura button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
`;

/* A capa: cores fixas (creme e amarelo, como as imagens), nos dois temas. */
const CSS_CAPA = `
.grc { position: fixed; inset: 0; z-index: 1000; background: #FBF7EF; color: #1a1714; overflow-y: auto; display: flex; flex-direction: column; font-family: inherit; }
.grc-cabeca { display: flex; align-items: center; justify-content: space-between; padding: calc(14px + env(safe-area-inset-top, 0px)) 18px 6px; }
.grc-selo { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px 7px 7px; border-radius: 999px; background: #fff; font-weight: 800; font-size: 14px; box-shadow: 0 6px 18px -10px rgba(0,0,0,.3); }
.grc-selo span { width: 26px; height: 26px; border-radius: 999px; display: grid; place-items: center; background: #FEE96D; color: #1a1714; }
.grc-fechar { width: 48px; height: 48px; border-radius: 999px; border: 0; background: #fff; color: #1a1714; display: grid; place-items: center; cursor: pointer; box-shadow: 0 6px 18px -10px rgba(0,0,0,.3); }
.grc-corpo { flex: 1; display: grid; grid-template-columns: 1.05fr 1fr; align-items: center; gap: 32px; max-width: 1100px; width: 100%; margin: 0 auto; padding: 12px 24px 32px; }
.grc-visual { position: relative; aspect-ratio: 1 / .96; width: 100%; max-width: 560px; justify-self: center; order: 2; }
.grc-mancha { position: absolute; inset: 6% 2% 4% 8%; background: #FEE96D; border-radius: 58% 42% 46% 54% / 52% 44% 56% 48%; animation: grc-respira 12s ease-in-out infinite; }
.grc-tel { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 26px 36px rgba(40,30,0,.28)); animation: grc-flutua 6s ease-in-out infinite; }
.grc-texto { display: grid; gap: 20px; order: 1; }
.grc-h { font-family: inherit; font-size: clamp(28px, 4vw, 44px); line-height: 1.08; font-weight: 800; letter-spacing: -.02em; margin: 0; max-width: 15ch; text-wrap: balance; }
.grc-h em { font-style: normal; background: linear-gradient(transparent 62%, #FEE96D 62%); }
.grc-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.grc-lista li { display: flex; align-items: center; gap: 12px; font-size: 18px; font-weight: 700; }
.grc-lista li span { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; background: #FEE96D; flex-shrink: 0; }
.grc-sub { display: flex; gap: 8px; align-items: flex-start; margin: 0; font-size: 15px; line-height: 1.55; color: #4a4540; max-width: 44ch; }
.grc-sub svg { flex-shrink: 0; margin-top: 3px; color: #1E7F4E; }
.grc-preco { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.grc-preco small { font-size: 14px; font-weight: 500; color: #4a4540; }
.grc-acoes { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.grc-btn { padding: 16px 30px; border-radius: 999px; border: 0; background: #1a1714; color: #fff; font: inherit; font-size: 17px; font-weight: 800; cursor: pointer; }
.grc-btn:disabled { opacity: .6; }
.grc-btn:focus-visible, .grc-fechar:focus-visible, .grc-link:focus-visible { outline: 3px solid #E6B800; outline-offset: 3px; }
.grc-link { font-weight: 800; color: #1a1714; text-decoration: none; border-bottom: 2px solid #FEE96D; padding: 3px 0; }
@keyframes grc-flutua { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes grc-respira { 0%, 100% { border-radius: 58% 42% 46% 54% / 52% 44% 56% 48%; } 50% { border-radius: 44% 56% 54% 46% / 46% 56% 44% 54%; } }
@media (prefers-reduced-motion: reduce) { .grc-mancha, .grc-tel { animation: none; } }
@media (max-width: 800px) {
  .grc-corpo { grid-template-columns: 1fr; gap: 8px; padding: 0 20px calc(28px + env(safe-area-inset-bottom, 0px)); align-content: start; }
  .grc-visual { order: 1; max-width: 380px; }
  .grc-texto { order: 2; }
  .grc-lista li { font-size: 16.5px; }
  .grc-btn { flex: 1; text-align: center; }
}
`;
