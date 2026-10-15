import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Avatar, Modal } from '@/components/ui';

/*
 * LISTA DE PESSOAS COM UM NÚMERO À FRENTE (15/10/2026).
 *
 * Comissões e Desempenho eram tabelas de nove colunas que, no telemóvel,
 * viravam nove linhas por pessoa. Agora é uma linha por pessoa — nome, uma
 * palavra por baixo, o número que interessa à direita — e tocar abre a ficha
 * com os números todos. A parte bonita primeiro; o detalhe a um toque.
 *
 * linhas: [{ id, nome, sub, valor, detalhe: [[rótulo, valor], …] }]
 */
export function Periodo({ from, to, setFrom, setTo }) {
  return (
    <div className="periodo">
      <label><span>De</span><input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label><span>Até</span><input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></label>
    </div>
  );
}

export default function ListaPessoas({ linhas, tituloFicha }) {
  const [aberta, setAberta] = useState(null);
  const l = linhas.find(x => x.id === aberta);
  return (
    <>
      <div className="lin-lista">
        {linhas.map(x => (
          <button key={x.id} type="button" className="lin" onClick={() => setAberta(x.id)}>
            <Avatar name={x.nome} />
            <span className="lin-txt"><b>{x.nome}</b>{x.sub && <span>{x.sub}</span>}</span>
            <span className="lin-valor">{x.valor}</span>
            <ChevronRight size={18} className="lin-seta" />
          </button>
        ))}
      </div>
      <Modal open={!!l} onClose={() => setAberta(null)} title={l ? (tituloFicha ? tituloFicha(l) : l.nome) : ''}>
        {l && (
          <div className="ag-detail">
            {l.detalhe.map(([k, v]) => <div key={k} className="ag-detail-row"><span className="l">{k}</span><span className="v">{v}</span></div>)}
          </div>
        )}
      </Modal>
    </>
  );
}
