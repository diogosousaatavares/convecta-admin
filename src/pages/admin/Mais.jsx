import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LogOut, Wallet, Rocket, CreditCard, Bell, LifeBuoy, PlaySquare, Check, MessageCircle, Phone, Gift, Puzzle } from 'lucide-react';
import AdminLayout, { gruposPara, caminhoDaSeccao } from '@/components/AdminLayout';
import Caixas, { CSS_CAIXAS } from '@/components/admin/Caixas';
import { useStore, useAuth } from '@/hooks/useStore';
import { Avatar, Modal } from '@/components/ui';
import AvisoPush from '@/components/AvisoPush';
import { listConvectaNotifs } from '@/lib/convectaNotifs';
import { IDIOMAS, lerIdioma, mudarIdioma } from '@/lib/idioma';
import LinkDaBarbearia from '@/components/LinkDaBarbearia';
import { n as nicho } from '@/lib/nicho';

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
  // Modo demo do PAINEL desligado (20/10/2026): a demonstração passou a ser só
  // do lado do cliente (demonstracao.marcacoes.app). No painel, a barbearia da
  // demo comporta-se como qualquer outra — sem tutorial, sem banner, menu normal.
  const emDemo = false;
  const grupos = gruposPara(emDemo, data.isProfissional);

  /* As secções do menu, em caixas (15/10/2026, à Fresha). As que estão na
     barra de baixo não se repetem aqui. */
  const naBarra = new Set(['/admin/agenda', '/admin/seccao/vendas', '/admin/clientes', '/admin/seccao/catalogo']);
  const caixas = grupos
    .map(g => ({ to: g.type === 'group' ? caminhoDaSeccao(g) : g.to, label: g.label, icon: g.icon, d: g.d }))
    .filter(c => !naBarra.has(c.to));

  /* A Agenda e os Clientes, na barra, abrem a PÁGINA (a agenda, a lista) e
     não a secção. As irmãs — Marcações, Orçamentos, Lista de espera,
     Encaixes, Bloqueios, Aniversários, Avaliações — ficavam sem porta no
     telemóvel (auditoria de 16/10/2026). Entram aqui, cada uma com a sua
     caixa, logo à frente. */
  /* 18/10/2026 (o «Mais» da Fresha): em vez de cada página irmã numa linha
     comprida, a Agenda e os Clientes entram como secção — tocar mostra as
     páginas delas (Marcações, Orçamentos, Espera, Encaixes, Bloqueios;
     Aniversários, Avaliações). */
  const comoSeccao = grupos
    .filter(g => g.type === 'group' && g.to && naBarra.has(g.to) && (g.items || []).some(it => it.to && !it.titulo && it.to !== g.to))
    .map(g => ({ to: `/admin/seccao/${g.id}`, label: g.label, icon: g.icon }));
  caixas.splice(caixas.length && caixas[0].to === '/admin/dashboard' ? 1 : 0, 0, ...comoSeccao);
  // A conta do profissional (comissões e gorjetas) não está em nenhuma secção.
  if (data.isProfissional) caixas.push({ to: '/admin/financeiro/conta-profissional', label: 'A minha conta', icon: Wallet, d: 'Comissões e gorjetas.' });
  // Suplementos (19/10/2026): os extras, no lugar vazio ao lado das Definições.
  if (!data.isProfissional) caixas.push({ to: '/admin/suplementos', label: 'Suplementos', icon: Puzzle, d: 'Pagamentos online e mais.' });

  const nome = data.business?.name || nicho().Casa;

  /* O fundo do «Mais», à Fresha (18/10/2026): a conta e a ajuda numa só
     caixa — idioma, notícias da Convecta, subscrição, notificações da app,
     apoio e guias. */
  const idiomaAtual = IDIOMAS.find(l => l.id === lerIdioma()) || IDIOMAS[0];
  const [novas, setNovas] = useState(0);
  const [ver, setVer] = useState(null);   // 'idioma' | 'push' | 'apoio'
  useEffect(() => { listConvectaNotifs().then(l => setNovas(l.filter(n => !n.read).length)).catch(() => {}); }, []);
  const linhaBotao = (Icone, rotulo, onClick, valor) => (
    <button type="button" className="mais-linha" onClick={onClick}>
      <span>{Icone}{rotulo}</span>{valor}<ChevronRight size={18} />
    </button>
  );

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS + CSS_CAIXAS }} />
      <div className="mais">

        <header className="mais-topo">
          {data.business?.logoUrl
            ? <img className="mais-logo" src={data.business.logoUrl} alt="" />
            : <Avatar name={nome} size="lg" />}
          <div className="mais-nome">{nome}</div>
          {data.business?.founder && <span className="founder-selo mais-founder" title="Fazes parte do Programa Founders da Convecta">Founder</span>}
          {user?.email && <div className="mais-email">{user.email}</div>}
          {/* O link do site vive aqui, por baixo do email: e o sitio onde se
              vai buscar a conta e a casa. No «O meu site» ocupava a primeira
              linha do ecra a uma coisa que se copia uma vez. */}
          <div className="mais-link"><LinkDaBarbearia /></div>
        </header>

        <section className="mais-bloco"><Caixas itens={caixas} colunas={2} azulejos /></section>

        {!data.isProfissional && (
          <Link to="/admin/indicacoes" className="mais-cartaz" aria-label="Ganha 40 € ao convidar um amigo">
            <img src="/indicacoes/ganha-40-amigo.jpg" srcSet="/indicacoes/ganha-40-amigo-640.jpg 640w, /indicacoes/ganha-40-amigo.jpg 1280w" sizes="(max-width: 700px) 100vw, 560px" alt="Ganha 40 € ao convidar um amigo" />
          </Link>
        )}

        <section className="mais-bloco">
          <div className="mais-caixa">
            {linhaBotao(<span className="mais-bandeira">{idiomaAtual.bandeira}</span>, idiomaAtual.nome, () => setVer('idioma'))}
            <Link className="mais-linha" to="/admin/noticias">
              <span><Rocket size={19} />Notícias</span>{novas > 0 && <i className="mais-novas">{novas}</i>}<ChevronRight size={18} />
            </Link>
            {!data.isProfissional && (
              <Link className="mais-linha" to="/admin/subscricao">
                <span><CreditCard size={19} />A minha subscrição</span><ChevronRight size={18} />
              </Link>
            )}
            {linhaBotao(<Bell size={19} />, 'Notificações da app', () => setVer('push'))}
            {linhaBotao(<LifeBuoy size={19} />, 'Ajuda e apoio', () => setVer('apoio'))}
            <a className="mais-linha" href={CANAL_YOUTUBE} target="_blank" rel="noreferrer">
              <span><PlaySquare size={19} />Guias em vídeo</span><ChevronRight size={18} />
            </a>
          </div>
        </section>

        <Modal open={ver === 'idioma'} onClose={() => setVer(null)} title="Idioma">
          {/* Os nomes dos idiomas não se traduzem: cada um no seu. */}
          <div className="mais-caixa" data-sem-traduzir="">
            {IDIOMAS.map(l => (
              <button key={l.id} type="button" className="mais-linha" onClick={() => (l.id === idiomaAtual.id ? setVer(null) : mudarIdioma(l.id))}>
                <span><span className="mais-bandeira">{l.bandeira}</span>{l.nome}</span>
                {l.id === idiomaAtual.id ? <Check size={18} /> : <span />}
              </button>
            ))}
          </div>
        </Modal>
        <Modal open={ver === 'push'} onClose={() => setVer(null)} title="Notificações da app">
          <AvisoPush businessId={data.business?.id} userId={user?.id} papel="admin" comTeste sempre />
        </Modal>
        <Modal open={ver === 'apoio'} onClose={() => setVer(null)} title="Ajuda e apoio">
          <div className="mais-caixa">
            <a className="mais-linha" href={'https://wa.me/351914874725?text=' + encodeURIComponent(`Olá! Sou da ${nome} e tenho uma dúvida.`)} target="_blank" rel="noreferrer">
              <span><MessageCircle size={19} />WhatsApp</span><ChevronRight size={18} />
            </a>
            <a className="mais-linha" href="tel:+351914874725">
              <span><Phone size={19} />Ligar · 914 874 725</span><ChevronRight size={18} />
            </a>
            <a className="mais-linha" href="mailto:geral@convecta.pt">
              <span><span className="mais-arroba">@</span>geral@convecta.pt</span><ChevronRight size={18} />
            </a>
          </div>
        </Modal>

        <button type="button" className="mais-sair" onClick={logout}>
          <LogOut size={17} /> Terminar sessão
        </button>

        <div className="mais-rodape">Convecta</div>
      </div>
    </AdminLayout>
  );
}

/* O canal de YouTube com os guias. Enquanto não houver o endereço do
   canal, abre o vídeo da Convecta que já existe. */
const CANAL_YOUTUBE = 'https://www.youtube.com/watch?v=96XY7C_AlTQ';

const CSS = `
.mais-cartaz { display: block; margin: 8px 0 22px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.18); }
.mais-cartaz img { display: block; width: 100%; height: auto; }
.mais { width: 100%; max-width: 560px; min-width: 0; margin: 0 auto; box-sizing: border-box; }
.mais-topo, .mais-bloco, .mais-caixa, .mais-link { min-width: 0; max-width: 100%; }

.mais-topo { text-align: center; padding: 6px 0 26px; }
.mais-logo {
  width: 72px; height: 72px; border-radius: 999px; object-fit: contain;
  background: var(--elevated); border: 1px solid var(--border);
  display: block; margin: 0 auto 12px; padding: 6px;
}
.mais-topo .avatar { margin: 0 auto 12px; }
.mais-nome { font-size: 20px; font-weight: 700; }
.mais-founder { display: inline-block; margin-top: 8px; }
.mais-email { font-size: 14px; color: var(--text-sec); margin-top: 3px; word-break: break-all; }
.mais-link { margin-top: 16px; text-align: left; }
.mais-link .link-faixa { width: 100% !important; max-width: 100% !important; margin: 0 !important; box-sizing: border-box;
  border-radius: 14px; border: 1px solid var(--border); background: var(--surface); padding: 6px 6px 6px 16px !important; gap: 6px !important; }
.mais-link .link-faixa-endereco { font-size: 15px; flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mais-link .link-faixa-btn, .mais-link .link-faixa-ico { flex-shrink: 0; }
.mais-link .link-faixa-btn, .mais-link .link-faixa-ico { width: 40px; height: 40px; min-height: 40px; padding: 0 !important; justify-content: center; border-radius: 12px; }
.mais-link .link-faixa-btn { background: var(--text); color: var(--surface); }
.mais-link .link-faixa-ico { border-color: var(--border); color: var(--text); }

.mais-bloco { margin-bottom: 22px; }
/* O cabeçalho fica FORA da caixa, como nas listas do telemóvel: lá dentro
   leria-se como mais uma linha da lista. */
.mais-h {
  margin: 0 0 8px 14px; font-size: 12px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--text-ter);
}
.mais-caixa {
  border-radius: var(--radius-card); background: var(--elevated);
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
button.mais-linha { width: 100%; background: none; border: 0; border-bottom: 1px solid var(--border); font: inherit; cursor: pointer; text-align: left; }
.mais-caixa > .mais-linha:last-child { border-bottom: 0; }
.mais-linha > span { gap: 16px !important; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mais-linha > span > svg { flex-shrink: 0; color: var(--text) !important; }
.mais-bandeira { font-size: 19px; line-height: 1; width: 19px; text-align: center; }
.mais-arroba { width: 19px; text-align: center; font-weight: 700; }
.mais-novas { font-style: normal; min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; background: var(--gold); color: #111; font-size: 12.5px; font-weight: 700; display: inline-grid; place-items: center; flex-shrink: 0; }
.mais-linha { min-height: 58px; }

.mais-sair {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  width: 100%; min-height: 52px; border-radius: var(--radius-card); cursor: pointer; font: inherit;
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
