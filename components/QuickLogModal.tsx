"use client";

import { useMemo, useRef, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { Food, RecipeComponent } from "@/lib/types";
import { resolveRecipe, round } from "@/lib/macros";
import { scanNutritionFacts } from "@/lib/scanNutrition";
import Modal from "./Modal";
import AddFoodForm from "./AddFoodForm";
import RecipeForm from "./RecipeForm";

export default function QuickLogModal({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date?: string;
}) {
  const {
    foods,
    entries,
    logFood,
    addFood,
    addRecipe,
    updateRecipe,
    logRecipeComponents,
  } = useStore();
  const [mode, setMode] = useState<"food" | "recipe">("food");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Food | null>(null);
  const [qty, setQty] = useState("1");
  // Editable component quantities while logging a picked recipe.
  const [comps, setComps] = useState<RecipeComponent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  // Draft values for the new-food form, produced by scanning a label photo.
  const [draft, setDraft] = useState<Partial<Food> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Plain foods only — the building blocks a recipe can be made of.
  const baseFoods = useMemo(() => foods.filter((f) => !f.isRecipe), [foods]);
  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  // How many times each food has been logged, to order the list by popularity.
  const freq = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entries) m[e.foodId] = (m[e.foodId] ?? 0) + 1;
    return m;
  }, [entries]);

  const filtered = useMemo(
    () =>
      foods
        .filter((f) =>
          f.name.toLowerCase().includes(query.trim().toLowerCase())
        )
        .sort(
          (a, b) =>
            (freq[b.id] ?? 0) - (freq[a.id] ?? 0) ||
            a.name.localeCompare(b.name)
        ),
    [foods, query, freq]
  );

  // Live per-serving totals for a picked recipe, from the edited components.
  const compTotals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    for (const c of comps) {
      const f = foodById.get(c.foodId);
      if (!f) continue;
      calories += f.calories * c.quantity;
      protein += f.protein * c.quantity;
      carbs += f.carbs * c.quantity;
      fat += f.fat * c.quantity;
    }
    return { calories, protein, carbs, fat };
  }, [comps, foodById]);

  const close = () => {
    setMode("food");
    setQuery("");
    setPicked(null);
    setQty("1");
    setComps([]);
    setShowCreate(false);
    setDraft(null);
    setScanNote(null);
    setSearchFocused(false);
    onClose();
  };

  const pick = (f: Food) => {
    setPicked(f);
    setQty("1");
    setComps(f.isRecipe ? f.components ?? [] : []);
  };

  const confirm = () => {
    if (!picked) return;
    if (picked.isRecipe) {
      // Preserve the latest component sizes on the recipe and keep a history
      // row of the values used for this log.
      updateRecipe(picked.id, { name: picked.name, components: comps });
      logRecipeComponents(picked.id, comps);
    }
    logFood(picked.id, parseFloat(qty) || 1, date ?? todayStr());
    close();
  };

  const setCompQty = (foodId: string, quantity: number) =>
    setComps((prev) =>
      prev.map((c) => (c.foodId === foodId ? { ...c, quantity } : c))
    );

  const onScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same photo
    if (!file) return;
    setScanning(true);
    try {
      const d = await scanNutritionFacts(file);
      setDraft(d);
      setScanNote(
        Object.keys(d).length > 0
          ? "Scanned from the photo — double-check the values before saving."
          : "Couldn't read the label — enter the values manually."
      );
    } catch {
      setDraft({});
      setScanNote("Couldn't read the label — enter the values manually.");
    }
    setScanning(false);
    setShowCreate(true);
  };

  const nameTaken = (n: string) =>
    foods.some((f) => f.name.trim().toLowerCase() === n);

  const per = picked?.isRecipe ? compTotals : picked;

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        picked ? (
          `Add ${picked.name}`
        ) : (
          <div className="toggle" role="tablist" aria-label="Add food or recipe">
            <button
              className={mode === "food" ? "on" : ""}
              onClick={() => setMode("food")}
              role="tab"
              aria-selected={mode === "food"}
            >
              Add food
            </button>
            <button
              className={mode === "recipe" ? "on" : ""}
              onClick={() => setMode("recipe")}
              role="tab"
              aria-selected={mode === "recipe"}
            >
              Add recipe
            </button>
          </div>
        )
      }
      topAlign={!picked && mode === "food" && searchFocused}
    >
      {picked && per ? (
        <div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Per {picked.serving}: {round(per.calories)} kcal · P
            {round(per.protein)} / C{round(per.carbs)} / F{round(per.fat)}
          </p>
          {picked.isRecipe && comps.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div
                className="muted small"
                style={{ fontWeight: 600, marginBottom: 4 }}
              >
                Components (per serving)
              </div>
              {comps.map((c) => {
                const f = foodById.get(c.foodId);
                if (!f) return null;
                return (
                  <div className="list-item" key={c.foodId}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="name">{f.name}</div>
                      <div className="muted small">
                        {round(f.calories * c.quantity)} kcal · {f.serving}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      inputMode="decimal"
                      value={c.quantity}
                      onChange={(e) =>
                        setCompQty(c.foodId, parseFloat(e.target.value) || 0)
                      }
                      style={{ width: 68, padding: "8px 10px" }}
                      aria-label={`Servings of ${f.name}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="field">
            <label>Servings</label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="card card-accent" style={{ marginBottom: 16 }}>
            <div className="row">
              <span className="muted small">Total</span>
              <strong>
                {round(per.calories * (parseFloat(qty) || 0))} kcal
              </strong>
            </div>
          </div>
          <div className="grid-2">
            <button className="btn btn-ghost" onClick={() => setPicked(null)}>
              Back
            </button>
            <button className="btn" onClick={confirm}>
              Add to Today
            </button>
          </div>
        </div>
      ) : mode === "recipe" ? (
        <RecipeForm
          foods={baseFoods}
          nameTaken={nameTaken}
          submitLabel="Save & select"
          onAdd={async (r) => {
            const created = await addRecipe(r);
            setMode("food");
            pick(
              resolveRecipe(created, new Map(baseFoods.map((f) => [f.id, f])))
            );
          }}
          onCancel={() => setMode("food")}
        />
      ) : (
        <div>
          <div className="row" style={{ marginBottom: 12, gap: 8 }}>
            <input
              className="search"
              placeholder="Search foods…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ marginBottom: 0 }}
            />
            <button
              className="btn"
              style={{
                flexShrink: 0,
                width: 46,
                height: 46,
                padding: 0,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              aria-label="Scan a nutrition label"
            >
              {scanning ? (
                <span className="small">…</span>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={onScanFile}
            />
          </div>
          {scanning && (
            <p className="muted small" style={{ marginTop: 0 }}>
              Reading the label…
            </p>
          )}
          <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p className="empty">No foods match “{query}”.</p>
            ) : (
              filtered.map((f) => (
                <button className="list-item" key={f.id} onClick={() => pick(f)}>
                  <div>
                    <div className="name">
                      {f.name}
                      {f.isRecipe && (
                        <span className="pill" style={{ marginLeft: 8 }}>
                          Recipe
                        </span>
                      )}
                    </div>
                    <div className="muted small">
                      {f.serving} · {round(f.calories)} kcal
                    </div>
                  </div>
                  <span className="muted" style={{ fontSize: "1.2rem" }}>
                    ›
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Nested popup: review the scanned draft as a new food, layered above */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setDraft(null);
          setScanNote(null);
        }}
        title="New food"
        z={110}
      >
        {scanNote && (
          <p className="muted small" style={{ marginTop: 0 }}>
            {scanNote}
          </p>
        )}
        <AddFoodForm
          key={draft ? JSON.stringify(draft) : "blank"}
          initial={draft ?? undefined}
          nameTaken={nameTaken}
          onAdd={async (f) => {
            const created = await addFood(f);
            setShowCreate(false);
            setDraft(null);
            setScanNote(null);
            pick(created);
          }}
          onCancel={() => {
            setShowCreate(false);
            setDraft(null);
            setScanNote(null);
          }}
        />
      </Modal>
    </Modal>
  );
}
