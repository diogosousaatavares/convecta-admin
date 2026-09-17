import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CreditCard, ShieldCheck, Check, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button, Spinner } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

/*
 * A subscrição da barbearia na Convecta.
 *
 * Nada a ver com o módulo «Assinaturas», que é o clube que a barbearia vende
 * aos clientes dela. Isto é o que ELA nos paga.
 *
 * Dois ecrãs numa página só, conforme o estado:
 *
 *   sem cartão  →  a escolha do plano. É o primeiro ecrã que um barbeiro novo
 *                  vê, e é aqui que a venda acontece ou não acontece.
 *   com cartão  →  o estado da subscrição e um botão para o portal do Stripe.
 *
 * Os preços NÃO estão escritos neste ficheiro. Vêm do Stripe, que é quem vai
 * cobrar. Um preço escrito no painel é um preço que um dia mostra 29,99 € a
 * quem vai ser cobrado 34,99 €.
 */

const ESTADOS = {
  sem_cartao: { texto: 'Sem cartão registado', cor: 'var(--text-sec)' },
  em_teste:   { texto: 'Em experiência',       cor: 'var(--gold)' },
  activa:     { texto: 'Activa',               cor: 'var(--success, #22C55E)' },
  em_atraso:  { texto: 'Pagamento em atraso',  cor: '#F59E0B' },
  cancelada:  { texto: 'Cancelada',            cor: 'var(--error, #EF4444)' },
};

const euros = (centimos) =>
  (Number(centimos || 0) / 100).toFixed(2).replace('.', ',') + ' €';

const dataCurta = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
};

const diasAte = (iso) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
};

export default function Subscricao() {
  const toast = useToast();
  const location = useLocation();

  const [sub, setSub] = useState(null);
  const [planos, setPlanos] = useState(null);
  const [periodo, setPeriodo] = useState('mensal');
  const [aCarregar, setACarregar] = useState(true);
  const [aAbrir, setAAbrir] = useState('');
  const [erro, setErro] = useState('');

  /*
   * O barbeiro volta do Stripe para aqui. Mas o estado quem o escreve é o
   * webhook, do lado do servidor, e isso pode chegar um ou dois segundos
   * depois dele. Sem esta espera, ele pagava e via "sem cartão" — e a
   * primeira coisa que faria era pagar outra vez.
   */
  const voltouDoStripe = new URLSearchParams(location.search).get('estado');

  const carregar = async () => {
    try {
      const s = await dataService.subscricao();
      setSub(s);
      return s;
    } catch (e) {
      setErro(e.message);
      return null;
    }
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      const s = await carregar();
      if (!vivo) return;

      if (voltouDoStripe === 'sucesso' && s?.estado === 'sem_cartao') {
        // Tenta mais três vezes, de dois em dois segundos. Se ao fim disso o
        // webhook ainda não escreveu, diz-se a verdade em vez de fingir.
        for (let i = 0; i < 3; i++) {
          await new Promise(r => setTimeout(r, 2000));
          if (!vivo) return;
          const outra = await carregar();
          if (outra?.estado !== 'sem_cartao') break;
        }
      }

      if (!vivo) return;
      setACarregar(false);
    })();
    return () => { vivo = false; };
  }, [voltouDoStripe]);

  // Os planos só se vão buscar a quem ainda não pagou: quem já paga não tem
  // nada que escolher aqui, muda no portal do Stripe.
  useEffect(() => {
    if (aCarregar) return;
    if (sub && sub.estado !== 'sem_cartao' && sub.estado !== 'cancelada') return;
    if (planos) return;
    (async () => {
      try {
        const lista = await dataService.listarPlanos();
        setPlanos(lista);
      } catch (e) {
        setErro(e.message);
        setPlanos([]);
      }
    })();
  }, [aCarregar, sub, planos]);

  const assinar = async (lookupKey, comTeste) => {
    setAAbrir(lookupKey + (comTeste ? ':teste' : ':ja'));
    try {
      const url = await dataService.abrirCheckout(lookupKey, comTeste);
      window.location.href = url;
    } catch (e) {
      toast.error('Não foi possível abrir o pagamento', e.message);
      setAAbrir('');
    }
  };

  const abrirPortal = async () => {
    setAAbrir('portal');
    try {
      const url = await dataService.abrirPortal();
      window.location.href = url;
    } catch (e) {
      toast.error('Não foi possível abrir o portal', e.message);
      setAAbrir('');
    }
  };

  if (aCarregar) {
    return (
      <AdminPage title="Subscrição" subtitle="O teu plano na Convecta.">
        <Spinner label="A confirmar o estado da subscrição…" />
      </AdminPage>
    );
  }

  const estado = ESTADOS[sub?.estado] || ESTADOS.sem_cartao;
  const precisaDeCartao = !sub || sub.estado === 'sem_cartao' || sub.estado === 'cancelada';

  return (
    <AdminPage
      title="Subscrição"
      subtitle="O teu plano na Convecta. Sem fidelização — cancelas quando quiseres."
    >
      {erro && (
        <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16, borderColor: 'var(--error, #EF4444)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ color: 'var(--error, #EF4444)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="fw-600 text-sm">Não foi possível ler a subscrição</div>
              <div className="text-sec" style={{ fontSize: 12, marginTop: 2 }}>{erro}</div>
            </div>
          </div>
        </Card>
      )}

      {voltouDoStripe === 'cancelado' && precisaDeCartao && (
        <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
          <div className="text-sm">
            Não chegaste a concluir o pagamento — não foi cobrado nada. Podes escolher outra vez em baixo.
          </div>
        </Card>
      )}

      {/* ── O estado, quando já há subscrição ───────────────────────────── */}
      {!precisaDeCartao && (
        <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="text-sec" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: .8 }}>Estado</div>
              <div className="fw-600" style={{ fontSize: 20, color: estado.cor, marginTop: 4 }}>{estado.texto}</div>
              <div className="text-sec" style={{ fontSize: 13, marginTop: 6 }}>
                Plano <strong style={{ color: 'var(--text)' }}>{sub.plano || '—'}</strong>
                {sub.periodo ? ` · ${sub.periodo}` : ''}
                {sub.limiteProfissionais ? ` · até ${sub.limiteProfissionais} profissionais` : ''}
              </div>
            </div>
            <Button onClick={abrirPortal} disabled={aAbrir === 'portal'} icon={<ExternalLink size={16} />}>
              {aAbrir === 'portal' ? 'A abrir…' : 'Gerir subscrição'}
            </Button>
          </div>

          {sub.estado === 'em_teste' && sub.fimDoTeste && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <Clock size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
              <div className="text-sm">
                {/* Dizer a data E os dias: a data é o que conta, os dias é o
                    que a pessoa sente. */}
                A experiência acaba a <strong>{dataCurta(sub.fimDoTeste)}</strong>
                {diasAte(sub.fimDoTeste) >= 0 ? ` (faltam ${diasAte(sub.fimDoTeste)} dias)` : ''}.
                Se não cancelares até lá, o cartão é cobrado nesse dia.
                <div className="text-sec" style={{ fontSize: 12, marginTop: 4 }}>
                  Cancelar durante a experiência não custa nada — não é cobrado nenhum valor.
                </div>
              </div>
            </div>
          )}

          {sub.estado === 'activa' && sub.fimDoPeriodo && (
            <div className="text-sec" style={{ fontSize: 13, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              Próxima cobrança a <strong style={{ color: 'var(--text)' }}>{dataCurta(sub.fimDoPeriodo)}</strong>.
            </div>
          )}

          {sub.estado === 'em_atraso' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
              <div className="text-sm">
                O último pagamento não passou. <strong>A barbearia continua a funcionar normalmente</strong> —
                vamos tentar cobrar outra vez nos próximos dias.
                <div className="text-sec" style={{ fontSize: 12, marginTop: 4 }}>
                  Se o cartão expirou ou mudou, actualiza-o em «Gerir subscrição» e fica resolvido.
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── A escolha do plano ──────────────────────────────────────────── */}
      {precisaDeCartao && (
        <>
          <Card className="card-pad" style={{ maxWidth: 720, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <ShieldCheck size={20} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="fw-600 text-sm">7 dias à experiência, e só depois é que pagas</div>
                <div className="text-sec" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                  O cartão fica registado hoje, mas não é cobrado nada durante sete dias.
                  Avisamos-te antes de a primeira cobrança sair. Se cancelares até lá, não pagas nada —
                  e cancelas sozinho aqui no painel, sem telefonemas.
                </div>
                <div className="text-sec" style={{ fontSize: 12, marginTop: 8 }}>
                  O cartão é escrito numa página do Stripe. Nós nunca o vemos nem o guardamos.
                </div>
              </div>
            </div>
          </Card>

          {/* Mensal / anual */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['mensal', 'anual'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className="fw-600"
                style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                  border: `1px solid ${periodo === p ? 'var(--gold)' : 'var(--border)'}`,
                  background: periodo === p ? 'var(--gold)' : 'transparent',
                  color: periodo === p ? '#111' : 'var(--text-sec)',
                }}
              >
                {p === 'mensal' ? 'Mensal' : 'Anual (mais barato)'}
              </button>
            ))}
          </div>

          {!planos && <Spinner label="A ler os planos…" />}

          {planos && planos.length === 0 && (
            <Card className="card-pad" style={{ maxWidth: 720 }}>
              <div className="text-sm">
                Não foi possível ler os planos. Fala connosco pelo WhatsApp e tratamos disto contigo.
              </div>
            </Card>
          )}

          {planos && planos.length > 0 && (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', maxWidth: 1000 }}>
              {planos.map(plano => {
                const preco = plano.precos?.[periodo];
                if (!preco) return null;
                const mensal = plano.precos?.mensal?.centimos;
                const poupa = periodo === 'anual' && mensal
                  ? mensal * 12 - preco.centimos : 0;

                return (
                  <Card key={plano.id} className="card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="fw-600" style={{ fontSize: 17 }}>{plano.nome}</div>
                    {plano.descricao && (
                      <div className="text-sec" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{plano.descricao}</div>
                    )}

                    <div style={{ margin: '16px 0 4px' }}>
                      <span className="fw-600" style={{ fontSize: 28 }}>{euros(preco.centimos)}</span>
                      <span className="text-sec" style={{ fontSize: 13 }}>{periodo === 'anual' ? ' /ano' : ' /mês'}</span>
                    </div>
                    {poupa > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--gold)' }}>Poupas {euros(poupa)} por ano</div>
                    )}

                    {plano.caracteristicas?.length > 0 && (
                      <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {plano.caracteristicas.map((c, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <Check size={15} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                            <span className="text-sm">{c}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                      <Button
                        block
                        onClick={() => assinar(preco.lookupKey, true)}
                        disabled={!!aAbrir}
                        icon={<CreditCard size={16} />}
                      >
                        {aAbrir === preco.lookupKey + ':teste' ? 'A abrir…' : 'Experimentar 7 dias'}
                      </Button>
                      {/* Quem já decidiu não quer um contador de dias a correr.
                          Dar-lhe o caminho curto é respeitar isso. */}
                      <Button
                        block
                        variant="ghost"
                        onClick={() => assinar(preco.lookupKey, false)}
                        disabled={!!aAbrir}
                      >
                        {aAbrir === preco.lookupKey + ':ja' ? 'A abrir…' : 'Pagar já e ficar despachado'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminPage>
  );
}
