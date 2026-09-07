import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, Badge, EmptyState, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import dataService from '@/lib/dataService';

const QTYPES = [
  { key: 'short', label: 'Texto curto' },
  { key: 'long', label: 'Texto longo' },
  { key: 'yesno', label: 'Sim / Não' },
  { key: 'choice', label: 'Múltipla escolha' },
  { key: 'rating', label: 'Classificação (1–5)' },
];

function newQuestion() {
  return { id: crypto.randomUUID(), type: 'short', label: '', required: false, options: [] };
}

function FormBuilder({ form, onChange }) {
  const addQ = () => onChange({ ...form, questions: [...(form.questions || []), newQuestion()] });
  const updateQ = (id, patch) => onChange({ ...form, questions: form.questions.map(q => q.id === id ? { ...q, ...patch } : q) });
  const removeQ = (id) => onChange({ ...form, questions: form.questions.filter(q => q.id !== id) });
  const addOption = (qid) => {
    const q = form.questions.find(item => item.id === qid);
    updateQ(qid, { options: [...(q.options || []), ''] });
  };
  const updateOption = (qid, idx, val) => {
    const q = form.questions.find(item => item.id === qid);
    const options = [...(q.options || [])];
    options[idx] = val;
    updateQ(qid, { options });
  };
  const removeOption = (qid, idx) => {
    const q = form.questions.find(item => item.id === qid);
    updateQ(qid, { options: (q.options || []).filter((_, i) => i !== idx) });
  };

  return (
    <div>
      <div className="field">
        <label className="label" htmlFor="anamnese-form-name">Nome do formulário</label>
        <input id="anamnese-form-name" className="input" placeholder="Ex: Anamnese capilar, Consentimento informado..." value={form.name || ''} onChange={e => onChange({ ...form, name: e.target.value })} />
      </div>
      <div className="mb-8 mt-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label" style={{ margin: 0 }}>Perguntas</span>
        <Button size="sm" variant="secondary" onClick={addQ}><Plus size={13} /> Adicionar pergunta</Button>
      </div>
      {(!form.questions || form.questions.length === 0) && <div className="text-sec text-sm" style={{ padding: '16px 0', textAlign: 'center' }}>Ainda não há perguntas. Clica em "Adicionar pergunta".</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(form.questions || []).map((q, idx) => (
          <div key={q.id} style={{ padding: '12px 14px', background: 'var(--elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-8 mb-10">
              <span className="text-sec" style={{ fontSize: 11, minWidth: 20 }}>{idx + 1}.</span>
              <input className="input" style={{ flex: 1 }} placeholder="Texto da pergunta..." value={q.label} onChange={e => updateQ(q.id, { label: e.target.value })} />
              <select className="select" style={{ width: 160 }} value={q.type} onChange={e => updateQ(q.id, { type: e.target.value })}>
                {QTYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <label className="flex items-center gap-4 text-xs" style={{ whiteSpace: 'nowrap' }}><input type="checkbox" checked={q.required} onChange={e => updateQ(q.id, { required: e.target.checked })} /> Obrigatória</label>
              <button onClick={() => removeQ(q.id)} aria-label="Remover pergunta" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', padding: 4 }}><X size={14} /></button>
            </div>
            {q.type === 'choice' && (
              <div style={{ paddingLeft: 28 }}>
                {(q.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-8 mb-6">
                    <input className="input" style={{ flex: 1 }} placeholder={`Opção ${i + 1}`} value={opt} onChange={e => updateOption(q.id, i, e.target.value)} />
                    <button onClick={() => removeOption(q.id, i)} aria-label={`Remover opção ${i + 1}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', display: 'flex' }}><X size={12} /></button>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => addOption(q.id)} style={{ fontSize: 12, marginTop: 2 }}><Plus size={12} /> Adicionar opção</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnamneseForms() {
  const toast = useToast();
  const [forms, setForms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => setForms((await dataService.getForms()) || []);
  useEffect(() => { load(); }, []);
  const openNew = () => { setEditForm({ id: crypto.randomUUID(), name: '', questions: [], active: true }); setModalOpen(true); };
  const openEdit = form => { setEditForm({ ...form, questions: (form.questions || []).map(q => ({ ...q })) }); setModalOpen(true); };
  const save = async () => {
    if (!editForm.name.trim()) { toast.error('Nome obrigatório', 'Dá um nome ao formulário.'); return; }
    setSaving(true);
    await dataService.saveForm(editForm);
    await load();
    setSaving(false);
    setModalOpen(false);
    toast.success('Formulário guardado');
  };
  const toggleActive = async form => { await dataService.saveForm({ ...form, active: !form.active }); await load(); };
  const remove = async id => {
    if (!window.confirm('Eliminar este formulário?')) return;
    await dataService.deleteForm(id);
    await load();
    toast.info('Formulário eliminado');
  };

  return (
    <AdminPage title="Anamnese / Formulários" subtitle="Cria e gere os formulários enviados aos clientes antes ou durante a visita." actions={<Button variant="primary" onClick={openNew}><Plus size={16} /> Novo Formulário</Button>}>
      {forms.length === 0 ? <EmptyState title="Sem formulários" description="Cria o primeiro formulário de anamnese para recolher informações dos clientes." action={<Button variant="primary" onClick={openNew}><Plus size={15} /> Novo Formulário</Button>} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {forms.map(form => (
            <Card key={form.id} className="card-pad" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}><div className="fw-600" style={{ marginBottom: 2 }}>{form.name}</div><div className="text-sec text-sm">{(form.questions || []).length} pergunta{(form.questions || []).length !== 1 ? 's' : ''} · {QTYPES.filter(t => (form.questions || []).some(q => q.type === t.key)).map(t => t.label).join(', ') || '—'}</div></div>
              <Badge variant={form.active ? 'success' : 'default'}>{form.active ? 'Ativo' : 'Inativo'}</Badge>
              <button onClick={() => toggleActive(form)} aria-label={form.active ? 'Desativar formulário' : 'Ativar formulário'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.active ? 'var(--gold)' : 'var(--text-sec)', display: 'flex' }}>{form.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}</button>
              <Button size="sm" variant="secondary" onClick={() => openEdit(form)}>Editar</Button>
              <button onClick={() => remove(form.id)} aria-label="Eliminar formulário" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', padding: 4 }}><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editForm?.questions?.length === 0 && !editForm?.name ? 'Novo Formulário' : `Editar: ${editForm?.name || 'Formulário'}`}>
        {editForm && <div><FormBuilder form={editForm} onChange={setEditForm} /><div className="ag-detail-actions" style={{ justifyContent: 'flex-end', marginTop: 20 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={save} disabled={saving}>{saving ? 'A guardar...' : 'Guardar formulário'}</Button></div></div>}
      </Modal>
    </AdminPage>
  );
}
