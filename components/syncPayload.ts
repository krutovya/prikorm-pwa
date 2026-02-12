import { db } from "./db";

/**
 * Что синхронизируем:
 * - logs (отметки кормлений + факт/реакция/заметка)
 * - planOverrides (правки текста плана)
 * - dayMeta (фокус дня)
 *
 * Важно: формат payload должен быть стабильным.
 */

export async function exportAllForSync() {
  const [logs, planOverrides, dayMeta] = await Promise.all([
    db.logs.toArray(),
    db.planOverrides.toArray(),
    db.dayMeta.toArray(),
  ]);

  return {
    v: 1,
    exportedAt: new Date().toISOString(),
    logs,
    planOverrides,
    dayMeta,
  };
}

/**
 * Импорт: делаем “слияние по updatedAt”.
 * Для каждой сущности — если запись новее, заменяем.
 * Если локально есть запись, а удаление не поддерживаем — оставляем.
 */
export async function importAllForSync(payload: any) {
  if (!payload) return;

  const remoteLogs = Array.isArray(payload.logs) ? payload.logs : [];
  const remoteOverrides = Array.isArray(payload.planOverrides) ? payload.planOverrides : [];
  const remoteMeta = Array.isArray(payload.dayMeta) ? payload.dayMeta : [];

  await db.transaction("rw", db.logs, db.planOverrides, db.dayMeta, async () => {
    // LOGS: ключ (dayIndex|dateISO|time)
    const localLogs = await db.logs.toArray();
    const lmap = new Map<string, any>();
    localLogs.forEach((x) => lmap.set(`${x.dayIndex}|${x.dateISO}|${x.time}`, x));

    for (const r of remoteLogs) {
      const key = `${r.dayIndex}|${r.dateISO}|${r.time}`;
      const l = lmap.get(key);

      if (!l) {
        // новая запись
        await db.logs.add(r);
      } else {
        const lt = Number(l.updatedAt || 0);
        const rt = Number(r.updatedAt || 0);
        if (rt > lt) {
          await db.logs.update(l.id, r);
        }
      }
    }

    // planOverrides: ключ (dayIndex|time)
    const localO = await db.planOverrides.toArray();
    const omap = new Map<string, any>();
    localO.forEach((x) => omap.set(`${x.dayIndex}|${x.time}`, x));

    for (const r of remoteOverrides) {
      const key = `${r.dayIndex}|${r.time}`;
      const l = omap.get(key);
      if (!l) {
        await db.planOverrides.add(r);
      } else {
        const lt = Number(l.updatedAt || 0);
        const rt = Number(r.updatedAt || 0);
        if (rt > lt) {
          await db.planOverrides.update(l.id, r);
        }
      }
    }

    // dayMeta: ключ (dayIndex)
    const localM = await db.dayMeta.toArray();
    const mmap = new Map<number, any>();
    localM.forEach((x) => mmap.set(x.dayIndex, x));

    for (const r of remoteMeta) {
      const l = mmap.get(r.dayIndex);
      if (!l) {
        await db.dayMeta.add(r);
      } else {
        const lt = Number(l.updatedAt || 0);
        const rt = Number(r.updatedAt || 0);
        if (rt > lt) {
          await db.dayMeta.update(l.id, r);
        }
      }
    }
  });
}
