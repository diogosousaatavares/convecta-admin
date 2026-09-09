import React, { useState } from 'react';
import { UserCog, Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, Badge, Button, EmptyState, Modal, Stars } from '@/components/ui';
import dataService, { uploadProfessionalPhoto } from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const empty = { name: '', role: 'Barber', bio: '', specialties: [], commission: 30 };

export default function Professionals() {
  const data = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [specs, setSpecs] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openNew = () => { setForm(empty); setSpecs(''); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p, commission: p.commission ?? 30 }); setSpecs((p.specialties || []).join(', ')); setEditing(p.id); };
  const close = () => setEditing(null);
  const [aEnviarFoto, setAEnviarFoto] = useState(false);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    // Pré-visualização imediata enquanto a foto sobe, para não parecer parado.
    const previa = URL.createObjectURL(file);
    setForm(current => ({ ...current, photoUrl: previa }));
    setAEnviarFoto(true);
    try {
      // Um profissional ainda por criar não tem id: usa-se um temporário, e o
      // ficheiro fica com esse nome. Só muda o nome, não a foto.
      const id = editing && editing !== 'new' ? editing : 'novo-' + Date.now();
      const url = await uploadProfessionalPhoto(id, file);
      setForm(current => ({ ...current, photoUrl: url }));
    } catch (err) {
      setForm(current => ({ ...current, photoUrl: '' }));
      toast.error('Não foi possível enviar a fotografia', err.message);
    } finally {
      setAEnviarFoto(false);
      URL.revokeObjectURL(previa);
    }
  };

  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (aEnviarFoto) { toast.error('A fotografia ainda está a subir', 'Espera um instante e grava outra vez.'); return; }
    const payload = { ...form, specialties: specs.split(',').map(s => s.trim()).filter(Boolean) };
    if (editing === 'new') { await dataService.createProfessional(payload); toast.success('Profissional criado'); }
    else { await dataService.updateProfessional(editing, payload); toast.success('Profissional atualizado'); }
    close();
  };

  const remove = async () => { await dataService.deleteProfessional(deleteTarget.id); toast.success('Eliminado'); setDeleteTarget(null); };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-24" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="page-head" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1>Profissionais</h1>
            <PageInfo
              description="Gestão completa da equipa: dados pessoais, especialidades, comissões, fotografia e avaliações atribuídas pelos clientes. O perfil de cada profissional determina o que aparece na app do cliente para marcação."
              impact="A equipa é o principal ativo de uma barbearia. A qualidade, disponibilidade e motivação dos profissionais determina diretamente a capacidade de receita, a retenção de clientes e a reputação do negócio."
              links={['Agenda', 'Horários', 'Comissões', 'Desempenho', 'Serviços']}
            />
          </div>
          <p>{data.professionals.length} {data.professionals.length === 1 ? 'profissional' : 'profissionais'}.</p>
        </div>
        <Button variant="primary" onClick={openNew}><Plus size={16} /> Novo profissional</Button>
      </div>

      {data.professionals.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <UserCog />} title="Sem profissionais" description="Adiciona o primeiro profissional." /></Card>
      ) : (
        <div className="grid-3">
          {data.professionals.map(p => (
            <Card key={p.id} className="card-pad card-hover">
              <div className="flex items-center gap-12">
                {p.photoUrl ? <img className="professional-photo" src={p.photoUrl} alt={`Fotografia de ${p.name}`} /> : <Avatar name={p.name} size="lg" />}
                <div className="flex-1">
                  <h3 style={{ fontSize: 18 }}>{p.name}</h3>
                  <div className="text-gold text-sm">{p.role}</div>
                </div>
              </div>
              <p className="text-sec text-sm mt-16">{p.bio}</p>
              <div className="flex items-center gap-8 mt-16">
                <Stars rating={p.rating} size={13} /> <span className="text-sec text-xs">{p.rating} · {p.reviewCount} avaliações</span>
              </div>
              {p.specialties?.length > 0 && (
                <div className="flex gap-8 flex-wrap mt-16">
                  {p.specialties.map((s, i) => <Badge key={i} variant="default">{s}</Badge>)}
                </div>
              )}
              <div className="flex gap-8 mt-16">
                  <Button size="sm" variant="secondary" block onClick={() => openEdit(p)}><Pencil size={14} /> Editar</Button>
                  <Button size="sm" variant="ghost" aria-label="Eliminar profissional" title="Eliminar profissional" onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={close} title={editing === 'new' ? 'Novo profissional' : 'Editar profissional'}
        footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}>
        <div className="field">
          <label className="label">Fotografia</label>
          <div className="professional-photo-upload">
            {form.photoUrl ? <img className="professional-photo-preview" src={form.photoUrl} alt="Pré-visualização do profissional" /> : <Avatar name={form.name || 'Profissional'} size="lg" />}
            <input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
          </div>
        </div>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label className="label">Cargo</label><input className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
        <div className="field"><label className="label">Bio</label><textarea className="textarea" rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
        <div className="field"><label className="label">Comissão (%)</label><input className="input" type="number" min="0" max="100" step="1" value={form.commission ?? 30} onChange={e => setForm({ ...form, commission: Number(e.target.value) || 0 })} /></div>
        <div className="field"><label className="label">Especialidades (separadas por vírgulas)</label><input className="input" value={specs} onChange={e => setSpecs(e.target.value)} placeholder="Fades, Barba" /></div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar profissional"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Eliminar</Button></>}>
        <p className="text-sec">Eliminar <span className="text-gold fw-600">{deleteTarget?.name}</span>?</p>
      </Modal>
    </AdminLayout>
  );
}