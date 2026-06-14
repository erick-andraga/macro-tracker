import { Food, Profile } from "./types";

export const SAMPLE_FOODS: Food[] = [
  { id: "f1", name: "Chicken breast (grilled)", serving: "100 g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "f2", name: "White rice (cooked)", serving: "1 cup (158 g)", calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { id: "f3", name: "Whole egg", serving: "1 large", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { id: "f4", name: "Banana", serving: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: "f5", name: "Greek yogurt (plain, nonfat)", serving: "170 g", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { id: "f6", name: "Almonds", serving: "28 g (handful)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: "f7", name: "Oatmeal (cooked)", serving: "1 cup (234 g)", calories: 158, protein: 6, carbs: 27, fat: 3.2 },
  { id: "f8", name: "Salmon (baked)", serving: "100 g", calories: 206, protein: 22, carbs: 0, fat: 12 },
  { id: "f9", name: "Broccoli (steamed)", serving: "1 cup (156 g)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { id: "f10", name: "Whey protein shake", serving: "1 scoop (30 g)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: "f11", name: "Peanut butter", serving: "2 tbsp (32 g)", calories: 188, protein: 8, carbs: 6, fat: 16 },
  { id: "f12", name: "Sweet potato (baked)", serving: "1 medium (130 g)", calories: 112, protein: 2, carbs: 26, fat: 0.1 },
];

export const DEFAULT_PROFILE: Profile = {
  age: 30,
  sex: "male",
  weightKg: 80,
  heightCm: 178,
  activity: "moderate",
  goal: "maintain",
};
