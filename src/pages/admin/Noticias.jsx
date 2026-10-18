import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { listConvectaNotifs, markConvectaNotifRead } from '@/lib/convectaNotifs';

/*
 * NOTÍCIAS (18/10/2026, pedido do Diogo) — o que a Convecta manda do super
 * admin (business_notifications). Antes só apareciam no Início, por ler, e
 * depois de lidas desapareciam. Aqui ficam todas, as novas com um ponto.
 * Ao abrir a página, ficam lidas.
 */
const quando = iso => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });

export default function Noticias() {
  const [lista, setLista] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    listConvectaNotifs().then(l => {
      setLista(l);
      l.filter(n => !n.read).forEach(n => markConvectaNotifRead(n.id).catch(() => {}));
    }).catch(() => setLista([]));
  }, []);

  return (
    <AdminPage title="Notícias">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="nc">
        {lista == null && <div className="nc-vazio">A carregar…</div>}
        {lista?.length === 0 && <div className="nc-vazio">Ainda não há notícias.</div>}
        {lista?.map(n => {
          const abre = n.url && String(n.url).startsWith('/admin');
          const Tag = abre ? 'button' : 'div';
          return (
            <Tag key={n.id} type={abre ? 'button' : undefined} className="nc-item" onClick={abre ? () => navigate(n.url) : undefined}>
              <span className={`nc-ponto${n.read ? '' : ' novo'}`} />
              <span className="nc-txt">
                <span className="nc-topo"><b>{n.title}</b><em>{quando(n.created_at)}</em></span>
                {n.body && <span className="nc-corpo">{n.body}</span>}
              </span>
              {abre && <ChevronRight size={18} className="nc-seta" />}
            </Tag>
          );
        })}
      </div>
    </AdminPage>
  );
}

const CSS = `
.nc { max-width: 640px; }
.nc-vazio { padding: 40px 0; text-align: center; color: var(--text-sec); }
.nc-item { display: flex; gap: 12px; align-items: flex-start; width: 100%; padding: 16px 0; border: 0; border-bottom: 1px solid var(--border); background: none; font: inherit; color: var(--text); text-align: left; }
button.nc-item { cursor: pointer; }
.nc-ponto { width: 8px; height: 8px; border-radius: 999px; margin-top: 7px; flex-shrink: 0; background: transparent; }
.nc-ponto.novo { background: var(--gold); }
.nc-txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
.nc-topo { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.nc-topo b { font-size: 16px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nc-topo em { font-style: normal; font-size: 13px; color: var(--text-ter); white-space: nowrap; }
.nc-corpo { font-size: 14.5px; color: var(--text-sec); line-height: 1.5; }
.nc-seta { color: var(--text-ter); flex-shrink: 0; margin-top: 3px; }
`;
