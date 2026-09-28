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
  build: {
    rollupOptions: {
      output: {
        /*
         * O painel saia num unico ficheiro de 820 kB. As paginas ja eram
         * carregadas a pedido (React.lazy), mas tudo o que elas partilham —
         * o React, o cliente do Supabase, as animacoes, os icones — vinha
         * junto num bloco so. Resultado: quem abria o painel esperava pelo
         * bloco inteiro antes de ver a agenda, e bastava mudar uma linha do
         * nosso codigo para o browser ter de voltar a descarregar os 820 kB,
         * incluindo as bibliotecas que nao mudaram nada.
         *
         * Separadas, as bibliotecas ficam na cache do browser entre
         * publicacoes: a partir da segunda visita so desce o nosso codigo.
         *
         * O React e o router ficam JUNTOS de proposito. Separa-los da
         * problemas de ordem de arranque — o router chama o React antes de
         * ele existir — e o ecra fica branco sem erro nenhum.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router') || /node_modules[\\/]react(-dom)?[\\/]/.test(id) || id.includes('scheduler')) return 'react'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'animacoes'
          if (id.includes('lucide-react')) return 'icones'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'graficos'
          return 'outros'
        },
      },
    },
    // O aviso dos 500 kB deixa de disparar para os blocos de biblioteca, que
    // se descarregam uma vez e ficam. Continua a avisar de blocos maiores.
    chunkSizeWarningLimit: 700,
  },
})
