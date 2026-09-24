import dataService from '@/lib/dataService';
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

export default function AgendaCalendar({ date, appts, professionals, services, customers, blockMode, onBlock, onSelect, onNovaNaHora }) {
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
                  // Clicar numa hora livre abre a nova marcação já com o
                  // barbeiro e a hora preenchidos. Em modo bloquear, bloqueia.
                  <div
                    key={i}
                    data-hora={t}
                    className={`ag-slotline ${blockMode ? 'blockable' : (onNovaNaHora ? 'livre' : '')}`}
                    title={blockMode ? `Bloquear ${t}` : (onNovaNaHora ? `Nova marcação às ${t}` : undefined)}
                    onClick={blockMode ? () => onBlock(p.id, t) : (onNovaNaHora ? () => onNovaNaHora(p.id, t) : undefined)}
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
                  /*
                   * O bloco enche as vagas que ocupa, inteiras: uma barba de
                   * 20 minutos às 12:30 pinta a vaga das 12:30 toda, como o
                   * barbeiro a vê. Só não passa do início da marcação seguinte
                   * na mesma coluna (uma às 12:50, por exemplo).
                   */
                  const fimVaga = sMin + Math.ceil(dur / STEP) * STEP;
                  const seguinte = colAppts.reduce((m, o) => {
                    const oi = toMin(o.startTime);
                    return oi > sMin && oi < m ? oi : m;
                  }, Infinity);
                  const fimVisto = Math.max(sMin + dur, Math.min(fimVaga, seguinte));
                  const height = Math.max(((fimVisto - sMin) / STEP) * SLOT_H - 4, 22);
                  const cls = a.blocked ? 'blocked' : a.status;
                  // Um serviço de 15 ou 20 minutos dá um bloco com menos de
                  // 40px: duas linhas (hora/serviço + cliente) não cabem e o
                  // nome ficava cortado ao meio. Aí vai tudo numa linha só.
                  const curto = height < 40;
                  const svc = services.find(s => s.id === a.serviceId);
                  const cust = customers.find(c => c.id === a.customerId);
                  const ind = getIndicators(a, cust, data);

                  return (
                    <div
                      key={a.id}
                      className={`ag-block ${cls}${curto ? ' curto' : ''}`}
                      // Marcação do pack mensal: um friso dourado e a etiqueta
                      // PACK — o barbeiro sabe à primeira que não se cobra.
                      style={{ top, height, ...(a.usaPack && !a.blocked ? { boxShadow: 'inset 4px 0 0 #C9A227' } : null) }}
                      title={a.usaPack ? 'Pack mensal — já pago' : undefined}
                      onClick={() => onSelect(a)}
                    >
                      {a.blocked ? (
                        <span className="ag-b-name">{a.label || 'Bloqueado'}</span>
                      ) : (
                        <>
                          <div className="ag-b-time">
                            {a.usaPack && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.06em', background: '#C9A227', color: '#0A0804', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle' }}>PACK</span>}
                            {(() => {
                              const mb = dataService.mbwayDe?.(a.id);
                              if (!mb) return null;
                              return mb.estado === 'pago'
                                ? <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.04em', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle', background: '#16a34a', color: '#fff' }}>MB WAY ✓</span>
                                : <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.04em', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle', background: '#f59e0b', color: '#1a1a1a' }} title="O cliente diz que pagou por MB WAY — confirma em MB WAY">MB WAY ?</span>;
                            })()}
                            {a.startTime} · {svc?.name}{curto ? ' ·' : ''}
                          </div>
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
