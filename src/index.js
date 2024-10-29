import {basename, extname} from 'node:path';
import {access, constants} from 'node:fs/promises';

import {registerHooks} from './runtime.js';

export async function deriveManifest({entry, manifest, meta}) {
  const derived = {};
  await Promise.all(Object.entries({sylvite: {}, ...manifest}).map(async ([path, config]) => {
    try {
      let resolved = meta.resolve([path, entry].join('/'));
      if (!basename(resolved, extname(resolved)).endsWith(entry)) {
        return;
      }
      // obligatory?
      if (resolved.startsWith('file://')) {
        resolved = resolved.slice('file://'.length);
      }
      // assure it actually exists since meta.resolve doesn't do this as require.resolve used to
      try {
        await access(resolved, constants.R_OK);
      }
      catch (error) {
        // it also does not resolve necessary extensions
        await access(resolved + '.js', constants.R_OK);
        resolved += '.js';
      }
      derived[path] = {config, resolved};
    }
    catch (error) {
      if (![
        'ENOENT',
        'ENOTDIR',
        'ERR_MODULE_NOT_FOUND',
        'ERR_PACKAGE_PATH_NOT_EXPORTED',
      ].includes(error.code)) {
        throw error;
      }
    }
  }));
  return derived;
}

export default async function sylvite({entry = 'build', manifest, meta}) {
  const derived = await deriveManifest({
    entry,
    manifest,
    meta,
  });
  const loaded = {};
  await Promise.all(Object.entries(derived).map(async ([path, {config, resolved}]) => {
    loaded[path] = {
      c: config,
      i: {},
      resolved,
      // timestamp for cachebreaking
      M: await import([resolved, Date.now()].join('?')),
    };
  }));
  return {
    hooks: await registerHooks({entry, loaded, manifest, meta}),
    loaded,
  };
}
