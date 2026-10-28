import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContext';
import { useGrupo } from '@/lib/grupo';
import Ajuda from '@/components/admin/Ajuda';
import { useConfirmar } from '@/components/ui/Confirmar';

/*
 * AS CASAS DA MESMA MARCA, no painel do dono — 28/10/2026, pedido do Diogo.
 *
 * «Tudo o que faço no super admin o cliente tem de poder fazer aqui, de
 * forma simples.» Uma barbearia com dois (ou mais) espaços é UM negócio: o
 * design é o mesmo em todas as casas (copia-se sozinho); cada casa tem a
 * sua morada, telefone, agenda e equipa.
 *
 *   · JuntarOutraCasa — o cartão na Subscrição: nome da casa («Porto»),
 *     morada, telefone. Sem custo extra: o plano cobre as casas todas.
 *   · NomeDasCasas — dar nome a cada casa (o que o cliente vê na página de
 *     entrada): «Lisboa», «Porto».
 *   · EmQueCasa — num profissional: em que casas está (ambas, ou uma).
 *
 * Sem o SQL ADMIN_CASAS_2026-10-28.sql corrido nada disto se mostra.
 */
export const nomeDaCasa = n => (n?.localidade || (n?.principal ? 'principal' : n?.name) || '');

export function JuntarOutraCasa() {
  const toast = useToast();
  const grupo = useGrupo();
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ nome: '', morada: '', telefone: '' });
  const [aGravar, setAGravar] = useState(false);
  const [pedir, Confirmacao] = useConfirmar();
  if (!grupo.actual) return null;
  // Só do principal, e só quando o grupo é de casas (ou ainda não há nada ligado).
  if (grupo.ligado && grupo.lista.some(n => !n.principal && !n.casa)) return null;

  const juntar = async () => {
    setAGravar(true);
    try {
      const { data, error } = await supabase.functions.invoke('adicionar-estabelecimento', { body: { nome: f.nome.trim(), localidade: f.nome.trim(), morada: f.morada.trim(), telefone: f.telefone.trim() } });
      let erro = data?.erro;
      if (error && !erro) { try { erro = (await error.context?.json())?.erro; } catch { erro = ''; } erro = erro || error.message; }
      if (erro) throw new Error(erro);
      toast.success('Feito', `A casa «${f.nome.trim()}» já existe. Trocas entre as casas no topo do painel.`);
      setTimeout(() => { window.location.href = '/admin'; }, 1200);
    } catch (e) { toast.error('Não foi possível juntar', e.message); setAGravar(false); throw e; }
  };
  const pronto = f.nome.trim().length >= 2 && !aGravar;
  const confirmar = () => pedir({
    titulo: `Juntar a casa «${f.nome.trim()}»?`,
    texto: 'Nasce com o mesmo design, logótipo e serviços desta. O cliente escolhe a casa ao abrir o teu link; tu trocas de casa no topo do painel. Sem custo extra no plano.',
    botao: 'Sim, juntar', perigoso: false, aoConfirmar: juntar,
  });

  return (
    <div id="outra-casa" style={{ maxWidth: 720, marginBottom: 16, scrollMarginTop: 80 }}><Card className="card-pad">
      <div className="prod-sec" style={{ marginTop: 0 }}>Outra casa <Ajuda titulo="Outra casa" texto={<>
        <p>Tens a mesma barbearia em dois sítios? Junta a segunda casa: fica com o mesmo design, o mesmo logótipo e os mesmos serviços, e cada casa tem a sua agenda, a sua equipa e a sua caixa.</p>
        <p>O cliente abre o teu link e escolhe a casa (Lisboa · Porto). Tu trocas de casa no topo do painel. O teu plano cobre as casas todas.</p>
      </>} /></div>
      <div className="fw-600" style={{ fontSize: 18 }}>{grupo.ligado ? 'Mais uma casa?' : 'Tens a mesma barbearia noutro sítio?'}</div>
      {!aberto ? (
        <Button variant="primary" block onClick={() => setAberto(true)} style={{ marginTop: 14 }}><Plus size={18} /> Juntar outra casa</Button>
      ) : (
        <>
          <div className="field" style={{ marginTop: 14, marginBottom: 10 }}>
            <label className="label" htmlFor="casa-nome">Como se chama esta casa para o cliente</label>
            <input id="casa-nome" className="input" value={f.nome} maxLength={40} placeholder="Ex.: Porto" onChange={e => setF({ ...f, nome: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label className="label" htmlFor="casa-morada">Morada</label>
            <input id="casa-morada" className="input" value={f.morada} maxLength={120} placeholder="Rua, número, localidade" onChange={e => setF({ ...f, morada: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="casa-tel">Telefone desta casa</label>
            <input id="casa-tel" className="input" value={f.telefone} maxLength={20} placeholder="9xx xxx xxx" onChange={e => setF({ ...f, telefone: e.target.value })} />
          </div>
          <Button variant="primary" block onClick={confirmar} disabled={!pronto} style={{ marginTop: 16 }}>{aGravar ? 'A juntar…' : f.nome.trim().length < 2 ? 'Escreve o nome da casa' : `Juntar «${f.nome.trim()}»`}</Button>
          <Button variant="ghost" block onClick={() => setAberto(false)} style={{ marginTop: 6 }}>Cancelar</Button>
        </>
      )}
      <Confirmacao />
    </Card></div>
  );
}

/** Dar nome a cada casa — o que o cliente vê na página de entrada. */
export function NomeDasCasas() {
  const toast = useToast();
  const grupo = useGrupo();
  const [valores, setValores] = useState({});
  useEffect(() => { setValores(Object.fromEntries(grupo.lista.map(n => [n.id, n.localidade || '']))); }, [grupo.lista.length]);
  if (!grupo.ligado || !grupo.lista.every(n => n.principal || n.casa)) return null;
  const gravar = async n => {
    const v = (valores[n.id] || '').trim();
    if (v === (n.localidade || '')) return;
    const { error } = await supabase.rpc('guardar_localidade_da_casa', { p_casa: n.id, p_localidade: v });
    if (error) { toast.error('Não ficou guardado', error.message); return; }
    n.localidade = v;
    toast.success('Guardado', `${n.name} → «${v || n.name}»`);
  };
  return (
    <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
      <div className="prod-sec" style={{ marginTop: 0 }}><MapPin size={16} style={{ verticalAlign: -3 }} /> As tuas casas</div>
      <div style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 12 }}>O nome que o cliente vê para escolher a casa — «Lisboa», «Porto». Curto e claro.</div>
      <div style={{ display: 'grid', gap: 10 }}>
        {grupo.lista.map(n => (
          <div key={n.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 160px', gap: 10, alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <b style={{ fontSize: 15 }}>{n.name}</b>{n.principal && <span style={{ fontSize: 12, color: 'var(--text-sec)' }}> · principal</span>}
              <div style={{ fontSize: 13, color: 'var(--text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.morada || `${n.slug}.marcacoes.app`}</div>
            </div>
            <input className="input" value={valores[n.id] ?? ''} maxLength={40} placeholder={n.principal ? 'Lisboa' : 'Porto'} onChange={e => setValores(v => ({ ...v, [n.id]: e.target.value }))} onBlur={() => gravar(n)} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Num profissional: em que casas está. Ligar põe-no também na outra casa (copia a ficha); desligar tira-o de lá. */
export function EmQueCasa({ pro }) {
  const toast = useToast();
  const grupo = useGrupo();
  const [mapa, setMapa] = useState(null);
  const [aMudar, setAMudar] = useState('');
  const ler = () => supabase.rpc('casas_dos_profissionais').then(({ data }) => setMapa(data || [])).catch(() => setMapa([]));
  useEffect(() => { ler(); }, [pro?.id]);
  if (!grupo.ligado || !grupo.lista.every(n => n.principal || n.casa) || !pro || mapa === null) return null;
  const k = String(pro.name || '').trim().toLowerCase();
  const esta = c => mapa.some(m => m.nome === k && m.casa === c.id && m.ativo);
  const alternar = async c => {
    setAMudar(c.id);
    try {
      if (esta(c)) {
        if (c.actual) { toast.error('Esta é a casa onde estás', 'Para o tirares daqui, desativa a ficha dele em Profissionais.'); return; }
        const { error } = await supabase.rpc('tirar_profissional_da_casa', { p_nome: pro.name, p_casa: c.id });
        if (error) throw error;
        toast.success('Feito', `${pro.name} deixou de estar em ${nomeDaCasa(c)}.`);
      } else {
        const { error } = await supabase.rpc('copiar_profissional_para_casa', { p_pro: pro.id, p_casa: c.id });
        if (error) throw error;
        toast.success('Feito', `${pro.name} também está em ${nomeDaCasa(c)}. O horário dele lá define-se nessa casa.`);
      }
      await ler();
    } catch (e) { toast.error('Não deu', e.message); } finally { setAMudar(''); }
  };
  return (
    <div className="nt-row" style={{ display: 'block' }}>
      <span className="nt-txt" style={{ display: 'block', marginBottom: 8 }}><b>Em que casa</b><span>Ambas, ou só uma. A receção costuma estar nas duas.</span></span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {grupo.lista.map(c => {
          const on = esta(c);
          return (
            <button key={c.id} type="button" disabled={aMudar === c.id} onClick={() => alternar(c)}
              style={{ padding: '7px 12px', borderRadius: 999, cursor: 'pointer', font: 'inherit', fontSize: 13.5, fontWeight: on ? 700 : 500, display: 'inline-flex', alignItems: 'center', gap: 5,
                background: on ? 'rgba(var(--gold-rgb),0.18)' : 'var(--surface)', color: 'var(--text)', border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}` }}>
              {on && <Check size={14} />}{nomeDaCasa(c)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
