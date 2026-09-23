import React, { useEffect, useRef, useState } from 'react';
import { Upload, ZoomIn } from 'lucide-react';

/*
 * A fotografia do barbeiro, redonda.
 *
 *  - arrasta-se o ficheiro para a caixa (ou toca-se para escolher);
 *  - depois arrasta-se a FOTO dentro do círculo para a pôr no sítio, e a
 *    barra aproxima;
 *  - «Usar esta» corta um quadrado de 512×512 e é só isso que sobe.
 *
 * Porque é que travava: a foto do telemóvel (12 MP, 4-5 MB) era lida,
 * mostrada e enviada inteira. Agora é reduzida logo ao abrir (no máximo
 * 1400 px) e o que sobe tem uns 60-120 KB.
 */
const V = 240;          // lado do círculo no ecrã
const SAIDA = 512;      // lado da foto que sobe

async function abrirReduzida(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    const url = URL.createObjectURL(file);
    try {
      bmp = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => falha(new Error('Não consegui abrir esta imagem. Experimenta um JPG ou PNG.')); i.src = url; });
    } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
  }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, 1400 / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}

export default function FotoPerfil({ valor, nome, aEnviar, onEscolher }) {
  const [src, setSrc] = useState(null);          // canvas reduzido
  const [previa, setPrevia] = useState('');       // dataURL para o <img>
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [sobre, setSobre] = useState(false);
  const [erro, setErro] = useState('');
  const arrasto = useRef(null);
  const input = useRef(null);

  const escalaBase = src ? V / Math.min(src.width, src.height) : 1;
  const esc = escalaBase * zoom;
  const limitar = (p, e = esc) => src ? ({
    x: Math.min(0, Math.max(V - src.width * e, p.x)),
    y: Math.min(0, Math.max(V - src.height * e, p.y)),
  }) : p;

  async function carregar(file) {
    setErro('');
    if (!file || !file.type?.startsWith('image/')) { setErro('Isso não é uma imagem.'); return; }
    try {
      const c = await abrirReduzida(file);
      const e = V / Math.min(c.width, c.height);
      setSrc(c); setZoom(1);
      setPos({ x: (V - c.width * e) / 2, y: (V - c.height * e) / 2 });
      setPrevia(c.toDataURL('image/jpeg', 0.9));
    } catch (e) { setErro(e.message || 'Não foi possível abrir a imagem.'); }
  }

  // Aproximar mantendo o centro do círculo no mesmo ponto da foto.
  function mudarZoom(z) {
    if (!src) return;
    const e1 = escalaBase * z;
    const cx = (V / 2 - pos.x) / esc, cy = (V / 2 - pos.y) / esc;
    setZoom(z);
    setPos(limitar({ x: V / 2 - cx * e1, y: V / 2 - cy * e1 }, e1));
  }

  function usar() {
    if (!src) return;
    const c = document.createElement('canvas');
    c.width = SAIDA; c.height = SAIDA;
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    const k = SAIDA / V;
    g.drawImage(src, pos.x * k, pos.y * k, src.width * esc * k, src.height * esc * k);
    c.toBlob(b => {
      if (!b) { setErro('Não foi possível preparar a foto.'); return; }
      onEscolher(new File([b], 'foto.jpg', { type: 'image/jpeg' }));
      setSrc(null); setPrevia('');
    }, 'image/jpeg', 0.88);
  }

  useEffect(() => {
    const mover = ev => {
      const a = arrasto.current; if (!a) return;
      setPos(limitar({ x: a.px + ev.clientX - a.x, y: a.py + ev.clientY - a.y }));
    };
    const largar = () => { arrasto.current = null; };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', largar);
    window.addEventListener('pointercancel', largar);
    return () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', largar); window.removeEventListener('pointercancel', largar); };
  });

  // ── A pôr a foto no sítio ──
  if (src) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          onPointerDown={ev => { ev.preventDefault(); arrasto.current = { x: ev.clientX, y: ev.clientY, px: pos.x, py: pos.y }; }}
          style={{ width: V, height: V, borderRadius: '50%', overflow: 'hidden', position: 'relative', cursor: 'grab',
            touchAction: 'none', border: '2px solid var(--gold)', background: '#000' }}>
          <img src={previa} alt="" draggable={false}
            style={{ position: 'absolute', left: pos.x, top: pos.y, width: src.width * esc, height: src.height * esc,
              maxWidth: 'none', userSelect: 'none', pointerEvents: 'none' }} />
        </div>
        <div className="text-sec text-xs">Arrasta a foto para a pôr no sítio.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: V }}>
          <ZoomIn size={16} style={{ flexShrink: 0 }} />
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => mudarZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--gold)' }} aria-label="Aproximar" />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={() => { setSrc(null); setPrevia(''); }}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={usar}>Usar esta</button>
        </div>
      </div>
    );
  }

  // ── Escolher / arrastar o ficheiro ──
  return (
    <div>
      <div
        role="button" tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') input.current?.click(); }}
        onDragOver={e => { e.preventDefault(); setSobre(true); }}
        onDragLeave={() => setSobre(false)}
        onDrop={e => { e.preventDefault(); setSobre(false); carregar(e.dataTransfer.files?.[0]); }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, cursor: 'pointer',
          border: `2px dashed ${sobre ? 'var(--gold)' : 'var(--border)'}`,
          background: sobre ? 'rgba(201,162,39,0.08)' : 'transparent', transition: 'border-color .15s, background .15s' }}>
        {valor
          ? <img src={valor} alt={`Fotografia de ${nome || 'profissional'}`} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, opacity: aEnviar ? .5 : 1 }} />
          : <span style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--elevated)', flexShrink: 0 }}><Upload size={22} /></span>}
        <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>
          <b>{aEnviar ? 'A enviar…' : valor ? 'Trocar fotografia' : 'Adicionar fotografia'}</b><br />
          <span className="text-sec">Arrasta uma imagem para aqui, ou toca para escolher.</span>
        </span>
      </div>
      {erro && <div style={{ color: 'var(--error)', fontSize: 12.5, marginTop: 6 }}>{erro}</div>}
      <input ref={input} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; carregar(f); }} />
    </div>
  );
}
