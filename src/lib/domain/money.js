// money.js — camada central de normalização monetária (euros, 2 casas).
// Princípio: o sistema continua a armazenar valores em euros (Number) para
// não alterar histórico existente (ver secção 46 do super prompt). Esta camada
// garante arredondamento determinístico (round2) e apresentação consistente
// de 2 casas decimais. Migração futura para cêntimos inteiros está documentada
// no relatório final e pode ser feita sem alterar os consumidores (apenas
// toCents/fromCents passam a ser usados no armazenamento).

const EUR_FMT = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Arredondamento determinístico a 2 casas (evita drift de vírgula flutuante).
export function round2(n) {
  if (n == null || isNaN(n)) return 0;
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Conversões para cêntimos (preparação para migração futura).
export function toCents(euros) { return Math.round((Number(euros) || 0) * 100); }
export function fromCents(cents) { return round2((Number(cents) || 0) / 100); }

// Formatação canónica: símbolo antes, 2 casas, vírgula decimal (PT-PT).
// Ex: 15 -> "€ 15,00" | 15.5 -> "€ 15,50" | 15.999 -> "€ 16,00"
export function formatMoney(n) {
  return '€ ' + EUR_FMT.format(round2(n));
}