import * as tapable from 'tapable';

export async function registerHooks({entry, loaded, manifest, meta}) {
  const hooks = {};
  // register hooks
  await Promise.all(Object.entries(loaded).map(async ([path, spec]) => {
    if (!spec.M.register) {
      return;
    }
    const params = {
      config: spec.config[entry] || {},
      loaded,
      manifest,
      meta,
      path,
      tapable,
    }
    for (const [name, hook] of Object.entries(await spec.M.register(params))) {
      hooks[name] = hook;
    }
  }));
  await registerHookImplementations({
    entry,
    hooks,
    loaded,
    manifest,
    meta,
  });
  return hooks;
}

// smooth over hook origins
function wrapHook(path, hook) {
  const {tap, tapAsync, tapPromise} = hook;
  return {
    ...hook,
    tap: (fn) => {
      tap.call(hook, path, fn);
    },
    tapAsync: (fn) => {
      tapAsync.call(hook, path, fn);
    },
    tapPromise: (fn) => {
      tapPromise.call(hook, path, fn);
    },
  };
}

function stubHookImplementation(name, strategy) {
  switch (strategy) {
    case 'error': {
      return () => {
        throw new ReferenceError(`Implementation of missing hook '${name}'`);
      };
    }
    case 'warn': {
      return () => {
        console.warn(new ReferenceError(`Implementation of missing hook '${name}'`));
      };
    }
    default: return () => {};
  }
}

function wrapHookImplementations({hooks, manifest, path}) {
  const {missingHookStrategy} = manifest?.['sylvite'] ?? {};
  const wrapped = {};
  const proxy = new Proxy(hooks, {
    get(hooks, name) {
      if (name in hooks) {
        if (!wrapped[name]) {
          wrapped[name] = wrapHook(path, hooks[name]);
        }
      }
      else {
        if (!wrapped[name]) {
          wrapped[name] = {
            tap: stubHookImplementation(name, missingHookStrategy),
            tapAsync: stubHookImplementation(name, missingHookStrategy),
            tapPromise: stubHookImplementation(name, missingHookStrategy),
          };
        }
      }
      return wrapped[name];
    },
  });
  return proxy;
}

export async function registerHookImplementations({entry, hooks, loaded, manifest, meta}) {
  // register implementations
  await Promise.all(Object.entries(loaded).map(([path, spec]) => {
    if (!spec.M.implement) {
      return;
    }
    const params = {
      config: spec.config[entry] || {},
      hooks: wrapHookImplementations({hooks, manifest, path}),
      loaded,
      manifest,
      meta,
      path,
      tapable,
    }
    return spec.M.implement(params);
  }));
}
