import React from 'react';
import { Clock, Plus, X } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import { Card, Button } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Segunda', tuesday:'Terça', wednesday:'Quarta', thursday:'Quinta', friday:'Sexta', saturday:'Sábado', sunday:'Domingo' };

export default function Hours() {
  const data = useStore();
  const toast = useToast();

  const update = (day, field, value) => {
    const hours = data.business.openingHours.map(h => h.day === day ? { ...h, [field]: value } : h);
    dataService.updateBusiness({ openingHours: hours });
  };

  const addBreak = day => {
    const h = data.business.openingHours.find(x => x.day === day);
    const breaks = [...(h?.breaks || []), { start: '13:00', end: '14:00' }];
    update(day, 'breaks', breaks);
  };

  const updateBreak = (day, idx, field, value) => {
    const h = data.business.openingHours.find(x => x.day === day);
    const breaks = (h?.breaks || []).map((b, i) => i === idx ? { ...b, [field]: value } : b);
    update(day, 'breaks', breaks);
  };

  const removeBreak = (day, idx) => {
    const h = data.business.openingHours.find(x => x.day === day);
    const breaks = (h?.breaks || []).filter((_, i) => i !== idx);
    update(day, 'breaks', breaks);
  };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Horário de funcionamento</h1>
        <p>Define os horários de abertura, fecho e pausas de cada dia.</p>
      </div>

      <Card className="card-pad">
        {DAYS.map(day => {
          const h = data.business.openingHours.find(x => x.day === day) || { isOpen: false, open: '09:00', close: '19:00', breaks: [] };
          const breaks = h.breaks || [];
          return (
            <div key={day} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-16" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div style={{ width: 100 }} className="fw-600">{DAY_LABELS[day]}</div>
                <label className="flex items-center gap-8 text-sm"><input type="checkbox" checked={h.isOpen} onChange={e => update(day, 'isOpen', e.target.checked)} /> Aberto</label>
                {h.isOpen ? <>
                  <div className="flex items-center gap-8">
                    <input className="input" type="time" value={h.open} onChange={e => update(day, 'open', e.target.value)} style={{ width: 110 }} />
                    <span className="text-sec">—</span>
                    <input className="input" type="time" value={h.close} onChange={e => update(day, 'close', e.target.value)} style={{ width: 110 }} />
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => addBreak(day)} style={{ fontSize: 12, color: 'var(--text-sec)' }}><Plus size={13} /> Pausa</button>
                </> : <span className="badge badge-default">Fechado</span>}
              </div>

              {h.isOpen && breaks.length > 0 && <div style={{ marginTop: 10, paddingLeft: 116, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {breaks.map((b, idx) => <div key={idx} className="flex items-center gap-8">
                  <span className="text-sec text-xs" style={{ width: 80 }}>{idx === 0 ? 'Pausa almoço' : `Pausa ${idx + 1}`}</span>
                  <input className="input" type="time" value={b.start} onChange={e => updateBreak(day, idx, 'start', e.target.value)} style={{ width: 100 }} />
                  <span className="text-sec">—</span>
                  <input className="input" type="time" value={b.end} onChange={e => updateBreak(day, idx, 'end', e.target.value)} style={{ width: 100 }} />
                  <button onClick={() => removeBreak(day, idx)} aria-label="Remover pausa" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', padding: 4 }}><X size={13} /></button>
                </div>)}
              </div>}
            </div>
          );
        })}
        <div className="mt-24"><Button variant="primary" onClick={() => toast.success('Horários guardados')}><Clock size={16} /> Guardar horários</Button></div>
      </Card>
    </AdminLayout>
  );
}
