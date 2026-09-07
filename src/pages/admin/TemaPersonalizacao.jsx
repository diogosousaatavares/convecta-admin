import React, { useEffect, useState } from 'react';
import { Palette, RotateCcw, Check } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const DEFAULT_COLORS = { '--gold':'#C9A227','--bg':'#0A0807','--surface':'#141210','--elevated':'#1C1915','--border':'#221E18','--text':'#EDE8DF','--text-sec':'#8A8272','--text-ter':'#524F49' };
const PRESETS = [
  { label: 'Dark Gold', colors: DEFAULT_COLORS },
  { label: 'Midnight', colors: { '--gold':'#7C9FD4','--bg':'#07090F','--surface':'#0F1220','--elevated':'#161B2E','--border':'#1E2540','--text':'#E0E6F5','--text-sec':'#7A87A8','--text-ter':'#424A66' } },
  { label: 'Emerald', colors: { '--gold':'#34A869','--bg':'#080F0B','--surface':'#101A12','--elevated':'#162219','--border':'#1B2B1E','--text':'#DFF0E5','--text-sec':'#6FA882','--text-ter':'#3D6648' } },
  { label: 'Rose', colors: { '--gold':'#D4607C','--bg':'#0F0809','--surface':'#1E1012','--elevated':'#271419','--border':'#32181D','--text':'#F5E0E3','--text-sec':'#A8707A','--text-ter':'#663D44' } },
  { label: 'Claro', colors: { '--gold':'#A0790E','--bg':'#F5F2EE','--surface':'#FFFFFF','--elevated':'#F0ECE6','--border':'#D9D3C9','--text':'#1A1714','--text-sec':'#6B6355','--text-ter':'#9C9080' } },
];
const COLOR_LABELS = [
  ['--gold','Cor de destaque','Botões, acentos, valores'], ['--bg','Fundo principal','Background da página'], ['--surface','Surface','Cards e sidebar'], ['--elevated','Elevated','Dropdowns, modais'], ['--border','Bordas','Linhas e separadores'], ['--text','Texto principal','Títulos e conteúdo'], ['--text-sec','Texto secundário','Labels e subtítulos'], ['--text-ter','Texto terciário','Placeholders, hints'],
];

export function applyTheme(colors) {
  let el = document.getElementById('convecta-theme');
  if (!el) { el = document.createElement('style'); el.id = 'convecta-theme'; document.head.appendChild(el); }
  el.textContent = `:root { ${Object.entries(colors).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
}

function MiniPreview({ colors }) {
  const card = { background: colors['--surface'], border: `1px solid ${colors['--border']}`, borderRadius: 10 };
  const rows = [['09:00','João Silva','Corte de cabelo','Confirmada'],['10:30','Maria Costa','Barba','Pendente'],['11:00','Pedro Alves','Corte + Barba','Confirmada'],['12:00','Ana Ferreira','Hidratação','Confirmada']];
  return <div style={{ width: '100%', height: 400, position: 'relative', overflow: 'hidden', borderRadius: 12, border: `1px solid ${colors['--border']}` }}>
    <div style={{ position: 'absolute', inset: 0, width: 940, height: 760, transform: 'scale(0.495)', transformOrigin: 'top left', display: 'flex', pointerEvents: 'none', userSelect: 'none', background: colors['--bg'], fontFamily: 'inherit' }}>
      <div style={{ width: 210, flexShrink: 0, padding: '24px 0', background: colors['--surface'], borderRight: `1px solid ${colors['--border']}` }}>
        <div style={{ padding: '0 20px', marginBottom: 28 }}><div style={{ fontSize: 24, fontWeight: 800, color: colors['--text'] }}>Convecta<span style={{ color: colors['--gold'] }}>.</span></div><div style={{ fontSize: 12, color: colors['--text-sec'], marginTop: 2 }}>Painel de gestão</div></div>
        {['Dashboard','Agenda','Clientes','Profissionais','Financeiro','Relatórios','Definições'].map((label, index) => <div key={label} style={{ padding: '9px 20px', margin: '1px 8px', borderRadius: 7, background: index === 0 ? colors['--elevated'] : 'transparent', color: index === 0 ? colors['--gold'] : colors['--text-sec'], fontSize: 14, fontWeight: index === 0 ? 700 : 400 }}>{label}</div>)}
      </div>
      <div style={{ flex: 1, padding: 28, background: colors['--bg'] }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: colors['--text'], marginBottom: 4 }}>Dashboard</div><div style={{ fontSize: 14, color: colors['--text-sec'], marginBottom: 24 }}>Bem-vindo ao painel de controlo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>{[['Marcações hoje','12'],['Receita do mês','€ 2.840'],['Clientes ativos','48'],['Taxa de ocupação','78%']].map(([label,value]) => <div key={label} style={{ ...card, padding: '16px 18px' }}><div style={{ fontSize: 12, color: colors['--text-sec'], marginBottom: 8 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 800, color: colors['--text'] }}>{value}</div><div style={{ fontSize: 12, color: colors['--gold'] }}>↑ +12%</div></div>)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
          <div style={{ ...card, overflow: 'hidden' }}><div style={{ padding: '14px 18px', borderBottom: `1px solid ${colors['--border']}`, fontWeight: 700, color: colors['--text'], fontSize: 15 }}>Próximas marcações</div>{rows.map(([hour,name,service,status]) => <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px', borderBottom: `1px solid ${colors['--border']}` }}><span style={{ color: colors['--gold'], fontWeight: 700, fontSize: 13, width: 46 }}>{hour}</span><span style={{ flex: 1, color: colors['--text'], fontSize: 13 }}>{name}</span><span style={{ color: colors['--text-sec'], fontSize: 12 }}>{service}</span><span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: status === 'Confirmada' ? 'rgba(34,197,94,.15)' : 'rgba(234,179,8,.15)', color: status === 'Confirmada' ? '#22C55E' : '#EAB308' }}>{status}</span></div>)}</div>
          <div style={{ ...card, padding: '16px 18px' }}><div style={{ fontWeight: 700, color: colors['--text'], fontSize: 15, marginBottom: 16 }}>Receita — últimos 7 dias</div><div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>{[40,65,45,80,55,90,70].map((height,index) => <div key={index} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}><div style={{ height: `${height}%`, background: index === 5 ? colors['--gold'] : colors['--elevated'], border: `1px solid ${colors['--border']}`, borderRadius: '4px 4px 0 0' }} /></div>)}</div><div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors['--border']}`, color: colors['--gold'], fontSize: 22, fontWeight: 800 }}>€ 3.240</div></div>
        </div>
      </div>
    </div>
  </div>;
}

export default function TemaPersonalizacao() {
  const toast = useToast();
  const [colors, setColors] = useState(() => ({ ...DEFAULT_COLORS, ...(dataService.getState().business.config?.theme || {}) }));
  const [applied, setApplied] = useState(false);
  useEffect(() => { applyTheme(colors); }, [colors]);
  const setColor = (key, value) => { setApplied(false); setColors(current => ({ ...current, [key]: value })); };
  const apply = async () => { await dataService.updateConfig('theme', colors); applyTheme(colors); setApplied(true); toast.success('Tema aplicado', 'As cores foram guardadas e aplicadas ao painel.'); };
  const reset = async () => { setColors({ ...DEFAULT_COLORS }); await dataService.updateConfig('theme', DEFAULT_COLORS); setApplied(false); toast.info('Tema reposto para o padrão.'); };

  return <AdminPage title="Tema e Personalização" subtitle="Personaliza as cores do painel. A pré-visualização atualiza em tempo real.">
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card className="card-pad"><div className="fw-600 mb-12" style={{ fontSize: 14, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: 1 }}>Temas pré-definidos</div><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{PRESETS.map(preset => <button key={preset.label} onClick={() => { setApplied(false); setColors({ ...preset.colors }); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--elevated)', color: 'var(--text)', fontSize: 14, cursor: 'pointer', textAlign: 'left' }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: preset.colors['--gold'], border: '2px solid rgba(255,255,255,.15)' }} /><span style={{ flex: 1 }}>{preset.label}</span>{['--bg','--surface','--elevated'].map(key => <span key={key} style={{ width: 12, height: 12, borderRadius: 3, background: preset.colors[key], border: '1px solid rgba(255,255,255,.1)' }} />)}</button>)}</div></Card>
        <Card className="card-pad"><div className="fw-600 mb-16" style={{ fontSize: 14, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: 1 }}>Cores personalizadas</div><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{COLOR_LABELS.map(([key,label,desc]) => <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="color" value={colors[key]} onChange={e => setColor(key,e.target.value)} style={{ width: 32, height: 32, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 11, color: 'var(--text-ter)' }}>{desc}</div></div><input className="input" value={colors[key]} onChange={e => setColor(key,e.target.value)} style={{ width: 84, fontFamily: 'monospace', fontSize: 11, padding: '4px 8px' }} /></div>)}</div></Card>
        <div style={{ display: 'flex', gap: 8 }}><Button variant="primary" style={{ flex: 1 }} onClick={apply}>{applied ? <><Check size={15} /> Aplicado</> : <><Palette size={15} /> Aplicar tema</>}</Button><Button variant="secondary" onClick={reset}><RotateCcw size={15} /></Button></div>
        {!applied && <div className="text-sec text-xs" style={{ textAlign: 'center' }}>Clica em "Aplicar tema" para guardar e ver no painel real.</div>}
      </div>
      <Card className="card-pad"><div className="fw-600 mb-16" style={{ fontSize: 14, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: 1 }}>Pré-visualização em tempo real</div><MiniPreview colors={colors} /></Card>
    </div>
  </AdminPage>;
}
