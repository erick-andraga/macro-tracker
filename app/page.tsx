"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { entryTotals, goalMacros, round } from "@/lib/macros";
import { CalorieBar, MacroBars } from "@/components/MacroDisplay";
import QuickLogModal from "@/components/QuickLogModal";
import Modal from "@/components/Modal";
import type { LogEntry } from "@/lib/types";

// Shift a YYYY-MM-DD calendar date by N days (timezone-independent).
const shiftDate = (ds: string, delta: number) => {
  const [y, m, d] = ds.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
};

export default function TodayPage() {
  const { ready, foods, entriesFor, profileForMonth, updateEntry, removeEntry } =
    useStore();
  const [date, setDate] = useState(todayStr());
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [editQty, setEditQty] = useState("1");
  const [pendingDelete, setPendingDelete] = useState<LogEntry | null>(null);

  const openEdit = (e: LogEntry) => {
    setEditing(e);
    setEditQty(String(e.quantity));
  };

  const todays = useMemo(
    () => (ready ? entriesFor(date) : []),
    [ready, date, entriesFor]
  );
  const consumed = useMemo(() => entryTotals(todays, foods), [todays, foods]);
  const goal = useMemo(
    () => goalMacros(profileForMonth(date.slice(0, 7))),
    [profileForMonth, date]
  );
  const foodMap = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  if (!ready) return <p className="muted">Loading…</p>;

  const today = todayStr();
  const canGoNext = date < today;
  const isToday = date === today;
  const isYesterday = date === shiftDate(today, -1);
  const [y, m, d] = date.split("-").map(Number);
  const fullDate = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(
    undefined,
    { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }
  );
  const label = isToday ? "Today" : isYesterday ? "Yesterday" : fullDate;

  return (
    <div>
      <div className="cal-head" style={{ marginBottom: 16 }}>
        <button
          className="cal-nav"
          onClick={() => setDate((ds) => shiftDate(ds, -1))}
          aria-label="Previous day"
        >
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{label}</h1>
          {!isToday && <div className="muted small">{fullDate}</div>}
        </div>
        <button
          className="cal-nav"
          onClick={() => canGoNext && setDate((ds) => shiftDate(ds, 1))}
          disabled={!canGoNext}
          aria-label="Next day"
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        >
          ›
        </button>
      </div>

      <div className="card">
        <CalorieBar consumed={consumed.calories} goal={goal.calories} />
      </div>

      <div className="card">
        <h2>Macros</h2>
        <MacroBars consumed={consumed} goal={goal} />
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{todays.length} Items Consumed</h2>
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

      <QuickLogModal
        open={showLog}
        onClose={() => setShowLog(false)}
        date={date}
      />

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
                      setPendingDelete(editing);
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

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Remove food?"
      >
        {pendingDelete && (
          <div>
            <p className="muted" style={{ marginTop: 0 }}>
              Remove{" "}
              <strong>
                {foodMap.get(pendingDelete.foodId)?.name ?? "this food"}
              </strong>{" "}
              from this day&apos;s log?
            </p>
            <div className="grid-2">
              <button
                className="btn btn-ghost"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  removeEntry(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
