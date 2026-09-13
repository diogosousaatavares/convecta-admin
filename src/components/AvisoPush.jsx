import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Smartphone, Check } from 'lucide-react';
import { estadoPush, ativarPush, garantirPush, enviarPush } from '@/lib/push';

/*
 * As notificacoes, do lado de quem as recebe.
 *
 * Esta faixa vive no AdminLayout, por isso corre em TODAS as paginas do
 * painel. Antes estava so na pagina "Marcacoes": um barbeiro que entrasse
 * na Agenda e nunca abrisse essa pagina nunca era sequer perguntado — e
 * ficava sem notificacao nenhuma, sem nada que lho dissesse.
 *
 * Depois de autorizada, a faixa nao desaparece de todo: fica uma linha fina
 * com um botao de teste. O barbeiro carrega, o telemovel toca, e ele sabe.
 * Sem isso, "nao me chegou nada" e uma conversa sem fim — ninguem consegue
 * distinguir "ninguem marcou" de "esta partido".
 *
 * O botao tem de ser carregado por uma pessoa: a permissao nao pode ser
 * pedida sozinha ao abrir a pagina, e num iPhone uma recusa so se desfaz
 * nas definicoes do sistema. Por isso nao insistimos.
 */
export default function AvisoPush({ businessId, userId, papel, texto, comTeste = false }) {
  const [estado, setEstado] = useState('indisponivel');
  const [aPedir, setAPedir] = useState(false);
  const [erro, setErro] = useState('');
  const [teste, setTeste] = useState(null);   // null | 'a-enviar' | {ok, msg}

  useEffect(() => {
    const e = estadoPush();
    setEstado(e);
    // Ja autorizado noutra altura? Entao a faixa nao pergunta nada — mas a
    // inscricao pode nao existir (browser limpo, aparelho novo, linha
    // apagada). Garante-se em silencio, em cada pagina.
    if (e === 'concedido') garantirPush({ businessId, userId, papel });
  }, [businessId, userId, papel]);

  if (!businessId || !userId) return null;
  if (estado === 'indisponivel') return null;

  async function ligar() {
    setAPedir(true); setErro('');
    try { setEstado(await ativarPush({ businessId, userId, papel })); }
    catch (e) { setErro(e.message); }
    finally { setAPedir(false); }
  }

  async function testar() {
    setTeste('a-enviar');
    try {
      const r = await enviarPush({
        businessId, para: papel,
        titulo: '\u{1F514} Teste da Convecta',
        mensagem: 'Se estas a ler isto no telemovel, as notificacoes estao a funcionar.',
        url: '/admin/agenda', tag: 'teste',
      });
      if (r.enviadas > 0) {
        setTeste({ ok: true, msg: `Enviada para ${r.enviadas} aparelho${r.enviadas > 1 ? 's' : ''}.` });
      } else if (r.inscricoes > 0) {
        // Ha aparelhos inscritos e mesmo assim nao foi: isto e uma avaria,
        // nao e falta de gente. O motivo vem do servidor.
        setTeste({ ok: false, msg: `${r.inscricoes} aparelho(s) inscrito(s) mas o envio falhou. ${r.motivos?.[0] || ''} (chave ${r.chavePublica || '?'})` });
      } else {
        setTeste({ ok: false, msg: 'Nenhum aparelho ligado nesta barbearia. Liga as notificações no telemóvel onde as queres receber.' });
      }
    } catch (e) {
      setTeste({ ok: false, msg: e.message });
    }
  }

  /* ── Já autorizado: linha fina, com o botão de teste ──────────────── */
  if (estado === 'concedido') {
    if (!comTeste) return null;
    return (
      <div className="push-linha">
        <Check size={15} />
        <span>Notificações ligadas neste aparelho.</span>
        <button type="button" onClick={testar} disabled={teste === 'a-enviar'}>
          {teste === 'a-enviar' ? 'A enviar…' : 'Testar'}
        </button>
        {teste && teste !== 'a-enviar' && (
          <span className={teste.ok ? 'push-linha-ok' : 'push-linha-mal'}>{teste.msg}</span>
        )}
      </div>
    );
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
            <span>No iPhone, as notificações só funcionam depois de guardar este painel no ecrã
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
            <b>{texto?.titulo || 'Ligue as notificações'}</b>
            <span>{texto?.corpo || 'Assim que entrar uma marcação, recebe um aviso no telemóvel. Sem isto, só a vê quando abrir o painel.'}</span>
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
