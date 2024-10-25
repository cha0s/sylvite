/* eslint-disable no-undef */

try {
  console.warn = () => {
    process.send('warn');
    process.exit(0);
  }
  const {hooks} = await import('virtual:sylvite/asdfghjkl');
  process.send(hooks.lkjhgfdsa.call());
}
catch (error) {
  process.send('error');
}
