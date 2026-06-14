"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { Food } from "@/lib/types";
import Modal from "@/components/Modal";
import AddFoodForm from "@/components/AddFoodForm";

export default function FoodsPage() {
  const { ready, foods, logFood, addFood } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [qty, setQty] = useState("1");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      foods.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [foods, query]
  );

  if (!ready) return <p className="muted">Loading…</p>;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const openLog = (f: Food) => {
    setSelected(f);
    setQty("1");
  };

  const doLog = () => {
    if (!selected) return;
    const q = parseFloat(qty) || 1;
    logFood(selected.id, q, todayStr());
    flash(`Logged ${q} × ${selected.name}`);
    setSelected(null);
  };

  return (
    <div>
      <div className="row">
        <h1>Foods</h1>
        <button className="btn btn-sm" onClick={() => setShowAdd(true)}>
          + New food
        </button>
      </div>

      {toast && (
        <div
          className="card"
          style={{ borderColor: "var(--green)", marginTop: 12 }}
        >
          ✅ {toast}
        </div>
      )}

      <input
        className="search"
        placeholder="Search foods…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginTop: 12 }}
      />

      <div className="card">
        {filtered.length === 0 ? (
          <p className="empty">No foods match “{query}”.</p>
        ) : (
          filtered.map((f) => (
            <div className="list-item" key={f.id}>
              <div>
                <div className="name">{f.name}</div>
                <div className="muted small">
                  {f.serving} · {f.calories} kcal · P{f.protein} C{f.carbs} F
                  {f.fat}
                </div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => openLog(f)}>
                Log
              </button>
            </div>
          ))
        )}
      </div>

      {/* Floating popup: log a food */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Add ${selected.name}` : ""}
      >
        {selected && (
          <div>
            <p className="muted small" style={{ marginTop: 0 }}>
              Per {selected.serving}: {selected.calories} kcal · P
              {selected.protein} / C{selected.carbs} / F{selected.fat}
            </p>
            <div className="field">
              <label>Servings</label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                inputMode="decimal"
                autoFocus
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="card-accent card" style={{ marginBottom: 16 }}>
              <div className="row">
                <span className="muted small">Total</span>
                <strong>
                  {Math.round(selected.calories * (parseFloat(qty) || 0))} kcal
                </strong>
              </div>
            </div>
            <div className="grid-2">
              <button
                className="btn btn-ghost"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button className="btn" onClick={doLog}>
                Add to Today
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating popup: create a new food */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="New food"
      >
        <AddFoodForm
          onAdd={(f) => {
            addFood(f);
            setShowAdd(false);
            flash(`Added "${f.name}" to your foods`);
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}
