import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Share, PlusSquare, MoreVertical, Download, Bell, X } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { emModoAplicacao } from '@/lib/push';

/*
 * «Guarda o painel no ecrã principal» — o tutorial que aparece ao entrar no
 * Dashboard, no telemóvel, enquanto o painel estiver aberto no browser.
 *
 * Porque é que importa: no iPhone as notificações SÓ funcionam com o painel
 * guardado no ecrã principal e aberto a partir do ícone. No Android funcionam
 * no browser, mas instalado é o que o barbeiro abre todos os dias. Sem isto,
 * uma marcação nova não toca no telemóvel — e o barbeiro acha que a app não
 * funciona.
 *
 * Aparece depois do «Bem-vindo» (nunca os dois ao mesmo tempo). «Depois»
 * esconde-o até ao dia seguinte; quando o painel já corre instalado, nunca
 * aparece.
 */

const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const ehAndroid = () => /Android/i.test(navigator.userAgent);
const CHAVE = 'convecta_guardar_ecra_adiado';
const hoje = () => new Date().toISOString().slice(0, 10);

// O Chrome do Android oferece a instalação num evento que só chega uma vez:
// guarda-se logo ao carregar a página, para o botão «Instalar agora».
let pedidoInstalar = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar = e; });
}

export default function GuardarNoEcra() {
  const data = useStore();
  const location = useLocation();
  const id = data?.business?.id;
  const [aberto, setAberto] = useState(false);
  const [podeInstalar, setPodeInstalar] = useState(false);

  useEffect(() => {
    if (!id || location.pathname !== '/admin') return;
    if (emModoAplicacao() || !(ehIOS() || ehAndroid())) return;
    try { if (localStorage.getItem(CHAVE) === hoje()) return; } catch { /* segue */ }
    // Espera que o «Bem-vindo» tenha sido visto, para não abrir por cima dele.
    const t = setInterval(() => {
      let visto = true;
      try { visto = !!localStorage.getItem(`convecta_bemvindo_${id}`); } catch { visto = true; }
      if (visto) { clearInterval(t); setPodeInstalar(!!pedidoInstalar); setAberto(true); }
    }, 800);
    return () => clearInterval(t);
  }, [id, location.pathname]);

  if (!aberto) return null;

  const adiar = () => { try { localStorage.setItem(CHAVE, hoje()); } catch { /* segue */ } setAberto(false); };
  const instalar = async () => {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    const r = await pedidoInstalar.userChoice.catch(() => null);
    pedidoInstalar = null;
    if (r?.outcome === 'accepted') setAberto(false);
  };

  const iOS = ehIOS();
  const Passo = ({ n, icone: Icone, children }) => (
    <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0' }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gold)', color: '#100E0B', fontWeight: 800,
        fontSize: 13, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{n}</span>
      <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.5, color: 'var(--text)' }}>{children}</span>
      {Icone && <Icone size={22} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />}
    </li>
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="guardar-titulo"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'var(--surface, #16130F)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border)', padding: '22px 20px calc(22px + env(safe-area-inset-bottom, 0px))', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Bell size={22} style={{ color: 'var(--gold)' }} />
          <h2 id="guardar-titulo" style={{ margin: 0, fontSize: 19, flex: 1 }}>Guarda o painel no ecrã principal</h2>
          <button onClick={adiar} aria-label="Fechar" style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
        </div>
        <p style={{ margin: '0 0 6px', fontSize: 14, lineHeight: 1.55, color: 'var(--text-sec)' }}>
          É assim que o teu telemóvel <b style={{ color: 'var(--text)' }}>toca quando entra uma marcação</b>.
          {iOS
            ? ' No iPhone, sem guardar no ecrã principal não recebes notificações nenhumas.'
            : ' Fica com um ícone como as outras apps e abre num toque.'}
        </p>

        {iOS ? (
          <ol style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            <Passo n={1} icone={Share}>Toca no botão <b>Partilhar</b> — o quadrado com a seta para cima, em baixo no Safari.</Passo>
            <Passo n={2} icone={PlusSquare}>Desce e escolhe <b>«Adicionar ao ecrã principal»</b>.</Passo>
            <Passo n={3}>Toca em <b>Adicionar</b>, no canto de cima.</Passo>
            <Passo n={4} icone={Bell}>Abre o painel <b>pelo ícone novo</b> e carrega em <b>«Ligar»</b> nas notificações.</Passo>
          </ol>
        ) : (
          <>
            {podeInstalar && (
              <button onClick={instalar} className="btn btn-primary" style={{ width: '100%', margin: '12px 0 4px', justifyContent: 'center' }}>
                <Download size={17} /> Instalar agora
              </button>
            )}
            <ol style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              <Passo n={1} icone={MoreVertical}>{podeInstalar ? 'Ou, à mão: t' : 'T'}oca nos <b>três pontos</b>, em cima à direita no Chrome.</Passo>
              <Passo n={2} icone={Download}>Escolhe <b>«Instalar aplicação»</b> (ou «Adicionar ao ecrã principal»).</Passo>
              <Passo n={3} icone={Bell}>Abre o painel <b>pelo ícone</b> e carrega em <b>«Ligar»</b> nas notificações.</Passo>
            </ol>
          </>
        )}

        {iOS && !/Safari/i.test(navigator.userAgent.replace(/CriOS|FxiOS|EdgiOS/g, '')) && (
          <p style={{ fontSize: 12.5, color: 'var(--warning, #F59E0B)', margin: '6px 0 0' }}>
            Atenção: isto só funciona no <b>Safari</b>. Se abriste noutro browser, copia o endereço e abre-o no Safari.
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => setAberto(false)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Já está</button>
          <button onClick={adiar} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Depois</button>
        </div>
      </div>
    </div>
  );
}
