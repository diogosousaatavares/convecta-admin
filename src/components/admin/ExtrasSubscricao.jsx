import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import MetodosPagamento from '@/components/MetodosPagamento';
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
const ICONES = { pagamentos: CreditCard, faturas: FileText };
const tile = ativo => ({
  width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center',
  background: ativo ? 'rgba(var(--gold-rgb),0.16)' : 'rgba(127,127,127,0.10)',
  color: ativo ? 'var(--gold-tinta, var(--gold))' : 'var(--text-sec)',
});

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
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <span style={tile(true)}><Sparkles size={22} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="fw-600" style={{ fontSize: 18 }}>Extras</div>
          <div className="text-sec" style={{ fontSize: 14.5, marginTop: 2 }}>Funcionalidades adicionais para o teu negócio.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {EXTRAS.map(e => {
          const incluido = extraIncluido(biz, e.id);
          const ligado = incluido || biz.extras?.[e.id] === true;
          const preco = `${formatPrice(e.precos[periodo] ?? e.precos.mensal)}${sufixoPeriodo(periodo)}`;
          const Icone = ICONES[e.id] || Sparkles;
          return (
            <div key={e.id} style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 16, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={tile(!e.emBreve)}><Icone size={22} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div className="fw-600" style={{ fontSize: 17 }}>{e.nome}</div>
                    {e.emBreve ? <Badge>Em breve</Badge>
                      : incluido ? <Badge variant="success"><CheckCircle2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Incluído</Badge>
                      : ligado ? <Badge variant="success">Ligado</Badge>
                      : <span className="fw-600" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>+{gratis ? '0 €' : preco}</span>}
                  </div>
                  {e.curto && <div className="text-sec" style={{ fontSize: 14, marginTop: 4, lineHeight: 1.45 }}>{e.curto}</div>}
                  {e.emBreve && <div className="text-sec" style={{ fontSize: 13, marginTop: 6, opacity: 0.75 }}>Funcionalidade em desenvolvimento.</div>}
                </div>
              </div>
              {e.id === 'pagamentos' && <MetodosPagamento altura={16} style={{ marginTop: 14 }} />}
              {!e.emBreve && !incluido && (
                <Button size="sm" block variant={ligado ? 'secondary' : 'primary'} disabled={aMudar === e.id} onClick={() => mudar(e, !ligado)} style={{ marginTop: 14 }}>
                  {aMudar === e.id ? '…' : ligado ? 'Desligar' : `Juntar · +${gratis ? '0 €' : preco}`}
                </Button>
              )}
              {ligado && e.rota && (
                <Link to={e.rota} className="fw-600" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12,
                  borderTop: '1px solid var(--border)', color: 'var(--gold-tinta, var(--gold))', fontSize: 15,
                }}>
                  {e.rotaTexto || 'Configurar'} <ChevronRight size={18} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
