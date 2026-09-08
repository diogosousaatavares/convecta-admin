import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReporSenha() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('waiting'); // waiting | form | success | error
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase processa automaticamente o hash da URL (access_token + type=recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStage('form');
      }
    });

    // Timeout: se após 5 segundos não chegou o evento, o link é inválido/expirado
    const timer = setTimeout(() => {
      setStage(s => s === 'waiting' ? 'error' : s);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('A palavra-passe tem de ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As palavras-passe não coincidem.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message || 'Erro ao atualizar a palavra-passe. Tenta novamente.'); return; }
    setStage('success');
    setTimeout(() => navigate('/entrar'), 2500);
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080808',
    padding: 24,
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 400,
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 16,
    padding: '32px 32px 28px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  };

  return (
    <div style={containerStyle}>
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

        <div style={cardStyle}>
          {/* A aguardar o token */}
          {stage === 'waiting' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #333', borderTopColor: 'var(--gold, #C9A84C)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
              <div style={{ color: '#aaa', fontSize: 14 }}>A verificar o link de recuperação…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Link inválido / expirado */}
          {stage === 'error' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <AlertCircle size={40} style={{ color: '#f87171', margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Link inválido ou expirado</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
                Este link de recuperação já não é válido. Pede um novo na página de login.
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: 44 }}
                onClick={() => navigate('/entrar')}
              >
                Voltar ao login
              </button>
            </div>
          )}

          {/* Formulário nova senha */}
          {stage === 'form' && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Nova palavra-passe</h1>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Escolhe uma nova palavra-passe segura</p>
              </div>
              <form onSubmit={submit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Nova palavra-passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoFocus
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0 }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#aaa', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Confirmar palavra-passe
                  </label>
                  <input
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repete a palavra-passe"
                    required
                  />
                </div>
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: 8, height: 46, fontSize: 15, fontWeight: 700 }}
                  disabled={loading}
                >
                  {loading ? 'A guardar…' : 'Guardar nova senha'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          )}

          {/* Sucesso */}
          {stage === 'success' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <CheckCircle size={40} style={{ color: '#22c55e', margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Palavra-passe alterada!</div>
              <div style={{ fontSize: 13, color: '#666' }}>A redirecionar para o login…</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
