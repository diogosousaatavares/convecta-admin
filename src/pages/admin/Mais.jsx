import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HelpCircle, LogOut } from 'lucide-react';
import AdminLayout, { gruposPara } from '@/components/AdminLayout';
import { useStore, useAuth } from '@/hooks/useStore';
import { Avatar } from '@/components/ui';

/*
 * «MAIS» — o ecrã onde está tudo.
 *
 * A barra de baixo tem quatro destinos: o trabalho de todos os dias. Tudo o
 * resto vive aqui, e vive INTEIRO: não só as páginas que saíram da barra,
 * também as páginas irmãs das que lá ficaram — as Marcações, os Encaixes, os
 * Aniversários, as Entradas e as Saídas. Sem isto, no telemóvel, uma página
 * sem lugar na barra deixava de ter porta.
 *
 * ── Porque é um ecrã e não uma gaveta ────────────────────────────────────
 *
 * Uma gaveta por cima da página esconde onde ele estava, fecha-se por engano
 * ao tocar fora, e não tem endereço — o botão «voltar» do telemóvel não a
 * fecha. Um ecrã tem endereço, o «voltar» funciona, e cabe-lhe tudo sem
 * ficar espremido.
 *
 * ── A lista é a MESMA do menu ────────────────────────────────────────────
 *
 * Não há aqui nenhuma lista escrita à mão. Vem do `gruposPara` do
 * AdminLayout, com os mesmos filtros: o que um profissional não pode abrir
 * não aparece, e o que está escondido na demonstração também não. Duas
 * listas escritas em dois sítios divergem sempre — é só uma questão de
 * tempo.
 */
export default function Mais() {
  const data = useStore();
  const { user, logout } = useAuth();
  const emDemo = data.business?._settings?.demo?.ativo === true;
  const grupos = gruposPara(emDemo, data.isProfissional);

  /* Cada grupo do menu vira uma secção. Um `item` solto (o Resumo) vira uma
     secção de uma linha só — ficaria estranho sozinho, por isso junta-se à
     primeira que vier a seguir. */
  const seccoes = [];
  for (const g of grupos) {
    if (g.type === 'item') {
      seccoes.push({ titulo: null, linhas: [{ to: g.to, label: g.label }] });
      continue;
    }
    /* Dentro do «Mais» já havia cabeçalhos por assunto: cada um deles vira
       uma secção própria, em vez de uma lista de vinte e quatro linhas. */
    let actual = { titulo: g.label, linhas: [] };
    for (const it of g.items) {
      if (it.titulo) {
        if (actual.linhas.length) seccoes.push(actual);
        actual = { titulo: it.titulo, linhas: [] };
      } else {
        actual.linhas.push(it);
      }
    }
    if (actual.linhas.length) seccoes.push(actual);
  }

  const nome = data.business?.name || 'A minha barbearia';

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="mais">

        <header className="mais-topo">
          {data.business?.logoUrl
            ? <img className="mais-logo" src={data.business.logoUrl} alt="" />
            : <Avatar name={nome} size="lg" />}
          <div className="mais-nome">{nome}</div>
          {user?.email && <div className="mais-email">{user.email}</div>}
        </header>

        {seccoes.map((s, i) => (
          <section key={s.titulo || `s${i}`} className="mais-bloco">
            {s.titulo && <h2 className="mais-h">{s.titulo}</h2>}
            <div className="mais-caixa">
              {s.linhas.map(l => (
                <Link key={l.to} to={l.to} className="mais-linha">
                  <span>{l.label}</span>
                  <ChevronRight size={18} />
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="mais-bloco">
          <h2 className="mais-h">Ajuda</h2>
          <div className="mais-caixa">
            <a className="mais-linha" href="tel:+351914874725">
              <span><HelpCircle size={17} /> Apoio ao cliente</span>
              <ChevronRight size={18} />
            </a>
          </div>
        </section>

        <button type="button" className="mais-sair" onClick={logout}>
          <LogOut size={17} /> Terminar sessão
        </button>

        <div className="mais-rodape">Convecta</div>
      </div>
    </AdminLayout>
  );
}

const CSS = `
.mais { max-width: 560px; margin: 0 auto; }

.mais-topo { text-align: center; padding: 6px 0 26px; }
.mais-logo {
  width: 72px; height: 72px; border-radius: 999px; object-fit: contain;
  background: var(--elevated); border: 1px solid var(--border);
  display: block; margin: 0 auto 12px; padding: 6px;
}
.mais-topo .avatar { margin: 0 auto 12px; }
.mais-nome { font-size: 20px; font-weight: 700; }
.mais-email { font-size: 14px; color: var(--text-sec); margin-top: 3px; word-break: break-all; }

.mais-bloco { margin-bottom: 22px; }
/* O cabeçalho fica FORA da caixa, como nas listas do telemóvel: lá dentro
   leria-se como mais uma linha da lista. */
.mais-h {
  margin: 0 0 8px 14px; font-size: 12px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--text-ter);
}
.mais-caixa {
  border-radius: 14px; background: var(--elevated);
  border: 1px solid var(--border); overflow: hidden;
}
.mais-linha {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 54px; padding: 0 14px; text-decoration: none;
  color: var(--text); font-size: 16px;
  border-bottom: 1px solid var(--border);
}
.mais-linha:last-child { border-bottom: 0; }
.mais-linha:active { background: rgba(var(--gold-rgb), .10); }
.mais-linha > span { display: flex; align-items: center; gap: 10px; min-width: 0; }
.mais-linha svg:last-child { color: var(--text-ter); flex-shrink: 0; }

.mais-sair {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; min-height: 52px; border-radius: 14px; cursor: pointer; font: inherit;
  font-size: 16px; font-weight: 700;
  border: 1px solid rgba(239, 68, 68, .35); background: rgba(239, 68, 68, .08);
  color: #B91C1C;
}
.mais-rodape {
  text-align: center; font-size: 13px; color: var(--text-ter); padding: 20px 0 6px;
}

/* No computador o menu do lado já mostra tudo: esta página existe para o
   telemóvel, mas se alguém lá chegar não pode estar partida. */
@media (min-width: 768px) {
  .mais { max-width: 640px; }
}
`;
