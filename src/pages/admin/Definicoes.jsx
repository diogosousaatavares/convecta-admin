import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings2, Calendar, UserCog, CreditCard, Users, FileText, Shield, Lock, Save } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import authService from '@/lib/authService';
import AvisoPush from '@/components/AvisoPush';

const SECTIONS = {
  agenda: { icon: Calendar, title: 'Agenda' },
  profissionais: { icon: UserCog, title: 'Profissionais' },
  pagamentos: { icon: CreditCard, title: 'Pagamentos' },
  clientes: { icon: Users, title: 'Clientes' },
  anamnese: { icon: FileText, title: 'Anamnese' },
  documentos: { icon: FileText, title: 'Documentos' },
  utilizadores: { icon: UserCog, title: 'Utilizadores e Permissões' },
  seguranca: { icon: Shield, title: 'Segurança' }
};

export default function Definicoes() {
  const data = useStore();
  const toast = useToast();
  const location = useLocation();
  const seg = location.pathname.split('/').pop();
  const section = SECTIONS[seg] ? seg : 'agenda';
  const cfg = data.business.config || {};
  const SIcon = SECTIONS[section].icon;
  const [methods, setMethods] = useState((cfg.payments?.methods || []).join(', '));
  const [docType, setDocType] = useState('');

  const saveAgenda = async (updates) => { await dataService.updateConfig('agenda', updates); toast.success('Configuração guardada'); };
  const savePayments = async () => { await dataService.updateConfig('payments', { methods: methods.split(',').map(m => m.trim()).filter(Boolean), tipEnabled: cfg.payments?.tipEnabled !== false }); toast.success('Pagamentos guardados'); };
  const saveClients = async (updates) => { await dataService.updateConfig('clients', updates); toast.success('Clientes guardados'); };
  const savePro = async (updates) => { await dataService.updateConfig('profissionais', updates); toast.success('Profissionais guardados'); };
  const saveAnamnese = async (updates) => { await dataService.updateConfig('anamnese', updates); toast.success('Anamnese guardada'); };
  const addDocType = async () => { if (!docType.trim()) return; const list = [...(cfg.documentos?.types || []), docType.trim()]; await dataService.updateConfig('documentos', { types: list }); setDocType(''); toast.success('Tipo adicionado'); };
  const removeDocType = async (t) => { const list = (cfg.documentos?.types || []).filter(x => x !== t); await dataService.updateConfig('documentos', { types: list }); toast.info('Removido'); };

  const session = authService.getCurrentUser();

  return (
    <AdminPage title={SECTIONS[section].title} subtitle="Definições do sistema." page={section === 'agenda' ? 'definicoesAgenda' : section === 'utilizadores' ? 'definicoesUtilizadores' : undefined}>
      {/* Aqui pode-se sempre testar as notificacoes deste aparelho. */}
      <div style={{ marginBottom: 20 }}>
        <AvisoPush businessId={data.business?.id} userId={session?.id} papel="admin" comTeste sempre />
      </div>

      {/*
        Este separador esteve escondido (lib/modulos.js) porque nao gravava
        nada que alguem lesse: o «slot» e a antecedencia iam para a tabela
        config e morriam la. Volta agora com uma coisa so — a unica que e
        mesmo lida, na agenda e no site do cliente.

        A antecedencia minima, a lista de espera e os encaixes sairam daqui:
        continuam sem ninguem que os leia. Voltam quando forem usados, nao
        antes — uma definicao que nao faz nada e pior do que nao existir.
      */}
      {section === 'agenda' && (
        <div className="def-ag">
          <style dangerouslySetInnerHTML={{ __html: CSS_DEF_AG }} />
          <HorasQueAbrem cfg={cfg.agenda || {}} onGuardar={saveAgenda} />
          <AteQuandoSePodeMarcar cfg={cfg.agenda || {}} onGuardar={saveAgenda} />
          <DiasQueFogemARegra cfg={cfg.agenda || {}} onGuardar={saveAgenda} />
        </div>
      )}

      {section === 'profissionais' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <div className="field"><label className="label">Comissão padrão (%)</label><input type="number" className="input" defaultValue={cfg.profissionais?.defaultCommission ?? 30} onBlur={e => savePro({ defaultCommission: Number(e.target.value) })} /></div>
        </Card>
      )}

      {section === 'pagamentos' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <div className="field"><label className="label">Métodos de pagamento (separados por vírgula)</label><input className="input" value={methods} onChange={e => setMethods(e.target.value)} /></div>
          <label className="flex items-center gap-8 text-sm"><input type="checkbox" defaultChecked={cfg.payments?.tipEnabled !== false} onChange={e => dataService.updateConfig('payments', { tipEnabled: e.target.checked })} /> Permitir gorjetas</label>
          <div className="mt-16"><Button variant="primary" onClick={savePayments}><Save size={16} /> Guardar</Button></div>
        </Card>
      )}

      {section === 'clientes' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <label className="flex items-center gap-8 text-sm"><input type="checkbox" defaultChecked={cfg.clients?.requirePhone === true} onChange={e => saveClients({ requirePhone: e.target.checked })} /> Exigir telefone no registo</label>
          <div className="mt-16"><label className="flex items-center gap-8 text-sm"><input type="checkbox" defaultChecked={cfg.clients?.allowAnamnese === true} onChange={e => saveClients({ allowAnamnese: e.target.checked })} /> Permitir anamnese</label></div>
        </Card>
      )}

      {section === 'anamnese' && (
        <Card className="card-pad" style={{ maxWidth: 600 }}>
          <label className="flex items-center gap-8 text-sm mb-16"><input type="checkbox" defaultChecked={cfg.anamnese?.enabled === true} onChange={e => saveAnamnese({ enabled: e.target.checked })} /> Ativar formulário de anamnese</label>
          <div className="field"><label className="label">Modelo de perguntas (uma por linha)</label><textarea className="textarea" rows={5} defaultValue={(Array.isArray(cfg.anamnese?.template) ? cfg.anamnese.template : []).join('\n')} onBlur={e => saveAnamnese({ template: e.target.value.split('\n').filter(Boolean) })} placeholder="Ex: Alergias?&#10;Condições de pele?" /></div>
        </Card>
      )}

      {section === 'documentos' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <div className="flex gap-8 mb-24"><input className="input" placeholder="Novo tipo de documento…" value={docType} onChange={e => setDocType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDocType()} /><Button variant="primary" onClick={addDocType}>Adicionar</Button></div>
          {(cfg.documentos?.types || []).length === 0 ? <EmptyState title="Sem tipos de documento" /> : (
            <div className="flex-col gap-8">{(cfg.documentos?.types || []).map(t => <div key={t} className="flex items-center gap-12" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span className="flex-1 text-sm">{t}</span><button className="btn btn-ghost btn-icon" aria-label={`Remover tipo ${t}`} title={`Remover tipo ${t}`} onClick={() => removeDocType(t)}><Lock size={14} /></button></div>)}</div>
          )}
        </Card>
      )}

      {section === 'utilizadores' && (
        <Card className="card-pad">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Conta administradora</h3>
          <div className="flex items-center gap-12 mb-24"><span className="notif-ico"><UserCog size={18} /></span><div><div className="fw-600">{session?.name || 'Administrador'}</div><div className="text-sec text-sm">{session?.email}</div></div><Badge variant="gold">{session?.role}</Badge></div>
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>Níveis de acesso (estrutura preparada)</h4>
          <div className="flex-col gap-8">
            {[['Proprietário', 'Acesso total'], ['Administrador', 'Gestão completa'], ['Gerente', 'Operação e financeiro'], ['Receção', 'Agenda e marcações'], ['Profissional', 'Apenas a sua agenda']].map(([r, d]) => (
              <div key={r} className="flex items-center gap-12" style={{ padding: '10px 14px', background: 'var(--elevated)', borderRadius: 8, border: '1px solid var(--border)' }}><Badge variant="default">{r}</Badge><span className="text-sec text-sm">{d}</span></div>
            ))}
          </div>
        </Card>
      )}

      {section === 'seguranca' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Sessão atual</h3>
          <div className="ag-detail">
            <div className="ag-detail-row"><span className="l">Tipo</span><span className="v"><Badge variant="gold">{session?.type || 'admin'}</Badge></span></div>
            <div className="ag-detail-row"><span className="l">Email</span><span className="v">{session?.email}</span></div>
          </div>
          <div className="mt-16 text-sec text-sm">A alteração de credenciais administrativas é gerida na configuração do serviço de autenticação. As permissões por função serão ativadas na próxima fase.</div>
        </Card>
      )}
    </AdminPage>
  );
}
/*
 * DE QUANTO EM QUANTO TEMPO ABREM AS HORAS.
 *
 * Nao ha uma resposta certa e por isso nao fica escrita no codigo. Havia um
 * campo «Duracao do slot (min)» aqui que nao fazia nada: gravava o numero e
 * ninguem o lia. Agora le-se — na agenda do painel e no site onde o cliente
 * marca.
 *
 * Duas maneiras, porque os barbeiros pedem as duas:
 *   · Horas certas  — 09:00, 10:00, 11:00. O Rasta quer assim.
 *   · Encostado     — a vaga seguinte comeca onde a anterior acabou. Um
 *                     corte de 45 min as 09:00 abre as 09:45. Nao sobram
 *                     bocados de 15 minutos que nao dao para nada.
 */
const PASSOS_HORA = [
  { v: 10, l: '10 min' }, { v: 15, l: '15 min' }, { v: 20, l: '20 min' },
  { v: 30, l: '30 min' }, { v: 45, l: '45 min' }, { v: 60, l: '1 hora' },
];

function HorasQueAbrem({ cfg, onGuardar }) {
  const encostado = cfg.slotMode === 'encostado';
  const passo = Number(cfg.slotMinutes) > 0 ? Number(cfg.slotMinutes) : 30;
  return (
    <Card className="card-pad def-ag-caixa">
      <h3>Horas</h3>
      <div className="def-ag-seg">
        <button type="button" className={!encostado ? 'on' : ''} onClick={() => onGuardar({ slotMode: 'grelha' })}>Horas certas</button>
        <button type="button" className={encostado ? 'on' : ''} onClick={() => onGuardar({ slotMode: 'encostado' })}>Encostado</button>
      </div>
      {!encostado && (
        <div className="def-ag-chips">
          {PASSOS_HORA.map(p => (
            <button key={p.v} type="button" className={`chip${passo === p.v ? ' active' : ''}`} onClick={() => onGuardar({ slotMinutes: p.v })}>{p.l}</button>
          ))}
        </div>
      )}
    </Card>
  );
}

/*
 * ATE QUANDO O CLIENTE PODE MARCAR.
 *
 * Eram 14 dias escritos no codigo do site. A RastaVillage bateu nisso na
 * primeira semana: quem queria o corte do mes seguinte nao encontrava o dia
 * e ia marcar por telefone — ou nao marcava. Sessenta dias por omissao, e
 * quem quiser aperta ou alarga aqui.
 */
const HORIZONTES = [
  { v: 14, l: '2 semanas' }, { v: 30, l: '1 mês' },
  { v: 60, l: '2 meses' }, { v: 90, l: '3 meses' },
];

function AteQuandoSePodeMarcar({ cfg, onGuardar }) {
  const dias = Number(cfg.horizonDays) > 0 ? Number(cfg.horizonDays) : 60;
  return (
    <Card className="card-pad def-ag-caixa">
      <h3>Até quando o cliente pode marcar</h3>
      <div className="def-ag-chips">
        {HORIZONTES.map(h => (
          <button key={h.v} type="button" className={`chip${dias === h.v ? ' active' : ''}`} onClick={() => onGuardar({ horizonDays: h.v })}>{h.l}</button>
        ))}
      </div>
    </Card>
  );
}

/*
 * OS DIAS QUE FOGEM A REGRA.
 *
 * Segunda e uma manha morta e o barbeiro quer uma hora por cabeca; sexta e
 * sabado estao cheios e ele quer de 30 em 30 para nao deixar ninguem de
 * fora. Sao a mesma barbearia e sao dois ritmos.
 *
 * Por isso isto nao e uma segunda grelha: e uma excecao por dia, por cima
 * do valor da casa. «Igual» e o estado normal, e e o que esta em todos os
 * dias ate alguem mexer — quem nunca abrir isto nao ve diferenca nenhuma.
 */
const DIAS_DA_SEMANA = [
  { v: 'monday',    l: 'Segunda' },
  { v: 'tuesday',   l: 'Terça' },
  { v: 'wednesday', l: 'Quarta' },
  { v: 'thursday',  l: 'Quinta' },
  { v: 'friday',    l: 'Sexta' },
  { v: 'saturday',  l: 'Sábado' },
  { v: 'sunday',    l: 'Domingo' },
];

function DiasQueFogemARegra({ cfg, onGuardar }) {
  const porDia = cfg.porDia || {};
  const base = cfg.slotMode === 'encostado'
    ? 'encostado'
    : (Number(cfg.slotMinutes) > 0 ? Number(cfg.slotMinutes) : 30);
  const rotuloBase = base === 'encostado' ? 'encostado' : base === 60 ? '1 hora' : `${base} min`;

  const mudar = (dia, valor) => {
    const novo = { ...porDia };
    if (!valor) delete novo[dia];
    else if (valor === 'encostado') novo[dia] = { slotMode: 'encostado' };
    else novo[dia] = { slotMode: 'grelha', slotMinutes: Number(valor) };
    onGuardar({ porDia: novo });
  };

  const valorDe = dia => {
    const d = porDia[dia];
    if (!d) return '';
    if (d.slotMode === 'encostado') return 'encostado';
    return Number(d.slotMinutes) > 0 ? String(d.slotMinutes) : '';
  };

  const comExcecao = Object.keys(porDia).length;
  const [aberto, setAberto] = useState(comExcecao > 0);
  return (
    <Card className="card-pad def-ag-caixa">
      <button type="button" className="def-ag-abrir" onClick={() => setAberto(v => !v)} aria-expanded={aberto}>
        <h3>Dias diferentes{comExcecao ? ` · ${comExcecao}` : ''}</h3>
        <span>{aberto ? '−' : '+'}</span>
      </button>
      {aberto && (
        <div className="def-ag-dias">
          {DIAS_DA_SEMANA.map(d => (
            <div key={d.v} className={`def-ag-dia${valorDe(d.v) ? ' on' : ''}`}>
              <span>{d.l}</span>
              <select className="select" value={valorDe(d.v)} onChange={e => mudar(d.v, e.target.value)}>
                <option value="">Igual ({rotuloBase})</option>
                <option value="10">10 min</option>
                <option value="15">15 min</option>
                <option value="20">20 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hora</option>
                <option value="encostado">Encostado</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const CSS_DEF_AG = `
.def-ag { display: flex; flex-direction: column; gap: 12px; max-width: 560px; }
.def-ag-caixa h3 { font-size: 18px; margin: 0 0 12px; }
.def-ag-seg { display: grid; grid-template-columns: 1fr 1fr; padding: 4px; gap: 4px; border-radius: 12px; background: var(--elevated); border: 1px solid var(--border); }
.def-ag-seg button { min-height: 42px; border: 0; border-radius: 9px; background: transparent; color: var(--text-sec); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.def-ag-seg button.on { background: var(--text); color: var(--surface); }
.def-ag-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.def-ag-chips .chip { min-height: 40px; }
.def-ag-abrir { display: flex; align-items: center; justify-content: space-between; width: 100%; border: 0; background: transparent; padding: 0; cursor: pointer; color: inherit; font: inherit; text-align: left; }
.def-ag-abrir h3 { margin: 0; }
.def-ag-abrir span { font-size: 22px; color: var(--text-sec); line-height: 1; }
.def-ag-dias { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }
.def-ag-dia { display: grid; grid-template-columns: 84px minmax(0, 1fr); align-items: center; gap: 10px; }
.def-ag-dia span { font-size: 15px; color: var(--text-sec); }
.def-ag-dia.on span { color: var(--text); font-weight: 700; }
`;
