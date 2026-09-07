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

    // Quando o auth muda (login/logout), reset + re-init com o negócio correto
    const unsub2 = authService.subscribe(async () => {
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

  return { ...dataService.getState(), loading };
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
    isAuthenticated: authService.isAuthenticated(),
    isAuthLoading: authService.isAuthLoading(),
    login: (...args) => authService.login(...args),
    logout: () => authService.logout(),
    register: (...args) => authService.register(...args),
  };
}
