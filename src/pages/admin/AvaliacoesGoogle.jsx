import React, { useEffect, useState } from 'react';
import { Star, Search, ExternalLink, Check, Send } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import Toggle from '@/components/admin/Toggle';
import { Button } from '@/components/ui';
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

  const caixa = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'grid', gap: 14 };
  const titulo = { fontSize: 17, fontWeight: 800, margin: 0 };
  const sub = { fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 };
  const ganhou = ag.placeId && ag.total != null && ag.totalInicial != null ? Math.max(0, ag.total - ag.totalInicial) : null;

  /* ── Sem o suplemento: a apresentação ── */
  if (!temExtra) {
    return (
      <AdminPage title="Avaliações Google">
        <Confirmacao />
        <div style={{ ...caixa, maxWidth: 640 }}>
          <div style={{ display: 'flex', gap: 4, color: 'var(--gold)' }}>{[0, 1, 2, 3, 4].map(i => <Star key={i} size={22} fill="currentColor" />)}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Mais avaliações no Google, sem teres de pedir</h2>
          <p style={sub}>Depois de cada corte, o teu cliente recebe uma mensagem da tua barbearia com o link direto para te avaliar no Google. Quem tem mais avaliações aparece primeiro no Google Maps — e é aí que os clientes novos te encontram.</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6, fontSize: 15 }}>
            <li>Sai sozinho, depois de cada marcação</li>
            <li>Uma vez por cliente a cada 3 meses — os habituais não levam com isto todas as semanas</li>
            <li>Vês aqui quantas avaliações ganhaste desde que ligaste</li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Button onClick={juntar} disabled={aJuntar}>{aJuntar ? 'A juntar…' : `Juntar por ${formatPrice(extra.precos[periodo] ?? extra.precos.mensal)}${sufixoPeriodo(periodo)}`}</Button>
            <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Desligas quando quiseres.</span>
          </div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Avaliações Google">
      <Confirmacao />
      <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
        {/* O resultado */}
        {ag.placeId && (
          <div style={{ ...caixa, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div><div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>No Google</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>★ {ag.nota != null ? String(ag.nota).replace('.', ',') : '—'}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{ag.total || 0} avaliações</div></div>
            <div><div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Desde que ligaste</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: ganhou ? 'var(--success)' : undefined }}>+{ganhou ?? 0}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>avaliações novas</div></div>
            <div><div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Pedidos enviados</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{resumo?.enviados_30d ?? 0}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>nos últimos 30 dias</div></div>
          </div>
        )}

        {/* 1. A ficha no Google */}
        <div style={caixa}>
          <h2 style={titulo}>1. A tua barbearia no Google</h2>
          {ag.placeId && !lugares ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Check size={18} color="var(--success)" />
              <div style={{ flex: 1, minWidth: 200 }}><div style={{ fontWeight: 800 }}>{ag.nome}</div><div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{ag.morada}</div></div>
              {ag.link && <a href={ag.link} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 700, display: 'inline-flex', gap: 5, alignItems: 'center' }}>Ver o que o cliente vê <ExternalLink size={14} /></a>}
              <Button variant="secondary" onClick={() => setLugares([])}>Mudar</Button>
            </div>
          ) : (
            <>
              <p style={sub}>Procura pelo nome e a localidade e escolhe a tua ficha.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && procurar()} placeholder="Ex.: Barbearia do Rui, Castelo Branco"
                  style={{ flex: 1, minWidth: 220, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', font: 'inherit', fontSize: 15 }} />
                <Button onClick={procurar} disabled={aProcurar} icon={<Search size={16} />}>{aProcurar ? 'A procurar…' : 'Procurar'}</Button>
              </div>
              {lugares && lugares.length === 0 && !aProcurar && texto && <p style={sub}>Escreve o nome e carrega em Procurar.</p>}
              {(lugares || []).map(l => (
                <button key={l.id} type="button" onClick={() => escolher(l.id)}
                  style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', font: 'inherit', cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{l.nome}</div><div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{l.morada}</div></div>
                  <div style={{ fontSize: 14, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{l.nota != null ? `★ ${String(l.nota).replace('.', ',')} · ${l.total}` : 'sem avaliações'}</div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* 2. Ligar */}
        <div style={{ ...caixa, opacity: ag.placeId ? 1 : 0.5, pointerEvents: ag.placeId ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ ...titulo, flex: 1 }}>2. Pedir a avaliação depois de cada corte</h2>
            <Toggle checked={!!ag.ativo} onChange={v => gravar({ ativo: v })} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {HORAS.map(([h, l]) => (
              <button key={h} type="button" onClick={() => gravar({ horasDepois: h })}
                style={{ padding: '8px 14px', borderRadius: 999, border: `1.5px solid ${(ag.horasDepois || 2) === h ? 'var(--gold)' : 'var(--border)'}`, background: 'transparent', color: 'var(--text)', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: 14, display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center' }}><Send size={13} /> O que o cliente recebe</div>
            <div style={{ fontWeight: 800 }}>Como correu na {biz?.name || 'tua barbearia'}?</div>
            <div style={{ fontSize: 14.5, color: 'var(--text-secondary)' }}>Se tiveres 30 segundos, deixa-nos uma avaliação no Google. É assim que outras pessoas nos encontram. <b>[Avaliar no Google]</b></div>
          </div>
          <p style={{ ...sub, fontSize: 13.5 }}>Vai por notificação (se o cliente as tem ligadas) ou por email confirmado. Uma vez por cliente a cada 3 meses. Pede-se a todos os clientes — escolher só os contentes é contra as regras do Google.</p>
        </div>
      </div>
    </AdminPage>
  );
}
