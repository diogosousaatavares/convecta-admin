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
  const [motivo, setMotivo] = useState('');
  const [emailNovo, setEmailNovo] = useState('');
  const [pedido, setPedido] = useState(false);
  // Link «à prova de Gmail»: traz um token_hash que só é gasto quando a pessoa
  // carrega no botão — o antivírus/Gmail pode visitar a página que não estraga nada.
  const [tokenHash, setTokenHash] = useState('');
  const confirmarToken = async () => {
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    setLoading(false);
    if (err) { console.warn('verifyOtp', err); setMotivo(`O Supabase recusou o código: ${err.message}${err.code ? ` (${err.code})` : ''}.`); setStage('error'); return; }
    setStage('form');
  };

  // Convite da barbearia (?convite=…): código nosso, vale 7 dias, sem tokens do Supabase.
  const [convite] = useState(() => new URLSearchParams(window.location.search).get('convite') || '');
  const [conviteInfo, setConviteInfo] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('convite')) {
      (async () => {
        const { data, error: e } = await supabase.functions.invoke('convidar-profissional', { body: { acao: 'aceitar', convite: q.get('convite') } });
        let erro = data?.erro;
        if (e && !erro) { try { erro = (await e.context?.json())?.erro; } catch { erro = ''; } erro = erro || e.message; }
        if (erro) { setMotivo(erro); setStage('error'); return; }
        setConviteInfo(data); setStage('form');
      })();
      return () => {};
    }
    if (q.get('token_hash')) { setTokenHash(q.get('token_hash')); setStage('confirmar'); return () => {}; }
    // O Supabase manda o erro na própria URL quando o link já foi usado ou expirou
    // (#error=access_denied&error_code=otp_expired&error_description=...).
    const params = new URLSearchParams((window.location.hash || '').replace(/^#/, '') + '&' + window.location.search.replace(/^\?/, ''));
    const eTipo = params.get('type');
    if (params.get('error') || params.get('error_code')) {
      const cod = params.get('error_code') || '';
      setMotivo(cod === 'otp_expired' ? 'O link já foi usado ou passou o prazo. Cada link só serve uma vez.' : (params.get('error_description') || params.get('error') || '').replace(/\+/g, ' '));
      setStage('error');
      return () => {};
    }

    // Supabase processa automaticamente o hash da URL (access_token + type=recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('form');
      // Alguns browsers já vêm com sessão e o evento chega como SIGNED_IN.
      if (event === 'SIGNED_IN' && eTipo === 'recovery') setStage('form');
    });
    // Rede de segurança: se a sessão já foi criada a partir do link, mostra o formulário.
    if (eTipo === 'recovery') {
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (data?.session) setStage(s => s === 'waiting' ? 'form' : s);
      }, 1500);
    }

    // Timeout: se após 8 segundos não chegou o evento, o link é inválido/expirado
    const timer = setTimeout(() => {
      setStage(s => s === 'waiting' ? 'error' : s);
    }, 8000);

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
    if (convite) {
      // A função guarda a palavra-passe na conta e nós entramos logo com ela.
      const { data, error: e } = await supabase.functions.invoke('convidar-profissional', { body: { acao: 'aceitar', convite, password } });
      let erro = data?.erro;
      if (e && !erro) { try { erro = (await e.context?.json())?.erro; } catch { erro = ''; } erro = erro || e.message; }
      if (erro) { setLoading(false); setError(erro); return; }
      const { error: eLogin } = await supabase.auth.signInWithPassword({ email: data.email, password });
      setLoading(false);
      if (eLogin) { setError('A palavra-passe ficou guardada, mas não consegui entrar: ' + eLogin.message + '. Vai a «Entrar» e usa-a.'); return; }
      setStage('success');
      setTimeout(() => { window.location.href = '/admin/agenda'; }, 1500);
      return;
    }
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

          {stage === 'confirmar' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Escolher a palavra-passe</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>Carrega para continuar. Este passo só funciona uma vez.</div>
              <button className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={confirmarToken}>{loading ? 'A confirmar…' : 'Continuar'} <ArrowRight size={16} /></button>
            </div>
          )}

          {/* Link inválido / expirado */}
          {stage === 'error' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <AlertCircle size={40} style={{ color: '#f87171', margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Link inválido ou expirado</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
                {motivo || 'Este link já não é válido. Cada link só serve uma vez e tem prazo.'} Pede um novo aqui: chega por email em segundos.
              </div>
              {pedido ? (
                <div style={{ fontSize: 13, color: '#166534', background: '#dcfce7', padding: '10px 12px', borderRadius: 8, marginBottom: 16 }}>Enviado. Vê o email {emailNovo} (e o spam) e abre o link mais recente.</div>
              ) : (
                <form onSubmit={async (e) => { e.preventDefault(); setLoading(true);
                  const { error: err } = await supabase.auth.resetPasswordForEmail(emailNovo.trim(), { redirectTo: `${window.location.origin}/repor-senha` });
                  setLoading(false); if (err) { setError(err.message); return; } setPedido(true); }}
                  style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                  <input className="input" type="email" required placeholder="o teu email" value={emailNovo} onChange={e => setEmailNovo(e.target.value)} style={{ height: 44 }} />
                  {error && <div style={{ fontSize: 13, color: '#b91c1c' }}>{error}</div>}
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', height: 44 }}>{loading ? 'A enviar…' : 'Enviar novo link'}</button>
                </form>
              )}
              <button
                className="btn btn-ghost"
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
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{conviteInfo ? `Olá${conviteInfo.nome ? ' ' + String(conviteInfo.nome).split(' ')[0] : ''}!` : 'Nova palavra-passe'}</h1>
                <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{conviteInfo ? `Escolhe a tua palavra-passe para entrar na agenda da ${conviteInfo.barbearia || 'barbearia'} com o email ${conviteInfo.email}.` : 'Escolhe uma nova palavra-passe segura'}</p>
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
