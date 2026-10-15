import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE } from '@/lib/designService';
import { eMisto, lados, nomeDoLado } from '@/lib/nicho';
import { useGrupo, usePorta, enderecoDe } from '@/lib/grupo';

/*
 * O ENDEREÇO DA BARBEARIA, EM TODAS AS PÁGINAS.
 *
 * É a coisa que o barbeiro mais vai partilhar — no Instagram, no WhatsApp, ao
 * balcão. Estava num cartão grande no topo do Dashboard, e isso tinha dois
 * problemas: quem passa o dia na Agenda não lhe punha a vista em cima, e
 * quem entrava no Dashboard via meio ecrã ocupado por três linhas de texto a
 * explicar o que é um link.
 *
 * Passa a ser uma faixa de uma linha, colada por baixo da barra de cima, em
 * todas as páginas. Sem título, sem explicação: o endereço, copiar,
 * partilhar, abrir. Quem já sabe o que é, usa; quem não sabe, carrega em
 * «abrir» e percebe em dois segundos.
 */
export default function LinkDaBarbearia() {
  const [endereco, setEndereco] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [copiadoLado, setCopiadoLado] = useState('');
  const grupo = useGrupo();
  const [porta] = usePorta();

  useEffect(() => {
    let vivo = true;
    dataService.getBusiness().then(b => {
      if (!vivo || !b) return;
      setEndereco(b.domain || (b.slug ? `${b.slug}.${DOMINIO_BASE}` : ''));
    }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!endereco) return null;

  // Dois negócios ligados (15/10/2026): cada um mostra o SEU link — são
  // duas apps diferentes, cada uma com a sua identidade.
  const principal = grupo.lista.find(n => n.id === porta?.principal) || grupo.principal;
  const enderecoPartilhado = endereco;
  const url = `https://${enderecoPartilhado}`;
  const podePartilhar = typeof navigator !== 'undefined' && !!navigator.share;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sem clipboard (http, browser antigo): selecciona-se o texto e copia à mão.
      window.getSelection?.().selectAllChildren(document.getElementById('link-da-barbearia'));
    }
  };

  // Espaço misto: o link de cada lado abre já nessa frente (…/?lado=…).
  // Ligados: o principal abre directo com ?lado=; o outro é o link dele.
  const linkDireto = g => (g.id === principal?.id ? `${url}/?lado=${g.tipo}` : `https://${enderecoDe(g)}`);
  const copiarLado = async l => {
    try {
      const g = grupo.ligado ? grupo.lista.find(x => x.id === l) : null;
      await navigator.clipboard.writeText(g ? linkDireto(g) : `${url}/?lado=${l}`);
      setCopiadoLado(l);
      setTimeout(() => setCopiadoLado(''), 1800);
    } catch { /* sem clipboard: o endereço está à vista para copiar à mão */ }
  };

  const partilhar = async () => {
    try { await navigator.share({ title: 'Marca a tua hora', url }); } catch { /* cancelou */ }
  };

  return (
    <>
    <div className="link-faixa" data-tour="link-barbearia">
      <span className="link-faixa-rotulo">O teu link</span>
      <span id="link-da-barbearia" className="link-faixa-endereco">{enderecoPartilhado}</span>
      <button type="button" className="link-faixa-btn" onClick={copiar}
        aria-label={copiado ? 'Link copiado' : 'Copiar o link'}>
        {copiado ? <Check size={15} /> : <Copy size={15} />}
        <span>{copiado ? 'Copiado' : 'Copiar'}</span>
      </button>
      {podePartilhar && (
        <button type="button" className="link-faixa-ico" onClick={partilhar} aria-label="Partilhar o link">
          <Share2 size={15} />
        </button>
      )}
      <a className="link-faixa-ico" href={url} target="_blank" rel="noreferrer" aria-label="Abrir o site">
        <ExternalLink size={15} />
      </a>
    </div>
    {/* O link principal pergunta qual dos lados; estes abrem já num deles.
        Para a bio de um Instagram só do salão, por exemplo (12/10/2026). */}
    {!grupo.ligado && eMisto() && (
      <div style={{ margin: '10px 0 4px' }}>
        <div className="text-sec" style={{ fontSize: 13, marginBottom: 8, textAlign: 'center' }}>O link acima pergunta qual. Para abrir já num lado:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(grupo.ligado ? grupo.lista.map(g => ({ id: g.id, nome: nomeDoLado(g.tipo) || g.name })) : lados().map(l => ({ id: l, nome: nomeDoLado(l) }))).map(({ id: l, nome }) => (
            <button key={l} type="button" onClick={() => copiarLado(l)}
              aria-label={`Copiar o link de ${nome}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0, padding: '11px 10px', borderRadius: 12, cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 600, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
              {copiadoLado === l ? <Check size={15} style={{ flexShrink: 0 }} /> : <Copy size={15} style={{ flexShrink: 0 }} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{copiadoLado === l ? 'Copiado' : nome}</span>
            </button>
          ))}
        </div>
      </div>
    )}
    </>
  );
}
