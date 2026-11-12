import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, ArrowRight, Crown } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useGrupo, mudarDeNegocio } from '@/lib/grupo';

/*
 * TODAS AS CASAS (12/11/2026) — o caso da Dulce.
 *
 * Um espaço com várias casas (barbearia, cabeleireiro, estética, laser…).
 * A dona entra na casa principal e vê aqui, de uma vez, os números e a
 * equipa de todas — sem ter de abrir cada uma. Os profissionais nunca
 * chegam aqui: cada um vê só a casa onde tem ficha.
 *
 * Os números vêm de resumo_do_grupo e equipa_do_grupo
 * (GRUPO_VISAO_2026-11-12.sql), que só respondem ao dono do grupo.
 */

const PERIODOS = [
  { k: 'hoje', l: 'Hoje' },
  { k: '7d', l: '7 dias' },
  { k: 'mes', l: 'Este mês' },
  { k: 'passado', l: 'Mês passado' },
];

function intervalo(k) {
  const h = new Date(); h.setHours(0, 0, 0, 0);
  const amanha = new Date(h); amanha.setDate(h.getDate() + 1);
  if (k === 'hoje') return [h, amanha];
  if (k === '7d') { const d = new Date(h); d.setDate(h.getDate() - 6); return [d, amanha]; }
  const ini = new Date(h.getFullYear(), h.getMonth(), 1);
  if (k === 'mes') return [ini, amanha];
  return [new Date(h.getFullYear(), h.getMonth() - 1, 1), ini];
}

const ROTULO_TIPO = {
  barbearia: 'Barbearia', cabeleireiro: 'Cabeleireiro', estetica: 'Estética', unhas: 'Unhas',
  maquilhagem: 'Maquilhagem', laser: 'Laser', massagem: 'Massagens', clinica: 'Clínica',
};

export default function GrupoVisao() {
  const data = useStore();
  const grupo = useGrupo();
  const [periodo, setPeriodo] = useState('mes');
  const [casas, setCasas] = useState(null);
  const [equipa, setEquipa] = useState([]);
  const [erro, setErro] = useState('');
  const [aAbrir, setAAbrir] = useState(null);

  useEffect(() => {
    let vivo = true;
    const [de, ate] = intervalo(periodo);
    const p = { p_de: de.toISOString(), p_ate: ate.toISOString() };
    setErro('');
    Promise.all([supabase.rpc('resumo_do_grupo', p), supabase.rpc('equipa_do_grupo', p)])
      .then(([r, e]) => {
        if (!vivo) return;
        if (r.error || e.error) { setErro('Ainda não dá para ver as casas todas. Falta correr o GRUPO_VISAO no Supabase.'); setCasas([]); return; }
        setCasas(r.data || []); setEquipa(e.data || []);
      });
    return () => { vivo = false; };
  }, [periodo]);

  const total = useMemo(() => (casas || []).reduce((t, c) => ({
    faturacao: t.faturacao + Number(c.faturacao || 0),
    marcacoes: t.marcacoes + (c.marcacoes || 0),
    concluidas: t.concluidas + (c.concluidas || 0),
    clientes: t.clientes + (c.clientes || 0),
  }), { faturacao: 0, marcacoes: 0, concluidas: 0, clientes: 0 }), [casas]);

  const porCasa = useMemo(() => {
    const m = new Map();
    for (const p of equipa) {
      if (!m.has(p.casa)) m.set(p.casa, []);
      m.get(p.casa).push(p);
    }
    return m;
  }, [equipa]);

  if (data.isProfissional) return <Navigate to="/admin" replace />;

  async function abrir(id) {
    setAAbrir(id);
    try { await mudarDeNegocio(id); } catch (e) { setErro(e.message); setAAbrir(null); }
  }

  const nomeCasa = c => (c.principal ? `${c.nome}` : c.nome);
  const maior = Math.max(1, ...(casas || []).map(c => Number(c.faturacao || 0)));

  return (
    <AdminLayout>
      <div className="page-head">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Building2 size={24} /> Todas as casas</h1>
      </div>
      <p className="text-sec" style={{ marginTop: -6, marginBottom: 16, maxWidth: 620 }}>
        Os números e a equipa de cada casa, vistos daqui. Cada profissional só vê a casa dele.
      </p>

      <div className="gv-periodos" role="tablist">
        {PERIODOS.map(p => (
          <button key={p.k} role="tab" aria-selected={periodo === p.k} className={periodo === p.k ? 'on' : ''} onClick={() => setPeriodo(p.k)}>{p.l}</button>
        ))}
      </div>

      {erro && <div className="gv-erro">{erro}</div>}

      <div className="gv-totais">
        <div><span>Faturação</span><b>{formatPrice(total.faturacao)}</b></div>
        <div><span>Marcações</span><b>{total.marcacoes}</b></div>
        <div><span>Concluídas</span><b>{total.concluidas}</b></div>
        <div><span>Clientes</span><b>{total.clientes}</b></div>
      </div>

      <h2 className="gv-h2">Por casa</h2>
      {casas === null ? <div className="text-sec">A carregar…</div> : (
        <div className="gv-casas">
          {casas.map(c => (
            <div key={c.id} className="gv-casa">
              <div className="gv-casa-topo">
                <div style={{ minWidth: 0 }}>
                  <b>{nomeCasa(c)}</b>
                  <span>{c.principal ? 'Principal · ' : ''}{ROTULO_TIPO[c.tipo] || c.tipo} · {c.profissionais} {c.profissionais === 1 ? 'profissional' : 'profissionais'}</span>
                </div>
                <strong>{formatPrice(c.faturacao)}</strong>
              </div>
              <div className="gv-barra"><i style={{ width: `${(Number(c.faturacao || 0) / maior) * 100}%` }} /></div>
              <div className="gv-casa-nums">
                <span>{c.marcacoes} marcações</span>
                <span>{c.concluidas} concluídas</span>
                <span>{c.canceladas} canceladas</span>
                <span>{c.clientes} clientes</span>
              </div>
              {!c.principal && grupo.actual?.id !== c.id && (
                <button className="btn btn-ghost btn-sm gv-abrir" onClick={() => abrir(c.id)} disabled={!!aAbrir}>
                  {aAbrir === c.id ? 'A abrir…' : <>Abrir esta casa <ArrowRight size={14} /></>}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="gv-h2">A equipa</h2>
      {(casas || []).filter(c => porCasa.has(c.id)).map(c => (
        <div key={c.id} style={{ marginBottom: 18 }}>
          <div className="gv-equipa-casa">{c.nome}</div>
          <div className="lin-lista">
            {porCasa.get(c.id).map(p => (
              <div key={p.id} className="lin" style={{ cursor: 'default', opacity: p.ativo ? 1 : 0.5 }}>
                <span className="lin-txt">
                  <b>{p.nome}{(p.funcao === 'dono' || p.funcao === 'owner') && <Crown size={13} style={{ marginLeft: 6, color: 'var(--gold-tinta)' }} />}</b>
                  <span>{p.ativo ? `${p.concluidas} ${p.concluidas === 1 ? 'serviço' : 'serviços'}` : 'Inativo'}{p.email ? ` · ${p.email}` : ''}</span>
                </span>
                <span className="lin-valor">{formatPrice(p.faturacao)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </AdminLayout>
  );
}
