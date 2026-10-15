/*
 * JUNTAR UM SEGUNDO TIPO DE NEGÓCIO (12/10/2026).
 *
 * Dois sítios, a mesma porta:
 *   · JuntarSegundoTipo — o cartão na Subscrição. Escolhe-se o tipo, vê-se o
 *     preço (metade do plano), confirma-se. A edge function
 *     adicionar-segundo-tipo trata do Stripe e da ficha; aqui só se pede.
 *   · SugestaoSegundoTipo — um aviso pequeno na Equipa, como uma promoção,
 *     que leva ao cartão. Fecha-se com o × e não volta neste browser.
 *
 * Num espaço que já é misto nenhum dos dois aparece.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { TIPOS, LISTA_TIPOS, tipoActual } from '@/lib/nicho';
import { useGrupo } from '@/lib/grupo';

const euros = c => (Number(c || 0) / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// O que faz sentido sugerir a quem já é de um tipo.
const SUGESTAO = {
  barbearia: 'estética ou unhas',
  cabeleireiro: 'unhas ou estética',
  unhas: 'cabeleireiro ou estética',
  estetica: 'unhas ou cabeleireiro',
};

/**
 * @param centimos   o preço do plano (mensal ou anual), para mostrar metade
 * @param periodo    'mensal' | 'anual'
 * @param gratis     conta sem mensalidade (parceiro)
 * @param lugares    lugares do plano (cada negócio tem os seus)
 */
export function JuntarSegundoTipo({ centimos, periodo = 'mensal', gratis = false, lugares }) {
  const toast = useToast();
  const atual = tipoActual();
  const grupo = useGrupo();
  const [tipo, setTipo] = useState('');
  const [aConfirmar, setAConfirmar] = useState(false);
  const [aGravar, setAGravar] = useState(false);

  if (!atual || atual === 'misto' || grupo.ligado) return null;
  const opcoes = LISTA_TIPOS.filter(t => t !== atual);
  const extra = centimos ? Math.round(Number(centimos) / 2) : null;
  const porPeriodo = periodo === 'anual' ? '/ano' : periodo === 'quinzenal' ? '/15 dias' : '/mês';
  const precoTexto = gratis
    ? 'Sem custo: a tua conta não paga mensalidade.'
    : extra ? `+${euros(extra)}${porPeriodo}, metade do teu plano.` : 'Metade do teu plano.';

  const juntar = async () => {
    if (!aConfirmar) { setAConfirmar(true); return; }
    setAGravar(true);
    try {
      await dataService.adicionarSegundoTipo(tipo);
      toast.success('Feito', `${TIPOS[tipo].curto} já está criado. Trocas entre os dois no topo do painel.`);
      // Recarrega o painel: o seletor dos dois negócios aparece no topo.
      setTimeout(() => { window.location.href = '/admin'; }, 1200);
    } catch (e) {
      toast.error('Não foi possível juntar', e.message);
      setAGravar(false);
      setAConfirmar(false);
    }
  };

  return (
    <div id="segundo-tipo" style={{ maxWidth: 720, marginBottom: 16, scrollMarginTop: 80 }}><Card className="card-pad">
      <div className="fw-600" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17 }}><Sparkles size={18} style={{ color: 'var(--gold-tinta)' }} /> Juntar outro tipo de negócio</div>
      <p className="text-sec" style={{ fontSize: 15, lineHeight: 1.5, margin: '6px 0 14px' }}>Duas apps numa só, no mesmo espaço.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {opcoes.map(t => {
          const on = tipo === t;
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => { setTipo(t); setAConfirmar(false); }}
              style={{
                padding: '9px 14px', borderRadius: 999, fontSize: 15, fontWeight: 600, cursor: 'pointer', font: 'inherit',
                border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
                background: on ? 'rgba(var(--gold-rgb),0.14)' : 'transparent', color: 'var(--text)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              {on && <Check size={15} style={{ color: 'var(--gold-tinta)' }} />}{TIPOS[t].curto}
            </button>
          );
        })}
      </div>

      <ul style={{ margin: '14px 0 16px', padding: 0, listStyle: 'none', display: 'grid', gap: 6, fontSize: 14.5 }}>
        <li><b>{precoTexto}</b></li>
        {lugares ? <li className="text-sec">Cada um tem os {lugares} {lugares === 1 ? 'lugar' : 'lugares'} do teu plano para a sua equipa.</li> : null}
      </ul>

      <Button block onClick={juntar} disabled={!tipo || aGravar}>
        {aGravar ? 'A juntar…'
          : !tipo ? 'Escolhe o tipo a juntar'
          : aConfirmar ? `Confirmar${!gratis && extra ? ` · +${euros(extra)}${porPeriodo}` : ''}`
          : `Juntar ${TIPOS[tipo].curto}`}
      </Button>
      {aConfirmar && !aGravar && (
        <p className="text-sec" style={{ fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}>
          {gratis ? 'Fica já ativo.' : 'Na subscrição paga-se só a parte do mês que falta. Em experiência, nada até ao fim dela.'}
        </p>
      )}
    </Card></div>
  );
}

const FECHADO = 'convecta.promo.segundoTipo';

/** O aviso pequeno na Equipa. */
export function SugestaoSegundoTipo() {
  const atual = tipoActual();
  const grupo = useGrupo();
  const [fechado, setFechado] = useState(() => {
    try { return localStorage.getItem(FECHADO) === '1'; } catch { return false; }
  });
  if (fechado || !atual || atual === 'misto' || grupo.ligado || !SUGESTAO[atual]) return null;
  const fechar = () => {
    try { localStorage.setItem(FECHADO, '1'); } catch { /* sem armazenamento */ }
    setFechado(true);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 16, borderRadius: 12,
      background: 'rgba(var(--gold-rgb),0.08)', border: '1px solid rgba(var(--gold-rgb),0.28)', fontSize: 14,
    }}>
      <Sparkles size={16} style={{ color: 'var(--gold-tinta)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
        Também fazes {SUGESTAO[atual]}? Junta um segundo tipo ao teu espaço com <b>50 % de desconto</b>.{' '}
        <Link to="/admin/subscricao#segundo-tipo" style={{ color: 'var(--gold-tinta)', fontWeight: 600, whiteSpace: 'nowrap' }}>Ver como</Link>
      </div>
      <button type="button" onClick={fechar} aria-label="Fechar"
        style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--text-ter)', display: 'flex' }}>
        <X size={16} />
      </button>
    </div>
  );
}
