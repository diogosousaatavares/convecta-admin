import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarPlus, CalendarX, Repeat, Star, Megaphone, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/*
 * O sino do painel: o que aconteceu na barbearia, o mesmo que chega por push
 * ao telemóvel — marcação nova, cancelada, pedido de pack, avaliação,
 * mensagem da Convecta. A base de dados escreve estes avisos sozinha
 * (supabase/AVISOS_BARBEARIA.sql); aqui só se lêem.
 *
 * Em cima, se houver, as marcações por confirmar — é o que o barbeiro tem de
 * fazer já. Abrir o sino marca tudo como lido.
 */

const ICONE = { marcacao: CalendarPlus, cancelada: CalendarX, pack: Repeat, avaliacao: Star, convecta: Megaphone };
const COR = { marcacao: '#22C55E', cancelada: '#EF4444', pack: '#C9A227', avaliacao: '#F59E0B', convecta: '#3B82F6' };

function haQuanto(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export default function SinoAvisos({ businessId, porConfirmar = 0 }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const caixa = useRef(null);

  const ler = () => {
    if (!businessId) return;
    supabase.from('avisos_barbearia').select('*').eq('business_id', businessId)
      .order('created_at', { ascending: false }).limit(25)
      .then(({ data }) => setAvisos(data || []), () => {});
  };

  useEffect(() => {
    ler();
    const t = setInterval(ler, 45000);
    const aoVoltar = () => { if (!document.hidden) ler(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', aoVoltar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (caixa.current && !caixa.current.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('touchstart', fora);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('touchstart', fora); };
  }, [aberto]);

  const naoLidos = avisos.filter(a => !a.lido).length;
  const total = naoLidos + (porConfirmar > 0 ? 1 : 0);

  function abrir() {
    const vai = !aberto;
    setAberto(vai);
    if (vai && naoLidos) {
      supabase.from('avisos_barbearia').update({ lido: true }).eq('business_id', businessId).eq('lido', false)
        .then(() => setTimeout(ler, 1500), () => {});
    }
  }
  function ir(url) { setAberto(false); navigate(url || '/admin'); }

  return (
    <div ref={caixa} style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-icon" onClick={abrir} aria-label={total ? `${total} avisos novos` : 'Avisos'}
        title="Avisos" style={{ position: 'relative' }}>
        <Bell size={16} />
        {total > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 8,
            background: '#C9A227', color: '#100D08', fontSize: 10, fontWeight: 700, lineHeight: '15px', textAlign: 'center' }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: -6, width: 'min(360px, calc(100vw - 24px))', zIndex: 60,
          background: 'var(--surface, #16130F)', border: '1px solid var(--border)', borderRadius: 14,
          boxShadow: '0 22px 50px rgba(0,0,0,.55)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>Avisos</div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {porConfirmar > 0 && (
              <button onClick={() => ir('/admin/marcacoes')} style={linha(true)}>
                <span style={bola('#F59E0B')}><Clock size={15} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>{porConfirmar} marcaç{porConfirmar === 1 ? 'ão' : 'ões'} por confirmar</b>
                  <small style={{ display: 'block', color: 'var(--text-sec)', fontSize: 12 }}>Carrega para confirmar.</small>
                </span>
              </button>
            )}
            {avisos.length === 0 && porConfirmar === 0 && (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-sec)', fontSize: 13 }}>
                Ainda não há avisos. Quando entrar uma marcação, aparece aqui.
              </div>
            )}
            {avisos.map(a => {
              const Icone = ICONE[a.tipo] || Bell;
              return (
                <button key={a.id} onClick={() => ir(a.url)} style={linha(!a.lido)}>
                  <span style={bola(COR[a.tipo] || '#C9A227')}><Icone size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titulo}</b>
                    {a.mensagem && <small style={{ display: 'block', color: 'var(--text-sec)', fontSize: 12, lineHeight: 1.4 }}>{a.mensagem}</small>}
                  </span>
                  <small style={{ color: 'var(--text-sec)', fontSize: 11, flexShrink: 0 }}>{haQuanto(a.created_at)}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const linha = (novo) => ({
  width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', textAlign: 'left',
  border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text)',
  background: novo ? 'rgba(201,162,39,0.07)' : 'transparent',
});
const bola = (c) => ({
  width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
  background: `${c}22`, color: c,
});
