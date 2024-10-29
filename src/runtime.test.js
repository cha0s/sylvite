import {expect, test, vi} from 'vitest';

import {registerHooks} from './runtime.js';

test('configures missing hook behavior', async () => {
  let implemented = false;
  await registerHooks({
    loaded: {
      qwertyuiop: {
        c: {},
        M: {
          implement({hooks}) {
            hooks.tap('poiuytrewq', () => {});
            implemented = true;
          },
        },
      },
    },
  });
  expect(implemented).to.be.true;
  // warn
  const consoleMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  await registerHooks({
    loaded: {
      qwertyuiop: {
        c: {},
        M: {
          implement({hooks}) {
            hooks.tap('poiuytrewq', () => {});
          },
        },
      },
    },
    manifest: {
      sylvite: {
        missingHookStrategy: 'warn',
      },
    },
  });
  expect(consoleMock).toHaveBeenCalledOnce();
  consoleMock.mockReset();
  // error
  expect(async () => {
    await registerHooks({
      loaded: {
        qwertyuiop: {
          c: {},
          M: {
            implement({hooks}) {
              hooks.tap('poiuytrewq', () => {});
            },
          },
        },
      },
      manifest: {
        sylvite: {
          missingHookStrategy: 'error',
        },
      },
    });
  }).to.throw;
});

test('passes entry slice of config', async () => {
  const slice = [];
  await registerHooks({
    entry: 'poiuytrewq',
    loaded: {
      qwertyuiop: {
        c: {
          poiuytrewq: {zxcvbnm: 'mnbvcxz'},
        },
        M: {
          implement({config}) {
            slice.push(config.zxcvbnm);
          },
          register({config}) {
            slice.push(config.zxcvbnm);
            return {};
          },
        },
      },
    },
  });
  expect(slice).to.deep.equal(['mnbvcxz', 'mnbvcxz']);
});

test('calls single implementation', async () => {
  let invoked = false;
  const hooks = await registerHooks({
    loaded: {
      qwertyuiop: {
        c: {},
        i: {},
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', (value) => {
              invoked = value;
            });
          },
          register({tapable: {SyncHook}}) {
            return {
              poiuytrewq: new SyncHook(),
            };
          },
        },
      },
    },
    manifest: {},
  });
  hooks.callSingle('qwertyuiop:poiuytrewq', 'qwertyuiop', true);
  expect(invoked).to.be.true;
});
