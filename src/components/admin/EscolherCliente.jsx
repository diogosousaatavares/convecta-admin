import React, { useMemo, useState, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { nomeSemRepetir } from '@/lib/nomes';

/*
 * ESCOLHER UM CLIENTE ESCREVENDO O NOME.
 *
 * Era um <select> com a lista toda na ordem em que vinha da base de dados.
 * Com cem clientes, encontrar o Joao era andar a rodar a roda. Agora
 * escreve-se, a lista filtra, e esta sempre por ordem alfabetica. Serve
 * para o nome, o telemovel ou o email: o barbeiro muitas vezes so sabe
 * o numero.
 */
function semAcentos(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

export default function EscolherCliente({ clientes, value, onChange, autoFocus }) {
  const [texto, setTexto] = useState('');
  const [aberto, setAberto] = useState(false);

  const ordenados = useMemo(() =>
    [...(clientes || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt')),
    [clientes]);

  const escolhido = ordenados.find(c => c.id === value);

  const lista = useMemo(() => {
    const t = semAcentos(texto.trim());
    const base = t ? ordenados.filter(c => semAcentos(c.name).includes(t) || (c.phone || '').replace(/\s/g, '').includes(t) || semAcentos(c.email).includes(t)) : ordenados;
    return base.slice(0, 40);
  }, [ordenados, texto]);

  useEffect(() => { if (!value) setTexto(''); }, [value]);

  if (escolhido) {
    return (
      <div className="ec-escolhido">
        <Check size={16} />
        <span>{nomeSemRepetir(ordenados, escolhido, escolhido.phone || escolhido.email)}</span>
        <button type="button" aria-label="Trocar cliente" onClick={() => { onChange(''); setAberto(true); }}><X size={16} /></button>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </div>
    );
  }

  return (
    <div className="ec">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ec-caixa">
        <Search size={16} />
        <input
          className="ec-input" type="text" inputMode="search" autoFocus={autoFocus}
          placeholder="Nome ou telemóvel…" value={texto}
          onChange={e => { setTexto(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
        />
      </div>
      {aberto && (
        <div className="ec-lista">
          {lista.length === 0 && <div className="ec-vazio">Sem resultados</div>}
          {lista.map(c => (
            <button type="button" key={c.id} className="ec-linha" onClick={() => { onChange(c.id); setAberto(false); }}>
              <b>{c.name}</b>
              {(c.phone || c.email) && <span>{c.phone || c.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CSS = `
.ec-caixa {
  display: flex; align-items: center; gap: 8px; padding: 0 12px; min-height: 44px;
  border-radius: 10px; background: var(--elevated); border: 1px solid var(--border); color: var(--text-sec);
}
.ec-caixa:focus-within { border-color: var(--gold); }
.ec-input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--text); font-size: 15px; outline: none; }
.ec-lista {
  margin-top: 6px; max-height: 240px; overflow-y: auto; border-radius: 10px;
  background: var(--elevated); border: 1px solid var(--border);
}
.ec-linha {
  display: flex; flex-direction: column; align-items: flex-start; width: 100%; text-align: left;
  padding: 9px 12px; border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer;
}
.ec-linha:last-child { border-bottom: 0; }
.ec-linha:hover, .ec-linha:focus-visible { background: rgba(var(--gold-rgb), .1); outline: none; }
.ec-linha b { font-size: 14.5px; font-weight: 600; }
.ec-linha span { font-size: 12.5px; color: var(--text-sec); }
.ec-vazio { padding: 12px; font-size: 14px; color: var(--text-ter); }
.ec-escolhido {
  display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 10px 0 12px;
  border-radius: 10px; border: 1px solid rgba(var(--gold-rgb), .5); background: rgba(var(--gold-rgb), .1); font-weight: 600; font-size: 15px;
}
.ec-escolhido > svg { color: var(--gold-tinta); flex-shrink: 0; }
.ec-escolhido span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ec-escolhido button { border: 0; background: transparent; color: var(--text-sec); cursor: pointer; display: grid; place-items: center; padding: 6px; }
`;
