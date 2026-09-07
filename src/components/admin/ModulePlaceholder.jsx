import React from 'react';
import { Construction } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui';

export default function ModulePlaceholder({ icon: Icon, title, subtitle, sections, activeTab, embedded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.split('/').slice(0, -1).join('/') || location.pathname;

  return (
    <div>
      {!embedded && (
        <div className="page-head">
          <div className="flex items-center gap-12">
            {Icon && <span className="notif-ico" style={{ width: 44, height: 44, borderRadius: 12 }}><Icon size={22} /></span>}
            <div><h1>{title}</h1><p>{subtitle}</p></div>
          </div>
        </div>
      )}

      <Card className="card-pad mb-24" style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-12">
          <Construction size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="fw-600">Módulo em estruturação</div>
            <div className="text-sec text-sm">
              A arquitetura e as ligações aos dados reais serão implementadas na próxima fase.
              Não são apresentados valores fictícios — apenas a estrutura planeada.
            </div>
          </div>
        </div>
      </Card>

      <div className="meg-grid">
        {sections.map(s => {
          const active = activeTab && s.key === activeTab;
          const SIcon = s.icon;
          return (
            <Card
              key={s.key}
              className="meg-card card-hover"
              style={{ cursor: 'pointer', ...(active ? { borderColor: 'var(--gold)' } : {}) }}
              onClick={() => navigate(`${basePath}/${s.key}`)}
            >
              <div className="flex justify-between items-center mb-16">
                <span className="notif-ico"><SIcon size={18} /></span>
                {active && <span className="badge badge-gold">A visualizar</span>}
              </div>
              <h3 style={{ fontSize: 17 }}>{s.title}</h3>
              <p className="text-sec text-sm mt-8">{s.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}