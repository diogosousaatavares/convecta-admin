import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { atualizarAgora, ultimoRefresco, estaAAtualizar, aoAtualizar } from '@/lib/dataService';

/*
 * Botao de atualizar do painel.
 *
 * Substitui o pedido automatico de 30 em 30 segundos. A diferenca que
 * interessa nao e o botao — e a pessoa saber de quando sao os dados que esta a
 * ver. Um painel que se atualiza sozinho sem dizer nada e um painel em que nao
 * se confia: o barbeiro nunca sabe se aquela agenda e de agora ou de ha meia
 * hora, e acaba a recarregar a pagina na duvida.
 */

function hMuito(quando) {
  if (!quando) return 'ainda não atualizado';
  const s = Math.round((Date.now() - quando) / 1000);
  if (s < 45) return 'agora mesmo';
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return h === 1 ? 'há 1 hora' : `há ${h} horas`;
}

export default function BotaoAtualizar() {
  const [, redesenhar] = useState(0);

  useEffect(() => {
    const largar = aoAtualizar(() => redesenhar(n => n + 1));
    // So para o "ha X min" nao ficar preso. Nao vai a base de dados.
    const t = setInterval(() => redesenhar(n => n + 1), 30000);
    return () => { largar(); clearInterval(t); };
  }, []);

  const ocupado = estaAAtualizar();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="text-sec" style={{ fontSize: 12 }}>{hMuito(ultimoRefresco())}</span>
      <button
        type="button"
        onClick={atualizarAgora}
        disabled={ocupado}
        title="Ir buscar as marcações mais recentes"
        aria-label="Atualizar"
        className="ag-side-btn"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: ocupado ? 0.6 : 1 }}
      >
        <RefreshCw size={14} style={ocupado ? { animation: 'girar 0.9s linear infinite' } : undefined} />
        {ocupado ? 'A atualizar…' : 'Atualizar'}
      </button>
      <style>{'@keyframes girar { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
