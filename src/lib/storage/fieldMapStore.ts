import { WifiSurveyPoint } from "@/types/fieldMap";
import { getDatabase, surveyFallback } from "./db";

export async function saveSurveyPoint(point: WifiSurveyPoint): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      await db.put("field_survey_points", point);
      return;
    } catch (err) {
      console.warn("IndexedDB write failed for field survey point:", err);
    }
  }
  surveyFallback.set(point.id, point);
}

export async function saveSurveyPointsBulk(points: WifiSurveyPoint[]): Promise<void> {
  const db = await getDatabase();
  if (db) {
    try {
      const tx = db.transaction("field_survey_points", "readwrite");
      await Promise.all(points.map((p) => tx.store.put(p)));
      await tx.done;
      return;
    } catch (err) {
      console.warn("IndexedDB bulk write failed for survey points:", err);
    }
  }
  points.forEach((p) => surveyFallback.set(p.id, p));
}

export async function getAllSurveyPoints(): Promise<WifiSurveyPoint[]> {
  const db = await getDatabase();
  let items: WifiSurveyPoint[] = [];
  if (db) {
    try {
      items = await db.getAll("field_survey_points");
    } catch (err) {
      console.warn("IndexedDB read failed for survey points:", err);
      items = Array.from(surveyFallback.values());
    }
  } else {
    items = Array.from(surveyFallback.values());
  }
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

export async function deleteSurveyPoint(id: string): Promise<boolean> {
  let deleted = false;
  const db = await getDatabase();
  if (db) {
    try {
      await db.delete("field_survey_points", id);
      deleted = true;
    } catch (err) {
      console.warn("IndexedDB delete error for survey point:", err);
    }
  }
  if (surveyFallback.has(id)) {
    surveyFallback.delete(id);
    deleted = true;
  }
  return deleted;
}

export async function clearAllSurveyPoints(): Promise<boolean> {
  let cleared = false;
  const db = await getDatabase();
  if (db) {
    try {
      await db.clear("field_survey_points");
      cleared = true;
    } catch (err) {
      console.warn("IndexedDB clear error for survey points:", err);
    }
  }
  surveyFallback.clear();
  return cleared;
}
