import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useStore';
import { Crown } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useConfirmar } from '@/components/ui/Confirmar';
import { n as nicho } from '@/lib/nicho';

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
      <div style={destaque ? { marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' } : { marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <Crown size={16} style={{ color: 'var(--gold-tinta)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* A frase que aqui estava explicava o obvio e mandava-o a
                «Equipa e acessos», que e onde ele ja esta. */}
            <div className="fw-600">Este és tu, o dono</div>
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
  function remover() {
    pedir({
      titulo: 'Tirar o acesso ao painel?',
      texto: `${profissional.name} deixa de conseguir entrar. A ficha dele, a agenda e as comissões ficam como estão.`,
      botao: 'Tirar acesso',
      aoConfirmar: async () => {
        try {
          await chamar({ acao: 'remover', professional_id: profissional.id });
          toast.success('Acesso removido', `${profissional.name} já não entra no painel.`);
          onMudou?.();
        } catch (e) { toast.error('Não deu', e.message); }
      },
    });
  }

  const [pedir, Confirmacao] = useConfirmar();
  // No cartão do profissional: uma linha discreta, separada por um traço,
  // em vez de uma caixa colorida (a caixa espremia o texto palavra a palavra
  // ao lado do botão — 12/10/2026).
  const caixa = { marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' };
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 15 }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Com acesso ao painel</div>
            {/* O email fica: e a unica coisa desta linha que ele nao sabe
                de cor. O resto dizia por palavras o que o titulo ja diz. */}
            <div className="text-sec text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{acesso.email}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={remover} disabled={aEnviar}>Remover</Button>
        </div>
        <Confirmacao />
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 15 }}>
          <input type="checkbox" checked={perm.agenda_toda !== false} onChange={e => mudar('agenda_toda', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--gold)' }} />
          <span style={{ flex: 1 }} className="fw-600">Vê a agenda toda</span>
        </label>
      </div>
    );
  }
  if (!aberto) {
    return (
      <div style={destaque ? caixa : { marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <ShieldOff size={15} style={{ color: 'var(--text-ter)', flexShrink: 0 }} />
          <span className="text-sec" style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sem acesso ao painel</span>
          <button type="button" onClick={() => setAberto(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 0, padding: '4px 2px', cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--gold-tinta)' }}>
            <KeyRound size={14} /> Dar acesso
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...(destaque ? caixa : { marginTop: 16 }), display: 'grid', gap: 8 }}>
      <div className="text-sec text-xs">Vai ver a agenda (mexe só na coluna dele), os clientes e a conta dele. Sem dinheiro nem definições.</div>
      <input className="input" type="email" placeholder={`email ${nicho().doPro}`} value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') dar(); }} />
      <div className="flex gap-8">
        <Button size="sm" variant="primary" onClick={dar} disabled={aEnviar || !email.trim()}>{aEnviar ? 'A enviar…' : 'Enviar convite'}</Button>
        <Button size="sm" variant="ghost" onClick={() => { setAberto(false); setEmail(''); }}>Cancelar</Button>
      </div>
    </div>
  );
}
