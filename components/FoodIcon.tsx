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
  // wheat stalk, rice bowl, and a bread slice
  carbs: (
    <>
      <path d="M6.5 19.5v-9" />
      <path d="M6.5 14c-1.9 0-3.4-1.5-3.4-3.4 1.9 0 3.4 1.5 3.4 3.4Z" />
      <path d="M6.5 14c1.9 0 3.4-1.5 3.4-3.4-1.9 0-3.4 1.5-3.4 3.4Z" />
      <path d="M6.5 10.2c-1.4-.9-1.9-2.3-1.4-4 1.5.4 2.2 1.8 1.4 4Z" />
      <path d="M10 15.5h11" />
      <path d="M10 15.5a5.5 5.5 0 0 0 11 0" />
      <path d="M11.8 15.5c0-1.7 1.6-3 3.7-3s3.7 1.3 3.7 3" />
      <path d="M14 5.2c0-1.5 1.1-2.6 2.7-2.6s2.7 1.1 2.7 2.6c0 .8-.4 1.4-.9 1.8v3.4h-3.6V7c-.5-.4-.9-1-.9-1.8Z" />
      <path d="M15.7 5c0-.5.4-.9 1-.9" />
    </>
  ),
  // chicken drumstick, egg, and fish
  protein: (
    <>
      <path d="M7.2 3.4c2.6-.6 5.1.9 5.7 3.4.4 1.8-.3 3.3-1.7 4.4-1 .8-2.4 1-3.6.6C5.5 11.2 4 9.7 3.8 7.6c-.2-2 1.3-3.7 3.4-4.2Z" />
      <path d="M6.4 6.1c.3-.9 1.1-1.5 2.1-1.6" />
      <path d="m11.6 10.6 2 2" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="13.6" cy="14.4" r="1" />
      <path d="M6 12.8c-1.7 0-3.2 2.5-3.2 5a3.2 3.2 0 0 0 6.4 0c0-2.5-1.5-5-3.2-5Z" />
      <path d="M11.5 16.8c1.3-1.9 3.2-3 4.9-3 1.8 0 3.4 1.2 4.1 3-.7 1.8-2.3 3-4.1 3-1.7 0-3.6-1.1-4.9-3Z" />
      <path d="m20.5 16.8 1.7-1.9v3.8Z" />
      <path d="M14.7 15c.5.8.5 2.8 0 3.6" />
      <circle cx="13.6" cy="16" r="0.4" fill="currentColor" stroke="none" />
    </>
  ),
  // coconut top-center, avocado left, dotted peanut right
  fat: (
    <>
      <circle cx="12" cy="7" r="4.2" />
      <circle cx="10.6" cy="5.8" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="13.4" cy="5.8" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.9" r="0.55" fill="currentColor" stroke="none" />
      <path d="M6.5 9.5c-1.3 0-1.9 1.3-2.3 2.8-.3 1.4-1.2 2.3-1.2 4.2a3.5 3.5 0 0 0 7 0c0-1.9-.9-2.8-1.2-4.2-.4-1.5-1-2.8-2.3-2.8Z" />
      <circle cx="6.5" cy="16.4" r="1.4" />
      <path d="M17.3 9.7a2.3 2.3 0 0 1 2.3 2.3c0 .9-.55 1.4-.55 2.3s.55 1.4.55 2.3a2.3 2.3 0 0 1-4.6 0c0-.9.55-1.4.55-2.3s-.55-1.4-.55-2.3a2.3 2.3 0 0 1 2.3-2.3Z" />
      <circle cx="16.5" cy="11.8" r="0.32" fill="currentColor" stroke="none" />
      <circle cx="18.1" cy="12.6" r="0.32" fill="currentColor" stroke="none" />
      <circle cx="16.7" cy="15.9" r="0.32" fill="currentColor" stroke="none" />
      <circle cx="18" cy="16.6" r="0.32" fill="currentColor" stroke="none" />
    </>
  ),
  // bowl with wavy steam, smoothie cup tucked behind
  recipe: (
    <>
      <path d="M12.5 6h5" />
      <path d="m17.5 6-.7 10" />
      <path d="M16.8 16h-2.8" />
      <path d="m12.5 6 .7 9" />
      <path d="M13 8.5h4.2" />
      <path d="M15.6 6 17 2.4" />
      <path d="M3 15h11" />
      <path d="M3 15a5.5 5.5 0 0 0 11 0" />
      <path d="M5.5 11.5c-.7-.7-.7-1.4 0-2 .7-.6.7-1.3 0-1.9" />
      <path d="M8 11.5c-.7-.7-.7-1.4 0-2 .7-.6.7-1.3 0-1.9" />
      <path d="M10.5 11.5c-.7-.7-.7-1.4 0-2 .7-.6.7-1.3 0-1.9" />
    </>
  ),
};

export default function FoodIcon({ food }: { food: Food }) {
  const kind = kindOf(food);
  return (
    <span className={`food-icon ${kind}`} aria-hidden="true">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[kind]}
      </svg>
    </span>
  );
}
