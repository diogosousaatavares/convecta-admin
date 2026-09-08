import React, { useState } from 'react';
import { Calendar, Bell, UserCog, Wallet, Gift, Users, Palette, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const TABS = [
  { key: 'agendamentos', label: 'Agendamentos', icon: Calendar },
  { key: 'notificacoes', label: 'Notificações', icon: Bell },
  { key: 'profissionais', label: 'Profissionais', icon: UserCog },
  { key: 'financeiro', label: 'Financeiro / Caixa', icon: Wallet },
  { key: 'fidelidade', label: 'Fidelidade', icon: Gift },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'aparencia', label: 'Aparência', icon: Palette },
  { key: 'outros', label: 'Outros', icon: Globe },
];

function Toggle({ checked, onChange }) {
  return <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
    <div style={{ position: 'relative', width: 40, height: 22 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: checked ? 'var(--gold)' : 'var(--border)', transition: 'background 0.2s' }} />
      <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </div>
  </label>;
}

function Row({ label, desc, children }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
    <div style={{ flex: 1 }}><div className="fw-600 text-sm">{label}</div>{desc && <div className="text-sec" style={{ fontSize: 12, marginTop: 2 }}>{desc}</div>}</div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>;
}

function NumInput({ value, onChange, min = 0, max, step = 1 }) {
  return <input type="number" className="input" style={{ width: 90, textAlign: 'right' }} value={value ?? ''} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} />;
}
function TextInput({ value, onChange, placeholder, style }) {
  return <input className="input" style={{ width: 180, ...style }} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />;
}
function Sel({ value, onChange, options }) {
  return <select className="select" style={{ width: 180 }} value={value ?? ''} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}

export default function Parametros() {
  const data = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('agendamentos');
  const cfg = data.business.config || {};
  const p = cfg.params || {};
  const save = async updates => { await dataService.updateConfig('params', { ...p, ...updates }); toast.success('Parâmetro guardado'); };
  const v = (key, def) => p[key] ?? def;
  const row = (label, desc, children) => <Row label={label} desc={desc}>{children}</Row>;

  return <AdminPage title="Configuração de Parâmetros" subtitle="Parâmetros globais do sistema. As alterações aplicam-se imediatamente.">
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24 }}>{TABS.map(t => { const Icon = t.icon; return <button key={t.key} onClick={() => setTab(t.key)} className={`ag-side-btn ${tab === t.key ? 'active' : ''}`} style={{ fontSize: 13 }}><Icon size={14} /> {t.label}</button>; })}</div>
    <Card className="card-pad" style={{ maxWidth: 720 }}>
      {tab === 'agendamentos' && <>
        {row('Duração padrão do slot','Intervalo mínimo entre horários disponíveis.',<NumInput value={v('slotMinutes',30)} min={15} max={120} step={15} onChange={x => save({ slotMinutes:x })} />)}
        {row('Antecedência mínima','Horas mínimas para marcação online.',<NumInput value={v('minAdvanceHours',2)} min={0} max={72} onChange={x => save({ minAdvanceHours:x })} />)}
        {row('Antecedência máxima','Dias máximos no futuro para marcações.',<NumInput value={v('maxAdvanceDays',60)} min={1} max={365} onChange={x => save({ maxAdvanceDays:x })} />)}
        {row('Marcações online','Permitir marcações pelo site ou app.',<Toggle checked={v('allowOnlineBooking',true)} onChange={x => save({ allowOnlineBooking:x })} />)}
        {row('Confirmação automática','Confirmar sem aprovação manual.',<Toggle checked={v('autoConfirm',false)} onChange={x => save({ autoConfirm:x })} />)}
        {row('Expiração de pendentes (horas)','Cancelar pendentes após este período.',<NumInput value={v('pendingExpiryHours',24)} min={1} max={168} onChange={x => save({ pendingExpiryHours:x })} />)}
        {row('Máx. marcações por cliente/dia','Limite diário por cliente.',<NumInput value={v('maxPerClientPerDay',2)} min={1} max={10} onChange={x => save({ maxPerClientPerDay:x })} />)}
        {row('Permitir lista de espera','Permitir entrada em lista de espera.',<Toggle checked={v('allowWaitlist',true)} onChange={x => save({ allowWaitlist:x })} />)}
        {row('Permitir encaixes','Aceitar marcações fora do horário normal.',<Toggle checked={v('allowFitIns',true)} onChange={x => save({ allowFitIns:x })} />)}
        {row('Cancelamento pelo cliente','Permitir cancelamento pelo cliente.',<Toggle checked={v('allowClientCancel',true)} onChange={x => save({ allowClientCancel:x })} />)}
        {row('Prazo mínimo de cancelamento (h)','Antecedência mínima para cancelar.',<NumInput value={v('cancelMinHours',2)} min={0} max={72} onChange={x => save({ cancelMinHours:x })} />)}
        {row('Prefixo de referência','Prefixo das referências de marcação.',<TextInput value={v('bookingRefPrefix','BC')} onChange={x => save({ bookingRefPrefix:x })} style={{ width:90 }} />)}
      </>}
      {tab === 'notificacoes' && <>
        <div className="fw-600 text-sm" style={{ color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: .8, paddingBottom: 4, marginBottom: 4 }}>Canais ativos</div>
        {row('Email','Enviar notificações por email.',<Toggle checked={v('channelEmail',true)} onChange={x => save({ channelEmail:x })} />)}
        {row('SMS','Enviar por SMS (requer integração com operador).',<Toggle checked={v('channelSms',false)} onChange={x => save({ channelSms:x })} />)}
        {row('WhatsApp','Enviar por WhatsApp (requer integração).',<Toggle checked={v('channelWhatsapp',false)} onChange={x => save({ channelWhatsapp:x })} />)}
        {row('Push (browser)','Notificações push no browser do cliente.',<Toggle checked={v('channelPush',true)} onChange={x => save({ channelPush:x })} />)}
        <div className="fw-600 text-sm" style={{ color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: .8, paddingBottom: 4, marginBottom: 4, marginTop: 20 }}>Notificações para o cliente</div>
        {row('Confirmação de marcação','Notificar quando a marcação é confirmada.',<Toggle checked={v('emailConfirmation',true)} onChange={x => save({ emailConfirmation:x })} />)}
        {row('Lembrete 24h antes','Enviar lembrete 24 horas antes da marcação.',<Toggle checked={v('reminder24h',true)} onChange={x => save({ reminder24h:x })} />)}
        {row('Lembrete 1h antes','Enviar lembrete 1 hora antes da marcação.',<Toggle checked={v('reminder1h',false)} onChange={x => save({ reminder1h:x })} />)}
        {row('Cancelamento de marcação','Notificar cliente quando a marcação é cancelada.',<Toggle checked={v('notifyClientCancel',true)} onChange={x => save({ notifyClientCancel:x })} />)}
        {row('Pontos de fidelidade','Notificar quando o cliente ganha pontos ou recompensa.',<Toggle checked={v('notifyLoyalty',false)} onChange={x => save({ notifyLoyalty:x })} />)}
        {row('Promoções e ofertas','Enviar campanhas promocionais ao cliente.',<Toggle checked={v('notifyPromos',false)} onChange={x => save({ notifyPromos:x })} />)}
        <div className="fw-600 text-sm" style={{ color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: .8, paddingBottom: 4, marginBottom: 4, marginTop: 20 }}>Notificações para o admin</div>
        {row('Nova marcação','Notificação quando um cliente faz uma marcação.',<Toggle checked={v('notifyAdminNewBooking',true)} onChange={x => save({ notifyAdminNewBooking:x })} />)}
        {row('Cancelamento pelo cliente','Notificar quando um cliente cancela.',<Toggle checked={v('notifyAdminCancel',true)} onChange={x => save({ notifyAdminCancel:x })} />)}
        {row('Entrada em lista de espera','Notificar quando alguém entra na lista de espera.',<Toggle checked={v('notifyAdminWaitlist',false)} onChange={x => save({ notifyAdminWaitlist:x })} />)}
        <div className="fw-600 text-sm" style={{ color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: .8, paddingBottom: 4, marginBottom: 4, marginTop: 20 }}>Alertas de caixa</div>
        {row('Alerta caixa não aberta (min)','Minutos após abertura esperada para alertar.',<NumInput value={v('cashOpenAlertMin',30)} min={5} max={120} step={5} onChange={x => save({ cashOpenAlertMin:x })} />)}
        {row('Alerta caixa não fechada (min)','Minutos após fecho esperado para alertar.',<NumInput value={v('cashCloseAlertMin',30)} min={5} max={120} step={5} onChange={x => save({ cashCloseAlertMin:x })} />)}
        {row('Intervalo de spam de fecho (min)','Repetir alerta de caixa a cada X minutos.',<NumInput value={v('cashCloseSpamIntervalMin',10)} min={1} max={60} onChange={x => save({ cashCloseSpamIntervalMin:x })} />)}
      </>}
      {tab === 'profissionais' && <>
        {row('Ver agenda dos colegas','Consultar agenda de outros profissionais.',<Toggle checked={v('proSeeOthersAgenda',false)} onChange={x => save({ proSeeOthersAgenda:x })} />)}
        {row('Criar encaixes','Criar encaixes na agenda.',<Toggle checked={v('proCreateFitIns',true)} onChange={x => save({ proCreateFitIns:x })} />)}
        {row('Cancelar marcações','Cancelar marcações atribuídas.',<Toggle checked={v('proCancelBookings',false)} onChange={x => save({ proCancelBookings:x })} />)}
        {row('Fazer checkout','Processar pagamentos.',<Toggle checked={v('proCheckout',true)} onChange={x => save({ proCheckout:x })} />)}
        {row('Ver relatórios','Aceder aos relatórios de desempenho.',<Toggle checked={v('proViewReports',true)} onChange={x => save({ proViewReports:x })} />)}
        {row('Editar próprio perfil','Alterar dados do próprio perfil.',<Toggle checked={v('proEditProfile',true)} onChange={x => save({ proEditProfile:x })} />)}
        {row('Bloquear horários','Bloquear os próprios horários.',<Toggle checked={v('proBlockSlots',true)} onChange={x => save({ proBlockSlots:x })} />)}
      </>}
      {tab === 'financeiro' && <>
        {row('Comissão padrão (%)','Percentagem por defeito dos profissionais.',<NumInput value={v('defaultCommission',30)} min={0} max={100} onChange={x => save({ defaultCommission:x })} />)}
        {row('Comissão sobre valor líquido','Calcular comissão após descontos.',<Toggle checked={v('commissionOnNet',false)} onChange={x => save({ commissionOnNet:x })} />)}
        {row('Gorjeta incluída na comissão','Incluir gorjetas na comissão.',<Toggle checked={v('tipInCommission',false)} onChange={x => save({ tipInCommission:x })} />)}
        {row('Caixa obrigatória (dinheiro)','Bloquear dinheiro sem caixa aberta.',<Toggle checked={v('cashRequired',true)} onChange={x => save({ cashRequired:x })} />)}
        {row('Permitir gorjetas','Mostrar gorjeta no checkout.',<Toggle checked={v('tipEnabled',true)} onChange={x => save({ tipEnabled:x })} />)}
        {row('IVA padrão (%)','Taxa de IVA dos serviços.',<NumInput value={v('defaultVat',23)} min={0} max={100} onChange={x => save({ defaultVat:x })} />)}
        {row('Moeda','Moeda dos valores da aplicação.',<Sel value={v('currency','EUR')} onChange={x => save({ currency:x })} options={[{value:'EUR',label:'€ Euro (EUR)'},{value:'USD',label:'$ Dólar (USD)'},{value:'GBP',label:'£ Libra (GBP)'},{value:'BRL',label:'R$ Real (BRL)'}]} />)}
        {row('Métodos de pagamento aceites','Métodos separados por vírgula.',<TextInput value={v('paymentMethods','Dinheiro,Cartão,MB WAY')} onChange={x => save({ paymentMethods:x })} style={{ width:260 }} />)}
      </>}
      {tab === 'fidelidade' && <>
        {row('Ativar programa de fidelidade','Mostrar cartão de fidelidade.',<Toggle checked={v('loyaltyEnabled',true)} onChange={x => save({ loyaltyEnabled:x })} />)}
        {row('Selos para recompensa','Visitas necessárias para recompensa.',<NumInput value={v('loyaltyStamps',10)} min={1} max={50} onChange={x => save({ loyaltyStamps:x })} />)}
        {row('Selos por visita','Selos ganhos por visita.',<NumInput value={v('stampsPerVisit',1)} min={1} max={5} onChange={x => save({ stampsPerVisit:x })} />)}
        {row('Nome da recompensa','Nome exibido ao cliente.',<TextInput value={v('loyaltyRewardName','Corte Grátis')} onChange={x => save({ loyaltyRewardName:x })} />)}
        {row('Validade do cartão (meses)','0 = sem expiração.',<NumInput value={v('loyaltyValidityMonths',12)} min={0} max={60} onChange={x => save({ loyaltyValidityMonths:x })} />)}
        {row('Selos expiram com o cartão','Perder selos quando expira.',<Toggle checked={v('loyaltyStampsExpire',false)} onChange={x => save({ loyaltyStampsExpire:x })} />)}
      </>}
      {tab === 'clientes' && <>
        {row('Telefone obrigatório','Exigir telefone no registo.',<Toggle checked={v('requirePhone',false)} onChange={x => save({ requirePhone:x })} />)}
        {row('Data de nascimento obrigatória','Exigir data de nascimento.',<Toggle checked={v('requireBirthDate',false)} onChange={x => save({ requireBirthDate:x })} />)}
        {row('Registo sem email','Permitir clientes sem email.',<Toggle checked={v('allowNoEmail',false)} onChange={x => save({ allowNoEmail:x })} />)}
        {row('Email de boas-vindas','Enviar email ao registar.',<Toggle checked={v('welcomeEmail',true)} onChange={x => save({ welcomeEmail:x })} />)}
        {row('Clientes veem histórico','Mostrar histórico aos clientes.',<Toggle checked={v('clientSeeHistory',true)} onChange={x => save({ clientSeeHistory:x })} />)}
        {row('Ativar anamnese','Pedir anamnese antes da visita.',<Toggle checked={v('anamneseEnabled',false)} onChange={x => save({ anamneseEnabled:x })} />)}
        {row('Anos de retenção de dados','Retenção de clientes inativos.',<NumInput value={v('dataRetentionYears',5)} min={1} max={20} onChange={x => save({ dataRetentionYears:x })} />)}
      </>}
      {tab === 'aparencia' && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <div className="fw-600" style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Tema e Personalização</div>
          <div className="text-sec text-sm" style={{ marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Personaliza as cores do painel com presets, color pickers individuais e uma pré-visualização ao vivo do dashboard.
          </div>
          <Button variant="primary" onClick={() => navigate('/admin/definicoes/tema')}>
            <Palette size={16} /> Abrir personalizador de tema
          </Button>
        </div>
      )}
      {tab === 'outros' && <>
        {row('Fuso horário','Fuso para horários e notificações.',<Sel value={v('timezone','Europe/Lisbon')} onChange={x => save({ timezone:x })} options={[{value:'Europe/Lisbon',label:'Lisboa (UTC+0/+1)'},{value:'Europe/London',label:'Londres (UTC+0/+1)'},{value:'Europe/Paris',label:'Paris (UTC+1/+2)'},{value:'America/Sao_Paulo',label:'São Paulo (UTC-3)'},{value:'America/New_York',label:'Nova Iorque (UTC-5/-4)'}]} />)}
        {row('Formato de data','Como as datas são apresentadas.',<Sel value={v('dateFormat','DD/MM/YYYY')} onChange={x => save({ dateFormat:x })} options={[{value:'DD/MM/YYYY',label:'DD/MM/AAAA'},{value:'MM/DD/YYYY',label:'MM/DD/AAAA'},{value:'YYYY-MM-DD',label:'AAAA-MM-DD'}]} />)}
        {row('Idioma padrão','Idioma da interface e emails.',<Sel value={v('language','pt')} onChange={x => save({ language:x })} options={[{value:'pt',label:'Português'},{value:'en',label:'English'},{value:'es',label:'Español'},{value:'fr',label:'Français'}]} />)}
        {row('Modo de manutenção','Desativar marcações temporariamente.',<Toggle checked={v('maintenanceMode',false)} onChange={x => save({ maintenanceMode:x })} />)}
        {row('Mensagem de manutenção','Mensagem mostrada durante manutenção.',<TextInput value={v('maintenanceMsg','Estamos em manutenção. Voltamos em breve!')} onChange={x => save({ maintenanceMsg:x })} style={{ width:280 }} />)}
        {row('Versão da aplicação','Versão atual (apenas leitura).',<span className="text-sec text-sm fw-600">1.0.0</span>)}
      </>}
    </Card>
  </AdminPage>;
}
