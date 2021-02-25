import { autorun, observable, reaction } from "mobx";
import { autobind, createStorage, StorageHelper } from "../../utils";
import { dockStore, TabId } from "./dock.store";

interface Options<T = any> {
  storageName?: string; // persistent key
  storageSerializer?: (data: T) => Partial<T>; // allow to customize data before saving
}

@autobind()
export class DockTabStore<T = any> {
  protected data = observable.map<TabId, T>();
  protected storage?: StorageHelper<Record<TabId, T>>;

  constructor(protected options: Options<T> = {}) {
    this.init();
  }

  protected init() {
    const { storageName: storageKey } = this.options;

    // restore and sync with persistent storage
    if (storageKey) {
      this.storage = createStorage(storageKey, {});
      this.data.replace(this.storage.get());
      reaction(() => this.serializeData(), (data: T | any) => this.storage.set(data));
    }

    // clear data for closed tabs
    autorun(() => {
      const currentTabs = dockStore.tabs.map(tab => tab.id);

      Array.from(this.data.keys()).forEach(tabId => {
        if (!currentTabs.includes(tabId)) {
          this.clearData(tabId);
        }
      });
    });
  }

  protected serializeData() {
    const { storageSerializer } = this.options;

    return Array.from(this.data).map(([tabId, tabData]) => {
      if (storageSerializer) return [tabId, storageSerializer(tabData)];

      return [tabId, tabData];
    });
  }

  getData(tabId: TabId) {
    return this.data.get(tabId);
  }

  setData(tabId: TabId, data: T) {
    this.data.set(tabId, data);
    this.storage?.merge({ [tabId]: data });
  }

  clearData(tabId: TabId) {
    this.data.delete(tabId);
    this.storage?.merge(draft => {
      delete draft[tabId];
    });
  }

  reset() {
    this.data.clear();
    this.storage?.clear();
  }
}
