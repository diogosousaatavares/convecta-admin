import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';

/*
 * Dar acesso ao painel a um barbeiro que nao e o dono.
 *
 * O dono escreve o email, carrega em «Dar acesso», e o barbeiro recebe um
 * email para escolher a palavra-passe. Depois entra em
 * administrador.marcacoes.app e ve a agenda, os clientes e a conta dele —
 * mais nada. Quem faz o trabalho e a funcao `convidar-profissional`; a base
 * de dados tranca o resto (supabase/ACESSO_PROFISSIONAL.sql).
 */
export function useAcessos(businessId) {
  const [lista, setLista] = useState([]);
  const recarregar = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase.from('users').select('id, email, professional_id').eq('business_id', businessId).not('professional_id', 'is', null);
    setLista(data || []);
  }, [businessId]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { de: (proId) => lista.find(u => u.professional_id === proId) || null, recarregar };
}

export default function AcessoProfissional({ profissional, acesso, onMudou }) {
  const toast = useToast();
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function chamar(corpo) {
    setAEnviar(true);
    try {
      const { data, error } = await supabase.functions.invoke('convidar-profissional', { body: corpo });
      let erro = data?.erro;
      if (error && !erro) { try { erro = (await error.context?.json())?.erro; } catch { erro = ''; } erro = erro || error.message; }
      if (erro) throw new Error(erro);
      return data;
    } finally { setAEnviar(false); }
  }
  async function dar() {
    if (!email.trim()) return;
    try {
      await chamar({ acao: 'dar', professional_id: profissional.id, email: email.trim() });
      toast.success('Acesso criado', `${profissional.name} recebeu um email para escolher a palavra-passe.`);
      setAberto(false); setEmail(''); onMudou?.();
    } catch (e) { toast.error('Não deu', e.message); }
  }
  async function remover() {
    if (!window.confirm(`Tirar o acesso de ${profissional.name} ao painel?`)) return;
    try {
      await chamar({ acao: 'remover', professional_id: profissional.id });
      toast.success('Acesso removido', `${profissional.name} já não entra no painel.`);
      onMudou?.();
    } catch (e) { toast.error('Não deu', e.message); }
  }

  if (acesso) {
    return (
      <div className="mt-16" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
        <KeyRound size={14} style={{ color: 'var(--gold)' }} />
        <span className="text-sec" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>Tem acesso · {acesso.email}</span>
        <Button size="sm" variant="ghost" onClick={remover} disabled={aEnviar}>Remover acesso</Button>
      </div>
    );
  }
  if (!aberto) {
    return (
      <div className="mt-16">
        <Button size="sm" variant="ghost" onClick={() => setAberto(true)}><KeyRound size={14} /> Dar acesso ao painel</Button>
      </div>
    );
  }
  return (
    <div className="mt-16" style={{ display: 'grid', gap: 8 }}>
      <div className="text-sec text-xs">Vai ver a agenda, os clientes e a conta dele. Sem dinheiro nem definições.</div>
      <input className="input" type="email" placeholder="email do barbeiro" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') dar(); }} />
      <div className="flex gap-8">
        <Button size="sm" variant="primary" onClick={dar} disabled={aEnviar || !email.trim()}>{aEnviar ? 'A enviar…' : 'Enviar convite'}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setAberto(false); setEmail(''); }}>Cancelar</Button>
      </div>
    </div>
  );
}
