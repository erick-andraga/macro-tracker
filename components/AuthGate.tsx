"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { enabled, ready, session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Local-only mode (no Supabase keys configured): no login required.
  if (!enabled) return <>{children}</>;

  if (!ready)
    return (
      <main className="app">
        <p className="muted">Loading…</p>
      </main>
    );

  if (session) return <>{children}</>;

  const submit = async () => {
    setMsg(null);
    if (!email.trim() || !password) {
      setMsg("Enter your email and password.");
      return;
    }
    setBusy(true);
    const res =
      mode === "in"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (res.error) setMsg(res.error);
    else if (res.info) setMsg(res.info);
  };

  return (
    <main className="app">
      <div style={{ paddingTop: "16vh" }}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 22px",
            borderRadius: 20,
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          M
        </div>
        <h1 style={{ textAlign: "center" }}>Macro Tracker</h1>
        <p
          className="muted"
          style={{ marginTop: 4, marginBottom: 24, textAlign: "center" }}
        >
          {mode === "in"
            ? "Sign in to sync your macros."
            : "Create an account to get started."}
        </p>

        <div className="card">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="••••••••"
            />
          </div>

          {msg && (
            <p className="small" style={{ color: "var(--protein)" }}>
              {msg}
            </p>
          )}

          <button className="btn" onClick={submit} disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "in"
                ? "Sign in"
                : "Create account"}
          </button>
        </div>

        <p className="small muted" style={{ textAlign: "center" }}>
          {mode === "in" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode((m) => (m === "in" ? "up" : "in"));
              setMsg(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-2)",
              fontWeight: 600,
              padding: 0,
            }}
          >
            {mode === "in" ? "Sign up" : "Sign in"}
          </button>
        </p>
        <p className="small muted" style={{ textAlign: "center", marginTop: 6 }}>
          You&apos;ll stay signed in on this device.
        </p>
      </div>
    </main>
  );
}
