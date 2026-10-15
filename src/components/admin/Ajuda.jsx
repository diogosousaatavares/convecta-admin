import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from '@/components/ui';

/*
 * O (i) DE AJUDA (15/10/2026).
 *
 * O painel explica-se em duas fases: o título diz o que é; quem tiver
 * dúvidas toca no (i) e lê a explicação numa janela. Nunca texto pequeno
 * por baixo do campo — isso é a primeira coisa que o Diogo manda tirar.
 *
 *   <Ajuda titulo="Validade" texto="…" />
 *   texto pode ser uma string ou JSX.
 */
export default function Ajuda({ titulo, texto }) {
  const [aberta, setAberta] = useState(false);
  return (
    <>
      <button type="button" className="ajuda-btn" aria-label={`Ajuda: ${titulo}`} onClick={e => { e.preventDefault(); e.stopPropagation(); setAberta(true); }}>
        <HelpCircle size={16} />
      </button>
      <Modal open={aberta} onClose={() => setAberta(false)} title={titulo}>
        <div className="ajuda-texto">{texto}</div>
      </Modal>
    </>
  );
}
