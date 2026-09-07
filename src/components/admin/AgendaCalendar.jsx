import React from 'react';
import { useStore } from '@/hooks/useStore';
import { todayStr } from '@/lib/format';

const SLOT_H = 48;
const STEP = 30;
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function toTime(mins) { const h = Math.floor(mins / 60), m = mins % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

function getIndicators(a, cust, data) {
  if (!cust || a.blocked) return {};

  const todayMD = new Date().toISOString().slice(5, 10);
  const isBirthday = cust.birthDate && cust.birthDate.slice(5, 10) === todayMD;
  const custAppts = data.appointments.filter(c => c.customerId === cust.id && c.status !== 'cancelled');
  const isFirst = custAppts.length === 1;
  const hasCoupon = !!(a.couponCode || a.payment?.coupon);
  const hasSub = data.subscriptions.some(s => s.customerId === cust.id && s.status === 'active');
  const inLoyalty = (cust.loyalty?.totalStamps || 0) > 0;

  return { isBirthday, isFirst, hasCoupon, hasSub, inLoyalty };
}

export default function AgendaCalendar({ date, appts, professionals, services, customers, blockMode, onBlock, onSelect }) {
  const data = useStore();
  const dow = new Date(date + 'T00:00:00').getDay();
  const hours = data.business.openingHours.find(h => h.day === DAY_NAMES[dow]);

  if (!hours || !hours.isOpen) {
    return (
      <div className="ag-grid">
        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-sec)' }}>
          Encerrado neste dia. Não há horário de funcionamento definido.
        </div>
      </div>
    );
  }

  const openMin = toMin(hours.open);
  const closeMin = toMin(hours.close);
  const slotCount = Math.round((closeMin - openMin) / STEP);
  const times = Array.from({ length: slotCount }, (_, i) => toTime(openMin + i * STEP));

  const now = new Date();
  const isToday = date === todayStr();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = isToday && nowMin >= openMin && nowMin <= closeMin ? ((nowMin - openMin) / STEP) * SLOT_H : null;

  const visibleAppts = appts.filter(a => a.blocked || a.status !== 'cancelled');

  return (
    <div className="ag-grid">
      <div className="ag-head">
        <div className="ag-head-time" />
        {professionals.map(p => (
          <div className="ag-head-pro" key={p.id}>{p.name.split(' ')[0]}</div>
        ))}
      </div>
      <div className="ag-body">
        <div className="ag-timecol">
          {times.map((t, i) => (
            <div className="ag-timecell" key={i}>{t}</div>
          ))}
        </div>
        <div className="ag-cols">
          {professionals.map(p => {
            const colAppts = visibleAppts.filter(a => a.professionalId === p.id);
            return (
              <div className="ag-col" key={p.id} style={{ position: 'relative' }}>
                {times.map((t, i) => (
                  <div
                    key={i}
                    className={`ag-slotline ${blockMode ? 'blockable' : ''}`}
                    onClick={blockMode ? () => onBlock(p.id, t) : undefined}
                  />
                ))}
                {(hours.breaks || []).map((b, bi) => {
                  const bStart = toMin(b.start);
                  const bEnd = toMin(b.end);
                  if (bStart == null || bEnd == null || bEnd <= openMin || bStart >= closeMin) return null;
                  const bTop = ((Math.max(bStart, openMin) - openMin) / STEP) * SLOT_H;
                  const bHeight = ((Math.min(bEnd, closeMin) - Math.max(bStart, openMin)) / STEP) * SLOT_H;
                  return (
                    <div
                      key={bi}
                      style={{
                        position: 'absolute',
                        top: bTop,
                        height: bHeight,
                        left: 0,
                        right: 0,
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(120,120,120,0.07) 4px, rgba(120,120,120,0.07) 8px)',
                        borderTop: '1px dashed var(--border)',
                        borderBottom: '1px dashed var(--border)',
                        zIndex: 1,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text-ter)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, opacity: 0.9 }}>
                        {b.start}–{b.end}
                      </span>
                    </div>
                  );
                })}
                {colAppts.map(a => {
                  const sMin = toMin(a.startTime);
                  const dur = toMin(a.endTime) - sMin;
                  const top = ((sMin - openMin) / STEP) * SLOT_H;
                  const height = Math.max((dur / STEP) * SLOT_H - 4, 22);
                  const cls = a.blocked ? 'blocked' : a.status;
                  const svc = services.find(s => s.id === a.serviceId);
                  const cust = customers.find(c => c.id === a.customerId);
                  const ind = getIndicators(a, cust, data);

                  return (
                    <div
                      key={a.id}
                      className={`ag-block ${cls}`}
                      style={{ top, height }}
                      onClick={() => onSelect(a)}
                    >
                      {a.blocked ? (
                        <span className="ag-b-name">{a.label || 'Bloqueado'}</span>
                      ) : (
                        <>
                          <div className="ag-b-time">{a.startTime} · {svc?.name}</div>
                          <div className="ag-b-name">{cust?.name || '—'}</div>
                          {(ind.isBirthday || ind.isFirst || ind.hasCoupon || ind.hasSub || ind.inLoyalty) && (
                            <div className="ag-b-indicators">
                              {ind.isBirthday && <span className="ag-ind" title="Aniversariante">🎂</span>}
                              {ind.isFirst && <span className="ag-ind" title="1.ª marcação">⭐</span>}
                              {ind.hasCoupon && <span className="ag-ind" title="Cupão aplicado">🏷️</span>}
                              {ind.hasSub && <span className="ag-ind" title="Assinatura ativa">📦</span>}
                              {ind.inLoyalty && <span className="ag-ind" title="Fidelidade">💳</span>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {nowTop !== null && <div className="ag-now" style={{ top: nowTop }} />}
        </div>
      </div>
    </div>
  );
}
