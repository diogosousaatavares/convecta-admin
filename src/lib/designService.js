/**
 * Os dados da pagina "O Meu Site", dentro do painel da barbearia.
 *
 * E o mesmo trabalho que o super admin ja fazia por fora, so que agora quem o
 * faz e o dono da barbearia, e so na barbearia dele. Todas as funcoes daqui
 * trabalham sobre idDaBarbearia(): nao ha forma de tocar noutra casa.
 *
 * Nota importante: o updateBusiness do super admin nao confirmava a escrita.
 * Aqui confirma — pede a linha de volta. Se as permissoes barrarem a gravacao,
 * isto rebenta com um erro em vez de dizer "guardado" e nao guardar nada.
 */
import { supabase } from '@/lib/supabase';
import dataService from '@/lib/dataService';

/** O id da barbearia de quem esta a usar o painel. Tudo aqui e ancorado nele. */
function idDaBarbearia() {
  const id = dataService.getState()?.business?.id;
  if (!id) throw new Error('Barbearia não identificada. Recarrega a página.');
  return id;
}

export const DOMINIO_BASE = import.meta.env.VITE_BASE_DOMAIN || 'marcacoes.app';
export const LIMITE_GALERIA = 12;

/** Encolhe a imagem antes de a enviar: poupa dados ao dono e ao cliente. */
export async function reduzirImagem(file, ladoMaximo = 1400, qualidade = 0.82) {
  if (!file.type?.startsWith('image/') || file.type === 'image/svg+xml') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && file.size < 400 * 1024) { bitmap.close?.(); return file; }
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = largura; canvas.height = altura;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', qualidade));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/*
 * Encolhe a imagem até caber num tamanho, em vez de a recusar.
 *
 * ── Porque é que isto existe ─────────────────────────────────────────────
 *
 * O ícone tinha um limite de 1 MB e, acima disso, uma mensagem a dizer que
 * não dava. Só que a fotografia que um barbeiro tira ao logótipo com o
 * telemóvel tem quatro ou cinco megabytes — e a pessoa fica parada num ecrã
 * que lhe diz o que está mal sem lhe dizer como se resolve. A saída é ir
 * procurar um site de comprimir imagens, e a maior parte não vai: desiste
 * do ícone.
 *
 * Recusar é fácil de programar e caro de usar. O trabalho é sempre o mesmo —
 * encolher — e a máquina fá-lo em meio segundo.
 *
 * ── Como se encolhe ──────────────────────────────────────────────────────
 *
 * Primeiro baixa-se a qualidade, que é quase de graça em termos de aspecto;
 * só depois se baixa o tamanho em pixéis, que é o que se nota. Entre cada
 * tentativa mede-se o resultado de verdade, em vez de adivinhar: a mesma
 * qualidade dá ficheiros muito diferentes conforme a fotografia.
 *
 * Um PNG com transparência é convertido para JPEG no caminho — um logótipo
 * recortado ficaria com fundo branco. Por isso, quando há transparência,
 * mantém-se PNG e só se encolhe o tamanho.
 */
export async function reduzirParaTamanho(file, limiteBytes = 1024 * 1024) {
  if (!file?.type?.startsWith('image/') || file.type === 'image/svg+xml') return file;
  if (file.size <= limiteBytes) return file;

  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { return file; }   // formato que o browser não abre: segue como veio

  const comTransparencia = file.type === 'image/png' || file.type === 'image/webp';
  const tipo = comTransparencia ? 'image/png' : 'image/jpeg';

  const desenhar = (lado) => {
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  };
  const paraBlob = (canvas, q) => new Promise(r => canvas.toBlob(r, tipo, q));

  let melhor = null;
  // Lados e qualidades do mais generoso para o mais apertado. Pára no
  // primeiro que caiba — o resto não chega a correr.
  for (const lado of [1024, 768, 512, 384, 256]) {
    const canvas = desenhar(lado);
    for (const q of comTransparencia ? [undefined] : [0.86, 0.72, 0.58, 0.45]) {
      const blob = await paraBlob(canvas, q);
      if (!blob) continue;
      melhor = blob;
      if (blob.size <= limiteBytes) {
        bitmap.close?.();
        const ext = tipo === 'image/png' ? 'png' : 'jpg';
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: tipo });
      }
    }
  }

  bitmap.close?.();
  // Nem no mais apertado coube: devolve-se o melhor que se conseguiu, e
  // quem chamou decide. Devolver o original seria garantir a falha.
  if (melhor && melhor.size < file.size) {
    const ext = tipo === 'image/png' ? 'png' : 'jpg';
    return new File([melhor], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: tipo });
  }
  return file;
}

/** «4,2 MB», «380 KB» — para se poder dizer à pessoa o que aconteceu. */
export function tamanhoLegivel(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  return Math.max(1, Math.round(n / 1024)) + ' KB';
}

export async function getBusiness() {
  const { data, error } = await supabase
    .from('businesses').select('*').eq('id', idDaBarbearia()).single();
  if (error) throw new Error(error.message);
  return data;
}

// A barbearia pela vista pública (só o que o site do cliente já mostra). É o
// que a demonstração da personalização usa: não precisa de sessão e não
// consegue gravar nada.
export async function getBusinessPublico({ id, slug } = {}) {
  let q = supabase.from('businesses_public').select('*');
  q = id ? q.eq('id', id) : q.eq('slug', slug);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateBusiness(_id, fields) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', idDaBarbearia())
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('A gravação não foi aceite pela base de dados.');
}

export async function uploadBusinessAsset(_businessId, file, nome = 'asset') {
  file = await reduzirImagem(file, nome === 'capa' ? 1800 : 1400);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${idDaBarbearia()}/${nome}.${ext}`;
  const { error } = await supabase.storage
    .from('business-logos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path);
  return data.publicUrl + '?t=' + Date.now();
}

// ── Galeria ────────────────────────────────────────────────────────────────
export async function listGallery() {
  const { data, error } = await supabase
    .from('gallery').select('*')
    .eq('business_id', idDaBarbearia())
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addGalleryPhoto(_businessId, file, caption = '') {
  const jaLa = await listGallery();
  if (jaLa.length >= LIMITE_GALERIA) {
    throw new Error(`A galeria já tem ${LIMITE_GALERIA} fotos. Apaga uma para acrescentar outra.`);
  }
  const url = await uploadBusinessAsset(idDaBarbearia(), file, `galeria-${Date.now()}`);
  const ultima = jaLa.length ? Math.max(...jaLa.map(g => g.sort_order || 0)) : -1;
  const { data, error } = await supabase
    .from('gallery')
    .insert({ business_id: idDaBarbearia(), image_url: url, caption, sort_order: ultima + 1 })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGalleryPhoto(id, fields) {
  const { error } = await supabase.from('gallery').update(fields).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteGalleryPhoto(id) {
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function moveGalleryPhoto(_businessId, id, direccao) {
  const fotos = await listGallery();
  const i = fotos.findIndex(f => f.id === id);
  const j = i + (direccao === 'cima' ? -1 : 1);
  if (i < 0 || j < 0 || j >= fotos.length) return;
  await updateGalleryPhoto(fotos[i].id, { sort_order: j });
  await updateGalleryPhoto(fotos[j].id, { sort_order: i });
}
