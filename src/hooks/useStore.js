// useStore.js — Fase 4 (Supabase Auth + multi-tenant)
import { useEffect, useReducer, useState } from 'react';
import dataService from '@/lib/dataService';
import authService from '@/lib/authService';

export function useStore() {
  const [, force] = useReducer(x => x + 1, 0);
  const [loading, setLoading] = useState(!dataService.getState().business);

  useEffect(() => {
    const unsub1 = dataService.subscribe(() => {
      if (dataService.getState().business) setLoading(false);
      force();
    });

    // Quando o auth muda (login/logout), reset + re-init com o negócio correto.
    // So quando muda a PESSOA: o Supabase tambem dispara este evento ao renovar
    // o token (de hora a hora) e ao voltar ao separador. Nesses casos tudo era
    // apagado e recarregado, o Router desmontava-se e o barbeiro perdia o que
    // tinha a meio — um fecho de conta, um formulario, uma janela aberta.
    let quem = authService.getCurrentUser()?.id || null;
    const unsub2 = authService.subscribe(async () => {
      const agora = authService.getCurrentUser()?.id || null;
      if (agora === quem) { force(); return; }
      quem = agora;
      if (authService.isAuthenticated()) {
        dataService.reset();
        setLoading(true);
        try {
          await dataService.init();
        } catch (err) {
          console.error('[dataService] re-init falhou:', err);
        } finally {
          setLoading(false);
        }
      } else {
        dataService.reset();
      }
      force();
    });

    // Init inicial
    dataService.init()
      .then(() => setLoading(false))
      .catch(err => {
        console.error('[dataService] init falhou:', err);
        setLoading(false);
      });

    return () => { unsub1(); unsub2(); };
  }, []);

  // Quem está a usar o painel: o dono, ou um barbeiro com acesso próprio.
  // Vive na sessão (authService), não nos dados — as páginas leem-no daqui.
  return { ...dataService.getState(), loading, isProfissional: authService.isProfissional(), meuProfissionalId: authService.meuProfissionalId() };
}

export function useAuth() {
  const [, force] = useReducer(x => x + 1, 0);
  useEffect(() => {
    const unsub = authService.subscribe(() => force());
    return unsub;
  }, []);
  return {
    user: authService.getCurrentUser(),
    isAdmin: authService.isAdmin(),
    isProfissional: authService.isProfissional(),
    meuProfissionalId: authService.meuProfissionalId(),
    isAuthenticated: authService.isAuthenticated(),
    isAuthLoading: authService.isAuthLoading(),
    login: (...args) => authService.login(...args),
    logout: () => authService.logout(),
    register: (...args) => authService.register(...args),
  };
}
