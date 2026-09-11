import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

/*
 * O formulario que abre a porta da demonstracao.
 *
 * Quatro campos e nem um a mais: nome, barbearia, telemovel, email. Quem
 * chega aqui ainda nao viu nada — cada campo extra e uma razao para fechar o
 * separador. O que se pede e o suficiente para o Diogo ligar de volta.
 *
 * Preenchido uma vez, este browser nao volta a pedir. Quem faz a demo tres
 * vezes e a mesma pessoa a mostrar ao socio.
 */
const CHAVE = 'convecta_demo_pedido';

export function jaPediuDemo() {
  try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; }
}

export default function FormularioDemo({ origem = 'site', titulo = 'Antes de entrares', onConcluido, onFechar }) {
  const [f, setF] = useState({ nome: '', barbearia: '', telefone: '', email: '' });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (f.nome.trim().length < 2) { setErro('Diz-nos o teu nome.'); return; }
    if (f.telefone.trim().length < 6 && !f.email.includes('@')) { setErro('Deixa um telemóvel ou um email — é por aí que falamos contigo.'); return; }
    setAEnviar(true);
    try {
      const { error } = await supabase.rpc('pedir_demonstracao', {
        p_nome: f.nome, p_barbearia: f.barbearia, p_telefone: f.telefone, p_email: f.email, p_origem: origem,
      });
      if (error) throw error;
      try { localStorage.setItem(CHAVE, '1'); } catch {}
      onConcluido?.(f);
    } catch (err) {
      setErro(err.message || 'Não foi possível enviar. Tenta outra vez.');
      setAEnviar(false);
    }
  }

  const campo = (rotulo, k, tipo = 'text', extra = {}) => (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-sec, #8A8272)', marginBottom: 5 }}>{rotulo}</span>
      <input type={tipo} value={f[k]} onChange={set(k)} disabled={aEnviar} {...extra}
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 10,
          border: '1px solid var(--border, #2A2620)', background: 'var(--elevated, #1C1915)',
          color: 'var(--text, #EDE8DF)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
    </label>
  );

  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 1000,
      display: 'grid', placeItems: 'center', padding: 16 }}>
      <form onSubmit={enviar} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, background: 'var(--surface, #16130F)', border: '1px solid var(--border, #2A2620)',
          borderRadius: 16, padding: 24, boxSizing: 'border-box', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text, #EDE8DF)', marginBottom: 6, fontFamily: 'var(--font-head, inherit)' }}>{titulo}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-sec, #8A8272)', lineHeight: 1.55, marginBottom: 18 }}>
          Diz-nos quem és para podermos falar contigo depois. Trinta segundos, e entras.
        </div>

        {campo('O teu nome', 'nome', 'text', { autoComplete: 'name', autoFocus: true })}
        {campo('Barbearia', 'barbearia', 'text', { autoComplete: 'organization', placeholder: 'Se já tens uma' })}
        {campo('Telemóvel', 'telefone', 'tel', { autoComplete: 'tel', inputMode: 'tel' })}
        {campo('Email', 'email', 'email', { autoComplete: 'email', inputMode: 'email' })}

        {erro && <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,.12)',
          border: '1px solid rgba(239,68,68,.35)', color: '#F87171', fontSize: 13, marginBottom: 12 }}>{erro}</div>}

        <button type="submit" disabled={aEnviar}
          style={{ width: '100%', padding: '13px 16px', borderRadius: 11, border: 0, cursor: aEnviar ? 'wait' : 'pointer',
            background: 'var(--gold, #C9A227)', color: '#0A0804', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
            opacity: aEnviar ? .65 : 1 }}>
          {aEnviar ? 'A entrar…' : 'Entrar na demonstração'}
        </button>
        <div style={{ fontSize: 11.5, color: 'var(--text-ter, #5E584B)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          Usamos estes dados só para te contactar sobre a Convecta.
        </div>
      </form>
    </div>
  );
}
