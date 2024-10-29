import {relative} from 'node:path';

import ViteRestart from 'vite-plugin-restart';

import {deriveManifest} from './index.js';

async function createVirtualModules({manifest, meta}) {
  const virtualModules = {};
  return {
    name: 'sylvite-virtual-modules',
    async resolveId(id) {
      const resolved = '\0' + id;
      if (!(resolved in virtualModules) && id.startsWith('virtual:sylvite/')) {
        const entry = id.slice('virtual:sylvite/'.length);
        virtualModules[resolved] = {
          derived: await deriveManifest({
            entry,
            manifest,
            meta,
          }),
          entry,
        };
      }
      if (virtualModules[resolved]) {
        return resolved;
      }
    },
    load(resolved) {
      if (virtualModules[resolved]) {
        const {entry, derived} = virtualModules[resolved];
        return [
          'export const loaded = Object.fromEntries(await Promise.all([',
            Object.entries(derived).map(([path, {config, resolved}]) => ([
          '  new Promise((resolve) => {',
          `    resolve(import(${JSON.stringify(resolved)}).then((M) => (`,
          `      [${JSON.stringify(path)}, {config: ${JSON.stringify(config[entry] || {})}, M}]`,
          '    )));',
          '  }),',
            ].join('\n'))).join('\n'),
          ']));',
          '',
          "import {registerHooks} from 'sylvite/runtime';",
          'export const hooks = await registerHooks({',
          `  entry: ${JSON.stringify(entry)},`,
          '  loaded,',
          `  manifest: ${JSON.stringify({sylvite: manifest?.['sylvite'] ?? {}})},`,
          '});',
          '',
        ].join('\n');
      }
    },
  }
}

export async function implement({hooks, loaded, manifest, meta}) {
  const vmPlugin = await createVirtualModules({manifest, meta});
  hooks.tap('sylvite:viteConfig', (config) => ({
    ...config,
    plugins: [
      ...config.plugins ?? [],
      // restart the dev server on any build file change
      ViteRestart({
        restart: Object.values(loaded)
          .map(({resolved}) => relative(meta.dirname, resolved)),
      }),
      vmPlugin,
    ],
  }));
}

export function register({tapable: {SyncWaterfallHook}}) {
  return {
    viteConfig: new SyncWaterfallHook(['config']),
  };
}
