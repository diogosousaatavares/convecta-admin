import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, BellRing } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastContext';
import { n as nicho } from '@/lib/nicho';

/*
 * CLIENTES A VOLTAR (18/11/2026).
 *
 * O cliente que não vem há 40 dias recebe uma notificação no telemóvel:
 * «Já passaram 40 dias desde o teu último corte…». Sozinho, sem o barbeiro
 * ter de se lembrar. Pode haver várias (30, 45, 60 dias), cada uma com o
 * seu texto. Fica em settings.saudades; quem manda é o servidor
 * (enviar-lembretes + SAUDADES_2026-11-18.sql), das 10h às 20h, só a quem
 * tem as notificações ligadas e não tem nada marcado.
 */
const MAX_REGRAS = 4;

function regraNova(dias) {
  const u = nicho().un;
  return {
    id: `r${Date.now().toString(36)}`,
    dias,
    ativo: true,
    titulo: '{barbearia} tem saudades tuas',
    mensagem: `Olá {nome}! Já passaram {dias} dias desde o teu último ${u}. O teu lugar está à tua espera — marca em dois toques.`,
  };
}

const encher = (t, nome, dias, casa) => String(t || '')
  .replace(/\{nome\}/gi, nome).replace(/\{dias\}/gi, String(dias)).replace(/\{barbearia\}/gi, casa)
  .replace(/\s+([!?.,])/g, '$1').replace(/\s{2,}/g, ' ').trim();

function Previsao({ dias }) {
  const [q, setQ] = useState(null);
  useEffect(() => {
    let vivo = true;
    const d = Number(dias);
    if (!(d >= 7)) { setQ(null); return undefined; }
    const t = setTimeout(() => {
      supabase.rpc('saudades_quantos', { p_dias: d }).then(({ data, error }) => {
        if (vivo) setQ(error ? null : (data && data[0]) || null);
      });
    }, 400);
    return () => { vivo = false; clearTimeout(t); };
  }, [dias]);
  if (!q) return null;
  return (
    <div className="cv-nota">
      Hoje há <b>{q.ausentes}</b> {q.ausentes === 1 ? 'cliente' : 'clientes'} há mais de {dias} dias sem vir e sem nada marcado
      {' '}— <b>{q.com_push}</b> {q.com_push === 1 ? 'tem' : 'têm'} as notificações ligadas.
    </div>
  );
}

export default function ClientesAVoltar() {
  const data = useStore();
  const toast = useToast();
  const casa = data.business?.name || 'A tua casa';
  const guardado = data.business?._settings?.saudades || null;

  const [ativo, setAtivo] = useState(guardado ? guardado.ativo === true : false);
  const [regras, setRegras] = useState(() => (guardado?.regras?.length ? guardado.regras : [regraNova(40)]));
  const [aGuardar, setAGuardar] = useState(false);
  const [resumo, setResumo] = useState({});

  useEffect(() => {
    const g = data.business?._settings?.saudades;
    if (!g) return;
    setAtivo(g.ativo === true);
    if (g.regras?.length) setRegras(g.regras);
  }, [data.business?._settings?.saudades]);

  useEffect(() => {
    supabase.rpc('saudades_resumo').then(({ data: r, error }) => {
      if (error || !r) return;
      setResumo(Object.fromEntries(r.map(x => [x.dias, x])));
    });
  }, []);

  const mudar = (id, campo, valor) => setRegras(rs => rs.map(r => (r.id === id ? { ...r, [campo]: valor } : r)));
  const tirar = id => setRegras(rs => rs.filter(r => r.id !== id));
  const juntar = () => {
    const usados = new Set(regras.map(r => Number(r.dias)));
    const dias = [30, 40, 60, 90, 120].find(d => !usados.has(d)) || 45;
    setRegras(rs => [...rs, regraNova(dias)].sort((a, b) => a.dias - b.dias));
  };

  const repetidos = useMemo(() => {
    const vistos = new Set(); const rep = new Set();
    regras.forEach(r => { const d = Number(r.dias); if (vistos.has(d)) rep.add(d); vistos.add(d); });
    return rep;
  }, [regras]);

  const guardar = async () => {
    const limpas = regras.map(r => ({
      ...r,
      dias: Math.max(7, Math.min(365, Math.round(Number(r.dias) || 40))),
      titulo: String(r.titulo || '').trim(),
      mensagem: String(r.mensagem || '').trim(),
    }));
    if (limpas.some(r => !r.mensagem)) { toast.error('Falta a mensagem', 'Cada notificação precisa de texto.'); return; }
    if (new Set(limpas.map(r => r.dias)).size !== limpas.length) { toast.error('Dias repetidos', 'Duas notificações com os mesmos dias — muda uma delas.'); return; }
    setAGuardar(true);
    try {
      await dataService.updateBusiness({ saudades: { ativo, regras: limpas.sort((a, b) => a.dias - b.dias) } });
      toast.success(ativo ? 'Notificações automáticas ligadas' : 'Notificações automáticas desligadas',
        ativo ? 'Saem sozinhas, entre as 10h e as 20h, a quem tem as notificações ligadas.' : 'Não sai nada até voltares a ligar.');
    } catch (e) {
      toast.error('Não foi possível guardar', e.message);
    } finally { setAGuardar(false); }
  };

  return (
    <AdminPage
      title="Clientes a voltar"
      subtitle={`Quem não vem há algum tempo recebe uma notificação no telemóvel a lembrar que o próximo ${nicho().un} está à espera. Sai sozinha.`}>
      <div className="cv-wrap">
        <Card className="card-pad">
          <label className="cv-topo">
            <span>
              <b>Notificações automáticas</b>
              <span className="text-sec text-sm">Das 10h às 20h, só a quem tem as notificações da app ligadas e não tem nada marcado. Uma vez por ausência.</span>
            </span>
            <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
          </label>
        </Card>

        {regras.map(r => {
          const d = Math.max(1, Number(r.dias) || 0);
          const st = resumo[d];
          return (
            <Card key={r.id} className="card-pad cv-regra" style={{ opacity: ativo ? 1 : 0.6 }}>
              <div className="cv-regra-topo">
                <label className="cv-dias">
                  Ao fim de
                  <input type="number" min="7" max="365" className="input" value={r.dias}
                    onChange={e => mudar(r.id, 'dias', e.target.value)} />
                  dias sem vir
                </label>
                <label className="cv-liga">
                  <input type="checkbox" checked={r.ativo !== false} onChange={e => mudar(r.id, 'ativo', e.target.checked)} /> Ligada
                </label>
                {regras.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" aria-label="Tirar esta notificação" onClick={() => tirar(r.id)}><Trash2 size={15} /></button>
                )}
              </div>
              {repetidos.has(Number(r.dias)) && <div className="cv-erro">Já há outra notificação com {r.dias} dias.</div>}

              <div className="cv-grelha">
                <div>
                  <div className="field">
                    <label className="label">Título</label>
                    <input className="input" value={r.titulo} maxLength={60} onChange={e => mudar(r.id, 'titulo', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label">Mensagem</label>
                    <textarea className="input" rows={3} value={r.mensagem} maxLength={180} onChange={e => mudar(r.id, 'mensagem', e.target.value)} />
                    <div className="text-sec text-sm" style={{ marginTop: 4 }}>
                      Podes usar <code>{'{nome}'}</code>, <code>{'{dias}'}</code> e <code>{'{barbearia}'}</code>.
                    </div>
                  </div>
                </div>
                <div>
                  <div className="nt-titulo" style={{ marginTop: 0 }}>Como chega</div>
                  <div className="cv-push">
                    <div className="cv-push-ic"><BellRing size={16} /></div>
                    <div style={{ minWidth: 0 }}>
                      <b>{encher(r.titulo, 'João', d, casa) || casa}</b>
                      <span>{encher(r.mensagem, 'João', d, casa)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Previsao dias={r.dias} />
              {st && (
                <div className="cv-nota">
                  Últimos 30 dias: <b>{st.enviadas_30d}</b> {st.enviadas_30d === 1 ? 'enviada' : 'enviadas'} · <b>{st.voltaram_30d}</b> {st.voltaram_30d === 1 ? 'voltou' : 'voltaram'} a marcar
                </div>
              )}
            </Card>
          );
        })}

        <div className="cv-acoes">
          {regras.length < MAX_REGRAS && (
            <Button variant="ghost" onClick={juntar}><Plus size={16} /> Outra notificação</Button>
          )}
          <Button variant="primary" onClick={guardar} disabled={aGuardar}>
            <Save size={16} /> {aGuardar ? 'A guardar…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </AdminPage>
  );
}
