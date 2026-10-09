import { describe, it, expect } from "vitest";
import { calculateHaversineDistance, findNearestTowers } from "./cellularTowers";
import { CellularTower } from "@/types/fieldMap";

describe("cellularTowers", () => {
  it("should calculate zero distance for identical coordinates", () => {
    const d = calculateHaversineDistance(41.0082, 28.9784, 41.0082, 28.9784);
    expect(d).toBe(0);
  });

  it("should calculate correct straight-line distance between two geographic points", () => {
    // Istanbul to London ~ 2500 km
    const d = calculateHaversineDistance(41.0082, 28.9784, 51.5074, -0.1278);
    expect(d).toBeGreaterThan(2490000);
    expect(d).toBeLessThan(2510000);
  });

  it("should correctly rank nearest towers by distance", () => {
    const userLat = 41.0;
    const userLng = 29.0;

    const towers: CellularTower[] = [
      { id: "far", lat: 42.0, lng: 30.0, source: "test" },
      { id: "close", lat: 41.01, lng: 29.01, source: "test" },
      { id: "medium", lat: 41.1, lng: 29.1, source: "test" },
    ];

    const ranked = findNearestTowers(userLat, userLng, towers);
    expect(ranked[0].tower.id).toBe("close");
    expect(ranked[1].tower.id).toBe("medium");
    expect(ranked[2].tower.id).toBe("far");
  });
});
