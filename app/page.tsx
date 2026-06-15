"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { entryTotals, goalMacros, round } from "@/lib/macros";
import { CalorieBar, MacroBars } from "@/components/MacroDisplay";
import QuickLogModal from "@/components/QuickLogModal";
import Modal from "@/components/Modal";
import type { LogEntry } from "@/lib/types";

export default function TodayPage() {
  const { ready, foods, profile, entriesFor, updateEntry, removeEntry } =
    useStore();
  const date = todayStr();
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [editQty, setEditQty] = useState("1");

  const openEdit = (e: LogEntry) => {
    setEditing(e);
    setEditQty(String(e.quantity));
  };

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
        <CalorieBar consumed={consumed.calories} goal={goal.calories} />
      </div>

      <div className="card">
        <h2>Macros</h2>
        <MacroBars consumed={consumed} goal={goal} />
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Logged ({todays.length})</h2>
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
                  <button
                    onClick={() => openEdit(e)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      textAlign: "left",
                      color: "inherit",
                      flex: 1,
                    }}
                  >
                    <div className="name">{f.name}</div>
                    <div className="muted small">
                      {e.quantity} × {f.serving} ·{" "}
                      {round(f.calories * e.quantity)} kcal
                    </div>
                  </button>
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

      <button
        className="fab"
        onClick={() => setShowLog(true)}
        aria-label="Add food"
      >
        +
      </button>

      <QuickLogModal open={showLog} onClose={() => setShowLog(false)} />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          editing ? `Edit ${foodMap.get(editing.foodId)?.name ?? ""}` : ""
        }
      >
        {editing &&
          (() => {
            const f = foodMap.get(editing.foodId);
            if (!f) return null;
            const q = parseFloat(editQty) || 0;
            return (
              <div>
                <p className="muted small" style={{ marginTop: 0 }}>
                  Per {f.serving}: {f.calories} kcal · P{f.protein} / C{f.carbs}{" "}
                  / F{f.fat}
                </p>
                <div className="field">
                  <label>Servings</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    inputMode="decimal"
                    autoFocus
                    value={editQty}
                    onChange={(ev) => setEditQty(ev.target.value)}
                  />
                </div>
                <div className="card card-accent" style={{ marginBottom: 16 }}>
                  <div className="row">
                    <span className="muted small">Total</span>
                    <strong>{round(f.calories * q)} kcal</strong>
                  </div>
                </div>
                <div className="grid-2">
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      removeEntry(editing.id);
                      setEditing(null);
                    }}
                  >
                    Remove
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      updateEntry(editing.id, Math.max(0.25, q || 0.25));
                      setEditing(null);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}
