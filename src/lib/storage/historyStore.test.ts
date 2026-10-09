import { describe, it, expect, beforeEach } from "vitest";
import {
  saveHistoryItem,
  getAllHistory,
  getHistoryItemById,
  deleteHistoryItem,
  clearAllHistory,
} from "./historyStore";
import { HistoryItem } from "@/types/history";

describe("historyStore (IndexedDB & Fallback)", () => {
  beforeEach(async () => {
    await clearAllHistory();
  });

  const testItem1: HistoryItem = {
    id: "test_1",
    category: "http",
    target: "https://1.1.1.1",
    startTime: 1000,
    endTime: 1050,
    durationMs: 50,
    status: "success",
    summary: "HTTP latency 50 ms (200 OK)",
    details: {},
  };

  const testItem2: HistoryItem = {
    id: "test_2",
    category: "dns",
    target: "google.com (A)",
    startTime: 2000,
    endTime: 2030,
    durationMs: 30,
    status: "success",
    summary: "DNS A query: 1 record in 30 ms",
    details: {},
  };

  const testItem3: HistoryItem = {
    id: "test_3",
    category: "http",
    target: "https://unreachable-host-xyz.net",
    startTime: 3000,
    endTime: 3500,
    durationMs: 500,
    status: "error",
    summary: "Timeout after 500ms",
    errorMessage: "Connection timed out",
    details: {},
  };

  it("should persist items and retrieve them sorted newest first", async () => {
    await saveHistoryItem(testItem1);
    await saveHistoryItem(testItem2);

    const all = await getAllHistory();
    expect(all.length).toBe(2);
    // testItem2 has startTime 2000 > testItem1 startTime 1000, so it should be first
    expect(all[0].id).toBe("test_2");
    expect(all[1].id).toBe("test_1");
  });

  it("should filter by category", async () => {
    await saveHistoryItem(testItem1);
    await saveHistoryItem(testItem2);
    await saveHistoryItem(testItem3);

    const dnsOnly = await getAllHistory({ category: "dns" });
    expect(dnsOnly.length).toBe(1);
    expect(dnsOnly[0].id).toBe("test_2");

    const httpOnly = await getAllHistory({ category: "http" });
    expect(httpOnly.length).toBe(2);
  });

  it("should filter by status", async () => {
    await saveHistoryItem(testItem1);
    await saveHistoryItem(testItem3);

    const errorsOnly = await getAllHistory({ status: "error" });
    expect(errorsOnly.length).toBe(1);
    expect(errorsOnly[0].id).toBe("test_3");
  });

  it("should search items by target text", async () => {
    await saveHistoryItem(testItem1);
    await saveHistoryItem(testItem2);

    const searchRes = await getAllHistory({ searchQuery: "google" });
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].target).toContain("google.com");
  });

  it("should get item by ID and delete single item", async () => {
    await saveHistoryItem(testItem1);
    const item = await getHistoryItemById("test_1");
    expect(item?.id).toBe("test_1");

    await deleteHistoryItem("test_1");
    const itemAfter = await getHistoryItemById("test_1");
    expect(itemAfter).toBeNull();
  });

  it("should clear all history", async () => {
    await saveHistoryItem(testItem1);
    await saveHistoryItem(testItem2);
    await clearAllHistory();

    const remaining = await getAllHistory();
    expect(remaining.length).toBe(0);
  });
});
