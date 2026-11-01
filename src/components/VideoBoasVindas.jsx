import React, { useEffect, useState } from 'react';

/*
 * O VÍDEO DE BOAS-VINDAS (01/11/2026, pedido do Diogo).
 *
 * A primeira vez que o dono entra no painel (vindo do registo), aparece o
 * vídeo-tutorial gravado pelo Diogo, antes de tudo o resto. Uma vez visto
 * (ou fechado), não volta a aparecer neste aparelho.
 *
 * O vídeo é um ficheiro: public/boas-vindas.mp4 (ou .webm). Enquanto não
 * existir, nada aparece — é só gravar, pôr lá e publicar.
 */
const VIDEOS = ['/boas-vindas.mp4', '/boas-vindas.webm'];
const CHAVE = 'convecta_video_boas_vindas';

export default function VideoBoasVindas() {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    try { if (localStorage.getItem(CHAVE) === 'visto') return; } catch { /* sem memória: mostra-se */ }
    let vivo = true;
    (async () => {
      for (const v of VIDEOS) {
        try {
          const r = await fetch(v, { method: 'HEAD', cache: 'no-cache' });
          // o Vercel devolve a app (text/html) quando o ficheiro não existe
          if (r.ok && /video/i.test(r.headers.get('content-type') || '')) { if (vivo) setVideo(v); return; }
        } catch { /* sem rede */ }
      }
    })();
    return () => { vivo = false; };
  }, []);
  if (!video) return null;
  const fechar = () => { try { localStorage.setItem(CHAVE, 'visto'); } catch { /* sem memória */ } setVideo(null); };

  return (
    <div role="dialog" aria-modal="true" aria-label="Vídeo de boas-vindas"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,10,.82)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ width: 'min(900px, 100%)', background: 'var(--bg-card, #fff)', color: 'var(--text, #111)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
        <div style={{ padding: '16px 20px 12px' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Bem-vindo à Convecta 👋</div>
          <div style={{ fontSize: 14.5, opacity: .75, marginTop: 4 }}>Vê este vídeo antes de começares — explica tudo em poucos minutos.</div>
        </div>
        <video src={video} controls autoPlay playsInline style={{ width: '100%', maxHeight: '70vh', display: 'block', background: '#000' }} onEnded={fechar} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
          <button type="button" onClick={fechar}
            style={{ padding: '11px 20px', borderRadius: 999, border: 'none', background: 'var(--gold, #FEE96D)', color: 'var(--on-gold, #111)', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}
