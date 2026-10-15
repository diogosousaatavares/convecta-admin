import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import Ajuda from '@/components/admin/Ajuda';
import Toggle from '@/components/admin/Toggle';

/*
 * AS DEFINIÇÕES DA AGENDA (15/10/2026).
 *
 * Três blocos, em linhas, como o resto do painel: como abrem as horas
 * (horas certas / encostado + de quanto em quanto), até quando o cliente
 * pode marcar, e os dias que fogem à regra. Cada bloco tem o seu (i),
 * explicado como para um bebé. O mesmo formulário serve a engrenagem da
 * agenda e Definições › Agenda.
 *
 * O que se grava é o de sempre: config.agenda = { slotMode, slotMinutes,
 * horizonDays, porDia: { monday: { slotMode, slotMinutes } … } }.
 */
const PASSOS = [[10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '1 hora']];
const HORIZONTES = [[14, '2 semanas'], [30, '1 mês'], [60, '2 meses'], [90, '3 meses']];
const DIAS = [['monday', 'Segunda'], ['tuesday', 'Terça'], ['wednesday', 'Quarta'], ['thursday', 'Quinta'], ['friday', 'Sexta'], ['saturday', 'Sábado'], ['sunday', 'Domingo']];

export function FormDefinicoesAgenda({ cfg, onGuardar }) {
  const encostado = cfg.slotMode === 'encostado';
  const passo = Number(cfg.slotMinutes) > 0 ? Number(cfg.slotMinutes) : 30;
  const dias = Number(cfg.horizonDays) > 0 ? Number(cfg.horizonDays) : 60;
  const porDia = cfg.porDia || {};
  const comExcecao = Object.keys(porDia).length;
  const [diasAbertos, setDiasAbertos] = useState(comExcecao > 0);
  const rotuloBase = encostado ? 'encostado' : (PASSOS.find(p => p[0] === passo)?.[1] || `${passo} min`);

  const mudarDia = (dia, valor) => {
    const novo = { ...porDia };
    if (!valor) delete novo[dia];
    else if (valor === 'encostado') novo[dia] = { slotMode: 'encostado' };
    else novo[dia] = { slotMode: 'grelha', slotMinutes: Number(valor) };
    onGuardar({ porDia: novo });
  };
  const valorDe = dia => { const d = porDia[dia]; if (!d) return ''; return d.slotMode === 'encostado' ? 'encostado' : String(d.slotMinutes || ''); };

  return (
    <div className="dfa">
      <div className="prod-sec">Como abrem as horas <Ajuda titulo="Como abrem as horas" texto={<>
        <p><b>Horas certas</b> — a agenda abre vagas sempre às mesmas horas. De 30 em 30: 09:00, 09:30, 10:00. De hora em hora: 09:00, 10:00, 11:00. Fácil de decorar, mas um corte de 45 min deixa 15 min a sobrar.</p>
        <p><b>Encostado</b> — a vaga seguinte começa onde a anterior acabou. Um corte de 45 min às 09:00 abre a seguinte às 09:45. Não sobram bocados, mas as horas ficam «tortas».</p>
        <p>É o que o cliente vê na app ao escolher a hora, e o que tu vês na grelha.</p>
      </>} /></div>
      <div className="tipo-opcoes duas" role="radiogroup" aria-label="Como abrem as horas">
        {[['grelha', 'Horas certas', '09:00 · 09:30 · 10:00'], ['encostado', 'Encostado', '09:00 · 09:45 · 10:15']].map(([v, t, d]) => (
          <button key={v} type="button" role="radio" aria-checked={(encostado ? 'encostado' : 'grelha') === v}
            className={`tipo-opcao ${(encostado ? 'encostado' : 'grelha') === v ? 'on' : ''}`}
            onClick={() => onGuardar({ slotMode: v })}>
            <span className="tipo-opcao-t">{t}</span>
            <span className="tipo-opcao-d">{d}</span>
          </button>
        ))}
      </div>
      {!encostado && (
        <div className="nt-row">
          <span className="nt-txt"><b>De quanto em quanto</b></span>
          <select className="select dfa-sel" value={passo} onChange={e => onGuardar({ slotMinutes: Number(e.target.value) })}>
            {PASSOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      )}

      <div className="prod-sec">Marcações pela app <Ajuda titulo="Até quando o cliente pode marcar" texto={<>
        <p>Quantos dias para a frente o cliente vê na app. Com «2 meses», hoje consegue marcar até daqui a dois meses; mais longe, não aparece.</p>
        <p>Pouco tempo deixa de fora quem marca o corte do mês seguinte; muito tempo enche a agenda de marcações distantes que depois mudam.</p>
      </>} /></div>
      <div className="nt-row">
        <span className="nt-txt"><b>Até quando pode marcar</b></span>
        <select className="select dfa-sel" value={dias} onChange={e => onGuardar({ horizonDays: Number(e.target.value) })}>
          {HORIZONTES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="prod-sec">Dias diferentes <Ajuda titulo="Dias diferentes" texto={<>
        <p>Um dia da semana com outro ritmo. Segunda é calma e queres de hora em hora; sábado está cheio e queres de 30 em 30. Os dias que não mexeres seguem a regra de cima.</p>
      </>} /></div>
      <div className="nt-row">
        <span className="nt-txt"><b>Algum dia com outro ritmo</b>{comExcecao > 0 && <span>{DIAS.filter(([k]) => porDia[k]).map(([, l]) => l).join(', ')}</span>}</span>
        <Toggle checked={diasAbertos} onChange={x => { setDiasAbertos(x); if (!x && comExcecao) onGuardar({ porDia: {} }); }} />
      </div>
      {diasAbertos && DIAS.map(([k, l]) => (
        <div key={k} className="nt-row dfa-dia">
          <span className="nt-txt"><b style={{ fontWeight: valorDe(k) ? 700 : 500 }}>{l}</b></span>
          <select className="select dfa-sel" value={valorDe(k)} onChange={e => mudarDia(k, e.target.value)}>
            <option value="">Igual ({rotuloBase})</option>
            {PASSOS.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
            <option value="encostado">Encostado</option>
          </select>
        </div>
      ))}
    </div>
  );
}

export default function DefinicoesDaAgenda({ aberta, fechar }) {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business?.config?.agenda || {};
  const guardar = async (updates) => {
    try { await dataService.updateConfig('agenda', updates); toast.success('Guardado'); }
    catch (e) { toast.error('Não foi possível guardar', e.message); }
  };
  return (
    <Modal open={aberta} onClose={fechar} title="Definições da agenda">
      <FormDefinicoesAgenda cfg={cfg} onGuardar={guardar} />
    </Modal>
  );
}
