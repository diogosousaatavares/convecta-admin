// useStore.js — atualizado para Fase 3 (Supabase)
// Chama dataService.init() no mount e expõe estado de loading

import { useEffect, useReducer, useState } from 'react';
import dataService from '@/lib/dataService';
import authService from '@/lib/authService';

export function useStore() {
  const [, force] = useReducer(x => x + 1, 0);
  const [loading, setLoading] = useState(!dataService.getState().business);

  useEffect(() => {
    const unsub1 = dataService.subscribe(() => {
      if (!dataService.getState().business === false) setLoading(false);
      force();
    });
    const unsub2 = authService.subscribe(() => force());

    // Inicializar Supabase (idempotente — só corre uma vez)
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
  return authService.getState();
}
