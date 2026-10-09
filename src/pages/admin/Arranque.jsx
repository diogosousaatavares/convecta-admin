import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Clock, Plus, X, ArrowRight, CreditCard, Check } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
// O Card e o Button do painel usam `--gold`, que aqui e a cor da barbearia
// e nao a da Convecta. Este ecra desenha-se por si, com as cores do site.
import { useToast } from '@/components/ui/ToastContext';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE } from '@/lib/designService';
import { n as nicho, definirNicho, TIPOS, LISTA_TIPOS } from '@/lib/nicho';
import { servicosDe, saoServicosDeOrigem, temaParaTipo } from '@/lib/sugestoesNicho';

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
  // O tipo de negócio: barbearia, salão, estúdio de unhas, estética. Muda as
  // palavras de todo o painel e do site, os serviços de exemplo e as cores.
  const [tipo, setTipo] = useState(negocio?.tipoNegocio || 'barbearia');
  useEffect(() => { if (negocio?.tipoNegocio) setTipo(negocio.tipoNegocio); }, [negocio?.tipoNegocio]);
  const escolherTipo = (t) => {
    setTipo(t);
    definirNicho(t);
    /* Se os serviços ainda são os de exemplo, trocam-se pelos deste tipo.
       Se ele já escreveu os dele, ficam — nunca se apaga trabalho. */
    if (saoServicosDeOrigem(servicos)) {
      setMexido(true);
      setServicos(prev => {
        const ids = prev.filter(s => s.id);
        return servicosDe(t).map((s, i) => ({ ...s, id: ids[i]?.id }));
      });
    }
  };

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

    if (!limpos.length) { toast.error('Falta pelo menos um serviço', `Escreve o que fazes e a quanto — ${nicho().id === 'barbearia' ? 'um corte' : 'um serviço'} chega para começar.`); return; }
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

      // O tipo grava-se com o resto; as cores só mudam num site que ainda
      // tem as de origem (temaParaTipo devolve null se alguém já o desenhou).
      const temaNovo = temaParaTipo(tipo, negocio?._settings?.theme);
      await dataService.updateBusiness({
        openingHours: horas,
        tipoNegocio: tipo,
        ...(temaNovo ? { theme: temaNovo } : {}),
        arranque: { feito: true, em: new Date().toISOString() },
      });

      toast.success('Está feito', `Os teus preços e o teu horário já estão no site ${nicho().da}.`);
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

  return (
    <div className="arr">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="arr-folha">

        <header className="arr-topo">
          <img src="/admin-logo.png?v=2" alt="Convecta" className="arr-marca marca-claro" />
          <img src="/admin-logo-escuro.png?v=2" alt="Convecta" className="arr-marca marca-escuro" />
          <div className="arr-olho">Um minuto, e está teu</div>
          <h1 className="arr-h1">Confirma os teus preços<br />e o teu horário</h1>
          {endereco && <div className="arr-endereco">{endereco}</div>}
        </header>

        <section className="arr-caixa">
          <h2 className="arr-h2">O que é o teu negócio</h2>
          <div className="arr-tipos">
            {LISTA_TIPOS.map(t => (
              <button key={t} type="button" aria-pressed={tipo === t}
                className={`arr-tipo${tipo === t ? ' on' : ''}`}
                onClick={() => escolherTipo(t)}>{TIPOS[t].nome}</button>
            ))}
          </div>
        </section>

        <section className="arr-caixa">
          <h2 className="arr-h2"><Scissors size={16} /> O que fazes, e a quanto</h2>

          <div className="arr-servicos">
            {servicos.map((s, i) => (
              <div className="arr-servico" key={s.id || `novo-${i}`}>
                <input className="arr-campo arr-nome" value={s.name} placeholder={nicho().id === 'barbearia' ? 'Corte' : 'Serviço'}
                  aria-label="Nome do serviço" onChange={e => mudar(i, 'name', e.target.value)} />
                <div className="arr-linha2">
                  <div className="arr-preco">
                    <input className="arr-campo" type="number" min="0" step="0.5" inputMode="decimal"
                      aria-label="Preço" value={s.price} onChange={e => mudar(i, 'price', e.target.value)} />
                    <span className="arr-euro">€</span>
                  </div>
                  <select className="arr-campo arr-demora" value={s.durationMinutes} aria-label="Duração"
                    onChange={e => mudar(i, 'durationMinutes', Number(e.target.value))}>
                    {DURACOES.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                  <button type="button" className="arr-x" onClick={() => remover(i)}
                    aria-label={`Apagar ${s.name || 'serviço'}`}><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="arr-juntar" onClick={juntar}>
            <Plus size={16} /> Juntar outro serviço
          </button>
        </section>

        <section className="arr-caixa">
          <h2 className="arr-h2"><Clock size={16} /> A que horas abres</h2>

          <div className="arr-horas">
            <label className="arr-hora">
              <span>Abre</span>
              <input className="arr-campo" type="time" value={abre}
                onChange={e => { setMexido(true); setAbre(e.target.value); }} />
            </label>
            <label className="arr-hora">
              <span>Fecha</span>
              <input className="arr-campo" type="time" value={fecha}
                onChange={e => { setMexido(true); setFecha(e.target.value); }} />
            </label>
          </div>

          {/* Sete dias numa grelha de sete partes iguais: ao telemóvel
              ficavam quatro em cima e três em baixo, de larguras diferentes,
              e uma semana lê-se de uma assentada ou não se lê. */}
          <div className="arr-dias">
            {DIAS.map(([dia, curto]) => (
              <button key={dia} type="button" aria-pressed={diasAbertos.has(dia)}
                className={`arr-dia${diasAbertos.has(dia) ? ' on' : ''}`}
                onClick={() => virarDia(dia)}>{curto}</button>
            ))}
          </div>
        </section>

        <button type="button" className="arr-btn arr-btn-forte" disabled={aGravar}
          onClick={() => guardar('/admin/agenda')}>
          {aGravar ? 'A guardar…' : <><Check size={17} /> Guardar e ver a minha agenda</>}
        </button>

        {/* O cartão só aqui, depois de ele ter posto os preços dele. Antes
            disto era pedir uma decisão a quem ainda não tinha nada seu. */}
        <section className="arr-caixa arr-cartao">
          <h2 className="arr-h2"><CreditCard size={16} /> Quando quiseres receber marcações</h2>
          <button type="button" className="arr-btn" disabled={aGravar}
            onClick={() => guardar('/admin/subscricao')}>
            Guardar e activar com 14 dias grátis <ArrowRight size={15} />
          </button>
        </section>

        <button type="button" className="arr-depois" onClick={agoraNao} disabled={aGravar}>
          Faço isto depois
        </button>
      </div>
    </div>
  );
}

/*
 * A MARCA AQUI É A DA CONVECTA, E NÃO A DA BARBEARIA.
 *
 * Em todo o resto do painel, `--gold` é a cor que o barbeiro escolheu para a
 * marca dele. Neste ecrã não pode ser: ele ainda não escolheu cor nenhuma, e
 * o que `--gold` devolve é a cor que a barbearia trouxe por omissão — foi
 * assim que esta página apareceu castanha azeitona, com um botão cor de
 * tabaco, no dia em que ele a viu pela primeira vez.
 *
 * Aqui mandam as cores do site da Convecta: ele acabou de vir de lá, e o
 * painel tem de parecer a mesma casa. A partir da agenda, manda a dele.
 */
const CSS = `
.arr {
  --cvA: #FEE96D;            /* o amarelo do site */
  --cvA-t: #8A6D0A;          /* o amarelo não se lê em texto pequeno */
  --cvI: #24201C;            /* quase preto, mas quente */
  --cvI2: #5F5852;
  --cvL: rgba(36, 32, 28, 0.10);
  --cvF: #FBFAF8;            /* branco de folha é duro */
  min-height: 100vh; background: var(--cvF); color: var(--cvI);
  padding: 32px 16px calc(40px + env(safe-area-inset-bottom, 0px));
}
.arr-folha { width: 100%; min-width: 0; box-sizing: border-box; max-width: 580px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }

.arr-topo { text-align: center; margin-bottom: 6px; }
/* Este ecra e sempre claro, mesmo com o painel em modo escuro — por isso o
   logotipo e sempre o de fundo claro. Sem isto, um barbeiro com o painel
   escuro via um logotipo branco em cima de papel branco, ou seja, nada. */
.arr .marca-claro { display: block !important; }
.arr .marca-escuro { display: none !important; }
.arr-marca { width: 46px; height: 46px; object-fit: contain; margin: 0 auto 16px; display: block; }
.arr-olho {
  font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase;
  color: var(--cvA-t);
}
.arr-h1 {
  margin: 10px 0 0; font-size: 30px; line-height: 1.15; letter-spacing: -.02em;
  font-weight: 700; color: var(--cvI); text-wrap: balance;
}
.arr-endereco {
  display: inline-block; margin-top: 12px; padding: 6px 13px; border-radius: 999px;
  background: rgba(254, 233, 109, .35); border: 1px solid rgba(254, 233, 109, .9);
  font-size: 13.5px; font-weight: 700; color: var(--cvI); word-break: break-all;
}

.arr-caixa {
  background: #FFF; border: 1px solid var(--cvL); border-radius: 16px; padding: 18px 16px;
}
.arr-h2 {
  display: flex; align-items: center; gap: 9px; margin: 0 0 14px;
  font-size: 16px; font-weight: 700; color: var(--cvI);
}
.arr-h2 svg { color: var(--cvA-t); flex-shrink: 0; }

/* ── Serviços ─────────────────────────────────────────────────────────────
   Cada serviço é um bloco, não uma linha. Nome em cima, a toda a largura —
   «Corte + Barba» numa caixa de 120px é uma caixa onde não se lê o que se
   escreveu. Preço, duração e apagar na linha de baixo, que é onde cabem. */
.arr-servicos { display: flex; flex-direction: column; gap: 12px; }
.arr-servico {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px; border-radius: 12px; background: var(--cvF); border: 1px solid var(--cvL);
}
.arr-linha2 { display: flex; gap: 8px; align-items: stretch; }
.arr-campo {
  width: 100%; min-height: 46px; padding: 0 13px; border-radius: 10px;
  border: 1px solid var(--cvL); background: #FFF; color: var(--cvI);
  font: inherit; font-size: 16px;   /* 16px: abaixo disto o iPhone faz zoom */
}
.arr-campo:focus { outline: 2px solid var(--cvA); outline-offset: 1px; border-color: transparent; }
.arr-nome { font-weight: 700; }
.arr-preco { position: relative; flex: 1 1 0; min-width: 0; }
.arr-preco .arr-campo { padding-right: 30px; }
.arr-euro {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--cvI2); font-size: 15px; pointer-events: none;
}
.arr-demora { flex: 1 1 0; min-width: 0; }
.arr-x {
  flex: 0 0 46px; width: 46px; min-height: 46px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--cvL); background: #FFF; color: #B4231F;
  display: grid; place-items: center;
}
.arr-juntar {
  margin-top: 12px; width: 100%; min-height: 46px; border-radius: 10px; cursor: pointer;
  border: 1px dashed rgba(36, 32, 28, .22); background: transparent; color: var(--cvI2);
  font: inherit; font-size: 15px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.arr-juntar:hover { border-color: var(--cvA-t); color: var(--cvI); }

/* ── Horário ───────────────────────────────────────────────────────────── */
.arr-horas { display: flex; gap: 10px; margin-bottom: 16px; }
.arr-hora { flex: 1; min-width: 0; display: block; }
.arr-hora span {
  display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--cvI2);
}
.arr-tipos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.arr-tipo { min-height: 48px; padding: 8px 10px; border-radius: 12px; border: 1px solid var(--cvL);
  background: #FFF; color: var(--cvI); font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; text-align: center; line-height: 1.25; }
.arr-tipo.on { background: var(--cvA); border-color: var(--cvA); color: var(--cvI); font-weight: 800; }
.arr-dias { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }
.arr-dia {
  min-height: 46px; padding: 0 2px; border-radius: 10px; cursor: pointer; font: inherit;
  font-size: 14px; font-weight: 600; border: 1px solid var(--cvL);
  background: #FFF; color: #9A938B;
}
.arr-dia.on {
  background: var(--cvA); border-color: var(--cvA); color: var(--cvI); font-weight: 800;
}

/* ── Botões ────────────────────────────────────────────────────────────── */
.arr-btn {
  width: 100%; min-height: 52px; border-radius: 999px; cursor: pointer; font: inherit;
  font-size: 16px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; gap: 9px;
  border: 1px solid var(--cvL); background: #FFF; color: var(--cvI);
}
.arr-btn:disabled { opacity: .55; cursor: default; }
.arr-btn-forte {
  background: var(--cvA); border-color: var(--cvA); color: var(--cvI);
  box-shadow: 0 6px 20px rgba(254, 233, 109, .55);
}
.arr-cartao { border-color: rgba(254, 233, 109, .9); background: rgba(254, 233, 109, .16); }
.arr-cartao .arr-btn { background: #FFF; }
.arr-depois {
  background: none; border: 0; cursor: pointer; font: inherit; font-size: 15px;
  color: #8A837B; text-decoration: underline; padding: 8px 0; margin-top: 2px;
}

@media (min-width: 560px) {
  .arr { padding-top: 48px; }
  .arr-caixa { padding: 22px 20px; }
  .arr-h1 { font-size: 34px; }
  /* Com espaço, o serviço volta a ser uma linha só. */
  .arr-servico { flex-direction: row; align-items: center; gap: 10px; }
  .arr-nome { flex: 1 1 auto; }
  .arr-linha2 { flex: 0 0 auto; }
  .arr-preco { flex: 0 0 104px; }
  .arr-demora { flex: 0 0 116px; }
}
`;
