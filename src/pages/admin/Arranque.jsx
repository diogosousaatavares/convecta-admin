import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Clock, Plus, X, ArrowRight, CreditCard, Check } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE } from '@/lib/designService';

/*
 * O arranque: um ecrã, sessenta segundos.
 *
 * Quando uma barbearia nasce, já leva serviços de exemplo e um horário de
 * omissão. Parece montada e não está: os preços são inventados e o horário é
 * o nosso. Se ninguém mexer nisso, o barbeiro tem uma agenda que não é a
 * dele — e um cliente que marque às 9h num dia de folga descobre isso por
 * ele.
 *
 * Este ecrã existe para o caso em que o barbeiro está ao lado de alguém que
 * lhe montou a conta, com a tabela de preços pendurada na parede. Por isso
 * não pergunta nada do zero: mostra o que já lá está e pede que se CORRIJA.
 * Corrigir quatro linhas leva um minuto; escrever quatro serviços de raiz
 * leva dez e faz-se noutro dia — ou seja, nunca.
 *
 * O horário aqui é uma pergunta só: a que horas abre, a que horas fecha, e
 * que dias fecha. Quem precisa de horas diferentes à quarta vai aos Horários;
 * quem está a montar a conta à porta da loja não precisa disso agora.
 *
 * O cartão fica para o fim, e é uma saída entre duas. Pedi-lo antes de ele
 * ter posto os preços dele é pedir uma decisão a quem ainda não tem nada.
 */

const DIAS = [
  ['monday', 'Seg'], ['tuesday', 'Ter'], ['wednesday', 'Qua'],
  ['thursday', 'Qui'], ['friday', 'Sex'], ['saturday', 'Sáb'], ['sunday', 'Dom'],
];
const DURACOES = [15, 20, 30, 45, 60, 90];

// A hora que mais se repete nos dias abertos. Um horário que veio por omissão
// é igual em quase todos os dias, por isso isto acerta quase sempre.
function horaMaisComum(horas, campo, omissao) {
  const abertos = (horas || []).filter(h => h.isOpen && h[campo]);
  if (!abertos.length) return omissao;
  const contas = {};
  abertos.forEach(h => { contas[h[campo]] = (contas[h[campo]] || 0) + 1; });
  return Object.entries(contas).sort((a, b) => b[1] - a[1])[0][0];
}

export default function Arranque() {
  const data = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const negocio = data?.business;

  const [mexido, setMexido] = useState(false);
  const [servicos, setServicos] = useState([]);
  const [abre, setAbre] = useState('09:00');
  const [fecha, setFecha] = useState('19:00');
  const [diasAbertos, setDiasAbertos] = useState(() => new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']));
  const [aGravar, setAGravar] = useState(false);

  // Enquanto ele não tocar em nada, o ecrã segue o que vier da base de dados.
  // Depois de tocar, manda ele — senão uma actualização em segundo plano
  // apagava-lhe o que estava a escrever.
  useEffect(() => {
    if (mexido) return;
    const lista = (data.services || []).filter(s => s.isActive !== false);
    if (lista.length) {
      setServicos(lista.map(s => ({
        id: s.id, name: s.name, price: s.price, durationMinutes: s.durationMinutes || 30,
      })));
    }
    const horas = negocio?.openingHours;
    if (horas?.length) {
      setAbre(horaMaisComum(horas, 'open', '09:00'));
      setFecha(horaMaisComum(horas, 'close', '19:00'));
      setDiasAbertos(new Set(horas.filter(h => h.isOpen).map(h => h.day)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.services, negocio?.openingHours]);

  const mudar = (i, campo, valor) => {
    setMexido(true);
    setServicos(prev => prev.map((s, idx) => idx === i ? { ...s, [campo]: valor } : s));
  };
  const remover = (i) => { setMexido(true); setServicos(prev => prev.filter((_, idx) => idx !== i)); };
  const juntar = () => { setMexido(true); setServicos(prev => [...prev, { name: '', price: 10, durationMinutes: 30 }]); };
  const virarDia = (dia) => {
    setMexido(true);
    setDiasAbertos(prev => { const n = new Set(prev); if (n.has(dia)) n.delete(dia); else n.add(dia); return n; });
  };

  const endereco = negocio?.slug ? `${negocio.slug}.${DOMINIO_BASE}` : '';

  async function marcarFeito(extra) {
    await dataService.updateBusiness({
      arranque: { feito: true, em: new Date().toISOString(), ...(extra || {}) },
    });
  }

  async function guardar(destino) {
    const limpos = servicos
      .map(s => ({ ...s, name: (s.name || '').trim(), price: Number(s.price) || 0 }))
      .filter(s => s.name);

    if (!limpos.length) { toast.error('Falta pelo menos um serviço', 'Escreve o que fazes e a quanto — um corte chega para começar.'); return; }
    if (fecha <= abre) { toast.error('Horário ao contrário', 'A hora de fechar tem de ser depois da de abrir.'); return; }
    if (!diasAbertos.size) { toast.error('Fechado a semana toda', 'Escolhe pelo menos um dia em que abres.'); return; }

    setAGravar(true);
    try {
      // Serviços: apagar o que ele tirou, actualizar o que mexeu, criar o resto.
      const antes = (data.services || []).filter(s => s.isActive !== false);
      const ficam = new Set(limpos.filter(s => s.id).map(s => s.id));
      for (const velho of antes) {
        if (!ficam.has(velho.id)) await dataService.deleteService(velho.id);
      }
      for (const s of limpos) {
        const campos = { name: s.name, price: s.price, durationMinutes: Number(s.durationMinutes) || 30 };
        if (s.id) {
          const velho = antes.find(v => v.id === s.id);
          const igual = velho && velho.name === campos.name && velho.price === campos.price
            && velho.durationMinutes === campos.durationMinutes;
          if (!igual) await dataService.updateService(s.id, campos);
        } else {
          await dataService.createService(campos);
        }
      }

      // Horário: mantém as pausas que já lá estivessem em cada dia.
      const antigos = negocio?.openingHours || [];
      const horas = DIAS.map(([dia]) => {
        const velho = antigos.find(h => h.day === dia) || {};
        const aberto = diasAbertos.has(dia);
        return aberto
          ? { ...velho, day: dia, isOpen: true, open: abre, close: fecha }
          : { ...velho, day: dia, isOpen: false };
      });

      await dataService.updateBusiness({
        openingHours: horas,
        arranque: { feito: true, em: new Date().toISOString() },
      });

      toast.success('Está feito', 'Os teus preços e o teu horário já estão no site da barbearia.');
      navigate(destino);
    } catch (e) {
      toast.error('Não ficou gravado', (e && e.message) || 'Vê a internet e tenta outra vez.');
    } finally { setAGravar(false); }
  }

  async function agoraNao() {
    try { await marcarFeito({ saltou: true }); } catch { /* se não gravar, a lista do painel lembra à mesma */ }
    navigate('/admin/agenda');
  }

  if (!negocio) return null;

  const rotulo = { fontSize: 12, color: 'var(--text-sec)', marginBottom: 6, display: 'block' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 16px 40px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 700, color: 'var(--gold)' }}>
            Um minuto, e está teu
          </div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 26, lineHeight: 1.2 }}>
            Confirma os teus preços e o teu horário
          </h1>
          <p style={{ margin: 0, color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.6 }}>
            A {negocio.name} já está no ar{endereco ? ` em ${endereco}` : ''}, mas com preços e horário
            de exemplo. Corrige-os aqui — é o que os teus clientes vão ver.
          </p>
        </div>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <Scissors size={16} style={{ color: 'var(--gold)' }} />
            <span className="fw-600" style={{ fontSize: 15 }}>O que fazes, e a quanto</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-sec)' }}>
            Apaga o que não fazes e mete os teus preços. A duração é o que decide as horas que o cliente vê.
          </p>

          {servicos.map((s, i) => (
            <div key={s.id || `novo-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {i === 0 && <label style={rotulo}>Serviço</label>}
                <input className="input" value={s.name} placeholder="Corte"
                  onChange={e => mudar(i, 'name', e.target.value)} />
              </div>
              <div style={{ width: 86, flexShrink: 0 }}>
                {i === 0 && <label style={rotulo}>Preço</label>}
                <input className="input" type="number" min="0" step="0.5" inputMode="decimal" value={s.price}
                  onChange={e => mudar(i, 'price', e.target.value)} />
              </div>
              <div style={{ width: 92, flexShrink: 0 }}>
                {i === 0 && <label style={rotulo}>Demora</label>}
                <select className="select" value={s.durationMinutes}
                  onChange={e => mudar(i, 'durationMinutes', Number(e.target.value))}>
                  {DURACOES.map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <button type="button" onClick={() => remover(i)} aria-label={`Apagar ${s.name || 'serviço'}`}
                style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, cursor: 'pointer',
                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-ter)',
                  display: 'grid', placeItems: 'center' }}>
                <X size={15} />
              </button>
            </div>
          ))}

          <Button variant="ghost" onClick={juntar} style={{ marginTop: 4 }}>
            <Plus size={15} /> Juntar outro serviço
          </Button>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <Clock size={16} style={{ color: 'var(--gold)' }} />
            <span className="fw-600" style={{ fontSize: 15 }}>A que horas abres</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-sec)' }}>
            Fora destas horas ninguém consegue marcar. Se um dia for diferente dos outros, acertas depois em Horários.
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={rotulo}>Abre</label>
              <input className="input" type="time" value={abre}
                onChange={e => { setMexido(true); setAbre(e.target.value); }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={rotulo}>Fecha</label>
              <input className="input" type="time" value={fecha}
                onChange={e => { setMexido(true); setFecha(e.target.value); }} />
            </div>
          </div>

          <label style={rotulo}>Dias em que abres</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DIAS.map(([dia, curto]) => {
              const on = diasAbertos.has(dia);
              return (
                <button key={dia} type="button" onClick={() => virarDia(dia)} aria-pressed={on}
                  style={{ padding: '9px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: on ? 700 : 500,
                    border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`,
                    background: on ? 'rgba(201,162,39,0.14)' : 'transparent',
                    color: on ? 'var(--gold)' : 'var(--text-ter)' }}>
                  {curto}
                </button>
              );
            })}
          </div>
        </Card>

        <Button block onClick={() => guardar('/admin/agenda')} disabled={aGravar}>
          {aGravar ? 'A guardar…' : <><Check size={16} /> Guardar e ver a minha agenda</>}
        </Button>

        {/* O cartão só aqui, depois de ele ter posto os preços dele. Antes
            disto era pedir uma decisão a quem ainda não tinha nada seu. */}
        <Card style={{ borderColor: 'rgba(201,162,39,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <CreditCard size={16} style={{ color: 'var(--gold)' }} />
            <span className="fw-600" style={{ fontSize: 15 }}>Quando quiseres receber marcações</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            Para os clientes poderem marcar, é preciso registar um cartão. Os primeiros 7 dias
            não são cobrados e cancelas sozinho aqui no painel — não tens de decidir isso agora.
          </p>
          <Button variant="secondary" onClick={() => guardar('/admin/subscricao')} disabled={aGravar}>
            Guardar e activar com 7 dias grátis <ArrowRight size={14} />
          </Button>
        </Card>

        <button type="button" onClick={agoraNao} disabled={aGravar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit',
            fontSize: 12.5, color: 'var(--text-ter)', textDecoration: 'underline', padding: '4px 0' }}>
          Faço isto depois
        </button>
      </div>
    </div>
  );
}
