import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import { Card } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';


function Toggle({ checked, onChange }) {
  return <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
    <div style={{ position: 'relative', width: 40, height: 22 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: checked ? 'var(--gold)' : 'var(--border)', transition: 'background 0.2s' }} />
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  </label>;
}

function Row({ label, desc, children }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
    <div style={{ flex: 1 }}><div className="fw-600 text-sm">{label}</div>{desc && <div className="text-sec" style={{ fontSize: 12, marginTop: 2 }}>{desc}</div>}</div>
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
      <Card className="card-pad" style={{ maxWidth: 720 }}>
        <div className="fw-600 text-sm" style={{ color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: .8, paddingBottom: 4, marginBottom: 4 }}>Marcações pelo site</div>
        {row('Confirmação automática', 'Ligado: a marcação do cliente entra já confirmada e és avisado. Desligado: entra «por confirmar» e confirmas tu.', <Toggle checked={v('autoConfirm', true)} onChange={x => save({ autoConfirm: x })} />)}
        {row('Cancelamento pelo cliente', 'Se o cliente pode desmarcar pela app.', <Toggle checked={v('allowClientCancel', true)} onChange={x => save({ allowClientCancel: x })} />)}
        {row('Prazo para cancelar (horas)', 'Até quantas horas antes da hora marcada o cliente ainda pode desmarcar. Depois disso só a ligar-te.', <NumInput value={v('cancelMinHours', 2)} min={0} max={72} onChange={x => save({ cancelMinHours: x })} />)}
        <p className="text-sec text-sm" style={{ margin: '16px 0 0', lineHeight: 1.6 }}>
          Horários de abertura: em <strong style={{ color: 'var(--text)' }}>Horários</strong>. Folgas e horas de cada barbeiro: em <strong style={{ color: 'var(--text)' }}>Profissionais → Horários</strong>. Cartão de fidelidade: em <strong style={{ color: 'var(--text)' }}>Fidelização</strong>.
        </p>
      </Card>
    </AdminPage>
  );
}
