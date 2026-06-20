"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { entryTotals, goalMacros, round } from "@/lib/macros";
import { MacroBars, CalorieRing, CalorieBar } from "@/components/MacroDisplay";
import Modal from "@/components/Modal";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Day color by calories vs goal: red (under) -> green (met) -> purple (exceeded)
const RED = [239, 68, 68];
const GREEN = [34, 197, 94];
const PURPLE = [168, 85, 247];
const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a
    .map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))))
    .join(", ")})`;
function dayColor(ratio: number) {
  return ratio <= 1 ? mix(RED, GREEN, ratio) : mix(GREEN, PURPLE, (ratio - 1) / 0.3);
}

export default function CalendarPage() {
  const { ready, foods, entries, profileForMonth } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  // Goals use the profile snapshot for the month being viewed, so editing your
  // current profile never changes past months.
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const goal = useMemo(
    () => goalMacros(profileForMonth(monthKey)),
    [profileForMonth, monthKey]
  );

  // Map date -> calories consumed that day
  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const f = foods.find((x) => x.id === e.foodId);
      if (!f) continue;
      map.set(e.date, (map.get(e.date) ?? 0) + f.calories * e.quantity);
    }
    return map;
  }, [entries, foods]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    return arr;
  }, [year, month]);

  if (!ready) return <p className="muted">Loading…</p>;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const today = todayStr();
  const selectedEntries = selected
    ? entries.filter((e) => e.date === selected)
    : [];
  const selectedTotals = entryTotals(selectedEntries, foods);
  const foodMap = new Map(foods.map((f) => [f.id, f]));

  // Monthly average (over days that have at least one logged food)
  const monthEntries = entries.filter((e) => e.date.startsWith(monthKey));
  const loggedDays = new Set(monthEntries.map((e) => e.date)).size;
  const monthTotals = entryTotals(monthEntries, foods);
  const avg = {
    calories: loggedDays ? monthTotals.calories / loggedDays : 0,
    protein: loggedDays ? monthTotals.protein / loggedDays : 0,
    carbs: loggedDays ? monthTotals.carbs / loggedDays : 0,
    fat: loggedDays ? monthTotals.fat / loggedDays : 0,
  };

  return (
    <div>
      <h1>History</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Tap a day to see what you logged.
      </p>

      <div className="card">
        <div className="cal-head">
          <button className="cal-nav" onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <strong>
            {MONTHS[month]} {year}
          </strong>
          <button className="cal-nav" onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {DOW.map((d, i) => (
            <div className="cal-dow" key={i}>
              {d}
            </div>
          ))}
        </div>

        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d === null)
              return <div className="cal-cell empty-cell" key={i} />;
            const ds = fmt(new Date(year, month, d));
            const kcal = byDate.get(ds);
            const classes = ["cal-cell"];
            if (ds === today) classes.push("today");
            if (ds === selected) classes.push("selected");
            const colored = !!kcal && ds !== selected;
            const bg = colored
              ? dayColor((kcal as number) / (goal.calories || 1))
              : undefined;
            return (
              <button
                key={i}
                className={classes.join(" ")}
                onClick={() => setSelected(ds)}
                style={
                  colored ? { background: bg, color: "#10131a" } : undefined
                }
              >
                <span>{d}</span>
                {kcal ? (
                  <span
                    className="cal-kcal"
                    style={colored ? { color: "rgba(0,0,0,0.6)" } : undefined}
                  >
                    {round(kcal)}
                  </span>
                ) : (
                  <span className="cal-kcal">&nbsp;</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>Monthly average</h2>
          <span className="pill">
            {loggedDays} {loggedDays === 1 ? "day" : "days"}
          </span>
        </div>
        {loggedDays === 0 ? (
          <p className="empty">No items logged this month.</p>
        ) : (
          <>
            <div style={{ margin: "14px 0 18px" }}>
              <CalorieBar consumed={avg.calories} goal={goal.calories} />
            </div>
            <MacroBars consumed={avg} goal={goal} />
          </>
        )}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : ""
        }
      >
        {selected && (
          <div>
            {selectedEntries.length === 0 ? (
              <p className="empty">Nothing logged on this day.</p>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <CalorieRing
                    consumed={selectedTotals.calories}
                    goal={goal.calories}
                  />
                </div>
                <div className="card" style={{ marginBottom: 16 }}>
                  <MacroBars consumed={selectedTotals} goal={goal} />
                </div>
                <h2>Logged ({selectedEntries.length})</h2>
                {selectedEntries.map((e) => {
                  const f = foodMap.get(e.foodId);
                  if (!f) return null;
                  return (
                    <div className="list-item" key={e.id}>
                      <div>
                        <div className="name">{f.name}</div>
                        <div className="muted small">
                          {e.quantity} × {f.serving}
                        </div>
                      </div>
                      <span className="muted small">
                        {round(f.calories * e.quantity)} kcal
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
