import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, Copy, Check, RefreshCw } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { getBusiness, DOMINIO_BASE } from '@/lib/designService';
import {
  MODELO, desenhar, carregarImagem, garantirFonte,
  paraBlob, nomeDoFicheiro, legenda,
} from '@/lib/carrossel';

/*
 * Redes sociais — o post que anuncia as marcações online.
 *
 * ── O problema que isto resolve ──────────────────────────────────────────
 *
 * Um barbeiro acaba de montar a casa, tem o site no ar, e depois não
 * acontece nada. Não porque não queira — porque publicar significa abrir uma
 * app de design, escolher um modelo, arrastar o logótipo, escrever qualquer
 * coisa que não soe a anúncio, e ainda decidir a legenda. São quarenta
 * minutos de um trabalho que ele não sabe fazer, entre dois cortes.
 *
 * Aqui são dois toques. A arte é a mesma para toda a gente, mas sai com o
 * logótipo dele, o nome dele, o endereço dele e a cor que ele escolheu em
 * «O Meu Site» — e um post que parece dele é um post que ele publica.
 *
 * ── Descarregar cinco ficheiros de uma vez ───────────────────────────────
 *
 * No telemóvel não se descarrega: partilha-se. O `navigator.share` com
 * ficheiros manda as cinco imagens direitas para o Instagram, sem passarem
 * pela galeria. No computador, cada imagem tem o seu botão, porque os
 * browsers desconfiam de quem tenta descarregar cinco ficheiros seguidos e
 * bloqueiam o segundo em diante.
 */

export default function RedesSociais() {
  const toast = useToast();
  const [barbearia, setBarbearia] = useState(null);
  const [erro, setErro] = useState('');
  const [copiada, setCopiada] = useState(false);
  const [aDesenhar, setADesenhar] = useState(true);
  const telas = useRef([]);

  const carregar = useCallback(async () => {
    setADesenhar(true); setErro('');
    try {
      const b = await getBusiness();
      const tema = b?.theme || {};
      await garantirFonte();
      // O logótipo vem de outro domínio (o Storage); sem CORS o canvas ficava
      // contaminado e o botão de descarregar rebentava.
      const logo = await carregarImagem(b?.logo_url, true);
      const slug = b?.slug || 'a-tua-barbearia';
      setBarbearia({
        nome: b?.name || 'A tua barbearia',
        slug,
        endereco: b?.domain || `${slug}.${DOMINIO_BASE}`,
        logo,
        cor: tema.colors?.gold || '#C9A227',
        semLogo: !logo && !!b?.logo_url,
      });
    } catch (e) {
      setErro(e.message || 'Não foi possível ler os dados da barbearia.');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Desenhar: uma imagem de cada vez, para o ecrã ir enchendo em vez de
  // ficar em branco enquanto as cinco não estão prontas.
  useEffect(() => {
    if (!barbearia) return;
    let vivo = true;
    (async () => {
      for (let i = 0; i < MODELO.ecras.length; i++) {
        const ecra = MODELO.ecras[i];
        const img = await carregarImagem(MODELO.pasta + ecra.ficheiro);
        if (!vivo) return;
        if (!img) { setErro(`Falta o ficheiro ${MODELO.pasta}${ecra.ficheiro}.`); break; }
        if (telas.current[i]) desenhar(telas.current[i], ecra, img, barbearia);
      }
      if (vivo) setADesenhar(false);
    })();
    return () => { vivo = false; };
  }, [barbearia]);

  const guardarUma = async (i) => {
    const blob = await paraBlob(telas.current[i]);
    if (!blob) { toast.error('Não deu', 'A imagem não pôde ser gerada.'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nomeDoFicheiro(barbearia, i); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const podePartilhar = typeof navigator !== 'undefined' && !!navigator.canShare;

  const partilharTodas = async () => {
    try {
      const ficheiros = await Promise.all(MODELO.ecras.map(async (_, i) => {
        const blob = await paraBlob(telas.current[i]);
        return new File([blob], nomeDoFicheiro(barbearia, i), { type: 'image/png' });
      }));
      if (!navigator.canShare({ files: ficheiros })) {
        toast.info('Este telemóvel não partilha imagens', 'Descarrega uma a uma, aqui em baixo.');
        return;
      }
      await navigator.share({ files: ficheiros, text: legenda(barbearia) });
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Não deu', 'Descarrega uma a uma, aqui em baixo.');
    }
  };

  const copiarLegenda = async () => {
    try {
      await navigator.clipboard.writeText(legenda(barbearia));
      setCopiada(true); setTimeout(() => setCopiada(false), 2000);
    } catch { toast.info('Copia à mão', 'O browser não deixou copiar sozinho.'); }
  };

  return (
    <AdminPage
      title="Redes sociais"
      subtitle="O post que diz aos teus clientes que já podem marcar online"
      actions={<Button variant="secondary" onClick={carregar}><RefreshCw size={15} /> Voltar a desenhar</Button>}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {erro && <Card className="card-pad" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>{erro}</Card>}

      <Card className="card-pad" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>{MODELO.nome}</h3>
        <p className="text-sec text-sm" style={{ margin: '6px 0 0', maxWidth: '64ch', lineHeight: 1.6 }}>
          {MODELO.resumo} O logótipo, o nome, o endereço e a cor saem do que puseste
          em <strong>O Meu Site</strong> — se mudares lá, muda aqui.
        </p>

        {barbearia?.semLogo && (
          <div className="rs-aviso">
            Não consegui usar o teu logótipo nestas imagens, por isso entrou a inicial do nome.
            Acontece quando o ficheiro está noutro sítio que não deixa reutilizá-lo. Volta a
            carregá-lo em <strong>O Meu Site</strong> e tenta outra vez.
          </div>
        )}

        <div className="rs-botoes">
          {podePartilhar && (
            <Button variant="primary" onClick={partilharTodas} disabled={!barbearia || aDesenhar}>
              <Share2 size={16} /> Partilhar as 5 imagens
            </Button>
          )}
          <Button variant={podePartilhar ? 'secondary' : 'primary'} onClick={copiarLegenda} disabled={!barbearia}>
            {copiada ? <Check size={16} /> : <Copy size={16} />} {copiada ? 'Legenda copiada' : 'Copiar a legenda'}
          </Button>
        </div>
      </Card>

      <div className="rs-grelha">
        {MODELO.ecras.map((ecra, i) => (
          <Card key={i} className="rs-cartao">
            <div className="rs-tela" style={{ aspectRatio: `${ecra.larg} / ${ecra.alt}` }}>
              <canvas ref={el => { telas.current[i] = el; }} />
            </div>
            <div className="rs-pe">
              <span className="text-sec text-xs">{i + 1} de {MODELO.ecras.length}</span>
              <button className="btn btn-ghost" onClick={() => guardarUma(i)}
                disabled={!barbearia || aDesenhar} style={{ fontSize: 13 }}>
                <Download size={15} /> Guardar
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="card-pad" style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>A legenda</h3>
        <p className="text-sec text-sm" style={{ margin: '6px 0 12px' }}>
          Muda o que quiseres. Metade dos posts que nunca são publicados morrem na pergunta
          «e agora o que é que eu escrevo aqui?».
        </p>
        <pre className="rs-legenda">{barbearia ? legenda(barbearia) : ''}</pre>
      </Card>
    </AdminPage>
  );
}

const CSS = `
.rs-botoes { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
.rs-aviso {
  margin-top: 14px; padding: 11px 14px; border-radius: 10px; line-height: 1.55;
  background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25);
  font-size: 13px; color: var(--text-sec);
}
.rs-grelha { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }
.rs-cartao { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.rs-tela { width: 100%; border-radius: 10px; overflow: hidden; background: var(--elevated); }
.rs-tela canvas { width: 100%; height: 100%; display: block; }
.rs-pe { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rs-legenda {
  margin: 0; padding: 14px 16px; border-radius: 10px; white-space: pre-wrap; word-break: break-word;
  background: var(--elevated); border: 1px solid var(--border);
  font-family: inherit; font-size: 13.5px; line-height: 1.65; color: var(--text);
}
@media (max-width: 520px) { .rs-grelha { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;
