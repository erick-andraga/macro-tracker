import type { Food } from "./types";

// Pull macro numbers out of OCR'd Nutrition Facts text. Best-effort: any field
// that can't be found is simply left out of the draft.
export function parseNutritionText(text: string): Partial<Omit<Food, "id">> {
  const draft: Partial<Omit<Food, "id">> = {};

  // Undo common OCR misreads before matching: a letter O read instead of zero
  // in front of a unit, l/I read instead of 1 next to digits, and European
  // decimal commas.
  const cleaned = text
    .replace(/\b[Oo](?=\s?(?:g|mg|kcal)\b)/g, "0")
    .replace(/(?<=\d)[lI]/g, "1")
    .replace(/[lI](?=\d)/g, "1")
    .replace(/(\d),(\d)/g, "$1.$2");

  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // First number that appears after `label` within a line.
  const numAfter = (line: string, label: RegExp) => {
    const m = line.match(label);
    if (!m || m.index === undefined) return undefined;
    const rest = line.slice(m.index + m[0].length);
    const n = rest.match(/(\d+(?:\.\d+)?)/);
    if (!n) return undefined;
    const v = parseFloat(n[1]);
    return Number.isFinite(v) && v >= 0 && v < 10000 ? v : undefined;
  };

  const findLine = (re: RegExp, exclude?: RegExp) =>
    lines.findIndex((l) => re.test(l) && !(exclude && exclude.test(l)));

  // "Calories 230" — ignore the legacy "Calories from Fat 40" figure, which
  // may sit on its own line or share the calories line. On many labels the
  // big calorie number is OCR'd onto the line after the word.
  let ci = findLine(/calorie/i, /from/i);
  if (ci < 0) ci = findLine(/calorie/i);
  if (ci >= 0) {
    const calLine = lines[ci].replace(/calories?\s*from\s*fat[^\d]*\d*/gi, "");
    let cal = numAfter(calLine, /calorie[s]?/i);
    if (cal === undefined && lines[ci + 1]) {
      const m = lines[ci + 1].match(/^(\d{1,4})\b/);
      if (m) cal = parseFloat(m[1]);
    }
    if (cal !== undefined) draft.calories = cal;
  }

  const pi = findLine(/protein/i);
  if (pi >= 0) {
    const v = numAfter(lines[pi], /protein/i);
    if (v !== undefined) draft.protein = v;
  }

  // "Total Carbohydrate 37g 13%" — the grams come right after the word,
  // ahead of the % Daily Value. Skip fiber/sugar sub-lines.
  const bi = findLine(/carb/i, /fib(?:er|re)|sugar/i);
  if (bi >= 0) {
    const v = numAfter(lines[bi], /carb[a-z]*/i);
    if (v !== undefined) draft.carbs = v;
  }

  // Prefer the "Total Fat" line; only fall back to a bare "Fat" line that
  // isn't one of the saturated/trans sub-lines.
  let fi = findLine(/total\s*fat/i);
  if (fi < 0) fi = findLine(/\bfat\b/i, /saturated|trans|from/i);
  if (fi >= 0) {
    const v = numAfter(lines[fi], /fat/i);
    if (v !== undefined) draft.fat = v;
  }

  const si = findLine(/serving\s*size/i);
  if (si >= 0) {
    const m = lines[si].match(/serving\s*size[:\s]*(.{1,40})/i);
    if (m && m[1].trim()) draft.serving = m[1].trim();
  }

  return draft;
}

// Clean up a label photo before OCR: scale it to a size Tesseract reads well,
// then grayscale + local adaptive threshold (Bradley) so text stays crisp even
// under the uneven lighting typical of phone photos.
function preprocessToCanvas(bmp: ImageBitmap): HTMLCanvasElement {
  const scale =
    bmp.width < 1200 ? 1200 / bmp.width : bmp.width > 2200 ? 2200 / bmp.width : 1;
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    const j = i * 4;
    gray[i] = (data[j] * 299 + data[j + 1] * 587 + data[j + 2] * 114) / 1000;
  }

  // Summed-area table so each pixel's local mean is O(1).
  const integral = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x];
      integral[y * w + x] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
    }
  }

  // A pixel is ink if it's noticeably darker than its neighborhood mean.
  const half = Math.max(8, Math.floor(w / 48));
  for (let y = 0; y < h; y++) {
    const y1 = Math.max(y - half, 0);
    const y2 = Math.min(y + half, h - 1);
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(x - half, 0);
      const x2 = Math.min(x + half, w - 1);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[y2 * w + x2] -
        (x1 > 0 ? integral[y2 * w + x1 - 1] : 0) -
        (y1 > 0 ? integral[(y1 - 1) * w + x2] : 0) +
        (x1 > 0 && y1 > 0 ? integral[(y1 - 1) * w + x1 - 1] : 0);
      const v = gray[y * w + x] * count < sum * 0.88 ? 0 : 255;
      const j = (y * w + x) * 4;
      data[j] = data[j + 1] = data[j + 2] = v;
      data[j + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// OCR a photo of a Nutrition Facts label into a draft food. tesseract.js is
// imported lazily so the (large) OCR engine only loads when scanning.
export async function scanNutritionFacts(
  file: File
): Promise<Partial<Omit<Food, "id">>> {
  const { createWorker, PSM } = await import("tesseract.js");

  let input: File | HTMLCanvasElement = file;
  try {
    const bmp = await createImageBitmap(file);
    input = preprocessToCanvas(bmp);
    bmp.close();
  } catch {
    // createImageBitmap/canvas unavailable — OCR the raw photo instead.
  }

  const worker = await createWorker("eng");
  try {
    // A nutrition label is one narrow column of text in mixed font sizes.
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
    });
    const { data } = await worker.recognize(input);
    return parseNutritionText(data.text ?? "");
  } finally {
    await worker.terminate();
  }
}
