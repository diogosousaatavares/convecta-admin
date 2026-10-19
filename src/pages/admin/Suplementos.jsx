import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Store, ChevronRight, Check } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { useStore } from '@/hooks/useStore';
import { extraAtivo, extraIncluido } from '@/lib/extras';

/*
 * SUPLEMENTOS (19/10/2026, pedido do Diogo) — os extras que se juntam ao
 * plano. Vive no «Mais», no lugar que estava vazio ao lado das Definições.
 * Está em beta. A lista cresce: cada suplemento novo é uma linha em SUPS.
 */
export default function Suplementos() {
  const data = useStore();
  const biz = data.business;

  const estadoPagamentos = extraIncluido(biz, 'pagamentos')
    ? 'Incluído no teu plano'
    : extraAtivo(biz, 'pagamentos') ? 'Ligado' : null;

  const SUPS = [
    {
      id: 'pagamentos', icon: CreditCard, nome: 'Pagamentos online',
      desc: 'O cliente paga ao marcar — cartão, Apple Pay, Google Pay ou MB WAY. Acabam as faltas.',
      to: '/admin/pagamentos-online', estado: estadoPagamentos,
    },
    {
      id: 'novo-espaco', icon: Store, nome: 'Adição de novo espaço',
      desc: 'Junta um segundo tipo no mesmo sítio (ex. unhas + cabelo) ou um segundo negócio ligado.',
      to: '/admin/subscricao#segundo-tipo', estado: null,
    },
  ];

  return (
    <AdminPage title="Suplementos">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sup">
        <div className="sup-topo">
          <span className="sup-beta">beta</span>
          <p>Mais funcionalidades para juntares ao teu plano quando precisares. Pagas só o que ligares.</p>
        </div>

        <div className="sup-lista">
          {SUPS.map(s => (
            <Link key={s.id} to={s.to} className="sup-item">
              <span className="sup-ico"><s.icon size={22} /></span>
              <span className="sup-txt">
                <b>{s.nome}{s.estado && <i className="sup-sel"><Check size={12} /> {s.estado}</i>}</b>
                <span>{s.desc}</span>
              </span>
              <ChevronRight size={20} className="sup-seta" />
            </Link>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}

const CSS = `
.sup { max-width: 640px; }
.sup-topo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.sup-beta { font-size: 11.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; background: var(--gold); color: #15120E; }
.sup-topo p { margin: 0; flex: 1 1 240px; color: var(--text-sec); font-size: 14.5px; line-height: 1.5; }
.sup-lista { display: grid; gap: 12px; }
.sup-item { display: flex; align-items: flex-start; gap: 14px; padding: 18px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface); text-decoration: none; color: var(--text); }
.sup-ico { width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0; display: grid; place-items: center; color: #15120E; background: var(--gold); }
.sup-txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
.sup-txt > b { font-size: 16.5px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sup-sel { font-style: normal; font-size: 12px; font-weight: 700; color: var(--success); display: inline-flex; align-items: center; gap: 3px; }
.sup-txt > span { font-size: 14px; color: var(--text-sec); line-height: 1.5; }
.sup-seta { color: var(--text-ter); flex-shrink: 0; margin-top: 10px; }
`;
