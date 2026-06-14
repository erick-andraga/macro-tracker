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

const KEYS = {
  foods: "mt.foods",
  entries: "mt.entries",
  profile: "mt.profile",
};

interface StoreValue {
  ready: boolean;
  foods: Food[];
  entries: LogEntry[];
  profile: Profile;
  addFood: (f: Omit<Food, "id">) => Food;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [foods, setFoods] = useState<Food[]>(SAMPLE_FOODS);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setFoods(load(KEYS.foods, SAMPLE_FOODS));
    setEntries(load(KEYS.entries, []));
    setProfileState(load(KEYS.profile, DEFAULT_PROFILE));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(KEYS.foods, JSON.stringify(foods));
  }, [foods, ready]);
  useEffect(() => {
    if (ready)
      window.localStorage.setItem(KEYS.entries, JSON.stringify(entries));
  }, [entries, ready]);
  useEffect(() => {
    if (ready)
      window.localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  }, [profile, ready]);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      foods,
      entries,
      profile,
      addFood: (f) => {
        const food: Food = { ...f, id: newId() };
        setFoods((prev) => [food, ...prev]);
        return food;
      },
      logFood: (foodId, quantity, date) =>
        setEntries((prev) => [
          { id: newId(), foodId, quantity, date },
          ...prev,
        ]),
      removeEntry: (id) =>
        setEntries((prev) => prev.filter((e) => e.id !== id)),
      setProfile: (p) => setProfileState(p),
      entriesFor: (date) => entries.filter((e) => e.date === date),
    }),
    [ready, foods, entries, profile]
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
