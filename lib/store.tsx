"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Food, LogEntry, Profile } from "./types";
import { DEFAULT_PROFILE, SAMPLE_FOODS } from "./sampleData";
import { supabase, supabaseEnabled } from "./supabase";
import { useAuth } from "./auth";

const KEYS = {
  foods: "mt.foods",
  entries: "mt.entries",
  profile: "mt.profile",
  sampleEdits: "mt.sampleEdits",
  snapshots: "mt.snapshots",
};

export const monthStr = (d = new Date()) => todayStr(d).slice(0, 7);

interface StoreValue {
  ready: boolean;
  foods: Food[]; // built-in samples + user foods
  entries: LogEntry[];
  profile: Profile;
  addFood: (f: Omit<Food, "id">) => Promise<Food> | Food;
  updateFood: (id: string, f: Omit<Food, "id">) => void;
  logFood: (foodId: string, quantity: number, date: string) => void;
  updateEntry: (id: string, quantity: number) => void;
  removeEntry: (id: string) => void;
  setProfile: (p: Profile) => void;
  entriesFor: (date: string) => LogEntry[];
  // Profile as it was for a given month ("YYYY-MM"); falls back to current.
  profileForMonth: (month: string) => Profile;
}

const StoreContext = createContext<StoreValue | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// --- row <-> model mappers (Supabase) ---
const foodFromRow = (r: any): Food => ({
  id: r.id,
  name: r.name,
  serving: r.serving,
  calories: Number(r.calories),
  protein: Number(r.protein),
  carbs: Number(r.carbs),
  fat: Number(r.fat),
});
const entryFromRow = (r: any): LogEntry => ({
  id: r.id,
  foodId: r.food_id,
  quantity: Number(r.quantity),
  date: r.date,
});
const profileFromRow = (r: any): Profile => ({
  age: Number(r.age),
  sex: r.sex,
  weightKg: Number(r.weight_kg),
  heightCm: Number(r.height_cm),
  activity: r.activity,
  goal: r.goal,
  threshold: r.threshold ?? "mid",
});
const profileToRow = (p: Profile) => ({
  age: p.age,
  sex: p.sex,
  weight_kg: p.weightKg,
  height_cm: p.heightCm,
  activity: p.activity,
  goal: p.goal,
  threshold: p.threshold,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const remote = supabaseEnabled && !!userId;

  const [ready, setReady] = useState(false);
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  // Edits to built-in sample foods, kept client-side (samples aren't in the DB).
  const [sampleEdits, setSampleEdits] = useState<
    Record<string, Partial<Food>>
  >({});
  // Per-month frozen profile snapshots ("YYYY-MM" -> Profile).
  const [snapshots, setSnapshots] = useState<Record<string, Profile>>({});

  // Load data whenever the backend / user changes
  useEffect(() => {
    let cancelled = false;

    async function loadRemote() {
      setReady(false);
      // Profile (create a default row on first sign-in)
      const { data: prof } = await supabase!
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!prof) {
        await supabase!
          .from("profiles")
          .insert({ user_id: userId, ...profileToRow(DEFAULT_PROFILE) });
        if (!cancelled) setProfileState(DEFAULT_PROFILE);
      } else if (!cancelled) {
        setProfileState(profileFromRow(prof));
      }

      const { data: fds } = await supabase!
        .from("foods")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: ents } = await supabase!
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: snaps } = await supabase!
        .from("profile_snapshots")
        .select("*");

      if (cancelled) return;
      setUserFoods((fds ?? []).map(foodFromRow));
      setEntries((ents ?? []).map(entryFromRow));
      const snapMap: Record<string, Profile> = {};
      for (const s of snaps ?? []) snapMap[s.month] = profileFromRow(s);
      setSnapshots(snapMap);
      setReady(true);
    }

    if (!supabaseEnabled) {
      // Local-only mode
      setUserFoods(load(KEYS.foods, []));
      setEntries(load(KEYS.entries, []));
      setProfileState(load(KEYS.profile, DEFAULT_PROFILE));
      setSnapshots(load(KEYS.snapshots, {}));
      setReady(true);
    } else if (userId) {
      loadRemote();
    } else {
      // Signed out: AuthGate will show the login screen instead of pages
      setUserFoods([]);
      setEntries([]);
      setProfileState(DEFAULT_PROFILE);
      setSnapshots({});
      setReady(true);
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Persist to localStorage only in local-only mode
  useEffect(() => {
    if (!supabaseEnabled && ready)
      window.localStorage.setItem(KEYS.foods, JSON.stringify(userFoods));
  }, [userFoods, ready]);
  useEffect(() => {
    if (!supabaseEnabled && ready)
      window.localStorage.setItem(KEYS.entries, JSON.stringify(entries));
  }, [entries, ready]);
  useEffect(() => {
    if (!supabaseEnabled && ready)
      window.localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  }, [profile, ready]);
  useEffect(() => {
    if (!supabaseEnabled && ready)
      window.localStorage.setItem(KEYS.snapshots, JSON.stringify(snapshots));
  }, [snapshots, ready]);

  // Load client-side sample edits once on mount
  useEffect(() => {
    setSampleEdits(load(KEYS.sampleEdits, {}));
  }, []);

  // Freeze the current month's profile the first time we see this month, so
  // later profile edits in a *new* month don't change this month's totals.
  useEffect(() => {
    if (!ready) return;
    const m = monthStr();
    if (snapshots[m]) return;
    setSnapshots((prev) => ({ ...prev, [m]: profile }));
    if (remote)
      supabase!
        .from("profile_snapshots")
        .upsert({ user_id: userId, month: m, ...profileToRow(profile) })
        .then(() => {});
  }, [ready, snapshots, profile, remote, userId]);

  const foods = useMemo(
    () => [
      ...SAMPLE_FOODS.map((f) =>
        sampleEdits[f.id] ? { ...f, ...sampleEdits[f.id] } : f
      ),
      ...userFoods,
    ],
    [userFoods, sampleEdits]
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      foods,
      entries,
      profile,
      addFood: async (f) => {
        if (remote) {
          const { data, error } = await supabase!
            .from("foods")
            .insert({ user_id: userId, ...f })
            .select()
            .single();
          if (error || !data) {
            const fallback: Food = { ...f, id: newId() };
            setUserFoods((p) => [fallback, ...p]);
            return fallback;
          }
          const food = foodFromRow(data);
          setUserFoods((p) => [food, ...p]);
          return food;
        }
        const food: Food = { ...f, id: newId() };
        setUserFoods((p) => [food, ...p]);
        return food;
      },
      updateFood: (id, f) => {
        const isUserFood = userFoods.some((x) => x.id === id);
        if (isUserFood) {
          setUserFoods((p) =>
            p.map((x) => (x.id === id ? { ...f, id } : x))
          );
          if (remote)
            supabase!.from("foods").update(f).eq("id", id).then(() => {});
        } else {
          // Built-in sample food: store an override locally (samples aren't in DB)
          setSampleEdits((prev) => {
            const next = { ...prev, [id]: f };
            window.localStorage.setItem(KEYS.sampleEdits, JSON.stringify(next));
            return next;
          });
        }
      },
      logFood: (foodId, quantity, date) => {
        if (remote) {
          const temp: LogEntry = { id: newId(), foodId, quantity, date };
          setEntries((p) => [temp, ...p]);
          supabase!
            .from("entries")
            .insert({ user_id: userId, food_id: foodId, quantity, date })
            .select()
            .single()
            .then(({ data }) => {
              if (data)
                setEntries((p) =>
                  p.map((e) => (e.id === temp.id ? entryFromRow(data) : e))
                );
            });
          return;
        }
        setEntries((p) => [{ id: newId(), foodId, quantity, date }, ...p]);
      },
      updateEntry: (id, quantity) => {
        setEntries((p) =>
          p.map((e) => (e.id === id ? { ...e, quantity } : e))
        );
        if (remote)
          supabase!.from("entries").update({ quantity }).eq("id", id).then(() => {});
      },
      removeEntry: (id) => {
        setEntries((p) => p.filter((e) => e.id !== id));
        if (remote) supabase!.from("entries").delete().eq("id", id).then(() => {});
      },
      setProfile: (p) => {
        setProfileState(p);
        const m = monthStr();
        // The current month tracks the latest profile; past months stay frozen.
        setSnapshots((prev) => ({ ...prev, [m]: p }));
        if (remote) {
          supabase!
            .from("profiles")
            .upsert({ user_id: userId, ...profileToRow(p) })
            .then(() => {});
          supabase!
            .from("profile_snapshots")
            .upsert({ user_id: userId, month: m, ...profileToRow(p) })
            .then(() => {});
        }
      },
      entriesFor: (date) => entries.filter((e) => e.date === date),
      profileForMonth: (month) => snapshots[month] ?? profile,
    }),
    [ready, foods, userFoods, entries, profile, snapshots, remote, userId]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const todayStr = (d = new Date()) => d.toISOString().slice(0, 10);
