import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Gift, Settings2, Award, Coins, History } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import ModulePlaceholder from '@/components/admin/ModulePlaceholder';

const SECTIONS = [
  { key: 'programa', title: 'Programa', description: 'Configuração do programa de fidelização (carimbos, limite, recompensa).', icon: Settings2 },
  { key: 'pontos', title: 'Pontos / Carimbos', description: 'Saldo atual de cada cliente e movimentos de pontos.', icon: Coins },
  { key: 'recompensas', title: 'Recompensas', description: 'Catálogo de recompensas e resgates efetuados.', icon: Award },
  { key: 'historico', title: 'Histórico', description: 'Todos os movimentos de fidelização, por cliente e data.', icon: History }
];

export default function Fidelizacao() {
  const location = useLocation();
  const tab = useMemo(() => new URLSearchParams(location.search).get('tab') || 'programa', [location.search]);
  return (
    <AdminLayout>
      <ModulePlaceholder
        icon={Gift}
        title="Fidelização"
        subtitle="Programa de carimbos, pontos e recompensas dos clientes."
        sections={SECTIONS}
        activeTab={tab}
      />
    </AdminLayout>
  );
}