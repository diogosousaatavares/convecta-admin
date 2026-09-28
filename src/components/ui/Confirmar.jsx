import React, { useState, useCallback } from 'react';
import { Modal, Button } from '@/components/ui';

/*
 * Perguntar "de certeza?" sem usar o window.confirm.
 *
 * Uma caixa nativa do browser trava a pagina toda enquanto esta aberta —
 * numa auditoria a 28/09/2026 bastou uma para o separador deixar de
 * responder — e no telemovel nem sempre aparece onde se espera. Havia sete
 * espalhadas pelo painel, cada uma com o seu texto.
 *
 * Isto e a mesma pergunta feita dentro da app. Usa-se assim:
 *
 *   const [pedir, Confirmacao] = useConfirmar();
 *   ...
 *   <button onClick={() => pedir({
 *     titulo: 'Apagar o pack?',
 *     texto: 'Quem ja o comprou fica com os cortes que tem.',
 *     botao: 'Apagar',
 *     aoConfirmar: async () => { ... },
 *   })}>Apagar</button>
 *   ...
 *   <Confirmacao />
 *
 * O `aoConfirmar` pode devolver uma promessa: o botao fica preso enquanto
 * ela nao resolve, para nao haver dois toques a fazer a mesma coisa.
 */
export function useConfirmar() {
  const [pedido, setPedido] = useState(null);
  const [aCorrer, setACorrer] = useState(false);

  const pedir = useCallback((p) => setPedido(p), []);

  const Confirmacao = useCallback(() => {
    if (!pedido) return null;
    const fechar = () => { if (!aCorrer) setPedido(null); };
    return (
      <Modal open onClose={fechar} title={pedido.titulo}
        footer={<>
          <Button variant="secondary" onClick={fechar} disabled={aCorrer}>Cancelar</Button>
          <Button variant={pedido.perigoso === false ? 'primary' : 'danger'} disabled={aCorrer}
            onClick={async () => {
              setACorrer(true);
              try { await pedido.aoConfirmar?.(); setPedido(null); }
              finally { setACorrer(false); }
            }}>
            {aCorrer ? 'Um momento…' : (pedido.botao || 'Confirmar')}
          </Button>
        </>}>
        <p style={{ margin: 0 }}>{pedido.texto}</p>
      </Modal>
    );
  }, [pedido, aCorrer]);

  return [pedir, Confirmacao];
}
