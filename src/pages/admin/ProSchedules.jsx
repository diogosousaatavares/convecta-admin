import React, { useState } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, EmptyState, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Segunda', tuesday:'Terça', wednesday:'Quarta', thursday:'Quinta', friday:'Sexta', saturday:'Sábado', sunday:'Domingo' };

export default function ProSchedules() {
  const data = useStore();
  const toast = useToast();
  const [proId, setProId] = useState(data.professionals[0]?.id || '');
  const pro = data.professionals.find(p => p.id === proId);
  const schedule = pro?.schedule || data.business.openingHours.map(h => ({ ...h }));
  const isCustom = !!pro?.schedule;

  const setCustom = custom => dataService.updateProfessional(proId, { schedule: custom ? data.business.openingHours.map(h => ({ ...h, breaks: [...(h.breaks || [])] })) : null });
  const update = (day, field, value) => dataService.updateProfessional(proId, { schedule: schedule.map(h => h.day === day ? { ...h, [field]: value } : h) });
  const addBreak = day => {
    const h = schedule.find(x => x.day === day);
    update(day, 'breaks', [...(h?.breaks || []), { start: '13:00', end: '14:00' }]);
  };
  const updateBreak = (day, idx, field, value) => {
    const h = schedule.find(x => x.day === day);
    update(day, 'breaks', (h?.breaks || []).map((b, i) => i === idx ? { ...b, [field]: value } : b));
  };
  const removeBreak = (day, idx) => {
    const h = schedule.find(x => x.day === day);
    update(day, 'breaks', (h?.breaks || []).filter((_, i) => i !== idx));
  };

  return (
    <AdminPage title="Horários dos Profissionais" subtitle="Horário individual, folgas, pausas e indisponibilidades.">
      {data.professionals.length === 0 ? <Card className="card-pad"><EmptyState icon={() => <Clock />} title="Sem profissionais" /></Card> : <>
        <div className="field" style={{ maxWidth: 320, marginBottom: 16 }}><label className="label">Profissional</label><select className="select" value={proId} onChange={e => setProId(e.target.value)}>{data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <Card className="card-pad">
          <div className="flex items-center justify-between mb-24" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="flex items-center gap-12"><Avatar name={pro?.name} /><div><div className="fw-600">{pro?.name}</div><div className="text-sec text-xs">{pro?.role}</div></div></div>
            <div className="flex items-center gap-8"><span className="text-sec text-sm">{isCustom ? 'Horário personalizado' : 'A herdar horário do negócio'}</span><Button size="sm" variant="secondary" onClick={() => { setCustom(!isCustom); toast.success(isCustom ? 'A herdar negócio' : 'Horário personalizado'); }}>{isCustom ? 'Herdar negócio' : 'Personalizar'}</Button></div>
          </div>
          {DAYS.map(day => {
            const h = schedule.find(x => x.day === day) || { isOpen: false, open: '09:00', close: '19:00', breaks: [] };
            const breaks = h.breaks || [];
            return <div key={day} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-16" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div style={{ width: 110 }} className="fw-600">{DAY_LABELS[day]}</div>
                <label className="flex items-center gap-8 text-sm"><input type="checkbox" checked={h.isOpen} disabled={!isCustom} onChange={e => update(day, 'isOpen', e.target.checked)} /> Aberto</label>
                {h.isOpen ? <><div className="flex items-center gap-8"><input className="input" type="time" disabled={!isCustom} value={h.open} onChange={e => update(day, 'open', e.target.value)} style={{ width: 110 }} /><span className="text-sec">—</span><input className="input" type="time" disabled={!isCustom} value={h.close} onChange={e => update(day, 'close', e.target.value)} style={{ width: 110 }} /></div>{isCustom && <button className="btn btn-ghost btn-sm" onClick={() => addBreak(day)} style={{ fontSize: 12, color: 'var(--text-sec)' }}><Plus size={13} /> Pausa</button>}</> : <span className="badge badge-default">Folga</span>}
              </div>
              {h.isOpen && breaks.length > 0 && <div style={{ marginTop: 10, paddingLeft: 126, display: 'flex', flexDirection: 'column', gap: 6 }}>{breaks.map((b, idx) => <div key={idx} className="flex items-center gap-8"><span className="text-sec text-xs" style={{ width: 80 }}>{idx === 0 ? 'Pausa almoço' : `Pausa ${idx + 1}`}</span><input className="input" type="time" disabled={!isCustom} value={b.start} onChange={e => updateBreak(day, idx, 'start', e.target.value)} style={{ width: 100 }} /><span className="text-sec">—</span><input className="input" type="time" disabled={!isCustom} value={b.end} onChange={e => updateBreak(day, idx, 'end', e.target.value)} style={{ width: 100 }} />{isCustom && <button onClick={() => removeBreak(day, idx)} aria-label="Remover pausa" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', padding: 4 }}><X size={13} /></button>}</div>)}</div>}
            </div>;
          })}
          <div className="mt-16"><Button variant="primary" onClick={() => toast.success('Horários guardados')}><Clock size={16} /> Guardar</Button></div>
        </Card>
      </>}
    </AdminPage>
  );
}
