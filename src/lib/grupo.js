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

/*
 * A PÁGINA DE ENTRADA (12/10/2026): { principal, foto, titulo, pergunta,
 * botoes } — principal é o negócio cujo link abre a porta (escolhido pelo
 * dono; a subscrição não muda). null sem negócios ligados ou sem o SQL
 * PORTA_DO_ESPACO_2026-10-12.sql corrido.
 */
let _porta = null;
let _portaValor;
function lerPorta() {
  if (!_porta) {
    _porta = supabase.rpc('porta_do_grupo')
      .then(({ data, error }) => { _portaValor = error ? null : (data || null); return _portaValor; })
      .catch(() => { _portaValor = null; return null; });
  }
  return _porta;
}
export function usePorta() {
  const [porta, setPorta] = useState(_portaValor ?? null);
  useEffect(() => {
    let vivo = true;
    lerPorta().then(p => { if (vivo) setPorta(p); });
    return () => { vivo = false; };
  }, []);
  const mudar = p => { _portaValor = p; _porta = Promise.resolve(p); setPorta(p); };
  return [porta, mudar];
}
export async function guardarPorta(p) {
  const { data, error } = await supabase.rpc('guardar_porta', { p });
  if (error) throw new Error(error.message);
  return data;
}

/** O endereço público de um negócio do grupo. */
export const enderecoDe = n => (n?.slug ? `${n.slug}.${DOMINIO_BASE}` : '');
