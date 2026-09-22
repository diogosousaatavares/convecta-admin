import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MbIcon from '@/components/MbIcon';
import { LayoutDashboard, CalendarDays, CalendarRange, Users, Scissors, UserCog, Clock, Settings, Bell, BarChart3, Menu, X, LogOut, Wallet, Package, Megaphone, Star, ChevronDown, DollarSign, Palette, Gift, Repeat, Ticket, ReceiptText, CreditCard, UserPlus, Search, Plus, HelpCircle, Phone, Mail, Send, Smartphone } from 'lucide-react';
import { useAuth, useStore } from '@/hooks/useStore';
import { Modal } from '@/components/ui';

import { moduloIndisponivel } from '@/lib/modulos';
import dataService from '@/lib/dataService';
import { supabase } from '@/lib/supabase';
import TourDemo from '@/components/admin/TourDemo';
import AvisoPush from '@/components/AvisoPush';
import AvisoSubscricao from '@/components/AvisoSubscricao';
import BemVindo from '@/components/BemVindo';
import GuardarNoEcra from '@/components/GuardarNoEcra';
import { vigiarTabelas } from '@/lib/tabelaMobile';

const GROUPS_TODOS = [
  { type: 'item', to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },

  // A area de personalizacao: e daqui que o dono desenha o que os clientes veem.
  { type: 'item', to: '/admin/o-meu-site', label: 'O Meu Site', icon: Palette },
  { type: 'item', to: '/admin/redes-sociais', label: 'Redes sociais', icon: Megaphone },

  { type: 'group', label: 'Agenda', icon: CalendarDays, items: [
    { to: '/admin/agenda', label: 'Agenda', exact: true },
    { to: '/admin/agenda/marcacoes', label: 'Marcações' },
    { to: '/admin/agenda/pack', label: 'Pack mensal' },
    { to: '/admin/agenda/lista-espera', label: 'Lista de Espera' },
    { to: '/admin/agenda/encaixes', label: 'Encaixes' },
    { to: '/admin/agenda/bloqueios', label: 'Bloqueios' }
  ]},

  { type: 'group', label: 'Clientes', icon: Users, items: [
    { to: '/admin/clientes', label: 'Clientes', exact: true },
    { to: '/admin/clientes/aniversarios', label: 'Aniversários' }
  ]},

  { type: 'group', label: 'Profissionais', icon: UserCog, items: [
    { to: '/admin/profissionais', label: 'Profissionais', exact: true },
    { to: '/admin/profissionais/horarios', label: 'Horários' },
    { to: '/admin/profissionais/ferias', label: 'Férias' },
    { to: '/admin/profissionais/comissoes', label: 'Comissões' },
    { to: '/admin/profissionais/desempenho', label: 'Desempenho' },
    { to: '/admin/avaliacoes', label: 'Avaliações' }
  ]},

  { type: 'group', label: 'Serviços', icon: Scissors, items: [
    { to: '/admin/servicos', label: 'Serviços', exact: true },
    { to: '/admin/servicos/categorias', label: 'Categorias' }
  ]},

  { type: 'group', label: 'Inventário', icon: Package, items: [
    { to: '/admin/produtos', label: 'Produtos', exact: true },
    { to: '/admin/produtos/stock', label: 'Stock' },
    { to: '/admin/produtos/movimentos', label: 'Movimentos' },
    { to: '/admin/produtos/fornecedores', label: 'Fornecedores' }
  ]},

  { type: 'group', label: 'Comandas', icon: ReceiptText, items: [
    { to: '/admin/comandas/abertas', label: 'Abertas' },
    { to: '/admin/comandas/pendentes', label: 'Pendentes' },
    { to: '/admin/comandas/pagas', label: 'Pagas' },
    { to: '/admin/comandas/canceladas', label: 'Canceladas' },
    { to: '/admin/comandas/historico', label: 'Histórico' }
  ]},

  // Pagamentos por MB WAY ao marcar: ligar, número, limite do mês e os
  // pagamentos à espera de confirmação.
  // MB WAY com confirmação manual: escondido a 21/09 (dava trabalho a mais
  // ao barbeiro). Volta quando o pagamento se confirmar sozinho.
  // { type: 'item', to: '/admin/mbway', label: 'MB WAY', icon: MbIcon, iconSize: 20 },

  { type: 'group', label: 'Financeiro', icon: Wallet, items: [
    { to: '/admin/financeiro/caixa', label: 'Caixa', exact: true },
    { to: '/admin/financeiro/historico', label: 'Histórico de Caixa' },
    { to: '/admin/financeiro/entradas', label: 'Entradas' },
    { to: '/admin/financeiro/saidas', label: 'Saídas' },
    { to: '/admin/financeiro/receitas', label: 'Receitas' },
    { to: '/admin/financeiro/despesas', label: 'Despesas' },
    { to: '/admin/financeiro/comissoes', label: 'Comissões' },
    { to: '/admin/financeiro/conta-cliente', label: 'Conta de Cliente' },
    { to: '/admin/financeiro/conta-profissional', label: 'Conta de Profissional' },
    { to: '/admin/financeiro/fluxo', label: 'Fluxo de Caixa' }
  ]},

  { type: 'group', label: 'Relatórios', icon: BarChart3, items: [
    { to: '/admin/relatorios', label: 'Resumo', exact: true },
    { to: '/admin/relatorios/marcacoes', label: 'Marcações' },
    { to: '/admin/relatorios/clientes', label: 'Clientes' },
    { to: '/admin/relatorios/profissionais', label: 'Profissionais' },
    { to: '/admin/relatorios/financeiro', label: 'Financeiro' },
    { to: '/admin/relatorios/servicos', label: 'Serviços' },
    { to: '/admin/relatorios/produtos', label: 'Produtos & Stock' },
    { to: '/admin/relatorios/fidelizacao', label: 'Fidelização' }
  ]},

  { type: 'group', label: 'Fidelização', icon: Gift, items: [
    { to: '/admin/fidelizacao/programa', label: 'Cartão de fidelidade' },
  ]},

  { type: 'group', label: 'Packs', icon: Repeat, items: [
    { to: '/admin/packs', label: 'Packs à venda', exact: true },
    { to: '/admin/packs/clientes', label: 'Clientes com pack' },
    { to: '/admin/packs/pedidos', label: 'Pedidos' }
  ]},

  { type: 'group', label: 'Promoções', icon: Ticket, items: [
    { to: '/admin/promocoes', label: 'Promoções', exact: true },
    { to: '/admin/promocoes/cupoes', label: 'Cupões' }
  ]},

  { type: 'group', label: 'Definições', icon: Settings, items: [
    { to: '/admin/definicoes/negocio', label: 'Negócio' },
    { to: '/admin/definicoes/agenda', label: 'Agenda' },
    { to: '/admin/definicoes/profissionais', label: 'Profissionais' },
    { to: '/admin/definicoes/pagamentos', label: 'Pagamentos' },
    { to: '/admin/definicoes/notificacoes', label: 'Notificações' },
    { to: '/admin/definicoes/clientes', label: 'Clientes' },
    { to: '/admin/definicoes/anamnese', label: 'Anamnese' },
    { to: '/admin/definicoes/documentos', label: 'Documentos' },
    { to: '/admin/definicoes/tema', label: 'Tema e Aparência' },
    { to: '/admin/definicoes/utilizadores', label: 'Utilizadores e Permissões' },
    { to: '/admin/definicoes/seguranca', label: 'Segurança' },
    { to: '/admin/definicoes/parametros', label: 'Parâmetros' }
  ]},

  /*
   * A subscricao da barbearia na Convecta — o que ELA nos paga. Nada a ver
   * com o modulo `Assinaturas`, que e o clube que ela vende aos clientes dela.
   *
   * Fica em ultimo de proposito: quem ja paga nunca mais aqui volta. Quem
   * ainda nao pagou nao chega ca por este menu — chega pelo ecra que lhe
   * aparece quando tenta marcar sem cartao.
   */
  { type: 'item', to: '/admin/subscricao', label: 'Subscrição', icon: CreditCard }
];

// Os modulos que ainda nao guardam nada nao aparecem no menu. Um grupo que
// fique sem nenhum item desaparece por inteiro — um cabecalho vazio no menu
// levanta a mesma pergunta que o modulo levantava.
const GROUPS = GROUPS_TODOS
  .map(g => g.items ? { ...g, items: g.items.filter(it => !moduloIndisponivel(it.to)) } : g)
  .filter(g => !g.items || g.items.length > 0);

// Na demonstracao a conta e publica. Se alguem lhe mudar a palavra-passe ou
// apagar utilizadores, tranca a demo a toda a gente ate a proxima reposicao.
export const ESCONDIDOS_EM_DEMO = ['/admin/definicoes/seguranca', '/admin/definicoes/utilizadores'];

// O guia de quem entra na demonstracao como barbeiro. Segue o dia de trabalho:
// a agenda, confirmar, cobrar, o cliente, e o fim do mes.
const PASSOS_DEMO = [
  { rota: '/admin/agenda', alvo: 'agenda', titulo: 'A tua agenda',
    texto: 'Cada coluna é um barbeiro. As marcações que os clientes fazem pelo site entram aqui sozinhas — e o telemóvel toca.' },
  { rota: '/admin/agenda', alvo: 'agenda-vistas', titulo: 'Confirmar em dois toques',
    texto: 'Uma marcação nova chega como Pendente. Um toque nela, outro em Confirmar — e o cliente recebe aviso no telemóvel. Quem preferir liga a confirmação automática e nem isso é preciso.' },
  { rota: '/admin/financeiro/caixa', alvo: 'caixa', titulo: 'Cobrar',
    texto: 'No fim do serviço, checkout: método de pagamento, desconto se houver, gorjeta. A comissão do barbeiro e o carimbo do cliente ficam feitos no mesmo toque.' },
  { rota: '/admin/clientes', alvo: 'clientes', titulo: 'Os teus clientes',
    texto: 'Histórico, o que gastaram, quantos carimbos têm. Quem chega ao décimo corte tem o próximo grátis — e tu vês isso antes de ele entrar pela porta.' },
  { rota: '/admin/relatorios', alvo: 'relatorio', titulo: 'O fim do mês',
    texto: 'Escolhes o mês e descarregas um Excel pronto para o contabilista. Acabou o saco de talões.' },
  { rota: '/admin', alvo: 'atualizar', titulo: 'É isto',
    texto: 'Agora é teu: marca, confirma, cobra, experimenta tudo. O que fizeres aqui desaparece de hora a hora. Quando quiseres isto para a tua barbearia, fala connosco.' },
];
/*
 * A visita guiada de quem JÁ PAGOU.
 *
 * Não é a da demonstração. A da demonstração acaba em «fala connosco» e avisa
 * que tudo desaparece de hora a hora — dizer isso a quem acabou de dar o
 * cartão era estragar o melhor momento que ele vai ter connosco.
 *
 * Esta arranca sozinha no segundo a seguir ao pagamento, porque é aí que a
 * vontade está toda: a agenda acabou de abrir e ele quer ver o que comprou.
 * Uma hora depois já fechou o separador.
 *
 * Seis passos, e a ordem é a do trabalho dele, não a do nosso menu: primeiro o
 * que vai partilhar, depois o que tem de confirmar, e só no fim onde as
 * marcações caem. O último passo devolve-lhe o endereço — é a única coisa que
 * ele tem mesmo de fazer hoje.
 */
const PASSOS_BARBEIRO = [
  { rota: '/admin', alvo: 'link-barbearia', titulo: 'Este é o teu endereço',
    texto: 'O site da tua barbearia já está no ar. É este link que vais pôr no Instagram e mandar aos clientes — copia-se com um toque.' },
  { rota: '/admin/servicos', alvo: 'servicos', titulo: 'Confirma os teus preços',
    texto: 'Criámos alguns serviços para arrancares. Apaga os que não fazes, muda os preços e a duração de cada um — a duração é o que decide as horas que o cliente vê.' },
  { rota: '/admin/horarios', alvo: 'horarios', titulo: 'A que horas abres',
    texto: 'Põe o horário real da barbearia e os dias de folga. Fora disto ninguém consegue marcar.' },
  { rota: '/admin/o-meu-site', alvo: 'meu-site', titulo: 'Põe a tua cara',
    texto: 'Logótipo, cores, capa e fotos. Mudas aqui e vês o resultado num telemóvel, ao lado, antes de publicar.' },
  { rota: '/admin/definicoes/notificacoes', alvo: 'notificacoes', titulo: 'Para o telemóvel tocar',
    texto: 'Liga as notificações neste telemóvel. É assim que sabes de uma marcação no segundo em que ela entra — sem abrir nada.' },
  { rota: '/admin/agenda', alvo: 'agenda', titulo: 'É aqui que elas caem',
    texto: 'Cada coluna é um barbeiro. Agora falta uma coisa só: partilhar o teu link. Sem isso a agenda fica bonita e vazia.' },
];

function gruposPara(demo) {
  if (!demo) return GROUPS;
  return GROUPS
    .map(g => g.items ? { ...g, items: g.items.filter(it => !ESCONDIDOS_EM_DEMO.includes(it.to)) } : g)
    .filter(g => !g.items || g.items.length > 0);
}

export default function AdminLayout({ children }) {
  const data = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const emDemo = data.business?._settings?.demo?.ativo === true;

  /*
   * A visita arranca quando ele passa a ter subscricao e ainda nao a viu.
   * Como isso acontece no instante em que o Stripe o devolve ao painel, o
   * efeito pratico e: paga, volta, e o guia comeca.
   *
   * A pergunta ao localStorage vem PRIMEIRO de proposito: depois de a visita
   * estar feita, isto nunca mais toca na rede — e este componente volta a
   * montar-se a cada mudanca de pagina.
   */
  const [visitaBarbeiro, setVisitaBarbeiro] = useState(false);
  useEffect(() => {
    let vivo = true;
    try { if (localStorage.getItem('convecta_visita_barbeiro') === 'feito') return; } catch { /* sem memoria: mostra-se */ }
    (async () => {
      try {
        const s = await dataService.subscricao();
        if (!vivo) return;
        if (s && ['em_teste', 'activa', 'gratis'].includes(s.estado)) setVisitaBarbeiro(true);
      } catch { /* sem subscricao legivel, nao se comeca nada */ }
    })();
    return () => { vivo = false; };
  }, []);
  const grupos = gruposPara(emDemo);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' });
  const [supportEstado, setSupportEstado] = useState('');   // '' | 'a-enviar' | 'enviado'
  const searchRef = useRef(null);
  const zonaConteudo = useRef(null);

  // Telemovel: as tabelas viram cartoes e precisam do nome da coluna em cada celula.
  useEffect(() => vigiarTabelas(zonaConteudo.current), []);


  const isActive = (it) => {
    if (it.exact) return location.pathname === it.to;
    if (it.to.includes('?')) {
      const [path, query] = it.to.split('?');
      const params = new URLSearchParams(query);
      return location.pathname === path && location.search.includes(`tab=${params.get('tab')}`);
    }
    return location.pathname.startsWith(it.to);
  };

  const initialExpanded = useMemo(() => {
    const exp = {};
    GROUPS.forEach((g, i) => { if (g.type === 'group' && g.items.some(isActive)) exp[i] = true; });
    return exp;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggle = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  const handleLogout = async () => { await logout(); navigate('/entrar'); };
  /*
   * O pedido vai direto para o suporte da Convecta (fica registado e chega
   * como notificação ao telemóvel do Diogo). Se por algum motivo não der —
   * sem rede, SQL por correr — abre o email como antes, para nunca se perder.
   */
  const handleSupportSubmit = async (event) => {
    event.preventDefault();
    setSupportEstado('a-enviar');
    const { error } = await supabase.rpc('pedir_suporte', {
      p_mensagem: supportForm.message, p_nome: supportForm.name, p_email: supportForm.email,
    });
    if (!error) {
      setSupportEstado('enviado');
      setSupportForm(form => ({ ...form, message: '' }));
      return;
    }
    setSupportEstado('');
    const subject = encodeURIComponent(`Problema no painel Convecta${supportForm.name ? ` - ${supportForm.name}` : ''}`);
    const body = encodeURIComponent(`Nome: ${supportForm.name}\nEmail: ${supportForm.email}\n\nProblema:\n${supportForm.message}`);
    window.location.href = `mailto:geral@convecta.pt?subject=${subject}&body=${body}`;
  };
  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 2) return [];
    const customers = data.customers
      .filter(c => c.name.toLowerCase().includes(normalizedQuery) || c.email.toLowerCase().includes(normalizedQuery))
      .map(c => ({ id: c.id, name: c.name, detail: c.email, type: 'cliente', to: '/admin/clientes' }));
    const services = data.services
      .filter(s => s.name.toLowerCase().includes(normalizedQuery))
      .map(s => ({ id: s.id, name: s.name, detail: 'Serviço', type: 'serviço', to: '/admin/servicos' }));
    return [...customers, ...services].slice(0, 6);
  }, [data.customers, data.services, query]);
  const unreadNotifications = (data.notifications || []).filter(n => n.read === false).length;
  // Quantas marcacoes esperam resposta. E o unico numero que o barbeiro
  // precisa de ver de relance, esteja em que pagina estiver.
  const porConfirmar = (data.appointments || []).filter(a => a.status === 'pending' && !a.blocked).length;
  const userInitials = (user?.name || user?.email || 'U').split(/\s+/).filter(Boolean).slice(0, 2).map(value => value[0]).join('').toUpperCase();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const active = document.querySelector('.nav-sub-item.active, .admin-nav-item.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [location.pathname]);

  const selectSearchResult = (result) => {
    setQuery('');
    setSearchOpen(false);
    navigate(result.to);
  };

  const sidebar = (
    <>
      <div className="admin-sidebar-head">
        <div className="logo">Convecta<span style={{ color: '#C9A227' }}>.</span></div>
        <div className="sub">Painel de gestão</div>
      </div>
      <nav className="admin-nav">
        {grupos.map((g, i) => {
          if (g.type === 'item') {
            const Icon = g.icon;
            return (
              <Link key={g.to} to={g.to} className={`admin-nav-item ${isActive(g) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                <Icon size={g.iconSize || 18} /> {g.label}
              </Link>
            );
          }
          const isExp = !!expanded[i];
          return (
            <div className="nav-group" key={g.label}>
              <button
                className={`nav-group-head ${isExp ? 'open' : ''}`}
                onClick={() => toggle(i)}
                aria-label={`${isExp ? 'Fechar' : 'Abrir'} menu ${g.label}`}
                aria-expanded={isExp}
              >
                {g.icon ? <g.icon size={15} style={{ color: '#C9A227' }} /> : <span className="chev">»</span>}
                {g.label}
                <ChevronDown size={14} className="arrow" />
              </button>
              {isExp && (
                <div className="nav-sub">
                  {g.items.map(it => (
                    <Link key={it.to} to={it.to} className={`nav-sub-item ${isActive(it) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                      <span className="bullet" />
                      {it.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <button className="admin-support-link" onClick={() => setSupportOpen(true)} aria-label="Abrir apoio ao cliente">
        <HelpCircle size={16} /> Apoio ao cliente
      </button>
      <div style={{ padding: '16px 24px', borderTop: '1px solid #243036' }}>
        
        <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout} aria-label="Terminar sessão">
          <LogOut size={16} /> Terminar sessão
        </button>
      </div>
    </>
  );

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`admin-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>{sidebar}</aside>
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }} />}
      <Modal open={supportOpen} onClose={() => setSupportOpen(false)} title="Apoio ao cliente">
        <div className="support-contact-list">
          <a href="tel:+351914874725" className="support-contact"><Phone size={17} /> <span><strong>Ligar</strong><small>914 874 725</small></span></a>
          <a href="mailto:geral@convecta.pt" className="support-contact"><Mail size={17} /> <span><strong>Email</strong><small>geral@convecta.pt</small></span></a>
        </div>
        <p className="text-sec text-sm" style={{ marginBottom: 16 }}>Encontraste um erro? Envia-nos os detalhes e entraremos em contacto.</p>
        <form onSubmit={handleSupportSubmit}>
          <div className="field">
            <label className="label" htmlFor="support-name">Nome</label>
            <input id="support-name" className="input" value={supportForm.name} onChange={event => setSupportForm(form => ({ ...form, name: event.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="support-email">Email</label>
            <input id="support-email" type="email" required className="input" value={supportForm.email} onChange={event => setSupportForm(form => ({ ...form, email: event.target.value }))} />
          </div>
          <div className="field">
            <label className="label" htmlFor="support-message">Descreve o problema</label>
            <textarea id="support-message" required className="input" rows="4" value={supportForm.message} onChange={event => setSupportForm(form => ({ ...form, message: event.target.value }))} />
          </div>
          {supportEstado === 'enviado' && (
            <p className="text-sm" style={{ color: '#22C55E', margin: '0 0 12px' }}>Pedido enviado. A Convecta já foi avisada e responde-te o mais depressa possível.</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={supportEstado === 'a-enviar'}>
            <Send size={16} /> {supportEstado === 'a-enviar' ? 'A enviar…' : 'Enviar pedido'}
          </button>
        </form>
      </Modal>
      <main className="admin-content" ref={zonaConteudo}>
        {emDemo && <TourDemo passos={PASSOS_DEMO} chave="convecta_tour_painel" />}
        {/* Nunca as duas: numa barbearia de demonstracao manda a da demonstracao. */}
        {!emDemo && <TourDemo passos={PASSOS_BARBEIRO} chave="convecta_visita_barbeiro" ativo={visitaBarbeiro} />}
        {emDemo && (
          <div style={{
            background: 'var(--gold)', color: '#100E0B', fontSize: 13, fontWeight: 700,
            textAlign: 'center', padding: '7px 12px', borderRadius: 8, marginBottom: 14,
          }}>
            Demonstração — mexe à vontade. Os dados voltam ao início de hora a hora.
          </div>
        )}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="btn btn-ghost btn-icon admin-topbar-hamburger" onClick={() => {
              if (window.matchMedia('(max-width: 767px)').matches) setOpen(!open);
              else setCollapsed(value => !value);
            }} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} aria-expanded={!collapsed}>
              <Menu size={20} />
            </button>
            {data.business?.logo
              ? <img className="admin-topbar-logo" src={data.business.logo} alt={data.business.name} style={{ height: 30, width: 'auto', maxWidth: 140, objectFit: 'contain' }} />
              : <span className="fw-600">{data.business?.name || 'Convecta'}</span>
            }
            <div className="admin-search-wrap" ref={searchRef}>
              <Search className="admin-search-icon" size={16} />
              <input className="admin-search-input" value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Pesquisar clientes ou serviços..." aria-label="Pesquisa global" />
              {searchOpen && query.trim().length >= 2 && <div className="admin-search-dropdown">
                {searchResults.length === 0 ? <div className="admin-search-empty">Sem resultados</div> : searchResults.map(result => (
                  <button key={`${result.type}-${result.id}`} className="admin-search-result" onClick={() => selectSearchResult(result)}>
                    <span className="flex-1" style={{ textAlign: 'left' }}><strong>{result.name}</strong><small>{result.detail}</small></span>
                    <span className="admin-search-badge">{result.type}</span>
                  </button>
                ))}
              </div>}
            </div>
          </div>
          <div className="admin-topbar-right">
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('/admin/marcacoes')}
              title={porConfirmar ? `${porConfirmar} por confirmar` : 'Marcações'}
              aria-label={porConfirmar ? `${porConfirmar} marcações por confirmar` : 'Marcações'}
              style={{ position: 'relative' }}>
              <Bell size={16} />
              {porConfirmar > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 15, height: 15,
                  padding: '0 4px', borderRadius: 8, background: '#C9A227', color: '#100D08',
                  fontSize: 10, fontWeight: 700, lineHeight: '15px', textAlign: 'center' }}>
                  {porConfirmar > 9 ? '9+' : porConfirmar}
                </span>
              )}
            </button>
            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">{(user?.name || user?.email || 'A').charAt(0).toUpperCase()}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Terminar sessão" aria-label="Terminar sessão">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {/* As notificacoes pedem-se em todas as paginas, nao so na de
            Marcacoes: quem entra na Agenda e fica por la nunca era sequer
            perguntado — e ficava sem campainha nenhuma. */}
        {/* Pedir para ligar: em todas as paginas. A linha "ligadas, testar":
            so no Dashboard, e so uma vez por dia — em Definicoes esta sempre. */}
        {location.pathname !== '/admin/subscricao' && <AvisoPush businessId={data.business?.id} userId={user?.id} papel="admin" comTeste={location.pathname === '/admin'} />}
        {/* A subscricao vem DEPOIS das notificacoes de proposito: a campainha
            e o que faz o produto funcionar no primeiro dia; o cartao e o que
            o faz durar. Por esta ordem, e nao ao contrario. Na propria pagina
            da subscricao a faixa nao aparece — seria dizer-lhe para ir onde
            ja esta. */}
        {location.pathname !== '/admin/subscricao' && <AvisoSubscricao />}
        {/* A primeira entrada: tres ecras a ocupar o ecra inteiro, uma vez
            por barbearia. Depois disso e a faixa de cima que lembra. */}
        <BemVindo />
        {/* Depois do Bem-vindo: no telemóvel, ensina a guardar o painel no
            ecrã principal — sem isso, no iPhone não há notificações. */}
        <GuardarNoEcra />
        {children}
      </main>
    </div>
  );
}
