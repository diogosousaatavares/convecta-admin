import React, { useMemo, useState } from 'react';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { exportCSV } from '@/lib/csv';
import { resumoProfissional } from '@/lib/domain/finance';
import ListaPessoas, { Periodo } from '@/components/admin/ListaPessoas';

export default function Comissoes() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  // As mesmas contas do Desempenho e da Conta do Profissional
  // (resumoProfissional): marcações pagas no período, receita sem gorjeta,
  // comissão gravada no momento da cobrança.
  const rows = useMemo(() => data.professionals.map(p => {
    const r = resumoProfissional(data, p.id, { from, to });
    return { pro: p, count: r.marcacoes, netRev: r.receita, commission: r.comissao, tips: r.gorjetas, total: r.aReceber };
  }), [data, from, to]);

  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
  const totalTips = rows.reduce((s, r) => s + r.tips, 0);

  const doExport = () => exportCSV(`comissoes_${from}_${to}.csv`, rows.map(r => ({
    Profissional: r.pro.name,
    'Comissão %': r.pro.commission || 0,
    'Marcações': r.count,
    'Receita líquida': r.netRev.toFixed(2),
    'Comissão €': r.commission.toFixed(2),
    'Gorjetas': r.tips.toFixed(2),
    'Total a pagar': r.total.toFixed(2)
  })));

  // Uma linha por pessoa: percentagem por baixo, total a pagar à direita.
  // Tocar abre a ficha com as contas todas.
  const linhas = rows.map(r => ({
    id: r.pro.id, nome: r.pro.name,
    sub: `${r.pro.commission || 0}% de comissão · ${r.count} ${r.count === 1 ? 'marcação' : 'marcações'}`,
    valor: formatPrice(r.total),
    detalhe: [
      ['Comissão', `${r.pro.commission || 0}%`], ['Marcações', r.count], ['Receita líquida', formatPrice(r.netRev)],
      ['Comissão €', formatPrice(r.commission)], ['Gorjetas', formatPrice(r.tips)], ['Total a pagar', formatPrice(r.total)],
    ],
  }));

  return (
    <>
      <Periodo from={from} to={to} setFrom={setFrom} setTo={setTo} />
      {rows.length === 0 || rows.every(r => r.count === 0) ? (
        <Card className="card-pad"><EmptyState title="Sem dados" description="Sem marcações concluídas no período." /></Card>
      ) : (
        <ListaPessoas linhas={linhas} />
      )}
      <div className="lin-rodape">
        <span className="text-sec text-sm">Comissões <b className="text-gold">{formatPrice(totalCommission)}</b></span>
        <span className="text-sec text-sm">Gorjetas <b>{formatPrice(totalTips)}</b></span>
        <Button size="sm" variant="secondary" onClick={doExport} className="so-pc">Exportar CSV</Button>
      </div>
    </>
  );
}
