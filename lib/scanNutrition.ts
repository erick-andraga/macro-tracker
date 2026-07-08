import type { Food } from "./types";

// Pull macro numbers out of OCR'd Nutrition Facts text. Best-effort: any field
// that can't be found is simply left out of the draft.
export function parseNutritionText(text: string): Partial<Omit<Food, "id">> {
  const draft: Partial<Omit<Food, "id">> = {};

  const grab = (re: RegExp) => {
    const m = text.match(re);
    if (!m) return undefined;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  // "Calories 230" — skip the legacy "Calories from Fat 40" line.
  const calLine = text
    .split(/\n+/)
    .find((l) => /calorie/i.test(l) && !/from/i.test(l));
  if (calLine) {
    const m = calLine.match(/(\d{1,4})/);
    if (m) draft.calories = parseFloat(m[1]);
  }

  const protein = grab(/protein[^\d]{0,15}(\d+(?:\.\d+)?)/i);
  if (protein !== undefined) draft.protein = protein;

  const carbs = grab(/carbohydrates?[^\d]{0,15}(\d+(?:\.\d+)?)/i);
  if (carbs !== undefined) draft.carbs = carbs;

  const fat =
    grab(/total\s*fat[^\d]{0,15}(\d+(?:\.\d+)?)/i) ??
    grab(/\bfat[^\d]{0,15}(\d+(?:\.\d+)?)/i);
  if (fat !== undefined) draft.fat = fat;

  const serving = text.match(/serving\s*size[:\s]*([^\n]{1,40})/i);
  if (serving) draft.serving = serving[1].trim();

  return draft;
}

// OCR a photo of a Nutrition Facts label into a draft food. tesseract.js is
// imported lazily so the (large) OCR engine only loads when scanning.
export async function scanNutritionFacts(
  file: File
): Promise<Partial<Omit<Food, "id">>> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(file);
    return parseNutritionText(data.text ?? "");
  } finally {
    await worker.terminate();
  }
}
