import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Share2, Clock3, BadgeCheck, X, Banknote, ChevronRight } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Modal } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

/*
 * TRAZ UM AMIGO (19/10/2026, pedido do Diogo) — o programa de indicações.
 *
 * O barbeiro tem um código (RASTA-2K7) e um link. Cada amigo que entre por
 * esse link e pague o 1.º mês dá-lhe 40 € EM DINHEIRO. Ele diz onde quer
 * receber (MB WAY/IBAN); a Convecta envia e marca pago no super admin.
 *
 * DESIGN (redesign 19/10): a 1.ª vez abre uma capa à Fresha — a foto do
 * amigo a apontar fica CORTADA em baixo e, por cima, 3 passos curtíssimos
 * (sem textos para ler) + «Começar». Dentro da aba há uma secção de regras
 * explícita (vale / não vale) atrás de «Ver regras». O resto (código, link,
 * partilhar, onde receber, lista) mantém-se.
 */
const VALOR = 40;
const ESTADO = {
  registou: ['Registou-se', 'var(--text-sec)'],
  em_teste: ['Está a experimentar', 'var(--warning, #b45309)'],
  pagou: ['Pagou — ganhaste 40 €', 'var(--success)'],
  caiu: ['Não ficou', 'var(--text-ter)'],
};

// Os 3 passos — 2/3 palavras cada, é tudo o que ele precisa de perceber.
const PASSOS = [
  { Icone: Share2, t: 'Partilha o link' },
  { Icone: BadgeCheck, t: 'O amigo paga' },
  { Icone: Banknote, t: 'Ganhas 40 €' },
];

export default function Indicacoes() {
  const toast = useToast();
  const [codigo, setCodigo] = useState(null);
  const [lista, setLista] = useState(null);
  const [copiado, setCopiado] = useState('');
  const [verRegras, setVerRegras] = useState(false);
  // O «onde receber» é da CONTA (negócio principal), não deste espaço —
  // por isso lê-se e grava-se por RPC, para ser o mesmo em todo o grupo.
  const [recebeGravado, setRecebeGravado] = useState('');
  const [tipoRecebe, setTipoRecebe] = useState('mbway');
  const [numRecebe, setNumRecebe] = useState('');
  const [aGravar, setAGravar] = useState(false);
  // Na 1.ª vez, a capa abre em ecrã inteiro (como os Pagamentos online).
  const [cartaz, setCartaz] = useState(() => { try { return localStorage.getItem('convecta_indicacoes_visto') !== '1'; } catch { return true; } });
  const fecharCartaz = () => { try { localStorage.setItem('convecta_indicacoes_visto', '1'); } catch { /* nada */ } setCartaz(false); };
  // Junta o tipo + o número num texto só, que é o que o super admin lê.
  const recebeMontado = numRecebe.trim() ? (tipoRecebe === 'iban' ? 'IBAN ' + numRecebe.trim() : 'MB WAY ' + numRecebe.trim()) : '';

  useEffect(() => {
    supabase.rpc('meu_codigo_indicacao').then(({ data: c, error }) => { if (!error) setCodigo(c); });
    supabase.rpc('minhas_indicacoes').then(({ data: l }) => setLista(l || []));
    supabase.rpc('meu_recebe_indicacao').then(({ data: r }) => {
      const v = (r || '').trim();
      setRecebeGravado(v);
      setTipoRecebe(/^iban/i.test(v) ? 'iban' : 'mbway');
      setNumRecebe(v.replace(/^(mb\s*way|iban)\s*/i, ''));
    });
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
    try { const { error } = await supabase.rpc('guardar_recebe_indicacao', { p_texto: recebeMontado }); if (error) throw error; setRecebeGravado(recebeMontado); toast.success('Guardado'); }
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

        {/* Como funciona — 3 passos, sem textos para ler */}
        <section className="ind-top">
          <h2>Ganha <b>{VALOR} €</b> por cada amigo</h2>
          <div className="ind-passos">
            {PASSOS.map(({ Icone, t }, k) => (
              <div key={k} className="ind-passo">
                <span className="ind-passo-n">{k + 1}</span>
                <Icone size={22} />
                <p>{t}</p>
              </div>
            ))}
          </div>
          <p className="ind-top-nota">Em dinheiro, sem limite. 3 amigos são {VALOR * 3} €.</p>
          <button type="button" className="ind-regras-link" onClick={() => setVerRegras(true)}>
            Quando é válido — ver regras <ChevronRight size={16} />
          </button>
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
            <div className="ind-amigos">
              {lista.map((i, k) => {
                const [rot, cor] = ESTADO[i.estado] || ['—', 'var(--text-sec)'];
                // Marcos: Entrou -> Paga o 1.o mes -> 40 euros na conta.
                const feitos = i.recompensa_paga_em ? 3 : i.estado === 'pagou' ? 2 : 1;
                const caiu = i.estado === 'caiu';
                const prox = caiu ? 'Não ficou desta vez.'
                  : i.recompensa_paga_em ? `Recebeste os ${VALOR} €. 🎉`
                  : i.estado === 'pagou' ? `Ganhaste ${VALOR} €! Vamos enviar para o que indicaste.`
                  : `Falta ele pagar o 1.º mês — depois caem-te ${VALOR} €.`;
                return (
                  <div key={k} className="ind-amigo">
                    <div className="ind-amigo-topo">
                      <b className="po-nowrap">{i.nome || 'Negócio'}</b>
                      <span className="po-nowrap" style={{ color: cor, fontWeight: 700, fontSize: 13.5 }}>
                        {i.estado === 'pagou' && i.recompensa_paga_em ? <BadgeCheck size={14} style={{ verticalAlign: '-2px' }} /> : null} {rot}
                      </span>
                    </div>
                    <div className="ind-passinhos">
                      {['Entrou', `Paga o 1.º mês`, `${VALOR} € na conta`].map((m, j) => {
                        const on = !caiu && j < feitos;
                        return (
                          <React.Fragment key={j}>
                            {j > 0 && <i className={'ind-traco' + (on ? ' on' : '')} />}
                            <span className={'ind-marco' + (on ? ' on' : '')}>
                              <b>{on ? '✓' : ''}</b>{m}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    {!caiu && <div className="ind-amigo-prox">{prox}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Regras — explícito, vale / não vale */}
      <Modal open={verRegras} onClose={() => setVerRegras(false)} title="Regras dos 40 €">
        <div className="ind-regras">
          <div className="ind-regras-g">
            <div className="ind-regras-h ok">Ganhas 40 € quando</div>
            <ul>
              <li><Check size={16} /> O amigo entra pelo <b>teu link</b></li>
              <li><Check size={16} /> E paga o <b>1.º mês</b></li>
              <li><Check size={16} /> É um negócio <b>novo</b> na Convecta</li>
              <li><Check size={16} /> Sem limite de amigos</li>
            </ul>
          </div>
          <div className="ind-regras-g">
            <div className="ind-regras-h no">Não conta quando</div>
            <ul>
              <li><X size={16} /> Ele <b>não chega a pagar</b></li>
              <li><X size={16} /> Cancela ou pede reembolso nos 1.<sup>os</sup> 14 dias</li>
              <li><X size={16} /> Já era cliente Convecta</li>
              <li><X size={16} /> Te indicas a ti mesmo</li>
            </ul>
          </div>
          <p className="ind-regras-nota">Pagamos para o MB WAY ou IBAN que indicares, depois de ele pagar.</p>
        </div>
      </Modal>

      {/* Capa da 1.ª vez — foto cortada em baixo, passos por cima (à Fresha) */}
      {cartaz && createPortal(
        <div className="ind-full" role="dialog" aria-modal="true" aria-label="Ganha 40 € ao convidar um amigo">
          <button type="button" className="ind-full-x" onClick={fecharCartaz} aria-label="Fechar"><X size={24} /></button>
          <div className="ind-full-top">
            <div className="ind-full-eyebrow">Convida e ganha</div>
            <div className="ind-full-passos">
              {PASSOS.map(({ Icone, t }, k) => (
                <div key={k} className="ind-full-passo">
                  <span><Icone size={24} /></span>
                  <p>{t}</p>
                </div>
              ))}
            </div>
            <button type="button" className="ind-full-btn" onClick={fecharCartaz}>Começar</button>
          </div>
          <picture className="ind-full-img">
            <source media="(min-width: 768px)" srcSet="/indicacoes/ganha-40-amigo.jpg" />
            <img src="/indicacoes/ganha-40-amigo-tlm.jpg" alt="Ganha 40 € ao convidar o teu amigo" />
          </picture>
        </div>, document.body)}
    </AdminPage>
  );
}

const CSS = `
.ind { max-width: 640px; display: grid; gap: 22px; }
.po-nowrap { white-space: nowrap; }

/* Topo — como funciona */
.ind-top { text-align: center; padding: 4px 0 2px; display: grid; gap: 16px; justify-items: center; }
.ind-top h2 { font-family: var(--font-head); font-size: clamp(26px, 6vw, 34px); margin: 0; color: var(--text); }
.ind-top h2 b { color: var(--gold-tinta); }
.ind-passos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; }
.ind-passo { position: relative; display: grid; gap: 8px; justify-items: center; padding: 18px 8px 14px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface); }
.ind-passo-n { position: absolute; top: 8px; left: 10px; font-size: 12px; font-weight: 800; color: var(--text-ter); }
.ind-passo svg { color: var(--gold-tinta); }
.ind-passo p { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--text); line-height: 1.25; }
.ind-top-nota { margin: 0; color: var(--text-sec); font-size: 14.5px; }
.ind-regras-link { display: inline-flex; align-items: center; gap: 2px; padding: 6px 2px; border: 0; background: transparent; color: var(--gold-tinta); font: inherit; font-weight: 700; font-size: 14.5px; cursor: pointer; }

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
.ind-amigos { display: grid; gap: 10px; }
.ind-amigo { border: 1px solid var(--border); border-radius: 14px; background: var(--surface); padding: 13px 14px; display: grid; gap: 9px; }
.ind-amigo-topo { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ind-amigo-topo b { font-size: 15px; color: var(--text); }
.ind-passinhos { display: flex; align-items: center; gap: 0; flex-wrap: wrap; }
.ind-marco { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--text-ter); white-space: nowrap; }
.ind-marco.on { color: var(--text); font-weight: 700; }
.ind-marco b { display: grid; place-items: center; width: 15px; height: 15px; border-radius: 999px; border: 1.5px solid var(--border); font-size: 9px; color: #fff; }
.ind-marco.on b { background: var(--success); border-color: var(--success); }
.ind-traco { width: 16px; height: 2px; background: var(--border); margin: 0 5px; flex-shrink: 0; }
.ind-traco.on { background: var(--success); }
.ind-amigo-prox { font-size: 13px; color: var(--text-sec); line-height: 1.4; }

/* Regras (modal) */
.ind-regras { display: grid; gap: 18px; }
.ind-regras-g { display: grid; gap: 8px; }
.ind-regras-h { font-size: 13px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.ind-regras-h.ok { color: var(--success); }
.ind-regras-h.no { color: var(--text-ter); }
.ind-regras ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ind-regras li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; color: var(--text); line-height: 1.4; }
.ind-regras li svg { flex-shrink: 0; margin-top: 2px; }
.ind-regras-g:nth-child(1) li svg { color: var(--success); }
.ind-regras-g:nth-child(2) li svg { color: var(--text-ter); }
.ind-regras-nota { margin: 0; font-size: 13px; color: var(--text-ter); line-height: 1.5; }

/* Capa da 1.ª vez — passos em cima, foto cortada em baixo */
.ind-full { position: fixed; inset: 0; z-index: 9000; background: #000; display: flex; flex-direction: column; animation: ind-full-entra 240ms ease backwards; }
@keyframes ind-full-entra { from { opacity: 0; } }
.ind-full-x { position: absolute; z-index: 3; top: calc(env(safe-area-inset-top, 0px) + 12px); right: 14px; width: 44px; height: 44px; border-radius: 999px; border: 0; background: rgba(255,255,255,.14); backdrop-filter: blur(6px); color: #fff; display: grid; place-items: center; cursor: pointer; }
.ind-full-top { position: relative; z-index: 2; padding: calc(env(safe-area-inset-top, 0px) + 56px) 24px 22px; display: grid; gap: 20px; justify-items: center; text-align: center; }
.ind-full-eyebrow { font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }
.ind-full-top h2 { font-family: var(--font-head); font-size: clamp(30px, 8vw, 40px); line-height: 1.05; margin: 0; color: #fff; }
.ind-full-top h2 b { color: var(--gold); }
.ind-full-passos { display: flex; gap: 10px; width: 100%; max-width: 440px; }
.ind-full-passo { flex: 1; display: grid; gap: 8px; justify-items: center; padding: 14px 6px; border-radius: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
.ind-full-passo span { color: var(--gold); }
.ind-full-passo p { margin: 0; font-size: 12.5px; font-weight: 600; color: #fff; line-height: 1.2; }
.ind-full-btn { min-height: 54px; padding: 0 56px; border-radius: 999px; border: 0; background: var(--gold); color: #15120E; font: inherit; font-size: 17px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.ind-full-img { position: relative; flex: 1 1 auto; min-height: 180px; overflow: hidden; margin-top: 4px; }
.ind-full-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.ind-full-img::before { content: ''; position: absolute; inset: 0 0 auto; height: 72px; z-index: 1; background: linear-gradient(#000, transparent); }
@media (min-width: 768px) {
  .ind-full { flex-direction: row; align-items: stretch; }
  .ind-full-top { flex: 1; align-content: center; padding: 48px; max-width: 560px; margin: auto 0; }
  .ind-full-top h2 { font-size: 46px; }
  .ind-full-img { flex: 1; min-height: 0; }
  .ind-full-img img { object-position: center; }
  .ind-full-img::before { display: none; }
}
`;
