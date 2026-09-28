import React, { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE } from '@/lib/designService';

/*
 * O endereço da barbearia, no topo do Dashboard.
 *
 * É a coisa que o barbeiro mais vai partilhar — no Instagram, no WhatsApp,
 * no balcão. Se tiver de o ir procurar a «O meu site», não partilha.
 *
 * Até 28/09/2026 isto era uma linha discreta com um rótulo minúsculo em
 * maiúsculas. Ninguém lê rótulos minúsculos. Agora diz, em letra grande e
 * por palavras, a única coisa que ele tem de fazer com este link:
 * mandá-lo aos clientes. Sem isso a agenda fica vazia.
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
    <div data-tour="link-barbearia" style={{
      border: '1px solid rgba(var(--gold-rgb),0.45)', borderRadius: 14,
      padding: '18px 20px', background: 'rgba(var(--gold-rgb),0.06)',
      margin: '0 0 18px',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>
        Manda este link aos teus clientes
      </div>
      <div style={{ fontSize: 15, marginTop: 4, opacity: .85 }}>
        É por aqui que eles marcam. Põe-no no Instagram e no WhatsApp.
      </div>

      <div id="link-da-barbearia" style={{
        fontSize: 17, fontWeight: 700, wordBreak: 'break-all',
        margin: '14px 0 14px', padding: '12px 14px', borderRadius: 10,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>{endereco}</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={copiar}>
          {copiado ? <Check size={16} /> : <Copy size={16} />} {copiado ? 'Copiado' : 'Copiar link'}
        </button>
        {podePartilhar && (
          <button type="button" className="btn btn-secondary" onClick={partilhar}>
            <Share2 size={16} /> Partilhar
          </button>
        )}
        <a className="btn btn-secondary" href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> Ver o site
        </a>
      </div>
    </div>
  );
}
