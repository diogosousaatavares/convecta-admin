import React, { useState } from 'react';
import { CreditCard, IdCard, Landmark, Clock, Check } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

/*
 * O TUTORIAL DE LIGAR O STRIPE (16/10/2026).
 *
 * Abre antes de o mandar para o Stripe: o que vai precisar de ter à mão, e
 * os cinco ecrãs que vai ver, um por passo, com uma frase cada. Quem já
 * sabe carrega em «Ir para o Stripe» logo no primeiro.
 */
const PASSOS = [
  { Ic: Clock, titulo: 'Tem isto à mão', texto: 'Cartão de cidadão, NIF e o IBAN da conta onde queres receber. São 5 minutos.' },
  { Ic: CreditCard, titulo: '1. Email e telemóvel', texto: 'O Stripe pede o teu email e um código por SMS. Usa o telemóvel que tens contigo.' },
  { Ic: IdCard, titulo: '2. Quem és', texto: 'Nome, data de nascimento, morada e NIF. Se tens empresa, o NIF da empresa e o teu como responsável.' },
  { Ic: Landmark, titulo: '3. Onde recebes', texto: 'O IBAN. O dinheiro dos clientes cai aqui, em 2 a 3 dias úteis, sem custo.' },
  { Ic: Check, titulo: '4. Confirmar', texto: 'O Stripe pode pedir uma foto do cartão de cidadão. Depois volta à Convecta sozinho e os pagamentos ficam ligados.' },
];

export default function TutorialStripe({ aberto, fechar, continuar, aAbrir }) {
  const [i, setI] = useState(0);
  const p = PASSOS[i];
  const ultimo = i === PASSOS.length - 1;
  return (
    <Modal open={aberto} onClose={fechar} title="Ligar a tua conta">
      <div className="ts-cena">
        <span className="ts-ico"><p.Ic size={30} strokeWidth={1.6} /></span>
        <div className="ts-pontos">{PASSOS.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
        <h3>{p.titulo}</h3>
        <p>{p.texto}</p>
      </div>
      <div className="botoes-iguais">
        {i > 0 ? <Button variant="secondary" onClick={() => setI(i - 1)}>Anterior</Button> : <Button variant="secondary" onClick={continuar} disabled={aAbrir}>Já sei, ir para o Stripe</Button>}
        {ultimo
          ? <Button variant="primary" onClick={continuar} disabled={aAbrir}>{aAbrir ? 'A abrir…' : 'Ir para o Stripe'}</Button>
          : <Button variant="primary" onClick={() => setI(i + 1)}>Seguinte</Button>}
      </div>
    </Modal>
  );
}
