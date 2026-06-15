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

export function CalorieBar({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const remaining = Math.round(goal - consumed);
  const over = remaining < 0;
  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end", marginBottom: 12 }}>
        <div>
          <div className="muted small">Calories</div>
          <div style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.1 }}>
            {round(consumed)}
            <span
              className="muted"
              style={{ fontSize: "1rem", fontWeight: 500 }}
            >
              {" "}
              / {round(goal)} kcal
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="muted small">{over ? "Over by" : "Remaining"}</div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: over ? "var(--protein)" : "var(--text)",
            }}
          >
            {Math.abs(remaining)}
          </div>
        </div>
      </div>
      <div className="bar-track" style={{ height: 16, marginTop: 0 }}>
        <div
          className="bar-fill"
          style={{
            width: `${pct}%`,
            background: over ? "var(--protein)" : "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  goal,
  color,
  darkColor,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  darkColor: string;
}) {
  const over = value > goal && goal > 0;
  // When over goal, the whole track is full: the goal portion uses the normal
  // color and the excess portion uses a darker shade of the same color.
  const denom = over ? value : goal || 1;
  const normalW = (Math.min(value, goal) / denom) * 100;
  const excessW = over ? ((value - goal) / denom) * 100 : 0;
  return (
    <div className="bar">
      <div className="row">
        <span className="small" style={{ color }}>
          {label}
        </span>
        <span className="small muted">
          {round(value)}{" "}
          <span style={{ color: darkColor }}>/ {round(goal)} g</span>
          {over && round(value - goal) >= 1 && (
            <span style={{ color: darkColor }}> (+{round(value - goal)})</span>
          )}
        </span>
      </div>
      <div className="bar-track" style={{ display: "flex" }}>
        <div
          className="bar-fill"
          style={{ width: `${normalW}%`, background: color, borderRadius: 0 }}
        />
        <div
          className="bar-fill"
          style={{ width: `${excessW}%`, background: darkColor, borderRadius: 0 }}
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
      <Bar label="Protein" value={consumed.protein} goal={goal.protein} color="var(--protein)" darkColor="var(--protein-dark)" />
      <Bar label="Carbs" value={consumed.carbs} goal={goal.carbs} color="var(--carbs)" darkColor="var(--carbs-dark)" />
      <Bar label="Fat" value={consumed.fat} goal={goal.fat} color="var(--fat)" darkColor="var(--fat-dark)" />
    </div>
  );
}
