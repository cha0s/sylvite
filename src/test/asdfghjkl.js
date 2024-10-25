export function register({tapable: {SyncWaterfallHook}}) {
  return {
    lkjhgfdsa: new SyncWaterfallHook(['result']),
  };
}

export function implement({hooks}) {
  hooks.tap('thisHookDoesNotExist', () => {});
  hooks.tap('lkjhgfdsa', () => 'ignore');
}
