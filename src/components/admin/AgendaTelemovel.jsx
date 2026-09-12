import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Users, Info, Plus,
  CheckCircle2, CalendarCheck, Clock3, Lock, Check,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { Modal } from '@/components/ui';
import { todayStr } from '@/lib/format';

/*
 * A agenda no telemovel.
 *
 * O painel no computador mostra todos os profissionais lado a lado. Num
 * telemovel isso nao cabe: cada coluna ficaria com 90px e ninguem le o nome
 * do cliente. Aqui e um profissional de cada vez, escolhido em cima, e o dia
 * inteiro em baixo — a pessoa abre a agenda ao balcao e ve logo o dia de
 * trabalho, sem arrastar nada para o lado.
 */

const SLOT_H = 64;       // altura de meia hora
const STEP = 30;         // minutos por linha
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
  children,
}) {
  const data = useStore();
  const [proId, setProId] = useState(() => professionals[0]?.id || '');
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [legendaAberta, setLegendaAberta] = useState(false);

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

  const abreMin = aberto ? paraMinutos(horario.open) : 0;
  const fechaMin = aberto ? paraMinutos(horario.close) : 0;
  const horas = useMemo(() => {
    if (!aberto) return [];
    const n = Math.round((fechaMin - abreMin) / STEP);
    return Array.from({ length: n }, (_, i) => paraHoras(abreMin + i * STEP));
  }, [aberto, abreMin, fechaMin]);

  const agora = new Date();
  const eHoje = date === todayStr();
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  const linhaAgora = eHoje && agoraMin >= abreMin && agoraMin <= fechaMin
    ? ((agoraMin - abreMin) / STEP) * SLOT_H
    : null;

  const doProfissional = appts.filter(a => a.professionalId === proId && (a.blocked || a.status !== 'cancelled'));

  return (
    <div className="agm">
      {/* ---- Titulo, mes e navegacao de dias ---- */}
      <header className="agm-top">
        <div className="agm-top-txt">
          <h1 className="agm-titulo">Agenda</h1>
          <p className="agm-mes">{MESES[mes - 1]} {ano}</p>
        </div>
        <div className="agm-nav">
          <button type="button" className="agm-hoje" onClick={() => setDate(todayStr())}>Hoje</button>
          <button type="button" className="agm-seta" onClick={() => shift(-1)} aria-label="Dia anterior"><ChevronLeft size={20} /></button>
          <button type="button" className="agm-seta" onClick={() => shift(1)} aria-label="Dia seguinte"><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* ---- A semana, de segunda a domingo ---- */}
      <div className="agm-semana">
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

      {/* ---- Dia / Lista / Espera ---- */}
      <div className="agm-vistas">
        <button type="button" className={mode === 'grid' ? 'ativa' : ''} onClick={() => setMode('grid')}>Dia</button>
        <button type="button" className={mode === 'list' ? 'ativa' : ''} onClick={() => setMode('list')}>Lista</button>
        <button type="button" className={mode === 'waitlist' ? 'ativa' : ''} onClick={() => setMode('waitlist')}>Espera</button>
      </div>

      {mode === 'grid' ? (
        <>
          {/* ---- Profissional + legenda ---- */}
          <div className="agm-filtros">
            <button type="button" className="agm-pro-btn" onClick={() => setSeletorAberto(true)}>
              <Users size={17} />
              <span className="agm-pro-nome">{pro ? pro.name : 'Sem profissionais'}</span>
              <ChevronDown size={17} className="agm-pro-seta" />
            </button>
            <button type="button" className="agm-legenda-btn" onClick={() => setLegendaAberta(true)}>
              <span className="agm-legenda-pontos"><i className="p1" /><i className="p2" /></span>
              Legenda
              <Info size={16} />
            </button>
          </div>

          {/* ---- A grelha do dia ---- */}
          {!aberto ? (
            <div className="agm-fechado">Encerrado neste dia.<span>Não há horário de funcionamento definido.</span></div>
          ) : !pro ? (
            <div className="agm-fechado">Ainda não há profissionais.<span>Adiciona um em Profissionais para veres a agenda.</span></div>
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
                      className={`agm-linha ${blockMode ? 'bloqueavel' : ''}`}
                      onClick={blockMode ? () => onBlock(pro.id, h) : undefined}
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
                    const alt = Math.max((dur / STEP) * SLOT_H - 6, 44);
                    const est = ESTADOS[a.blocked ? 'blocked' : a.status] || ESTADOS.pending;
                    const svc = services.find(s => s.id === a.serviceId);
                    const cli = customers.find(c => c.id === a.customerId);
                    const Icone = est.Icone;
                    return (
                      <button
                        type="button"
                        key={a.id}
                        className={`agm-bloco ${est.cor}`}
                        style={{ top: topo, height: alt }}
                        onClick={() => onSelect(a)}
                      >
                        <span className="agm-bloco-barra" />
                        <span className="agm-bloco-ico"><Icone size={18} /></span>
                        <span className="agm-bloco-hora">{a.startTime} – {a.endTime}</span>
                        <span className="agm-bloco-svc">{a.blocked ? (a.label || 'Bloqueado') : (svc?.name || 'Serviço')}</span>
                        {!a.blocked && <span className="agm-bloco-cli">{cli?.name || '—'}</span>}
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

      {/* ---- Botao flutuante ---- */}
      <button type="button" className="agm-fab" onClick={onNovaMarcacao}>
        <span className="agm-fab-circulo"><Plus size={28} /></span>
        <span className="agm-fab-txt">Nova<br />marcação</span>
      </button>

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
