import React from 'react';
import { Gift, CalendarClock } from 'lucide-react';

/*
 * O cartao de fidelidade como o cliente o ve.
 *
 * Antes havia aqui um desenho a parte, com o dourado e o azul-escuro escritos
 * a mao no codigo: o barbeiro mudava a cor da marca em «O Meu Site», o site
 * do cliente mudava, e esta pre-visualizacao continuava igual. Mostrava-lhe
 * uma coisa e o cliente via outra.
 *
 * Isto e o mesmo cartao (as mesmas medidas, os mesmos tons derivados da cor
 * de marca) desenhado com as cores desta barbearia. Se mexeres no cartao do
 * site do cliente (`.lw` no index.css dele), mexe aqui tambem.
 */

// ── Cor ────────────────────────────────────────────────────────────────
function hexParaRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function misturar(hex, com, quanto) {
  const a = hexParaRgb(hex), b = hexParaRgb(com);
  if (!a || !b) return hex;
  const m = (x, y) => Math.round(x + (y - x) * quanto);
  return `rgb(${m(a.r, b.r)}, ${m(a.g, b.g)}, ${m(a.b, b.b)})`;
}
// Preto ou branco por cima da cor de marca, conforme se leia melhor.
function textoSobre(hex) {
  const c = hexParaRgb(hex);
  if (!c) return '#1A1A1A';
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return lum > 0.6 ? '#1A1A1A' : '#FFFFFF';
}

export default function CartaoFidelidadePreview({
  nome = 'A tua barbearia',
  carimbos = 10,
  preenchidos = 4,
  premio = 'Corte grátis',
  meses = 6,
  claro = false,
  cores = {},
}) {
  const marca = cores.gold || '#C9A227';
  const rgb = hexParaRgb(marca) || { r: 201, g: 162, b: 39 };
  const marcaRgb = `${rgb.r},${rgb.g},${rgb.b}`;
  const marcaClaro = misturar(marca, '#FFFFFF', 0.30);
  const marcaTexto = textoSobre(marca);

  const fundo = claro
    ? 'linear-gradient(135deg, #FFFFFF 0%, #F1EDE6 100%)'
    : 'linear-gradient(135deg, #1A1A1A 0%, #0E0E0E 100%)';
  const corTitulo = claro ? '#16130F' : '#FFFFFF';
  const corRodape = claro ? '#6B6355' : '#9A948A';
  const fundoBarra = claro ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.08)';

  const n = Math.max(3, Math.min(20, Number(carimbos) || 10));
  const feitos = Math.max(0, Math.min(n, Number(preenchidos) || 0));
  const nomeDoPremio = (premio || '').trim() || 'Corte grátis';

  return (
    <div style={{
      padding: 18, background: fundo, borderRadius: 14,
      border: `1px solid rgba(${marcaRgb},${claro ? 0.5 : 0.28})`,
      boxShadow: claro ? '0 10px 30px rgba(0,0,0,0.18)' : '0 10px 30px rgba(0,0,0,0.4)',
      maxWidth: 340,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: corTitulo }}>Cartão de Fidelidade</div>
          <div style={{ fontSize: 12.5, color: marca, marginTop: 3, fontWeight: 500 }}>
            {feitos}/{n} cortes · {nome}
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `rgba(${marcaRgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: marca, flexShrink: 0 }}>
          <Gift size={18} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(n, 10)}, 1fr)`, gap: 5, marginBottom: 12 }}>
        {Array.from({ length: n }).map((_, i) => {
          const cheio = i < feitos;
          const doPremio = i === n - 1;
          return (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
              background: cheio
                ? (doPremio ? 'linear-gradient(160deg,#4ADE80,#22C55E)' : `linear-gradient(160deg, ${marcaClaro}, ${marca})`)
                : doPremio ? 'rgba(34,197,94,0.12)' : `rgba(${marcaRgb},${claro ? 0.14 : 0.1})`,
              border: doPremio
                ? '1px dashed rgba(34,197,94,0.55)'
                : cheio ? `1px solid ${marcaClaro}` : `1px solid rgba(${marcaRgb},${claro ? 0.45 : 0.35})`,
              color: cheio ? (doPremio ? '#06281A' : marcaTexto) : doPremio ? (claro ? '#15803D' : '#4ADE80') : marcaTexto,
            }}>
              {cheio ? '✓' : doPremio ? '★' : ''}
            </div>
          );
        })}
      </div>

      <div style={{ height: 6, borderRadius: 999, background: fundoBarra, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${(feitos / n) * 100}%`, borderRadius: 999, background: `linear-gradient(90deg, ${marcaClaro}, ${marca})` }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: corRodape, lineHeight: 1.4 }}>
        <CalendarClock size={14} style={{ color: '#4ADE80', flexShrink: 0 }} />
        <span>
          A cada {n} cortes, ganhas {nomeDoPremio.toLowerCase()}.{' '}
          {meses ? `Válido por ${meses} ${meses === 1 ? 'mês' : 'meses'} a partir do primeiro corte.` : 'Sem prazo de validade.'}
        </span>
      </div>
    </div>
  );
}
