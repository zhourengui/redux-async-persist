import { Store, Reducer, AnyAction, Unsubscribe } from 'redux';
import { isPlainObject, isEqual, debounce } from 'lodash-es';

export interface Storage {
  getItem(key: string, ...args: Array<any>): Promise<any>;
  setItem(key: string, value: any, ...args: Array<any>): Promise<void>;
}

export interface PersistConfig<T> {
  key: string;
  storage: Storage;
  store: Store<T>;
  persistKeys?: string[];
  baseReducer: Reducer<T, AnyAction>;
  disposed?: (unsubscribe: Unsubscribe) => void;
}

const PERSIST_ACTION_TYPE = '@@redux/persist_action_type';

export async function useReduxPersist<T>(persistConfig: PersistConfig<T>) {
  const {
    storage,
    key,
    store,
    persistKeys = [],
    baseReducer,
    disposed,
  } = persistConfig;

  let requestIdleId;

  try {
    const persistState = (await storage.getItem(key)) as T;

    if (process.env.NODE_ENV === 'development') {
      console.log('[redux_async_persist] get persist state:', persistState);
    }

    if (persistState && isPlainObject(persistState)) {
      store.replaceReducer((prevState: T, action) => {
        if (action.type === PERSIST_ACTION_TYPE) {
          return baseReducer(persistState, action);
        }

        return baseReducer(prevState, action);
      });
    }

    store.dispatch({ type: PERSIST_ACTION_TYPE });

    const unsubscribe = store.subscribe(
      debounce(() => {
        requestIdleId = requestIdleCallback(async () => {
          const nextState = store.getState();

          if (!isEqual(nextState, persistState)) {
            await storage.setItem(key, {
              ...persistState,
              ...persistKeys.reduce(
                (prev, next) => ({
                  ...prev,
                  [next]: nextState[next],
                }),
                {}
              ),
            });

            if (process.env.NODE_ENV === 'development') {
              console.log(
                '[redux_async_persist] set persist state:',
                nextState
              );
            }
          }
        });
      }, 500)
    );

    const packageUnsubscribe = () => {
      unsubscribe();
      cancelIdleCallback(requestIdleId);
    };

    disposed?.call(packageUnsubscribe);

    return packageUnsubscribe;
  } catch (error) {
    console.error('[redux_async_persist] error:', error);
  }
}
