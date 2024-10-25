import {fork} from 'node:child_process';

import {rimraf} from 'rimraf';
import {expect, test} from 'vitest';

async function runTest(MISSING_HOOK_STRATEGY) {
  await rimraf('src/test/dist');
  let output;
  const build = fork('src/test/vite-runtime.js', {
    env: {MISSING_HOOK_STRATEGY},
  });
  await new Promise((resolve, reject) => {
    build.on('close', resolve);
    build.on('error', reject);
  });
  const run = fork('src/test/dist/runtime.js');
  await new Promise((resolve, reject) => {
    run.on('message', (message) => {
      output = message;
    });
    run.on('close', resolve);
    run.on('error', reject);
  });
  expect(output).to.equal(MISSING_HOOK_STRATEGY);
  await rimraf('src/test/dist');
}

test('builds arbitrary virtual modules', async () => {
  await runTest('ignore');
});

test('can warn', async () => {
  await runTest('warn');
});

test('can throw', async () => {
  await runTest('error');
});
