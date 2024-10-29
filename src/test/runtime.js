/* eslint-disable no-undef */

try {
  let skipSend = false;
  console.warn = () => {
    process.send('warn');
    skipSend = true;
  }
  const {hooks} = await import('virtual:sylvite/asdfghjkl');
  hooks.call('thisHookDoesNotExist');
  const result = hooks.call('test:lkjhgfdsa');
  if (!skipSend) {
    process.send(result);
  }
}
catch (error) {
  process.send('error');
}
