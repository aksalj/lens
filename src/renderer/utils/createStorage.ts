// Helper for work with persistent local storage (e.g. window.localStorage, file-system, etc.)
// TODO: write unit/integration tests

import { CreateObservableOptions } from "mobx/lib/api/observable";
import { observable, toJS } from "mobx";
import { Draft, produce } from "immer";

export function createStorage<T>(key: string, defaultValue?: T, options?: StorageHelperOptions<T>) {
  return new StorageHelper(key, defaultValue, options);
}

export interface StorageHelperOptions<T = any> {
  autoInit?: boolean; // default: true, preload data at early stages (e.g. in place of use)
  observable?: boolean | CreateObservableOptions; // default: true, keeps observable state in memory
  storageAdapter?: StorageAdapter<T>;
}

export interface StorageAdapter<T = any> {
  getItem(key: string): T | Promise<T>;
  setItem(key: string, value: T): void;
  removeItem(key: string): void;
}

export const localStorageAdapter: StorageAdapter = {
  getItem(key: string) {
    return JSON.parse(localStorage.getItem(key));
  },
  setItem(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
  }
};

export class StorageHelper<T = any> {
  static defaultOptions: StorageHelperOptions = {
    autoInit: true,
    observable: true,
    storageAdapter: localStorageAdapter,
  };

  @observable initialized = false;
  protected options: StorageHelperOptions;
  protected storage: StorageAdapter<T>;
  protected data = observable.box<T>();

  constructor(readonly key: string, readonly defaultValue?: T, options: StorageHelperOptions = {}) {
    this.options = { ...StorageHelper.defaultOptions, ...options };
    this.storage = this.options.storageAdapter;

    if (typeof this.options.observable === "object") {
      this.configure({ observable: this.options.observable });
    }

    if (this.options.autoInit) {
      this.init();
    }
  }

  configure(config: { observable?: CreateObservableOptions } = {}) {
    if (config.observable) {
      this.data = observable.box<T>(this.data.get(), config.observable);
    }
  }

  async init() {
    if (this.initialized) return;

    try {
      const value: T = await this.storage.getItem(this.key);

      if (value != null) this.set(value);
      this.initialized = true;
    } catch (error) {
    }
  }

  getStorageValue(): T {
    try {
      const value = this.storage.getItem(this.key);

      if (value != null && !(value instanceof Promise)) {
        return value;
      }
    } catch (error) {
      console.error(error, this);
    }

    return this.defaultValue;
  }

  get(): T {
    const value = this.data.get();

    // get from memory
    if (this.options.observable && value != null) {
      return value;
    }

    // read from storage or return default-value
    return this.getStorageValue();
  }

  set(value: T) {
    if (this.options.observable) {
      this.data.set(value);
    }

    try {
      this.storage.setItem(this.key, value);
    } catch (error) {
      console.error(error, this);
    }
  }

  merge(updater: (draft: Draft<T>) => Partial<T> | void) {
    try {
      const currentValue = toJS(this.get());
      const nextValue = produce(currentValue, updater) as T;

      this.set(nextValue);
    } catch (error) {
      console.error(error, this);
    }
  }

  clear() {
    this.data.set(null);

    try {
      this.storage.removeItem(this.key);
    } catch (error) {
      console.error(error, this);
    }
  }
}
