import { Food, Profile } from "./types";

// No built-in sample foods — the food library comes entirely from the database.
export const SAMPLE_FOODS: Food[] = [];

export const DEFAULT_PROFILE: Profile = {
  age: 30,
  sex: "male",
  weightKg: 80,
  heightCm: 178,
  activity: "moderate",
  goal: "maintain",
  threshold: "mid",
};
