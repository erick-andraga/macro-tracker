"use client";

import { useMemo, useState } from "react";
import { Food, Recipe, RecipeComponent } from "@/lib/types";
import { round } from "@/lib/macros";

export default function RecipeForm({
  foods,
  onAdd,
  onCancel,
  onDelete,
  initial,
  submitLabel = "Save recipe",
  nameTaken,
}: {
  // Selectable foods to build the recipe from (should exclude other recipes).
  foods: Food[];
  onAdd: (r: Omit<Recipe, "id">) => void | Promise<unknown>;
  onCancel: () => void;
  onDelete?: () => void;
  initial?: Recipe;
  submitLabel?: string;
  // Returns true if another food/recipe already uses this (trimmed, lower) name.
  nameTaken?: (name: string) => boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [components, setComponents] = useState<RecipeComponent[]>(
    initial?.components ?? []
  );
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  // Search results for the "add ingredient" box (only while typing).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return foods
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [foods, query]);

  // Live totals from the current component foods.
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    for (const c of components) {
      const f = foodById.get(c.foodId);
      if (!f) continue;
      calories += f.calories * c.quantity;
      protein += f.protein * c.quantity;
      carbs += f.carbs * c.quantity;
      fat += f.fat * c.quantity;
    }
    return { calories, protein, carbs, fat };
  }, [components, foodById]);

  const addComponent = (foodId: string) => {
    setComponents((prev) => {
      const existing = prev.find((c) => c.foodId === foodId);
      if (existing)
        return prev.map((c) =>
          c.foodId === foodId ? { ...c, quantity: c.quantity + 1 } : c
        );
      return [...prev, { foodId, quantity: 1 }];
    });
    setQuery("");
  };

  const setQty = (foodId: string, quantity: number) =>
    setComponents((prev) =>
      prev.map((c) => (c.foodId === foodId ? { ...c, quantity } : c))
    );

  const removeComponent = (foodId: string) =>
    setComponents((prev) => prev.filter((c) => c.foodId !== foodId));

  const submit = async () => {
    if (busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }
    if (nameTaken && nameTaken(trimmed.toLowerCase())) {
      setError("A food or recipe with this name already exists.");
      return;
    }
    if (components.length === 0) {
      setError("Add at least one food to the recipe.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onAdd({ name: trimmed, components });
    } catch {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="field">
        <label>Recipe name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken & rice bowl"
        />
      </div>

      <label>Foods in this recipe</label>
      {components.length === 0 ? (
        <p className="empty" style={{ padding: "14px 0" }}>
          No foods yet. Search below to add some.
        </p>
      ) : (
        <div style={{ marginBottom: 8 }}>
          {components.map((c) => {
            const f = foodById.get(c.foodId);
            if (!f) return null;
            return (
              <div className="list-item" key={c.foodId}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="name">{f.name}</div>
                  <div className="muted small">
                    {round(f.calories * c.quantity)} kcal ·{" "}
                    <span style={{ color: "var(--protein)" }}>
                      {round(f.protein * c.quantity)}
                    </span>
                    <span className="muted"> / </span>
                    <span style={{ color: "var(--carbs)" }}>
                      {round(f.carbs * c.quantity)}
                    </span>
                    <span className="muted"> / </span>
                    <span style={{ color: "var(--fat)" }}>
                      {round(f.fat * c.quantity)}
                    </span>
                  </div>
                </div>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  inputMode="decimal"
                  value={c.quantity}
                  onChange={(e) =>
                    setQty(c.foodId, parseFloat(e.target.value) || 0)
                  }
                  style={{ width: 68, padding: "8px 10px" }}
                  aria-label={`Servings of ${f.name}`}
                />
                <button
                  className="btn-x"
                  onClick={() => removeComponent(c.foodId)}
                  aria-label={`Remove ${f.name}`}
                  style={{ width: 34, height: 34, flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="field" style={{ position: "relative", marginTop: 8 }}>
        <input
          className="search"
          style={{ marginBottom: 0 }}
          placeholder="Search foods to add…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <div
            style={{
              maxHeight: "34vh",
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              marginTop: 6,
              background: "var(--surface-2)",
            }}
          >
            {results.map((f) => (
              <button
                className="list-item"
                key={f.id}
                onClick={() => addComponent(f.id)}
                style={{ padding: "11px 12px" }}
              >
                <div>
                  <div className="name">{f.name}</div>
                  <div className="muted small">
                    {f.serving} · {f.calories} kcal
                  </div>
                </div>
                <span className="muted" style={{ fontSize: "1.2rem" }}>
                  +
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card card-accent" style={{ marginTop: 4, marginBottom: 16 }}>
        <div className="row">
          <span className="muted small">Recipe total</span>
          <strong>{round(totals.calories)} kcal</strong>
        </div>
        <div className="small" style={{ marginTop: 4 }}>
          <span style={{ color: "var(--protein)" }}>
            Protein {round(totals.protein)}g
          </span>
          <span className="muted"> - </span>
          <span style={{ color: "var(--carbs)" }}>
            Carbs {round(totals.carbs)}g
          </span>
          <span className="muted"> - </span>
          <span style={{ color: "var(--fat)" }}>Fat {round(totals.fat)}g</span>
        </div>
      </div>

      {error && (
        <p className="small" style={{ color: "var(--protein)", marginTop: 0 }}>
          {error}
        </p>
      )}

      {onDelete && (
        <button
          className="btn btn-danger"
          onClick={onDelete}
          disabled={busy}
          style={{ marginBottom: 12 }}
        >
          Delete recipe
        </button>
      )}
      <div className="grid-2">
        <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="btn" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
