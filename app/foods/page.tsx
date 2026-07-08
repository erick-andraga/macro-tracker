"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Food } from "@/lib/types";
import Modal from "@/components/Modal";
import AddFoodForm from "@/components/AddFoodForm";
import RecipeForm from "@/components/RecipeForm";
import FoodIcon from "@/components/FoodIcon";

type SortKey = "name" | "popularity" | "kcal" | "protein" | "carbs" | "fat";

const SORT_LABELS: Record<SortKey, string> = {
  name: "Name",
  popularity: "Popularity",
  kcal: "Calories",
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};

export default function FoodsPage() {
  const {
    ready,
    foods,
    entries,
    addFood,
    updateFood,
    addRecipe,
    updateRecipe,
    removeRecipe,
  } = useStore();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("popularity");
  const [editing, setEditing] = useState<Food | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"food" | "recipe">("food");
  const [toast, setToast] = useState<string | null>(null);

  // Plain foods only (no recipes) — used as the building blocks for a recipe.
  const baseFoods = useMemo(() => foods.filter((f) => !f.isRecipe), [foods]);

  // How many times each food has been logged (for popularity sort).
  const popularity = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) m.set(e.foodId, (m.get(e.foodId) ?? 0) + 1);
    return m;
  }, [entries]);

  const visible = useMemo(() => {
    // De-duplicate by name (case-insensitive), keeping the first occurrence.
    const seen = new Set<string>();
    const unique: Food[] = [];
    for (const f of foods) {
      const key = f.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(f);
    }
    const q = query.trim().toLowerCase();
    const list = unique.filter((f) => f.name.toLowerCase().includes(q));
    const pop = (f: Food) => popularity.get(f.id) ?? 0;
    list.sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return pop(b) - pop(a) || a.name.localeCompare(b.name);
        case "kcal":
          return b.calories - a.calories;
        case "protein":
          return b.protein - a.protein;
        case "carbs":
          return b.carbs - a.carbs;
        case "fat":
          return b.fat - a.fat;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [foods, query, sortBy, popularity]);

  if (!ready) return <p className="muted">Loading…</p>;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const nameTaken = (lower: string, exceptId?: string) =>
    foods.some(
      (f) => f.id !== exceptId && f.name.trim().toLowerCase() === lower
    );

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Foods</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          aria-label="Sort foods"
          style={{
            width: "auto",
            fontSize: "0.8rem",
            padding: "6px 10px",
            borderRadius: 999,
          }}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {toast && (
        <div className="card" style={{ borderColor: "var(--green)" }}>
          ✅ {toast}
        </div>
      )}

      <input
        className="search"
        placeholder="Search foods…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="card">
        {visible.length === 0 ? (
          <p className="empty">No foods match “{query}”.</p>
        ) : (
          visible.map((f) => (
            <button
              className="list-item"
              key={f.id}
              onClick={() => setEditing(f)}
            >
              <FoodIcon food={f} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">
                  {f.name}
                  {f.isRecipe && (
                    <span className="pill" style={{ marginLeft: 8 }}>
                      Recipe
                    </span>
                  )}
                </div>
                <div className="muted small">
                  {f.serving} · {Math.round(f.calories)} kcal
                  {sortBy === "popularity" && (
                    <> · logged {popularity.get(f.id) ?? 0}×</>
                  )}
                </div>
                <div className="small" style={{ marginTop: 2 }}>
                  <span style={{ color: "var(--protein)" }}>
                    Protein {Math.round(f.protein)}g
                  </span>
                  <span className="muted"> - </span>
                  <span style={{ color: "var(--carbs)" }}>
                    Carbs {Math.round(f.carbs)}g
                  </span>
                  <span className="muted"> - </span>
                  <span style={{ color: "var(--fat)" }}>
                    Fat {Math.round(f.fat)}g
                  </span>
                </div>
              </div>
              <span className="muted" style={{ fontSize: "1.2rem" }}>
                ›
              </span>
            </button>
          ))
        )}
      </div>

      <button
        className="fab"
        onClick={() => {
          setAddMode("food");
          setShowAdd(true);
        }}
        aria-label="New food or recipe"
      >
        +
      </button>

      {/* Floating popup: edit a food or recipe */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ""}
      >
        {editing &&
          (editing.isRecipe ? (
            <RecipeForm
              initial={{
                id: editing.id,
                name: editing.name,
                components: editing.components ?? [],
              }}
              foods={baseFoods}
              submitLabel="Save changes"
              nameTaken={(n) => nameTaken(n, editing.id)}
              onAdd={(r) => {
                updateRecipe(editing.id, r);
                setEditing(null);
                flash(`Updated "${r.name}"`);
              }}
              onDelete={() => {
                removeRecipe(editing.id);
                setEditing(null);
                flash(`Deleted "${editing.name}"`);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <AddFoodForm
              initial={editing}
              submitLabel="Save changes"
              nameTaken={(n) => nameTaken(n, editing.id)}
              onAdd={(f) => {
                updateFood(editing.id, f);
                setEditing(null);
                flash(`Updated "${f.name}"`);
              }}
              onCancel={() => setEditing(null)}
            />
          ))}
      </Modal>

      {/* Floating popup: create a new food or recipe. The title itself is a
          toggle between the two forms. */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={
          <div className="toggle" role="tablist" aria-label="What to add">
            <button
              className={addMode === "food" ? "on" : ""}
              onClick={() => setAddMode("food")}
              role="tab"
              aria-selected={addMode === "food"}
            >
              New Food
            </button>
            <button
              className={addMode === "recipe" ? "on" : ""}
              onClick={() => setAddMode("recipe")}
              role="tab"
              aria-selected={addMode === "recipe"}
            >
              New Recipe
            </button>
          </div>
        }
      >
        {addMode === "food" ? (
          <AddFoodForm
            nameTaken={(n) => nameTaken(n)}
            onAdd={async (f) => {
              await addFood(f);
              setShowAdd(false);
              flash(`Added "${f.name}" to your foods`);
            }}
            onCancel={() => setShowAdd(false)}
          />
        ) : (
          <RecipeForm
            foods={baseFoods}
            nameTaken={(n) => nameTaken(n)}
            onAdd={async (r) => {
              await addRecipe(r);
              setShowAdd(false);
              flash(`Added recipe "${r.name}"`);
            }}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </Modal>
    </div>
  );
}
