import {spawnSync} from 'node:child_process';

[
  ['index', true],
  ['build', true],
  ['runtime', false],
].forEach(([lib, ssr], i) => {
  spawnSync(
    process.env.NODE,
    ['node_modules/.bin/vite', 'build', '--emptyOutDir', i === 0],
    {env: {LIB: lib, SSR: ssr}, stdio: 'inherit'},
  );
});

