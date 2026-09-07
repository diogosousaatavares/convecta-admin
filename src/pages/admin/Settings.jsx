import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, Modal } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

export default function Settings() {
  const data = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ ...data.business });
  const [resetOpen, setResetOpen] = useState(false);

  const save = async () => {
    await dataService.updateBusiness(form);
    toast.success('Definições guardadas');
  };

  const reset = async () => {
    await dataService.resetData();
    toast.success('Dados restaurados', 'Os dados demo foram repostos.');
    setResetOpen(false);
  };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Definições gerais</h1>
        <p>Informação do negócio e dados da barbearia.</p>
      </div>
      <PageInfo page="definicoesNegocio" />

      <Card className="card-pad mb-24">
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>Identidade</h3>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label className="label">Tagline</label><input className="input" value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} /></div>
        <div className="field"><label className="label">Descrição</label><textarea className="textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </Card>

      <Card className="card-pad mb-24">
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>Contacto</h3>
        <div className="field"><label className="label">Morada</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Telefone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="field"><label className="label">Email</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        </div>
      </Card>

      <div className="flex gap-12">
        <Button variant="primary" onClick={save}><Save size={16} /> Guardar</Button>
      </div>

      <Card className="card-pad mt-32" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-sec)' }}>Ferramentas de desenvolvimento</h3>
        <p className="text-sec text-sm mb-16">Ações avançadas e destrutivas. Não usar em ambiente de produção.</p>
        <Button variant="danger" onClick={() => setResetOpen(true)}><RotateCcw size={16} /> Restaurar dados demo</Button>
      </Card>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Restaurar dados demo"
        footer={<><Button variant="ghost" onClick={() => setResetOpen(false)}>Cancelar</Button><Button variant="danger" onClick={reset}>Restaurar</Button></>}>
        <p className="text-sec">Isto vai apagar todas as marcações, clientes e alterações, restaurando os dados iniciais. Continuar?</p>
      </Modal>
    </AdminLayout>
  );
}