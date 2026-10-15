import React from 'react';
import { useLocation } from 'react-router-dom';
import Ajuda from '@/components/admin/Ajuda';
import { ajudaDe } from '@/lib/ajudaPaginas';

/*
 * O (i) DA PÁGINA (15/10/2026).
 *
 * As caixas amarelas de explicação saíram a 28/09 — eram texto para quem
 * construiu o painel. Isto é o contrário: um (i) ao lado do título que abre,
 * numa janela, três frases escritas para o barbeiro (src/lib/ajudaPaginas.js).
 * Sem texto na página; a ajuda está a um toque para quem a quiser.
 *
 * As props antigas (description, impact, links, page) são aceites e
 * ignoradas: o texto vem sempre do endereço.
 */
export default function PageInfo() {
  const { pathname } = useLocation();
  const a = ajudaDe(pathname);
  if (!a) return null;
  return <Ajuda titulo={a.titulo} texto={a.texto.split('\n\n').map((p, i) => <p key={i}>{p}</p>)} />;
}
