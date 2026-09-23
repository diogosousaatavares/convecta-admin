// stock.js — o estado de um produto, igual em todos os ecrãs.
// Esgotado: 0 ou menos. Baixo: acima de 0 e até ao mínimo. OK: o resto.
export function estadoStock(p) {
  const s = Number(p?.stock) || 0;
  if (s <= 0) return 'esgotado';
  if (s <= (Number(p?.minStock) || 0)) return 'baixo';
  return 'ok';
}
export const produtosEsgotados = (produtos = []) => produtos.filter(p => p.isActive !== false && estadoStock(p) === 'esgotado');
export const produtosStockBaixo = (produtos = []) => produtos.filter(p => p.isActive !== false && estadoStock(p) === 'baixo');
