import { createClient } from "@supabase/supabase-js";
import { db } from "./db";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export type SyncPayload = {
  startDateISO?: string;
  selectedDateISO?: string;
  logs: any[];
  planOverrides: any[];
  dayMeta: any[];
  exportedAt: number;
};

// собрать все данные из IndexedDB (Dexie)
export async function exportAll(): Promise<SyncPayload> {
  const [logs, planOverrides, dayMeta] = await Promise.all([
    db.logs.toArray(),
    db.planOverrides.toArray(),
    db.dayMeta.toArray(),
  ]);

  const startDateISO = (typeof window !== "undefined")
    ? window.localStorage.getItem("prikorm.startDateISO") ?? undefined
    : undefined;

  const selectedDateISO = (typeof window !== "undefined")
    ? window.localStorage.getItem("prikorm.selectedDateISO") ?? undefined
    : undefined;

  return {
    logs,
    planOverrides,
    dayMeta,
    startDateISO,
    selectedDateISO,
    exportedAt: Date.now(),
  };
}

// применить данные в IndexedDB
export async function importAll(payload: SyncPayload) {
  await db.transaction("rw", db.logs, db.planOverrides, db.dayMeta, async () => {
    await db.logs.clear();
    await db.planOverrides.clear();
    await db.dayMeta.clear();

    if (payload.logs?.length) await db.logs.bulkAdd(payload.logs);
    if (payload.planOverrides?.length) await db.planOverrides.bulkAdd(payload.planOverrides);
    if (payload.dayMeta?.length) await db.dayMeta.bulkAdd(payload.dayMeta);
  });

  if (typeof window !== "undefined") {
    if (payload.startDateISO) window.localStorage.setItem("prikorm.startDateISO", payload.startDateISO);
    if (payload.selectedDateISO) window.localStorage.setItem("prikorm.selectedDateISO", payload.selectedDateISO);
  }
}
