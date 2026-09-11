import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';
import { dadosDoRelatorio, exportarRelatorioMensal, nomeDoMes } from '@/lib/relatorioContabilista';

/*
 * O cartao do relatorio para o contabilista.
 *
 * Mostra o que vai no ficheiro ANTES de o descarregar. Um botao "Exportar" que
 * cospe um ficheiro sem dizer o que la esta obriga a abri-lo para saber se
 * valeu a pena — e se o mes estiver vazio, o barbeiro so descobre no Excel.
 */
export default function RelatorioContabilista() {
  const data = useStore();
  const toast = useToast();
  const agora = new Date();
  // Por omissao o mes passado: e esse que se manda ao contabilista, nao o que
  // ainda vai a meio.
  const anterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const [ano, setAno] = useState(anterior.getFullYear());
  const [mes, setMes] = useState(anterior.getMonth());

  const r = useMemo(() => dadosDoRelatorio(data, ano, mes), [data, ano, mes]);

  // Doze meses para tras chega: ninguem manda ao contabilista o ano passado.
  const opcoes = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    return { ano: d.getFullYear(), mes: d.getMonth(), rotulo: nomeDoMes(d.getFullYear(), d.getMonth()) };
  }), [agora.getFullYear(), agora.getMonth()]);

  const escolher = e => {
    const [a, m] = e.target.value.split('-').map(Number);
    setAno(a); setMes(m);
  };

  const exportar = () => {
    if (!r.linhas.length) { toast.info('Mês sem serviços', 'Não há nada para exportar neste mês.'); return; }
    exportarRelatorioMensal(data, ano, mes);
    toast.success('Relatório criado', `${r.linhas.length} serviços · ${formatPrice(r.totais.total)}`);
  };

  const linha = (rotulo, valor, forte = false) => (
    <div key={rotulo} style={{
      display: 'flex', justifyContent: 'space-between', padding: '7px 0',
      borderBottom: '1px solid var(--border)', fontSize: 13,
    }}>
      <span className="text-sec">{rotulo}</span>
      <span className={forte ? 'fw-600 text-gold' : 'fw-600'}>{valor}</span>
    </div>
  );

  return (
    <Card className="card-pad">
      <div className="flex items-center gap-12 mb-8" style={{ flexWrap: 'wrap' }}>
        <FileSpreadsheet size={18} style={{ color: 'var(--gold)' }} />
        <div className="fw-600">Relatório para o contabilista</div>
      </div>
      <p className="text-sec text-sm" style={{ marginTop: 0, marginBottom: 16 }}>
        Um ficheiro Excel com o resumo do mês e a lista de todos os serviços prestados.
        Pronto a enviar.
      </p>

      <div className="flex gap-12 items-center mb-16" style={{ flexWrap: 'wrap' }}>
        <select className="select" style={{ maxWidth: 220 }} value={`${ano}-${mes}`} onChange={escolher}>
          {opcoes.map(o => (
            <option key={`${o.ano}-${o.mes}`} value={`${o.ano}-${o.mes}`}>{o.rotulo}</option>
          ))}
        </select>
        <Button variant="primary" onClick={exportar} disabled={!r.linhas.length}>
          <Download size={16} /> Descarregar Excel
        </Button>
      </div>

      {r.linhas.length === 0 ? (
        <div className="text-sec text-sm" style={{ padding: '14px 0' }}>
          Sem serviços pagos em {nomeDoMes(ano, mes)}. Só entram marcações com pagamento
          fechado — uma marcação confirmada e não paga não é receita.
        </div>
      ) : (
        <div>
          {linha('Serviços prestados', r.totais.servicos)}
          {r.totais.gratis > 0 && linha('Dos quais grátis (cartão)', r.totais.gratis)}
          {linha('Valor dos serviços', formatPrice(r.totais.base))}
          {r.totais.descontos > 0 && linha('Descontos', '− ' + formatPrice(r.totais.descontos))}
          {r.totais.gorjetas > 0 && linha('Gorjetas', formatPrice(r.totais.gorjetas))}
          {linha('Total cobrado', formatPrice(r.totais.total), true)}
          <div className="text-sec text-xs" style={{ marginTop: 12 }}>
            Sem IVA — os valores são os cobrados ao cliente.
          </div>
        </div>
      )}
    </Card>
  );
}
