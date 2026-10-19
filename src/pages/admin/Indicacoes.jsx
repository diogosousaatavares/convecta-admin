import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Share2, Clock3, BadgeCheck, X } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';
import { formatPrice } from '@/lib/format';

/*
 * TRAZ UM AMIGO (19/10/2026, pedido do Diogo) — o programa de indicações.
 *
 * O barbeiro tem um código (RASTA-2K7) e um link. Cada amigo que entre por
 * esse link e pague o 1.º mês dá-lhe 40 € EM DINHEIRO. Ele diz onde quer
 * receber (MB WAY/IBAN); a Convecta envia e marca pago no super admin.
 *
 * O canal é o WhatsApp (grupos de barbeiros): o botão «Partilhar» abre o
 * WhatsApp com o texto e o link prontos. O código vem da função
 * meu_codigo_indicacao (cria-se na 1.ª vez). A lista vem de minhas_indicacoes.
 *
 * O lado do amigo (1.º mês a metade) e os 40 € a cair sozinhos quando ele
 * paga ligam-se na Fase 2 (site /comecar + webhook do Stripe).
 */
const VALOR = 40;
const ESTADO = {
  registou: ['Registou-se', 'var(--text-sec)'],
  em_teste: ['Está a experimentar', 'var(--warning, #b45309)'],
  pagou: ['Pagou — ganhaste 40 €', 'var(--success)'],
  caiu: ['Não ficou', 'var(--text-ter)'],
};

export default function Indicacoes() {
  const data = useStore();
  const toast = useToast();
  const [codigo, setCodigo] = useState(null);
  const [lista, setLista] = useState(null);
  const [copiado, setCopiado] = useState('');
  const recebeGravado = data.business?._settings?.indicacaoRecebe || '';
  const [tipoRecebe, setTipoRecebe] = useState(/^iban/i.test(recebeGravado) ? 'iban' : 'mbway');
  const [numRecebe, setNumRecebe] = useState(recebeGravado.replace(/^(mb\s*way|iban)\s*/i, ''));
  const [aGravar, setAGravar] = useState(false);
  // Na 1.ª vez, o cartaz abre em ecrã inteiro (como os Pagamentos online).
  const [cartaz, setCartaz] = useState(() => { try { return localStorage.getItem('convecta_indicacoes_visto') !== '1'; } catch { return true; } });
  const fecharCartaz = () => { try { localStorage.setItem('convecta_indicacoes_visto', '1'); } catch { /* nada */ } setCartaz(false); };
  // Junta o tipo + o número num texto só, que é o que o super admin lê.
  const recebeMontado = numRecebe.trim() ? (tipoRecebe === 'iban' ? 'IBAN ' + numRecebe.trim() : 'MB WAY ' + numRecebe.trim()) : '';

  useEffect(() => {
    supabase.rpc('meu_codigo_indicacao').then(({ data: c, error }) => { if (!error) setCodigo(c); });
    supabase.rpc('minhas_indicacoes').then(({ data: l }) => setLista(l || []));
  }, []);

  const link = codigo ? `https://convecta.pt/comecar?ref=${codigo}` : '';
  const texto = `Olá! Uso a Convecta para gerir as marcações e tem-me dado jeito. Se quiseres experimentar, entra por aqui que o 1.º mês fica a metade: ${link}`;

  const copiar = async (valor, qual) => {
    try { await navigator.clipboard.writeText(valor); setCopiado(qual); setTimeout(() => setCopiado(''), 1800); }
    catch { toast.error('Não deu para copiar', 'Copia à mão, se faz favor.'); }
  };
  const partilhar = async () => {
    if (navigator.share) { try { await navigator.share({ text: texto }); return; } catch { /* seguiu para o WhatsApp */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };
  const guardarRecebe = async () => {
    setAGravar(true);
    try { await dataService.updateBusiness({ indicacaoRecebe: recebeMontado }); toast.success('Guardado'); }
    catch (e) { toast.error('Não ficou gravado', e.message); }
    finally { setAGravar(false); }
  };

  const pagas = (lista || []).filter(i => i.estado === 'pagou');
  const ganho = pagas.reduce((t, i) => t + (i.valor_cents || 0) / 100, 0);
  const recebido = pagas.filter(i => i.recompensa_paga_em).reduce((t, i) => t + (i.valor_cents || 0) / 100, 0);
  const aCaminho = ganho - recebido;

  return (
    <AdminPage title="Traz um amigo">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ind">

        <section className="ind-hero">
          <h2>Ganha <b>{VALOR} €</b> por cada amigo</h2>
          <p>Por cada barbearia, salão ou estética que entre pelo teu link e pague o 1.º mês, recebes {VALOR} € em dinheiro. Sem limite — 3 amigos são {VALOR * 3} €.</p>
        </section>

        {/* O código e o link */}
        <div className="ind-bloco">
          <div className="nt-titulo">O teu código</div>
          <button type="button" className="ind-codigo" onClick={() => codigo && copiar(codigo, 'cod')}>
            <span>{codigo || '…'}</span>
            {copiado === 'cod' ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button type="button" className="ind-link" onClick={() => link && copiar(link, 'link')}>
            <span className="ind-link-txt">{link || 'a preparar…'}</span>
            {copiado === 'link' ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button type="button" className="ind-partilhar" onClick={partilhar} disabled={!codigo}>
            <Share2 size={18} /> Partilhar no WhatsApp
          </button>
        </div>

        {/* Como funciona */}
        <div className="ind-passos">
          <div><span>1</span><p>Partilhas o teu link com outro dono.</p></div>
          <div><span>2</span><p>Ele monta o negócio e começa a pagar. O 1.º mês dele fica a metade.</p></div>
          <div><span>3</span><p>Recebes {VALOR} € em dinheiro.</p></div>
        </div>

        {/* Onde receber */}
        <div className="ind-bloco">
          <div className="nt-titulo">Onde queres receber os {VALOR} €</div>
          <div className="ind-tipo">
            <button type="button" className={tipoRecebe === 'mbway' ? 'on' : ''} onClick={() => setTipoRecebe('mbway')}>MB WAY</button>
            <button type="button" className={tipoRecebe === 'iban' ? 'on' : ''} onClick={() => setTipoRecebe('iban')}>IBAN</button>
          </div>
          <div className="ind-recebe">
            <input value={numRecebe}
              inputMode={tipoRecebe === 'mbway' ? 'tel' : 'text'}
              placeholder={tipoRecebe === 'mbway' ? 'O teu número MB WAY (9xx xxx xxx)' : 'O teu IBAN (PT50 …)'}
              onChange={e => setNumRecebe(e.target.value)} />
            <button type="button" onClick={guardarRecebe} disabled={aGravar || !numRecebe.trim() || recebeMontado === recebeGravado}>Guardar</button>
          </div>
          <p className="ind-nota">{tipoRecebe === 'mbway'
            ? 'Enviamos por MB WAY para este número quando um amigo paga.'
            : 'Fazemos a transferência para este IBAN quando um amigo paga.'} Só tu e a Convecta vêem isto.</p>
        </div>

        {/* O que já ganhaste */}
        {pagas.length > 0 && (
          <div className="ind-ganho">
            <div><span>Já ganhaste</span><b>{formatPrice(ganho)}</b></div>
            {aCaminho > 0 && <div className="ind-ganho-sub"><Clock3 size={14} /> {formatPrice(aCaminho)} a caminho</div>}
          </div>
        )}

        {/* A lista */}
        <div className="ind-bloco">
          <div className="nt-titulo">Os teus amigos</div>
          {lista == null ? (
            <div className="ind-vazio">A carregar…</div>
          ) : lista.length === 0 ? (
            <div className="ind-vazio">Ainda não indicaste ninguém. Partilha o teu link e aparece aqui.</div>
          ) : (
            <div className="nt-lista">
              {lista.map((i, k) => {
                const [rot, cor] = ESTADO[i.estado] || ['—', 'var(--text-sec)'];
                return (
                  <div key={k} className="nt-row">
                    <span className="nt-txt"><b className="po-nowrap">{i.nome || 'Negócio'}</b></span>
                    <span className="po-nowrap" style={{ color: cor, fontWeight: 600, fontSize: 14 }}>
                      {i.estado === 'pagou' && (i.recompensa_paga_em ? <BadgeCheck size={14} style={{ verticalAlign: '-2px' }} /> : null)} {rot}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {cartaz && createPortal(
        <div className="ind-full" role="dialog" aria-modal="true" aria-label="Ganha 40 € ao convidar um amigo">
          <picture>
            <source media="(min-width: 768px)" srcSet="/indicacoes/ganha-40-amigo.jpg" />
            <img src="/indicacoes/ganha-40-amigo-tlm.jpg" alt="Ganha 40 € ao convidar o teu amigo" />
          </picture>
          <button type="button" className="ind-full-x" onClick={fecharCartaz} aria-label="Fechar"><X size={26} /></button>
          <button type="button" className="ind-full-btn" onClick={fecharCartaz}>Começar</button>
        </div>, document.body)}
    </AdminPage>
  );
}

const CSS = `
.ind { max-width: 640px; display: grid; gap: 22px; }
.po-nowrap { white-space: nowrap; }
/* Cartaz em ecrã inteiro (1.ª vez), à Pagamentos online */
.ind-full { position: fixed; inset: 0; z-index: 9000; background: #000; display: flex; align-items: center; justify-content: center; animation: ind-full-entra 240ms ease backwards; }
@keyframes ind-full-entra { from { opacity: 0; } }
.ind-full picture, .ind-full img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ind-full-x { position: absolute; z-index: 2; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 14px; width: 48px; height: 48px; border-radius: 999px; border: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(6px); color: #fff; display: grid; place-items: center; cursor: pointer; }
.ind-full-btn { position: absolute; z-index: 2; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom, 0px) + 28px); min-height: 54px; padding: 0 44px; border-radius: 999px; border: 0; background: var(--gold); color: #15120E; font: inherit; font-size: 17px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.4); }
@media (min-width: 768px) { .ind-full img, .ind-full picture { max-width: 1100px; position: relative; height: auto; } .ind-full { padding: 24px; } }
.ind-hero { text-align: center; padding: 6px 0 4px; }
.ind-selo { width: 54px; height: 54px; border-radius: 16px; margin: 0 auto 14px; display: grid; place-items: center; color: #15120E; background: var(--gold); }
.ind-hero h2 { font-family: var(--font-head); font-size: clamp(26px, 6vw, 34px); margin: 0 0 8px; color: var(--text); }
.ind-hero h2 b { color: var(--gold-tinta); }
.ind-hero p { margin: 0 auto; max-width: 440px; color: var(--text-sec); font-size: 15.5px; line-height: 1.55; }
.ind-bloco { display: grid; gap: 10px; }
.nt-titulo { font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-ter); }
.ind-codigo { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; border-radius: 14px; border: 1.5px dashed var(--gold); background: rgba(var(--gold-rgb), .06); color: var(--text); font: inherit; cursor: pointer; }
.ind-codigo span { font-family: var(--font-head); font-size: 26px; font-weight: 700; letter-spacing: .04em; }
.ind-codigo svg { color: var(--gold-tinta); flex-shrink: 0; }
.ind-link { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text-sec); font: inherit; cursor: pointer; }
.ind-link-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.ind-link svg { flex-shrink: 0; color: var(--text-ter); }
.ind-partilhar { min-height: 52px; border-radius: 999px; border: 0; background: var(--text); color: var(--surface); font: inherit; font-size: 16px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; }
.ind-partilhar:disabled { opacity: .5; }
.ind-passos { display: grid; gap: 12px; }
.ind-passos > div { display: flex; align-items: center; gap: 14px; }
.ind-passos span { width: 30px; height: 30px; flex-shrink: 0; border-radius: 999px; background: var(--elevated); border: 1px solid var(--border); display: grid; place-items: center; font-weight: 700; font-size: 14px; color: var(--text); }
.ind-passos p { margin: 0; font-size: 15px; color: var(--text); line-height: 1.4; }
.ind-tipo { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 999px; background: var(--elevated); border: 1px solid var(--border); max-width: 300px; }
.ind-tipo button { min-height: 40px; border: 0; border-radius: 999px; background: transparent; color: var(--text-sec); font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.ind-tipo button.on { background: var(--text); color: var(--surface); }
.ind-recebe { display: flex; gap: 8px; }
.ind-recebe input { flex: 1; min-width: 0; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-size: 15px; }
.ind-recebe button { padding: 0 18px; border-radius: 12px; border: 0; background: var(--text); color: var(--surface); font: inherit; font-weight: 700; cursor: pointer; white-space: nowrap; }
.ind-recebe button:disabled { opacity: .5; }
.ind-nota { margin: 0; font-size: 13px; color: var(--text-ter); line-height: 1.5; }
.ind-ganho { border-radius: 16px; border: 1px solid var(--border); background: var(--surface); padding: 18px; }
.ind-ganho > div:first-child { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.ind-ganho span { color: var(--text-sec); font-size: 14px; }
.ind-ganho b { font-family: var(--font-head); font-size: 34px; color: var(--success); }
.ind-ganho-sub { margin-top: 6px; font-size: 13.5px; color: var(--text-sec); display: flex; align-items: center; gap: 6px; }
.ind-vazio { padding: 24px 0; text-align: center; color: var(--text-ter); font-size: 14.5px; }
`;
