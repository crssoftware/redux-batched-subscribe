'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.batchedSubscribe = batchedSubscribe;

function batchedSubscribe(batch, shouldDebounceFn) {
  if (typeof batch !== 'function') {
    throw new Error('Expected batch to be a function.');
  }
  if (typeof shouldDebounceFn !== 'function') {
    throw new Error('Expected shouldDebounceFn to be a function.');
  }

  var currentListeners = [];
  var nextListeners = currentListeners;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function notifyListeners() {
    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }

  function notifyListenersBatched() {
    batch(notifyListeners);
  }

  return function (next) {
    return function () {
      var store = next.apply(undefined, arguments);
      var subscribeImmediate = store.subscribe;

      function dispatch() {
        var action = arguments[0].action;

        var res = store.dispatch.apply(store, arguments);

        if (shouldDebounceFn(action)) {
          console.log('debounce ', action.type);
          notifyListenersBatched();
        } else {
          notifyListeners();
        }
        return res;
      }

      return _extends({}, store, {
        dispatch: dispatch,
        subscribe: subscribe,
        subscribeImmediate: subscribeImmediate
      });
    };
  };
}