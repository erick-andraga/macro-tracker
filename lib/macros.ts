import {
  ActivityLevel,
  Food,
  GoalType,
  LogEntry,
  MacroThreshold,
  MacroTotals,
  Profile,
} from "./types";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little/no exercise)",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very active (hard daily / physical job)",
};

// Mifflin-St Jeor basal metabolic rate
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

// Total Daily Energy Expenditure
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

// --- Dimension 1: calorie goal (cut / maintain / bulk) ---
const GOAL_OFFSET: Record<GoalType, number> = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

export const GOAL_LABELS: Record<GoalType, string> = {
  cut: "Cut",
  maintain: "Maintain",
  bulk: "Bulk",
};

export function goalCalories(p: Profile): number {
  return Math.max(1200, Math.round(tdee(p) + GOAL_OFFSET[p.goal]));
}

// --- Dimension 2: macro threshold (lower / mid / high) ---
export const THRESHOLD_LABELS: Record<MacroThreshold, string> = {
  lower: "Lower",
  mid: "Mid",
  high: "High",
};

// Protein target in grams per kg of bodyweight.
export const PROTEIN_PER_KG: Record<MacroThreshold, number> = {
  lower: 1,
  mid: 1.6,
  high: 2,
};

// Fat as a share of total calories — inverse to protein (more protein -> less fat).
export const FAT_PCT: Record<MacroThreshold, number> = {
  lower: 0.4,
  mid: 0.3,
  high: 0.2,
};

// Normalize legacy/missing threshold values read from older data.
export function normThreshold(t: string | undefined): MacroThreshold {
  return t === "lower" || t === "mid" || t === "high" ? t : "mid";
}

// Macros: calories from the goal, protein from g/kg, fat from % of calories,
// carbs fill the remainder.
export function goalMacros(p: Profile): MacroTotals {
  const t = normThreshold(p.threshold);
  const cals = goalCalories(p);
  const protein = Math.round(PROTEIN_PER_KG[t] * p.weightKg);
  const fatCals = FAT_PCT[t] * cals;
  const fat = Math.round(fatCals / 9);
  const carbs = Math.max(0, Math.round((cals - protein * 4 - fatCals) / 4));
  return { calories: cals, protein, carbs, fat };
}

// Unit helpers
export const lbToKg = (lb: number) => lb * 0.45359237;
export const kgToLb = (kg: number) => kg / 0.45359237;
export const inToCm = (inches: number) => inches * 2.54;
export const cmToIn = (cm: number) => cm / 2.54;
export const ftToCm = (ft: number) => ft * 30.48;
export const cmToFt = (cm: number) => cm / 30.48;

export function entryTotals(
  entries: LogEntry[],
  foods: Food[]
): MacroTotals {
  const foodMap = new Map(foods.map((f) => [f.id, f]));
  return entries.reduce<MacroTotals>(
    (acc, e) => {
      const f = foodMap.get(e.foodId);
      if (!f) return acc;
      acc.calories += f.calories * e.quantity;
      acc.protein += f.protein * e.quantity;
      acc.carbs += f.carbs * e.quantity;
      acc.fat += f.fat * e.quantity;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export const round = (n: number) => Math.round(n);
