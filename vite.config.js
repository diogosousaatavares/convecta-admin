import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  /*
   * AQUI ESTEVE UM manualChunks, E PARTIU O PAINEL EM PRODUCAO — 28/09/2026.
   *
   * A ideia era separar as bibliotecas (react, supabase, icones, graficos)
   * em blocos proprios, para ficarem na cache do browser entre publicacoes.
   * O build passou, o tamanho melhorou, e o painel abriu em branco:
   *
   *   TypeError: Cannot read properties of undefined (reading 'PureComponent')
   *
   * Um bloco corria antes do bloco do React existir. Partir os blocos a mao
   * obriga a acertar a ordem de arranque entre eles, e basta uma biblioteca
   * que toque no React enquanto carrega para o ecra ficar branco — sem erro
   * nenhum no build, e so se ve no browser.
   *
   * O Rollup, sozinho, ja poe cada pagina no seu ficheiro (React.lazy) e
   * acerta a ordem. Fica com ele.
   *
   * As outras poupancas do mesmo dia nao dependiam disto e ficam: fora o
   * framer-motion, o react-query e o Toaster do shadcn.
   *
   * Para voltar a tentar: nao se acerta isto a olho. Mede-se com o
   * rollup-plugin-visualizer, testa-se a PRE-VISUALIZACAO no browser antes
   * de juntar ao main, e o que se ve e o painel a abrir — nao o build a
   * passar. O build passou, e o painel estava em baixo.
   */
})
