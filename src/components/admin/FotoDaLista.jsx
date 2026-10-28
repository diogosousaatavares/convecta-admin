import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Avatar } from '@/components/ui';
import dataService, { uploadProfessionalPhoto } from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

/*
 * A FOTO NA LISTA DOS PROFISSIONAIS — 28/10/2026, pedido do Diogo.
 *
 * «Nos barbeiros, quando aparece foto, tem que aparecer uma cena para poder
 * arrastar a foto e inseri-la lá.» Arrasta-se a imagem para cima da cara do
 * barbeiro (ou toca-se nela para escolher) e fica logo gravada, sem abrir a
 * ficha. O corte com zoom continua a existir na ficha (FotoPerfil); aqui é
 * o atalho: a foto fica reduzida e ao centro, como vem.
 */
export default function FotoDaLista({ pro, grande = false }) {
  const toast = useToast();
  const [sobre, setSobre] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const input = useRef(null);
  const tam = grande ? 64 : 56;

  const enviar = async file => {
    if (!file) return;
    if (!/^image\//.test(file.type || '')) { toast.error('Isso não é uma imagem'); return; }
    setAEnviar(true);
    try {
      const url = await uploadProfessionalPhoto(pro.id, file);
      // Um «?v=» para o navegador não mostrar a foto antiga com o mesmo nome.
      await dataService.updateProfessional(pro.id, { photoUrl: `${url.split('?')[0]}?v=${Date.now()}` });
      toast.success('Foto guardada', pro.name);
    } catch (e) { toast.error('Não foi possível guardar a foto', e.message); }
    finally { setAEnviar(false); }
  };

  return (
    <>
      <div
        role="button" tabIndex={0} title={pro.photoUrl ? 'Arrasta outra foto para aqui, ou toca para trocar' : 'Arrasta a foto para aqui, ou toca para escolher'}
        aria-label={`Foto de ${pro.name}`}
        onClick={() => input.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
        onDragOver={e => { e.preventDefault(); setSobre(true); }}
        onDragLeave={() => setSobre(false)}
        onDrop={e => { e.preventDefault(); setSobre(false); enviar(e.dataTransfer.files?.[0]); }}
        style={{ position: 'relative', width: tam, height: tam, flexShrink: 0, borderRadius: '50%', cursor: 'pointer',
          outline: sobre ? '2px dashed var(--gold)' : 'none', outlineOffset: 3, transition: 'outline-color .15s' }}>
        {pro.photoUrl
          ? <img className="professional-photo" src={pro.photoUrl} alt={`Fotografia de ${pro.name}`} style={{ width: tam, height: tam, opacity: aEnviar || sobre ? .45 : 1 }} />
          : <Avatar name={pro.name} size={grande ? 'lg' : undefined} />}
        {(sobre || aEnviar || !pro.photoUrl) && (
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', pointerEvents: 'none',
            background: sobre ? 'rgba(var(--gold-rgb),0.35)' : !pro.photoUrl ? 'transparent' : 'rgba(0,0,0,.35)', color: '#fff' }}>
            {aEnviar
              ? <span style={{ fontSize: 10, fontWeight: 700 }}>…</span>
              : !pro.photoUrl && !sobre
                ? <span style={{ position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--gold)', color: '#000', border: '2px solid var(--surface)' }}><Upload size={11} /></span>
                : <Upload size={18} />}
          </span>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; enviar(f); }} />
    </>
  );
}
