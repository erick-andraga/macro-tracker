"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Food } from "@/lib/types";
import Modal from "@/components/Modal";
import AddFoodForm from "@/components/AddFoodForm";

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
  const { ready, foods, entries, addFood, updateFood, cleanupFoods } =
    useStore();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [editing, setEditing] = useState<Food | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const cleanup = () => {
    const n = cleanupFoods();
    flash(
      n > 0
        ? `Removed ${n} unused food${n > 1 ? "s" : ""}.`
        : "No unused foods to remove."
    );
  };

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
              <div>
                <div className="name">{f.name}</div>
                <div className="muted small">
                  {f.serving} · {f.calories} kcal
                  {sortBy === "popularity" && (
                    <> · logged {popularity.get(f.id) ?? 0}×</>
                  )}
                </div>
                <div className="small" style={{ marginTop: 2 }}>
                  <span style={{ color: "var(--protein)" }}>
                    Protein {f.protein}g
                  </span>
                  <span className="muted"> - </span>
                  <span style={{ color: "var(--carbs)" }}>Carbs {f.carbs}g</span>
                  <span className="muted"> - </span>
                  <span style={{ color: "var(--fat)" }}>Fat {f.fat}g</span>
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
        className="btn btn-ghost"
        onClick={cleanup}
        style={{ fontSize: "0.85rem" }}
      >
        Remove unused foods
      </button>

      <button
        className="fab"
        onClick={() => setShowAdd(true)}
        aria-label="New food"
      >
        +
      </button>

      {/* Floating popup: edit a food */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ""}
      >
        {editing && (
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
        )}
      </Modal>

      {/* Floating popup: create a new food */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New food">
        <AddFoodForm
          nameTaken={(n) => nameTaken(n)}
          onAdd={async (f) => {
            await addFood(f);
            setShowAdd(false);
            flash(`Added "${f.name}" to your foods`);
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}
