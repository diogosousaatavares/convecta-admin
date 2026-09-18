import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, Info, Tag, Megaphone, ArrowRight } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { Modal, EmptyState, Button, Card } from '@/components/ui';
import AvisoPush from '@/components/AvisoPush';
import authService from '@/lib/authService';

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
  const [exigirEmail, setExigirEmail] = useState(data.business?._settings?.exigirEmailConfirmado === true);

  useEffect(() => {
    const r = data.business?._settings?.reminders || {};
    setLembreteAtivo(r.ativo === true);
    setHorasAntes(Number(r.horasAntes) || 24);
    setExigirEmail(data.business?._settings?.exigirEmailConfirmado === true);
  }, [data.business?._settings?.reminders, data.business?._settings?.exigirEmailConfirmado]);

  const guardarLembretes = async () => {
    setAGuardar(true);
    try {
      await dataService.updateBusiness({
        reminders: { ativo: lembreteAtivo, horasAntes: Math.max(1, Math.min(72, Number(horasAntes) || 24)) },
        exigirEmailConfirmado: exigirEmail,
      });
      toast.success(lembreteAtivo ? 'Lembretes ligados' : 'Lembretes desligados', lembreteAtivo
        ? `Cada cliente é avisado ${horasAntes}h antes — por notificação, ou por email se não tiver notificações.`
        : 'Os clientes deixam de ser avisados antes do corte.');
    } catch (e) {
      toast.error('Não foi possível guardar', e.message);
    } finally { setAGuardar(false); }
  };

  const toggle = async (id) => { await dataService.toggleNotification(id); toast.info('Estado atualizado'); };
  const remove = async (id) => { await dataService.deleteNotification(id); toast.success('Notificação eliminada'); };

  return (
    <AdminLayout>
      <div className="page-head" data-tour="notificacoes">
        <h1>Notificações</h1>
        <p>Cria e gere os avisos enviados aos clientes na aplicação.</p>
      </div>

      {/* O sitio onde se testa se este aparelho recebe, sempre a mao. No
          Dashboard a linha desaparece depois do primeiro teste do dia; aqui
          fica. */}
      <div style={{ marginBottom: 20 }}>
        <AvisoPush businessId={data.business?.id} userId={authService.getCurrentUser()?.id} papel="admin" comTeste sempre />
      </div>

      <Card className="card-pad" style={{ marginBottom: 22, maxWidth: 620 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={lembreteAtivo} onChange={e => setLembreteAtivo(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--gold)', flexShrink: 0 }} />
          <span>
            <span className="fw-600" style={{ display: 'block' }}>Lembrar o cliente antes do corte</span>
            <span className="text-sec text-sm">
              Quem tem notificações ligadas recebe notificação. Quem não tem, mas confirmou o email, recebe email.
              Quem não tem nenhum dos dois fica registado como não avisado — podes ver isso abaixo.
            </span>
          </span>
        </label>

        {lembreteAtivo && (
          <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
            <label className="label" htmlFor="horas-antes">Quantas horas antes</label>
            <input id="horas-antes" type="number" className="input" min="1" max="72" value={horasAntes}
              onChange={e => setHorasAntes(e.target.value)} style={{ maxWidth: 110 }} />
            <div className="text-sec text-xs" style={{ marginTop: 4 }}>
              24 horas é o habitual: dá tempo de desmarcar e ainda se lembra no próprio dia.
            </div>
          </div>
        )}

        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '18px 0' }} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={exigirEmail} onChange={e => setExigirEmail(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: 'var(--gold)', flexShrink: 0 }} />
          <span>
            <span className="fw-600" style={{ display: 'block' }}>Só aceitar marcações de quem confirmou o email</span>
            <span className="text-sec text-sm">
              Quem se regista recebe logo um email com um link e não marca enquanto não clicar.
              Ficas com a certeza de que consegues falar com toda a gente que tem hora marcada.
            </span>
          </span>
        </label>

        {exigirEmail && (
          <div className="text-sec text-xs" style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 8,
            background: 'var(--surface-2, rgba(0,0,0,.04))', lineHeight: 1.6,
          }}>
            <strong>Antes de ligares, pesa isto:</strong> é uma porta fechada no momento
            exacto em que a pessoa decidiu marcar. Uma parte vai ao correio e não volta —
            ainda por cima porque a primeira mensagem costuma cair no spam.
            Tu continuas a poder marcar por qualquer cliente a partir da agenda.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Button variant="primary" onClick={guardarLembretes} disabled={aGuardar}>
            {aGuardar ? 'A guardar…' : 'Guardar'}
          </Button>
        </div>
      </Card>

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