import {dirname, resolve} from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    ...process.env.LIB && ({
      lib: {
        entry: [
          resolve(__dirname, `src/${process.env.LIB}.js`),
        ],
        name: 'sylvite',
        fileName: process.env.LIB,
      },
      outDir: ['dist', dirname(process.env.LIB)].join('/'),
      ssr: !!process.env.SSR,
    }),
    sourcemap: true,
    target: 'esnext',
  },
});
