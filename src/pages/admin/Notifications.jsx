import React, { useState } from 'react';
import { Bell, Plus, Trash2, Send, Info, Tag, Megaphone, ArrowRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { Modal, EmptyState, Button } from '@/components/ui';

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
    await dataService.createNotification({ title: form.title.trim(), message: form.message.trim(), type: form.type });
    setSaving(false);
    setModalOpen(false);
    toast.success('Notificação criada', 'Está visível para os clientes.');
  };

  const toggle = async (id) => { await dataService.toggleNotification(id); toast.info('Estado atualizado'); };
  const remove = async (id) => { await dataService.deleteNotification(id); toast.success('Notificação eliminada'); };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Notificações</h1>
        <p>Cria e gere os avisos enviados aos clientes na aplicação.</p>
      </div>

      <div className="flex items-center gap-16 mb-24" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="notif-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="notif-ico" style={{ width: 36, height: 36 }}><Bell size={17} /></div>
          <div>
            <div className="text-xs" style={{ color: '#7A746A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: '#fff' }}>{notifications.length}</div>
          </div>
        </div>
        <div className="notif-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="notif-ico" style={{ width: 36, height: 36 }}><Send size={17} /></div>
          <div>
            <div className="text-xs" style={{ color: '#7A746A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ativas</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{activeCount}</div>
          </div>
        </div>
        <Button variant="primary" onClick={openNew} style={{ marginLeft: 'auto' }}>
          <Plus size={16} /> Nova notificação <ArrowRight size={15} />
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={() => <Bell size={40} />} title="Sem notificações" description="Cria o primeiro aviso para os teus clientes." />
      ) : (
        <div className="flex-col gap-12">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            const Icon = meta.icon;
            return (
              <div key={n.id} className={`notif-card ${n.active ? 'unread' : ''}`} style={{ opacity: n.active ? 1 : 0.6 }}>
                <div className="flex items-center gap-12">
                  <div className="notif-ico"><Icon size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
                      <span className="notif-title">{n.title}</span>
                      <span className={`notif-badge ${meta.cls}`}>{meta.label}</span>
                      <span className={`notif-badge ${n.active ? '' : ''}`} style={n.active ? { background: 'rgba(34,197,94,0.12)', color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)' } : { background: 'rgba(255,255,255,0.05)', color: '#7A746A', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {n.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="notif-msg">{n.message}</p>
                    <div className="notif-date">{formatDate(n.createdAt)}</div>
                  </div>
                </div>
                <div className="flex gap-8" style={{ marginTop: 14, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="secondary" onClick={() => toggle(n.id)}>
                    {n.active ? 'Desativar' : 'Ativar'} <ArrowRight size={14} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(n.id)}>
                    <Trash2 size={14} /> Eliminar
                  </Button>
                </div>
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
        <p className="text-xs text-sec">A notificação fica visível de imediato para todos os clientes na aplicação.</p>
      </Modal>
    </AdminLayout>
  );
}