import React, { useState } from 'react';

/*
 * OS LOGÓTIPOS DOS MEIOS DE PAGAMENTO (15/10/2026).
 *
 * Mini imagens do que o cliente pode usar para pagar online, todas no mesmo
 * formato: a mesma caixa branca, o mesmo tamanho, o logo ao centro. Os
 * ficheiros vivem em /public/pagamentos/<id>.png. Se faltar um, aparece o
 * nome escrito, para nunca ficar um buraco.
 */
export const METODOS = [
  { id: 'visa', nome: 'Visa' },
  { id: 'mastercard', nome: 'Mastercard' },
  { id: 'applepay', nome: 'Apple Pay' },
  { id: 'googlepay', nome: 'Google Pay' },
  { id: 'mbway', nome: 'MB WAY' },
];

function Logo({ id, nome, altura }) {
  const [falhou, setFalhou] = useState(false);
  const h = altura + 12;
  return (
    <span title={nome} style={{
      height: h, width: Math.round(h * 1.6), boxSizing: 'border-box', padding: '0 6px', borderRadius: 7,
      border: '1px solid rgba(0,0,0,.12)', background: '#fff', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {falhou
        ? <span style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{nome}</span>
        : <img src={`/pagamentos/${id}.png`} alt={nome} onError={() => setFalhou(true)}
            style={{ display: 'block', maxHeight: Math.round(altura * 0.95), maxWidth: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} />}
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
