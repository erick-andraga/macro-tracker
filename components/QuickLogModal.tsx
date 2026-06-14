"use client";

import { useMemo, useState } from "react";
import { useStore, todayStr } from "@/lib/store";
import { Food } from "@/lib/types";
import Modal from "./Modal";
import AddFoodForm from "./AddFoodForm";

export default function QuickLogModal({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date?: string;
}) {
  const { foods, logFood, addFood } = useStore();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Food | null>(null);
  const [qty, setQty] = useState("1");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(
    () =>
      foods.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [foods, query]
  );

  const close = () => {
    setQuery("");
    setPicked(null);
    setQty("1");
    setShowCreate(false);
    onClose();
  };

  const pick = (f: Food) => {
    setPicked(f);
    setQty("1");
  };

  const confirm = () => {
    if (!picked) return;
    logFood(picked.id, parseFloat(qty) || 1, date ?? todayStr());
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={picked ? `Add ${picked.name}` : "Add food"}
    >
      {!picked ? (
        <div>
          <div className="row" style={{ marginBottom: 12, gap: 8 }}>
            <input
              className="search"
              placeholder="Search foods…"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
            <button
              className="btn btn-sm"
              style={{ flexShrink: 0 }}
              onClick={() => setShowCreate(true)}
            >
              + New
            </button>
          </div>
          <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p className="empty">No foods match “{query}”.</p>
            ) : (
              filtered.map((f) => (
                <div className="list-item" key={f.id}>
                  <div>
                    <div className="name">{f.name}</div>
                    <div className="muted small">
                      {f.serving} · {f.calories} kcal
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => pick(f)}
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="muted small" style={{ marginTop: 0 }}>
            Per {picked.serving}: {picked.calories} kcal · P{picked.protein} / C
            {picked.carbs} / F{picked.fat}
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
          <div className="card card-accent" style={{ marginBottom: 16 }}>
            <div className="row">
              <span className="muted small">Total</span>
              <strong>
                {Math.round(picked.calories * (parseFloat(qty) || 0))} kcal
              </strong>
            </div>
          </div>
          <div className="grid-2">
            <button className="btn btn-ghost" onClick={() => setPicked(null)}>
              Back
            </button>
            <button className="btn" onClick={confirm}>
              Add to Today
            </button>
          </div>
        </div>
      )}

      {/* Nested popup: create a new food, layered above */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New food"
        z={110}
      >
        <AddFoodForm
          onAdd={async (f) => {
            const created = await addFood(f);
            setShowCreate(false);
            pick(created);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </Modal>
  );
}
