import { openDB, DBSchema, IDBPDatabase } from "idb";
import { HistoryItem } from "@/types/history";
import { StabilitySession } from "@/types/stability";
import { WifiSurveyPoint } from "@/types/fieldMap";

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
  stability_sessions: {
    key: string;
    value: StabilitySession;
    indexes: {
      "by-timestamp": number;
      "by-target": string;
    };
  };
  field_survey_points: {
    key: string;
    value: WifiSurveyPoint;
    indexes: {
      "by-timestamp": number;
    };
  };
}

const DB_NAME = "netradar_v1";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<NetRadarDB>> | null = null;
const memoryFallback = new Map<string, HistoryItem>();
const stabilityFallback = new Map<string, StabilitySession>();
const surveyFallback = new Map<string, WifiSurveyPoint>();

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
        if (!db.objectStoreNames.contains("stability_sessions")) {
          const stabStore = db.createObjectStore("stability_sessions", { keyPath: "id" });
          stabStore.createIndex("by-timestamp", "startTime");
          stabStore.createIndex("by-target", "target");
        }
        if (!db.objectStoreNames.contains("field_survey_points")) {
          const fieldStore = db.createObjectStore("field_survey_points", { keyPath: "id" });
          fieldStore.createIndex("by-timestamp", "timestamp");
        }
      },
    }).catch((err) => {
      console.warn("IndexedDB initialization failed, falling back to in-memory store:", err);
      return null as unknown as IDBPDatabase<NetRadarDB>;
    });
  }

  return dbPromise;
}

export { memoryFallback, stabilityFallback, surveyFallback };
