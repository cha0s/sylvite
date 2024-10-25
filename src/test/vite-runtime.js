import {resolve} from 'node:path';

import sylvite from '../index.js';

const {hooks} = await sylvite({
  manifest: {
    [import.meta.dirname]: {},
    [resolve(import.meta.dirname, '..')]: {},
  },
  meta: import.meta,
});

import {build} from 'vite';

await build({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'runtime.js'),
      formats: ['es'],
      name: 'sylvite-runtime-test',
    },
    outDir: resolve(import.meta.dirname, 'dist'),
    ssr: true,
    target: 'esnext',
  },
  logLevel: 'silent',
  plugins: hooks.vitePlugins.call([]),
  resolve: {
    alias: {
      'sylvite/runtime': resolve(import.meta.dirname, '..', 'runtime.js'),
    },
  },
  ssr: {
    external: true,
  },
});
