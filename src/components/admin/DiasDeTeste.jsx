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
 * Conta DIAS, e mais nada — nem horas, nem minutos. Um relógio ao segundo
 * num aviso destes não ajuda a decidir nada: só mete pressão. O que muda nos
 * últimos três dias é a cor, não a unidade.
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

  /* De dez em dez minutos. Não é para a contagem mexer — ela só muda uma
     vez por dia —, é para MUDAR quando o dia vira, num painel que fica
     aberto durante dias seguidos. */
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 600000);
    return () => clearInterval(t);
  }, []);

  if (!sub || sub.estado !== 'em_teste' || !sub.fimDoTeste) return null;

  const fim = new Date(sub.fimDoTeste).getTime();
  if (Number.isNaN(fim)) return null;

  const faltam = fim - agora;
  const dias = Math.ceil(faltam / 86400000);

  const texto =
    faltam <= 0 ? 'A experiência acabou'
    : dias === 1 ? 'Último dia de experiência'
    : `Faltam ${dias} dias de experiência`;

  /* Três dias é onde a conversa muda: deixa de ser informação e passa a ser
     uma coisa para resolver esta semana. A unidade é a mesma; o que muda é
     a cor. */
  const aperto = faltam <= 0 ? 'acabou' : dias <= 3 ? 'apertado' : '';

  return (
    <Link to="/admin/subscricao" className={`dias-teste ${aperto}`}>
      <strong>{texto}</strong>
      <span className="dias-teste-ir">{faltam <= 0 ? 'Activar' : 'Ver plano'} →</span>
    </Link>
  );
}
