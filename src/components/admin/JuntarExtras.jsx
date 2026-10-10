import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';
import dataService from '@/lib/dataService';

/*
 * EXTRAS NUMA MARCAÇÃO QUE JÁ EXISTE (10/10/2026).
 *
 * Os serviços marcados «É um extra» (não ocupam tempo) e os produtos com
 * «Vender na app». O cliente escolhe-os ao marcar ou depois, na app; aqui o
 * barbeiro vê o que ele escolheu e junta ou tira — por exemplo, quando o
 * cliente pede uma lavagem já na cadeira.
 *
 * A conta (preço de cada extra e total da marcação) é feita pela base de
 * dados: ver supabase/UPSELLS_E_FOUNDERS_2026-10-10.sql.
 */
export default function JuntarExtras({ appointment, toast }) {
  const data = useStore();
  const servicos = (data.services || []).filter(s => s.isActive && s.extra);
  const produtos = (data.products || []).filter(p => p.isActive !== false && p.vendaOnline && Number(p.stock) > 0);
  const [aberto, setAberto] = useState(false);
  const [sel, setSel] = useState({});   // id -> qtd
  const [aGravar, setAGravar] = useState(false);

  useEffect(() => {
    const m = {};
    (appointment?.extras || []).forEach(x => { m[x.id] = Number(x.qtd) || 1; });
    setSel(m);
    setAberto(false);
  }, [appointment?.id, appointment?.precoExtras]);

  if (!appointment || (!servicos.length && !produtos.length && !(appointment.extras || []).length)) return null;
  const fechada = appointment.status !== 'pending' && appointment.status !== 'confirmed';

  const mudar = (id, qtd) => setSel(m => {
    const n = { ...m };
    if (qtd > 0) n[id] = qtd; else delete n[id];
    return n;
  });
  const total = servicos.reduce((t, s) => t + (sel[s.id] ? Number(s.price) || 0 : 0), 0)
    + produtos.reduce((t, p) => t + (sel[p.id] ? (Number(p.price) || 0) * sel[p.id] : 0), 0);

  const gravar = async () => {
    setAGravar(true);
    try {
      await dataService.juntarExtras(appointment.id, Object.entries(sel).map(([id, qtd]) => ({ id, qtd })));
      toast?.success?.('Extras guardados');
      setAberto(false);
    } catch (e) {
      toast?.error?.('Não foi possível guardar', e.message);
    } finally { setAGravar(false); }
  };

  const linha = (item, tipo) => {
    const qtd = sel[item.id] || 0;
    return (
      <div key={item.id} className="flex items-center justify-between" style={{ gap: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="text-sm fw-600">{item.name}</span>
          <span className="text-sec text-xs" style={{ display: 'block' }}>
            +{formatPrice(Number(item.price) || 0)}{tipo === 'servico' ? ' · não ocupa tempo' : ' · produto'}
          </span>
        </span>
        {tipo === 'servico' ? (
          <Button size="sm" variant={qtd ? 'primary' : 'secondary'} onClick={() => mudar(item.id, qtd ? 0 : 1)}>
            {qtd ? <><Check size={13} /> Junto</> : <><Plus size={13} /> Juntar</>}
          </Button>
        ) : (
          <span className="flex items-center" style={{ gap: 6 }}>
            <button className="ag-ico-btn" aria-label="Menos" onClick={() => mudar(item.id, qtd - 1)} disabled={!qtd} style={{ width: 28, height: 28 }}><Minus size={13} /></button>
            <span className="fw-600" style={{ minWidth: 16, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{qtd}</span>
            <button className="ag-ico-btn" aria-label="Mais" onClick={() => mudar(item.id, Math.min(qtd + 1, Number(item.stock) || 10))} style={{ width: 28, height: 28 }}><Plus size={13} /></button>
          </span>
        )}
      </div>
    );
  };

  const escolhidos = appointment.extras || [];
  return (
    <>
      <div className="ag-detail-row">
        <span className="l">Extras</span>
        <span className="v" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {escolhidos.length
            ? <span>{escolhidos.map(x => `${x.qtd > 1 ? x.qtd + '× ' : ''}${x.nome}`).join(' · ')} <span className="text-sec">(+{formatPrice(appointment.precoExtras || 0)})</span></span>
            : <span className="text-sec">nenhum</span>}
          {!fechada && !aberto && (servicos.length > 0 || produtos.length > 0) && (
            <Button size="sm" variant="secondary" onClick={() => setAberto(true)}><Plus size={13} /> {escolhidos.length ? 'Mudar' : 'Juntar'}</Button>
          )}
        </span>
      </div>
      {aberto && (
        <div style={{ margin: '6px 0 12px', padding: '4px 12px 10px', borderRadius: 10, background: 'var(--elevated)' }}>
          {servicos.map(s => linha(s, 'servico'))}
          {produtos.map(p => linha(p, 'produto'))}
          <div className="flex items-center justify-between" style={{ marginTop: 10, gap: 10 }}>
            <span className="text-sm">Extras: <b>+{formatPrice(total)}</b></span>
            <span className="flex" style={{ gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Fechar</Button>
              <Button size="sm" variant="primary" onClick={gravar} disabled={aGravar}>{aGravar ? 'A guardar…' : 'Guardar'}</Button>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
