import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE } from '@/lib/designService';

/*
 * O endereço da barbearia, sempre à mão, no Dashboard.
 *
 * É a coisa que o barbeiro mais vai partilhar — no Instagram, no WhatsApp,
 * no balcão. Se tiver de o ir procurar a «O meu site», não partilha. Fica
 * aqui, no primeiro ecrã, com um botão que o copia e outro que o abre.
 *
 * No telemóvel há também «Partilhar», que abre o menu nativo: é um toque
 * para o mandar por WhatsApp a um cliente.
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
      // Sem clipboard (http, browser antigo): selecciona-se o texto e ele copia à mão.
      window.getSelection?.().selectAllChildren(document.getElementById('link-da-barbearia'));
    }
  };

  const partilhar = async () => {
    try { await navigator.share({ title: 'Marca o teu corte', url }); } catch { /* cancelou */ }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px',
      background: 'var(--surface)', margin: '0 0 14px',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className="text-sec" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: .8 }}>O site da tua barbearia</div>
        <div id="link-da-barbearia" className="fw-600" style={{ fontSize: 15, wordBreak: 'break-all', marginTop: 2 }}>{endereco}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={copiar} style={{ fontSize: 13 }}>
          {copiado ? <Check size={15} /> : <Copy size={15} />} {copiado ? 'Copiado' : 'Copiar link'}
        </button>
        {podePartilhar && (
          <button type="button" className="btn btn-ghost" onClick={partilhar} style={{ fontSize: 13 }}>
            <Share2 size={15} /> Partilhar
          </button>
        )}
        <a className="btn btn-ghost" href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
          <ExternalLink size={15} /> Abrir
        </a>
      </div>
    </div>
  );
}
