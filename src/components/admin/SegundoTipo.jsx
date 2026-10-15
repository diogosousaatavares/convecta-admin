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
import { Sparkles, X, Check, Store, Scissors, Brush, Flower2, ChevronRight, Info, Plus } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { TIPOS, LISTA_TIPOS, tipoActual } from '@/lib/nicho';
import { useGrupo } from '@/lib/grupo';

const euros = c => (Number(c || 0) / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const TILE = { width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(var(--gold-rgb),0.16)', color: 'var(--gold-tinta, var(--gold))' };
const ICONE_TIPO = { barbearia: Scissors, cabeleireiro: Scissors, unhas: Brush, estetica: Flower2 };

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
  const [nome, setNome] = useState('');   // é outra app: nome (e endereço) próprios
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
      await dataService.adicionarSegundoTipo(tipo, nome.trim());
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
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={TILE}><Store size={22} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="fw-600" style={{ fontSize: 18 }}>Juntar outro tipo de negócio</div>
          <div className="text-sec" style={{ fontSize: 14.5, marginTop: 2 }}>Duas apps numa só, no mesmo espaço.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))`, gap: 8, marginTop: 16 }} data-grelha>
        {opcoes.map(t => {
          const on = tipo === t;
          const Ic = ICONE_TIPO[t] || Sparkles;
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => { setTipo(t); setAConfirmar(false); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, minWidth: 0,
                padding: '14px 12px', borderRadius: 14, cursor: 'pointer', font: 'inherit', textAlign: 'left',
                border: `1.5px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
                background: on ? 'rgba(var(--gold-rgb),0.10)' : 'var(--surface)', color: 'var(--text)',
              }}>
              <span style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Ic size={24} strokeWidth={1.7} />
                {on ? <Check size={18} style={{ color: 'var(--gold-tinta)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-sec)' }} />}
              </span>
              <span className="fw-600" style={{ fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{TIPOS[t].curto}</span>
            </button>
          );
        })}
      </div>

      {tipo && (
        <div style={{ marginTop: 14 }}>
          <label className="fw-600" htmlFor="nome-segundo" style={{ display: 'block', fontSize: 14.5, marginBottom: 6 }}>Nome do novo negócio</label>
          <input id="nome-segundo" className="input" value={nome} maxLength={60} placeholder="Ex.: Adérito Barbershop"
            onChange={e => { setNome(e.target.value); setAConfirmar(false); }} />
          {nome.trim().length >= 2 && (
            <div className="text-sec" style={{ fontSize: 13, marginTop: 6 }}>
              O site fica em <b>{nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}.marcacoes.app</b>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(var(--gold-rgb),0.12)' }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 14.5, lineHeight: 1.45 }}>
          <div className="fw-600">{precoTexto}</div>
          {lugares ? <div className="text-sec" style={{ marginTop: 2 }}>Cada um tem os {lugares} {lugares === 1 ? 'lugar' : 'lugares'} do teu plano para a sua equipa.</div> : null}
        </div>
      </div>

      <button type="button" onClick={juntar} disabled={!tipo || nome.trim().length < 2 || aGravar}
        style={{
          width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 14, border: 0, font: 'inherit',
          fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'var(--gold-tinta, var(--gold))', color: '#fff',
          cursor: (!tipo || nome.trim().length < 2 || aGravar) ? 'default' : 'pointer',
          opacity: (!tipo || nome.trim().length < 2) && !aGravar ? 0.85 : 1,
        }}>
        {!aGravar && !aConfirmar && <Plus size={20} />}
        {aGravar ? 'A juntar…'
          : !tipo ? 'Escolhe o tipo a juntar'
          : nome.trim().length < 2 ? 'Escreve o nome'
          : aConfirmar ? `Confirmar${!gratis && extra ? ` · +${euros(extra)}${porPeriodo}` : ''}`
          : `Juntar ${TIPOS[tipo].curto}`}
      </button>
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
