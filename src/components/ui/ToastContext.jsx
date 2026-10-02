import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

/*
 * UM AVISO QUE SE MANDA EMBORA COM O DEDO.
 *
 * Numa app, um aviso que aparece em cima manda-se embora para cima — é o
 * gesto que toda a gente já faz nas notificações do telemóvel. Aqui ficava
 * parado a tapar o cabeçalho até se ir embora sozinho ao fim de 3,5
 * segundos, e não havia maneira nenhuma de o apressar.
 *
 * Agora: arrasta-se para cima e vai-se embora. Passados 40 px ou um gesto
 * rápido, sai; abaixo disso volta ao lugar. Também se pode tocar nele, que
 * é o que faz quem não sabe que dá para arrastar.
 *
 * O relógio dos 3,5 s continua a correr: isto é uma saída a mais, não uma
 * troca.
 */
function Aviso({ t, aoFechar }) {
  const inicio = useRef(null);
  const [puxado, setPuxado] = useState(0);
  const [aSair, setASair] = useState(false);

  const comecar = e => { inicio.current = { y: e.touches[0].clientY, t: Date.now() }; };

  const mover = e => {
    if (!inicio.current) return;
    // Só para cima. Puxar para baixo não faz nada — senão o aviso descia e
    // tapava a página em vez de sair dela.
    const d = Math.min(0, e.touches[0].clientY - inicio.current.y);
    setPuxado(d);
  };

  const largar = () => {
    if (!inicio.current) return;
    const rapido = (Date.now() - inicio.current.t) < 260 && puxado < -14;
    inicio.current = null;
    if (puxado < -40 || rapido) { setASair(true); setTimeout(aoFechar, 160); }
    else setPuxado(0);
  };

  return (
    <div
      className={`toast toast-${t.type}${aSair ? ' toast-sai' : ''}`}
      onTouchStart={comecar}
      onTouchMove={mover}
      onTouchEnd={largar}
      onTouchCancel={largar}
      onClick={() => { setASair(true); setTimeout(aoFechar, 160); }}
      style={{
        transform: puxado ? `translateY(${puxado}px)` : undefined,
        // Enquanto o dedo está em cima não há transição, senão o aviso
        // arrasta-se com atraso e parece que não segue o dedo.
        transition: puxado ? 'none' : undefined,
        opacity: puxado ? Math.max(0, 1 + puxado / 90) : undefined,
      }}
    >
      {t.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />}
      {t.type === 'error' && <XCircle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />}
      {t.type === 'info' && <Info size={18} style={{ color: 'var(--gold-tinta)', flexShrink: 0 }} />}
      <div style={{ minWidth: 0 }}>
        <div className="toast-title">{t.title}</div>
        {t.msg && <div className="toast-msg">{t.msg}</div>}
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const tirar = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);
  const push = useCallback((type, title, msg) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, title, msg }]);
    setTimeout(() => tirar(id), 3500);
  }, [tirar]);
  const toast = {
    success: (title, msg) => push('success', title, msg),
    error: (title, msg) => push('error', title, msg),
    info: (title, msg) => push('info', title, msg)
  };
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => <Aviso key={t.id} t={t} aoFechar={() => tirar(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}
