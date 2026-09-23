import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { supabase } from '@/lib/supabase';

/*
 * O acordo de subcontratação (art. 28.º do RGPD) tem de estar aceite por
 * cada barbearia. Quem se regista em convecta.pt/comecar aceita-o lá; quem
 * já tinha conta (ou foi criada pelo Super Admin) aceita-o aqui, uma vez.
 * Fica em settings.acordoRgpd = { versao, aceiteEm, email, origem }.
 *
 * VERSAO tem de ser igual à de convecta.pt (src/lib/seo.js). Quando o
 * acordo mudar, sobe-se nas duas e este aviso volta a aparecer.
 */
const VERSAO = '1.0';

export default function AcordoRgpd() {
  const data = useStore();
  const biz = data?.business;
  const [aGravar, setAGravar] = useState(false);
  const [erro, setErro] = useState('');
  const aceite = biz?._settings?.acordoRgpd;
  if (!biz?.id || biz.demo || (aceite && aceite.versao === VERSAO)) return null;

  async function aceitar() {
    setAGravar(true); setErro('');
    try {
      const { data: s } = await supabase.auth.getSession();
      await dataService.updateBusiness({
        acordoRgpd: { versao: VERSAO, aceiteEm: new Date().toISOString(), email: s?.session?.user?.email || null, origem: 'painel' },
      });
    } catch (e) { setErro(e?.message || 'Não ficou gravado. Tenta outra vez.'); }
    finally { setAGravar(false); }
  }

  return (
    <div role="region" aria-label="Acordo de proteção de dados" style={{
      display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap',
      padding: '14px 16px', borderRadius: 12, marginBottom: 16,
      border: '1px solid rgba(201,162,39,.45)', background: 'rgba(201,162,39,.08)',
    }}>
      <ShieldCheck size={22} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: '1 1 260px', minWidth: 0, fontSize: 13.5, lineHeight: 1.55 }}>
        <b>Falta aceitar o acordo de proteção de dados.</b><br />
        <span className="text-sec">
          Como guardamos os dados dos teus clientes por ti, a lei (RGPD, art. 28.º) pede que isso fique por escrito.
          São 3 minutos de leitura.
        </span>
        {erro && <div style={{ color: 'var(--error)', marginTop: 6 }}>{erro}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <a className="btn btn-ghost btn-sm" href="https://convecta.pt/acordo-rgpd" target="_blank" rel="noopener noreferrer">Ler o acordo</a>
        <button className="btn btn-primary btn-sm" onClick={aceitar} disabled={aGravar}>
          {aGravar ? 'A gravar…' : 'Li e aceito'}
        </button>
      </div>
    </div>
  );
}
