export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "cut" | "maintain" | "bulk";

export interface Food {
  id: string;
  name: string;
  serving: string; // human label, e.g. "1 cup (240g)"
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface LogEntry {
  id: string;
  foodId: string;
  quantity: number; // number of servings
  date: string; // YYYY-MM-DD
}

export interface Profile {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: GoalType;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
