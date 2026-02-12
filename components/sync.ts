import { supabase } from "./supabase";
import { db } from "./db";

export type SyncPayload = {
  version: 1;
  exportedAt: number;
  startDateISO?: string;
  selectedDateISO?: string;
  logs: any[];
  planOverrides: any[];
  dayMeta: any[];
};

export async function exportAll(): Promise<SyncPayload> {
  const [logs, planOverrides, dayMeta] = await Promise.all([
    db.logs.toArray(),
    db.planOverrides.toArray(),
    db.dayMeta.toArray(),
  ]);

  const startDateISO =
    typeof window !== "undefined"
      ? window.localStorage.getItem("prikorm.startDateISO") ?? undefined
      : undefined;

  const selectedDateISO =
    typeof window !== "undefined"
      ? window.localStorage.getItem("prikorm.selectedDateISO") ?? undefined
      : undefined;

  return {
    version: 1,
    exportedAt: Date.now(),
    startDateISO,
    selectedDateISO,
    logs,
    planOverrides,
    dayMeta,
  };
}

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

export async function pushToCloud(familyCode: string) {
  const payload = await exportAll();

  const { error } = await supabase
    .from("family_state")
    .upsert({ family_code: familyCode, payload, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function pullFromCloud(familyCode: string): Promise<SyncPayload> {
  const { data, error } = await supabase
    .from("family_state")
    .select("payload")
    .eq("family_code", familyCode)
    .maybeSingle();

  if (error) throw error;
  if (!data?.payload) throw new Error("По этому коду в облаке пока нет данных. Сначала нажми «Отправить в облако».");

  return data.payload as SyncPayload;
}
