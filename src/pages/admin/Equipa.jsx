import React, { useMemo, useState } from 'react';
import { Users, ShieldCheck, ShieldOff, Eye, EyeOff, Pencil, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore, useAuth } from '@/hooks/useStore';
import { supabase } from '@/lib/supabase';
import authService from '@/lib/authService';
import { useToast } from '@/components/ui/ToastContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import AcessoProfissional, { useAcessos } from '@/components/admin/AcessoProfissional';

// O que cada tipo de pessoa vê no painel. É o espelho das regras da base de
// dados (ACESSO_PROFISSIONAL.sql) e de modulos.js — mudar num sítio é mudar nos três.
const AREAS = [
  { nome: 'Agenda', dono: 'tudo', pro: 'parcial', notaPro: 'mexe só na coluna dele; o dono escolhe em cada um se vê a agenda toda ou só a dele' },
  { nome: 'Confirmar presença e cobrar', dono: 'tudo', pro: 'parcial', notaPro: 'só as marcações dele' },
  { nome: 'Clientes', dono: 'tudo', pro: 'tudo', notaPro: 'vê e edita as fichas' },
  { nome: 'Lista de espera', dono: 'tudo', pro: 'parcial', notaPro: 'só a dele' },
  { nome: 'Férias e folgas', dono: 'tudo', pro: 'parcial', notaPro: 'só as dele' },
  { nome: 'A conta dele (comissões)', dono: 'tudo', pro: 'parcial', notaPro: 'só os números dele' },
  { nome: 'Notificações', dono: 'tudo', pro: 'tudo', notaPro: '' },
  { nome: 'Financeiro e caixa', dono: 'tudo', pro: 'nada', notaPro: 'não vê a faturação nem a caixa' },
  { nome: 'Produtos e stock', dono: 'tudo', pro: 'nada', notaPro: 'pode vender no checkout, não gere' },
  { nome: 'Serviços e preços', dono: 'tudo', pro: 'nada', notaPro: '' },
  { nome: 'Profissionais e equipa', dono: 'tudo', pro: 'nada', notaPro: 'não cria nem apaga colegas' },
  { nome: 'Site, cores e redes', dono: 'tudo', pro: 'nada', notaPro: '' },
  { nome: 'Definições e subscrição', dono: 'tudo', pro: 'nada', notaPro: '' },
];

const COR = { tudo: 'var(--success)', parcial: 'var(--gold)', nada: 'var(--error)' };
const TXT = { tudo: 'Vê e mexe', parcial: 'Só o dele', nada: 'Não vê' };

function Ponto({ nivel }) {
  const Icone = nivel === 'nada' ? EyeOff : nivel === 'parcial' ? Pencil : Eye;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COR[nivel], fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <Icone size={14} /> {TXT[nivel]}
    </span>
  );
}

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
  const dono = data.user || {};
  const comAcesso = pros.filter(p => acessos.de(p.id)).length;
  const pro = pros.find(p => p.id === selecionado);
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
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Users size={22} /> Equipa e acessos</h1>
        <p>{pros.length} {pros.length === 1 ? 'profissional' : 'profissionais'}, {comAcesso} com acesso ao painel.</p>
      </div>

      {/* Uma linha por pessoa, e mais nada.

          Antes eram tres blocos a dizer o mesmo: o cartao «Tu, o dono, tambem
          cortas? Ligado a ficha X», o no «Dono · ve tudo» da Distribuicao, e
          depois a mesma pessoa outra vez na lista com «Es tu». O que se quer
          saber aqui e quem tem acesso ao painel — e isso le-se na lista. */}
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {/* O dono so aparece a parte quando nao esta ligado a ficha nenhuma.
            Se estiver, ja esta na lista, com a coroa. */}
        {!minhaFicha && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', gap: 11 }}>
            <Crown size={18} style={{ color: 'var(--gold-tinta)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <div className="fw-600">{dono.name || 'Dono'}</div>
              <div className="text-sec text-sm">Não corta</div>
            </div>
            <span className="text-sm" style={{ color: 'var(--gold-tinta)', fontWeight: 600, whiteSpace: 'nowrap' }}>Vê tudo</span>
          </div>
        )}

        {pros.map(p => {
          const a = acessos.de(p.id);
          const ativo = selecionado === p.id;
          const euMesmo = p.id === meuProfissionalId;
          return (
            <button key={p.id} type="button" onClick={() => setSelecionado(ativo ? null : p.id)}
              style={{ padding: '10px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', background: 'var(--surface)', border: `2px solid ${ativo ? 'var(--gold)' : euMesmo ? 'var(--gold)' : a ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 11 }}>
              <Avatar name={p.name} src={p.photoUrl} />
              <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                <div className="fw-600">{p.name}</div>
                <div className="text-sec text-sm">{p.role || 'Profissional'}</div>
              </div>
              <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 5, color: euMesmo ? 'var(--gold-tinta)' : a ? 'var(--success)' : 'var(--text-sec)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {euMesmo ? <><Crown size={14} /> És tu</> : a ? <><ShieldCheck size={14} /> Com acesso</> : <><ShieldOff size={14} /> Sem acesso</>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ligar a conta do dono a uma ficha. So aparece quando ainda nao esta
          ligada — depois disso a pergunta nao faz sentido, e desligar e uma
          coisa que se faz na ficha, nao no topo da pagina. */}
      {!minhaFicha && pros.some(p => !acessos.de(p.id)) && (
        <div className="linha-opcao" style={{ cursor: 'default', flexWrap: 'wrap' }}>
          <Crown size={17} style={{ flexShrink: 0, color: 'var(--gold-tinta)' }} />
          <span className="rotulo">Também cortas?</span>
          <select className="select" value={escolhaDono} onChange={e => setEscolhaDono(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Qual é a tua ficha</option>
            {pros.filter(p => !acessos.de(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Button variant="primary" size="sm" disabled={!escolhaDono || aLigar} onClick={() => ligarDono(escolhaDono)}>Ligar</Button>
        </div>
      )}

      {pro && (
        <Card className="mb-24">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Avatar name={pro.name} src={pro.photoUrl} />
            <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <div className="fw-600">{pro.name}</div>
              <div className="text-sec text-sm">{pro.role || 'Profissional'}{pro.email ? ` · ${pro.email}` : ' · sem email na ficha'}</div>
            </div>
            <Link to="/admin/profissionais"><Button size="sm" variant="ghost">Editar ficha</Button></Link>
          </div>
          {pro.id === meuProfissionalId && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: 180 }}>És tu. A tua conta de dono está ligada a esta ficha.</span>
              <Button variant="ghost" size="sm" disabled={aLigar} onClick={() => ligarDono(null)}>Desligar</Button>
            </div>
          )}
          <AcessoProfissional profissional={pro} acesso={acessos.de(pro.id)} onMudou={acessos.recarregar} destaque />
        </Card>
      )}

      {/* No telemovel esta tabela de referencia era o terco de baixo do ecra
          em letra miuda, e nao se faz nada com ela. Fica no computador. */}
      <Card style={{ display: estreito ? 'none' : undefined }}>
        <div className="fw-600" style={{ marginBottom: 4 }}>Quem vê o quê</div>
        <p className="text-sec text-sm" style={{ marginTop: 0 }}>É a regra da casa, trancada na base de dados. O dono vê tudo; um profissional com acesso vê só o que lhe toca. O que se pode ajustar em cada um está no bloco de acesso (toca no profissional em cima).</p>
        {estreito ? (
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600, padding: '9px 0' }}>
              Ver área a área
            </summary>
            <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
              {AREAS.map(a => (
                <div key={a.nome} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="fw-600" style={{ fontSize: 15 }}>{a.nome}</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 5 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Crown size={13} style={{ color: 'var(--gold-tinta)' }} /><Ponto nivel={a.dono} />
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ShieldCheck size={13} style={{ color: 'var(--success)' }} /><Ponto nivel={a.pro} />
                    </span>
                  </div>
                  {a.notaPro && <div className="text-sec text-sm" style={{ marginTop: 4 }}>{a.notaPro}</div>}
                </div>
              ))}
            </div>
          </details>
        ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Área</th>
                <th><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Crown size={14} style={{ color: 'var(--gold-tinta)' }} /> Dono</span></th>
                <th><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} style={{ color: 'var(--success)' }} /> Profissional com acesso</span></th>
              </tr>
            </thead>
            <tbody>
              {AREAS.map(a => (
                <tr key={a.nome}>
                  <td className="fw-600">{a.nome}</td>
                  <td><Ponto nivel={a.dono} /></td>
                  <td>
                    <Ponto nivel={a.pro} />
                    {a.notaPro && <div className="text-sec text-sm" style={{ marginTop: 2 }}>{a.notaPro}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge variant="success">Sem acesso = não entra no painel</Badge>
          <Badge>Um profissional só cobra as marcações dele</Badge>
        </div>
      </Card>
    </AdminLayout>
  );
}
