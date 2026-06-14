"use client";

import { MacroTotals } from "@/lib/types";
import { round } from "@/lib/macros";

export function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = Math.round(goal - consumed);
  const over = remaining < 0;
  return (
    <div className="ring-wrap">
      <div className="ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={over ? "var(--protein)" : "var(--accent)"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <div className="ring-center">
          <span className="big">{round(consumed)}</span>
          <span className="muted small">/ {round(goal)} kcal</span>
        </div>
      </div>
      <div>
        <div className="muted small">
          {over ? "Over by" : "Remaining"}
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>
          {Math.abs(remaining)}
        </div>
        <div className="muted small">kcal</div>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className="bar">
      <div className="row">
        <span className="small" style={{ color }}>
          {label}
        </span>
        <span className="small muted">
          {round(value)} / {round(goal)} g
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function MacroBars({
  consumed,
  goal,
}: {
  consumed: MacroTotals;
  goal: MacroTotals;
}) {
  return (
    <div>
      <Bar label="Protein" value={consumed.protein} goal={goal.protein} color="var(--protein)" />
      <Bar label="Carbs" value={consumed.carbs} goal={goal.carbs} color="var(--carbs)" />
      <Bar label="Fat" value={consumed.fat} goal={goal.fat} color="var(--fat)" />
    </div>
  );
}
