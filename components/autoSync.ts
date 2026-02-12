import { supabase } from "../lib/supabase";
import { db } from "./db";
import { exportAllForSync, importAllForSync } from "./syncPayload";

/**
 * Автосинхронизация:
 * - Пушим в Supabase при локальных изменениях (debounce)
 * - Периодически тянем из Supabase, если там новее
 * Конфликт: last-write-wins по updated_at на записи family_state.
 */

const LS_CODE = "prikorm.familyCode";
const LS_REMOTE_TS = "prikorm.remoteUpdatedAt"; // строка timestamptz

let started = false;
let pushTimer: any = null;
let pullTimer: any = null;

let isApplyingRemote = false; // чтобы не триггерить пуш после импорта
let isPushing = false;

function getFamilyCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LS_CODE);
}

function getLastRemoteTs(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LS_REMOTE_TS);
}

function setLastRemoteTs(ts: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_REMOTE_TS, ts);
}

function debouncePush(ms = 1200) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushNow();
  }, ms);
}

export async function pushNow() {
  const familyCode = getFamilyCode();
  if (!familyCode) return;

  if (isApplyingRemote) return; // не пушим во время применения облака
  if (isPushing) return;

  isPushing = true;
  try {
    const payload = await exportAllForSync();

    const { data, error } = await supabase
      .from("family_state")
      .upsert(
        { family_code: familyCode, payload, updated_at: new Date().toISOString() },
        { onConflict: "family_code" }
      )
      .select("updated_at")
      .single();

    if (error) throw error;
    if (data?.updated_at) setLastRemoteTs(data.updated_at);
  } catch (e) {
    // Можно убрать console.log, если не нужно
    console.log("AutoSync push error:", e);
  } finally {
    isPushing = false;
  }
}

export async function pullNow() {
  const familyCode = getFamilyCode();
  if (!familyCode) return;

  try {
    const { data, error } = await supabase
      .from("family_state")
      .select("payload, updated_at")
      .eq("family_code", familyCode)
      .maybeSingle();

    if (error) throw error;
    if (!data) return;

    const remoteTs = data.updated_at as string | null;
    if (!remoteTs) return;

    const lastTs = getLastRemoteTs();
    // Если это первое подтягивание — просто применяем
    // Если уже есть timestamp — применяем только если remote новее
    const shouldApply =
      !lastTs || new Date(remoteTs).getTime() > new Date(lastTs).getTime();

    if (!shouldApply) return;

    isApplyingRemote = true;
    try {
      await importAllForSync(data.payload);
      setLastRemoteTs(remoteTs);
    } finally {
      // маленькая задержка, чтобы изменения Dexie успели “улечься” и не вызвать пуш
      setTimeout(() => {
        isApplyingRemote = false;
      }, 800);
    }
  } catch (e) {
    console.log("AutoSync pull error:", e);
  }
}

/**
 * Запуск автосинхронизации (вызываем один раз в приложении).
 * intervalMs: частота pull из облака
 */
export function startAutoSync(intervalMs = 15000) {
  if (started) return;
  started = true;

  if (typeof window === "undefined") return;

  // 1) Сразу подтянуть при старте
  void pullNow();

  // 2) Пулл по таймеру
  pullTimer = setInterval(() => {
    // тянем только если онлайн
    if (navigator.onLine) void pullNow();
  }, intervalMs);

  // 3) Пулл при возвращении в приложение
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      void pullNow();
    }
  });

  // 4) Пулл при восстановлении сети
  window.addEventListener("online", () => {
    void pullNow();
  });

    // 5) Пуш при любых изменениях в Dexie (табличные хуки — без проблем с типами)
  const trigger = () => {
    if (!navigator.onLine) return;
    debouncePush(1200);
  };

  // Отметки кормлений
  db.logs.hook("creating", trigger);
  db.logs.hook("updating", trigger);
  db.logs.hook("deleting", trigger);

  // Правки плана
  db.planOverrides.hook("creating", trigger);
  db.planOverrides.hook("updating", trigger);
  db.planOverrides.hook("deleting", trigger);

  // Метаданные дня (фокус)
  db.dayMeta.hook("creating", trigger);
  db.dayMeta.hook("updating", trigger);
  db.dayMeta.hook("deleting", trigger);

}

export function stopAutoSync() {
  if (!started) return;
  started = false;
  if (pushTimer) clearTimeout(pushTimer);
  if (pullTimer) clearInterval(pullTimer);
}
