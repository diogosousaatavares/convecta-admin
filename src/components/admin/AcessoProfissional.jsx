import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useStore';
import { Crown } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useConfirmar } from '@/components/ui/Confirmar';
import { n as nicho } from '@/lib/nicho';
import Ajuda from '@/components/admin/Ajuda';
import Toggle from '@/components/admin/Toggle';

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

export default function AcessoProfissional({ profissional, acesso, onMudou, emailInicial = '', abertoInicial = false }) {
  const toast = useToast();
  const { meuProfissionalId, isProfissional } = useAuth();
  const [aberto, setAberto] = useState(abertoInicial);
  // Os hooks vêm TODOS antes de qualquer return: ao ligar/desligar a ficha
  // do dono, o ramo «És tu» mudava a ordem dos hooks e o React rebentava
  // (ecrã de erro em Equipa › Acessos).
  const [email, setEmail] = useState(emailInicial || profissional?.email || '');
  const [aEnviar, setAEnviar] = useState(false);
  const [pedir, Confirmacao] = useConfirmar();
  // A ficha é a do próprio dono: ele entra com a conta dele, não precisa de convite.
  if (!isProfissional && meuProfissionalId && profissional?.id === meuProfissionalId) {
    return (
      <div className="nt-row">
        <Crown size={18} style={{ color: 'var(--gold-tinta)', flexShrink: 0 }} />
        <span className="nt-txt"><b>És tu, o dono</b><span>Vês e mexes em tudo</span></span>
      </div>
    );
  }

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

  /*
   * Linhas com separador, como o resto do painel (15/10/2026): «Acesso ao
   * painel» com o email por baixo e o botão à direita; «Vê a agenda toda»
   * com um interruptor. O (i) explica o que um profissional com acesso vê.
   */
  const ajuda = <Ajuda titulo="Acesso ao painel" texto={<>
    <p>Com acesso, a pessoa entra em administrador.marcacoes.app com o email dele e vê a agenda, os clientes e a conta dele (comissões e gorjetas).</p>
    <p>Não vê dinheiro, produtos, serviços, equipa nem definições. Com «Vê a agenda toda» desligado, só vê a coluna dele.</p>
  </>} />;
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
      <>
        <div className="nt-row">
          <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span className="nt-txt"><b>Acesso ao painel {ajuda}</b><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acesso.email}</span></span>
          <Button size="sm" variant="ghost" onClick={remover} disabled={aEnviar}>Remover</Button>
        </div>
        <Confirmacao />
        <div className="nt-row">
          <span className="nt-txt"><b>Vê a agenda toda</b></span>
          <Toggle checked={perm.agenda_toda !== false} onChange={x => mudar('agenda_toda', x)} />
        </div>
      </>
    );
  }
  if (!aberto) {
    return (
      <div className="nt-row">
        <ShieldOff size={18} style={{ color: 'var(--text-ter)', flexShrink: 0 }} />
        <span className="nt-txt"><b>Acesso ao painel {ajuda}</b><span>Sem acesso</span></span>
        <Button size="sm" variant="primary" onClick={() => setAberto(true)}><KeyRound size={14} /> Dar acesso</Button>
      </div>
    );
  }
  return (
    <div className="nt-row" style={{ display: 'grid', gap: 10 }}>
      <span className="nt-txt"><b>Acesso ao painel {ajuda}</b></span>
      <input className="input" type="email" placeholder="Email da pessoa" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') dar(); }} />
      <div className="botoes-iguais">
        <Button size="sm" variant="ghost" onClick={() => { setAberto(false); setEmail(''); }}>Cancelar</Button>
        <Button size="sm" variant="primary" onClick={dar} disabled={aEnviar || !email.trim()}>{aEnviar ? 'A enviar…' : 'Enviar convite'}</Button>
      </div>
    </div>
  );
}
