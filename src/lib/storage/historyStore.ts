import { HistoryFilter, HistoryItem } from "@/types/history";
import { getDatabase, memoryFallback } from "./db";

/**
 * Saves a completed diagnostic test record to persistent IndexedDB.
 */
export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.put("history", item);
      return;
    } catch (err) {
      console.warn("Failed to write to IndexedDB, saving to memory fallback:", err);
    }
  }
  memoryFallback.set(item.id, item);
}

/**
 * Retrieves all saved history items with optional search and filtering.
 */
export async function getAllHistory(filter?: HistoryFilter): Promise<HistoryItem[]> {
  let items: HistoryItem[] = [];
  const db = await getDatabase();

  if (db) {
    try {
      items = await db.getAll("history");
    } catch (err) {
      console.warn("Failed to read from IndexedDB, using memory fallback:", err);
      items = Array.from(memoryFallback.values());
    }
  } else {
    items = Array.from(memoryFallback.values());
  }

  // Apply filters in memory
  if (filter) {
    if (filter.category && filter.category !== "all") {
      items = items.filter((item) => item.category === filter.category);
    }

    if (filter.status && filter.status !== "all") {
      items = items.filter((item) => item.status === filter.status);
    }

    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.target.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.errorMessage && item.errorMessage.toLowerCase().includes(q))
      );
    }

    if (filter.sortBy === "oldest") {
      items.sort((a, b) => a.startTime - b.startTime);
    } else if (filter.sortBy === "duration") {
      items.sort((a, b) => b.durationMs - a.durationMs);
    } else {
      // Default: newest first
      items.sort((a, b) => b.startTime - a.startTime);
    }
  } else {
    items.sort((a, b) => b.startTime - a.startTime);
  }

  return items;
}

/**
 * Gets a single history item by its unique ID.
 */
export async function getHistoryItemById(id: string): Promise<HistoryItem | null> {
  const db = await getDatabase();
  if (db) {
    try {
      const item = await db.get("history", id);
      if (item) return item;
    } catch (err) {
      console.warn("IndexedDB get error:", err);
    }
  }
  return memoryFallback.get(id) || null;
}

/**
 * Deletes a single history item by ID.
 */
export async function deleteHistoryItem(id: string): Promise<boolean> {
  let deleted = false;
  const db = await getDatabase();
  if (db) {
    try {
      await db.delete("history", id);
      deleted = true;
    } catch (err) {
      console.warn("IndexedDB delete error:", err);
    }
  }
  if (memoryFallback.has(id)) {
    memoryFallback.delete(id);
    deleted = true;
  }
  return deleted;
}

/**
 * Clears all test history from IndexedDB.
 */
export async function clearAllHistory(): Promise<boolean> {
  let cleared = false;
  const db = await getDatabase();
  if (db) {
    try {
      await db.clear("history");
      cleared = true;
    } catch (err) {
      console.warn("IndexedDB clear error:", err);
    }
  }
  memoryFallback.clear();
  return cleared;
}

/**
 * Retrieves the N most recent tests for dashboard preview.
 */
export async function getRecentHistory(limit: number = 5): Promise<HistoryItem[]> {
  const all = await getAllHistory({ sortBy: "newest" });
  return all.slice(0, limit);
}
