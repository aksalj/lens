import { createStorage } from "../../local-storage";

export interface SidebarStorageModel {
  width: number;
  compact: boolean;
  expanded: {
    [itemId: string]: boolean;
  }
}

export const sidebarStorage = createStorage<SidebarStorageModel>("sidebar", {
  width: 200,     // sidebar size in non-compact mode
  compact: false, // compact-mode (icons only)
  expanded: {},
});
