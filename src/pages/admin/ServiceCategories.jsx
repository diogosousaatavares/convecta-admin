import React, { useState } from 'react';
import { Tag, Plus, Trash2, Pencil, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

/*
 * As categorias dos servicos.
 *
 * Antes viviam numa lista em memoria (`typologies`): escrevia-se, aparecia,
 * e ao recarregar a pagina tinha desaparecido. Agora ficam no settings da
 * barbearia — o mesmo sitio de onde o site do cliente as le para arrumar os
 * servicos e desenhar os separadores da marcacao.
 *
 * A ordem aqui e a ordem la. Mudar o nome de uma categoria muda-o tambem em
 * todos os servicos que a usam: senao ficavam orfaos, com um nome que ja
 * ninguem escolhe.
 */
export default function ServiceCategories() {
  const data = useStore();
  const toast = useToast();
  const categorias = data.business?.serviceCategories || [];
  const servicos = data.services || [];

  const [nova, setNova] = useState('');
  const [aEditar, setAEditar] = useState(null);   // índice
  const [nome, setNome] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [apagar, setApagar] = useState(null);

  const contar = c => servicos.filter(s => (s.category || '') === c).length;
  const semCategoria = servicos.filter(s => !s.category || !categorias.includes(s.category));

  const guardar = async (lista) => {
    setOcupado(true);
    try { await dataService.updateBusiness({ serviceCategories: lista }); }
    catch (e) { toast.error('Não foi possível guardar', e.message); throw e; }
    finally { setOcupado(false); }
  };

  const adicionar = async () => {
    const n = nova.trim();
    if (!n) { toast.error('Escreve o nome da categoria'); return; }
    if (categorias.some(c => c.toLowerCase() === n.toLowerCase())) { toast.error('Já existe uma categoria com esse nome'); return; }
    await guardar([...categorias, n]);
    setNova(''); toast.success('Categoria criada', 'Já podes escolhê-la ao criar um serviço.');
  };

  const mover = async (i, d) => {
    const j = i + d;
    if (j < 0 || j >= categorias.length) return;
    const lista = [...categorias];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    await guardar(lista);
  };

  const renomear = async (i) => {
    const n = nome.trim();
    const antigo = categorias[i];
    if (!n) { toast.error('O nome não pode ficar vazio'); return; }
    if (n === antigo) { setAEditar(null); return; }
    if (categorias.some((c, k) => k !== i && c.toLowerCase() === n.toLowerCase())) { toast.error('Já existe uma categoria com esse nome'); return; }
    const lista = categorias.map((c, k) => (k === i ? n : c));
    await guardar(lista);
    // Os serviços que estavam nesta categoria vão com ela.
    const afetados = servicos.filter(s => s.category === antigo);
    for (const s of afetados) {
      try { await dataService.updateService(s.id, { ...s, category: n }); } catch { /* segue */ }
    }
    setAEditar(null);
    toast.success('Categoria renomeada', afetados.length ? `${afetados.length} serviço(s) acompanharam a mudança.` : undefined);
  };

  const confirmarApagar = async () => {
    const c = apagar;
    const lista = categorias.filter(x => x !== c);
    await guardar(lista);
    const afetados = servicos.filter(s => s.category === c);
    for (const s of afetados) {
      try { await dataService.updateService(s.id, { ...s, category: '' }); } catch { /* segue */ }
    }
    setApagar(null);
    toast.info('Categoria removida', afetados.length ? `${afetados.length} serviço(s) ficaram sem categoria — não foram apagados.` : undefined);
  };

  return (
    <AdminPage title="Categorias de serviços" subtitle="Arruma os serviços por categoria. É esta ordem que o cliente vê na marcação.">
      <Card className="card-pad" style={{ maxWidth: 680 }}>
        <div className="flex gap-8 mb-24">
          <input className="input" placeholder="Ex: Cortes, Barbas, Tratamentos…" value={nova} disabled={ocupado}
            onChange={e => setNova(e.target.value)} onKeyDown={e => e.key === 'Enter' && adicionar()} />
          <Button variant="primary" onClick={adicionar} disabled={ocupado}><Plus size={15} /> Adicionar</Button>
        </div>

        {categorias.length === 0 ? (
          <EmptyState icon={() => <Tag />} title="Ainda sem categorias"
            description="Cria a primeira acima — por exemplo «Cortes». Depois, ao criar um serviço, escolhes a categoria dele." />
        ) : (
          <div className="flex-col gap-8">
            {categorias.map((c, i) => (
              <div key={c} className="flex items-center gap-12" style={{ padding: '11px 14px', background: 'var(--elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {aEditar === i ? (
                  <>
                    <input className="input" style={{ flex: 1 }} value={nome} autoFocus disabled={ocupado}
                      onChange={e => setNome(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renomear(i); if (e.key === 'Escape') setAEditar(null); }} />
                    <button className="btn btn-ghost btn-icon" aria-label="Guardar nome" title="Guardar" onClick={() => renomear(i)}><Check size={15} /></button>
                    <button className="btn btn-ghost btn-icon" aria-label="Cancelar" title="Cancelar" onClick={() => setAEditar(null)}><X size={15} /></button>
                  </>
                ) : (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--gold)', flexShrink: 0 }} />
                    <span className="flex-1 text-sm fw-600">{c}</span>
                    <span className="text-sec text-xs" style={{ whiteSpace: 'nowrap' }}>{contar(c)} serviço{contar(c) === 1 ? '' : 's'}</span>
                    <button className="btn btn-ghost btn-icon" aria-label="Subir" title="Subir" disabled={i === 0 || ocupado} onClick={() => mover(i, -1)}><ArrowUp size={15} /></button>
                    <button className="btn btn-ghost btn-icon" aria-label="Descer" title="Descer" disabled={i === categorias.length - 1 || ocupado} onClick={() => mover(i, 1)}><ArrowDown size={15} /></button>
                    <button className="btn btn-ghost btn-icon" aria-label={`Renomear ${c}`} title="Renomear" onClick={() => { setAEditar(i); setNome(c); }}><Pencil size={15} /></button>
                    <button className="btn btn-ghost btn-icon" aria-label={`Eliminar ${c}`} title="Eliminar" onClick={() => setApagar(c)}><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {semCategoria.length > 0 && (
          <p className="text-sec text-sm" style={{ marginTop: 18, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>{semCategoria.length} serviço{semCategoria.length === 1 ? '' : 's'} sem categoria.</strong>{' '}
            Aparece{semCategoria.length === 1 ? '' : 'm'} ao cliente no fim da lista, em «Outros». Podes arrumá-{semCategoria.length === 1 ? 'lo' : 'los'} em Serviços.
          </p>
        )}
      </Card>

      {apagar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setApagar(null)}>
          <Card className="card-pad" style={{ maxWidth: 420 }}>
            <h3 style={{ fontSize: 17, marginBottom: 10 }}>Eliminar «{apagar}»?</h3>
            <p className="text-sec text-sm" style={{ marginBottom: 18, lineHeight: 1.6 }}>
              {contar(apagar) > 0
                ? `Os ${contar(apagar)} serviços desta categoria não são apagados — ficam sem categoria e continuam à venda.`
                : 'Não há serviços nesta categoria.'}
            </p>
            <div className="flex gap-8">
              <Button variant="ghost" onClick={() => setApagar(null)}>Cancelar</Button>
              <Button variant="primary" onClick={confirmarApagar} disabled={ocupado}>Eliminar</Button>
            </div>
          </Card>
        </div>
      )}
    </AdminPage>
  );
}
