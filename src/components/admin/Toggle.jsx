import React from 'react';

/** O interruptor do painel (o mesmo dos Parâmetros). */
export default function Toggle({ checked, onChange }) {
  return <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 8, flexShrink: 0 }}>
    <div style={{ position: 'relative', width: 40, height: 22 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: checked ? 'var(--gold)' : 'var(--border)', transition: 'background 0.2s' }} />
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  </label>;
}
