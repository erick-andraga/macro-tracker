"use client";

import { useState } from "react";
import { Food } from "@/lib/types";

export default function AddFoodForm({
  onAdd,
  onCancel,
  initial,
  submitLabel = "Save food",
  nameTaken,
}: {
  onAdd: (f: Omit<Food, "id">) => void | Promise<unknown>;
  onCancel: () => void;
  initial?: Food;
  submitLabel?: string;
  // Returns true if another food already uses this (trimmed, lower-cased) name.
  nameTaken?: (name: string) => boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [serving, setServing] = useState(initial?.serving ?? "");
  const [calories, setCalories] = useState(
    initial ? String(initial.calories) : ""
  );
  const [protein, setProtein] = useState(
    initial ? String(initial.protein) : ""
  );
  const [carbs, setCarbs] = useState(initial ? String(initial.carbs) : "");
  const [fat, setFat] = useState(initial ? String(initial.fat) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = (s: string) => parseFloat(s) || 0;

  const submit = async () => {
    if (busy) return; // block accidental double-clicks
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }
    if (nameTaken && nameTaken(trimmed.toLowerCase())) {
      setError("A food with this name already exists.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onAdd({
        name: trimmed,
        serving: serving.trim() || "1 serving",
        calories: num(calories),
        protein: num(protein),
        carbs: num(carbs),
        fat: num(fat),
      });
    } catch {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="field">
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Turkey sandwich"
        />
      </div>
      <div className="field">
        <label>Serving label</label>
        <input
          value={serving}
          onChange={(e) => setServing(e.target.value)}
          placeholder="e.g. 1 sandwich (180 g)"
        />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Calories</label>
          <input type="number" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
        <div className="field">
          <label>Protein (g)</label>
          <input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div className="field">
          <label>Carbs (g)</label>
          <input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div className="field">
          <label>Fat (g)</label>
          <input type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="small" style={{ color: "var(--protein)", marginTop: 0 }}>
          {error}
        </p>
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
