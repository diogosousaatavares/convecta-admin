# Convecta — painel do negócio (admin)

Regras de design que o Diogo pediu e que valem para TUDO o que se mexe ou
acrescenta aqui. Não são sugestões.

1. **Botões de ação do mesmo tamanho.** Numa fila de botões (detalhe da
   marcação, rodapé de janela, ficha) cada botão tem a mesma largura, seja
   qual for o texto. CSS: `.ag-detail-actions`, `.modal-foot`,
   `.botoes-iguais` (grid de colunas iguais). Nunca três tamanhos diferentes.
2. **Sem frases por baixo dos títulos.** Nem subtítulos, nem «texto pequeno»
   a explicar. O título diz por si; se precisar de ajuda, vai para o (i) do
   PageInfo.
3. **Sem blocos brancos à toa.** Definições, notificações, parâmetros são
   linhas com separador direto na página (`.nt-lista` / `.nt-row`), não
   cartões dentro de cartões.
4. **Listas à Fresha.** Uma linha por coisa: foto/avatar, nome, uma linha
   secundária, o número que interessa à direita, seta. Tocar abre a ficha
   com o detalhe (`.lin`, `.prod-row`, `.ag-lista-row`). Tabelas só no
   computador, e só quando mesmo precisas.
5. **Nada parte em duas linhas.** Horas, preços, nomes: `white-space:
   nowrap` + ellipsis. Um «09:0 / 0» é bug, não é layout.
6. **Telemóvel = app.** Sem «Atualizar» (puxar para baixo atualiza); botões
   da página a largura toda; a barra de baixo esconde-se quando há uma
   janela aberta; secções em lista, «Mais» em caixas.
7. **Nunca tirar funcionalidade.** Reorganizar, esconder, simplificar — sim.
   Apagar — não.
8. **Founder recebe a app como está.** Sem desenvolvimento à medida.

Builds: `npm run build`. Commits em português, com o porquê no corpo.
