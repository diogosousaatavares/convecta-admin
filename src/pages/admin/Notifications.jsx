import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, Info, Tag, Megaphone, ArrowRight } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import Toggle from '@/components/admin/Toggle';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { Modal, EmptyState, Button, Card } from '@/components/ui';
import AvisoPush from '@/components/AvisoPush';
import authService from '@/lib/authService';
import { n as nicho } from '@/lib/nicho';
import { useConfirmar } from '@/components/ui/Confirmar';

const TYPE_META = {
  info: { label: 'Informação', icon: Info, cls: '' },
  promo: { label: 'Promoção', icon: Tag, cls: 'promo' },
  update: { label: 'Novidade', icon: Megaphone, cls: 'update' }
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const data = useStore();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });
  const [saving, setSaving] = useState(false);

  const notifications = [...(data.notifications || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const activeCount = notifications.filter(n => n.active).length;

  const openNew = () => { setForm({ title: '', message: '', type: 'info' }); setModalOpen(true); };

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Campos obrigatórios', 'Preenche o título e a mensagem.'); return; }
    setSaving(true);
    const n = await dataService.createNotification({ title: form.title.trim(), message: form.message.trim(), type: form.type });
    setSaving(false);
    /* O push sai a seguir ao aviso. Dizer quantos telemoveis tocaram importa:
       «enviadas: 0» quer dizer que ninguem tem as notificacoes ligadas, e isso
       e uma coisa a resolver, nao um sucesso. */
    setTimeout(() => {
      if (n?.pushErro) toast.error('O aviso ficou criado, mas não tocou nenhum telemóvel', n.pushErro);
      else if (n?.push && n.push.enviadas === 0) {
        toast.error('O aviso ficou criado, mas não tocou nenhum telemóvel',
          'Nenhum cliente tem as notificações ligadas na app.');
      } else if (n?.push?.enviadas > 0) {
        toast.success(`Avisados ${n.push.enviadas} ${n.push.enviadas === 1 ? 'cliente' : 'clientes'}`);
      }
    }, 1500);
    setModalOpen(false);
    toast.success('Notificação criada', 'Está visível para os clientes.');
  };

  /*
   * LEMBRETES ANTES DO CORTE
   *
   * Ligado, o servidor avisa cada cliente umas horas antes: por notificacao
   * a quem a tem (nao custa nada), por email a quem confirmou o email
   * (custa cens de cens). Quem nao tem nem uma coisa nem outra fica
   * registado como "sem canal" — para o barbeiro saber, em vez de julgar
   * que toda a gente foi avisada.
   */
  const lembretes = data.business?._settings?.reminders || {};
  const [lembreteAtivo, setLembreteAtivo] = useState(lembretes.ativo === true);
  const [horasAntes, setHorasAntes] = useState(Number(lembretes.horasAntes) || 24);
  const [aGuardar, setAGuardar] = useState(false);
  /*
   * Exigir o email confirmado antes de deixar marcar.
   *
   * Nasce desligado, e deve mesmo nascer desligado: fecha a porta no minuto
   * exacto em que a pessoa decidiu marcar, e uma parte dela nao volta do
   * correio. Quem liga isto esta a trocar marcacoes por certeza de contacto
   * — e uma escolha legitima, mas tem de ser feita de olhos abertos.
   */

  useEffect(() => {
    const r = data.business?._settings?.reminders || {};
    setLembreteAtivo(r.ativo === true);
    setHorasAntes(Number(r.horasAntes) || 24);
  }, [data.business?._settings?.reminders, data.business?._settings?.exigirEmailConfirmado]);

  const guardarLembretes = async () => {
    setAGuardar(true);
    try {
      await dataService.updateBusiness({
        reminders: { ativo: lembreteAtivo, horasAntes: Math.max(1, Math.min(72, Number(horasAntes) || 24)) },
        exigirEmailConfirmado: false,
      });
      toast.success(lembreteAtivo ? 'Lembretes ligados' : 'Lembretes desligados', lembreteAtivo
        ? `Cada cliente é avisado ${horasAntes}h antes — por notificação, ou por email se não tiver notificações.`
        : 'Os clientes deixam de ser avisados antes da marcação.');
    } catch (e) {
      toast.error('Não foi possível guardar', e.message);
    } finally { setAGuardar(false); }
  };

  const toggle = async (id) => { await dataService.toggleNotification(id); toast.info('Estado atualizado'); };
  const [pedir, Confirmacao] = useConfirmar();
  const remove = (id) => pedir({
    titulo: 'Eliminar esta notificação?', texto: 'Sai da lista e deixa de aparecer na app dos clientes.', botao: 'Eliminar',
    aoConfirmar: async () => {
      try { await dataService.deleteNotification(id); toast.success('Notificação eliminada'); }
      catch (e) { toast.error('Não foi possível eliminar', e.message); }
    },
  });
  // Um profissional com acesso só liga as notificações do telemóvel dele:
  // mandar avisos a todos os clientes e mudar os lembretes é do dono.
  const dono = !data.isProfissional;

  // Ligar/desligar o lembrete e mudar as horas grava logo: sem botão Guardar.
  const mudarLembrete = async (ativo, horas) => {
    setLembreteAtivo(ativo); setHorasAntes(horas);
    try {
      await dataService.updateBusiness({ reminders: { ativo, horasAntes: Math.max(1, Math.min(72, Number(horas) || 24)) }, exigirEmailConfirmado: false });
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
  };

  /*
   * Sem blocos brancos (15/10/2026): a página é uma lista de linhas com um
   * separador entre elas, como as Definições. O estado das notificações
   * deste aparelho, o lembrete, e por baixo o que já foi enviado.
   */
  return (
    <AdminPage title="Notificações" actions={dono ? <Button variant="primary" onClick={openNew}><Plus size={16} /> Nova notificação</Button> : null}>
      <Confirmacao />
      <div data-tour="notificacoes" />
      <div className="nt-lista" data-tour="notificacoes-aviso">
        <AvisoPush businessId={data.business?.id} userId={authService.getCurrentUser()?.id} papel="admin" comTeste sempre />
        {dono && <div className="nt-row">
          <span className="nt-txt"><b>Lembrar o cliente antes da marcação</b></span>
          <Toggle checked={lembreteAtivo} onChange={x => mudarLembrete(x, horasAntes)} />
        </div>}
        {dono && lembreteAtivo && (
          <div className="nt-row">
            <span className="nt-txt"><b>Quantas horas antes</b></span>
            <input type="number" className="input" min="1" max="72" value={horasAntes} style={{ width: 90, textAlign: 'right' }}
              onChange={e => setHorasAntes(e.target.value)} onBlur={e => mudarLembrete(true, e.target.value)} />
          </div>
        )}
      </div>

      {dono && <div className="nt-titulo">Enviadas</div>}
      {!dono ? null : notifications.length === 0 ? (
        <EmptyState icon={() => <Bell size={40} />} title="Ainda não enviaste nenhuma" />
      ) : (
        <div className="nt-lista">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            const Icon = meta.icon;
            return (
              <div key={n.id} className="nt-row nt-envio" style={{ opacity: n.active ? 1 : 0.55 }}>
                <span className="notif-ico"><Icon size={18} /></span>
                <span className="nt-txt">
                  <b>{n.title}</b>
                  <span>{n.message}</span>
                  <span className="nt-data">{formatDate(n.createdAt)} · {meta.label}{n.active ? '' : ' · desativada'}</span>
                </span>
                <span className="nt-acoes">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(n.id)}>{n.active ? 'Desativar' : 'Ativar'}</button>
                  <button type="button" className="btn btn-ghost btn-icon" aria-label="Eliminar" onClick={() => remove(n.id)}><Trash2 size={16} /></button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova notificação"
        footer={<>
          <Button size="sm" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button size="sm" variant="primary" onClick={save} disabled={saving}>
            {saving ? 'A guardar…' : 'Publicar'} <ArrowRight size={14} />
          </Button>
        </>}
      >
        <div className="field">
          <label className="label">Tipo</label>
          <div className="chip-row" style={{ marginBottom: 0 }}>
            {Object.entries(TYPE_META).map(([key, m]) => (
              <button key={key} type="button" className={`chip ${form.type === key ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, type: key }))}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label">Título</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex.: Promoção de verão" maxLength={80} />
        </div>
        <div className="field">
          <label className="label">Mensagem</label>
          <textarea className="textarea" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Escreve a mensagem que os clientes vão ver…" maxLength={400} />
        </div>
      </Modal>
    </AdminPage>
  );
}