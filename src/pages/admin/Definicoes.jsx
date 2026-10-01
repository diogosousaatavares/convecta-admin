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
      <div className="flex items-center gap-12 mb-24"><span className="notif-ico"><SIcon size={20} /></span><span className="text-sec text-sm">Secção: {SECTIONS[section].title}</span></div>
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
        <Card className="card-pad" style={{ maxWidth: 560 }}>
          <HorasQueAbrem cfg={cfg.agenda || {}} onGuardar={saveAgenda} />
          <DiasQueFogemARegra cfg={cfg.agenda || {}} onGuardar={saveAgenda} />
          <AteQuandoSePodeMarcar cfg={cfg.agenda || {}} onGuardar={saveAgenda} />
        </Card>
      )}

      {section === 'profissionais' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <div className="field"><label className="label">Comissão padrão (%)</label><input type="number" className="input" defaultValue={cfg.profissionais?.defaultCommission ?? 30} onBlur={e => savePro({ defaultCommission: Number(e.target.value) })} /></div>
          <p className="text-sec text-sm">Os horários individuais de cada profissional são configurados em Profissionais → Horários.</p>
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
          {(cfg.documentos?.types || []).length === 0 ? <EmptyState title="Sem tipos de documento" description="Adiciona tipos como Fatura, Recibo, Termo de consentimento…" /> : (
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
  const caixa = (ativo) => ({
    textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
    background: ativo ? 'var(--elevated)' : 'transparent',
    border: `1px solid ${ativo ? 'var(--gold)' : 'var(--border)'}`,
    fontFamily: 'inherit', color: 'inherit', width: '100%',
  });
  return (
    <div>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>De quanto em quanto tempo abrem as horas</h3>
      <p className="text-sec text-sm" style={{ marginTop: -4, marginBottom: 12 }}>
        Vale para a agenda e para as horas que o cliente vê no site.
      </p>

      <div className="flex-col gap-8">
        <button type="button" style={caixa(!encostado)}
          onClick={() => onGuardar({ slotMode: 'grelha' })}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Horas certas</div>
          <div className="text-sec text-sm">
            Sempre as mesmas horas, caiam como caírem os cortes.
          </div>
        </button>

        {!encostado && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '2px 2px 4px 14px' }}>
            {PASSOS_HORA.map(p => (
              <button key={p.v} type="button" onClick={() => onGuardar({ slotMinutes: p.v })}
                style={{ padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: passo === p.v ? 700 : 500,
                  background: passo === p.v ? 'var(--gold)' : 'transparent',
                  color: passo === p.v ? 'var(--on-gold, #1a1a1a)' : 'var(--text-sec)',
                  border: `1px solid ${passo === p.v ? 'var(--gold)' : 'var(--border)'}` }}>
                {p.l}
              </button>
            ))}
          </div>
        )}

        <button type="button" style={caixa(encostado)}
          onClick={() => onGuardar({ slotMode: 'encostado' })}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Encostado, sem buracos</div>
          <div className="text-sec text-sm">
            A hora seguinte começa onde a anterior acabou. Um corte de 45 min às 09:00 abre as 09:45.
          </div>
        </button>
      </div>

      <p className="text-sec text-sm" style={{ marginTop: 12 }}>
        {encostado
          ? 'O dia enche-se de ponta a ponta. Em troca, o cliente vê menos horas à escolha.'
          : passo >= 60
            ? 'Cada cliente ocupa uma hora inteira na agenda, mesmo que o corte demore menos.'
            : `As horas abrem de ${passo} em ${passo} minutos.`}
      </p>
    </div>
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
    <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>Até quando o cliente pode marcar</h3>
      <p className="text-sec text-sm" style={{ marginBottom: 12 }}>
        Quanto do futuro aparece no site, a contar de hoje.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {HORIZONTES.map(h => (
          <button key={h.v} type="button" onClick={() => onGuardar({ horizonDays: h.v })}
            style={{ padding: '8px 15px', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: dias === h.v ? 700 : 500,
              background: dias === h.v ? 'var(--gold)' : 'transparent',
              color: dias === h.v ? 'var(--on-gold, #1a1a1a)' : 'var(--text-sec)',
              border: `1px solid ${dias === h.v ? 'var(--gold)' : 'var(--border)'}` }}>
            {h.l}
          </button>
        ))}
      </div>
      <p className="text-sec text-sm" style={{ marginTop: 12 }}>
        {dias <= 14
          ? 'Duas semanas é pouco para quem marca o corte do mês seguinte.'
          : 'Marcações de pack vão sempre até ao fim da validade do pack, mesmo que passe daqui.'}
      </p>
    </div>
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

  const excecoes = Object.keys(porDia).length;

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>Dias que fogem à regra</h3>
      <p className="text-sec text-sm" style={{ marginBottom: 12 }}>
        Segunda de hora em hora e sábado de 30 em 30, por exemplo. O que ficar em
        «igual» segue o de cima ({rotuloBase}).
      </p>
      <div className="flex-col gap-8" style={{ maxWidth: 360 }}>
        {DIAS_DA_SEMANA.map(d => (
          <div key={d.v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="text-sm" style={{ width: 86, flexShrink: 0,
              color: valorDe(d.v) ? 'var(--text)' : 'var(--text-sec)',
              fontWeight: valorDe(d.v) ? 700 : 500 }}>{d.l}</span>
            <select className="input" style={{ flex: 1 }} value={valorDe(d.v)}
              onChange={e => mudar(d.v, e.target.value)}>
              <option value="">Igual ({rotuloBase})</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
              <option value="encostado">Encostado, sem buracos</option>
            </select>
          </div>
        ))}
      </div>
      {excecoes > 0 && (
        <p className="text-sec text-sm" style={{ marginTop: 12 }}>
          {excecoes === 1 ? 'Um dia foge à regra.' : `${excecoes} dias fogem à regra.`}
          {' '}Os outros seguem {rotuloBase}.
        </p>
      )}
    </div>
  );
}
