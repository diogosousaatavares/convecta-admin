import React, { useState } from 'react';
import { Gift, Save, Palette } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const STAMP_ICONS = ['✓','★','✂','⚡','♦','◆','●','✦'];

export default function FidelizacaoPrograma() {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business.config?.loyalty || {};

  const [threshold, setThreshold]   = useState(cfg.stampsThreshold ?? 10);
  const [reward, setReward]         = useState(cfg.rewardName     ?? 'Corte grátis');
  const [validity, setValidity]     = useState(cfg.cardValidity   ?? 6);
  const [cardBg, setCardBg]         = useState(cfg.cardBg         ?? '#1a1a2e');
  const [cardAccent, setCardAccent] = useState(cfg.cardAccent     ?? '#C9A227');
  const [stampIcon, setStampIcon]   = useState(cfg.stampIcon      ?? '✓');
  const [cardTitle, setCardTitle]   = useState(cfg.cardTitle      ?? 'Convecta');

  const save = async () => {
    await dataService.updateConfig('loyalty', {
      stampsThreshold: Number(threshold),
      rewardName: reward,
      cardValidity: Number(validity),
      cardBg,
      cardAccent,
      stampIcon,
      cardTitle,
    });
    toast.success('Programa guardado');
  };

  const slots = Array.from({ length: Number(threshold) || 10 });
  const previewFilled = Math.min(3, slots.length - 1);

  return (
    <AdminPage title="Programa de Fidelização" subtitle="Configuração do programa de carimbos e design do cartão.">
      <Card className="card-pad mb-24" style={{ maxWidth: 560 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>Regras do programa</h3>
        <div className="field">
          <label className="label">Carimbos para recompensa</label>
          <input type="number" className="input" min="1" max="20" value={threshold}
            onChange={e => setThreshold(e.target.value)} style={{ maxWidth: 120 }} />
        </div>
        <div className="field">
          <label className="label">Nome da recompensa</label>
          <input className="input" value={reward}
            onChange={e => setReward(e.target.value)} placeholder="Ex: Corte grátis" />
        </div>
        <div className="field">
          <label className="label">Validade do cartão (meses)</label>
          <input type="number" className="input" min="1" max="24" value={validity}
            onChange={e => setValidity(e.target.value)} style={{ maxWidth: 120 }} />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: 900 }}>
        <Card className="card-pad" style={{ flex: '0 0 320px' }}>
          <div className="flex items-center gap-8 mb-16">
            <Palette size={16} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontSize: 15 }}>Design do cartão</h3>
          </div>
          <div className="field">
            <label className="label">Nome no cartão</label>
            <input className="input" value={cardTitle}
              onChange={e => setCardTitle(e.target.value)} placeholder="Ex: Convecta" />
          </div>
          <div className="field">
            <label className="label">Ícone de carimbo</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {STAMP_ICONS.map(ic => (
                <button key={ic} onClick={() => setStampIcon(ic)}
                  style={{
                    width: 38, height: 38, borderRadius: 8, border: '2px solid',
                    borderColor: stampIcon === ic ? cardAccent : 'var(--border)',
                    background: stampIcon === ic ? cardBg : 'transparent',
                    color: stampIcon === ic ? cardAccent : 'var(--text)',
                    fontSize: 18, cursor: 'pointer', transition: 'all .15s',
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="field" style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Fundo do cartão</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="color" value={cardBg} onChange={e => setCardBg(e.target.value)}
                  style={{ width: 38, height: 38, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                <span className="text-sm text-sec">{cardBg}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Cor de destaque</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="color" value={cardAccent} onChange={e => setCardAccent(e.target.value)}
                  style={{ width: 38, height: 38, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                <span className="text-sm text-sec">{cardAccent}</span>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="text-sec text-sm mb-12" style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11 }}>Pré-visualização</div>
          <div style={{
            background: cardBg,
            borderRadius: 16,
            padding: '20px 20px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,.45)',
            maxWidth: 340,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ color: cardAccent, fontWeight: 700, fontSize: 16, letterSpacing: '.04em' }}>{cardTitle || 'Convecta'}</div>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, marginTop: 2, letterSpacing: '.08em' }}>CARTÃO DE FIDELIDADE</div>
              </div>
              <Gift size={18} style={{ color: cardAccent }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Number(threshold)||10, 5)}, 1fr)`, gap: 6, marginBottom: 12 }}>
              {slots.map((_, i) => {
                const filled = i < previewFilled;
                const isLast = i === slots.length - 1;
                return (
                  <div key={i} style={{
                    aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: filled ? cardAccent : isLast ? 'transparent' : 'rgba(255,255,255,.07)',
                    border: isLast ? `1.5px dashed ${cardAccent}` : filled ? 'none' : '1.5px solid rgba(255,255,255,.12)',
                    color: filled ? cardBg : cardAccent,
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {filled ? stampIcon : isLast ? '★' : ''}
                  </div>
                );
              })}
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.1)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${(previewFilled / (slots.length || 1)) * 100}%`, background: `linear-gradient(90deg, ${cardAccent}, ${cardAccent}cc)`, borderRadius: 2 }} />
            </div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, letterSpacing: '.04em' }}>
              {previewFilled}/{slots.length} · {reward || 'Corte grátis'} · Válido {validity} meses
            </div>
          </div>
        </div>
      </div>

      <div className="mt-24 flex gap-12">
        <Button variant="primary" onClick={save}><Save size={16} /> Guardar programa</Button>
      </div>

      <div className="kpi-grid mt-24" style={{ maxWidth: 560 }}>
        <Card className="kpi">
          <Gift className="icon" size={22} />
          <div className="label">Recompensas conquistadas</div>
          <div className="value gold">{data.customers.reduce((s, c) => s + (c.loyalty?.rewardsEarned || 0), 0)}</div>
        </Card>
        <Card className="kpi">
          <Gift className="icon" size={22} />
          <div className="label">Clientes no programa</div>
          <div className="value gold">{data.customers.filter(c => (c.loyalty?.totalStamps || 0) > 0).length}</div>
        </Card>
      </div>
    </AdminPage>
  );
}