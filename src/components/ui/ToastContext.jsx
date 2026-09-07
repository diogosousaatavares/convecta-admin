import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, title, msg) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, title, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  const toast = {
    success: (title, msg) => push('success', title, msg),
    error: (title, msg) => push('error', title, msg),
    info: (title, msg) => push('info', title, msg)
  };
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />}
            {t.type === 'error' && <XCircle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />}
            {t.type === 'info' && <Info size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
            <div>
              <div className="toast-title">{t.title}</div>
              {t.msg && <div className="toast-msg">{t.msg}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}