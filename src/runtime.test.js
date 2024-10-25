import {expect, test, vi} from 'vitest';

import {registerHooks} from './runtime.js';

test('configures missing hook behavior', async () => {
  let implemented = false;
  await registerHooks({
    loaded: {
      qwertyuiop: {
        config: {},
        M: {
          implement({hooks}) {
            hooks.poiuytrewq.tap(() => {});
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
        config: {},
        M: {
          implement({hooks}) {
            hooks.poiuytrewq.tap(() => {});
          },
        },
      },
      sylvite: {
        config: {missingHookStrategy: 'warn'},
        M: {},
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
          config: {},
          M: {
            implement({hooks}) {
              hooks.poiuytrewq.tap(() => {});
            },
          },
        },
        sylvite: {
          config: {missingHookStrategy: 'error'},
          M: {},
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
        config: {
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
