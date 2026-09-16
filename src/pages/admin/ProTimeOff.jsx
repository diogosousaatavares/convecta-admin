import React, { useState, useMemo } from 'react';
import { Plane, Plus, Trash2, AlertTriangle, CalendarX } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, EmptyState, Badge, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDate, formatDateShortNum, todayStr } from '@/lib/format';

/*
 * Ferias e ausencias.
 *
 * Um periodo de dias inteiros em que o barbeiro nao trabalha. Nesses dias
 * deixa de ter horas — aqui e no site do cliente.
 *
 * Antes de gravar, mostra-se quantas marcacoes vao ser canceladas e quais:
 * cancelar seis cortes sem os ver primeiro e a maneira mais rapida de perder
 * seis clientes. Depois de confirmar, cada cliente recebe aviso.
 */
export default function ProTimeOff() {
  const data = useStore();
  const toast = useToast();
  const hoje = todayStr();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ professionalId: '', startDate: hoje, endDate: hoje, reason: '' });
  const [aGravar, setAGravar] = useState(false);
  const [apagar, setApagar] = useState(null);

  const ausencias = useMemo(() => [...(data.timeOff || [])]
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')), [data.timeOff]);

  const activos = (data.professionals || []).filter(p => p.isActive !== false);

  // As marcacoes que este periodo apanha, para as poder mostrar antes de gravar.
  const apanhadas = useMemo(() => {
    if (!form.professionalId || !form.startDate || !form.endDate || form.endDate < form.startDate) return [];
    return (data.appointments || []).filter(a =>
      a.professionalId === form.professionalId &&
      a.date >= form.startDate && a.date <= form.endDate &&
      !a.blocked && (a.status === 'pending' || a.status === 'confirmed'))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [form, data.appointments]);

  const dias = (de, ate) => {
    const d1 = new Date(de + 'T00:00:00'), d2 = new Date(ate + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000) + 1;
  };

  const abrir = () => {
    setForm({ professionalId: activos[0]?.id || '', startDate: hoje, endDate: hoje, reason: '' });
    setModal(true);
  };

  const gravar = async () => {
    setAGravar(true);
    try {
      const r = await dataService.createTimeOff(form);
      const pro = data.professionals.find(p => p.id === form.professionalId);
      toast.success(
        `Ausência de ${pro?.name || 'profissional'} marcada`,
        r.canceladas > 0
          ? `${r.canceladas} marcaç${r.canceladas === 1 ? 'ão cancelada e o cliente foi avisado' : 'ões canceladas e os clientes foram avisados'}.`
          : 'Não havia marcações nesses dias.'
      );
      if (r.porCancelar?.length) {
        toast.error('Atenção', `${r.porCancelar.length} marcação(ões) não foram canceladas. Trata delas à mão em Marcações.`);
      }
      setModal(false);
    } catch (e) {
      toast.error('Não foi possível marcar a ausência', e.message);
    } finally {
      setAGravar(false);
    }
  };

  const confirmarApagar = async () => {
    try {
      await dataService.deleteTimeOff(apagar.id);
      toast.info('Ausência removida', 'O profissional volta a ter horas nesses dias. As marcações canceladas não voltam.');
    } catch (e) { toast.error('Não foi possível remover', e.message); }
    setApagar(null);
  };

  const estadoDe = (f) => {
    if (f.endDate < hoje) return { txt: 'Terminada', v: 'default' };
    if (f.startDate > hoje) return { txt: 'Por começar', v: 'warning' };
    return { txt: 'A decorrer', v: 'success' };
  };

  return (
    <AdminPage
      title="Férias e ausências"
      subtitle="Dias em que um profissional não trabalha. Nesses dias não tem horas para marcar, nem aqui nem no site."
      actions={<Button variant="primary" onClick={abrir} disabled={activos.length === 0}><Plus size={16} /> Nova ausência</Button>}
    >
      {ausencias.length === 0 ? (
        <Card className="card-pad">
          <EmptyState icon={() => <Plane />} title="Sem ausências marcadas"
            description="Marca aqui as férias, a baixa ou a formação de um profissional. Para uma tarde ou umas horas, usa os Bloqueios da agenda." />
        </Card>
      ) : (
        <Card>
          <table className="table">
            <thead><tr><th>Profissional</th><th>De</th><th>Até</th><th>Dias</th><th>Motivo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {ausencias.map(f => {
                const pro = data.professionals.find(p => p.id === f.professionalId);
                const e = estadoDe(f);
                return (
                  <tr key={f.id}>
                    <td className="fw-600">{pro?.name || '—'}</td>
                    <td>{formatDateShortNum(f.startDate)}</td>
                    <td>{formatDateShortNum(f.endDate)}</td>
                    <td className="text-sec">{dias(f.startDate, f.endDate)}</td>
                    <td className="text-sec">{f.reason || '—'}</td>
                    <td><Badge variant={e.v}>{e.txt}</Badge></td>
                    <td>
                      <button className="btn btn-ghost btn-icon" aria-label={`Remover ausência de ${pro?.name || ''}`} title="Remover" onClick={() => setApagar(f)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nova ausência">
        <div className="field">
          <label className="label" htmlFor="ausencia-pro">Profissional</label>
          <select id="ausencia-pro" className="select" value={form.professionalId} onChange={e => setForm(f => ({ ...f, professionalId: e.target.value }))}>
            {activos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label className="label" htmlFor="ausencia-de">Primeiro dia</label>
            <input id="ausencia-de" type="date" className="input" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate < e.target.value ? e.target.value : f.endDate }))} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label className="label" htmlFor="ausencia-ate">Último dia</label>
            <input id="ausencia-ate" type="date" className="input" value={form.endDate} min={form.startDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="ausencia-motivo">Motivo (opcional, só tu o vês)</label>
          <input id="ausencia-motivo" className="input" placeholder="Férias, baixa, formação…" value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
        </div>

        {form.startDate && form.endDate && form.endDate >= form.startDate && (
          <p className="text-sec text-sm" style={{ marginTop: -6, marginBottom: 14 }}>
            {dias(form.startDate, form.endDate)} dia{dias(form.startDate, form.endDate) === 1 ? '' : 's'}, de {formatDate(form.startDate)} a {formatDate(form.endDate)}.
          </p>
        )}

        {apanhadas.length > 0 && (
          <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-8 mb-8">
              <AlertTriangle size={15} style={{ color: 'var(--error)' }} />
              <span className="fw-600 text-sm">
                {apanhadas.length} marcaç{apanhadas.length === 1 ? 'ão vai ser cancelada' : 'ões vão ser canceladas'}
              </span>
            </div>
            <div className="flex-col gap-4" style={{ maxHeight: 150, overflowY: 'auto' }}>
              {apanhadas.map(a => {
                const c = data.customers.find(x => x.id === a.customerId);
                return (
                  <div key={a.id} className="flex items-center gap-8 text-xs">
                    <CalendarX size={12} className="text-sec" />
                    <span className="text-sec">{formatDateShortNum(a.date)} · {a.startTime}</span>
                    <span className="fw-600">{c?.name || a.customerNameSnapshot || 'Cliente'}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sec text-xs" style={{ marginTop: 8, lineHeight: 1.5 }}>
              Cada cliente recebe aviso de que o profissional vai estar ausente. Não são remarcadas — isso é contigo.
            </p>
          </div>
        )}

        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          <Button variant={apanhadas.length > 0 ? 'danger' : 'primary'} onClick={gravar} disabled={aGravar || !form.professionalId}>
            {aGravar ? 'A marcar…' : apanhadas.length > 0 ? `Marcar e cancelar ${apanhadas.length}` : 'Marcar ausência'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!apagar} onClose={() => setApagar(null)} title="Remover ausência">
        <p className="text-sec text-sm" style={{ marginBottom: 18, lineHeight: 1.6 }}>
          O profissional volta a ter horas nesses dias. As marcações que foram canceladas <strong style={{ color: 'var(--text)' }}>não voltam</strong> — essas tens de as combinar com os clientes.
        </p>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setApagar(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirmarApagar}>Remover</Button>
        </div>
      </Modal>
    </AdminPage>
  );
}
