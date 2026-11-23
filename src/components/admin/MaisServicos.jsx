import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fazOServico } from '@/lib/quemFaz';
import { n as nicho } from '@/lib/nicho';
import { useCoresDasCasas } from '@/lib/grupo';

/*
 * MAIS SERVIÇOS NA MESMA MARCAÇÃO (19/11/2026, pedido da Dulce).
 *
 * Coloração no cabeleireiro e, enquanto tem a tinta, verniz gel na estética:
 * na Nova marcação junta-se «outro serviço», desta casa ou de outra do grupo,
 * cada um com o seu profissional e a sua hora. A hora seguinte começa onde a
 * anterior acaba (muda-se à mão para serviços ao mesmo tempo). Noutra casa,
 * a ficha da cliente é copiada sozinha (marcar_noutra_casa).
 */
const _catalogos = new Map();
export function lerCatalogo(casa) {
  if (!_catalogos.has(casa)) {
    _catalogos.set(casa, supabase.rpc('catalogo_da_casa', { p_casa: casa })
      .then(({ data, error }) => {
        // Um erro não fica guardado: tentar outra vez tem de ler outra vez.
        if (error) { _catalogos.delete(casa); return { servicos: [], profissionais: [], erro: /schema cache|could not find/i.test(error.message) ? 'falta correr o SQL MARCAR_NOUTRA_CASA no Supabase.' : error.message }; }
        return data || { servicos: [], profissionais: [] };
      }));
  }
  return _catalogos.get(casa);
}

const toMin = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const toTime = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function linhaNova(casa, pro, hora) {
  return { k: Math.random().toString(36).slice(2), casa, serviceId: '', professionalId: pro || '', startTime: hora || '' };
}

/** Duração de uma linha, venha de que casa vier. */
export function duracaoDa(linha, casaActual, servicosAqui, catalogos) {
  if (!linha.serviceId) return 0;
  if (linha.casa === casaActual) return Number(servicosAqui.find(s => s.id === linha.serviceId)?.durationMinutes) || 0;
  return Number((catalogos[linha.casa]?.servicos || []).find(s => s.id === linha.serviceId)?.duracao) || 0;
}

export default function MaisServicos({ linhas, setLinhas, casaActual, casas, servicosAqui, prosAqui, fimPrincipal, proPrincipal, rotuloCasa, pronto = true }) {
  const [catalogos, setCatalogos] = useState({});
  const [cores] = useCoresDasCasas();

  useEffect(() => {
    const precisas = [...new Set(linhas.map(l => l.casa).filter(c => c && c !== casaActual && !catalogos[c]))];
    precisas.forEach(c => lerCatalogo(c).then(cat => setCatalogos(x => ({ ...x, [c]: cat }))));
  }, [linhas, casaActual, catalogos]);

  const mudar = (k, campos) => setLinhas(ls => ls.map(l => (l.k === k ? { ...l, ...campos } : l)));
  const fimDe = i => {
    if (i < 0) return fimPrincipal;
    const l = linhas[i];
    const d = duracaoDa(l, casaActual, servicosAqui, catalogos);
    return l.startTime && d ? toTime(toMin(l.startTime) + d) : '';
  };
  const juntar = () => {
    const ult = linhas[linhas.length - 1];
    setLinhas(ls => [...ls, linhaNova(ult?.casa || casaActual, ult ? ult.professionalId : proPrincipal, fimDe(linhas.length - 1))]);
  };

  return (
    <div className="field ms-wrap">
      {linhas.map((l, i) => {
        const aqui = l.casa === casaActual;
        const cat = catalogos[l.casa];
        const servicos = aqui
          ? servicosAqui.map(s => ({ id: s.id, nome: s.name, categoria: s.category || '' }))
          : (cat?.servicos || []);
        const pros = aqui
          ? prosAqui.filter(p => fazOServico(servicosAqui.find(s => s.id === l.serviceId), p.id)).map(p => ({ id: p.id, nome: p.name }))
          : (cat?.profissionais || []).filter(p => {
              const s = (cat?.servicos || []).find(x => x.id === l.serviceId);
              const lista = Array.isArray(s?.profissionais) ? s.profissionais : [];
              return !lista.length || lista.includes(p.id);
            });
        return (
          <div key={l.k} className="ms-linha">
            <div className="ms-cab">
              <span className="ms-num">{i + 2}.º serviço</span>
              {casas.length > 1 && <span className="ms-casa-pill" style={cores[l.casa] ? { background: cores[l.casa], color: '#fff' } : undefined}>{rotuloCasa(casas.find(c => c.id === l.casa) || {})}</span>}
              <button type="button" className="ms-tirar" aria-label="Tirar este serviço" onClick={() => setLinhas(ls => ls.filter(x => x.k !== l.k))}><X size={16} /></button>
            </div>
            {casas.length > 1 && (
              <div className="ms-casas" role="radiogroup" aria-label="Em que casa">
                {casas.map(c => (
                  <button key={c.id} type="button" role="radio" aria-checked={l.casa === c.id}
                    className={`ms-casa${l.casa === c.id ? ' on' : ''}`}
                    onClick={() => mudar(l.k, { casa: c.id, serviceId: '', professionalId: '' })}>
                    <span className="casa-ponto" style={{ background: cores[c.id] }} aria-hidden="true" />{rotuloCasa(c)}
                  </button>
                ))}
              </div>
            )}
            {!aqui && cat?.erro && <div className="text-sm" style={{ color: 'var(--error)' }}>Não deu para ler essa casa: {cat.erro}</div>}
            <select className="select" value={l.serviceId} onChange={e => mudar(l.k, { serviceId: e.target.value, professionalId: '' })}>
              <option value="">{!aqui && !cat ? 'A carregar…' : 'Serviço…'}</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <div className="ms-dois">
              <select className="select" value={l.professionalId} onChange={e => mudar(l.k, { professionalId: e.target.value })}>
                <option value="">{nicho().Pro}…</option>
                {pros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <input type="time" className="input" value={l.startTime} onChange={e => mudar(l.k, { startTime: e.target.value })} />
            </div>
          </div>
        );
      })}
      <button type="button" className="ms-juntar" onClick={juntar} disabled={!pronto}>
        <span className="ms-juntar-ic"><Plus size={18} /></span>
        <span className="ms-juntar-txt">
          <b>Juntar outro serviço</b>
          <span>{!pronto
            ? 'Escolhe primeiro o serviço, o profissional e a hora.'
            : casas.length > 1
              ? `Desta casa ou de outra das ${casas.length} casas — para a mesma cliente.`
              : 'Para a mesma cliente, a seguir ou ao mesmo tempo.'}</span>
        </span>
      </button>
    </div>
  );
}
