import { StabilitySession } from "@/types/stability";
import { getDatabase, stabilityFallback } from "./db";

export async function saveStabilitySession(session: StabilitySession): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.put("stability_sessions", session);
      return;
    } catch (err) {
      console.warn("IndexedDB write failed for stability session:", err);
    }
  }
  stabilityFallback.set(session.id, session);
}

export async function getAllStabilitySessions(): Promise<StabilitySession[]> {
  const db = await getDatabase();
  let items: StabilitySession[] = [];
  if (db) {
    try {
      items = await db.getAll("stability_sessions");
    } catch (err) {
      console.warn("IndexedDB read failed for stability sessions:", err);
      items = Array.from(stabilityFallback.values());
    }
  } else {
    items = Array.from(stabilityFallback.values());
  }
  return items.sort((a, b) => b.startTime - a.startTime);
}

export async function getStabilitySessionById(id: string): Promise<StabilitySession | null> {
  const db = await getDatabase();
  if (db) {
    try {
      const item = await db.get("stability_sessions", id);
      if (item) return item;
    } catch (err) {
      console.warn("IndexedDB get error for stability session:", err);
    }
  }
  return stabilityFallback.get(id) || null;
}

export async function deleteStabilitySession(id: string): Promise<boolean> {
  let deleted = false;
  const db = await getDatabase();
  if (db) {
    try {
      await db.delete("stability_sessions", id);
      deleted = true;
    } catch (err) {
      console.warn("IndexedDB delete error for stability session:", err);
    }
  }
  if (stabilityFallback.has(id)) {
    stabilityFallback.delete(id);
    deleted = true;
  }
  return deleted;
}

export async function clearAllStabilitySessions(): Promise<boolean> {
  let cleared = false;
  const db = await getDatabase();
  if (db) {
    try {
      await db.clear("stability_sessions");
      cleared = true;
    } catch (err) {
      console.warn("IndexedDB clear error for stability sessions:", err);
    }
  }
  stabilityFallback.clear();
  return cleared;
}
