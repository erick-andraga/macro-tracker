"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  ACTIVITY_LABELS,
  bmr,
  cmToIn,
  goalCalories,
  goalMacros,
  inToCm,
  kgToLb,
  lbToKg,
  tdee,
} from "@/lib/macros";
import {
  ActivityLevel,
  GoalType,
  Profile,
  Sex,
} from "@/lib/types";

type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "in";

export default function ProfilePage() {
  const { ready, profile, setProfile } = useStore();
  const { enabled, user, signOut } = useAuth();

  const [draft, setDraft] = useState<Profile>(profile);
  const [wUnit, setWUnit] = useState<WeightUnit>("lb");
  const [hUnit, setHUnit] = useState<HeightUnit>("in");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready) setDraft(profile);
  }, [ready, profile]);

  if (!ready) return <p className="muted">Loading…</p>;

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  // Display values respecting the chosen unit
  const weightDisplay =
    wUnit === "kg"
      ? draft.weightKg.toFixed(1)
      : kgToLb(draft.weightKg).toFixed(1);
  const heightDisplay =
    hUnit === "cm"
      ? draft.heightCm.toFixed(0)
      : cmToIn(draft.heightCm).toFixed(1);

  const onWeight = (val: string) => {
    const n = parseFloat(val) || 0;
    set("weightKg", wUnit === "kg" ? n : lbToKg(n));
  };
  const onHeight = (val: string) => {
    const n = parseFloat(val) || 0;
    set("heightCm", hUnit === "cm" ? n : inToCm(n));
  };

  const save = () => {
    setProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const macros = goalMacros(draft);

  return (
    <div>
      <h1>Profile</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Your goals are calculated from these.
      </p>

      <div className="card">
        <div className="field">
          <label>Age</label>
          <input
            type="number"
            inputMode="numeric"
            value={draft.age}
            onChange={(e) => set("age", parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="field">
          <label>Sex</label>
          <div className="toggle">
            {(["male", "female"] as Sex[]).map((s) => (
              <button
                key={s}
                className={draft.sex === s ? "on" : ""}
                onClick={() => set("sex", s)}
              >
                {s === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="row" style={{ marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Weight</label>
            <div className="toggle">
              {(["lb", "kg"] as WeightUnit[]).map((u) => (
                <button
                  key={u}
                  className={wUnit === u ? "on" : ""}
                  onClick={() => setWUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={weightDisplay}
            onChange={(e) => onWeight(e.target.value)}
          />
        </div>

        <div className="field">
          <div className="row" style={{ marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Height</label>
            <div className="toggle">
              {(["in", "cm"] as HeightUnit[]).map((u) => (
                <button
                  key={u}
                  className={hUnit === u ? "on" : ""}
                  onClick={() => setHUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            value={heightDisplay}
            onChange={(e) => onHeight(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Activity level</label>
          <select
            value={draft.activity}
            onChange={(e) => set("activity", e.target.value as ActivityLevel)}
          >
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABELS[a]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Goal</label>
          <div className="toggle" style={{ display: "flex", width: "100%" }}>
            {(
              [
                ["cut", "Cut"],
                ["maintain", "Maintain"],
                ["bulk", "Bulk"],
              ] as [GoalType, string][]
            ).map(([g, label]) => (
              <button
                key={g}
                style={{ flex: 1 }}
                className={draft.goal === g ? "on" : ""}
                onClick={() => set("goal", g)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn" onClick={save}>
          {saved ? "✅ Saved" : "Save profile"}
        </button>
      </div>

      <div className="card">
        <h2>Calculated goals</h2>
        <div className="row">
          <span className="muted">BMR (Mifflin-St Jeor)</span>
          <strong>{Math.round(bmr(draft))} kcal</strong>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="muted">TDEE (maintenance)</span>
          <strong>{Math.round(tdee(draft))} kcal</strong>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="muted">Daily target ({draft.goal})</span>
          <strong style={{ color: "var(--accent)" }}>
            {goalCalories(draft)} kcal
          </strong>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
        <div className="row">
          <span style={{ color: "var(--protein)" }}>Protein</span>
          <strong>{macros.protein} g</strong>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span style={{ color: "var(--carbs)" }}>Carbs</span>
          <strong>{macros.carbs} g</strong>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span style={{ color: "var(--fat)" }}>Fat</span>
          <strong>{macros.fat} g</strong>
        </div>
        <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
          Split: 30% protein · 40% carbs · 30% fat
        </p>
      </div>

      {enabled && (
        <div className="card">
          <h2>Account</h2>
          <div className="row" style={{ marginBottom: 14 }}>
            <span className="muted">Signed in as</span>
            <strong>{user?.email ?? "—"}</strong>
          </div>
          <button className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
