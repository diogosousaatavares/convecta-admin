/*
 * Dois clientes com o mesmo nome numa lista de escolher.
 *
 * A auditoria de 28/09/2026 encontrou dois "Diogo Tavares · 912381717"
 * iguais num dropdown: o mesmo nome E o mesmo telefone. Quem escolhe nao
 * tem como saber qual e qual, e a marcacao vai parar a ficha errada.
 *
 * A regra: se o nome se repete, junta-se a primeira coisa que os separa —
 * o telefone, depois o email, e no fim o inicio do id, que e sempre unico.
 * Quem nao tem nome repetido continua a aparecer so com o nome.
 */
export function nomeSemRepetir(lista, item, extraPreferido) {
  if (!item) return '';
  const nome = (item.name || '').trim();
  const iguais = (lista || []).filter(x => (x.name || '').trim().toLowerCase() === nome.toLowerCase());
  if (iguais.length <= 1) return nome;

  const candidatos = [extraPreferido, item.phone, item.email, item.role].filter(Boolean);
  for (const c of candidatos) {
    // So serve se separar mesmo: um telefone que os dois partilham nao separa.
    const partilham = iguais.filter(x => [x.phone, x.email, x.role].some(v => v === c)).length;
    if (partilham === 1) return `${nome} · ${c}`;
  }
  return `${nome} · ${String(item.id || '').slice(0, 4)}`;
}
