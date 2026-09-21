import React, { useEffect, useState } from 'react';
import { Gift, Save } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import CartaoFidelidadePreview from '@/components/admin/CartaoFidelidadePreview';
import { useToast } from '@/components/ui/ToastContext';

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
const OMISSAO = { ativo: false, stampsNeeded: 10, validMonths: 6, rewardName: 'Corte grátis', cartaoClaro: false };

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
        loyalty: { ...(data.business?.loyalty || {}), ativo, stampsNeeded: n, validMonths: meses, rewardName: (premio || '').trim() || 'Corte grátis', cartaoClaro: claro },
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
    <AdminPage title="Cartão de fidelidade" subtitle="A cada X cortes, o seguinte é grátis. O que decides aqui é o que o cliente vê no telemóvel.">
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: 900 }}>
        <Card className="card-pad" style={{ flex: '1 1 320px', maxWidth: 460 }}>
          <label className="loyalty-toggle-row" style={{ cursor: 'pointer' }}>
            <div>
              <div className="fw-600 text-sm">Cartão ativo</div>
              <div className="text-sec text-xs">Ligado: aparece ao cliente, o balcão carimba ao cobrar, o corte grátis pode ser usado. Desligado: nada disto acontece.</div>
            </div>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
          </label>

          <div style={{ opacity: ativo ? 1 : 0.5, transition: 'opacity .2s' }}>
            <div className="field">
              <label className="label">Cortes para ganhar o prémio</label>
              <input type="number" className="input" min="3" max="20" value={carimbos} disabled={!ativo}
                onChange={e => setCarimbos(e.target.value)} style={{ maxWidth: 120 }} />
              <div className="text-sec text-xs" style={{ marginTop: 4 }}>O {n + 1}.º corte é o prémio.</div>
            </div>
            <div className="field">
              <label className="label">Prémio</label>
              <input className="input" value={premio} disabled={!ativo}
                onChange={e => setPremio(e.target.value)} placeholder="Ex: Corte grátis" />
            </div>
            <div className="field">
              <label className="label">Aspeto do cartão</label>
              <div className="flex gap-8">
                <Button variant={claro ? 'secondary' : 'primary'} size="sm" disabled={!ativo} onClick={() => setClaro(false)}>Escuro</Button>
                <Button variant={claro ? 'primary' : 'secondary'} size="sm" disabled={!ativo} onClick={() => setClaro(true)}>Claro</Button>
              </div>
              <div className="text-sec text-xs" style={{ marginTop: 6 }}>
                As cores são as da tua marca, definidas em «O Meu Site». Aqui escolhes só o fundo.
              </div>
            </div>

            <div className="field">
              <label className="label">Validade do cartão (meses)</label>
              <input type="number" className="input" min="0" max="24" value={validade} disabled={!ativo}
                onChange={e => setValidade(e.target.value)} style={{ maxWidth: 120 }} />
              <div className="text-sec text-xs" style={{ marginTop: 4 }}>
                Conta a partir do primeiro carimbo de cada cartão. 0 = sem prazo.
              </div>
            </div>
          </div>

          <Button variant="primary" onClick={save} disabled={aGuardar}>
            <Save size={16} /> {aGuardar ? 'A guardar…' : 'Guardar'}
          </Button>
        </Card>

        <div style={{ flex: '1 1 260px', minWidth: 260 }}>
          <div className="text-sec text-sm mb-12" style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11 }}>
            Como o cliente o vê
          </div>
          {ativo ? (
            <CartaoFidelidadePreview
              nome={data.business?.name || 'A tua barbearia'}
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
          <p className="text-sec text-xs" style={{ marginTop: 12, maxWidth: 340, lineHeight: 1.5 }}>
            É este o cartão que o cliente vê no telemóvel, com as cores da tua marca. Muda a cor em «O Meu Site» e muda aqui também.
          </p>
        </div>
      </div>
    </AdminPage>
  );
}
