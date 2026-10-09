import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import SeparadoresDaFamilia from '@/components/admin/SeparadoresDaFamilia';
import { TIPOS, LISTA_TIPOS } from '@/lib/nicho';

export default function Settings() {
  const data = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ ...data.business });

  const save = async () => {
    await dataService.updateBusiness(form);
    toast.success('Definições guardadas');
  };

  return (
    <AdminLayout>
      <SeparadoresDaFamilia />
      <div className="page-head">
        <h1>Definições gerais</h1>
      </div>
      <PageInfo page="definicoesNegocio" />

      <Card className="card-pad mb-24">
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>Identidade</h3>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label className="label">Tipo de negócio</label><select className="select" value={form.tipoNegocio || 'barbearia'} onChange={e => setForm({ ...form, tipoNegocio: e.target.value })}>{LISTA_TIPOS.map(t => <option key={t} value={t}>{TIPOS[t].nome}</option>)}</select></div>
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

      {/*
        Aqui estava "Ferramentas de desenvolvimento — Restaurar dados demo":
        um botao que apagava TODAS as marcacoes, clientes e alteracoes da
        barbearia, sem guarda nenhuma. Qualquer barbeiro lhe chegava em dois
        cliques, na conta real dele, e o aviso dizia-lhe apenas "nao usar em
        ambiente de producao" — que e precisamente onde ele estava.

        Encontrado a 28/09/2026, no dia em que a primeira barbearia comecou a
        receber marcacoes a serio. Nao volta ao painel do barbeiro: uma
        ferramenta destas, se for precisa, vive no super admin.
      */}
    </AdminLayout>
  );
}