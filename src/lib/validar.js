/*
 * As tres verificacoes que faltavam em todo o painel.
 *
 * A auditoria de 28/09/2026 encontrou um fornecedor gravado com o email
 * "emailinvalido" e criou um cliente com o email "naoeemail" e o telefone
 * "abc" — nenhum dos dois formularios verificava nada. Um email torto nao
 * da erro nenhum: da uma marcacao que nunca chega ao cliente, e ninguem
 * descobre porque o painel fica calado.
 *
 * Vazio passa sempre. Nem toda a gente tem email, e obrigar a inventar um
 * e pior do que nao ter nenhum.
 */

export function emailTorto(valor) {
  const v = (valor || '').trim();
  if (!v) return false;
  return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

// Um numero portugues tem nove digitos. Aceita-se o indicativo, os espacos
// e os tracos que as pessoas escrevem — o que nao se aceita sao letras.
export function telefoneTorto(valor) {
  const v = (valor || '').trim();
  if (!v) return false;
  const limpo = v.replace(/[\s.()-]/g, '');
  if (!/^\+?\d+$/.test(limpo)) return true;
  return limpo.replace(/\D/g, '').length < 9;
}
