import {resolve} from 'node:path';

import sylvite from '../index.js';

const {hooks} = await sylvite({
  manifest: {
    sylvite: {
      // eslint-disable-next-line no-undef
      missingHookStrategy: process.env.MISSING_HOOK_STRATEGY,
    },
    test: {},
  },
  meta: {
    dirname: import.meta.dirname,
    resolve: (path) => {
      if ('test/asdfghjkl' === path) {
        return resolve(import.meta.dirname, 'asdfghjkl.js');
      }
      if ('sylvite/build' === path) {
        return resolve(import.meta.dirname, '..', 'build.js');
      }
      return import.meta.resolve(path);
    },
  },
});

import {build} from 'vite';

await build(hooks.call('sylvite:viteConfig', {
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
  resolve: {
    alias: {
      'sylvite/runtime': resolve(import.meta.dirname, '..', 'runtime.js'),
    },
  },
  ssr: {
    external: true,
  },
}));
