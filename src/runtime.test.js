import {expect, test, vi} from 'vitest';

import {registerHooks} from './runtime.js';

function fakeRegistration(registration) {
  return {
    c: {},
    ...registration,
  };
}

test('configures missing hook behavior', async () => {
  let implemented = false;
  await registerHooks({
    loaded: {
      qwertyuiop: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('poiuytrewq', () => {});
            implemented = true;
          },
        },
      }),
    },
    manifest: {},
  });
  expect(implemented).to.be.true;
  // warn
  const consoleMock = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  await registerHooks({
    loaded: {
      qwertyuiop: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('poiuytrewq', () => {});
          },
        },
      }),
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
        qwertyuiop: fakeRegistration({
          M: {
            implement({hooks}) {
              hooks.tap('poiuytrewq', () => {});
            },
          },
        }),
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
      qwertyuiop: fakeRegistration({
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
      }),
    },
    manifest: {},
  });
  expect(slice).to.deep.equal(['mnbvcxz', 'mnbvcxz']);
});

test('calls single implementation', async () => {
  let invoked = false;
  const hooks = await registerHooks({
    loaded: {
      qwertyuiop: fakeRegistration({
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
      }),
    },
    manifest: {},
  });
  hooks.callSingle('qwertyuiop:poiuytrewq', 'qwertyuiop', true);
  expect(invoked).to.be.true;
});

test('nonexistent callAsync invokes callback', async () => {
  let invoked = false;
  const hooks = await registerHooks({
    loaded: {},
    manifest: {},
  });
  hooks.callAsync('thisHookDoesNotExist', () => {
    invoked = true;
  });
  expect(invoked).to.be.true;
});

test('default hook order', async () => {
  let accumulation = 1;
  const hooks = await registerHooks({
    loaded: {
      qwertyuiop: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation *= 2;
            });
          },
          register({tapable: {SyncHook}}) {
            return {
              poiuytrewq: new SyncHook(),
            };
          },
        },
      }),
      asdfghjkl: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation += 3;
            });
          },
        },
      }),
      zxcvbnm: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation *= 5;
            });
          },
        },
      }),
    },
    manifest: {},
  });
  hooks.call('qwertyuiop:poiuytrewq');
  expect(accumulation).to.equal(25);
});

test('explicit hook order: before', async () => {
  let accumulation = 1;
  const hooks = await registerHooks({
    loaded: {
      qwertyuiop: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation *= 2;
            });
          },
          register({tapable: {SyncHook}}) {
            return {
              poiuytrewq: new SyncHook(),
            };
          },
        },
      }),
      asdfghjkl: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.before('qwertyuiop').tap('qwertyuiop:poiuytrewq', () => {
              accumulation += 3;
            });
          },
        },
      }),
      zxcvbnm: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation *= 5;
            });
          },
        },
      }),
    },
    manifest: {},
  });
  hooks.call('qwertyuiop:poiuytrewq');
  expect(accumulation).to.equal(40);
});

test('explicit hook order: after', async () => {
  let accumulation = 1;
  const hooks = await registerHooks({
    loaded: {
      qwertyuiop: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.after('asdfghjkl').tap('qwertyuiop:poiuytrewq', () => {
              accumulation *= 2;
            });
          },
          register({tapable: {SyncHook}}) {
            return {
              poiuytrewq: new SyncHook(),
            };
          },
        },
      }),
      asdfghjkl: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation += 3;
            });
          },
        },
      }),
      zxcvbnm: fakeRegistration({
        M: {
          implement({hooks}) {
            hooks.tap('qwertyuiop:poiuytrewq', () => {
              accumulation *= 7;
            });
          },
        },
      }),
    },
    manifest: {},
  });
  hooks.call('qwertyuiop:poiuytrewq');
  expect(accumulation).to.equal(56);
});
