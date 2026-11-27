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
import { useEffect, useMemo, useState } from 'react';
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
/* 02/11/2026: ao sair, esquecer o que se leu — a conta seguinte via os
 * negócios e a porta de quem saiu até recarregar a página. */
export function limpar() {
  _promessa = null; _lista = null; _cores = null; _coresValor = null;
  _porta = null; _portaValor = undefined;
}
export async function guardarPorta(p) {
  const { data, error } = await supabase.rpc('guardar_porta', { p });
  if (error) throw new Error(error.message);
  return data;
}

/** O endereço público de um negócio do grupo. */
export const enderecoDe = n => (n?.slug ? `${n.slug}.${DOMINIO_BASE}` : '');

/*
 * CADA CASA COM A SUA COR (23/11/2026). Uma por omissão para cada tipo; a
 * dona escolhe outra em «Todas as casas» (guardar_cor_da_casa). Lê-se de
 * cores_do_grupo (CORES_DAS_CASAS_2026-11-23.sql); sem o SQL, ficam as do tipo.
 */
export const CORES_POR_TIPO = {
  barbearia: '#2563EB', cabeleireiro: '#DB2777', estetica: '#7C3AED', unhas: '#E11D48',
  massagem: '#059669', maquilhagem: '#EA580C', laser: '#0891B2', clinica: '#0F766E',
  tatuagem: '#334155', misto: '#9333EA',
};
const RESERVA = ['#2563EB', '#DB2777', '#7C3AED', '#059669', '#EA580C', '#0891B2', '#CA8A04', '#4F46E5'];
export const PALETA_CASAS = ['#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#DB2777', '#E11D48', '#EA580C', '#CA8A04', '#16A34A', '#059669', '#0891B2', '#334155'];

let _cores = null;
let _coresValor = null;
function lerCores() {
  if (!_cores) {
    _cores = supabase.rpc('cores_do_grupo').then(({ data, error }) => {
      _coresValor = error ? {} : Object.fromEntries((data || []).filter(x => x.cor).map(x => [x.id, x.cor]));
      return _coresValor;
    }).catch(() => { _coresValor = {}; return _coresValor; });
  }
  return _cores;
}
/** A cor de cada casa do grupo: { [id]: '#RRGGBB' }, com as do tipo por omissão. */
export function useCoresDasCasas() {
  const { lista } = useGrupo();
  const [escolhidas, setEscolhidas] = useState(_coresValor || {});
  useEffect(() => {
    let vivo = true;
    lerCores().then(c => { if (vivo) setEscolhidas(c); });
    return () => { vivo = false; };
  }, []);
  // Memo: o mesmo objecto enquanto nada muda. Um objecto novo a cada
  // desenho fazia a agenda voltar a pedir as outras casas sem parar (27/11).
  const cores = useMemo(() => {
    const usadas = new Set();
    const r = {};
    for (const n of lista) {
      let c = escolhidas[n.id] || CORES_POR_TIPO[n.tipo];
      if (!escolhidas[n.id] && usadas.has(c)) c = RESERVA.find(x => !usadas.has(x)) || c;
      usadas.add(c); r[n.id] = c;
    }
    return r;
  }, [lista, escolhidas]);
  const mudar = (id, cor) => { _coresValor = { ...(_coresValor || {}), [id]: cor }; _cores = Promise.resolve(_coresValor); setEscolhidas(_coresValor); };
  return [cores, mudar];
}
export async function guardarCorDaCasa(id, cor) {
  const { error } = await supabase.rpc('guardar_cor_da_casa', { p_casa: id, p_cor: cor });
  if (error) throw new Error(error.message);
}
