import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { estadoPush, ativarPush, garantirPush } from '@/lib/push';

/*
 * Faixa que pede autorização para as notificações. Só aparece enquanto ela
 * faltar — concedida, desaparece e não volta a incomodar.
 *
 * O botão tem de ser carregado por uma pessoa: a permissão não pode ser
 * pedida sozinha ao abrir a página, e num iPhone uma recusa só se desfaz
 * nas definições do sistema. Por isso não insistimos.
 */
export default function AvisoPush({ businessId, userId, papel, texto }) {
  const [estado, setEstado] = useState('indisponivel');
  const [aPedir, setAPedir] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const e = estadoPush();
    setEstado(e);
    // Já autorizado noutra altura? Então a faixa não aparece e ninguém carrega
    // em nada — mas a inscrição pode não existir. Garante-se em silêncio.
    if (e === 'concedido') garantirPush({ businessId, userId, papel });
  }, [businessId, userId, papel]);

  if (!businessId || !userId) return null;
  if (estado === 'concedido' || estado === 'indisponivel') return null;

  async function ligar() {
    setAPedir(true); setErro('');
    try { setEstado(await ativarPush({ businessId, userId, papel })); }
    catch (e) { setErro(e.message); }
    finally { setAPedir(false); }
  }

  const noIPhone = estado === 'precisa-ecra';
  const recusado = estado === 'negado';

  return (
    <div className="aviso-push">
      <span className="aviso-push-ico">
        {noIPhone ? <Smartphone size={19} /> : recusado ? <BellOff size={19} /> : <Bell size={19} />}
      </span>
      <div className="aviso-push-txt">
        {noIPhone ? (
          <>
            <b>Guarde primeiro no ecrã principal</b>
            <span>No iPhone, as notificações só funcionam depois de guardar este site no ecrã
              principal. Use o menu de partilha e escolha «Adicionar ao ecrã principal».</span>
          </>
        ) : recusado ? (
          <>
            <b>Notificações bloqueadas neste aparelho</b>
            <span>Foram recusadas antes. Para as reactivar é nas definições do browser,
              em notificações — daqui já não é possível pedir outra vez.</span>
          </>
        ) : (
          <>
            <b>{texto?.titulo || 'Ligar notificações'}</b>
            <span>{texto?.corpo || 'Recebe um aviso no telemóvel assim que algo acontecer.'}</span>
            {erro && <span className="aviso-push-erro">{erro}</span>}
          </>
        )}
      </div>
      {!noIPhone && !recusado && (
        <button type="button" className="aviso-push-btn" onClick={ligar} disabled={aPedir}>
          {aPedir ? 'A ligar…' : 'Ligar'}
        </button>
      )}
    </div>
  );
}
