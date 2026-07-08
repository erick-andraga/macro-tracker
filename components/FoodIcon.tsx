import { Food } from "@/lib/types";

type Kind = "protein" | "carbs" | "fat" | "recipe";

// Which icon a food gets: recipes get the bowl; plain foods get the macro
// that contributes the most calories (9 kcal/g fat, 4 kcal/g otherwise).
function kindOf(food: Food): Kind {
  if (food.isRecipe) return "recipe";
  const p = food.protein * 4;
  const c = food.carbs * 4;
  const f = food.fat * 9;
  if (p > c && p > f) return "protein";
  if (f > c) return "fat";
  return "carbs";
}

const GLYPHS: Record<Kind, React.ReactNode> = {
  // wheat stalk
  carbs: (
    <>
      <path d="M12 21v-5" />
      <path d="M12 16c-2.6 0-4.6-2-4.6-4.6 2.6 0 4.6 2 4.6 4.6Z" />
      <path d="M12 16c2.6 0 4.6-2 4.6-4.6-2.6 0-4.6 2-4.6 4.6Z" />
      <path d="M12 11c-2.6 0-4.6-2-4.6-4.6 2.6 0 4.6 2 4.6 4.6Z" />
      <path d="M12 11c2.6 0 4.6-2 4.6-4.6-2.6 0-4.6 2-4.6 4.6Z" />
    </>
  ),
  // drumstick
  protein: (
    <>
      <circle cx="10" cy="10" r="5.5" />
      <path d="m14 14 4.3 4.3" />
      <circle cx="19.3" cy="19.3" r="1.7" />
    </>
  ),
  // avocado half with pit
  fat: (
    <>
      <path d="M12 3c-2 0-2.8 2-3.4 4.2C8 9.4 6.5 10.7 6.5 13.7a5.5 5.5 0 0 0 11 0c0-3-1.5-4.3-2.1-6.5C14.8 5 14 3 12 3Z" />
      <circle cx="12" cy="13.7" r="2.4" />
    </>
  ),
  // steaming bowl
  recipe: (
    <>
      <path d="M4 12.5h16" />
      <path d="M4 12.5a8 8 0 0 0 16 0" />
      <path d="M9 8.5v-3" />
      <path d="M15 8.5v-3" />
    </>
  ),
};

export default function FoodIcon({ food }: { food: Food }) {
  const kind = kindOf(food);
  return (
    <span className={`food-icon ${kind}`} aria-hidden="true">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[kind]}
      </svg>
    </span>
  );
}
