import React, { useEffect, useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Button } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const DEFAULT_CONFIG = {
  enabled: true,
  title: 'Cartão Fidelidade',
  totalStamps: 10,
  reward: 'Corte grátis',
  stampEmoji: '✂️',
  bgColor: '#1A1208',
  cardColor: '#C9A84C',
  stampFilledColor: '#C9A84C',
  stampEmptyColor: 'rgba(255,255,255,0.08)',
  textColor: '#FFFFFF'
};

function LoyaltyStampCard({ config, currentStamps = 4 }) {
  const total = Math.max(3, Math.min(20, Number(config.totalStamps) || 10));
  const stamps = Array.from({ length: total });
  const progress = Math.min(currentStamps, total) / total * 100;
  return (
    <div style={{ background: config.bgColor, border: `1px solid ${config.cardColor}4D`, borderRadius: 16, padding: 24, maxWidth: 360, color: config.textColor, boxShadow: `0 8px 26px ${config.cardColor}26` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, marginBottom: 20 }}>
        <span>{config.title}</span><span style={{ color: config.cardColor, fontSize: 13 }}>{currentStamps} / {total}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 44px)', gap: 10, justifyContent: 'center' }}>
        {stamps.map((_, index) => {
          const filled = index < currentStamps;
          const isLast = index === total - 1;
          return <div key={index} style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: filled ? config.stampFilledColor : config.stampEmptyColor, border: filled ? 'none' : `1px dashed ${config.stampFilledColor}40`, color: filled ? config.bgColor : config.stampFilledColor, fontSize: filled ? 19 : isLast ? 9 : 16, fontWeight: 700, boxShadow: filled ? `0 3px 10px ${config.stampFilledColor}66` : 'none' }}>{isLast ? (filled ? '👑' : 'GRÁTIS') : filled ? config.stampEmoji : ''}</div>;
        })}
      </div>
      <div style={{ marginTop: 20, fontSize: 13, opacity: 0.85 }}>Recompensa: {config.reward}</div>
      <div style={{ height: 5, marginTop: 18, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: config.cardColor, borderRadius: 99 }} /></div>
    </div>
  );
}

export default function LoyaltyCard() {
  const toast = useToast();
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    setConfig(dataService.getLoyaltyCardConfig());
  }, []);

  const update = (key, value) => setConfig(current => ({ ...current, [key]: value }));
  const save = async () => {
    const saved = await dataService.saveLoyaltyCardConfig(config);
    setConfig(saved);
    toast.success('Cartão guardado', 'As alterações já estão disponíveis para os clientes.');
  };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Cartão de Visitas</h1>
        <p>Personaliza o cartão de fidelidade por visitas dos teus clientes.</p>
      </div>
      <div className="grid-2 loyalty-card-editor">
        <Card className="card-pad">
          <h3 style={{ fontSize: 18, marginBottom: 20 }}>Configuração</h3>
          <div className="loyalty-toggle-row"><div><div className="fw-600 text-sm">Cartão ativo</div><div className="text-sec text-xs">Mostra o cartão na área do cliente.</div></div><input type="checkbox" checked={config.enabled} onChange={event => update('enabled', event.target.checked)} /></div>
          <div className="field"><label className="label">Título do cartão</label><input className="input" value={config.title} onChange={event => update('title', event.target.value)} /></div>
          <div className="field"><label className="label">Nº de carimbos para recompensa</label><input className="input" type="number" min="3" max="20" value={config.totalStamps} onChange={event => update('totalStamps', event.target.value)} /></div>
          <div className="field"><label className="label">Descrição da recompensa</label><input className="input" value={config.reward} onChange={event => update('reward', event.target.value)} /></div>
          <div className="field"><label className="label">Emoji do carimbo</label><input className="input" value={config.stampEmoji} maxLength={4} onChange={event => update('stampEmoji', event.target.value)} /></div>
          <div className="loyalty-color-grid">
            <label className="label">Cor de fundo<input type="color" value={config.bgColor} onChange={event => update('bgColor', event.target.value)} /></label>
            <label className="label">Cor principal<input type="color" value={config.cardColor} onChange={event => update('cardColor', event.target.value)} /></label>
            <label className="label">Cor dos carimbos<input type="color" value={config.stampFilledColor} onChange={event => update('stampFilledColor', event.target.value)} /></label>
            <label className="label">Cor do texto<input type="color" value={config.textColor} onChange={event => update('textColor', event.target.value)} /></label>
          </div>
          <Button variant="primary" onClick={save}><Save size={16} /> Guardar alterações</Button>
        </Card>
        <div>
          <div className="text-sec text-xs mb-8">Pré-visualização</div>
          <Card className="card-pad loyalty-preview"><LoyaltyStampCard config={config} currentStamps={4} /></Card>
        </div>
      </div>
    </AdminLayout>
  );
}
