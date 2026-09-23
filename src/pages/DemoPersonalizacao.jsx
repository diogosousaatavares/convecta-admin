import React, { useEffect, useState } from 'react';
import { DesignTab } from '@/pages/admin/MeuSite';
import { getBusinessPublico } from '@/lib/designService';
import { Spin, T2 } from '@/components/design/ui';

/*
 * A demonstração da personalização, para o site da Convecta (convecta.pt
 * mostra esta página dentro de uma moldura).
 *
 * É o mesmo editor do «O Meu Site» do painel, peça por peça, a mexer no site
 * verdadeiro de uma barbearia (a Rasta Village, por omissão). Sem sessão e
 * sem gravar nada: lê a barbearia pela vista pública, as mudanças vivem só na
 * pré-visualização e as imagens ficam no browser de quem experimenta.
 */
export default function DemoPersonalizacao() {
  const [biz, setBiz] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('b') || 'rastavillage';
    getBusinessPublico({ slug })
      .then(b => {
        if (!b) { setErro('Demonstração indisponível de momento.'); return; }
        setBiz({ id: b.id, name: b.name, slug: b.slug, domain: b.domain || '', logo_url: b.logo_url || '' });
      })
      .catch(() => setErro('Demonstração indisponível de momento.'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0A0A0A)', padding: '18px 16px 28px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {erro ? <div style={{ padding: 60, textAlign: 'center', color: T2 }}>{erro}</div>
          : !biz ? <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spin size={28} /></div>
          : <DesignTab biz={biz} demo />}
      </div>
    </div>
  );
}
