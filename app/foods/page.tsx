"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Food } from "@/lib/types";
import Modal from "@/components/Modal";
import AddFoodForm from "@/components/AddFoodForm";

export default function FoodsPage() {
  const { ready, foods, addFood, updateFood } = useStore();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Food | null>(null);
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

  return (
    <div>
      <h1>Foods</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Tap a food to edit it.
      </p>

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
                  {f.serving} · {f.calories} kcal
                </div>
                <div className="small" style={{ marginTop: 2 }}>
                  <span style={{ color: "var(--protein)" }}>
                    Protein {f.protein}g
                  </span>
                  <span className="muted"> - </span>
                  <span style={{ color: "var(--carbs)" }}>Carbs {f.carbs}g</span>
                  <span className="muted"> - </span>
                  <span style={{ color: "var(--fat)" }}>Fat {f.fat}g</span>
                </div>
              </div>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setEditing(f)}
              >
                Edit
              </button>
            </div>
          ))
        )}
      </div>

      <button
        className="fab"
        onClick={() => setShowAdd(true)}
        aria-label="New food"
      >
        +
      </button>

      {/* Floating popup: edit a food */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : ""}
      >
        {editing && (
          <AddFoodForm
            initial={editing}
            submitLabel="Save changes"
            onAdd={(f) => {
              updateFood(editing.id, f);
              setEditing(null);
              flash(`Updated "${f.name}"`);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Floating popup: create a new food */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New food">
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
