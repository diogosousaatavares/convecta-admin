import PageInfo from '@/components/admin/PageInfo';
import React, { useMemo, useState } from 'react';
import { Users, ShieldCheck, ShieldOff, Eye, EyeOff, Pencil, Crown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore, useAuth } from '@/hooks/useStore';
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';
import authService from '@/lib/authService';
import { useToast } from '@/components/ui/ToastContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, Avatar, Button, Modal } from '@/components/ui';
import AcessoProfissional, { useAcessos } from '@/components/admin/AcessoProfissional';
import { SugestaoSegundoTipo } from '@/components/admin/SegundoTipo';

// O que cada tipo de pessoa vê no painel. É o espelho das regras da base de
// dados (ACESSO_PROFISSIONAL.sql) e de modulos.js — mudar num sítio é mudar nos três.
const AREAS = [
  { nome: 'Agenda', dono: 'tudo', pro: 'parcial' },
  { nome: 'Confirmar presença e cobrar', dono: 'tudo', pro: 'parcial' },
  { nome: 'Clientes', dono: 'tudo', pro: 'tudo' },
  { nome: 'Lista de espera', dono: 'tudo', pro: 'parcial' },
  { nome: 'Férias e folgas', dono: 'tudo', pro: 'parcial' },
  { nome: 'A conta dele (comissões)', dono: 'tudo', pro: 'parcial' },
  { nome: 'Notificações', dono: 'tudo', pro: 'tudo' },
  { nome: 'Financeiro e caixa', dono: 'tudo', pro: 'nada' },
  { nome: 'Produtos e stock', dono: 'tudo', pro: 'nada' },
  { nome: 'Serviços e preços', dono: 'tudo', pro: 'nada' },
  { nome: 'Profissionais e equipa', dono: 'tudo', pro: 'nada' },
  { nome: 'Site, cores e redes', dono: 'tudo', pro: 'nada' },
  { nome: 'Definições e subscrição', dono: 'tudo', pro: 'nada' },
];

/*
 * TRES ESTADOS, TRES PASTILHAS.
 *
 * Eram tres frases a verde, amarelo e vermelho, e por baixo de quase todas
 * uma linha de letra pequena a dizer por outras palavras o mesmo. Treze
 * areas vezes duas colunas vezes duas linhas e um texto, nao uma tabela —
 * e uma tabela existe para se ler de relance.
 *
 * Fica uma pastilha por celula, todas do mesmo tamanho e alinhadas em
 * coluna: a diferenca entre linhas ve-se pela cor, antes de se ler uma
 * unica palavra.
 */
const NIVEIS = {
  tudo:    { l: 'Vê e mexe', Ic: Eye,    cor: '#16A34A', rgb: '34,197,94' },
  parcial: { l: 'Só o dele', Ic: Pencil, cor: 'var(--gold-tinta)', rgb: 'var(--gold-rgb)' },
  nada:    { l: 'Não vê',    Ic: EyeOff, cor: '#DC2626',   rgb: '239,68,68' },
};


/* A arvore em SVG — o dono em cima, os profissionais em baixo, ligados por
   linhas — foi-se embora a 02/10/2026. Quando o dono tambem corta, e o caso
   normal numa barbearia pequena, ele aparecia no no de cima E outra vez na
   linha dele em baixo: a mesma pessoa duas vezes no mesmo ecra, com dois
   rotulos diferentes. Uma lista com uma linha por pessoa diz o mesmo e
   le-se de uma vez. */

export default function Equipa() {
  const data = useStore();
  const acessos = useAcessos(data.business?.id);
  const [selecionado, setSelecionado] = useState(null);
  const pros = useMemo(() => (data.professionals || []).filter(p => p.isActive !== false), [data.professionals]);
  /*
   * A RECEÇÃO (23/10/2026, pedido de um founder). Quem está ao balcão não
   * corta: precisa da agenda de toda a gente, dos clientes, de cobrar e da
   * caixa — e de mais nada. É uma ficha de profissional «Receção», inativa
   * (não aparece na app nem na agenda como coluna), com acesso ao painel
   * e a permissão `rececao`.
   */
  const rececao = useMemo(() => (data.professionals || []).find(p => p.rececao === true) || null, [data.professionals]);
  const [aCriarRececao, setACriarRececao] = useState(false);
  const criarRececao = async () => {
    setACriarRececao(true);
    try {
      const p = await dataService.createProfessional({ name: 'Receção', role: 'Receção', isActive: false, rececao: true, commission: 0 });
      setSelecionado(p.id);
    } catch (e) { toast.error('Não ficou criada', e.message); }
    finally { setACriarRececao(false); }
  };
  const dono = data.user || {};
  const comAcesso = pros.filter(p => acessos.de(p.id)).length;
  const pro = pros.find(p => p.id === selecionado) || (rececao && rececao.id === selecionado ? rececao : null);
  const toast = useToast();
  const { meuProfissionalId } = useAuth();
  const [aLigar, setALigar] = useState(false);
  const minhaFicha = pros.find(p => p.id === meuProfissionalId) || null;
  const [escolhaDono, setEscolhaDono] = useState('');
  // O dono também é barbeiro: liga a conta dele a uma ficha (ou desliga).
  const ligarDono = async (id) => {
    setALigar(true);
    const { error } = await supabase.rpc('ligar_dono_a_profissional', { p_professional_id: id || null });
    setALigar(false);
    if (error) { toast.error('Não ficou gravado', error.message); return; }
    await authService.recarregar();
    toast.success(id ? 'Ligado' : 'Desligado', id ? `A tua conta é agora o ${pros.find(p => p.id === id)?.name}.` : 'A tua conta já não está ligada a nenhuma ficha.');
    setEscolhaDono('');
  };
  const estreito = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <AdminLayout>
      <div className="page-head">
        <div className="h1-com-ajuda"><h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>Acessos</h1><PageInfo /></div>
      </div>

      <SugestaoSegundoTipo />

      {/* Uma linha por pessoa, e mais nada.

          Antes eram tres blocos a dizer o mesmo: o cartao «Tu, o dono, tambem
          cortas? Ligado a ficha X», o no «Dono · ve tudo» da Distribuicao, e
          depois a mesma pessoa outra vez na lista com «Es tu». O que se quer
          saber aqui e quem tem acesso ao painel — e isso le-se na lista. */}
      <div className="lin-lista" style={{ marginBottom: 16 }}>
        {/* O dono so aparece a parte quando nao esta ligado a ficha nenhuma.
            Se estiver, ja esta na lista, com a coroa. */}
        {!minhaFicha && (
          <div className="lin" style={{ cursor: 'default' }}>
            <Avatar name={dono.name || 'Dono'} />
            <span className="lin-txt"><b>{dono.name || 'Dono'}</b><span>Dono · não corta</span></span>
            <span className="lin-valor" style={{ color: 'var(--gold-tinta)', display: 'flex', alignItems: 'center', gap: 5 }}><Crown size={14} /> Vê tudo</span>
          </div>
        )}

        {pros.map(p => {
          const a = acessos.de(p.id);
          const euMesmo = p.id === meuProfissionalId;
          return (
            <button key={p.id} type="button" className="lin" onClick={() => setSelecionado(p.id)}>
              <Avatar name={p.name} src={p.photoUrl} />
              <span className="lin-txt"><b>{p.name}</b><span>{p.role || 'Profissional'}</span></span>
              <span className="lin-valor" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 5, color: euMesmo ? 'var(--gold-tinta)' : a ? 'var(--success)' : 'var(--text-sec)' }}>
                {euMesmo ? <><Crown size={14} /> És tu</> : a ? <><ShieldCheck size={14} /> Com acesso</> : <><ShieldOff size={14} /> Sem acesso</>}
              </span>
              <ChevronRight size={18} className="lin-seta" />
            </button>
          );
        })}

        {rececao ? (
          <button type="button" className="lin" onClick={() => setSelecionado(rececao.id)}>
            <Avatar name="Receção" />
            <span className="lin-txt"><b>Receção</b><span>Balcão · agenda de todos, clientes, cobrar e caixa</span></span>
            <span className="lin-valor" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 5, color: acessos.de(rececao.id) ? 'var(--success)' : 'var(--text-sec)' }}>
              {acessos.de(rececao.id) ? <><ShieldCheck size={14} /> Com acesso</> : <><ShieldOff size={14} /> Sem acesso</>}
            </span>
            <ChevronRight size={18} className="lin-seta" />
          </button>
        ) : (
          <button type="button" className="lin" disabled={aCriarRececao} onClick={criarRececao}>
            <Avatar name="R" />
            <span className="lin-txt"><b>+ Receção</b><span>Um acesso para o balcão: vê a agenda de todos, marca, cobra e abre a caixa.</span></span>
            <ChevronRight size={18} className="lin-seta" />
          </button>
        )}
      </div>

      {/* Ligar a conta do dono a uma ficha. So aparece quando ainda nao esta
          ligada — depois disso a pergunta nao faz sentido, e desligar e uma
          coisa que se faz na ficha, nao no topo da pagina. */}
      {!minhaFicha && pros.some(p => !acessos.de(p.id)) && (
        <div className="nt-row" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Crown size={17} style={{ flexShrink: 0, color: 'var(--gold-tinta)' }} />
          <span className="nt-txt"><b>Também cortas?</b></span>
          <select className="select" value={escolhaDono} onChange={e => setEscolhaDono(e.target.value)} style={{ width: 'auto' }}>
            <option value="">A tua ficha</option>
            {pros.filter(p => !acessos.de(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button variant="primary" size="sm" disabled={!escolhaDono || aLigar} onClick={() => ligarDono(escolhaDono)}>Ligar</Button>
        </div>
      )}

      {/* A ficha de acesso abre numa janela (15/10/2026): nome, função e
          email em cima, as linhas do acesso, e os botões em baixo. */}
      <Modal open={!!pro} onClose={() => setSelecionado(null)} title={pro?.name || ''}>
        {pro && (
          <>
            <div className="nt-lista">
              <div className="nt-row">
                <Avatar name={pro.name} src={pro.photoUrl} />
                <span className="nt-txt"><b>{pro.role || 'Profissional'}</b><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pro.email || 'Sem email na ficha'}</span></span>
              </div>
              <AcessoProfissional profissional={pro} acesso={acessos.de(pro.id)} onMudou={acessos.recarregar} />
            </div>
            <div className="botoes-iguais" style={{ marginTop: 18 }}>
              <Link to="/admin/profissionais" className="btn btn-secondary">Editar ficha</Link>
              {pro.id === meuProfissionalId
                ? <Button variant="ghost" disabled={aLigar} onClick={() => ligarDono(null)}>Desligar da minha conta</Button>
                : <Button variant="primary" onClick={() => setSelecionado(null)}>Fechar</Button>}
            </div>
          </>
        )}
      </Modal>

      {/* No telemovel esta tabela de referencia era o terco de baixo do ecra
          em letra miuda, e nao se faz nada com ela. Fica no computador. */}
      <Card style={{ display: estreito ? 'none' : undefined, padding: '22px 24px' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS_QVQ }} />
        {/* Era uma tabela de treze linhas em que a coluna do dono dizia
            «Ve e mexe» treze vezes. O dono ve tudo — diz-se uma vez, no
            canto — e o que interessa e o que ve um profissional com
            acesso, arrumado pelos tres niveis (09/10/2026). */}
        <div className="qvq-topo">
          <div className="qvq-h">Quem vê o quê</div>
          <span className="qvq-dono"><Crown size={14} /> O dono vê e mexe em tudo</span>
        </div>
        <div className="qvq-sub"><ShieldCheck size={15} /> Um profissional com acesso</div>
        <div className="qvq-grupos">
          {['tudo', 'parcial', 'nada'].map(nv => {
            const n = NIVEIS[nv];
            const lista = AREAS.filter(a => a.pro === nv);
            return (
              <div key={nv} className="qvq-grupo" style={{ '--qvq-cor': n.cor, '--qvq-rgb': n.rgb }}>
                <div className="qvq-grupo-cab">
                  <span className="qvq-ico"><n.Ic size={15} /></span>
                  <b>{n.l}</b>
                  <span className="qvq-n">{lista.length}</span>
                </div>
                <ul>{lista.map(a => <li key={a.nome}>{a.nome}</li>)}</ul>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminLayout>
  );
}

const CSS_QVQ = `
.qvq-topo { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.qvq-h { font-size: 18px; font-weight: 700; }
.qvq-dono { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px;
  background: rgba(var(--gold-rgb), .14); color: var(--gold-tinta); font-size: 13px; font-weight: 700; white-space: nowrap; }
.qvq-sub { display: flex; align-items: center; gap: 7px; margin: 18px 0 12px; font-size: 12px; font-weight: 700;
  letter-spacing: .07em; text-transform: uppercase; color: var(--text-ter); }
.qvq-grupos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.qvq-grupo { border: 1px solid var(--border); border-radius: 14px; overflow: hidden; background: var(--surface); }
.qvq-grupo-cab { display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: rgba(var(--qvq-rgb), .10); border-bottom: 1px solid var(--border); }
.qvq-grupo-cab b { flex: 1; font-size: 15px; color: var(--qvq-cor); }
.qvq-ico { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center;
  background: rgba(var(--qvq-rgb), .16); color: var(--qvq-cor); flex-shrink: 0; }
.qvq-n { min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; display: grid; place-items: center;
  background: var(--surface); color: var(--text-sec); font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
.qvq-grupo ul { list-style: none; margin: 0; padding: 4px 0; }
.qvq-grupo li { padding: 10px 14px; font-size: 14.5px; font-weight: 500; }
.qvq-grupo li + li { border-top: 1px solid var(--border); }
`;
