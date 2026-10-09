import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dataService from '@/lib/dataService';

/*
 * QUANTO FALTA DA EXPERIÊNCIA.
 *
 * No topo do menu, logo por baixo do nome. Aparece sempre que ele abre o
 * menu, que é várias vezes por dia — e é por isso que está aqui e não numa
 * página que ele tem de ir procurar.
 *
 * A data é a da barbearia DELE: sai de `trial_ends_at`, a data que a Stripe
 * fixou quando a subscrição foi criada. Não é a constante dos 14 dias — quem
 * começou com 30 continua com 30.
 *
 * ── Porque é que parecia estar parado ───────────────────────────────────
 *
 * A conta era feita UMA VEZ, no instante em que o componente nasce. Num
 * painel que se abre de manhã e fica aberto o dia todo — e, num telemóvel
 * com a app no ecrã principal, dias seguidos — o número que ele via era o
 * do momento em que abriu, e nunca mais mexia. Parecia estar sempre em 14.
 *
 * Agora há um relógio: de minuto a minuto refaz-se a conta. E a conta deixou
 * de ser só em dias.
 *
 * ── A contagem muda de unidade à medida que aperta ──────────────────────
 *
 * «Faltam 14 dias» e «faltam 2 dias» não são a mesma frase a dizer números
 * diferentes: são dois avisos diferentes. Nos últimos dias conta-se em dias
 * com a data à vista; no último dia conta-se em HORAS, porque é aí que a
 * diferença entre «amanhã» e «logo à noite» decide se ele trata disto.
 */
export default function DiasDeTeste() {
  const [sub, setSub] = useState(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    let vivo = true;
    dataService.subscricao()
      .then(s => { if (vivo) setSub(s); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  /* O relógio. De minuto a minuto: chega para a contagem em horas estar
     sempre certa e não custa nada. */
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  if (!sub || sub.estado !== 'em_teste' || !sub.fimDoTeste) return null;

  const fim = new Date(sub.fimDoTeste).getTime();
  if (Number.isNaN(fim)) return null;

  const faltam = fim - agora;
  const horas = Math.ceil(faltam / 3600000);
  const dias = Math.ceil(faltam / 86400000);

  /* O dia em que acaba, por extenso curto. É o que torna o aviso
     verificável: um número sozinho pede confiança, uma data não. */
  const quando = new Date(fim).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });

  let texto;
  let aperto = '';
  if (faltam <= 0) {
    texto = 'A experiência acabou';
    aperto = 'acabou';
  } else if (horas <= 1) {
    texto = 'Acaba dentro de uma hora';
    aperto = 'apertado';
  } else if (horas <= 24) {
    texto = `Faltam ${horas} horas`;
    aperto = 'apertado';
  } else if (dias === 2) {
    texto = 'Faltam 2 dias';
    aperto = 'apertado';
  } else if (dias === 3) {
    texto = 'Faltam 3 dias';
    aperto = 'apertado';
  } else {
    texto = `Faltam ${dias} dias`;
  }

  return (
    <Link to="/admin/subscricao" className={`dias-teste ${aperto}`}>
      <span className="dias-teste-txt">
        <strong>{texto}</strong>
        {faltam > 0 && <small>A experiência acaba a {quando}</small>}
      </span>
      <span className="dias-teste-ir">{faltam <= 0 ? 'Activar' : 'Ver plano'} →</span>
    </Link>
  );
}
