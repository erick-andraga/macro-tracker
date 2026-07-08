"use client";

import { useMemo } from "react";
import { Food, RecipeComponent } from "@/lib/types";
import { round } from "@/lib/macros";

// Read-only breakdown of the foods that make up a recipe. `scale` multiplies
// every component's quantity (e.g. the number of recipe servings being logged).
export default function RecipeComponents({
  components,
  foods,
  scale = 1,
}: {
  components: RecipeComponent[];
  foods: Food[];
  scale?: number;
}) {
  const byId = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);
  const rows = components
    .map((c) => ({ c, f: byId.get(c.foodId) }))
    .filter((r): r is { c: RecipeComponent; f: Food } => !!r.f);

  if (rows.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div
        className="muted small"
        style={{ fontWeight: 600, marginBottom: 4 }}
      >
        Contains {rows.length} {rows.length === 1 ? "food" : "foods"}
      </div>
      {rows.map(({ c, f }) => {
        const qty = c.quantity * scale;
        return (
          <div className="list-item" key={c.foodId}>
            <div style={{ minWidth: 0 }}>
              <div className="name">{f.name}</div>
              <div className="muted small">
                {+qty.toFixed(2)} × {f.serving}
              </div>
            </div>
            <span className="muted small" style={{ flexShrink: 0 }}>
              {round(f.calories * qty)} kcal
            </span>
          </div>
        );
      })}
    </div>
  );
}
