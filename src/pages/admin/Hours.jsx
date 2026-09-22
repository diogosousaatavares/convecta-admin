import React, { useEffect, useState } from 'react';
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

  // Rascunho local: mexer num relógio já não grava a cada tecla (e duas
  // gravações seguidas já não se atropelam). Só o «Guardar» grava — a sério.
  const original = data.business?.openingHours || [];
  const [horas, setHoras] = useState(original);
  const [mexido, setMexido] = useState(false);
  const [aGravar, setAGravar] = useState(false);
  useEffect(() => { if (!mexido) setHoras(original); /* eslint-disable-next-line */ }, [data.business?.openingHours]);

  const update = (day, field, value) => {
    setMexido(true);
    setHoras(prev => {
      const existe = prev.some(h => h.day === day);
      const base = existe ? prev : [...prev, { day, isOpen: false, open: '09:00', close: '19:00', breaks: [] }];
      return base.map(h => h.day === day ? { ...h, [field]: value } : h);
    });
  };

  const guardar = async () => {
    for (const h of horas) {
      if (!h.isOpen) continue;
      if (h.close <= h.open) { toast.error('Horário inválido', `${DAY_LABELS[h.day]}: o fecho tem de ser depois da abertura.`); return; }
      for (const b of (h.breaks || [])) {
        if (b.end <= b.start || b.start < h.open || b.end > h.close) { toast.error('Pausa inválida', `${DAY_LABELS[h.day]}: a pausa tem de caber dentro do horário.`); return; }
      }
    }
    setAGravar(true);
    try {
      await dataService.updateBusiness({ openingHours: horas });
      setMexido(false);
      toast.success('Horários guardados', 'O site de marcações já usa o horário novo.');
    } catch (e) {
      toast.error('Não ficou gravado', (e && e.message) || 'Verifica a internet e tenta outra vez.');
    } finally { setAGravar(false); }
  };

  const addBreak = day => {
    const h = horas.find(x => x.day === day);
    const breaks = [...(h?.breaks || []), { start: '13:00', end: '14:00' }];
    update(day, 'breaks', breaks);
  };

  const updateBreak = (day, idx, field, value) => {
    const h = horas.find(x => x.day === day);
    const breaks = (h?.breaks || []).map((b, i) => i === idx ? { ...b, [field]: value } : b);
    update(day, 'breaks', breaks);
  };

  const removeBreak = (day, idx) => {
    const h = horas.find(x => x.day === day);
    const breaks = (h?.breaks || []).filter((_, i) => i !== idx);
    update(day, 'breaks', breaks);
  };

  return (
    <AdminLayout>
      <div className="page-head" data-tour="horarios">
        <h1>Horário de funcionamento</h1>
        <p>Define os horários de abertura, fecho e pausas de cada dia.</p>
      </div>

      <Card className="card-pad">
        {DAYS.map(day => {
          const h = horas.find(x => x.day === day) || { isOpen: false, open: '09:00', close: '19:00', breaks: [] };
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
        <div className="mt-24"><Button variant="primary" onClick={guardar} disabled={aGravar || !mexido}><Clock size={16} /> {aGravar ? 'A guardar…' : mexido ? 'Guardar horários' : 'Guardado'}</Button></div>
      </Card>
    </AdminLayout>
  );
}
