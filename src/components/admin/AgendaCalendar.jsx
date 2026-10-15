import dataService, { agendaDaBarbearia } from '@/lib/dataService';
import React from 'react';
import { useStore } from '@/hooks/useStore';
import { todayStr } from '@/lib/format';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import IndicadoresCliente from '@/components/admin/IndicadoresCliente';
import { n as nicho } from '@/lib/nicho';

/*
 * A grelha segue o que a barbearia escolheu em Definicoes -> Agenda. Quem
 * marca de hora em hora ve linhas de hora em hora, e nao 48 linhas de meia
 * hora quase todas vazias. A altura acompanha o passo para os pixels por
 * minuto nao mudarem: um corte de 45 min ocupa sempre o mesmo espaco.
 */
const ALTURA_POR_30 = 48;
function grelhaDe(business, dateStr) {
  const { modo, passo } = agendaDaBarbearia(business, dateStr);
  // No modo encostado as horas nao sao fixas; a grelha fica na meia hora.
  const STEP = modo === 'encostado' ? 30 : Math.max(10, Math.min(120, passo));
  return { STEP, SLOT_H: Math.round(ALTURA_POR_30 * (STEP / 30)) };
}
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function toTime(mins) { const h = Math.floor(mins / 60), m = mins % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

/*
 * VISTAS (15/10/2026, à Fresha).
 *
 * A grelha deixou de ser «um dia, uma coluna por profissional» e passou a
 * ser «colunas»: cada coluna tem um dia e um profissional. A vista Dia dá
 * uma coluna por profissional no mesmo dia; 3 dias e Semana dão uma coluna
 * por dia para o profissional escolhido. O resto — horas, blocos, pausas,
 * a linha do agora — é o mesmo código.
 *
 *   colunas: [{ key, label, sub, date, professionalId }]
 * Sem `colunas`, comporta-se como antes (Dia, todos os profissionais).
 */
function horasDe(business, dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return (business.openingHours || []).find(h => h.day === DAY_NAMES[dow]);
}
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export function rotuloDia(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DIAS_CURTOS[d.getDay()]} ${d.getDate()}`;
}

export default function AgendaCalendar({ date, appts, professionals, services, customers, blockMode, onBlock, onSelect, onNovaNaHora, colunas }) {
  const data = useStore();
  const cols = colunas || professionals.map(p => ({ key: p.id, label: p.name.split(' ')[0], date, professionalId: p.id }));
  const multiDia = cols.some(c => c.date !== date);
  const hours = horasDe(data.business, date);

  if (!multiDia && (!hours || !hours.isOpen)) {
    /*
     * Isto dizia so "Encerrado neste dia. Nao ha horario de funcionamento
     * definido." e acabava ali — um beco sem saida, e logo no ecra onde o
     * barbeiro passa o dia. Quem acabou de montar a barbearia chega aqui no
     * primeiro minuto e nao ha nada para carregar.
     */
    const semHorarioNenhum = !(data.business.openingHours || []).some(h => h.isOpen);
    return (
      <div className="ag-grid">
        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-sec)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {semHorarioNenhum ? `Ainda não definiste o horário ${nicho().da}.` : 'Fechado neste dia.'}
          </div>
          <div style={{ fontSize: 15, marginBottom: 18 }}>
            {semHorarioNenhum
              ? 'Sem horário, os teus clientes não conseguem marcar.'
              : `Podes abrir este dia no horário ${nicho().da}.`}
          </div>
          <Link to="/admin/horarios" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            Definir horário agora <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const { STEP, SLOT_H } = grelhaDe(data.business, date);
  const abertas = cols.map(c => horasDe(data.business, c.date)).filter(h => h && h.isOpen);
  if (abertas.length === 0) {
    return <div className="ag-grid"><div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-sec)' }}>Fechado nestes dias.</div></div>;
  }
  const openMin = Math.min(...abertas.map(h => toMin(h.open)));
  const closeMin = Math.max(...abertas.map(h => toMin(h.close)));
  const slotCount = Math.round((closeMin - openMin) / STEP);
  const times = Array.from({ length: slotCount }, (_, i) => toTime(openMin + i * STEP));

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hoje = todayStr();
  const nowTop = !multiDia && date === hoje && nowMin >= openMin && nowMin <= closeMin ? ((nowMin - openMin) / STEP) * SLOT_H : null;

  const visibleAppts = appts.filter(a => a.blocked || a.status !== 'cancelled');

  return (
    <div className="ag-grid">
      <div className="ag-head">
        <div className="ag-head-time" />
        {cols.map(c => (
          <div className={`ag-head-pro${c.date === hoje && multiDia ? ' hoje' : ''}`} key={c.key}>{c.label}{c.sub && <span className="ag-head-sub">{c.sub}</span>}</div>
        ))}
      </div>
      <div className="ag-body">
        <div className="ag-timecol">
          {times.map((t, i) => (
            <div className="ag-timecell" key={i}>{t}</div>
          ))}
        </div>
        <div className="ag-cols">
          {cols.map(c => {
            const p = { id: c.professionalId };
            const colAppts = visibleAppts.filter(a => a.professionalId === c.professionalId && a.date === c.date);
            const hc = horasDe(data.business, c.date);
            const fechada = !hc || !hc.isOpen;
            const cOpen = fechada ? openMin : toMin(hc.open);
            const cClose = fechada ? openMin : toMin(hc.close);
            return (
              <div className={`ag-col${fechada ? ' fechada' : ''}`} key={c.key} style={{ position: 'relative' }}>
                {times.map((t, i) => {
                  const tm = openMin + i * STEP;
                  const fora = fechada || tm < cOpen || tm >= cClose;
                  // Clicar numa hora livre abre a nova marcação já com o
                  // barbeiro e a hora preenchidos. Em modo bloquear, bloqueia.
                  return (
                    <div
                      key={i}
                      data-hora={t}
                      className={`ag-slotline ${fora ? 'fora' : blockMode ? 'blockable' : (onNovaNaHora ? 'livre' : '')}`}
                      title={fora ? undefined : blockMode ? `Bloquear ${t}` : (onNovaNaHora ? `Nova marcação às ${t}` : undefined)}
                      onClick={fora ? undefined : blockMode ? () => onBlock(p.id, t, '', undefined, c.date) : (onNovaNaHora ? () => onNovaNaHora(p.id, t, c.date) : undefined)}
                    />
                  );
                })}
                {!fechada && (hc.breaks || []).map((b, bi) => {
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
                      <span style={{ fontSize: 13, color: 'var(--text-ter)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4, opacity: 0.9 }}>
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
                            {a.usaPack && <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', background: 'var(--gold)', color: 'var(--on-gold)', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle' }}>PACK</span>}
                            {(() => {
                              const mb = dataService.mbwayDe?.(a.id);
                              if (!mb) return null;
                              return mb.estado === 'pago'
                                ? <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle', background: '#16a34a', color: '#fff' }}>MB WAY ✓</span>
                                : <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle', background: '#f59e0b', color: '#1a1a1a' }} title="O cliente diz que pagou por MB WAY — confirma em MB WAY">MB WAY ?</span>;
                            })()}
                            {a.startTime} · {svc?.name}{curto ? ' ·' : ''}
                          </div>
                          <div className="ag-b-cliente">
                            <span className="ag-b-name">{cust?.name || '—'}</span>
                            <IndicadoresCliente appt={a} cliente={cust} data={data} />
                          </div>
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
