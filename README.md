![CI](https://github.com/cha0s/sylvite/actions/workflows/ci.yml/badge.svg)

# Sylvite 🧩

✨ Sylvite is a **radically-extensible** system that lets you register and implement hooks
to extend your Vite app to the stars and beyond ✨.

## Getting started 🪄

```
npm install sylvite
```

Sylvite hooks into your Vite build process. Initial setup involves hooking into your Vite plugins:

```javascript
import sylvite from 'sylvite';
import {defineConfig} from 'vite';

const {hooks} = await sylvite({
  manifest: {},
  meta: import.meta,
});

export default defineConfig({
  // ...
  plugins: hooks.call('vitePlugins', [
    // any other Vite plugins
  ]),
  // ...
});

```

By default, not much happens. The magic is what has just been enabled by the Sylvite plugin.

## Manifest and entries 🛠️

In the example above, we simply passed `{}` as the manifest. By default, this will only add
Sylvite core. This isn't exactly exciting. In order to do novel things, we need to add more to
our manifest.

Let's contrive an example. Say we have a file structure like this:

```
src
└─ coolio
   ├─ build.js
   └─ client.js
```

We could add `src/coolio` to our manifest:

```javascript
const {hooks} = await sylvite({
  manifest: {
    './src/coolio': {},
  },
  meta: import.meta,
});
```

This will pull in any entry modules under this path.

The default (and at this point, only) entry is `'build'`. This means `src/coolio/build` will be
imported and its hook registrations and implementations executed.

So far we can add modules to the manifest that implement a `'build'` entry, but we're still in node
land here in `vite.config.js`. Why did we even add a Vite plugin? I'm glad you asked!

## Runtime (virtual modules) 🤩

Once Vite starts compiling, we are in **runtime**. In runtime, arbitrary entries may be created.
That means you can create as many as you want and call them pretty much whatever you want.

For example, let's say we wanted to have a `'client'` entry that registers, implements, and invokes
hooks in our client-side JS. To do this, all we have to do is import a virtual module following
a simple naming convention:

```javascript
import {hooks} from 'virtual:sylvite/client';

hooks.call('coolio:forExampleClientInitialize', window || 'whatever');
```

Your virtual module exports the following named exports:

```javascript
{
  hooks,  // all registered hooks
  loaded, // the manifest modules for this entry
}
```

The virtual module naming convention is simply `virtual:sylvite/${YOUR_ENTRY}`. Upon import, a
[virtual module](https://vite.dev/guide/api-plugin.html#virtual-modules-convention) is created if
it does not already exist.

The virtual module will automatically discover all entries that exist in any modules in your
manifest. So in our example above, this import will now import `src/coolio/client` and handle all
of *its* hooks. Sweet!

## Hooks 🪝

The hook system is implemented using [tapable](https://github.com/webpack/tapable).

### Registration

Hooks are registered by exporting a `register` function from your entry:

```javascript
export function register({tapable: {SyncHook}}) {
  return {
    forExampleClientInitialize: new SyncHook(['window']),
  };
}
```

The following context is passed to your `register` function:

```javascript
{
  config,   // the manifest configuration for this entry
  loaded,   // the manifest modules for this entry
  manifest, // the entire manifest
  meta,     // the meta passed in, if any
  path,     // the manifest path (the key in the manifest file)
  tapable,  // tapable, so you don't have to import it yourself
}
```

### Implementation

Hooks are implemented by exporting an `implement` function from your entry:

```javascript
export function implement({hooks}) {
  hooks.tap('coolio:forExampleClientInitialize', (window) => {
    window.alert('hello world!');
  });
}
```

The following context is passed to your `implement` function:

```javascript
{
  config,   // the manifest configuration for this entry
  hooks,    // all registered hooks
  loaded,   // the manifest modules for this entry
  manifest, // the entire manifest
  meta,     // the meta passed in, if any
  path,     // the manifest path (the key in the manifest file)
  tapable,  // tapable, so you don't have to import it yourself
}
```

#### Ordering

Hooks can be ordered before or other implementations by using `.before()` and `.after()`:

```javascript
export function implement({hooks}) {
  hooks.before('sylvite').tap('coolio:forExampleClientInitialize', (window) => {
    window.alert('hello world!');
  });
}
```

That hook will run before any implemented by `'sylvite'`.

#### Stubbing

By default, Sylvite will silently ignore e.g.:

```javascript
export function implement({hooks}) {
  hooks.tap('thisHookDoesNotExist', (window) => {
    // ...
  });
}
```

This may be configured in your manifest if you desire more stringent reporting:

```javascript
const {hooks} = await sylvite({
  manifest: {
    'sylvite': {
      missingHookStrategy: 'ignore' | 'warn' | 'error',
    },
  },
  meta: import.meta,
});
```

The default is `'ignore'` if unspecified. `'warn'` will `console.warn` an error where
the missing hook implementation was referenced. `'error'` will throw the error instead.

## Restart 🎶

When any `'build'` entry file changes, the Vite dev server will restart automatically.

## Q/A 💬

### Why no TypeScript support?

This library is super duper dangerous. Stay safe; don't use it!

### Why do I have to pass in `import.meta`?

`import.meta` is used to resolve entries and relative paths. You could theoretically pass in any
object that implemented `dirname` and `resolve`, though I don't know why you'd want to.

### How absolutely dare you!/Who would do such a thing?

😂

I'm experimenting with configuring e.g. entire remix route trees using this. It should be possible
to package up an entire self-contained feature such as user accounts as a module that can simply be
added to your app's manifest to fully implement the feature in your app.

I'm also experimenting with using this as a game modding platform.

Also, I just love taking extensibility to its absurd conclusion. We are using a dynamic
programming language, *remember*?
