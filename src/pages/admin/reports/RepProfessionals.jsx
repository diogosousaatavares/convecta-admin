import React from 'react';
import ProPerformance from '@/pages/admin/ProPerformance';

// O relatório é a mesma página do Desempenho, com outro título. Antes metia a
// página dentro de outra página e o cabeçalho do painel aparecia duas vezes.
export default function RepProfessionals() {
  return <ProPerformance titulo="Relatório de Profissionais" subtitulo="Desempenho por profissional." />;
}
