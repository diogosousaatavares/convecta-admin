import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Repeat, Layers, Users, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import ModulePlaceholder from '@/components/admin/ModulePlaceholder';

const SECTIONS = [
  { key: 'planos', title: 'Planos', description: 'Nome, preço, periodicidade, serviços incluídos e benefícios.', icon: Layers },
  { key: 'assinantes', title: 'Assinantes', description: 'Cliente, plano, estado, início e próximo pagamento.', icon: Users },
  { key: 'pagamentos', title: 'Pagamentos', description: 'Cobranças recorrentes e respetivo estado.', icon: Wallet },
  { key: 'utilizacoes', title: 'Utilizações', description: 'Benefícios consumidos por cada assinante.', icon: CheckCircle2 },
  { key: 'inadimplentes', title: 'Inadimplentes', description: 'Assinaturas com pagamentos pendentes.', icon: AlertTriangle }
];

export default function Assinaturas() {
  const location = useLocation();
  const tab = useMemo(() => new URLSearchParams(location.search).get('tab') || 'planos', [location.search]);
  return (
    <AdminLayout>
      <ModulePlaceholder
        icon={Repeat}
        title="Assinaturas"
        subtitle="Clubes e planos de assinatura recorrente."
        sections={SECTIONS}
        activeTab={tab}
      />
    </AdminLayout>
  );
}