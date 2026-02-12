import { db, DayMetaOverride, PlanOverride } from "./db";

export async function upsertPlanOverride(dayIndex: number, time: string, planText: string) {
  const now = Date.now();
  const existing = await db.planOverrides.where({ dayIndex, time }).first();
  if (!existing) {
    await db.planOverrides.add({ dayIndex, time, planText, updatedAt: now } as PlanOverride);
    return;
  }
  await db.planOverrides.update(existing.id!, { planText, updatedAt: now });
}

export async function resetPlanOverride(dayIndex: number, time: string) {
  const existing = await db.planOverrides.where({ dayIndex, time }).first();
  if (existing) await db.planOverrides.delete(existing.id!);
}

export async function upsertDayFocus(dayIndex: number, focus: string) {
  const now = Date.now();
  const existing = await db.dayMeta.where({ dayIndex }).first();
  if (!existing) {
    await db.dayMeta.add({ dayIndex, focus, updatedAt: now } as DayMetaOverride);
    return;
  }
  await db.dayMeta.update(existing.id!, { focus, updatedAt: now });
}

export async function resetDayFocus(dayIndex: number) {
  const existing = await db.dayMeta.where({ dayIndex }).first();
  if (existing) await db.dayMeta.delete(existing.id!);
}

export type OverridesExport = {
  planOverrides: Array<Pick<PlanOverride, "dayIndex" | "time" | "planText" | "updatedAt">>;
  dayMeta: Array<Pick<DayMetaOverride, "dayIndex" | "focus" | "updatedAt">>;
};

export async function exportOverrides(): Promise<OverridesExport> {
  const planOverrides = await db.planOverrides.toArray();
  const dayMeta = await db.dayMeta.toArray();
  return {
    planOverrides: planOverrides.map(o => ({ dayIndex: o.dayIndex, time: o.time, planText: o.planText, updatedAt: o.updatedAt })),
    dayMeta: dayMeta.map(m => ({ dayIndex: m.dayIndex, focus: m.focus, updatedAt: m.updatedAt })),
  };
}

export async function importOverrides(payload: OverridesExport) {
  // Заменяем полностью (просто и понятно)
  await db.transaction("rw", db.planOverrides, db.dayMeta, async () => {
    await db.planOverrides.clear();
    await db.dayMeta.clear();
    if (payload.planOverrides?.length) {
      await db.planOverrides.bulkAdd(payload.planOverrides.map(o => ({ ...o })) as any);
    }
    if (payload.dayMeta?.length) {
      await db.dayMeta.bulkAdd(payload.dayMeta.map(m => ({ ...m })) as any);
    }
  });
}
