import React, { useState, useEffect } from 'react';
import { UserCog, Plus, Pencil, Trash2, Lock, ShieldCheck, ShieldOff, Crown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, Badge, Button, EmptyState, Modal, Stars } from '@/components/ui';
import dataService, { uploadProfessionalPhoto } from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import FotoPerfil from '@/components/admin/FotoPerfil';
import AcessoProfissional, { useAcessos } from '@/components/admin/AcessoProfissional';
import { n as nicho } from '@/lib/nicho';

const empty = { name: '', get role() { return nicho().Pro; }, email: '', phone: '', bio: '', specialties: [], commission: 30 };

// 'profissional' -> 'Profissional'. O nome do plano vem da base de dados em
// minusculas; aqui e um rotulo que o barbeiro le.
const nomeDoPlano = p => (p ? p.charAt(0).toUpperCase() + p.slice(1) : '');

/*
 * No telemovel esta pagina tinha, por cada barbeiro: foto, nome, funcao, bio,
 * estrelas, "ainda sem avaliacoes", as especialidades e o bloco inteiro de
 * acesso ao painel — meio ecra por pessoa, e o bloco de acesso repetia o que
 * a pagina "Equipa e acessos" ja faz melhor. Com cinco barbeiros era uma
 * maratona de scroll para chegar ao botao de editar.
 *
 * No telemovel fica uma linha por pessoa: quem e, o que faz, e se entra ou
 * nao no painel. O resto abre-se — a ficha no lapis, os acessos na pagina que
 * existe para isso. No computador, onde ha espaco e tres colunas, nada muda.
 */
export default function Professionals() {
  const data = useStore();
  const isMobile = useIsMobile();
  // As avaliacoes de um barbeiro: quantas sao e a media delas.
  const avaliacoesDe = (proId) => {
    const lista = (data.reviews || []).filter(r => r.professionalId === proId);
    if (!lista.length) return { total: 0, media: 0 };
    return { total: lista.length, media: lista.reduce((s, r) => s + (Number(r.rating) || 0), 0) / lista.length };
  };
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const acessos = useAcessos(data.business?.id);
  const [form, setForm] = useState(empty);
  const [specs, setSpecs] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Quantos lugares o plano da e quantos ja estao ocupados. Le-se a cada
  // render porque a lista muda debaixo dos pes (criar, apagar, desativar).
  const lugares = dataService.lugaresDeProfissionais();

  const openNew = () => { setForm(empty); setSpecs(''); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p, commission: p.commission ?? 30 }); setSpecs((p.specialties || []).join(', ')); setEditing(p.id); };
  const close = () => setEditing(null);
  const [aEnviarFoto, setAEnviarFoto] = useState(false);

  // Recebe a foto já cortada em quadrado (FotoPerfil) e envia-a.
  const handlePhotoChange = async (file) => {
    if (!file) return;
    // Pré-visualização imediata enquanto a foto sobe, para não parecer parado.
    const previa = URL.createObjectURL(file);
    setForm(current => ({ ...current, photoUrl: previa }));
    setAEnviarFoto(true);
    try {
      // Um profissional ainda por criar não tem id: usa-se um temporário, e o
      // ficheiro fica com esse nome. Só muda o nome, não a foto.
      const id = editing && editing !== 'new' ? editing : 'novo-' + Date.now();
      const url = await uploadProfessionalPhoto(id, file);
      setForm(current => ({ ...current, photoUrl: url }));
    } catch (err) {
      setForm(current => ({ ...current, photoUrl: '' }));
      toast.error('Não foi possível enviar a fotografia', err.message);
    } finally {
      setAEnviarFoto(false);
      URL.revokeObjectURL(previa);
    }
  };

  // Depois de criar: o convite para o painel, já com o email da ficha.
  const [convidar, setConvidar] = useState(null);
  const save = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (!form.role || !form.role.trim()) { toast.error('Função obrigatória', `${nicho().Pro}, gerente, rececionista…`); return; }
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) { toast.error('Email obrigatório', 'É por aqui que ele recebe o acesso ao painel.'); return; }
    if (data.professionals.some(p => p.id !== editing && (p.email || '').toLowerCase() === form.email.trim().toLowerCase())) { toast.error('Email repetido', 'Já há um profissional com esse email.'); return; }
    if (aEnviarFoto) { toast.error('A fotografia ainda está a subir', 'Espera um instante e grava outra vez.'); return; }
    const payload = { ...form, specialties: specs.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      if (editing === 'new') { const novo = await dataService.createProfessional(payload); toast.success('Profissional criado'); setConvidar(novo); }
      else { await dataService.updateProfessional(editing, payload); toast.success('Profissional atualizado'); }
    } catch (err) {
      // Sem isto, o limite do plano rebentava em silêncio e a janela fechava
      // como se tivesse gravado.
      toast.error('Não foi possível guardar', err.message);
      return;
    }
    close();
  };

  /*
   * Quantas marcacoes tem a ficha. Nao e informacao de enfeite: se tiver
   * alguma, a base de dados nao a deixa apagar (a marcacao aponta para ela), e
   * ainda que deixasse nao se devia — era apagar o historico da casa. Por isso
   * nem se oferece o botao: oferece-se desativar, que e o que ele quer mesmo
   * quando diz «este ja nao trabalha aqui».
   */
  const marcacoesDe = (id) => (data.appointments || []).filter(a => a.professionalId === id).length;

  const remove = async () => {
    try {
      await dataService.deleteProfessional(deleteTarget.id);
      toast.success('Eliminado');
      setDeleteTarget(null);
    } catch (err) {
      // Sem este catch, a promessa rebentava sozinha: a janela ficava aberta,
      // nao aparecia aviso nenhum, e ninguem sabia porque e que nao dava.
      toast.error('Não foi possível eliminar', err.message);
    }
  };

  const mudarEstado = async (p, ativo) => {
    try {
      await dataService.updateProfessional(p.id, { isActive: ativo });
      toast.success(ativo ? 'Reativado' : 'Desativado',
        ativo ? `${p.name} volta a aparecer na agenda e nas marcações.`
              : `${p.name} deixa de aparecer na agenda e nas marcações. O histórico fica.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(ativo ? 'Não foi possível reativar' : 'Não foi possível desativar', err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-24" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="page-head" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1>Profissionais</h1>
            <PageInfo
              description="Gestão completa da equipa: dados pessoais, especialidades, comissões, fotografia e avaliações atribuídas pelos clientes. O perfil de cada profissional determina o que aparece na app do cliente para marcação."
              impact="A equipa é o principal ativo de um negócio. A qualidade, disponibilidade e motivação dos profissionais determina diretamente a capacidade de receita, a retenção de clientes e a reputação do negócio."
              links={['Agenda', 'Horários', 'Comissões', 'Desempenho', 'Serviços']}
            />
          </div>
          <p>
            {lugares.limite == null
              ? <>{data.professionals.length} {data.professionals.length === 1 ? 'profissional' : 'profissionais'}.</>
              : <>{lugares.ativos} de {lugares.limite} {lugares.limite === 1 ? 'lugar' : 'lugares'} do plano{lugares.plano ? ` ${nomeDoPlano(lugares.plano)}` : ''}.</>}
          </p>
        </div>
        <Button variant="primary" onClick={openNew} disabled={lugares.cheio}
          title={lugares.cheio ? 'Chegaste ao limite de profissionais do teu plano' : undefined}>
          <Plus size={16} /> Novo profissional
        </Button>
      </div>

      {(lugares.cheio || lugares.acima) && (
        <Card className="card-pad mb-24" style={{ borderColor: 'var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Lock size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--gold-tinta)' }} />
            <div>
              <div className="fw-600">
                {lugares.acima
                  ? `Tens ${lugares.ativos} profissionais ativos e o plano dá para ${lugares.limite}.`
                  : `Estás no limite do plano: ${lugares.limite} ${lugares.limite === 1 ? 'profissional' : 'profissionais'}.`}
              </div>
              <p className="text-sec text-sm mt-8" style={{ margin: '8px 0 0' }}>
                {lugares.acima
                  ? 'Ninguém foi desativado — a equipa que já tinhas continua a trabalhar. Só não dá para acrescentar mais sem mudar de plano.'
                  : 'Para acrescentar outro, desativa um profissional que já não trabalhe contigo ou muda de plano.'}
                {' '}Falamos pelo «Apoio ao cliente», no menu do lado.
              </p>
            </div>
          </div>
        </Card>
      )}

      {data.professionals.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <UserCog />} title="Sem profissionais" /></Card>
      ) : isMobile ? (
        /*
         * `minmax(0, 1fr)` e nao `1fr`: uma coluna de grelha nunca encolhe
         * abaixo do conteudo mais teimoso que tem dentro, por isso bastava
         * um botao com uma palavra inteira para a coluna ficar mais larga
         * do que o ecra. E o `.admin-content` ao telemovel tem
         * `overflow-x: clip` — nao desliza, CORTA. Era por isso que o
         * «Reativar» desaparecia pela direita em vez de se ver a mais.
         */
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'minmax(0, 1fr)' }}>
          {data.professionals.map(p => {
            const acesso = acessos.de(p.id);
            const souEu = p.id === data.meuProfissionalId;
            const av = avaliacoesDe(p.id);
            const cor = souEu ? 'var(--gold)' : acesso ? 'var(--success)' : 'var(--text-sec)';
            return (
              <Card key={p.id} className="card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {p.photoUrl
                    ? <img className="professional-photo" src={p.photoUrl} alt={`Fotografia de ${p.name}`} />
                    : <Avatar name={p.name} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw-600" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div className="text-sec text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.isActive === false ? 'Inativo · ' : ''}{p.role}{av.total > 0 ? ` · ${av.media.toFixed(1)} ★ (${av.total})` : ''}
                    </div>
                  </div>
                  {/* So icones nesta linha, e nenhum encolhe. Uma palavra
                      inteira aqui ao lado do nome era o que fazia a linha
                      crescer para la do ecra. */}
                  <Button size="sm" variant="ghost" style={{ flexShrink: 0 }}
                    aria-label={`Editar ${p.name}`} title="Editar ficha" onClick={() => openEdit(p)}><Pencil size={15} /></Button>
                  {p.isActive !== false && (
                    <Button size="sm" variant="ghost" style={{ flexShrink: 0 }}
                      aria-label={`Eliminar ${p.name}`} title="Eliminar" onClick={() => setDeleteTarget(p)}><Trash2 size={15} /></Button>
                  )}
                </div>

                {/* Reativar leva a linha toda: e a unica coisa a fazer a um
                    profissional desativado, e assim diz-se por extenso sem
                    disputar espaco com o nome. */}
                {p.isActive === false && (
                  <Button size="sm" variant="secondary" block style={{ marginTop: 10 }}
                    onClick={() => mudarEstado(p, true)}>Reativar</Button>
                )}

                {/* O acesso nao se gere aqui: mostra-se como esta e leva-se a
                    quem o gere. Ter o formulario de convite dentro de cada
                    cartao era o que fazia esta pagina nao caber no telemovel. */}
                <Link to="/admin/profissionais/equipa"
                  style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 11px',
                    borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none',
                    color: 'inherit', fontSize: 14.5 }}>
                  {souEu ? <Crown size={14} style={{ color: cor, flexShrink: 0 }} />
                    : acesso ? <ShieldCheck size={14} style={{ color: cor, flexShrink: 0 }} />
                    : <ShieldOff size={14} style={{ color: cor, flexShrink: 0 }} />}
                  <span style={{ color: cor, fontWeight: 600 }}>
                    {souEu ? 'És tu, o dono' : acesso ? 'Entra no painel' : 'Não entra no painel'}
                  </span>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-ter)', flexShrink: 0 }} />
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid-3">
          {data.professionals.map(p => (
            <Card key={p.id} className="card-pad card-hover">
              <div className="flex items-center gap-12">
                {p.photoUrl ? <img className="professional-photo" src={p.photoUrl} alt={`Fotografia de ${p.name}`} /> : <Avatar name={p.name} size="lg" />}
                <div className="flex-1">
                  <h3 style={{ fontSize: 18 }}>{p.name}</h3>
                  <div className="text-gold text-sm">{p.role}</div>
                </div>
              </div>
              <p className="text-sec text-sm mt-16">{p.bio}</p>
              {/* Estrelas a serio: media das avaliacoes deste barbeiro. So
                  aparecem quando ha alguma — uma fila de estrelas vazias em
                  todos os cartoes de uma barbearia nova nao diz nada. */}
              {avaliacoesDe(p.id).total > 0 && (
                <div className="flex items-center gap-8 mt-16">
                  <Stars rating={avaliacoesDe(p.id).media} size={13} />
                  <span className="text-sec text-xs">
                    {avaliacoesDe(p.id).media.toFixed(1)} · {avaliacoesDe(p.id).total} {avaliacoesDe(p.id).total === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                </div>
              )}
              {p.specialties?.length > 0 && (
                <div className="flex gap-8 flex-wrap mt-16">
                  {p.specialties.map((s, i) => <Badge key={i} variant="default">{s}</Badge>)}
                </div>
              )}
              <AcessoProfissional profissional={p} acesso={acessos.de(p.id)} onMudou={acessos.recarregar} destaque />
              <div className="flex gap-8 mt-16">
                  <Button size="sm" variant="secondary" block onClick={() => openEdit(p)}><Pencil size={14} /> Editar</Button>
                  {p.isActive === false
                    ? <Button size="sm" variant="ghost" onClick={() => mudarEstado(p, true)}>Reativar</Button>
                    : <Button size="sm" variant="ghost" aria-label="Eliminar profissional" title="Eliminar profissional" onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></Button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={close} title={editing === 'new' ? 'Novo profissional' : 'Editar profissional'}
        footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}>
        <div className="field">
          <label className="label">Fotografia</label>
          <FotoPerfil valor={form.photoUrl} nome={form.name} aEnviar={aEnviarFoto} onEscolher={handlePhotoChange} />
        </div>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field"><label className="label">Função *</label><input className="input" list="funcoes-pro" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder={nicho().Pro} /><datalist id="funcoes-pro"><option value={nicho().Pro} /><option value={`${nicho().Pro} sénior`} /><option value="Gerente" /><option value="Rececionista" /><option value="Aprendiz" /></datalist></div>
          <div className="field"><label className="label">Email *</label><input className="input" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="o email dele" /></div>
        </div>
        <div className="field"><label className="label">Telemóvel</label><input className="input" type="tel" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label className="label">Bio</label><textarea className="textarea" rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
        <div className="field"><label className="label">Comissão (%)</label><input className="input" type="number" min="0" max="100" step="1" value={form.commission ?? 30} onChange={e => setForm({ ...form, commission: Number(e.target.value) || 0 })} /></div>
        <div className="field"><label className="label">Especialidades (separadas por vírgulas)</label><input className="input" value={specs} onChange={e => setSpecs(e.target.value)} placeholder="Fades, Barba" /></div>
      </Modal>

      <Modal open={!!convidar} onClose={() => setConvidar(null)} title="Dar acesso ao painel?"
        footer={<><Button variant="ghost" onClick={() => setConvidar(null)}>Agora não</Button></>}>
        {convidar && (
          <div>
            <p className="text-sec text-sm" style={{ marginTop: 0 }}>
              <b style={{ color: 'var(--text)' }}>{convidar.name}</b> vai receber um email em <b style={{ color: 'var(--text)' }}>{convidar.email}</b> para escolher a palavra-passe. Depois entra no painel e vê a agenda (mexe só na coluna dele), os clientes e a conta dele. Sem dinheiro nem definições.
            </p>
            <AcessoProfissional profissional={convidar} acesso={null} onMudou={() => { acessos.recarregar(); setConvidar(null); }} emailInicial={convidar.email} abertoInicial />
          </div>
        )}
      </Modal>

      {/* Duas janelas numa. Com marcacoes no historico, «Eliminar» nao e uma
          opcao — nem da base de dados nem do negocio — e o que se oferece e
          desativar. Sem marcacoes, apaga-se e pronto. */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title={deleteTarget && marcacoesDe(deleteTarget.id) > 0 ? 'Tirar da equipa' : 'Eliminar profissional'}
        footer={deleteTarget && marcacoesDe(deleteTarget.id) > 0 ? (
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="primary" onClick={() => mudarEstado(deleteTarget, false)}>Desativar</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={remove}>Eliminar</Button>
          </>
        )}>
        {deleteTarget && marcacoesDe(deleteTarget.id) > 0 ? (
          <p>
            <span className="text-gold fw-600">{deleteTarget.name}</span> tem {marcacoesDe(deleteTarget.id)}{' '}
            {marcacoesDe(deleteTarget.id) === 1 ? 'marcação' : 'marcações'} no histórico, por isso a ficha
            não se pode apagar — apagá-la levava o histórico atrás.
            {' '}Desativar deixa tudo como está: desaparece da agenda, do site e das marcações novas,
            e o que já aconteceu continua nas contas.
          </p>
        ) : (
          <p>Eliminar <span className="text-gold fw-600">{deleteTarget?.name}</span>?</p>
        )}
      </Modal>
    </AdminLayout>
  );
}