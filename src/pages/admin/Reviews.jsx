import React, { useState, useMemo } from 'react';
import { Star, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Avatar, Button, EmptyState, Stars, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDate } from '@/lib/format';

export default function Reviews() {
  const data = useStore();
  const toast = useToast();
  const [proFilter, setProFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [delId, setDelId] = useState(null);
  const [aberta, setAberta] = useState(null);

  const reviews = useMemo(() => {
    return [...data.reviews]
      .filter(r => proFilter === 'all' || r.professionalId === proFilter)
      .filter(r => ratingFilter === 'all' || String(r.rating) === ratingFilter)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [data.reviews, proFilter, ratingFilter]);

  const porLer = useMemo(() => data.reviews.filter(r => !r.isVisible), [data.reviews]);
  const avg = data.reviews.length ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length) : 0;
  const dist = [5,4,3,2,1].map(stars => data.reviews.filter(r => r.rating === stars).length);

  const toggleVisible = async (r) => {
    try {
      await dataService.updateReview(r.id, { isVisible: !r.isVisible });
      toast.info(r.isVisible ? 'Avaliação marcada por ler' : 'Avaliação arquivada');
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
  };
  const remove = async () => {
    try { await dataService.deleteReview(delId); toast.info('Avaliação eliminada'); }
    catch (e) { toast.error('Não foi possível eliminar', e.message); }
    setDelId(null);
  };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Avaliações</h1>
      </div>

      <div className="kpi-grid">
        <Card className="kpi"><Star className="icon" size={22} /><div className="label">Avaliação média</div><div className="value gold">{avg.toFixed(1).replace('.', ',')}</div></Card>
        <Card className="kpi"><MessageSquare className="icon" size={22} /><div className="label">Total avaliações</div><div className="value">{data.reviews.length}</div></Card>
        <Card className="kpi"><Eye className="icon" size={22} /><div className="label">Por ler</div><div className="value" style={{ color: porLer.length ? 'var(--warning)' : 'inherit' }}>{porLer.length}</div></Card>
      </div>

      <Card className="card-pad mb-24">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Distribuição</h3>
        <div className="flex-col gap-8">
          {dist.map((count, i) => {
            const stars = 5 - i;
            const pct = data.reviews.length ? (count / data.reviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-12">
                <span className="text-sm" style={{ width: 44 }}>{stars}★</span>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)' }} />
                </div>
                <span className="text-sec text-xs" style={{ width: 30, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex gap-12 mb-16" style={{ flexWrap: 'wrap' }}>
          <select className="select" style={{ maxWidth: 200 }} value={proFilter} onChange={e => setProFilter(e.target.value)}>
            <option value="all">Todos os profissionais</option>
            {data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select" style={{ maxWidth: 160 }} value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
            <option value="all">Todas as estrelas</option>
            <option value="5">5★</option><option value="4">4★</option><option value="3">3★</option><option value="2">2★</option><option value="1">1★</option>
          </select>
        </div>

        {reviews.length === 0 ? (
          <EmptyState icon={() => <Star />} title="Sem avaliações" />
        ) : (
          <div className="av-lista">
            {reviews.map(r => {
              const cust = data.customers.find(c => c.id === r.customerId);
              return (
                <button type="button" key={r.id} className="av-linha" onClick={() => setAberta(r)}>
                  <Avatar name={cust?.name} />
                  <span className="av-nome">{cust?.name || 'Cliente'}</span>
                  <Stars rating={r.rating} size={15} />
                  {!r.isVisible && <i className="av-ponto" aria-label="Por ler" />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* A linha so diz quem e quantas estrelas. O resto — o comentario, o
          barbeiro, a data, arquivar e apagar — esta aqui, ao tocar. */}
      {aberta && (() => {
        const r = data.reviews.find(x => x.id === aberta.id) || aberta;
        const cust = data.customers.find(c => c.id === r.customerId);
        const pro = data.professionals.find(p => p.id === r.professionalId);
        return (
          <Modal open onClose={() => setAberta(null)} title="">
            <div className="av-ficha">
              <Avatar name={cust?.name} size="lg" />
              <div className="av-ficha-nome">{cust?.name || 'Cliente'}</div>
              <Stars rating={r.rating} size={22} />
              <div className="av-ficha-meta">{pro?.name || '—'} · {formatDate(r.date || (r.createdAt || '').slice(0, 10))}</div>
              {r.comment ? <p className="av-ficha-texto">«{r.comment}»</p> : <p className="av-ficha-texto" style={{ fontStyle: 'italic', color: 'var(--text-ter)' }}>Só estrelas.</p>}
              <div className="av-ficha-botoes">
                <Button variant="secondary" onClick={() => toggleVisible(r)}>{r.isVisible ? <><EyeOff size={15} /> Marcar por ler</> : <><Eye size={15} /> Arquivar</>}</Button>
                <Button variant="ghost" onClick={() => { setAberta(null); setDelId(r.id); }}><Trash2 size={15} /> Eliminar</Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {delId && (
        <div className="modal-overlay" onClick={() => setDelId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3 style={{ fontSize: 18 }}>Eliminar avaliação</h3><button className="btn btn-ghost btn-icon" aria-label="Fechar" title="Fechar" onClick={() => setDelId(null)}>✕</button></div>
            <div className="modal-body"><p className="text-sec">Confirmas a eliminação desta avaliação?</p></div>
            <div className="modal-foot"><Button variant="secondary" onClick={() => setDelId(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Eliminar</Button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const CSS_AV = `
.av-lista { display: flex; flex-direction: column; }
.av-linha {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 8px 4px;
  border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); text-align: left; cursor: pointer;
}
.av-linha:last-child { border-bottom: 0; }
.av-nome { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.av-ponto { width: 9px; height: 9px; border-radius: 999px; background: var(--warning); flex-shrink: 0; }
.av-ficha { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 6px 0 2px; }
.av-ficha-nome { font-size: 20px; font-weight: 700; }
.av-ficha-meta { font-size: 13.5px; color: var(--text-sec); }
.av-ficha-texto { font-size: 16px; line-height: 1.5; margin: 10px 0 6px; }
.av-ficha-botoes { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('css-av')) {
  const st = document.createElement('style'); st.id = 'css-av'; st.textContent = CSS_AV; document.head.appendChild(st);
}

