import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE } from '@/lib/designService';

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

  useEffect(() => {
    let vivo = true;
    dataService.getBusiness().then(b => {
      if (!vivo || !b) return;
      setEndereco(b.domain || (b.slug ? `${b.slug}.${DOMINIO_BASE}` : ''));
    }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!endereco) return null;

  const url = `https://${endereco}`;
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

  const partilhar = async () => {
    try { await navigator.share({ title: 'Marca a tua hora', url }); } catch { /* cancelou */ }
  };

  return (
    <div className="link-faixa" data-tour="link-barbearia">
      <span className="link-faixa-rotulo">O teu link</span>
      <span id="link-da-barbearia" className="link-faixa-endereco">{endereco}</span>
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
  );
}
