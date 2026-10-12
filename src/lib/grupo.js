/*
 * OS NEGÓCIOS LIGADOS — «duas apps numa só» (12/10/2026).
 *
 * Um espaço com dois tipos são dois negócios inteiros ligados (grupo_id).
 * O dono entra com o mesmo email e troca entre eles no topo do painel:
 * mudar_de_negocio muda o users.business_id e o painel recarrega já no outro
 * — site, clientes, serviços, horários, caixa, tudo dele.
 *
 * Sem o SQL DOIS_NEGOCIOS_2026-10-12.sql corrido, a lista vem vazia e nada
 * aparece: o painel fica exactamente como estava.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DOMINIO_BASE } from '@/lib/designService';

let _promessa = null;
let _lista = null;

function ler() {
  if (!_promessa) {
    _promessa = supabase.rpc('negocios_do_grupo').then(({ data, error }) => {
      _lista = error ? [] : (data || []);
      return _lista;
    }).catch(() => { _lista = []; return _lista; });
  }
  return _promessa;
}

/** { lista, actual, principal, ligado } — ligado = há mais do que um. */
export function useGrupo() {
  const [lista, setLista] = useState(_lista || []);
  useEffect(() => {
    let vivo = true;
    ler().then(l => { if (vivo) setLista(l); });
    return () => { vivo = false; };
  }, []);
  const actual = lista.find(n => n.actual) || null;
  const principal = lista.find(n => n.principal) || null;
  return { lista, actual, principal, ligado: lista.length > 1 };
}

/** Abre o outro negócio do grupo: troca no servidor e recarrega o painel. */
export async function mudarDeNegocio(id) {
  const { error } = await supabase.rpc('mudar_de_negocio', { p_business_id: id });
  if (error) throw new Error(error.message);
  try { localStorage.removeItem('convecta.lado'); } catch { /* nada */ }
  window.location.href = '/admin';
}

/** O endereço público de um negócio do grupo. */
export const enderecoDe = n => (n?.slug ? `${n.slug}.${DOMINIO_BASE}` : '');
