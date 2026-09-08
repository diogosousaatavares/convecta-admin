import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { Eye, EyeOff, ArrowRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const sendReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/repor-senha',
    });
    setForgotLoading(false);
    if (error) { setForgotError(error.message || 'Erro ao enviar email.'); return; }
    setForgotSent(true);
  };

  const closeForgot = () => { setForgotOpen(false); setForgotSent(false); setForgotEmail(''); setForgotError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const s = await login(form.email, form.password);
      if (s.role !== 'admin') {
        setError('Esta conta não tem permissões de administrador.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (<>
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080808',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: '#fff' }}>
            Convecta<span style={{ color: 'var(--gold, #C9A84C)' }}>.</span>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Painel de Administração
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: 16,
          padding: '32px 32px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Iniciar sessão</h1>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Acede ao painel de gestão</p>
          </div>

          <form onSubmit={submit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@exemplo.pt"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Palavra-passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0 }}
                  aria-label="Mostrar palavra-passe"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginTop: -16, marginBottom: 20 }}>
              <button type="button" onClick={() => setForgotOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--gold, #C9A84C)', fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                Esqueci a palavra-passe
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 8, height: 46, fontSize: 15, fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? 'A autenticar...' : 'Entrar'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>

      {/* Forgot password modal */}
      {forgotOpen && (
        <div onClick={closeForgot} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: '28px 28px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Recuperar palavra-passe</h2>
              <button onClick={closeForgot} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><X size={18} /></button>
            </div>
            {!forgotSent ? (
              <form onSubmit={sendReset}>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Indica o teu email e enviamos um link para criares uma nova palavra-passe.</p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
                  <input className="input" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="admin@exemplo.pt" autoFocus required />
                </div>
                {forgotError && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>{forgotError}</div>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8, height: 44, fontWeight: 700 }} disabled={forgotLoading}>
                  {forgotLoading ? 'A enviar…' : 'Enviar link de recuperação'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Email enviado!</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Verifica a caixa de entrada de <strong style={{ color: '#aaa' }}>{forgotEmail}</strong> e clica no link para redefinir a tua senha.</div>
                <button onClick={closeForgot} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', height: 44 }}>Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
  </>);
}
