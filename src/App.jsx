import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/ui/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import PageNotFound from '@/lib/PageNotFound';
import LoginPage from '@/pages/LoginPage';
import ReporSenha from '@/pages/ReporSenha';
import authService from '@/lib/authService';
import dataService from '@/lib/dataService';
import { useStore, useAuth } from '@/hooks/useStore';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

function applySavedTheme(colors) {
  let style = document.getElementById('convecta-theme');
  if (!style) { style = document.createElement('style'); style.id = 'convecta-theme'; document.head.appendChild(style); }
  style.textContent = `:root { ${Object.entries(colors).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
}

// Lazy-load all admin pages
const Dashboard        = lazy(() => import('@/pages/admin/Dashboard'));
const Agenda           = lazy(() => import('@/pages/admin/Agenda'));
const AdminAppointments= lazy(() => import('@/pages/admin/AdminAppointments'));
const Customers        = lazy(() => import('@/pages/admin/Customers'));
const Services         = lazy(() => import('@/pages/admin/Services'));
const Professionals    = lazy(() => import('@/pages/admin/Professionals'));
const Hours            = lazy(() => import('@/pages/admin/Hours'));
const Settings         = lazy(() => import('@/pages/admin/Settings'));
const Notifications    = lazy(() => import('@/pages/admin/Notifications'));
const Reports          = lazy(() => import('@/pages/admin/Reports'));
const Cash             = lazy(() => import('@/pages/admin/Cash'));
const Inventory        = lazy(() => import('@/pages/admin/Inventory'));
const Marketing        = lazy(() => import('@/pages/admin/Marketing'));
const Reviews          = lazy(() => import('@/pages/admin/Reviews'));
const Tipos            = lazy(() => import('@/pages/admin/Tipos'));
const Financeiro       = lazy(() => import('@/pages/admin/Financeiro'));
const Comandas         = lazy(() => import('@/pages/admin/Comandas'));
const AgendaWaitlist   = lazy(() => import('@/pages/admin/AgendaWaitlist'));
const AgendaFitIns     = lazy(() => import('@/pages/admin/AgendaFitIns'));
const AgendaBlocks     = lazy(() => import('@/pages/admin/AgendaBlocks'));
const ClientBirthdays  = lazy(() => import('@/pages/admin/ClientBirthdays'));
const ProSchedules     = lazy(() => import('@/pages/admin/ProSchedules'));
const ProCommissions   = lazy(() => import('@/pages/admin/ProCommissions'));
const ProPerformance   = lazy(() => import('@/pages/admin/ProPerformance'));
const ServiceCategories= lazy(() => import('@/pages/admin/ServiceCategories'));
const ProductStock     = lazy(() => import('@/pages/admin/ProductStock'));
const ProductMovements = lazy(() => import('@/pages/admin/ProductMovements'));
const Suppliers        = lazy(() => import('@/pages/admin/Suppliers'));
const FinCashHistory   = lazy(() => import('@/pages/admin/finance/FinCashHistory'));
const FinIncome        = lazy(() => import('@/pages/admin/finance/FinIncome'));
const FinExpenseMoves  = lazy(() => import('@/pages/admin/finance/FinExpenseMoves'));
const FinRevenue       = lazy(() => import('@/pages/admin/finance/FinRevenue'));
const FinExpenses      = lazy(() => import('@/pages/admin/finance/FinExpenses'));
const FinCommissions   = lazy(() => import('@/pages/admin/finance/FinCommissions'));
const FinCustomerAccount = lazy(() => import('@/pages/admin/finance/FinCustomerAccount'));
const FinProAccount    = lazy(() => import('@/pages/admin/finance/FinProAccount'));
const FinCashFlow      = lazy(() => import('@/pages/admin/finance/FinCashFlow'));
const RepAppointments  = lazy(() => import('@/pages/admin/reports/RepAppointments'));
const RepClients       = lazy(() => import('@/pages/admin/reports/RepClients'));
const RepProfessionals = lazy(() => import('@/pages/admin/reports/RepProfessionals'));
const RepFinance       = lazy(() => import('@/pages/admin/reports/RepFinance'));
const RepServices      = lazy(() => import('@/pages/admin/reports/RepServices'));
const RepProducts      = lazy(() => import('@/pages/admin/reports/RepProducts'));
const RepLoyalty       = lazy(() => import('@/pages/admin/reports/RepLoyalty'));
const RepSubscriptions = lazy(() => import('@/pages/admin/reports/RepSubscriptions'));
const FidelizacaoPrograma   = lazy(() => import('@/pages/admin/FidelizacaoPrograma'));
const FidelizacaoPontos     = lazy(() => import('@/pages/admin/FidelizacaoPontos'));
const FidelizacaoRecompensas= lazy(() => import('@/pages/admin/FidelizacaoRecompensas'));
const LoyaltyCard       = lazy(() => import('@/pages/admin/LoyaltyCard'));
const Subscricoes      = lazy(() => import('@/pages/admin/Subscricoes'));
const Coupons          = lazy(() => import('@/pages/admin/Coupons'));
const Definicoes       = lazy(() => import('@/pages/admin/Definicoes'));
const AnamneseForms    = lazy(() => import('@/pages/admin/AnamneseForms'));
const Parametros       = lazy(() => import('@/pages/admin/Parametros'));
const TemaPersonalizacao = lazy(() => import('@/pages/admin/TemaPersonalizacao'));

const Spinner = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner" />
  </div>
);

function AdminRoute({ children }) {
  const store = useStore();
  const businessId = store?.business?.id;
  useRealtimeNotifications(businessId);
  const { isAuthLoading, isAdmin } = useAuth();
  if (isAuthLoading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/entrar" replace />;
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}

function AppRoutes() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: isAdminPage ? 28 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isAdminPage ? 0.34 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <Routes location={location}>
        <Route path="/entrar" element={<LoginPage adminOnly />} />
        <Route path="/repor-senha" element={<ReporSenha />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin com layout */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/agenda" element={<AdminRoute><Agenda /></AdminRoute>} />
        <Route path="/admin/agenda/marcacoes" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
        <Route path="/admin/agenda/lista-espera" element={<AdminRoute><AgendaWaitlist /></AdminRoute>} />
        <Route path="/admin/agenda/encaixes" element={<AdminRoute><AgendaFitIns /></AdminRoute>} />
        <Route path="/admin/agenda/bloqueios" element={<AdminRoute><AgendaBlocks /></AdminRoute>} />
        <Route path="/admin/marcacoes" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
        <Route path="/admin/clientes" element={<AdminRoute><Customers /></AdminRoute>} />
        <Route path="/admin/clientes/aniversarios" element={<AdminRoute><ClientBirthdays /></AdminRoute>} />
        <Route path="/admin/servicos" element={<AdminRoute><Services /></AdminRoute>} />
        <Route path="/admin/servicos/categorias" element={<AdminRoute><ServiceCategories /></AdminRoute>} />
        <Route path="/admin/profissionais" element={<AdminRoute><Professionals /></AdminRoute>} />
        <Route path="/admin/profissionais/horarios" element={<AdminRoute><ProSchedules /></AdminRoute>} />
        <Route path="/admin/profissionais/comissoes" element={<AdminRoute><ProCommissions /></AdminRoute>} />
        <Route path="/admin/profissionais/desempenho" element={<AdminRoute><ProPerformance /></AdminRoute>} />
        <Route path="/admin/horarios" element={<AdminRoute><Hours /></AdminRoute>} />
        <Route path="/admin/notificacoes" element={<AdminRoute><Notifications /></AdminRoute>} />
        <Route path="/admin/caixa" element={<AdminRoute><Cash /></AdminRoute>} />
        <Route path="/admin/inventario" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/admin/produtos" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/admin/produtos/stock" element={<AdminRoute><ProductStock /></AdminRoute>} />
        <Route path="/admin/produtos/movimentos" element={<AdminRoute><ProductMovements /></AdminRoute>} />
        <Route path="/admin/produtos/fornecedores" element={<AdminRoute><Suppliers /></AdminRoute>} />
        <Route path="/admin/marketing" element={<AdminRoute><Marketing /></AdminRoute>} />
        <Route path="/admin/avaliacoes" element={<AdminRoute><Reviews /></AdminRoute>} />
        <Route path="/admin/tipos" element={<AdminRoute><Tipos /></AdminRoute>} />
        <Route path="/admin/financeiro" element={<AdminRoute><Financeiro /></AdminRoute>} />
        <Route path="/admin/financeiro/caixa" element={<AdminRoute><Cash /></AdminRoute>} />
        <Route path="/admin/financeiro/historico" element={<AdminRoute><FinCashHistory /></AdminRoute>} />
        <Route path="/admin/financeiro/entradas" element={<AdminRoute><FinIncome /></AdminRoute>} />
        <Route path="/admin/financeiro/saidas" element={<AdminRoute><FinExpenseMoves /></AdminRoute>} />
        <Route path="/admin/financeiro/receitas" element={<AdminRoute><FinRevenue /></AdminRoute>} />
        <Route path="/admin/financeiro/despesas" element={<AdminRoute><FinExpenses /></AdminRoute>} />
        <Route path="/admin/financeiro/comissoes" element={<AdminRoute><FinCommissions /></AdminRoute>} />
        <Route path="/admin/financeiro/conta-cliente" element={<AdminRoute><FinCustomerAccount /></AdminRoute>} />
        <Route path="/admin/financeiro/conta-profissional" element={<AdminRoute><FinProAccount /></AdminRoute>} />
        <Route path="/admin/financeiro/fluxo" element={<AdminRoute><FinCashFlow /></AdminRoute>} />
        <Route path="/admin/comandas" element={<AdminRoute><Comandas /></AdminRoute>} />
        <Route path="/admin/comandas/:tab" element={<AdminRoute><Comandas /></AdminRoute>} />
        <Route path="/admin/relatorios" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/admin/relatorios/marcacoes" element={<AdminRoute><RepAppointments /></AdminRoute>} />
        <Route path="/admin/relatorios/clientes" element={<AdminRoute><RepClients /></AdminRoute>} />
        <Route path="/admin/relatorios/profissionais" element={<AdminRoute><RepProfessionals /></AdminRoute>} />
        <Route path="/admin/relatorios/financeiro" element={<AdminRoute><RepFinance /></AdminRoute>} />
        <Route path="/admin/relatorios/servicos" element={<AdminRoute><RepServices /></AdminRoute>} />
        <Route path="/admin/relatorios/produtos" element={<AdminRoute><RepProducts /></AdminRoute>} />
        <Route path="/admin/relatorios/fidelizacao" element={<AdminRoute><RepLoyalty /></AdminRoute>} />
        <Route path="/admin/relatorios/subscricoes" element={<AdminRoute><RepSubscriptions /></AdminRoute>} />
        <Route path="/admin/fidelizacao" element={<AdminRoute><FidelizacaoPrograma /></AdminRoute>} />
        <Route path="/admin/fidelizacao/programa" element={<AdminRoute><FidelizacaoPrograma /></AdminRoute>} />
        <Route path="/admin/fidelizacao/pontos" element={<AdminRoute><FidelizacaoPontos /></AdminRoute>} />
        <Route path="/admin/fidelizacao/recompensas" element={<AdminRoute><FidelizacaoRecompensas /></AdminRoute>} />
        <Route path="/admin/fidelizacao/cartao" element={<AdminRoute><LoyaltyCard /></AdminRoute>} />
        <Route path="/admin/subscricoes" element={<AdminRoute><Subscricoes /></AdminRoute>} />
        <Route path="/admin/subscricoes/:tab" element={<AdminRoute><Subscricoes /></AdminRoute>} />
        <Route path="/admin/promocoes" element={<AdminRoute><Marketing /></AdminRoute>} />
        <Route path="/admin/promocoes/cupoes" element={<AdminRoute><Coupons /></AdminRoute>} />
        <Route path="/admin/definicoes" element={<Navigate to="/admin/definicoes/negocio" replace />} />
        <Route path="/admin/definicoes/negocio" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/admin/definicoes/anamnese" element={<AdminRoute><AnamneseForms /></AdminRoute>} />
        <Route path="/admin/definicoes/parametros" element={<AdminRoute><Parametros /></AdminRoute>} />
        <Route path="/admin/definicoes/tema" element={<AdminRoute><TemaPersonalizacao /></AdminRoute>} />
        <Route path="/admin/definicoes/:tab" element={<AdminRoute><Definicoes /></AdminRoute>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </motion.div>
  );
}

export default function App() {
  useEffect(() => {
    const saved = dataService.getState().business?.config?.theme;
    if (saved && Object.keys(saved).length > 0) applySavedTheme(saved);
  }, []);

  const { loading } = useStore();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d0d0d' }}><p style={{ color: '#C9A84C' }}>A carregar...</p></div>;

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
