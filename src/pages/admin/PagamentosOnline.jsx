import React, { useEffect, useState } from 'react';
import { CreditCard, Check, ExternalLink } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/components/ui/ToastContext';
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';
import { formatPrice } from '@/lib/format';

/*
 * PAGAMENTOS ONLINE (13/10/2026, decisão do Diogo).
 *
 * O cliente paga ao marcar — nada, um sinal ou o serviço todo, à escolha do
 * dono. O dinheiro vai direto para a conta Stripe DELE (Stripe Connect): a
 * Convecta não toca no dinheiro nem fica com nada. O Stripe cobra-lhe as
 * taxas dele.
 *
 *   1. Ligar: cria a conta e abre o Stripe para ele pôr os dados e o IBAN.
 *   2. Escolher o que se paga (settings.pagamentosOnline).
 *   3. Ver os últimos pagamentos.
 *
 * Precisa do PAGAMENTOS_ONLINE_2026-10-13.sql e das funções
 * pagamentos-ligar, pagar-marcacao e stripe-connect-eventos.
 */
const invocar = async (corpo) => {
  const { data, error } = await supabase.functions.invoke('pagamentos-ligar', { body: corpo });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context?.json())?.erro || msg; } catch { /* fica a mensagem */ }
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
};

const ESTADO = { pago: ['Pago', 'success'], pendente: ['Por pagar', 'warning'], expirou: ['Não pagou', 'default'], reembolsado: ['Devolvido', 'default'] };

export default function PagamentosOnline() {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business?.pagamentosOnline || {};
  const [estado, setEstado] = useState(null);     // { ligado, ativo, dadosEntregues, falta }
  const [erro, setErro] = useState('');
  const [aAbrir, setAAbrir] = useState(false);
  const [modo, setModo] = useState(cfg.modo || 'nada');
  const [sinal, setSinal] = useState(cfg.sinal != null ? String(cfg.sinal) : '5');
  const [aGravar, setAGravar] = useState(false);
  const [lista, setLista] = useState([]);

  useEffect(() => { setModo(cfg.modo || 'nada'); setSinal(cfg.sinal != null ? String(cfg.sinal) : '5'); }, [cfg.modo, cfg.sinal]);

  useEffect(() => {
    invocar({ acao: 'estado' }).then(setEstado).catch(e => { setErro(e.message); setEstado({ ligado: false, ativo: false }); });
    supabase.from('pagamentos_online').select('id, valor_cents, tipo, estado, criado_em, pago_em')
      .order('criado_em', { ascending: false }).limit(20)
      .then(({ data: l }) => setLista(l || []));
  }, []);

  const ligar = async () => {
    setAAbrir(true); setErro('');
    try { const r = await invocar({ acao: 'ligar' }); window.location.href = r.url; }
    catch (e) { setErro(e.message); setAAbrir(false); }
  };

  const guardar = async () => {
    const valorSinal = Math.round(Number(String(sinal).replace(',', '.')) * 100) / 100;
    if (modo === 'sinal' && !(valorSinal >= 1)) { toast.error('O sinal tem de ser pelo menos 1 €'); return; }
    setAGravar(true);
    try {
      await dataService.updateBusiness({ pagamentosOnline: { modo, sinal: modo === 'sinal' ? valorSinal : (cfg.sinal ?? 5) } });
      toast.success('Guardado');
    } catch (e) { toast.error('Não foi possível guardar', e.message); }
    finally { setAGravar(false); }
  };

  const ativo = !!estado?.ativo;
  const opcao = (v, titulo, texto) => (
    <label key={v} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <input type="radio" name="modo" checked={modo === v} onChange={() => setModo(v)} style={{ marginTop: 4, accentColor: 'var(--gold)' }} />
      <span style={{ flex: 1 }}>
        <span className="fw-600" style={{ display: 'block' }}>{titulo}</span>
        <span className="text-sec text-sm">{texto}</span>
        {v === 'sinal' && modo === 'sinal' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input className="input" inputMode="decimal" value={sinal} onChange={e => setSinal(e.target.value)} style={{ width: 100 }} />
            <span className="text-sec">€ por marcação</span>
          </span>
        )}
      </span>
    </label>
  );

  return (
    <AdminPage title="Pagamentos online" subtitle="O cliente paga ao marcar, com cartão, Apple Pay, Google Pay ou MB WAY. O dinheiro cai na tua conta.">
      <Card className="card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <CreditCard size={22} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="fw-600" style={{ fontSize: 16 }}>
              {!estado ? 'A ver…' : ativo ? 'Pagamentos ligados' : estado.ligado ? 'Falta acabar no Stripe' : '1. Liga a tua conta'}
              {ativo && <Check size={16} style={{ color: 'var(--success)', marginLeft: 6, verticalAlign: -2 }} />}
            </div>
            <div className="text-sec text-sm" style={{ marginTop: 4, lineHeight: 1.55 }}>
              {ativo
                ? 'O dinheiro dos clientes cai na tua conta Stripe e passa para o teu banco. A Convecta não fica com nada; o Stripe cobra a taxa dele por pagamento.'
                : estado?.ligado
                  ? 'A conta está criada, mas o Stripe ainda precisa de alguns dados teus (identificação e IBAN) para poderes receber.'
                  : 'Crias a tua conta no Stripe em 5 minutos: os teus dados e o IBAN para onde vai o dinheiro. A Convecta não toca no dinheiro.'}
            </div>
            {erro && <div className="text-sm" style={{ color: 'var(--error)', marginTop: 8 }}>{erro}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {!ativo && estado && (
                <Button onClick={ligar} disabled={aAbrir}>{aAbrir ? 'A abrir o Stripe…' : estado.ligado ? 'Continuar no Stripe' : 'Ligar pagamentos'}</Button>
              )}
              {estado?.ligado && (
                <a className="btn btn-secondary" href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Abrir o meu Stripe <ExternalLink size={14} />
                </a>
              )}
            </div>
            {estado?.ligado && (
              <div className="text-sec text-xs" style={{ marginTop: 10, lineHeight: 1.55 }}>
                Para aceitar MB WAY: no teu Stripe, Definições › Métodos de pagamento › ligar o MB WAY.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="card-pad" style={{ marginBottom: 16, opacity: ativo ? 1 : 0.55 }}>
        <div className="fw-600" style={{ fontSize: 16, marginBottom: 4 }}>{ativo ? 'O que o cliente paga ao marcar' : '2. O que o cliente paga ao marcar'}</div>
        {!ativo && <div className="text-sec text-sm" style={{ marginBottom: 6 }}>Fica disponível quando os pagamentos estiverem ligados.</div>}
        <div style={{ pointerEvents: ativo ? 'auto' : 'none' }}>
          {opcao('nada', 'Nada', 'O cliente paga na loja, como hoje.')}
          {opcao('sinal', 'Um sinal', 'Paga uma parte ao marcar e o resto na loja. Bom para quem falta às marcações.')}
          {opcao('total', 'O serviço todo', 'Paga tudo ao marcar.')}
        </div>
        <Button onClick={guardar} disabled={!ativo || aGravar} style={{ marginTop: 14 }}>{aGravar ? 'A guardar…' : 'Guardar'}</Button>
      </Card>

      {lista.length > 0 && (
        <Card className="card-pad">
          <div className="fw-600" style={{ fontSize: 16, marginBottom: 8 }}>Últimos pagamentos</div>
          {lista.map(p => {
            const [l, v] = ESTADO[p.estado] || [p.estado, 'default'];
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="fw-600">{formatPrice(p.valor_cents / 100)}</span>
                  <span className="text-sec text-sm"> · {p.tipo === 'total' ? 'serviço' : 'sinal'} · {new Date(p.pago_em || p.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <Badge variant={v}>{l}</Badge>
              </div>
            );
          })}
        </Card>
      )}
    </AdminPage>
  );
}
