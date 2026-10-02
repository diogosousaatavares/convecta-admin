import React, { useEffect, useState } from 'react';
import { DesignTab } from '@/pages/admin/MeuSite';
import { getBusinessPublico } from '@/lib/designService';
import { Spin, T2 } from '@/components/design/ui';

/*
 * A demonstração da personalização, para o site da Convecta (convecta.pt
 * mostra esta página dentro de uma moldura).
 *
 * É o mesmo editor do «O Meu Site» do painel, peça por peça, a mexer no site
 * verdadeiro de uma barbearia (a convectacutts, a barbearia de demonstração,
 * por omissão). Sem sessão e sem gravar nada: lê a barbearia pela vista
 * pública, as mudanças vivem só na pré-visualização e as imagens ficam no
 * browser de quem experimenta.
 *
 * Com ?so=telemovel mostra apenas o telemóvel com a app aberta e, por cima
 * dele, o interruptor de mudar o design. É o que vai no site: quem chega a
 * convecta.pt não quer um editor — quer ver a app e perceber que a pode
 * pintar. O editor inteiro continua a existir sem o parâmetro, para quando
 * quisermos mostrá-lo a alguém.
 */
export default function DemoPersonalizacao() {
  const [biz, setBiz] = useState(null);
  const [erro, setErro] = useState('');
  const [so, setSo] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const soTelemovel = q.get('so') === 'telemovel';
    setSo(soTelemovel);

    /*
     * Dentro da moldura do site, o fundo é o do site e não o nosso: senão
     * via-se um retângulo escuro à volta do telemóvel, que é exatamente a
     * moldura que não se quer. Se o navegador não deixar, fica o fundo
     * normal — feio, não partido.
     */
    if (soTelemovel) {
      try {
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
        // Sem isto apareciam as duas barras de deslocacao da moldura — uma
        // ao lado do telemovel e outra por baixo. Aqui dentro nao ha nada
        // para percorrer: o que se percorre e o site DENTRO do telemovel,
        // que tem a sua propria area.
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
      } catch (e) {}
    }

    getBusinessPublico({ slug: q.get('b') || 'convectacutts' })
      .then(b => {
        if (!b) { setErro('Demonstração indisponível de momento.'); return; }
        setBiz({ id: b.id, name: b.name, slug: b.slug, domain: b.domain || '', logo_url: b.logo_url || '' });
      })
      .catch(() => setErro('Demonstração indisponível de momento.'));
  }, []);

  return (
    <div style={{
      minHeight: so ? 0 : '100vh',
      background: so ? 'transparent' : 'var(--bg, #0A0A0A)',
      padding: so ? '6px 10px 10px' : '18px 16px 28px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: so ? 420 : 1180, margin: '0 auto' }}>
        {erro ? <div style={{ padding: 60, textAlign: 'center', color: T2 }}>{erro}</div>
          : !biz ? <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><Spin size={28} /></div>
          : <DesignTab biz={biz} demo soPrevia={so} />}
      </div>
    </div>
  );
}
