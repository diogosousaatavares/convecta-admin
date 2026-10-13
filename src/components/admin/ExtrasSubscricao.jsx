import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { useConfirmar } from '@/components/ui/Confirmar';
import { formatPrice } from '@/lib/format';
import { EXTRAS, extraIncluido, mudarExtra, sufixoPeriodo } from '@/lib/extras';

/*
 * «Extras» em «A minha subscrição» (13/10/2026): cada um com o preço ao
 * lado e um botão para ligar ou desligar. Incluído no plano → diz que está
 * incluído. Ainda por fazer → «Em breve».
 */
export default function ExtrasSubscricao({ periodo = 'mensal', gratis = false }) {
  const data = useStore();
  const toast = useToast();
  const confirmar = useConfirmar?.();
  const biz = data.business || {};
  const [aMudar, setAMudar] = useState('');

  const mudar = async (e, ligar) => {
    const preco = `${formatPrice(e.precos[periodo] ?? e.precos.mensal)}${sufixoPeriodo(periodo)}`;
    if (confirmar) {
      const ok = await confirmar({
        titulo: ligar ? `Juntar ${e.nome}?` : `Desligar ${e.nome}?`,
        texto: ligar
          ? (gratis ? 'Fica ligado já, sem custo.' : `Passas a pagar mais ${preco}, na mesma subscrição. O primeiro valor é acertado à proporção dos dias.`)
          : 'Deixa de funcionar e deixas de pagar por ele.',
        confirmar: ligar ? 'Juntar' : 'Desligar',
      });
      if (!ok) return;
    }
    setAMudar(e.id);
    try {
      await mudarExtra(e.id, ligar);
      toast.success(ligar ? `${e.nome} ligado` : `${e.nome} desligado`);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) { toast.error('Não foi possível', err.message); setAMudar(''); }
  };

  return (
    <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
      <div className="sub-titulo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} /> Extras</div>
      {EXTRAS.map(e => {
        const incluido = extraIncluido(biz, e.id);
        const ligado = incluido || biz.extras?.[e.id] === true;
        const preco = `${formatPrice(e.precos[periodo] ?? e.precos.mensal)}${sufixoPeriodo(periodo)}`;
        return (
          <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div className="fw-600" style={{ fontSize: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {e.nome}
                {e.emBreve ? <Badge>Em breve</Badge>
                  : incluido ? <Badge variant="success">Incluído no teu plano</Badge>
                  : ligado ? <Badge variant="success">Ligado</Badge>
                  : <span className="text-sec" style={{ fontWeight: 600 }}>+{gratis ? '0 €' : preco}</span>}
              </div>
              <div className="text-sec text-sm" style={{ marginTop: 4, lineHeight: 1.5 }}>{e.texto}</div>
              {ligado && e.rota && (
                <Link to={e.rota} className="text-sm fw-600" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 6, color: 'var(--gold-tinta, var(--gold))' }}>
                  Configurar <ChevronRight size={14} />
                </Link>
              )}
            </div>
            {!e.emBreve && !incluido && (
              <Button size="sm" variant={ligado ? 'secondary' : 'primary'} disabled={aMudar === e.id} onClick={() => mudar(e, !ligado)}>
                {aMudar === e.id ? '…' : ligado ? 'Desligar' : 'Juntar'}
              </Button>
            )}
          </div>
        );
      })}
    </Card>
  );
}
