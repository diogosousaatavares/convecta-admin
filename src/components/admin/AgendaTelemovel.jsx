import dataService, { agendaDaBarbearia } from '@/lib/dataService';
import IndicadoresCliente from '@/components/admin/IndicadoresCliente';
import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Users, Info,
  CheckCircle2, CalendarCheck, Clock3, Lock, Check, Settings, X, CalendarDays, Calendar, List, Hourglass } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useStore } from '@/hooks/useStore';
import { Modal } from '@/components/ui';
import { todayStr } from '@/lib/format';
import { Link } from 'react-router-dom';
import { n as nicho } from '@/lib/nicho';

/*
 * A agenda no telemovel.
 *
 * O painel no computador mostra todos os profissionais lado a lado. Num
 * telemovel isso nao cabe: cada coluna ficaria com 90px e ninguem le o nome
 * do cliente. Aqui e um profissional de cada vez, escolhido em cima, e o dia
 * inteiro em baixo — a pessoa abre a agenda ao balcao e ve logo o dia de
 * trabalho, sem arrastar nada para o lado.
 */

// Ver AgendaCalendar: a grelha e a altura seguem Definicoes -> Agenda.
const ALTURA_POR_30 = 64;
function grelhaDe(business, dateStr) {
  const { modo, passo } = agendaDaBarbearia(business, dateStr);
  const STEP = modo === 'encostado' ? 30 : Math.max(10, Math.min(120, passo));
  return { STEP, SLOT_H: Math.round(ALTURA_POR_30 * (STEP / 30)) };
}
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOMES_DIA = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const ESTADOS = {
  pending:   { nome: 'Pendente',   cor: 'pendente',   Icone: Clock3 },
  confirmed: { nome: 'Confirmada', cor: 'confirmada', Icone: CalendarCheck },
  completed: { nome: 'Concluída',  cor: 'concluida',  Icone: CheckCircle2 },
  blocked:   { nome: 'Bloqueado',  cor: 'bloqueado',  Icone: Lock },
};

/* O circulo do profissional tem cor propria, tirada do nome. E sempre a
   mesma cor para a mesma pessoa, por isso reconhece-se de relance. */
const CORES_PRO = [
  ['#6EE7B7', '#052E1B'], ['#D8B4FE', '#3B0764'], ['#93C5FD', '#0C2A52'],
  ['#FCD34D', '#3A2A02'], ['#F9A8D4', '#4A0B2C'], ['#5EEAD4', '#052F2B'],
];
function AvatarPro({ pessoa }) {
  const nome = pessoa?.name || '';
  let h = 0;
  for (let i = 0; i < nome.length; i += 1) h = (h * 31 + nome.charCodeAt(i)) % 9973;
  const [fundo, texto] = CORES_PRO[h % CORES_PRO.length];
  const iniciais = nome.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="agm-avatar" style={{ background: fundo, color: texto }}>
      {pessoa?.photoUrl ? <img src={pessoa.photoUrl} alt="" /> : (iniciais || '?')}
    </span>
  );
}

function contarDoDia(appts, proId) {
  const n = appts.filter(a => a.professionalId === proId && !a.blocked && a.status !== 'cancelled').length;
  if (n === 0) return 'Sem marcações neste dia';
  if (n === 1) return '1 marcação neste dia';
  return `${n} marcações neste dia`;
}

function paraMinutos(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function paraHoras(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
function somaDias(ds, n) {
  const [y, m, d] = ds.split('-').map(Number);
  const x = new Date(y, m - 1, d + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Os sete dias da semana do dia escolhido, de segunda a domingo. */
function semanaDe(ds) {
  const dow = new Date(ds + 'T00:00:00').getDay();     // 0 = domingo
  const recuo = dow === 0 ? 6 : dow - 1;               // segunda e o inicio
  const segunda = somaDias(ds, -recuo);
  return Array.from({ length: 7 }, (_, i) => somaDias(segunda, i));
}

export default function AgendaTelemovel({
  date, setDate, shift,
  appts, apptsByDate,
  professionals, services, customers,
  blockMode, setBlockMode, onBlock, onSelect,
  mode, setMode,
  onNovaMarcacao,
  onNovaNaHora,
  proInicial,
  children,
  onDefinicoes,
  vistaMes,
}) {
  const data = useStore();
  const [proId, setProId] = useState(() => proInicial || professionals[0]?.id || '');
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [legendaAberta, setLegendaAberta] = useState(false);
  // O menu hambúrguer da barra de cima (18/10/2026, à Fresha): as vistas,
  // a legenda e as definições da agenda saem do ecrã e vivem aqui.
  const [menu, setMenu] = useState(false);
  const [menuSai, setMenuSai] = useState(false);
  useEffect(() => {
    const abrir = () => { setMenuSai(false); setMenu(true); };
    window.addEventListener('convecta:menu-agenda', abrir);
    return () => window.removeEventListener('convecta:menu-agenda', abrir);
  }, []);
  const fecharMenu = (depois) => { setMenuSai(true); setTimeout(() => { setMenu(false); setMenuSai(false); depois && depois(); }, 220); };

  // Se o profissional escolhido deixar de existir (apagado, desativado),
  // volta ao primeiro em vez de mostrar uma coluna vazia sem explicacao.
  useEffect(() => {
    if (!professionals.some(p => p.id === proId)) setProId(professionals[0]?.id || '');
  }, [professionals, proId]);

  const pro = professionals.find(p => p.id === proId) || professionals[0];
  const semana = useMemo(() => semanaDe(date), [date]);
  const [ano, mes] = date.split('-').map(Number);

  const dow = new Date(date + 'T00:00:00').getDay();
  const horario = data.business.openingHours.find(h => h.day === NOMES_DIA[dow]);
  const aberto = !!(horario && horario.isOpen);

  const { STEP, SLOT_H } = grelhaDe(data.business, date);
  const abreMin = aberto ? paraMinutos(horario.open) : 0;
  const fechaMin = aberto ? paraMinutos(horario.close) : 0;
  const horas = useMemo(() => {
    if (!aberto) return [];
    const n = Math.round((fechaMin - abreMin) / STEP);
    return Array.from({ length: n }, (_, i) => paraHoras(abreMin + i * STEP));
  }, [aberto, abreMin, fechaMin, STEP]);

  const agora = new Date();
  const eHoje = date === todayStr();
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const linhaAgora = eHoje && agoraMin >= abreMin && agoraMin <= fechaMin
    ? ((agoraMin - abreMin) / STEP) * SLOT_H
    : null;

  const doProfissional = appts.filter(a => a.professionalId === proId && (a.blocked || a.status !== 'cancelled'));

  const toque = useRef(null);
  /* Deslizar a semana (18/10/2026): a faixa segue o dedo e, ao largar,
     sai para o lado e a semana nova entra do outro — em vez de saltar. */
  const [arrasto, setArrasto] = useState(0);        // px, enquanto o dedo está em cima
  const [comTransicao, setComTransicao] = useState(false);
  const faixa = useRef(null);
  const largura = () => faixa.current?.offsetWidth || 320;
  const largar = (dx) => {
    const w = largura();
    if (Math.abs(dx) < 50) { setComTransicao(true); setArrasto(0); return; }
    const dir = dx < 0 ? 1 : -1;                     // 1 = semana seguinte
    setComTransicao(true); setArrasto(-dir * w);     // sai para o lado
    setTimeout(() => {
      shift(7 * dir);
      setComTransicao(false); setArrasto(dir * w);   // a nova fica do outro lado…
      requestAnimationFrame(() => requestAnimationFrame(() => { setComTransicao(true); setArrasto(0); })); // …e entra
    }, 200);
  };
  return (
    <div className="agm" data-tour="agenda">
      {/* ---- Titulo, mes e navegacao de dias ---- */}
      {/* 18/10/2026: o «Agenda» está ao centro na barra de cima e a
          engrenagem passou para o menu hambúrguer. Fica só o mês. */}
      <header className="agm-top agm-top-so-mes">
        <button type="button" className="agm-mes" onClick={() => (vistaMes ? setMode('mes') : setDate(todayStr()))}>{MESES[mes - 1]} {ano}</button>
      </header>

      {/* ---- A semana, de segunda a domingo ---- */}
      <div className="agm-semana" ref={faixa}
        onTouchStart={e => { toque.current = e.touches[0].clientX; setComTransicao(false); }}
        onTouchMove={e => { if (toque.current == null) return; setArrasto(e.touches[0].clientX - toque.current); }}
        onTouchEnd={e => { const dx = e.changedTouches[0].clientX - (toque.current ?? e.changedTouches[0].clientX); toque.current = null; largar(dx); }}
        onTouchCancel={() => { toque.current = null; largar(0); }}>
        <div className="agm-semana-faixa" style={{ transform: `translate3d(${arrasto}px, 0, 0)`, transition: comTransicao ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none' }}>
        {semana.map(ds => {
          const d = Number(ds.split('-')[2]);
          const diaSemana = DIAS_SEMANA[new Date(ds + 'T00:00:00').getDay()];
          const temMarcacoes = (apptsByDate[ds] || 0) > 0;
          return (
            <button
              key={ds}
              type="button"
              className={`agm-dia ${ds === date ? 'escolhido' : ''} ${ds === todayStr() ? 'hoje' : ''}`}
              onClick={() => setDate(ds)}
              aria-label={`${diaSemana} ${d}`}
              aria-pressed={ds === date}
            >
              <span className="agm-dia-nome">{diaSemana}</span>
              <span className="agm-dia-num">{d}</span>
              <span className={`agm-dia-ponto ${temMarcacoes ? 'tem' : ''}`} />
            </button>
          );
        })}
        </div>
      </div>

      {/* ---- O menu da agenda (hambúrguer) ---- */}
      {menu && createPortal(
        <div className={`agmm${menuSai ? ' sai' : ''}`} role="dialog" aria-modal="true" aria-label="Menu da agenda">
          <div className="agmm-topo">
            <h2>Vistas da agenda</h2>
            <button type="button" className="agmm-x" onClick={() => fecharMenu()} aria-label="Fechar"><X size={24} /></button>
          </div>
          <div className="agmm-vistas">
            {[['grid', 'Dia', CalendarDays], ...(vistaMes ? [['mes', 'Mês', Calendar]] : []), ['list', 'Lista', List], ['waitlist', 'Espera', Hourglass]].map(([m, l, Ic]) => (
              <button key={m} type="button" className={mode === m ? 'on' : ''} onClick={() => fecharMenu(() => setMode(m))}>
                <Ic size={22} /><span>{l}</span>
              </button>
            ))}
          </div>
          <div className="agmm-linhas">
            <button type="button" onClick={() => fecharMenu(() => setLegendaAberta(true))}><span><Info size={19} />Legenda</span><ChevronRight size={18} /></button>
            {onDefinicoes && <button type="button" data-tour="agenda-definicoes" onClick={() => fecharMenu(onDefinicoes)}><span><Settings size={19} />Definições da agenda</span><ChevronRight size={18} /></button>}
          </div>
        </div>, document.body)}

      {mode === 'mes' ? vistaMes : mode === 'grid' ? (
        <>
          {/* ---- Profissional + legenda ---- */}
          <div className="agm-filtros">
            <button type="button" className="agm-pro-btn" onClick={() => setSeletorAberto(true)}>
              <Users size={17} />
              <span className="agm-pro-nome">{pro ? pro.name : 'Sem profissionais'}</span>
              <ChevronDown size={17} className="agm-pro-seta" />
            </button>
          </div>

          {/* ---- A grelha do dia ---- */}
          {!aberto ? (
            /* O mesmo beco sem saida que havia no computador, e aqui e pior:
               no telemovel e o primeiro ecra que ele ve. */
            <div className="agm-fechado">
              Ainda não definiste o horário.
              <span>Sem horário, os teus clientes não conseguem marcar.</span>
              <Link to="/admin/horarios" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: 12 }}>Definir horário agora</Link>
            </div>
          ) : !pro ? (
            <div className="agm-fechado">
              Ainda não há profissionais.
              <span>Adiciona um para veres a agenda.</span>
              <Link to="/admin/profissionais" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: 12 }}>Adicionar {nicho().pro}</Link>
            </div>
          ) : (
            <div className="agm-grelha">
              <div className="agm-grelha-topo">
                <div className="agm-gutter" />
                <div className="agm-pro-cab">
                  <AvatarPro pessoa={pro} />
                  <span>{pro.name}</span>
                </div>
              </div>

              <div className="agm-grelha-corpo">
                <div className="agm-horas">
                  {horas.map(h => <div className="agm-hora" key={h}><span>{h}</span></div>)}
                </div>

                <div className="agm-coluna">
                  {horas.map((h, i) => (
                    <div
                      key={i}
                      className={`agm-linha ${blockMode ? 'bloqueavel' : (onNovaNaHora ? 'livre' : '')}`}
                      onClick={blockMode ? () => onBlock(pro.id, h) : (onNovaNaHora ? () => onNovaNaHora(pro.id, h) : undefined)}
                    />
                  ))}

                  {(horario.breaks || []).map((b, bi) => {
                    const ini = paraMinutos(b.start), fim = paraMinutos(b.end);
                    if (fim <= abreMin || ini >= fechaMin) return null;
                    const topo = ((Math.max(ini, abreMin) - abreMin) / STEP) * SLOT_H;
                    const alt = ((Math.min(fim, fechaMin) - Math.max(ini, abreMin)) / STEP) * SLOT_H;
                    return <div className="agm-pausa" key={bi} style={{ top: topo, height: alt }}><span>{b.start}–{b.end}</span></div>;
                  })}

                  {doProfissional.map(a => {
                    const ini = paraMinutos(a.startTime);
                    const dur = paraMinutos(a.endTime) - ini;
                    const topo = ((ini - abreMin) / STEP) * SLOT_H;
                    // Enche a vaga inteira (uma barba de 20 min às 17:30 ocupa a
                    // vaga das 17:30 toda), sem passar da marcação seguinte.
                    const fimVaga = ini + Math.ceil(dur / STEP) * STEP;
                    const seguinte = doProfissional.reduce((m, o) => {
                      const oi = paraMinutos(o.startTime);
                      return oi > ini && oi < m ? oi : m;
                    }, Infinity);
                    const fimVisto = Math.max(ini + dur, Math.min(fimVaga, seguinte));
                    const alt = Math.max(((fimVisto - ini) / STEP) * SLOT_H - 6, 44);
                    // Num bloco baixo não cabem três linhas: vai tudo em duas.
                    const curto = alt < 76;
                    const est = ESTADOS[a.blocked ? 'blocked' : a.status] || ESTADOS.pending;
                    const svc = services.find(s => s.id === a.serviceId);
                    const cli = customers.find(c => c.id === a.customerId);
                    const Icone = est.Icone;
                    return (
                      <button
                        type="button"
                        key={a.id}
                        className={`agm-bloco ${est.cor}${curto ? ' curto' : ''}`}
                        style={{ top: topo, height: alt, ...(a.usaPack && !a.blocked ? { boxShadow: 'inset 4px 0 0 var(--gold)' } : null) }}
                        onClick={() => onSelect(a)}
                      >
                        <span className="agm-bloco-barra" />
                        <span className="agm-bloco-ico"><Icone size={18} /></span>
                        <span className="agm-bloco-hora">{a.startTime} – {a.endTime}</span>
                        <span className="agm-bloco-svc">
                          {a.usaPack && !a.blocked && <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', background: 'var(--gold)', color: 'var(--on-gold)', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle' }}>PACK</span>}
                          {(() => {
                            const mb = !a.blocked && dataService.mbwayDe?.(a.id);
                            if (!mb) return null;
                            return mb.estado === 'pago'
                              ? <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle', background: '#16a34a', color: '#fff' }}>MB WAY ✓</span>
                              : <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.04em', borderRadius: 4, padding: '1px 5px', marginRight: 5, verticalAlign: 'middle', background: '#f59e0b', color: '#1a1a1a' }}>MB WAY ?</span>;
                          })()}
                          {a.blocked ? (a.label || 'Bloqueado') : (svc?.name || 'Serviço')}
                        </span>
                        {!a.blocked && (
                          <span className="agm-bloco-cli">
                            {cli?.name || '—'}
                            <IndicadoresCliente appt={a} cliente={cli} data={data} />
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {linhaAgora !== null && <div className="agm-agora" style={{ top: linhaAgora }} />}
                </div>
              </div>
            </div>
          )}
        </>
      ) : children}

      {/*
       * O BOTAO FLUTUANTE SAIU.
       *
       * Era um circulo de 68px fixo no canto, por cima da agenda — e desde
       * que a barra de baixo e a pastilha dos primeiros passos existem,
       * ficavam tres coisas a disputar o mesmo canto do ecra.
       *
       * A funcao nao se perdeu, e ate ficou melhor: tocar numa hora livre da
       * grelha abre a marcacao JA NESSA HORA, em vez de abrir vazia para ele
       * escolher a hora a seguir. E o gesto natural numa agenda, e e o que a
       * concorrencia tambem faz.
       */}

      {/* ---- Escolher profissional ---- */}
      <Modal open={seletorAberto} onClose={() => setSeletorAberto(false)} title="Ver a agenda de">
        <div className="agm-lista-pro">
          {professionals.map(p => (
            <button
              type="button"
              key={p.id}
              className={`agm-lista-pro-item ${p.id === proId ? 'ativo' : ''}`}
              onClick={() => { setProId(p.id); setSeletorAberto(false); }}
            >
              <AvatarPro pessoa={p} />
              <span className="agm-lista-pro-nome">
                {p.name}
                <small>{contarDoDia(appts, p.id)}</small>
              </span>
              {p.id === proId && <Check size={18} className="agm-lista-pro-check" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* ---- Legenda ---- */}
      <Modal open={legendaAberta} onClose={() => setLegendaAberta(false)} title="Legenda">
        <div className="agm-legenda-lista">
          {Object.values(ESTADOS).map(e => (
            <div className="agm-legenda-linha" key={e.cor}>
              <span className={`agm-legenda-cor ${e.cor}`} />
              <span className="agm-legenda-nome">{e.nome}</span>
              <e.Icone size={17} className="agm-legenda-ico" />
            </div>
          ))}
        </div>
        <label className={`agm-bloquear ${blockMode ? 'ativo' : ''}`}>
          <input type="checkbox" checked={blockMode} onChange={e => setBlockMode(e.target.checked)} />
          <Lock size={15} />
          Tocar numa hora livre bloqueia-a
        </label>
      </Modal>
    </div>
  );
}
