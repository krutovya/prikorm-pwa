import planFile from "../data/plan.json";
import { PlanFile } from "../components/types";
import { BottomNav } from "../components/BottomNav";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../components/db";
import {
  exportOverrides,
  importOverrides,
  resetDayFocus,
  resetPlanOverride,
  upsertDayFocus,
  upsertPlanOverride,
} from "../components/planEdits";
import { Badge, PrimaryButton, SecondaryButton } from "../components/ui";
import { detectCategory } from "../components/categories";

const PLAN = planFile as unknown as PlanFile;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoToDate(iso: string) {
  return new Date(iso + "T00:00:00");
}

function dateToISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function PlanPage() {
  const [editMode, setEditMode] = useState(false);
  const [importText, setImportText] = useState("");

  // ✅ Подтягиваем дату старта (для вычисления текущего дня)
  const [startDateISO, setStartDateISO] = useState<string>(todayISO());
  const [startLoaded, setStartLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("prikorm.startDateISO");
      if (saved) setStartDateISO(saved);
    } catch {
      // ignore
    } finally {
      setStartLoaded(true);
    }
  }, []);

  // ✅ вычисляем текущий dayIndex по дате старта и сегодняшнему дню
  const todayDayIndex = useMemo(() => {
    if (!startLoaded) return 1;
    const start = isoToDate(startDateISO);
    const now = isoToDate(todayISO());
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), PLAN.days.length);
  }, [startDateISO, startLoaded]);

  // ✅ Refs для скролла к текущему дню
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ✅ Скролл к текущему дню при открытии страницы
  useEffect(() => {
    const el = dayRefs.current[todayDayIndex];
    if (!el) return;
    // небольшой таймаут, чтобы DOM точно построился
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [todayDayIndex]);

  // --- Overrides (правки плана) ---
  const overrides = useLiveQuery(async () => {
    const [o, m] = await Promise.all([db.planOverrides.toArray(), db.dayMeta.toArray()]);
    return { o, m };
  }, []);

  const merged = useMemo(() => {
    const map = new Map<string, string>();
    const focusMap = new Map<number, string>();
    (overrides?.o ?? []).forEach((x) => map.set(`${x.dayIndex}|${x.time}`, x.planText));
    (overrides?.m ?? []).forEach((x) => {
      if (x.focus) focusMap.set(x.dayIndex, x.focus);
    });

    return PLAN.days.map((d) => ({
      ...d,
      focus: focusMap.get(d.dayIndex) ?? d.focus,
      feedings: d.feedings.map((f) => ({
        ...f,
        planText: map.get(`${d.dayIndex}|${f.time}`) ?? f.planText,
      })),
    }));
  }, [overrides]);

  // ✅ Логи всех дней (для подсветки "всё выполнено")
  const allLogs = useLiveQuery(async () => {
    return db.logs.toArray();
  }, []);

  // ✅ Карта выполнений: ключ = `${dayIndex}|${dateISO}` => doneCount
  const doneMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of allLogs ?? []) {
      if (!l.done) continue;
      const key = `${l.dayIndex}|${l.dateISO}`;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [allLogs]);

  // ✅ Для каждого dayIndex вычисляем его реальную dateISO = startDate + (dayIndex-1)
  function dayIndexToDateISO(dayIndex: number) {
    const start = isoToDate(startDateISO);
    const d = new Date(start);
    d.setDate(d.getDate() + (dayIndex - 1));
    return dateToISO(d);
  }

  async function onExport() {
    const payload = await exportOverrides();
    const txt = JSON.stringify(payload, null, 2);
    await navigator.clipboard.writeText(txt);
    alert("Экспорт скопирован в буфер обмена (JSON)");
  }

  async function onImport() {
    try {
      const parsed = JSON.parse(importText);
      await importOverrides(parsed);
      setImportText("");
      alert("Импорт выполнен");
    } catch {
      alert("Не удалось импортировать: проверь JSON");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">План</div>
            <div className="mt-1 text-sm text-gray-600">
              180 дней • 6 кормлений в день • текущий день: {todayDayIndex}
            </div>
          </div>

          <PrimaryButton
            onClick={() => setEditMode((v) => !v)}
            className={editMode ? "bg-emerald-600" : ""}
          >
            {editMode ? "✅ Режим редактирования" : "Редактировать"}
          </PrimaryButton>
        </div>

        {/* блок импорта/экспорта правок (только в editMode) */}
        {editMode && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-bold">Резервная копия / перенос</div>
            <div className="mt-1 text-xs text-gray-600">
              Экспорт/импорт сохраняет только правки плана (не отметки кормлений).
            </div>

            <div className="mt-3 flex gap-2">
              <SecondaryButton onClick={onExport} className="w-full">
                Экспорт (копировать JSON)
              </SecondaryButton>
            </div>

            <div className="mt-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Вставь сюда JSON и нажми Импорт"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                rows={4}
              />
              <div className="mt-2 flex gap-2">
                <PrimaryButton onClick={onImport} className="w-full">
                  Импорт
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {merged.map((d) => {
            const dateISO = startLoaded ? dayIndexToDateISO(d.dayIndex) : "";
            const doneCount = startLoaded ? (doneMap.get(`${d.dayIndex}|${dateISO}`) ?? 0) : 0;
            const allDone = doneCount >= (d.feedings?.length ?? 6);

            // ✅ зелёная подсветка для полностью выполненных дней
            const wrapClass =
              "rounded-2xl border p-4 " +
              (allDone
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-200 bg-white");

            return (
              <div
                key={d.dayIndex}
                ref={(el) => {
                  dayRefs.current[d.dayIndex] = el;
                }}
                className={wrapClass}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-gray-900">
                    День {d.dayIndex}
                    {d.dayIndex === todayDayIndex && (
                      <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white">
                        СЕГОДНЯ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge>Неделя {d.week ?? "-"}</Badge>
                    {startLoaded && (
                      <Badge tone={allDone ? "ok" : "neutral"}>
                        {doneCount}/{d.feedings.length}
                      </Badge>
                    )}
                  </div>
                </div>

                {d.focus && (
                  <div className="mt-2">
                    {!editMode ? (
                      <div className="text-xs text-gray-600">{d.focus}</div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          defaultValue={d.focus}
                          onBlur={(e) => upsertDayFocus(d.dayIndex, e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                          placeholder="Фокус дня / недели"
                        />
                        <SecondaryButton
                          onClick={() => resetDayFocus(d.dayIndex)}
                          className="w-full"
                        >
                          Сбросить фокус (как в файле)
                        </SecondaryButton>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  {d.feedings.map((f) => {
                    const cat = detectCategory(f.planText);
                    return (
                      <div key={f.time} className="flex gap-3">
                        <div className={"w-2 rounded-full " + cat.colorClass} />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-900">
                            {f.time} <span className="ml-1">{cat.icon}</span>
                          </div>

                          {!editMode ? (
                            <div className="text-xs text-gray-700 whitespace-pre-wrap">{f.planText}</div>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={f.planText}
                                onBlur={(e) => upsertPlanOverride(d.dayIndex, f.time, e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                                rows={3}
                              />
                              <SecondaryButton
                                onClick={() => resetPlanOverride(d.dayIndex, f.time)}
                                className="w-full"
                              >
                                Сбросить (как в файле)
                              </SecondaryButton>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
