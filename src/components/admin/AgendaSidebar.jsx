import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, Lock } from 'lucide-react';

const DOW_LABELS = ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá'];
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

export default function AgendaSidebar({ date, setDate, apptsByDate, mode, setMode, blockMode, setBlockMode }) {
  const navigate = useNavigate();
  const [viewMonth, setViewMonth] = useState(date.slice(0, 7));

  const [vy, vm] = viewMonth.split('-').map(Number);
  const firstDay = new Date(vy, vm - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(vy, vm, 0).getDate();

  const shiftMonth = (n) => {
    const d = new Date(vy, vm - 1 + n, 1);
    setViewMonth(d.toISOString().slice(0, 7));
  };

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date().toISOString().slice(0, 10);
  const pick = (d) => {
    const ds = `${viewMonth}-${String(d).padStart(2, '0')}`;
    setDate(ds);
  };

  return (
    <div className="ag-side">
      <div className="ag-side-card">
        <div className="ag-cal-head">
          <button className="ag-cal-nav" onClick={() => shiftMonth(-1)}><ChevronLeft size={14} /></button>
          <span className="ag-cal-title">{MONTHS[vm - 1]} {vy}</span>
          <button className="ag-cal-nav" onClick={() => shiftMonth(1)}><ChevronRight size={14} /></button>
        </div>
        <div className="ag-cal-grid">
          {DOW_LABELS.map((d, i) => <div className="ag-cal-dow" key={i}>{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="ag-cal-day empty" />;
            const ds = `${viewMonth}-${String(d).padStart(2, '0')}`;
            const isSel = ds === date;
            const isToday = ds === today;
            const hasAppt = (apptsByDate[ds] || 0) > 0;
            return (
              <div
                key={i}
                className={`ag-cal-day ${isSel ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasAppt ? 'has-appt' : ''}`}
                onClick={() => pick(d)}
              >
                {d}
              </div>
            );
          })}
        </div>
        <label className={`ag-block-toggle ${blockMode ? 'active' : ''}`}>
          <Lock size={13} />
          <input type="checkbox" checked={blockMode} onChange={e => setBlockMode(e.target.checked)} />
          Bloquear Horário
        </label>
      </div>

      <div className="ag-side-card ag-side-actions">
        <button className={`ag-side-btn ${mode === 'grid' ? 'active' : ''}`} onClick={() => setMode('grid')}>Horários disponíveis</button>
        <button className={`ag-side-btn ${mode === 'list' ? 'active' : ''}`} onClick={() => setMode('list')}>Lista de Agendamentos</button>
        <button className={`ag-side-btn ${mode === 'waitlist' ? 'active' : ''}`} onClick={() => setMode('waitlist')}>Lista de Espera</button>
      </div>

      <button className="ag-side-btn" onClick={() => navigate('/admin/servicos')}>
        <BookOpen size={15} /> Produtos / Serviços
      </button>

      <div className="ag-side-card">
        <div className="ag-leg-section-title" style={{ marginBottom: 10 }}>Estado da marcação</div>
        <div className="ag-legend">
          <div className="ag-leg-row"><span className="ag-leg-dot confirmed" /> Confirmada</div>
          <div className="ag-leg-row"><span className="ag-leg-dot pending" /> Pendente</div>
          <div className="ag-leg-row"><span className="ag-leg-dot completed" /> Concluída</div>
          <div className="ag-leg-row"><span className="ag-leg-dot blocked" /> Bloqueado</div>
        </div>

        <div className="ag-leg-sep" />

        <div className="ag-leg-section-title" style={{ marginBottom: 10 }}>Indicadores de cliente</div>
        <div className="ag-legend">
          <div className="ag-leg-row"><span className="ag-ind-lg">🎂</span> Aniversariante</div>
          <div className="ag-leg-row"><span className="ag-ind-lg">⭐</span> 1.ª marcação</div>
          <div className="ag-leg-row"><span className="ag-ind-lg">🏷️</span> Cupão aplicado</div>
          <div className="ag-leg-row"><span className="ag-ind-lg">📦</span> Assinatura ativa</div>
          <div className="ag-leg-row"><span className="ag-ind-lg">💳</span> Programa de fidelidade</div>
        </div>
      </div>
    </div>
  );
}
