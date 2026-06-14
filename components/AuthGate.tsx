"use client";

import { useAuth } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { enabled, ready, session, signInWithGoogle } = useAuth();

  // Local-only mode (no Supabase keys configured): no login required.
  if (!enabled) return <>{children}</>;

  if (!ready)
    return (
      <main className="app">
        <p className="muted">Loading…</p>
      </main>
    );

  if (session) return <>{children}</>;

  return (
    <main className="app">
      <div style={{ paddingTop: "22vh", textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 22px",
            borderRadius: 20,
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
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
        <h1>Macro Tracker</h1>
        <p className="muted" style={{ marginTop: 4, marginBottom: 28 }}>
          Sign in to sync your macros across devices.
        </p>
        <button
          className="btn"
          onClick={signInWithGoogle}
          style={{ maxWidth: 320, margin: "0 auto" }}
        >
          Continue with Google
        </button>
        <p className="small muted" style={{ marginTop: 18 }}>
          You&apos;ll stay signed in on this device.
        </p>
      </div>
    </main>
  );
}
