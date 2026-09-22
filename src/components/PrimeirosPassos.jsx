import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, X, Scissors, Clock, Palette, Bell, Share2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { DOMINIO_BASE } from '@/lib/designService';
import { supabase } from '@/lib/supabase';

/*
 * Os primeiros passos, no Dashboard.
 *
 * Um barbeiro que acabou de entrar tem a casa montada mas vazia de decisões
 * dele: os serviços são os que a base de dados criou, o horário é o que veio
 * por omissão, não há logótipo, e o telemóvel ainda não toca. Ele não sabe
 * nada disso — vê um painel bonito e não sabe por onde pegar.
 *
 * Isto responde a uma pergunta só: **o que faço agora?**
 *
 * ── Porque é assim e não um passeio guiado ───────────────────────────────
 *
 * Um tour que prende o ecrã e obriga a carregar em «seguinte» oito vezes é
 * uma coisa que se fecha. Uma lista de cinco linhas, que ele lê em dez
 * segundos e onde carrega no que lhe apetecer, é uma coisa que se usa. Ele
 * manda; nós só dizemos o que falta.
 *
 * ── O que é detectado e o que é marcado à mão ────────────────────────────
 *
 * Duas coisas sabemos de certeza: se há logótipo, e se as notificações estão
 * ligadas neste telemóvel. Essas ticam-se sozinhas.
 *
 * Os serviços e o horário JÁ EXISTEM quando a barbearia nasce — por isso
 * «tem serviços» não prova nada, e ticá-los automaticamente era mentir-lhe
 * que já tinha feito o trabalho. O que se lhe pede é que os CONFIRME, e isso
 * só ele sabe quando fez: fica um tique manual.
 *
 * O último passo tica-se sozinho quando chega a primeira marcação. É o único
 * que importa mesmo, e é bonito ver acender-se.
 *
 * Desaparece quando estiver tudo feito, ou quando ele o esconder. Não volta.
 */

const chave = (id) => `convecta_passos_${id}`;

function lerFeitos(id) {
  try { return JSON.parse(localStorage.getItem(chave(id)) || '{}'); } catch { return {}; }
}
function gravarFeitos(id, feitos) {
  try { localStorage.setItem(chave(id), JSON.stringify(feitos)); } catch { /* sem memória, sem drama */ }
}

export default function PrimeirosPassos() {
  const data = useStore();
  const navigate = useNavigate();
  const negocio = data?.business;
  const id = negocio?.id;

  const [feitos, setFeitos] = useState({});
  const [copiado, setCopiado] = useState(false);

  // Os passos também vivem na base de dados (ONBOARDING.sql): a maioria
  // marca-se sozinha quando o barbeiro faz a coisa, e a Convecta vê o
  // progresso no super admin. O que está no browser junta-se por cima.
  const [daBase, setDaBase] = useState({});
  useEffect(() => {
    if (!id) return;
    setFeitos(lerFeitos(id));
    supabase.from('onboarding_passos').select('passo').eq('business_id', id)
      .then(({ data }) => setDaBase(Object.fromEntries((data || []).map(p => [p.passo, true]))), () => {});
  }, [id]);

  if (!id) return null;
  if (feitos.escondido) return null;

  const endereco = negocio.domain || (negocio.slug ? `${negocio.slug}.${DOMINIO_BASE}` : '');

  // Notificações: a permissão é DESTE browser. Num telemóvel novo volta a
  // aparecer por fazer, e ainda bem — é lá que ela faz falta.
  let notificacoesLigadas = false;
  try { notificacoesLigadas = typeof Notification !== 'undefined' && Notification.permission === 'granted'; } catch { /* browser sem Notification */ }

  const temMarcacoes = (data.appointments?.length || 0) > 0;

  const PASSOS = [
    {
      k: 'servicos',
      icone: Scissors,
      titulo: 'Confirma os serviços e os preços',
      ajuda: 'Criámos alguns para começares. Apaga, muda o preço e a duração.',
      to: '/admin/servicos',
      feito: !!feitos.servicos || !!daBase.servicos,
    },
    {
      k: 'horarios',
      icone: Clock,
      titulo: 'Ajusta o horário da barbearia',
      ajuda: 'A que horas abres e fechas, e os dias de folga.',
      to: '/admin/horarios',
      feito: !!feitos.horarios || !!daBase.horarios,
    },
    {
      k: 'aparencia',
      icone: Palette,
      titulo: 'Põe o teu logótipo e as tuas cores',
      ajuda: 'O site dos teus clientes fica com a tua cara.',
      to: '/admin/o-meu-site',
      feito: !!negocio.logoUrl || !!feitos.aparencia || !!daBase.aparencia,
    },
    {
      k: 'notificacoes',
      icone: Bell,
      titulo: 'Liga as notificações no telemóvel',
      ajuda: 'É assim que sabes de uma marcação no segundo em que ela entra.',
      to: '/admin/definicoes/notificacoes',
      feito: notificacoesLigadas || !!feitos.notificacoes || !!daBase.notificacoes,
    },
    {
      k: 'partilhar',
      icone: Share2,
      titulo: 'Partilha o link com os teus clientes',
      ajuda: temMarcacoes
        ? 'Já tens marcações a entrar. É para isto que isto serve.'
        : 'No Instagram, no WhatsApp, no espelho. É o endereço que enche a agenda.',
      accao: 'copiar',
      feito: temMarcacoes || !!feitos.partilhar || !!daBase.partilhar,
    },
  ];

  const prontos = PASSOS.filter(p => p.feito).length;
  if (prontos === PASSOS.length) return null;

  const ticar = (k) => {
    const novos = { ...feitos, [k]: !feitos[k] };
    setFeitos(novos);
    gravarFeitos(id, novos);
    supabase.rpc('meu_passo_onboarding', { p_passo: k, p_feito: !!novos[k] }).then(() => {}, () => {});
  };

  const esconder = () => {
    const novos = { ...feitos, escondido: true };
    setFeitos(novos);
    gravarFeitos(id, novos);
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${endereco}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* sem clipboard: o cartão do link no topo tem o endereço à vista */ }
    ticar('partilhar');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="pp" aria-label="Primeiros passos">
        <header className="pp-topo">
          <div>
            <h2 className="pp-h">Primeiros passos</h2>
            <p className="pp-sub">Cinco minutos e a tua barbearia fica com a tua cara.</p>
          </div>
          <div className="pp-conta">
            <span>{prontos} de {PASSOS.length}</span>
            <div className="pp-barra"><i style={{ width: `${(prontos / PASSOS.length) * 100}%` }} /></div>
          </div>
          <button type="button" className="pp-fechar" onClick={esconder} aria-label="Esconder os primeiros passos">
            <X size={16} />
          </button>
        </header>

        <ul className="pp-lista">
          {PASSOS.map(p => {
            const Icone = p.icone;
            return (
              <li key={p.k} className={p.feito ? 'feito' : ''}>
                {/* O tique é um botão à parte do resto da linha: carregar na
                    linha leva-o à página, carregar no tique diz «já fiz».
                    São duas intenções diferentes e merecem dois alvos. */}
                <button
                  type="button"
                  className="pp-tique"
                  onClick={() => ticar(p.k)}
                  aria-pressed={p.feito}
                  aria-label={p.feito ? `Marcar "${p.titulo}" como por fazer` : `Marcar "${p.titulo}" como feito`}
                >
                  {p.feito ? <Check size={14} strokeWidth={3} /> : <Icone size={15} />}
                </button>

                <button
                  type="button"
                  className="pp-linha"
                  onClick={() => (p.accao === 'copiar' ? copiarLink() : navigate(p.to))}
                >
                  <span className="pp-t">{p.titulo}</span>
                  <span className="pp-a">{p.accao === 'copiar' && copiado ? 'Link copiado.' : p.ajuda}</span>
                </button>

                <span className="pp-seta" aria-hidden="true"><ChevronRight size={16} /></span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

const CSS = `
.pp {
  border: 1px solid var(--border); border-radius: 16px; background: var(--surface);
  padding: 18px 18px 8px; margin: 0 0 16px; position: relative;
}
.pp-topo { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; padding-right: 28px; }
.pp-h { font-size: 16px; font-weight: 600; margin: 0; }
.pp-sub { font-size: 13px; color: var(--text-sec); margin: 3px 0 0; }
.pp-conta { margin-left: auto; text-align: right; flex-shrink: 0; }
.pp-conta span { font-size: 12px; color: var(--text-sec); font-variant-numeric: tabular-nums; }
.pp-barra { width: 92px; height: 4px; border-radius: 4px; background: var(--border); margin-top: 6px; overflow: hidden; }
.pp-barra i { display: block; height: 100%; background: var(--gold); border-radius: 4px; transition: width .35s ease; }
.pp-fechar {
  position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
  display: grid; place-items: center; border-radius: 999px;
  background: transparent; border: 0; color: var(--text-ter); cursor: pointer;
}
.pp-fechar:hover { color: var(--text); }

.pp-lista { list-style: none; margin: 14px 0 0; padding: 0; }
.pp-lista li {
  display: grid; grid-template-columns: 30px 1fr 16px; gap: 12px; align-items: center;
  padding: 10px 0; border-top: 1px solid var(--border);
}
.pp-tique {
  width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center;
  border: 1px solid var(--border); background: var(--elevated); color: var(--text-sec);
  cursor: pointer; padding: 0; transition: background .2s, color .2s, border-color .2s;
}
.pp-tique:hover { border-color: var(--gold); color: var(--gold); }
.pp-lista li.feito .pp-tique { background: var(--gold); border-color: var(--gold); color: #111; }
.pp-linha {
  background: none; border: 0; padding: 0; text-align: left; cursor: pointer;
  font: inherit; color: inherit; min-width: 0;
}
.pp-t { display: block; font-size: 14px; font-weight: 600; }
.pp-a { display: block; font-size: 12.5px; color: var(--text-sec); margin-top: 2px; line-height: 1.4; }
.pp-lista li.feito .pp-t { color: var(--text-sec); text-decoration: line-through; text-decoration-thickness: 1px; }
.pp-lista li.feito .pp-a { display: none; }
.pp-seta { color: var(--text-ter); display: grid; place-items: center; }
.pp-lista li.feito .pp-seta { opacity: 0; }

@media (max-width: 560px) {
  .pp { padding: 16px 14px 6px; }
  .pp-conta { margin-left: 0; text-align: left; width: 100%; }
  .pp-barra { width: 100%; }
}
`;
