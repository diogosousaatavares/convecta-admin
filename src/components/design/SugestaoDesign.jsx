import React, { useEffect, useState } from 'react';
import { Y, YD, W2, BD, T, T2, T3, G, R, Spin, Btn, Card } from '@/components/design/ui';
import { coresDoLogotipo, propostasDeTema } from '@/lib/sugestaoTema';

/*
 * O MEU SITE › Sugestão
 *
 * O barbeiro mete o logótipo e recebe três propostas de design feitas com as
 * cores dele. «Experimentar» aplica a proposta na pré-visualização (nada fica
 * guardado até carregar em «Guardar design»). Se preferir que seja a Convecta
 * a tratar, o botão de baixo abre o WhatsApp com o pedido já escrito.
 *
 * Não é IA e não se diz que é: são regras de cor, correm no telemóvel dele,
 * não custam nada e dão sempre o mesmo resultado.
 */

const WHATSAPP_CONVECTA = '351914874725';

function carregarFonte(f) {
  const id = 'fonte-' + f.replace(/\s/g, '');
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id; l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${f.replace(/\s/g, '+')}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(l);
}

// Um telemóvel em miniatura com as cores da proposta.
function Miniatura({ p, nome }) {
  const c = p.colors;
  return (
    <div style={{ background: c.bg, borderRadius: 12, padding: 12, border: `1px solid ${c.border}`, minHeight: 150,
      display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: `'${p.fonts.heading}', serif`, color: c.text, fontSize: 19, lineHeight: 1.1,
        fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
      <div style={{ fontFamily: `'${p.fonts.body}', sans-serif`, color: c.textSec, fontSize: 11 }}>Corte · 30 min</div>
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: Math.min(p.radius, 12),
        padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: `'${p.fonts.body}', sans-serif` }}>
        <span style={{ color: c.text, fontSize: 12 }}>Corte + barba</span>
        <span style={{ color: c.gold, fontSize: 12, fontWeight: 700 }}>18€</span>
      </div>
      <div style={{ marginTop: 'auto', background: c.gold, color: c.bg, borderRadius: p.radius, textAlign: 'center',
        padding: '8px 0', fontSize: 12, fontWeight: 700, fontFamily: `'${p.fonts.body}', sans-serif` }}>Marcar</div>
    </div>
  );
}

export default function SugestaoDesign({ biz, logo, endereco, onExperimentar, irParaMarca }) {
  const [propostas, setPropostas] = useState(null);
  const [aLer, setALer] = useState(false);
  const [erro, setErro] = useState('');
  const [escolhida, setEscolhida] = useState(null);

  async function ler(origem) {
    setALer(true); setErro(''); setEscolhida(null);
    try {
      const ps = propostasDeTema(await coresDoLogotipo(origem));
      ps.forEach(p => { carregarFonte(p.fonts.heading); carregarFonte(p.fonts.body); });
      setPropostas(ps);
    } catch (e) { setErro(e.message); setPropostas(null); }
    finally { setALer(false); }
  }

  // O logótipo escolhe-se uma vez só, em Marca. As propostas saem dele e
  // refazem-se sozinhas se o barbeiro o trocar lá.
  useEffect(() => { if (logo) ler(logo); else { setPropostas(null); setErro(''); } }, [logo]);

  function experimentar(p) {
    setEscolhida(p);
    onExperimentar({ colors: p.colors, fonts: p.fonts, radius: p.radius });
  }

  function pedirAjuda() {
    const linhas = [
      `Olá! Sou da ${biz.name || 'barbearia'} e queria ajuda com o design da minha app.`,
      `Link: https://${endereco}`,
      escolhida ? `Proposta de que gostei: «${escolhida.nome}».` : 'Ainda não escolhi nenhuma proposta.',
      logo ? `Logótipo: ${logo}` : 'Envio o logótipo a seguir nesta conversa.',
    ];
    window.open(`https://wa.me/${WHATSAPP_CONVECTA}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, color: T, marginBottom: 4 }}>Sugestão a partir do teu logótipo</div>
        <div style={{ fontSize: 12.5, color: T2, marginBottom: 14, lineHeight: 1.5 }}>
          Lemos as cores do teu logótipo e montamos três designs para a tua app, de acordo com ele. Experimenta, vê na
          pré-visualização e guarda o que gostares — podes afinar depois em Cores e Tipografia.
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 76, height: 76, flexShrink: 0, overflow: 'hidden', background: W2, borderRadius: 12,
            border: `1px solid ${BD}`, display: 'grid', placeItems: 'center' }}>
            {aLer ? <Spin size={18} />
              : logo ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: 10.5, color: T3, textAlign: 'center', padding: 6 }}>sem logótipo</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 12, color: T3, lineHeight: 1.55 }}>
              {logo
                ? <>As propostas são feitas com o logótipo que está em Marca. Se o trocares lá, mudam sozinhas.</>
                : <>Ainda não tens logótipo. Mete-o em Marca e as propostas aparecem aqui.</>}
            </div>
            <Btn v="secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={irParaMarca}>
              {logo ? 'Trocar logótipo em Marca' : 'Pôr o logótipo em Marca'}
            </Btn>
          </div>
        </div>
        {erro && <div style={{ marginTop: 12, fontSize: 12.5, color: R, lineHeight: 1.5 }}>{erro}</div>}
      </Card>

      {propostas && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
          {propostas.map(p => {
            const ativa = escolhida?.id === p.id;
            return (
              <Card key={p.id} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                borderColor: ativa ? Y : BD }}>
                <Miniatura p={p} nome={biz.name || 'A tua barbearia'} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: T }}>{p.nome}</span>
                  {p.recomendada && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 20,
                    background: `${YD}26`, color: Y, fontWeight: 700 }}>Recomendada</span>}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['bg', 'surface', 'gold', 'text'].map(k => (
                    <span key={k} title={p.colors[k]} style={{ width: 18, height: 18, borderRadius: '50%',
                      background: p.colors[k], border: `1px solid ${BD}` }} />
                  ))}
                  <span style={{ fontSize: 11, color: T3, marginLeft: 4, alignSelf: 'center' }}>{p.fonts.heading}</span>
                </div>
                <div style={{ fontSize: 12, color: T2, lineHeight: 1.5, flex: 1 }}>{p.porque}</div>
                <Btn v={ativa ? 'primary' : 'secondary'} onClick={() => experimentar(p)}>
                  {ativa ? 'Aplicada' : 'Experimentar'}
                </Btn>
              </Card>
            );
          })}
        </div>
      )}

      {escolhida && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: `${G}12`, border: `1px solid ${G}38`,
          color: T, fontSize: 13, lineHeight: 1.5 }}>
          «{escolhida.nome}» está na pré-visualização. Se gostares, carrega em <b>Guardar design</b> em baixo.
        </div>
      )}

      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, color: T, marginBottom: 4 }}>Preferes que seja a Convecta a fazer?</div>
        <div style={{ fontSize: 12.5, color: T2, marginBottom: 14, lineHeight: 1.5 }}>
          Manda-nos um pedido pelo WhatsApp. Já vai com o nome da barbearia, o link da app
          {escolhida ? ' e a proposta de que gostaste' : ''}. Nós tratamos do design por ti.
        </div>
        <Btn onClick={pedirAjuda}>Pedir ajuda à Convecta</Btn>
      </Card>
    </div>
  );
}
