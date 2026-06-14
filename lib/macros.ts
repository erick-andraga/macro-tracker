import {
  ActivityLevel,
  Food,
  LogEntry,
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

const GOAL_OFFSET: Record<Profile["goal"], number> = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

export function goalCalories(p: Profile): number {
  return Math.max(1200, Math.round(tdee(p) + GOAL_OFFSET[p.goal]));
}

// Default macro split: 30% protein / 40% carbs / 30% fat
export function goalMacros(p: Profile): MacroTotals {
  const cals = goalCalories(p);
  return {
    calories: cals,
    protein: Math.round((cals * 0.3) / 4),
    carbs: Math.round((cals * 0.4) / 4),
    fat: Math.round((cals * 0.3) / 9),
  };
}

// Unit helpers
export const lbToKg = (lb: number) => lb * 0.45359237;
export const kgToLb = (kg: number) => kg / 0.45359237;
export const inToCm = (inches: number) => inches * 2.54;
export const cmToIn = (cm: number) => cm / 2.54;

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
