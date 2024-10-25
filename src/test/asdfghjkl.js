export function register({tapable: {SyncWaterfallHook}}) {
  return {
    lkjhgfdsa: new SyncWaterfallHook(['result']),
  };
}

export function implement({hooks}) {
  hooks.lkjhgfdsa.tap(() => 'working');
}
