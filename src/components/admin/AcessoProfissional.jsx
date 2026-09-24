import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useStore';
import { Crown } from 'lucide-react';
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
    const { data } = await supabase.from('users').select('id, email, professional_id, permissoes').eq('business_id', businessId).not('professional_id', 'is', null);
    setLista(data || []);
  }, [businessId]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { de: (proId) => lista.find(u => u.professional_id === proId) || null, recarregar };
}

export default function AcessoProfissional({ profissional, acesso, onMudou, destaque = false, emailInicial = '', abertoInicial = false }) {
  const toast = useToast();
  const { meuProfissionalId, isProfissional } = useAuth();
  const [aberto, setAberto] = useState(abertoInicial);
  // A ficha é a do próprio dono: ele entra com a conta dele, não precisa de convite.
  if (!isProfissional && meuProfissionalId && profissional?.id === meuProfissionalId) {
    return (
      <div style={destaque ? { marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(var(--gold-rgb),0.10)', border: '1px solid rgba(var(--gold-rgb),0.45)' } : { marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Crown size={16} style={{ color: 'var(--gold)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600">Este és tu, o dono</div>
            <div className="text-sec text-xs">Entras com a tua conta e vês tudo. Podes mudar isto em Equipa e acessos.</div>
          </div>
        </div>
      </div>
    );
  }
  const [email, setEmail] = useState(emailInicial || profissional?.email || '');
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

  const caixa = { marginTop: 16, padding: '12px 14px', borderRadius: 10, background: acesso ? 'rgba(34,197,94,0.08)' : 'rgba(var(--gold-rgb),0.08)', border: `1px solid ${acesso ? 'rgba(34,197,94,0.35)' : 'rgba(var(--gold-rgb),0.35)'}` };
  if (acesso) {
    const perm = { agenda_toda: true, ...(acesso.permissoes || {}) };
    const mudar = async (chave, valor) => {
      const novas = { ...perm, [chave]: valor };
      const { error } = await supabase.rpc('definir_permissoes_profissional', { p_user_id: acesso.id, p_permissoes: novas });
      if (error) { toast.error('Não ficou gravado', error.message); return; }
      toast.success('Guardado', valor ? `${profissional.name} passa a ver a agenda toda.` : `${profissional.name} passa a ver só a coluna dele.`);
      onMudou?.();
    };
    return (
      <div style={destaque ? caixa : { marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600">Acesso ao painel: ligado</div>
            <div className="text-sec text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{acesso.email} · vê os clientes e a conta dele</div>
          </div>
          <Button size="sm" variant="ghost" onClick={remover} disabled={aEnviar}>Remover</Button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={perm.agenda_toda !== false} onChange={e => mudar('agenda_toda', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--gold)' }} />
          <span style={{ flex: 1 }}>
            <span className="fw-600">Vê a agenda toda</span>
            <span className="text-sec text-xs" style={{ display: 'block' }}>{perm.agenda_toda !== false ? 'Vê as colunas dos colegas; mexe só na dele.' : 'Só vê a coluna dele.'}</span>
          </span>
        </label>
      </div>
    );
  }
  if (!aberto) {
    return (
      <div style={destaque ? caixa : { marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
          <ShieldOff size={16} style={{ color: 'var(--text-sec)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600">Acesso ao painel: sem acesso</div>
            <div className="text-sec text-xs">Só o dono entra. Dá-lhe acesso para ele ver a agenda dele.</div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setAberto(true)}><KeyRound size={14} /> Dar acesso</Button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...(destaque ? caixa : { marginTop: 16 }), display: 'grid', gap: 8 }}>
      <div className="text-sec text-xs">Vai ver a agenda (mexe só na coluna dele), os clientes e a conta dele. Sem dinheiro nem definições.</div>
      <input className="input" type="email" placeholder="email do barbeiro" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') dar(); }} />
      <div className="flex gap-8">
        <Button size="sm" variant="primary" onClick={dar} disabled={aEnviar || !email.trim()}>{aEnviar ? 'A enviar…' : 'Enviar convite'}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setAberto(false); setEmail(''); }}>Cancelar</Button>
      </div>
    </div>
  );
}
