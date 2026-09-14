import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import * as esbuild from 'esbuild';
import path from 'path';
const raiz = process.cwd();
const mapa = {
  '@/components/AdminLayout': '_to_delete/prova/al.jsx',
  '@/hooks/useStore': '_to_delete/prova/us.js',
  '@/lib/designService': '_to_delete/prova/stubs.js',
};
await esbuild.build({
  entryPoints: ['_to_delete/prova/entrada.jsx'],
  bundle: true, outfile: '_to_delete/prova/app.js', format: 'iife',
  loader: { '.jsx': 'jsx', '.png': 'dataurl', '.svg': 'dataurl', '.css': 'css' },
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name:'alias', setup(b){
    b.onResolve({ filter: /^@\// }, a => {
      if (mapa[a.path]) return { path: path.resolve(raiz, mapa[a.path]) };
      const base = path.resolve(raiz, 'src', a.path.slice(2));
      const fs = require('node:fs');
      for (const ext of ['', '.jsx', '.js', '/index.jsx', '/index.js']) {
        if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return { path: base + ext };
      }
      return { path: base };
    });
  }}],
});
console.log('bundle ok');
