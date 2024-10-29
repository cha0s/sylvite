import * as tapable from 'tapable';

function stubHookInvocation(type, name, strategy) {
  switch (strategy) {
    case 'error': {
      throw new ReferenceError(`Invocation of '${type}' on missing hook '${name}'`);
    }
    case 'warn': {
      console.warn(new ReferenceError(`Invocation of '${type}' on missing hook '${name}'`));
    }
  }
}

export async function registerHooks({entry, loaded, manifest, meta}) {
  const {missingHookStrategy} = manifest?.['sylvite'] ?? {};
  const hooks = {};
  // register hooks
  await Promise.all(Object.entries(loaded).map(async ([path, spec]) => {
    if (!spec.M.register) {
      return;
    }
    const params = {
      config: spec.c[entry] || {},
      loaded,
      manifest,
      meta,
      path,
      tapable,
    }
    for (const [name, hook] of Object.entries(await spec.M.register(params))) {
      hooks[[path, name].join(':')] = hook;
    }
  }));
  await registerHookImplementations({
    entry,
    hooks,
    loaded,
    manifest,
    meta,
  });
  return {
    call: (name, ...args) => {
      if (!hooks[name]) {
        stubHookInvocation('call', name, missingHookStrategy);
        return;
      }
      return hooks[name].call(...args);
    },
    callAsync: (name, ...args) => {
      if (!hooks[name]) {
        stubHookInvocation('callAsync', name, missingHookStrategy);
        return;
      }
      return hooks[name].callAsync(...args);
    },
    callSingle: (name, path, ...args) => {
      if (!loaded[path]?.i[name]) {
        stubHookInvocation('callSingle', name, missingHookStrategy);
        return;
      }
      return loaded[path].i[name](...args);
    },
    promise: (name, ...args) => {
      if (!hooks[name]) {
        stubHookInvocation('promise', name, missingHookStrategy);
        return Promise.resolve();
      }
      return hooks[name].promise(...args);
    },
  }
}

function stubHookImplementation(type, name, strategy) {
  switch (strategy) {
    case 'error': {
      throw new ReferenceError(`Implementation of '${type}' on missing hook '${name}'`);
    }
    case 'warn': {
      console.warn(new ReferenceError(`Implementation of '${type}' on missing hook '${name}'`));
    }
  }
}

function wrapHookImplementations({hooks, i, manifest, path}) {
  const {missingHookStrategy} = manifest?.['sylvite'] ?? {};
  return {
    intercept: (name, interceptor) => {
      if (!hooks[name]) {
        stubHookImplementation('intercept', name, missingHookStrategy);
        return;
      }
      hooks[name].intercept(interceptor);
    },
    tap: (name, fn) => {
      if (!hooks[name]) {
        stubHookImplementation('tap', name, missingHookStrategy);
        return;
      }
      i[name] = fn;
      hooks[name].tap(path, fn);
    },
    tapAsync: (name, fn) => {
      if (!hooks[name]) {
        stubHookImplementation('tapAsync', name, missingHookStrategy);
        return;
      }
      i[name] = fn;
      hooks[name].tapAsync(path, fn);
    },
    tapPromise: (name, fn) => {
      if (!hooks[name]) {
        stubHookImplementation('tapPromise', name, missingHookStrategy);
        return;
      }
      i[name] = fn;
      hooks[name].tapPromise(path, fn);
    },
  };
}

export async function registerHookImplementations({entry, hooks, loaded, manifest, meta}) {
  // register implementations
  await Promise.all(Object.entries(loaded).map(([path, spec]) => {
    if (!spec.M.implement) {
      return;
    }
    const params = {
      config: spec.c[entry] || {},
      hooks: wrapHookImplementations({hooks, i: spec.i, manifest, path}),
      loaded,
      manifest,
      meta,
      path,
      tapable,
    }
    return spec.M.implement(params);
  }));
}
