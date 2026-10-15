import React, { useState } from 'react';

/*
 * OS LOGÓTIPOS DOS MEIOS DE PAGAMENTO (15/10/2026).
 *
 * Mini imagens do que o cliente pode usar para pagar online. Os ficheiros
 * vivem em /public/pagamentos/<id>.png (os oficiais de cada marca). Se o
 * ficheiro faltar, aparece o nome escrito, para nunca ficar um buraco.
 */
export const METODOS = [
  { id: 'visa', nome: 'Visa' },
  { id: 'mastercard', nome: 'Mastercard' },
  { id: 'applepay', nome: 'Apple Pay', comMoldura: true },   // o logo já traz a moldura
  { id: 'googlepay', nome: 'Google Pay', comMoldura: true },
  { id: 'mbway', nome: 'MB WAY' },
];

function Logo({ id, nome, altura, comMoldura }) {
  const [falhou, setFalhou] = useState(false);
  if (comMoldura && !falhou) {
    return <img src={`/pagamentos/${id}.png`} alt={nome} title={nome} height={altura + 10}
      style={{ display: 'block', height: altura + 10, width: 'auto' }} onError={() => setFalhou(true)} />;
  }
  const caixa = {
    height: altura + 10, minWidth: altura * 1.6, padding: '0 6px', borderRadius: 6,
    border: '1px solid var(--border)', background: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };
  return (
    <span style={caixa} title={nome}>
      {falhou
        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{nome}</span>
        : <img src={`/pagamentos/${id}.png`} alt={nome} height={altura} style={{ display: 'block', height: altura, width: 'auto' }} onError={() => setFalhou(true)} />}
    </span>
  );
}

export default function MetodosPagamento({ altura = 16, style }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', ...style }} aria-label="Cartão, Apple Pay, Google Pay e MB WAY">
      {METODOS.map(m => <Logo key={m.id} {...m} altura={altura} />)}
    </div>
  );
}
