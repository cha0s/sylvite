import * as tapable from 'tapable';

import Digraph from './digraph.js';

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
  const registry = await registerHookImplementations({
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
        return args[0];
      }
      return hooks[name].call(...args);
    },
    callAsync: (name, ...args) => {
      if (!hooks[name]) {
        stubHookInvocation('callAsync', name, missingHookStrategy);
        args[args.length - 1]();
        return;
      }
      return hooks[name].callAsync(...args);
    },
    callSingle: (name, path, ...args) => {
      if (!registry[name]?.[path]) {
        stubHookInvocation('callSingle', name, missingHookStrategy);
        return;
      }
      return registry[name][path][1](...args);
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

function wrapHookImplementations({graphs, hooks, manifest, path, registry}) {
  const {missingHookStrategy} = manifest?.['sylvite'] ?? {};
  return {
    $$after: [],
    $$before: [],
    after(...dependendents) {
      this.$$after.push(...dependendents);
      return this;
    },
    before(...dependencies) {
      this.$$before.push(...dependencies);
      return this;
    },
    intercept(name, fn) {
      if (!hooks[name]) {
        stubHookImplementation('intercept', name, missingHookStrategy);
        return;
      }
      this.register(name, 'intercept', fn);
    },
    register(name, type, fn) {
      if (!graphs[name]) {
        graphs[name] = new Digraph();
      }
      graphs[name].ensureTail(path);
      for (const dependendent of this.$$after) {
        graphs[name].addDependency(dependendent, path);
      }
      for (const dependency of this.$$before) {
        graphs[name].addDependency(path, dependency);
      }
      if (!registry[name]) {
        registry[name] = {};
      }
      registry[name][path] = [type, fn];
    },
    tap(name, fn) {
      if (!hooks[name]) {
        stubHookImplementation('tap', name, missingHookStrategy);
        return;
      }
      this.register(name, 'tap', fn);
    },
    tapAsync(name, fn) {
      if (!hooks[name]) {
        stubHookImplementation('tapAsync', name, missingHookStrategy);
        return;
      }
      this.register(name, 'tapAsync', fn);
    },
    tapPromise(name, fn) {
      if (!hooks[name]) {
        stubHookImplementation('tapPromise', name, missingHookStrategy);
        return;
      }
      this.register(name, 'tapPromise', fn);
    },
  };
}

export async function registerHookImplementations({entry = 'build', hooks, loaded, manifest, meta}) {
  const graphs = {};
  const registry = {};
  await Promise.all(Object.entries(loaded).map(([path, spec]) => {
    if (!spec.M.implement) {
      return;
    }
    const params = {
      config: spec.c[entry] || {},
      hooks: wrapHookImplementations({graphs, hooks, manifest, path, registry}),
      loaded,
      manifest,
      meta,
      path,
      tapable,
    }
    return spec.M.implement(params);
  }));
  for (const name in registry) {
    for (const path of graphs[name].sort()) {
      const [type, fn] = registry[name][path];
      hooks[name][type](path, fn);
    }
  }
  return registry;
}
