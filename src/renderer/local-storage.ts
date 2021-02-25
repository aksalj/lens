export * from "./utils/createStorage"
import { StorageAdapter, StorageHelper, StorageHelperOptions } from "./utils/createStorage";
import { ClusterId, clusterStore, getHostedClusterId } from "../common/cluster-store";

// TODO: save state to separated json-file (instead of cluster-store)

export function createStorage<T>(key: string, defaultValue?: T, options: StorageHelperOptions<T> = {}) {
  return new StorageHelper(key, defaultValue, {
    storage: createLocalStorageAdapter<T>(getHostedClusterId()),
    ...options,
  });
}

/**
 * Persists window.localStorage state in json in file-system.
 * This is required because of app's random ports between restarts.
 */
export function createLocalStorageAdapter<T>(clusterId: ClusterId): StorageAdapter<T> {
  return {
    getItem(key: string) {
      return clusterStore.getPreferences(clusterId).uiState?.[key]
    },
    setItem(key: string, value: any) {
      const storage = clusterStore.getPreferences(clusterId);
      if (storage) {
        storage.uiState ??= {};
        storage.uiState[key] = value;
      }
    },
    removeItem(key: string) {
      const storage = clusterStore.getPreferences(clusterId);
      if (storage) {
        delete storage.uiState?.[key];
      }
    },
  }
}
