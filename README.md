# Redux Async Persist

Support asynchronous persistent redux

## Installation

```
npm install @zhourengui/redux-async-persist
# or
yarn add @zhourengui/redux-async-persist
```

## Usage

An example used in vue

```ts
import { useReduxPersist } from './persist_store';
import { store } from './stores';
import { getCurrentInstance } from '@vue/runtime-core';
import { onBeforeUnmount } from '@vue/runtime-core';

useReduxPersist({
  key: 'chrome_extension',
  store: store, // redux store
  persistKeys: ['term'], // persist keys
  storage: {
    getItem: async (key: string) =>
      (await chrome.storage.local.get([key]))[key],
    setItem: async (key: string, value: any) =>
      await chrome.storage.local.set({ [key]: value }),
  },
  baseReducer: baseReducer // redux reducers,
  disposed: (unsubscribe) => onBeforeUnmount(unsubscribe, app), // unsubscribe
});
```
