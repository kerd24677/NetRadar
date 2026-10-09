import { openDB, DBSchema, IDBPDatabase } from "idb";
import { HistoryItem } from "@/types/history";

interface NetRadarDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: {
      "by-category": string;
      "by-timestamp": number;
      "by-status": string;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "netradar_v1";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NetRadarDB>> | null = null;
const memoryFallback = new Map<string, HistoryItem>();

export function isIndexedDbAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.indexedDB !== "undefined" && window.indexedDB !== null;
  } catch {
    return false;
  }
}

export async function getDatabase(): Promise<IDBPDatabase<NetRadarDB> | null> {
  if (!isIndexedDbAvailable()) return null;

  if (!dbPromise) {
    dbPromise = openDB<NetRadarDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("history")) {
          const historyStore = db.createObjectStore("history", { keyPath: "id" });
          historyStore.createIndex("by-category", "category");
          historyStore.createIndex("by-timestamp", "startTime");
          historyStore.createIndex("by-status", "status");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      },
    }).catch((err) => {
      console.warn("IndexedDB initialization failed, falling back to in-memory store:", err);
      return null as unknown as IDBPDatabase<NetRadarDB>;
    });
  }

  return dbPromise;
}

export { memoryFallback };
