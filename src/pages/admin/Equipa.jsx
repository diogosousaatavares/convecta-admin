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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COR[nivel], fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
      <Icone size={14} /> {TXT[nivel]}
    </span>
  );
}

/* O "canvas": o dono em cima, os profissionais em baixo, ligados por linhas.
   Desenhado em SVG para escalar com o ecrã; os cartões são HTML por cima. */
function Distribuicao({ dono, pros, acessos, selecionado, onSelecionar, meuProfissionalId }) {
  const n = Math.max(pros.length, 1);
  const larguraCartao = 150, gap = 16;
  const largura = Math.max(n * (larguraCartao + gap) + gap, 360);
  const yDono = 20, yPro = 140, alturaCartao = 96;
  const xDe = (i) => gap + i * (larguraCartao + gap) + larguraCartao / 2;
  const xDono = largura / 2;
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ position: 'relative', width: largura, height: yPro + alturaCartao + 12, margin: '0 auto' }}>
        <svg width={largura} height={yPro + alturaCartao + 12} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          {pros.map((p, i) => {
            const tem = !!acessos.de(p.id);
            const eu = p.id === meuProfissionalId;
            const x = xDe(i);
            return <path key={p.id} d={`M ${xDono} ${yDono + 78} C ${xDono} ${yPro - 20}, ${x} ${yDono + 90}, ${x} ${yPro}`} fill="none" stroke={eu ? 'var(--gold)' : tem ? 'var(--success)' : 'var(--border)'} strokeWidth={tem || eu ? 2.5 : 2} strokeDasharray={tem || eu ? '' : '6 5'} />;
          })}
        </svg>
        {/* Dono */}
        <div style={{ position: 'absolute', left: xDono - 110, top: yDono, width: 220, padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '2px solid var(--gold)', boxShadow: 'var(--shadow-gold)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Crown size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div className="fw-600" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dono.name || 'Dono'}</div>
            <div className="text-sec text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dono.email}</div>
            <div className="text-xs" style={{ color: 'var(--gold)', fontWeight: 600 }}>Dono · vê tudo</div>
          </div>
        </div>
        {/* Profissionais */}
        {pros.map((p, i) => {
          const a = acessos.de(p.id);
          const ativo = selecionado === p.id;
          const euMesmo = p.id === meuProfissionalId;
          return (
            <button key={p.id} type="button" onClick={() => onSelecionar(ativo ? null : p.id)}
              style={{ position: 'absolute', left: xDe(i) - larguraCartao / 2, top: yPro, width: larguraCartao, height: alturaCartao, padding: '10px 10px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', background: 'var(--surface)', border: `2px solid ${ativo ? 'var(--gold)' : euMesmo ? 'rgba(var(--gold-rgb),0.6)' : a ? 'var(--success)' : 'var(--border)'}`, boxShadow: ativo ? 'var(--shadow-gold)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={p.name} src={p.photoUrl} />
                <div className="fw-600" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              </div>
              <div className="text-sec text-xs" style={{ marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role || 'Profissional'}</div>
              <div className="text-xs" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: euMesmo ? 'var(--gold)' : a ? 'var(--success)' : 'var(--text-sec)', fontWeight: 600, background: 'var(--surface)', position: 'relative' }}>
                {euMesmo ? <><Crown size={13} /> És tu</> : a ? <><ShieldCheck size={13} /> Com acesso</> : <><ShieldOff size={13} /> Sem acesso</>}
              </div>
            </button>
          );
        })}
        {pros.length === 0 && (
          <div className="text-sec text-sm" style={{ position: 'absolute', left: 0, right: 0, top: yPro + 30, textAlign: 'center' }}>Ainda não há profissionais. <Link to="/admin/profissionais">Criar o primeiro</Link>.</div>
        )}
      </div>
    </div>
  );
}

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
        <p>Quem entra no painel e o que cada um vê. {pros.length} {pros.length === 1 ? 'profissional' : 'profissionais'}, {comAcesso} com acesso.</p>
      </div>

      <Card className="mb-24">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Crown size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="fw-600">Tu, o dono, também cortas?</div>
            <div className="text-sec text-xs">{minhaFicha ? `A tua conta está ligada à ficha «${minhaFicha.name}»: a tua coluna na agenda, as tuas comissões, os teus clientes.` : 'Liga a tua conta a uma ficha de profissional para teres a tua coluna na agenda e a tua conta de comissões.'}</div>
          </div>
          {minhaFicha ? (
            <Button variant="ghost" size="sm" disabled={aLigar} onClick={() => ligarDono(null)}>Desligar</Button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="select" value={escolhaDono} onChange={e => setEscolhaDono(e.target.value)} style={{ width: 'auto' }}>
                <option value="">Qual ficha és tu?</option>
                {pros.filter(p => !acessos.de(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button variant="primary" size="sm" disabled={!escolhaDono || aLigar} onClick={() => ligarDono(escolhaDono)}>Ligar</Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-24">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div className="fw-600">Distribuição</div>
          <div className="text-sec text-xs" style={{ display: estreito ? 'none' : 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 18, borderTop: '2.5px solid var(--success)', verticalAlign: 'middle', marginRight: 6 }} />com acesso</span>
            <span><span style={{ display: 'inline-block', width: 18, borderTop: '2px dashed var(--border)', verticalAlign: 'middle', marginRight: 6 }} />sem acesso</span>
          </div>
        </div>
        {estreito ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Crown size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="fw-600" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dono.name || 'Dono'}{minhaFicha ? ` · ${minhaFicha.name}` : ''}</div>
                <div className="text-xs" style={{ color: 'var(--gold)', fontWeight: 600 }}>Dono · vê tudo</div>
              </div>
            </div>
            {pros.map(p => {
              const a = acessos.de(p.id); const ativo = selecionado === p.id; const euMesmo = p.id === meuProfissionalId;
              return (
                <button key={p.id} type="button" onClick={() => setSelecionado(ativo ? null : p.id)}
                  style={{ padding: '10px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', background: 'var(--surface)', border: `2px solid ${ativo ? 'var(--gold)' : euMesmo ? 'rgba(var(--gold-rgb),0.5)' : a ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={p.name} src={p.photoUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw-600" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div className="text-sec text-xs">{p.role || 'Profissional'}</div>
                  </div>
                  <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: 5, color: euMesmo ? 'var(--gold)' : a ? 'var(--success)' : 'var(--text-sec)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {euMesmo ? <><Crown size={13} /> És tu</> : a ? <><ShieldCheck size={13} /> Com acesso</> : <><ShieldOff size={13} /> Sem acesso</>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Distribuicao dono={dono} pros={pros} acessos={acessos} selecionado={selecionado} onSelecionar={setSelecionado} meuProfissionalId={meuProfissionalId} />
        )}
        <div className="text-sec text-xs" style={{ marginTop: 8 }}>Toca num profissional para dar ou tirar o acesso.</div>
        {pro && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={pro.name} src={pro.photoUrl} />
              <div style={{ flex: 1 }}>
                <div className="fw-600">{pro.name}</div>
                <div className="text-sec text-xs">{pro.role || 'Profissional'}{pro.email ? ` · ${pro.email}` : ' · sem email na ficha'}</div>
              </div>
              <Link to="/admin/profissionais"><Button size="sm" variant="ghost">Editar ficha</Button></Link>
            </div>
            <AcessoProfissional profissional={pro} acesso={acessos.de(pro.id)} onMudou={acessos.recarregar} destaque />
          </div>
        )}
      </Card>

      <Card>
        <div className="fw-600" style={{ marginBottom: 4 }}>Quem vê o quê</div>
        <p className="text-sec text-sm" style={{ marginTop: 0 }}>É a regra da casa, trancada na base de dados. O dono vê tudo; um profissional com acesso vê só o que lhe toca. O que se pode ajustar em cada um está no bloco de acesso (toca no profissional em cima).</p>
        {estreito ? (
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '9px 0' }}>
              Ver área a área
            </summary>
            <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
              {AREAS.map(a => (
                <div key={a.nome} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="fw-600" style={{ fontSize: 13 }}>{a.nome}</div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 5 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Crown size={13} style={{ color: 'var(--gold)' }} /><Ponto nivel={a.dono} />
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ShieldCheck size={13} style={{ color: 'var(--success)' }} /><Ponto nivel={a.pro} />
                    </span>
                  </div>
                  {a.notaPro && <div className="text-sec text-xs" style={{ marginTop: 4 }}>{a.notaPro}</div>}
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
                <th><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Crown size={14} style={{ color: 'var(--gold)' }} /> Dono</span></th>
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
                    {a.notaPro && <div className="text-sec text-xs" style={{ marginTop: 2 }}>{a.notaPro}</div>}
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
