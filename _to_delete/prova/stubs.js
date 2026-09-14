const memoria = { settings: {} };
export const DOMINIO_BASE='marcacoes.app';
export const LIMITE_GALERIA=12;
export async function getBusiness(){ return { id:'demo-1', name:'RastaVillage', slug:'rastavillage', settings: memoria.settings }; }
export async function updateBusiness(_id, f){ Object.assign(memoria, f); console.log('[prova] guardado', Object.keys(f)); }
export async function uploadBusinessAsset(){ return 'https://exemplo/imagem.jpg'; }
export async function listGallery(){ return []; }
export async function addGalleryPhoto(){ return {id:'1'}; }
export async function updateGalleryPhoto(){}
export async function deleteGalleryPhoto(){}
export async function moveGalleryPhoto(){}
