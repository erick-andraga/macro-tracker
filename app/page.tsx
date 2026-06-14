"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { entryTotals, goalMacros, round } from "@/lib/macros";
import { CalorieRing, MacroBars } from "@/components/MacroDisplay";
import QuickLogModal from "@/components/QuickLogModal";

export default function TodayPage() {
  const { ready, foods, profile, entriesFor, removeEntry } = useStore();
  const date = todayStr();
  const [showLog, setShowLog] = useState(false);

  const todays = useMemo(
    () => (ready ? entriesFor(date) : []),
    [ready, date, entriesFor]
  );
  const consumed = useMemo(() => entryTotals(todays, foods), [todays, foods]);
  const goal = useMemo(() => goalMacros(profile), [profile]);
  const foodMap = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  if (!ready) return <p className="muted">Loading…</p>;

  const prettyDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div>
      <h1>Today</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {prettyDate}
      </p>

      <div className="card">
        <CalorieRing consumed={consumed.calories} goal={goal.calories} />
      </div>

      <div className="card">
        <h2>Macros</h2>
        <MacroBars consumed={consumed} goal={goal} />
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Logged ({todays.length})</h2>
          <button className="btn btn-sm" onClick={() => setShowLog(true)}>
            + Add
          </button>
        </div>
        {todays.length === 0 ? (
          <p className="empty">
            Nothing logged yet.
            <br />
            Tap <strong>+ Add</strong> to log a meal.
          </p>
        ) : (
          <div>
            {todays.map((e) => {
              const f = foodMap.get(e.foodId);
              if (!f) return null;
              return (
                <div className="list-item" key={e.id}>
                  <div>
                    <div className="name">{f.name}</div>
                    <div className="muted small">
                      {e.quantity} × {f.serving} ·{" "}
                      {round(f.calories * e.quantity)} kcal
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => removeEntry(e.id)}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuickLogModal open={showLog} onClose={() => setShowLog(false)} />
    </div>
  );
}
