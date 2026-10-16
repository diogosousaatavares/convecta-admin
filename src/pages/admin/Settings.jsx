import React, { useState } from 'react';
import { Save, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import SeparadoresDaFamilia from '@/components/admin/SeparadoresDaFamilia';
import { TIPOS, LISTA_TIPOS, LISTA_TIPOS_TODOS } from '@/lib/nicho';

export default function Settings() {
  const data = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ ...data.business });

  // Só vão para a base de dados os campos DESTA página. Antes ia o negócio
  // inteiro, tal como estava quando a página abriu — e o Guardar repunha o
  // logotipo, as cores do site, o horário, os packs e a confirmação
  // automática que entretanto tinham sido mudados noutro lado.
  const CAMPOS = ['name', 'tipoNegocio', 'lados', 'tagline', 'description', 'address', 'phone', 'email'];
  const save = async () => {
    const mudou = {};
    for (const k of CAMPOS) if (form[k] !== data.business?.[k]) mudou[k] = form[k];
    if (!Object.keys(mudou).length) { toast.success('Nada para guardar'); return; }
    try {
      await dataService.updateBusiness(mudou);
      toast.success('Definições guardadas');
    } catch (e) {
      toast.error(e?.message || 'Não foi possível guardar. Tenta outra vez.');
    }
  };
  // «Dois tipos no mesmo espaço» é o segundo tipo pago (Subscrição). Aqui só
  // aparece a quem já o tinha de antes, para não se ligar sem pagar.
  const tiposDaLista = LISTA_TIPOS_TODOS.filter(t => t !== 'misto' || data.business?.tipoNegocio === 'misto');

  return (
    <AdminLayout>
      <SeparadoresDaFamilia />
      <div className="page-head">
        <div className="h1-com-ajuda"><h1>Definições</h1><PageInfo /></div>
      </div>

      {/* Os donos procuravam o logotipo e as cores aqui. Vivem em «O meu
          site»: fica o caminho à vista, no sítio onde o procuram. */}
      <Link to="/admin/o-meu-site" className="nt-row mb-24" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12, alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Globe size={18} /> <b>Logotipo, cores e fotos da tua app</b></span>
        <ChevronRight size={18} />
      </Link>

      <Card className="card-pad mb-24">
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>Identidade</h3>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label className="label">Tipo de negócio</label><select className="select" value={form.tipoNegocio || 'barbearia'} onChange={e => setForm({ ...form, tipoNegocio: e.target.value })}>{tiposDaLista.map(t => <option key={t} value={t}>{TIPOS[t].nome}</option>)}</select></div>
        {form.tipoNegocio === 'misto' && (
          <div className="field">
            <label className="label">Os dois lados do espaço</label>
            <div className="lado-opcoes">
              {LISTA_TIPOS.map(t => {
                const on = (form.lados || []).includes(t);
                return <button key={t} type="button" aria-pressed={on} onClick={() => setForm(f => {
                  const atual = f.lados || [];
                  if (on) return { ...f, lados: atual.filter(x => x !== t) };
                  // São dois: o terceiro entra no lugar do mais antigo.
                  return { ...f, lados: [...atual, t].slice(-2) };
                })}>{TIPOS[t].curto}</button>;
              })}
            </div>
            <p className="text-sec text-sm mt-8">Cada serviço e cada profissional diz de que lado é. No topo do painel escolhes o lado que estás a gerir.</p>
          </div>
        )}
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