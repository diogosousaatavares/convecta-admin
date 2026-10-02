import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dataService from '@/lib/dataService';

/*
 * QUANTOS DIAS FALTAM DA EXPERIÊNCIA.
 *
 * No topo do menu, logo por baixo do nome. Aparece sempre que ele abre o
 * menu, que é várias vezes por dia — e é por isso que está aqui e não numa
 * página que ele tem de ir procurar.
 *
 * O número é o da barbearia DELE: sai de `trial_ends_at`, a data que a
 * Stripe fixou quando a subscrição foi criada. Não é a constante dos 14
 * dias — quem começou com 30 continua com 30, e quem está no dia 11 vê 3.
 *
 * Só aparece durante a experiência. Quem já paga, quem é isenta e quem
 * ainda não tem cartão não vê nada: a estes já fala a faixa da subscrição,
 * e duas faixas a dizer coisas sobre dinheiro no mesmo ecrã é uma a mais.
 */
export default function DiasDeTeste() {
  const [sub, setSub] = useState(null);

  useEffect(() => {
    let vivo = true;
    dataService.subscricao()
      .then(s => { if (vivo) setSub(s); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  if (!sub || sub.estado !== 'em_teste' || !sub.fimDoTeste) return null;

  const dias = Math.ceil((new Date(sub.fimDoTeste) - new Date()) / 86400000);
  if (dias == null || Number.isNaN(dias)) return null;

  // Três dias é onde a conversa muda: deixa de ser informação e passa a ser
  // uma coisa para resolver esta semana.
  const apertado = dias <= 3;
  const texto =
    dias <= 0 ? 'A experiência acabou'
    : dias === 1 ? 'Último dia de experiência'
    : `Faltam ${dias} dias de experiência`;

  return (
    <Link to="/admin/subscricao" className={`dias-teste ${apertado ? 'apertado' : ''}`}>
      <strong>{texto}</strong>
      <span>{dias <= 0 ? 'Activar' : 'Ver plano'} →</span>
    </Link>
  );
}
