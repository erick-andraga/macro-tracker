"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  ACTIVITY_LABELS,
  bmr,
  cmToFt,
  FAT_PCT,
  ftToCm,
  goalCalories,
  goalMacros,
  kgToLb,
  lbToKg,
  normThreshold,
  PROTEIN_PER_KG,
  tdee,
} from "@/lib/macros";
import {
  ActivityLevel,
  GoalType,
  MacroThreshold,
  Profile,
  Sex,
} from "@/lib/types";

type WeightUnit = "kg" | "lb";
type HeightUnit = "cm" | "ft";

export default function ProfilePage() {
  const { ready, profile, setProfile } = useStore();
  const { enabled, user, signOut } = useAuth();

  const [draft, setDraft] = useState<Profile>(profile);
  const [wUnit, setWUnit] = useState<WeightUnit>("kg");
  const [hUnit, setHUnit] = useState<HeightUnit>("cm");
  const [saved, setSaved] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

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
      : cmToFt(draft.heightCm).toFixed(2);

  const onWeight = (val: string) => {
    const n = parseFloat(val) || 0;
    set("weightKg", wUnit === "kg" ? n : lbToKg(n));
  };
  const onHeight = (val: string) => {
    const n = parseFloat(val) || 0;
    set("heightCm", hUnit === "cm" ? n : ftToCm(n));
  };

  const save = () => {
    setProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const macros = goalMacros(draft);
  const th = normThreshold(draft.threshold);

  return (
    <div>
      <h1>Profile</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Your goals are calculated from these.
      </p>

      <div className="card">
        <div
          className="row"
          style={{ cursor: "pointer", marginBottom: 14 }}
          onClick={() => setShowFormula((s) => !s)}
          onMouseEnter={() => setShowFormula(true)}
          title="Tap to see how this is calculated"
        >
          <h2 style={{ margin: 0 }}>Calculated goals</h2>
          <span className="pill">{showFormula ? "hide" : "ⓘ formula"}</span>
        </div>

        {showFormula && (
          <div
            className="card"
            style={{ background: "var(--surface-2)", marginBottom: 14 }}
          >
            <p className="small muted" style={{ margin: "0 0 8px" }}>
              <strong>BMR</strong> (Mifflin-St Jeor):{" "}
              {draft.sex === "male"
                ? "10·kg + 6.25·cm − 5·age + 5"
                : "10·kg + 6.25·cm − 5·age − 161"}
            </p>
            <p className="small muted" style={{ margin: "0 0 8px" }}>
              <strong>TDEE</strong> = BMR × activity ({ACTIVITY_LABELS[draft.activity].split(" ")[0].toLowerCase()})
            </p>
            <p className="small muted" style={{ margin: "0 0 8px" }}>
              <strong>Target</strong> = TDEE{" "}
              {draft.goal === "cut" ? "− 500" : draft.goal === "bulk" ? "+ 300" : "± 0"}{" "}
              ({draft.goal})
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              <strong>Macros</strong>: protein {PROTEIN_PER_KG[th]} g/kg ·
              fat {Math.round(FAT_PCT[th] * 100)}% of kcal · carbs = remainder
            </p>
          </div>
        )}

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
          {PROTEIN_PER_KG[th]} g/kg protein ·{" "}
          {Math.round(FAT_PCT[th] * 100)}% fat · rest carbs
        </p>
      </div>

      <div className="card">
        <div className="field">
          <label>Gender</label>
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
          <label>Age</label>
          <input
            type="number"
            inputMode="numeric"
            value={draft.age}
            onChange={(e) => set("age", parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="field">
          <div className="row" style={{ marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Weight</label>
            <div className="toggle">
              {(["kg", "lb"] as WeightUnit[]).map((u) => (
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
              {(["cm", "ft"] as HeightUnit[]).map((u) => (
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

        <div className="field">
          <label>Macro threshold</label>
          <div className="toggle" style={{ display: "flex", width: "100%" }}>
            {(
              [
                ["lower", "Lower"],
                ["mid", "Mid"],
                ["high", "High"],
              ] as [MacroThreshold, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                style={{ flex: 1 }}
                className={th === t ? "on" : ""}
                onClick={() => set("threshold", t)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
            {PROTEIN_PER_KG[th]} g/kg protein ·{" "}
            {Math.round(FAT_PCT[th] * 100)}% fat · rest carbs
          </p>
        </div>

        <button className="btn" onClick={save}>
          {saved ? "✅ Saved" : "Save profile"}
        </button>
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
