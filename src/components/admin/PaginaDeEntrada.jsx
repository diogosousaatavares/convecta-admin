import React, { useEffect, useState } from 'react';
import { DoorOpen, ChevronRight, X, ImagePlus } from 'lucide-react';
import { W, W2, BD, T, T2, T3, R, G, Spin, Btn, Inp, Lbl } from '@/components/design/ui';
import { useGrupo, usePorta, guardarPorta } from '@/lib/grupo';
import { uploadBusinessAsset, reduzirParaTamanho } from '@/lib/designService';
import { nomeDoLado } from '@/lib/nicho';

/*
 * A PÁGINA DE ENTRADA DE UM ESPAÇO COM VÁRIOS NEGÓCIOS (12/10/2026).
 *
 * Pedido do Diogo: quem tem negócios ligados muda a página que o link abre
 * (a «porta»: foto, título, pergunta, nome de cada botão) e escolhe qual é o
 * PRINCIPAL — o negócio cujo link abre a porta. A subscrição não mexe.
 *
 * Só aparece com dois negócios ligados e com o SQL PORTA_DO_ESPACO corrido
 * (sem ele, usePorta devolve null e isto não se mostra).
 */
const PERGUNTA = 'O que vens fazer hoje?';
const nomeDe = n => (n ? nomeDoLado(n.tipo) || n.name : '');

export default function PaginaDeEntrada({ biz }) {
  const grupo = useGrupo();
  const [porta, setPorta] = usePorta();
  const [aberto, setAberto] = useState(false);
  if (!grupo.ligado || !porta) return null;

  const principal = grupo.lista.find(n => n.id === porta.principal) || grupo.principal;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button type="button" className="pe-faixa" onClick={() => setAberto(true)}>
        <DoorOpen size={20} />
        <span className="pe-faixa-txt">
          <b>Página de entrada</b>
          <small>Principal: {nomeDe(principal)} · foto, texto e botões</small>
        </span>
        <ChevronRight size={18} />
      </button>
      {aberto && (
        <Editor biz={biz} grupo={grupo} porta={porta}
          onGuardado={p => { setPorta(p); setAberto(false); }}
          onFechar={() => setAberto(false)} />
      )}
    </>
  );
}

function Editor({ biz, grupo, porta, onGuardado, onFechar }) {
  const [principal, setPrincipal] = useState(porta.principal || grupo.principal?.id);
  const [foto, setFoto] = useState(porta.foto || '');
  const [titulo, setTitulo] = useState(porta.titulo || '');
  const [pergunta, setPergunta] = useState(porta.pergunta || '');
  const [botoes, setBotoes] = useState(porta.botoes || {});
  const [aEnviar, setAEnviar] = useState(false);
  const [aGravar, setAGravar] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = antes; };
  }, []);

  const doPrincipal = grupo.lista.find(n => n.id === principal) || grupo.principal;
  // O principal fica em primeiro, como na porta a sério.
  const ordem = [...grupo.lista].sort((a, b) => (b.id === principal) - (a.id === principal));

  const enviarFoto = async e => {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    setAEnviar(true); setErro('');
    try {
      const file = await reduzirParaTamanho(original, 4 * 1024 * 1024);
      setFoto(await uploadBusinessAsset(biz.id, file, 'porta'));
    } catch (err) { setErro('Não foi possível enviar a foto: ' + err.message); }
    finally { setAEnviar(false); }
  };

  const guardar = async () => {
    setAGravar(true); setErro('');
    try {
      onGuardado(await guardarPorta({ principal, foto, titulo, pergunta, botoes }));
    } catch (err) { setErro(err.message); setAGravar(false); }
  };

  return (
    <div className="pe-fundo" onClick={onFechar}>
      <div className="pe-janela" role="dialog" aria-label="Página de entrada" onClick={e => e.stopPropagation()}>
        <div className="pe-topo">
          <b>Página de entrada</b>
          <button type="button" aria-label="Fechar" onClick={onFechar}><X size={18} /></button>
        </div>

        <div className="pe-corpo">
          <div className="pe-campos">
            <div>
              <Lbl>Negócio principal</Lbl>
              <div className="pe-escolha">
                {grupo.lista.map(n => (
                  <button key={n.id} type="button" className={n.id === principal ? 'on' : ''} onClick={() => setPrincipal(n.id)}>
                    {nomeDe(n)}
                  </button>
                ))}
              </div>
              <div className="pe-nota">
                O link de {nomeDe(doPrincipal)} ({doPrincipal?.slug}.marcacoes.app) é o que abre esta página. A subscrição não muda.
              </div>
            </div>

            <div>
              <Lbl>Foto</Lbl>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <label className="pe-foto-btn">
                  {aEnviar ? <Spin /> : <ImagePlus size={17} />}
                  {foto ? 'Trocar foto' : 'Escolher foto'}
                  <input type="file" accept="image/*" onChange={enviarFoto} hidden />
                </label>
                {foto && <Btn v="ghost" onClick={() => setFoto('')}>Remover</Btn>}
              </div>
              <div className="pe-nota">Sem foto, usa a capa do site.</div>
            </div>

            <div>
              <Lbl>Título</Lbl>
              <Inp value={titulo} maxLength={80} onChange={e => setTitulo(e.target.value)} placeholder={doPrincipal?.name || ''} />
            </div>

            <div>
              <Lbl>Pergunta</Lbl>
              <Inp value={pergunta} maxLength={120} onChange={e => setPergunta(e.target.value)} placeholder={PERGUNTA} />
            </div>

            <div>
              <Lbl>Nome dos botões</Lbl>
              <div style={{ display: 'grid', gap: 8 }}>
                {ordem.map(n => (
                  <Inp key={n.id} value={botoes[n.id] || ''} maxLength={40}
                    onChange={e => setBotoes(b => ({ ...b, [n.id]: e.target.value }))}
                    placeholder={nomeDe(n)} />
                ))}
              </div>
            </div>
          </div>

          <div className="pe-previa-col">
            <div className="pe-nota" style={{ textAlign: 'center', marginBottom: 8 }}>Assim o cliente vê</div>
            <div className={`pe-previa${foto ? ' com-foto' : ''}`}
              style={foto ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.6)), url('${foto}')` } : undefined}>
              <div className="pe-p-nome">{titulo || doPrincipal?.name}</div>
              <div className="pe-p-perg">{pergunta || PERGUNTA}</div>
              {ordem.map(n => <div key={n.id} className="pe-p-btn">{botoes[n.id] || nomeDe(n)}</div>)}
            </div>
          </div>
        </div>

        {erro && <div className="pe-erro">{erro}</div>}
        <div className="pe-rodape">
          <Btn v="ghost" onClick={onFechar}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={aGravar || aEnviar}>{aGravar ? <Spin /> : 'Guardar'}</Btn>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.pe-faixa { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 16px;
  border-radius: 14px; border: 1px solid ${BD}; background: ${W}; color: ${T}; cursor: pointer; font: inherit; text-align: left; box-sizing: border-box; }
.pe-faixa-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pe-faixa-txt b { font-size: 15px; }
.pe-faixa-txt small { font-size: 13px; color: ${T2}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pe-faixa > svg:last-child { color: ${T3}; flex-shrink: 0; }

.pe-fundo { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; padding: 16px; }
.pe-janela { width: 100%; max-width: 780px; max-height: 100%; display: flex; flex-direction: column; background: var(--bg); border-radius: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.3); overflow: hidden; }
.pe-topo { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid ${BD}; }
.pe-topo b { font-size: 17px; }
.pe-topo button { width: 36px; height: 36px; border-radius: 999px; border: 1px solid ${BD}; background: ${W}; color: ${T2}; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pe-corpo { overflow-y: auto; padding: 16px; display: grid; grid-template-columns: minmax(0,1fr) 250px; gap: 22px; align-items: start; }
.pe-campos { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.pe-nota { font-size: 13px; color: ${T3}; margin-top: 6px; line-height: 1.45; }
.pe-escolha { display: flex; gap: 6px; padding: 4px; border-radius: 12px; background: ${W2}; border: 1px solid ${BD}; }
.pe-escolha button { flex: 1; min-height: 40px; border: 0; border-radius: 9px; background: transparent; color: ${T2}; font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; }
.pe-escolha button.on { background: ${T}; color: ${W}; }
.pe-foto-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid ${BD}; background: ${W}; color: ${T}; font-size: 14.5px; font-weight: 600; cursor: pointer; }
.pe-previa-col { position: sticky; top: 0; }
.pe-previa { aspect-ratio: 9 / 16; border-radius: 22px; border: 1px solid ${BD}; background: ${W2} center / cover no-repeat;
  display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 18px; box-sizing: border-box; text-align: center; color: ${T}; }
.pe-previa.com-foto { color: #fff; }
.pe-p-nome { font-size: 22px; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }
.pe-p-perg { font-size: 13px; opacity: .8; margin-bottom: 8px; }
.pe-p-btn { padding: 11px 10px; border-radius: 12px; background: ${T}; color: ${W}; font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pe-previa.com-foto .pe-p-btn { background: #fff; color: #111; }
.pe-erro { margin: 0 16px; padding: 10px 14px; border-radius: 10px; background: ${R}14; border: 1px solid ${R}55; color: ${R}; font-size: 14px; }
.pe-rodape { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid ${BD}; }
@media (max-width: 680px) {
  .pe-fundo { padding: 0; align-items: stretch; }
  .pe-janela { border-radius: 0; max-height: none; }
  .pe-corpo { grid-template-columns: 1fr; flex: 1; }
  .pe-previa-col { position: static; order: -1; }
  .pe-previa { max-width: 220px; margin: 0 auto; }
  .pe-rodape .btn, .pe-rodape button { flex: 1; }
}
`;
void G;
