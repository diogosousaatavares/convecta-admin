import { useNavigate, useLocation } from 'react-router-dom';
import authService from '@/lib/authService';

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = location.pathname.substring(1);
  const isAdmin = authService.isAdmin();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 96, fontWeight: 300, color: 'var(--text-ter)', fontFamily: 'var(--font-head)' }}>404</div>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Página não encontrada</h2>
        <p style={{ color: 'var(--text-sec)', marginBottom: 32 }}>
          A página <strong>"{pageName}"</strong> não existe nesta aplicação.
        </p>
        {isAdmin && (
          <p style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 24 }}>
            Esta página poderá ainda não estar implementada.
          </p>
        )}
        <button onClick={() => navigate(isAdmin ? '/admin' : '/')} className="btn btn-primary">
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
