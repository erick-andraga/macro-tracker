export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "cut" | "maintain" | "bulk";

export type MacroThreshold = "lower" | "mid" | "high";

export interface Food {
  id: string;
  name: string;
  serving: string; // human label, e.g. "1 cup (240g)"
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  // Set on the read-only Food produced by resolving a Recipe. A recipe behaves
  // like any other food (it can be logged) but its macros are derived from its
  // components, so it must not be treated as an editable/storable food.
  isRecipe?: boolean;
  components?: RecipeComponent[];
}

// One ingredient in a recipe: a reference to a food plus how many servings of it.
export interface RecipeComponent {
  foodId: string;
  quantity: number; // number of servings of that food
}

// A named group of foods. Its macros are always computed from the *current*
// values of its component foods, so editing a food updates every recipe using it.
export interface Recipe {
  id: string;
  name: string;
  components: RecipeComponent[];
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
  threshold: MacroThreshold;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
