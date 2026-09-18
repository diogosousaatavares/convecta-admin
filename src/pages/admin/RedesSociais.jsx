import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, Copy, Check, Image as IcImagem, RefreshCw } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/ToastContext';
import { getBusiness, DOMINIO_BASE } from '@/lib/designService';
import {
  FORMATOS, GUIOES, desenhar, carregarLogo, garantirFontes,
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
 * Aqui são dois toques. As cores e o logótipo são os que ele já escolheu em
 * «O Meu Site», por isso o post parece dele — e um post que parece dele é um
 * post que ele publica.
 *
 * ── Descarregar cinco ficheiros de uma vez ───────────────────────────────
 *
 * No telemóvel não se descarrega: partilha-se. O `navigator.share` com
 * ficheiros manda as cinco imagens direitas para o Instagram, sem passarem
 * pela galeria. No computador, cada imagem tem o seu botão, porque os
 * browsers desconfiam de quem tenta descarregar cinco ficheiros seguidos e
 * bloqueiam o segundo em diante.
 */

const GUIAO = GUIOES.parceria;

export default function RedesSociais() {
  const toast = useToast();
  const [barbearia, setBarbearia] = useState(null);
  const [erro, setErro] = useState('');
  const [formato, setFormato] = useState(FORMATOS.feed);
  const [copiada, setCopiada] = useState(false);
  const [aDesenhar, setADesenhar] = useState(true);
  const telas = useRef([]);

  // ── Ler a barbearia e preparar o que o desenho precisa ──
  const carregar = useCallback(async () => {
    setADesenhar(true);
    setErro('');
    try {
      const b = await getBusiness();
      const tema = b?.theme || {};
      const cores = {
        bg: tema.colors?.bg || '#0A0807',
        gold: tema.colors?.gold || '#C9A227',
        text: tema.colors?.text || '#EDE8DF',
        textSec: tema.colors?.textSec || '#8A8272',
      };
      const fontes = {
        titulo: tema.fonts?.heading || 'Playfair Display',
        corpo: tema.fonts?.body || 'Inter',
      };
      await garantirFontes([fontes.titulo, fontes.corpo]);
      const logo = await carregarLogo(b?.logo_url);
      setBarbearia({
        nome: b?.name || 'A tua barbearia',
        endereco: b?.domain || (b?.slug ? `${b.slug}.${DOMINIO_BASE}` : 'a-tua-barbearia.' + DOMINIO_BASE),
        logo, cores, fontes,
        semLogo: !logo && !!b?.logo_url,
      });
    } catch (e) {
      setErro(e.message || 'Não foi possível ler os dados da barbearia.');
    } finally {
      setADesenhar(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // ── Desenhar, sempre que a barbearia ou o formato mudam ──
  useEffect(() => {
    if (!barbearia) return;
    GUIAO.ecras.forEach((ecra, i) => {
      const tela = telas.current[i];
      if (tela) desenhar(tela, ecra, barbearia, formato);
    });
  }, [barbearia, formato]);

  // ── Guardar ──
  const guardarUma = async (i) => {
    const blob = await paraBlob(telas.current[i]);
    if (!blob) { toast.error('Não deu', 'A imagem não pôde ser gerada.'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeDoFicheiro(barbearia, i, formato);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const podePartilhar = typeof navigator !== 'undefined' && !!navigator.canShare;

  const partilharTodas = async () => {
    try {
      const ficheiros = await Promise.all(GUIAO.ecras.map(async (_, i) => {
        const blob = await paraBlob(telas.current[i]);
        return new File([blob], nomeDoFicheiro(barbearia, i, formato), { type: 'image/png' });
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
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2000);
    } catch {
      toast.info('Copia à mão', 'O browser não deixou copiar sozinho.');
    }
  };

  return (
    <AdminPage
      title="Redes sociais"
      subtitle="O post que diz aos teus clientes que já podem marcar online"
      actions={<Button variant="secondary" onClick={carregar}><RefreshCw size={15} /> Voltar a desenhar</Button>}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {erro && <Card className="card-pad" style={{ borderColor: 'var(--danger)', marginBottom: 16 }}>{erro}</Card>}

      {/* ── O que é ── */}
      <Card className="card-pad" style={{ marginBottom: 16 }}>
        <div className="rs-cab">
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>{GUIAO.nome}</h3>
            <p className="text-sec text-sm" style={{ margin: '6px 0 0', maxWidth: '62ch', lineHeight: 1.6 }}>
              {GUIAO.resumo} As cores e o logótipo são os que puseste em <strong>O Meu Site</strong> — se mudares lá,
              muda aqui.
            </p>
          </div>
          <div className="chip-row" style={{ marginBottom: 0 }}>
            {Object.values(FORMATOS).map(f => (
              <button key={f.id} className={`chip ${formato.id === f.id ? 'active' : ''}`}
                onClick={() => setFormato(f)} title={f.descricao}>{f.nome}</button>
            ))}
          </div>
        </div>

        {barbearia?.semLogo && (
          <div className="rs-aviso">
            Não consegui usar o teu logótipo nestas imagens, por isso entrou a inicial do nome.
            Acontece quando o ficheiro está noutro sítio que não deixa reutilizá-lo. Volta a carregá-lo
            em <strong>O Meu Site</strong> e tenta outra vez.
          </div>
        )}

        <div className="rs-botoes">
          {podePartilhar && (
            <Button variant="primary" onClick={partilharTodas} disabled={!barbearia}>
              <Share2 size={16} /> Partilhar as 5 imagens
            </Button>
          )}
          <Button variant={podePartilhar ? 'secondary' : 'primary'} onClick={copiarLegenda} disabled={!barbearia}>
            {copiada ? <Check size={16} /> : <Copy size={16} />} {copiada ? 'Legenda copiada' : 'Copiar a legenda'}
          </Button>
        </div>
      </Card>

      {/* ── As imagens ── */}
      <div className="rs-grelha">
        {GUIAO.ecras.map((ecra, i) => (
          <Card key={i} className="rs-cartao">
            <div className="rs-tela" style={{ aspectRatio: `${formato.larg} / ${formato.alt}` }}>
              <canvas ref={el => { telas.current[i] = el; }} />
              {aDesenhar && <div className="rs-espera"><IcImagem size={22} /></div>}
            </div>
            <div className="rs-pe">
              <span className="text-sec text-xs">Imagem {i + 1} de {GUIAO.ecras.length}</span>
              <button className="btn btn-ghost" onClick={() => guardarUma(i)} disabled={!barbearia}
                style={{ fontSize: 13 }}>
                <Download size={15} /> Guardar
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* ── A legenda, à vista ── */}
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
.rs-cab { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.rs-botoes { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }

.rs-aviso {
  margin-top: 14px; padding: 11px 14px; border-radius: 10px; line-height: 1.55;
  background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25);
  font-size: 13px; color: var(--text-sec);
}

.rs-grelha { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.rs-cartao { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.rs-tela { position: relative; width: 100%; border-radius: 10px; overflow: hidden; background: var(--elevated); }
.rs-tela canvas { width: 100%; height: 100%; display: block; }
.rs-espera {
  position: absolute; inset: 0; display: grid; place-items: center;
  color: var(--text-sec); background: var(--elevated);
}
.rs-pe { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

.rs-legenda {
  margin: 0; padding: 14px 16px; border-radius: 10px; white-space: pre-wrap; word-break: break-word;
  background: var(--elevated); border: 1px solid var(--border);
  font-family: inherit; font-size: 13.5px; line-height: 1.65; color: var(--text);
}

@media (max-width: 520px) {
  .rs-grelha { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
