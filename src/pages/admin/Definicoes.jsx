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

      {section === 'agenda' && (
        <Card className="card-pad" style={{ maxWidth: 520 }}>
          <div className="grid-2">
            <div className="field"><label className="label">Duração do slot (min)</label><input type="number" className="input" defaultValue={cfg.agenda?.slotMinutes || 30} onBlur={e => saveAgenda({ slotMinutes: Number(e.target.value) })} /></div>
            <div className="field"><label className="label">Antecedência mínima (h)</label><input type="number" className="input" defaultValue={cfg.agenda?.minAdvanceHours || 2} onBlur={e => saveAgenda({ minAdvanceHours: Number(e.target.value) })} /></div>
          </div>
          <div className="flex-col gap-8 mt-16">
            <label className="flex items-center gap-8 text-sm"><input type="checkbox" defaultChecked={cfg.agenda?.allowWaitlist !== false} onChange={e => saveAgenda({ allowWaitlist: e.target.checked })} /> Permitir lista de espera</label>
            <label className="flex items-center gap-8 text-sm"><input type="checkbox" defaultChecked={cfg.agenda?.allowFitIns !== false} onChange={e => saveAgenda({ allowFitIns: e.target.checked })} /> Permitir encaixes</label>
          </div>
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