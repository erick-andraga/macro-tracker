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
};

interface StoreValue {
  ready: boolean;
  foods: Food[]; // built-in samples + user foods
  entries: LogEntry[];
  profile: Profile;
  addFood: (f: Omit<Food, "id">) => Promise<Food> | Food;
  logFood: (foodId: string, quantity: number, date: string) => void;
  removeEntry: (id: string) => void;
  setProfile: (p: Profile) => void;
  entriesFor: (date: string) => LogEntry[];
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
});
const profileToRow = (p: Profile) => ({
  age: p.age,
  sex: p.sex,
  weight_kg: p.weightKg,
  height_cm: p.heightCm,
  activity: p.activity,
  goal: p.goal,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const remote = supabaseEnabled && !!userId;

  const [ready, setReady] = useState(false);
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);

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

      if (cancelled) return;
      setUserFoods((fds ?? []).map(foodFromRow));
      setEntries((ents ?? []).map(entryFromRow));
      setReady(true);
    }

    if (!supabaseEnabled) {
      // Local-only mode
      setUserFoods(load(KEYS.foods, []));
      setEntries(load(KEYS.entries, []));
      setProfileState(load(KEYS.profile, DEFAULT_PROFILE));
      setReady(true);
    } else if (userId) {
      loadRemote();
    } else {
      // Signed out: AuthGate will show the login screen instead of pages
      setUserFoods([]);
      setEntries([]);
      setProfileState(DEFAULT_PROFILE);
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

  const foods = useMemo(() => [...SAMPLE_FOODS, ...userFoods], [userFoods]);

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
      removeEntry: (id) => {
        setEntries((p) => p.filter((e) => e.id !== id));
        if (remote) supabase!.from("entries").delete().eq("id", id).then(() => {});
      },
      setProfile: (p) => {
        setProfileState(p);
        if (remote)
          supabase!
            .from("profiles")
            .upsert({ user_id: userId, ...profileToRow(p) })
            .then(() => {});
      },
      entriesFor: (date) => entries.filter((e) => e.date === date),
    }),
    [ready, foods, entries, profile, remote, userId]
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

export const todayStr = () => new Date().toISOString().slice(0, 10);
