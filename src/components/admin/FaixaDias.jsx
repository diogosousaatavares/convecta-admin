import React, { useEffect, useMemo, useRef } from 'react';
import { Lock } from 'lucide-react';

/*
 * A faixa de dias do telemovel.
 *
 * No desktop a agenda tem um calendario do mes na barra lateral. No telemovel
 * esse calendario ocupava o ecra inteiro antes de a agenda aparecer — e a
 * pessoa que abre a agenda ao balcao quer ver as marcacoes de hoje, nao um
 * mes. Aqui e uma tira de dias que se arrasta com o polegar, com o dia
 * escolhido no meio e um ponto nos dias que tem marcacoes.
 */
const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function somaDias(ds, n) {
  const [y, m, d] = ds.split('-').map(Number);
  const x = new Date(y, m - 1, d + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export default function FaixaDias({ date, setDate, apptsByDate = {}, blockMode, setBlockMode }) {
  const hoje = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  }, []);

  // Sete dias para tras e vinte para a frente: chega para marcar a semana que
  // vem sem sair daqui; para mais longe ha o calendario no desktop.
  const dias = useMemo(() => Array.from({ length: 28 }, (_, i) => somaDias(date, i - 7)), [date]);

  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector('.ag-faixa-dia.selected');
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [date]);

  return (
    <div className="ag-faixa">
      <div className="ag-faixa-scroll" ref={ref}>
        {dias.map(ds => {
          const [, m, d] = ds.split('-').map(Number);
          const dow = new Date(ds + 'T00:00:00').getDay();
          const n = apptsByDate[ds] || 0;
          return (
            <button
              key={ds}
              type="button"
              className={`ag-faixa-dia ${ds === date ? 'selected' : ''} ${ds === hoje ? 'today' : ''}`}
              onClick={() => setDate(ds)}
              aria-label={`${DOW[dow]} ${d}/${m}`}
            >
              <span className="ag-faixa-dow">{DOW[dow]}</span>
              <span className="ag-faixa-num">{d}</span>
              <span className={`ag-faixa-dot ${n ? 'on' : ''}`} />
            </button>
          );
        })}
      </div>
      <label className={`ag-faixa-block ${blockMode ? 'active' : ''}`}>
        <input type="checkbox" checked={blockMode} onChange={e => setBlockMode(e.target.checked)} />
        <Lock size={13} /> Bloquear
      </label>
    </div>
  );
}
