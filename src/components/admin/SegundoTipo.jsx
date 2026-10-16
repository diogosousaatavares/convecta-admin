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
import Ajuda from '@/components/admin/Ajuda';
import { useConfirmar } from '@/components/ui/Confirmar';

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
  const [pedir, Confirmacao] = useConfirmar();
  const [aGravar, setAGravar] = useState(false);

  if (!atual || atual === 'misto' || grupo.ligado) return null;
  const opcoes = LISTA_TIPOS.filter(t => t !== atual);
  const extra = centimos ? Math.round(Number(centimos) / 2) : null;
  const porPeriodo = periodo === 'anual' ? '/ano' : periodo === 'quinzenal' ? '/15 dias' : '/mês';
  const precoTexto = gratis
    ? 'Sem custo: a tua conta não paga mensalidade.'
    : extra ? `+${euros(extra)}${porPeriodo}, metade do teu plano.` : 'Metade do teu plano.';

  const juntar = async () => {
    setAGravar(true);
    try {
      await dataService.adicionarSegundoTipo(tipo, nome.trim());
      toast.success('Feito', `${TIPOS[tipo].curto} já está criado. Trocas entre os dois no topo do painel.`);
      // Recarrega o painel: o seletor dos dois negócios aparece no topo.
      setTimeout(() => { window.location.href = '/admin'; }, 1200);
    } catch (e) {
      toast.error('Não foi possível juntar', e.message);
      setAGravar(false);
      throw e;
    }
  };

  const slug = nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const pronto = !!tipo && nome.trim().length >= 2 && !aGravar;
  const porSemana = extra ? (periodo === 'anual' ? extra / 52 : periodo === 'quinzenal' ? extra * 26 / 52 : extra * 12 / 52) : 0;
  const confirmarEJuntar = () => pedir({
    titulo: `Juntar ${TIPOS[tipo].curto}?`,
    texto: gratis
      ? `Fica já criado, sem custo. Trocas entre ${TIPOS[atual].curto} e ${TIPOS[tipo].curto} no topo do painel.`
      : `Passas a pagar mais ${euros(extra)}${porPeriodo} — metade do teu plano, cerca de ${euros(Math.round(porSemana))} por semana. Agora só pagas os dias que faltam; em experiência, nada até ao fim dela.`,
    botao: 'Sim, juntar',
    perigoso: false,
    aoConfirmar: juntar,
  });

  /*
   * Redesenhado a 16/10/2026: sem caixa amarela nem botão azeitona. Três
   * mosaicos com uma «fotografia» de cor por tipo, o nome, o endereço que
   * fica, e o botão preto com o preço. A explicação está no (i).
   */
  return (
    <div id="segundo-tipo" style={{ maxWidth: 720, marginBottom: 16, scrollMarginTop: 80 }}><Card className="card-pad">
      <div className="prod-sec" style={{ marginTop: 0 }}>Outro tipo de negócio <Ajuda titulo="Outro tipo de negócio" texto={<>
        <p>Se o teu espaço faz mais do que uma coisa — barbearia e unhas, por exemplo — cada tipo tem a sua app, com o seu nome, o seu link e os seus serviços. Entras com o mesmo login e trocas entre os dois no topo do painel.</p>
        <p>Custa metade do teu plano{lugares ? `, e cada um tem os ${lugares} ${lugares === 1 ? 'lugar' : 'lugares'} do plano para a sua equipa` : ''}. A primeira cobrança é só dos dias que faltam até à próxima fatura.</p>
      </>} /></div>
      <div className="fw-600" style={{ fontSize: 18 }}>Tens outro tipo de negócio?</div>

      <div className="st-tiles" style={{ '--st-n': opcoes.length }}>
        {opcoes.map(t => {
          const on = tipo === t;
          const Ic = ICONE_TIPO[t] || Sparkles;
          return (
            <button key={t} type="button" aria-pressed={on} className={`st-tile st-${t}${on ? ' on' : ''}`} onClick={() => setTipo(t)}>
              <span className="st-foto"><Ic size={30} strokeWidth={1.6} />{on && <span className="st-check"><Check size={14} /></span>}</span>
              <b>{TIPOS[t].curto}</b>
            </button>
          );
        })}
      </div>

      {tipo && (
        <>
          <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
            <label className="label" htmlFor="nome-segundo">Nome do novo negócio</label>
            <input id="nome-segundo" className="input" value={nome} maxLength={60} placeholder="Ex.: Nails by Ana" onChange={e => setNome(e.target.value)} />
          </div>
          {slug.length >= 2 && (
            <div className="nt-row" style={{ padding: '10px 0 0', borderBottom: 0 }}>
              <span className="nt-txt"><b>Endereço</b><span>{slug}.marcacoes.app</span></span>
            </div>
          )}
        </>
      )}

      <Button variant="primary" block onClick={confirmarEJuntar} disabled={!pronto} style={{ marginTop: 16 }}>
        {aGravar ? 'A juntar…' : !tipo ? 'Escolhe o tipo' : nome.trim().length < 2 ? 'Escreve o nome' : `Juntar ${TIPOS[tipo].curto}${!gratis && extra ? ` · +${euros(extra)}${porPeriodo}` : ''}`}
      </Button>
      <Confirmacao />
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
