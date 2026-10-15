import React, { useEffect, useState } from 'react';
import { Gift, Save } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import CartaoFidelidadePreview from '@/components/admin/CartaoFidelidadePreview';
import { useToast } from '@/components/ui/ToastContext';
import { n as nicho } from '@/lib/nicho';

/*
 * O cartao de fidelidade, numa pagina so.
 *
 * Havia duas — "Programa" e "Cartao de Visitas" — a guardar em sitios
 * diferentes (uma no config, outra no localStorage deste browser), e o
 * interruptor "cartao ativo" so decidia se o balcao carimbava. O site do
 * cliente lia uma terceira copia. Tres verdades para uma coisa.
 *
 * Agora e uma so: `settings.loyalty` da barbearia, que e o que o site do
 * cliente le. O interruptor "ativo" e literal: desligado, o cartao nao
 * aparece ao cliente, o balcao nao carimba e nao ha corte gratis a usar;
 * os carimbos ja dados ficam guardados para quando voltar a ligar.
 */
// Desligado por omissao: o cartao so existe se o barbeiro o ligar aqui.
const OMISSAO = { ativo: false, stampsNeeded: 10, validMonths: 6, get rewardName() { return nicho().premio; }, cartaoClaro: false };

export default function FidelizacaoPrograma() {
  const data = useStore();
  const toast = useToast();
  const guardado = { ...OMISSAO, ...(data.business?.loyalty || {}) };

  const [ativo, setAtivo] = useState(guardado.ativo === true);
  const [carimbos, setCarimbos] = useState(guardado.stampsNeeded);
  const [validade, setValidade] = useState(guardado.validMonths);
  const [premio, setPremio] = useState(guardado.rewardName);
  // As cores vêm do tema do site. O que se escolhe aqui é só se o cartão é
  // escuro ou claro — uma barbearia de marca clara quer o cartão escuro, e
  // ao contrário. Mais do que isto abria a porta a cartões ilegíveis.
  const [claro, setClaro] = useState(guardado.cartaoClaro === true);
  const [aGuardar, setAGuardar] = useState(false);

  // Se as regras mudarem noutro sitio (super admin), o ecra acompanha.
  useEffect(() => {
    const g = { ...OMISSAO, ...(data.business?.loyalty || {}) };
    setAtivo(g.ativo === true); setCarimbos(g.stampsNeeded); setValidade(g.validMonths); setPremio(g.rewardName);
    setClaro(g.cartaoClaro === true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.business?.loyalty]);

  const n = Math.max(3, Math.min(20, Number(carimbos) || 10));
  const meses = Math.max(0, Math.min(24, Number(validade) || 0));

  const save = async () => {
    setAGuardar(true);
    try {
      await dataService.updateBusiness({
        loyalty: { ...(data.business?.loyalty || {}), ativo, stampsNeeded: n, validMonths: meses, rewardName: (premio || '').trim() || nicho().premio, cartaoClaro: claro },
      });
      toast.success(ativo ? 'Cartão de fidelidade guardado' : 'Cartão desligado', ativo
        ? `${n} carimbos, ${meses ? `válido ${meses} meses` : 'sem prazo'}. Já está no site dos teus clientes.`
        : 'Deixa de aparecer aos clientes e o balcão deixa de carimbar. Os carimbos ficam guardados.');
    } catch (e) {
      toast.error('Não foi possível guardar', e.message);
    } finally { setAGuardar(false); }
  };

  const preenchidos = Math.min(3, n - 1);

  return (
    <AdminPage title="Cartão de fidelidade" subtitle={`A cada X ${nicho().uns}, ${nicho().un === 'sessão' ? 'a seguinte' : 'o seguinte'} é grátis. O que decides aqui é o que o cliente vê no telemóvel.`}>
      <div className="fid-wrap" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: 900 }}>
        <Card className="card-pad fid-form" style={{ flex: '1 1 320px', maxWidth: 460 }}>
          {/* Arrumado a 15/10/2026: um interruptor em cima, os campos a largura
              toda, os dois números lado a lado, o botão a largura toda. */}
          <label className="loyalty-toggle-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div className="fw-600" style={{ fontSize: 16 }}>Cartão de fidelidade</div>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} style={{ width: 20, height: 20 }} />
          </label>

          <div style={{ opacity: ativo ? 1 : 0.5, transition: 'opacity .2s' }}>
            <div className="field">
              <label className="label">Prémio</label>
              <input className="input" value={premio} disabled={!ativo}
                onChange={e => setPremio(e.target.value)} placeholder={`Ex: ${nicho().premio}`} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label className="label">{nicho().Uns} até ao prémio</label>
                <input type="number" className="input" min="3" max="20" value={carimbos} disabled={!ativo}
                  onChange={e => setCarimbos(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Validade (meses)</label>
                <input type="number" className="input" min="0" max="24" value={validade} disabled={!ativo}
                  onChange={e => setValidade(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">Aspeto do cartão</label>
              <div className="tipo-opcoes duas" role="radiogroup" aria-label="Aspeto do cartão">
                {[[false, 'Escuro'], [true, 'Claro']].map(([v, t]) => (
                  <button key={t} type="button" role="radio" aria-checked={claro === v} disabled={!ativo}
                    className={`tipo-opcao ${claro === v ? 'on' : ''}`} onClick={() => setClaro(v)}>
                    <span className="tipo-opcao-t">{t}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button variant="primary" block onClick={save} disabled={aGuardar}>
            <Save size={16} /> {aGuardar ? 'A guardar…' : 'Guardar'}
          </Button>
        </Card>

        <div className="fid-preview" style={{ flex: '1 1 260px', minWidth: 260 }}>
          <div className="nt-titulo" style={{ marginTop: 0 }}>Como o cliente o vê</div>
          {ativo ? (
            <CartaoFidelidadePreview
              nome={data.business?.name || nicho().Tua}
              carimbos={n}
              preenchidos={preenchidos}
              premio={premio}
              meses={meses}
              claro={claro}
              cores={data.business?._settings?.theme?.colors || {}}
            />
          ) : (
            <Card className="card-pad" style={{ maxWidth: 340 }}>
              <div className="text-sec text-sm">Cartão desligado. O cliente não vê nada e o balcão não carimba.</div>
            </Card>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
