import React, { useState, useMemo } from 'react';
import { Star, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Badge, Avatar, Button, EmptyState, Stars } from '@/components/ui';
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

  const reviews = useMemo(() => {
    return [...data.reviews]
      .filter(r => proFilter === 'all' || r.professionalId === proFilter)
      .filter(r => ratingFilter === 'all' || String(r.rating) === ratingFilter)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [data.reviews, proFilter, ratingFilter]);

  const avg = data.reviews.length ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length) : 0;
  const dist = [5,4,3,2,1].map(stars => data.reviews.filter(r => r.rating === stars).length);

  const toggleVisible = async (r) => { await dataService.updateReview(r.id, { isVisible: !r.isVisible }); toast.info(r.isVisible ? 'Avaliação oculta' : 'Avaliação publicada'); };
  const remove = async () => { await dataService.deleteReview(delId); toast.info('Avaliação eliminada'); setDelId(null); };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Avaliações</h1>
        <p>Modera as avaliações dos clientes</p>
      </div>

      <div className="kpi-grid">
        <Card className="kpi"><Star className="icon" size={22} /><div className="label">Avaliação média</div><div className="value gold">{avg.toFixed(1)}</div></Card>
        <Card className="kpi"><MessageSquare className="icon" size={22} /><div className="label">Total avaliações</div><div className="value">{data.reviews.length}</div></Card>
        <Card className="kpi"><Eye className="icon" size={22} /><div className="label">Publicadas</div><div className="value">{data.reviews.filter(r => r.isVisible).length}</div></Card>
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
          <EmptyState icon={() => <Star />} title="Sem avaliações" description="Ainda não há avaliações com estes filtros." />
        ) : (
          <div className="flex-col gap-12">
            {reviews.map(r => {
              const cust = data.customers.find(c => c.id === r.customerId);
              const pro = data.professionals.find(p => p.id === r.professionalId);
              return (
                <div key={r.id} className="flex items-start gap-12" style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={cust?.name} />
                  <div className="flex-1">
                    <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
                      <span className="fw-600 text-sm">{cust?.name || 'Cliente'}</span>
                      <Stars rating={r.rating} size={14} />
                      <Badge variant="default">{pro?.name || '—'}</Badge>
                      {!r.isVisible && <Badge variant="warning">Oculta</Badge>}
                    </div>
                    <p className="text-sec text-sm mt-8">{r.comment}</p>
                    <span className="text-sec text-xs">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-icon" aria-label={r.isVisible ? 'Ocultar avaliação' : 'Publicar avaliação'} onClick={() => toggleVisible(r)} title={r.isVisible ? 'Ocultar avaliação' : 'Publicar avaliação'}>
                      {r.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="btn btn-ghost btn-icon" aria-label="Eliminar avaliação" onClick={() => setDelId(r.id)} title="Eliminar avaliação"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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