import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CalendarRange, Users, Scissors, UserCog, Clock, Settings, Bell, BarChart3, Menu, X, LogOut, Wallet, Package, Megaphone, Star, ChevronDown, DollarSign, Gift, Repeat, Ticket, ReceiptText, UserPlus, Search, Plus, HelpCircle, Phone, Mail, Send } from 'lucide-react';
import { useAuth, useStore } from '@/hooks/useStore';
import { Modal } from '@/components/ui';

import { moduloIndisponivel } from '@/lib/modulos';

const GROUPS_TODOS = [
  { type: 'item', to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },

  { type: 'group', label: 'Agenda', icon: CalendarDays, items: [
    { to: '/admin/agenda', label: 'Agenda', exact: true },
    { to: '/admin/agenda/marcacoes', label: 'Marcações' },
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
    { to: '/admin/profissionais/comissoes', label: 'Comissões' },
    { to: '/admin/profissionais/desempenho', label: 'Desempenho' }
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
    { to: '/admin/relatorios/fidelizacao', label: 'Fidelização' },
    { to: '/admin/relatorios/subscricoes', label: 'Subscrições' }
  ]},

  { type: 'group', label: 'Fidelização', icon: Gift, items: [
    { to: '/admin/fidelizacao/programa', label: 'Programa' },
    { to: '/admin/fidelizacao/pontos', label: 'Pontos' },
    { to: '/admin/fidelizacao/recompensas', label: 'Recompensas' },
    { to: '/admin/fidelizacao/cartao', label: 'Cartão de Visitas' }
  ]},

  { type: 'group', label: 'Subscrições', icon: Repeat, items: [
    { to: '/admin/subscricoes/planos', label: 'Planos' },
    { to: '/admin/subscricoes/subscritores', label: 'Subscritores' },
    { to: '/admin/subscricoes/pagamentos', label: 'Pagamentos' },
    { to: '/admin/subscricoes/utilizacao', label: 'Utilização' },
    { to: '/admin/subscricoes/atraso', label: 'Em Atraso' }
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
  ]}
];

// Os modulos que ainda nao guardam nada nao aparecem no menu. Um grupo que
// fique sem nenhum item desaparece por inteiro — um cabecalho vazio no menu
// levanta a mesma pergunta que o modulo levantava.
const GROUPS = GROUPS_TODOS
  .map(g => g.items ? { ...g, items: g.items.filter(it => !moduloIndisponivel(it.to)) } : g)
  .filter(g => !g.items || g.items.length > 0);

export default function AdminLayout({ children }) {
  const data = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' });
  const searchRef = useRef(null);

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
  const handleSupportSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Problema no painel Convecta${supportForm.name ? ` - ${supportForm.name}` : ''}`);
    const body = encodeURIComponent(`Nome: ${supportForm.name}\nEmail: ${supportForm.email}\n\nProblema:\n${supportForm.message}`);
    window.location.href = `mailto:geral@convceta.pt?subject=${subject}&body=${body}`;
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
        {GROUPS.map((g, i) => {
          if (g.type === 'item') {
            const Icon = g.icon;
            return (
              <Link key={g.to} to={g.to} className={`admin-nav-item ${isActive(g) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                <Icon size={18} /> {g.label}
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
          <a href="tel:912381717" className="support-contact"><Phone size={17} /> <span><strong>Ligar</strong><small>912 381 717</small></span></a>
          <a href="mailto:geral@convceta.pt" className="support-contact"><Mail size={17} /> <span><strong>Email</strong><small>geral@convceta.pt</small></span></a>
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
          <button type="submit" className="btn btn-primary"><Send size={16} /> Enviar email</button>
        </form>
      </Modal>
      <main className="admin-content">
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
        {children}
      </main>
    </div>
  );
}
