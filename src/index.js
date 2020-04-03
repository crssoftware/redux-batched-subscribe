function allDebounceAsDefault() {
  return true;
}

export function batchedSubscribe(batch, shouldDebounce) {
  if (typeof batch !== 'function') {
    throw new Error('Expected batch to be a function.');
  }
  const shouldDebounceFn = shouldDebounce || allDebounceAsDefault;

  let currentListeners = [];
  let nextListeners = currentListeners;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    let isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function notifyListeners() {
    const listeners = currentListeners = nextListeners;
    for (let i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }

  function notifyListenersBatched() {
    batch(notifyListeners);
  }

  return next => (...args) => {
    const store = next(...args);
    const subscribeImmediate = store.subscribe;

    function dispatch(...dispatchArgs) {
      const action = dispatchArgs[0];

      const res = store.dispatch(...dispatchArgs);

      if (shouldDebounceFn(action, store.getState())) {
        console.log('debounce ', action && action.type);
        notifyListenersBatched();
      } else {
        console.log('not debounce ', action && action.type);
        notifyListeners();
      }
      return res;
    }

    return {
      ...store,
      dispatch,
      subscribe,
      subscribeImmediate
    };
  };
}
