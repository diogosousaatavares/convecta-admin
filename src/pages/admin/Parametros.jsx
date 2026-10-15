import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import { Card } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';


import Toggle from '@/components/admin/Toggle';

function Row({ label, desc, children }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
    <div style={{ flex: 1 }}><div className="fw-600 text-sm">{label}</div>{desc && <div className="text-sec" style={{ fontSize: 14, marginTop: 2 }}>{desc}</div>}</div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>;
}

function NumInput({ value, onChange, min = 0, max, step = 1 }) {
  return <input type="number" className="input" style={{ width: 90, textAlign: 'right' }} value={value ?? ''} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} />;
}
function TextInput({ value, onChange, placeholder, style }) {
  return <input className="input" style={{ width: 180, ...style }} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />;
}
function Sel({ value, onChange, options }) {
  return <select className="select" style={{ width: 180 }} value={value ?? ''} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}

export default function Parametros() {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business.config || {};
  const p = cfg.params || {};
  const save = async updates => {
    try { await dataService.updateConfig('params', { ...p, ...updates }); toast.success('Guardado'); }
    catch (e) { toast.error('Não foi possível guardar', e.message); }
  };
  const v = (key, def) => p[key] ?? def;
  const row = (label, desc, children) => <Row label={label} desc={desc}>{children}</Row>;

  /*
   * Esta pagina tinha oito separadores e quarenta e tal interruptores. Tres
   * faziam alguma coisa. Os outros gravavam um valor que nenhum ecra lia —
   * limites por cliente, expiracao de pendentes, permissoes dos profissionais,
   * comissao padrao, alertas de caixa, moeda, fuso horario. Um interruptor que
   * nao muda nada e uma mentira com aspecto de funcionalidade; ficam so os
   * que o site do cliente e a base de dados obedecem.
   */
  return (
    <AdminPage title="Parâmetros" subtitle="As regras das marcações. O que decides aqui é o que o site do cliente cumpre." page="parametros">
      {/* Sem bloco branco (15/10/2026): linhas com separador, direto na página. */}
      <div className="nt-titulo" style={{ marginTop: 0 }}>Marcações pelo site</div>
      <div className="nt-lista" style={{ maxWidth: 720 }}>
        {/* Sem frases por baixo (15/10/2026): o título chega. */}
        {row('Marcações entram confirmadas', '', <Toggle checked={v('autoConfirm', true)} onChange={x => save({ autoConfirm: x })} />)}
        {row('Cliente pode desmarcar', '', <Toggle checked={v('allowClientCancel', true)} onChange={x => save({ allowClientCancel: x })} />)}
        {row('Até quantas horas antes', '', <NumInput value={v('cancelMinHours', 2)} min={0} max={72} onChange={x => save({ cancelMinHours: x })} />)}
      </div>
    </AdminPage>
  );
}
