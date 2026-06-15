"use client";

import { useState } from "react";
import { Food } from "@/lib/types";

export default function AddFoodForm({
  onAdd,
  onCancel,
  initial,
  submitLabel = "Save food",
}: {
  onAdd: (f: Omit<Food, "id">) => void;
  onCancel: () => void;
  initial?: Food;
  submitLabel?: string;
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

  const num = (s: string) => parseFloat(s) || 0;

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      serving: serving.trim() || "1 serving",
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
    });
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
      <div className="grid-2">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" onClick={submit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
