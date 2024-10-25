import {fork} from 'node:child_process';

import {rimraf} from 'rimraf';
import {expect, test} from 'vitest';

test('builds arbitrary virtual modules', async () => {
  await rimraf('src/test/dist');
  let output;
  const build = fork('src/test/vite-runtime.js');
  await new Promise((resolve, reject) => {
    build.on('close', resolve);
    build.on('error', reject);
  });
  const run = fork('src/test/dist/runtime.js', {stdio: [null, 'pipe', null, 'ipc']});
  await new Promise((resolve, reject) => {
    run.on('message', (message) => {
      output = message;
    });
    run.on('close', resolve);
    run.on('error', reject);
  });
  expect(output).to.equal('working');
  await rimraf('src/test/dist');
});
