import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, Badge, Button, EmptyState, Modal, Stars } from '@/components/ui';
import dataService, { uploadProfessionalPhoto } from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import FotoPerfil from '@/components/admin/FotoPerfil';
import AcessoProfissional, { useAcessos } from '@/components/admin/AcessoProfissional';

const empty = { name: '', role: 'Barber', bio: '', specialties: [], commission: 30 };

// 'profissional' -> 'Profissional'. O nome do plano vem da base de dados em
// minusculas; aqui e um rotulo que o barbeiro le.
const nomeDoPlano = p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : '');

export default function Professionals() {
  const data = useStore();
  // As avaliacoes de um barbeiro: quantas sao e a media delas.
  const avaliacoesDe = (proId) => {
    const lista = (data.reviews || []).filter(r => r.professionalId === proId);
    if (!lista.length) return { total: 0, media: 0 };
    return { total: lista.length, media: lista.reduce((s, r) => s + (Number(r.rating) || 0), 0) / lista.length };
  };
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const acessos = useAcessos(data.business?.id);
  const [form, setForm] = useState(empty);
  const [specs, setSpecs] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Quantos lugares o plano da e quantos ja estao ocupados. Le-se a cada
  // render porque a lista muda debaixo dos pes (criar, apagar, desativar).
  const lugares = dataService.lugaresDeProfissionais();

  const openNew = () => { setForm(empty); setSpecs(''); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p, commission: p.commission ?? 30 }); setSpecs((p.specialties || []).join(', ')); setEditing(p.id); };
  const close = () => setEditing(null);
  const [aEnviarFoto, setAEnviarFoto] = useState(false);

  // Recebe a foto já cortada em quadrado (FotoPerfil) e envia-a.
  const handlePhotoChange = async (file) => {
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
    try {
      if (editing === 'new') { await dataService.createProfessional(payload); toast.success('Profissional criado'); }
      else { await dataService.updateProfessional(editing, payload); toast.success('Profissional atualizado'); }
    } catch (err) {
      // Sem isto, o limite do plano rebentava em silêncio e a janela fechava
      // como se tivesse gravado.
      toast.error('Não foi possível guardar', err.message);
      return;
    }
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
          <p>
            {lugares.limite == null
              ? <>{data.professionals.length} {data.professionals.length === 1 ? 'profissional' : 'profissionais'}.</>
              : <>{lugares.ativos} de {lugares.limite} {lugares.limite === 1 ? 'lugar' : 'lugares'} do plano{lugares.plano ? ` ${nomeDoPlano(lugares.plano)}` : ''}.</>}
          </p>
        </div>
        <Button variant="primary" onClick={openNew} disabled={lugares.cheio}
          title={lugares.cheio ? 'Chegaste ao limite de profissionais do teu plano' : undefined}>
          <Plus size={16} /> Novo profissional
        </Button>
      </div>

      {(lugares.cheio || lugares.acima) && (
        <Card className="card-pad mb-24" style={{ borderColor: 'var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Lock size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--gold)' }} />
            <div>
              <div className="fw-600">
                {lugares.acima
                  ? `Tens ${lugares.ativos} profissionais ativos e o plano dá para ${lugares.limite}.`
                  : `Estás no limite do plano: ${lugares.limite} ${lugares.limite === 1 ? 'profissional' : 'profissionais'}.`}
              </div>
              <p className="text-sec text-sm mt-8" style={{ margin: '8px 0 0' }}>
                {lugares.acima
                  ? 'Ninguém foi desativado — a equipa que já tinhas continua a trabalhar. Só não dá para acrescentar mais sem mudar de plano.'
                  : 'Para acrescentar outro, desativa um profissional que já não trabalhe contigo ou muda de plano.'}
                {' '}Falamos pelo «Apoio ao cliente», no menu do lado.
              </p>
            </div>
          </div>
        </Card>
      )}

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
                {/* Estrelas a serio: media das avaliacoes deste barbeiro. Antes vinha
                    de duas colunas que ninguem escrevia — dizia sempre "0 · 0". */}
                <Stars rating={avaliacoesDe(p.id).media} size={13} />
                <span className="text-sec text-xs">
                  {avaliacoesDe(p.id).total > 0
                    ? `${avaliacoesDe(p.id).media.toFixed(1)} · ${avaliacoesDe(p.id).total} ${avaliacoesDe(p.id).total === 1 ? 'avaliação' : 'avaliações'}`
                    : 'Ainda sem avaliações'}
                </span>
              </div>
              {p.specialties?.length > 0 && (
                <div className="flex gap-8 flex-wrap mt-16">
                  {p.specialties.map((s, i) => <Badge key={i} variant="default">{s}</Badge>)}
                </div>
              )}
              <AcessoProfissional profissional={p} acesso={acessos.de(p.id)} onMudou={acessos.recarregar} />
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
          <FotoPerfil valor={form.photoUrl} nome={form.name} aEnviar={aEnviarFoto} onEscolher={handlePhotoChange} />
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