import React, { useMemo, useState } from 'react';
import { Scissors, Plus, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Button, EmptyState, Modal } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';
import { uploadBusinessAsset } from '@/lib/designService';
import { ImagePlus, X, Clock, MessageSquare, PlusCircle } from 'lucide-react';

const empty = { name: '', description: '', durationMinutes: 30, price: 15, category: '', isActive: true, isPopular: false, orcamento: false, extra: false, fotoUrl: '' };

/*
 * A FOTO DO SERVICO (09/10/2026).
 *
 * Num salao a cliente escolhe pelo que ve — umas unhas, uma coloracao, um
 * penteado. A foto fica no metadata do servico (fotoUrl), por isso nao foi
 * preciso mudar a base de dados, e aparece no site, na lista de servicos e
 * no passo de escolher o servico da marcacao.
 */
function FotoDoServico({ valor, onMudar }) {
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const escolher = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setAEnviar(true); setErro('');
    try { onMudar(await uploadBusinessAsset(null, f, `servico-${Date.now()}`)); }
    catch (err) { setErro(err.message || 'Não foi possível enviar a foto.'); }
    finally { setAEnviar(false); }
  };
  return (
    <div className="field">
      <label className="label">Foto</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ width: 84, height: 84, borderRadius: 14, border: '1px dashed var(--border)', background: valor ? `center/cover no-repeat url('${valor}')` : 'var(--elevated)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--text-sec)' }}>
          {!valor && (aEnviar ? '…' : <ImagePlus size={22} />)}
          <input type="file" accept="image/*" onChange={escolher} style={{ display: 'none' }} />
        </label>
        {valor && <Button variant="ghost" size="sm" onClick={() => onMudar('')}><X size={14} /> Tirar</Button>}
        {aEnviar && valor && <span className="text-sec text-sm">A enviar…</span>}
      </div>
      {erro && <div className="text-sm" style={{ color: 'var(--error)', marginTop: 6 }}>{erro}</div>}
    </div>
  );
}
const SEM_CATEGORIA = 'Outros';

export default function Services() {
  const data = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Os servicos arrumados pela ordem das categorias do barbeiro. O que nao
  // tiver categoria (ou tiver uma que ja nao existe) cai em "Outros", no fim
  // — e a mesma arrumacao que o cliente ve na marcacao.
  const categorias = data.business?.serviceCategories || [];
  // Fotos dos serviços só nos salões, estúdios e estética (10/10/2026): é
  // onde se escolhe pelo que se vê. Numa barbearia era um campo a mais.
  const comFotos = (data.business?.tipoNegocio || 'barbearia') !== 'barbearia';
  const grupos = useMemo(() => {
    const porNome = new Map(categorias.map(c => [c, []]));
    const outros = [];
    (data.services || []).filter(s => !s.extra).forEach(s => {
      const c = s.category && porNome.has(s.category) ? s.category : null;
      (c ? porNome.get(c) : outros).push(s);
    });
    const lista = [...porNome.entries()].map(([nome, servicos]) => ({ nome, servicos }));
    if (outros.length) lista.push({ nome: SEM_CATEGORIA, servicos: outros });
    return lista.filter(g => g.servicos.length);
  }, [data.services, categorias]);

  /*
   * EXTRAS NUMA LISTA À PARTE (10/10/2026). Continuam a ser serviços — a
   * mesma tabela, a mesma conta — mas vivem na sua secção, com o seu botão.
   * O cartão «Extra» no formulário fica: dá para passar um serviço a extra
   * e vice-versa sem o apagar.
   */
  const extras = (data.services || []).filter(s => s.extra);
  const openNew = (extra = false) => {
    const eExtra = extra === true;
    setForm({ ...empty, extra: eExtra, category: eExtra ? '' : (categorias[0] || ''), price: eExtra ? 3 : empty.price });
    setEditing('new');
  };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s.id); };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (editing === 'new') {
      await dataService.createService(form);
      toast.success(form.extra ? 'Extra criado' : 'Serviço criado');
    } else {
      await dataService.updateService(editing, form);
      toast.success(form.extra ? 'Extra atualizado' : 'Serviço atualizado');
    }
    close();
  };

  const remove = async () => {
    await dataService.deleteService(deleteTarget.id);
    toast.success('Serviço eliminado');
    setDeleteTarget(null);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-24">
        <div className="page-head" data-tour="servicos" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1>Serviços</h1>
            <PageInfo
              description="Catálogo completo de todos os serviços disponíveis: nome, duração, preço, categoria e visibilidade na app do cliente. O preço e a duração de cada serviço determinam a rentabilidade da agenda."
              impact="Um serviço mal precificado ou com duração errada pode ocupar um slot durante 60 minutos a ganhar o que devia ganhar em 30. Os serviços são a base de toda a estrutura financeira do negócio."
              links={['Agenda', 'Marcações', 'Categorias', 'Relatórios', 'Comandas']}
            />
          </div>
          <p>{data.services.length} serviços configurados.</p>
        </div>
        <Button variant="primary" onClick={() => openNew()}><Plus size={16} /> Novo serviço</Button>
      </div>
      <PageInfo page="servicos" />

      {data.services.filter(s => !s.extra).length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Scissors />} title="Sem serviços" action={<Button variant="primary" onClick={() => openNew()}>Criar serviço</Button>} /></Card>
      ) : (
        grupos.map(g => (
        <div key={g.nome} style={{ marginBottom: 26 }} data-tour={g === grupos[0] ? 'servicos-lista' : undefined}>
          <div className="flex items-center gap-8" style={{ marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-sec)', margin: 0 }}>{g.nome}</h2>
            <span className="text-sec text-xs">{g.servicos.length}</span>
          </div>
        <div className="grid-2">
          {g.servicos.map(s => (
            <Card key={s.id} className="card-pad card-hover" onClick={() => openEdit(s)} style={{ cursor: 'pointer' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-8" style={{ minWidth: 0 }}>
                  {comFotos && s.fotoUrl && <span style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `center/cover no-repeat url('${s.fotoUrl}')` }} />}
                  <h3 style={{ fontSize: 18 }}>{s.name}</h3>
                  {s.isPopular && <Badge variant="gold">Popular</Badge>}
                  {!s.isActive && <Badge variant="default">Inativo</Badge>}
                </div>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: s.orcamento ? 15 : 22, color: 'var(--gold-tinta)' }}>
                  {s.orcamento ? 'Sob orçamento' : formatPrice(s.price)}</span>
              </div>
              <p className="text-sec text-sm mt-8 so-pc">{s.description}</p>
              <div className="flex items-center justify-between mt-16 so-pc">
                <div className="flex gap-12 text-sec text-xs">
                  <span>{s.orcamento ? 'tempo a combinar' : s.extra ? 'não ocupa tempo' : `${s.durationMinutes} min`}</span>{s.category ? <><span>·</span><span>{s.category}</span></> : null}
                </div>
                <div className="flex gap-8">
                  <Button size="sm" variant="secondary" aria-label="Editar serviço" title="Editar serviço" onClick={e => { e.stopPropagation(); openEdit(s); }}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" aria-label="Eliminar serviço" title="Eliminar serviço" onClick={e => { e.stopPropagation(); setDeleteTarget(s); }}><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </div>
        ))
      )}

      <div style={{ marginTop: 34 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="flex items-center gap-8">
              <h2 style={{ fontSize: 15, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-sec)', margin: 0 }}>Extras</h2>
              <span className="text-sec text-xs">{extras.length}</span>
            </div>
            <p className="text-sec text-sm" style={{ margin: '4px 0 0' }}>Não ocupam tempo. O cliente junta-os ao marcar.</p>
          </div>
          <Button variant="secondary" onClick={() => openNew(true)}><Plus size={16} /> Novo extra</Button>
        </div>
        {extras.length === 0 ? (
          <Card className="card-pad">
            <p className="text-sec text-sm" style={{ margin: 0, lineHeight: 1.6 }}>
              Ainda não tens extras. Uma lavagem, um pezinho, uma cera — o que se junta a um corte sem ocupar mais tempo.
            </p>
          </Card>
        ) : (
          <div className="grid-2">
            {extras.map(s => (
              <Card key={s.id} className="card-pad card-hover" onClick={() => openEdit(s)} style={{ cursor: 'pointer' }}>
                <div className="flex justify-between items-center" style={{ gap: 12 }}>
                  <div className="flex items-center gap-8" style={{ minWidth: 0 }}>
                    {comFotos && s.fotoUrl && <span style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `center/cover no-repeat url('${s.fotoUrl}')` }} />}
                    <h3 style={{ fontSize: 17 }}>{s.name}</h3>
                    {!s.isActive && <Badge variant="default">Inativo</Badge>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: 'var(--gold-tinta)', whiteSpace: 'nowrap' }}>+{formatPrice(s.price)}</span>
                </div>
                <div className="flex justify-end gap-8 mt-16 so-pc">
                  <Button size="sm" variant="secondary" aria-label="Editar extra" title="Editar extra" onClick={e => { e.stopPropagation(); openEdit(s); }}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" aria-label="Eliminar extra" title="Eliminar extra" onClick={e => { e.stopPropagation(); setDeleteTarget(s); }}><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={close} title={editing === 'new' ? (form.extra ? 'Novo extra' : 'Novo serviço') : (form.extra ? 'Editar extra' : 'Editar serviço')}
        footer={<>{editing && editing !== 'new' && <Button variant="ghost" className="so-telemovel" onClick={() => { const alvo = data.services.find(x => x.id === editing); close(); if (alvo) setDeleteTarget(alvo); }}><Trash2 size={14} /></Button>}<Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label className="label">Descrição</label><textarea className="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        {comFotos && <FotoDoServico valor={form.fotoUrl || ''} onMudar={url => setForm(f => ({ ...f, fotoUrl: url }))} />}
        {/*
          * COMO SE MARCA (10/10/2026). Eram duas caixas pequenas, lado a lado,
          * com um parágrafo cada — não se percebia que eram duas escolhas, nem
          * que não se podem ter as duas. Agora é uma escolha só, em três
          * cartões:
          *   · Normal — o cliente escolhe a hora.
          *   · Sob orçamento — pedido pela Rasta Village: rastas não têm preço
          *     nem tempo antes de se falar. O cliente pede, o barbeiro liga.
          *   · Extra — uma lavagem, um pezinho: não ocupa tempo, soma ao preço
          *     e aparece em «Queres juntar?» ao marcar.
          */}
        <div className="field">
          <label className="label">Como se marca</label>
          <div className="tipo-opcoes" role="radiogroup" aria-label="Como se marca">
            {[
              { v: 'normal', t: 'Normal', d: 'Com hora', I: Clock },
              { v: 'orcamento', t: 'Sob orçamento', d: 'Faz um pedido', I: MessageSquare },
              { v: 'extra', t: 'Extra', d: 'Junta-se a outro', I: PlusCircle },
            ].map(o => {
              const actual = form.orcamento ? 'orcamento' : form.extra ? 'extra' : 'normal';
              return (
                <button key={o.v} type="button" role="radio" aria-checked={actual === o.v}
                  className={`tipo-opcao ${actual === o.v ? 'on' : ''}`}
                  onClick={() => setForm({ ...form, orcamento: o.v === 'orcamento', extra: o.v === 'extra' })}>
                  <o.I size={20} />
                  <span className="tipo-opcao-t">{o.t}</span>
                  <span className="tipo-opcao-d">{o.d}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid-2">
          {!form.orcamento && (<>
            {!form.extra && <div className="field"><label className="label">Duração (min)</label><input className="input" type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })} /></div>}
            <div className="field"><label className="label">Preço (€)</label><input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
          </>)}
        </div>
        {!form.extra && <div className="field">
          <label className="label">Categoria</label>
          {categorias.length === 0 ? (
            <p className="text-sec text-sm" style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
              Ainda não criaste categorias. <Link to="/admin/servicos/categorias" className="text-gold">Cria-as aqui</Link> para arrumares os serviços — o cliente vê-os pela mesma ordem.
            </p>
          ) : (
            <select className="select" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Sem categoria</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>}
        <div className="flex gap-24 mt-16">
          <label className="flex items-center gap-8 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Ativo</label>
          <label className="flex items-center gap-8 text-sm"><input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} /> Popular</label>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar serviço"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Eliminar</Button></>}>
        <p className="text-sec">Eliminar o serviço <span className="text-gold fw-600">{deleteTarget?.name}</span>?</p>
      </Modal>
    </AdminLayout>
  );
}