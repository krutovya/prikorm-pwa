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

function normalizeText(text: string) {
  return text.toLowerCase().trim();
}

export default function PlanPage() {
  const [editingDays, setEditingDays] = useState<number[]>([]);
  const [showTransferTools, setShowTransferTools] = useState(false);
  const [importText, setImportText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Подтягиваем дату старта (для вычисления текущего дня)
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

  // Вычисляем текущий dayIndex по дате старта и сегодняшнему дню
  const todayDayIndex = useMemo(() => {
    if (!startLoaded) return 1;
    const start = isoToDate(startDateISO);
    const now = isoToDate(todayISO());
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), PLAN.days.length);
  }, [startDateISO, startLoaded]);

  // Refs для скролла к текущему дню
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Скролл к текущему дню при открытии страницы
  useEffect(() => {
    if (searchQuery.trim()) return;
    const el = dayRefs.current[todayDayIndex];
    if (!el) return;

    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => clearTimeout(t);
  }, [todayDayIndex, searchQuery]);

  // Автофокус на поиск при открытии
  useEffect(() => {
    if (!searchOpen) return;

    const t = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => clearTimeout(t);
  }, [searchOpen]);

  // Overrides (правки плана)
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

  const normalizedQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);

  const filteredDays = useMemo(() => {
    if (!normalizedQuery) return merged;

    return merged.filter((d) => {
      const inFocus = normalizeText(d.focus ?? "").includes(normalizedQuery);
      const inFeedings = d.feedings.some((f) =>
        normalizeText(f.planText ?? "").includes(normalizedQuery)
      );
      return inFocus || inFeedings;
    });
  }, [merged, normalizedQuery]);

  // Логи всех дней (для подсветки "всё выполнено")
  const allLogs = useLiveQuery(async () => {
    return db.logs.toArray();
  }, []);

  // Карта выполнений: ключ = `${dayIndex}|${dateISO}` => doneCount
  const doneMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of allLogs ?? []) {
      if (!l.done) continue;
      const key = `${l.dayIndex}|${l.dateISO}`;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [allLogs]);

  // Для каждого dayIndex вычисляем его реальную dateISO = startDate + (dayIndex - 1)
  function dayIndexToDateISO(dayIndex: number) {
    const start = isoToDate(startDateISO);
    const d = new Date(start);
    d.setDate(d.getDate() + (dayIndex - 1));
    return dateToISO(d);
  }

  function toggleDayEditing(dayIndex: number) {
    setEditingDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((x) => x !== dayIndex) : [...prev, dayIndex]
    );
  }

  function openSearch() {
    setSearchOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
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
      <div
        className={
          searchOpen
            ? "sticky top-0 z-30 border-b border-gray-200 bg-gray-50/95 backdrop-blur"
            : ""
        }
      >
        <div className="mx-auto max-w-md px-4 pt-6 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-extrabold text-gray-900">План</div>
              <div className="mt-1 text-sm text-gray-600">
                180 дней • 6 кормлений в день • текущий день: {todayDayIndex}
              </div>
            </div>

            <SecondaryButton onClick={() => setShowTransferTools((v) => !v)}>
              {showTransferTools ? "Скрыть JSON" : "JSON / перенос"}
            </SecondaryButton>
          </div>

          {searchOpen && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-gray-900">Поиск по плану</div>
                <button
                  onClick={closeSearch}
                  className="rounded-full px-2 py-1 text-sm font-bold text-gray-500 hover:bg-gray-100"
                  aria-label="Закрыть поиск"
                >
                  ×
                </button>
              </div>

              <div className="mt-1 text-xs text-gray-600">
                Введи продукт или слово, например: брокколи, кабачок, каша
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Например: брокколи"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
                {searchQuery.trim() && (
                  <SecondaryButton onClick={() => setSearchQuery("")}>
                    Очистить
                  </SecondaryButton>
                )}
              </div>

              {normalizedQuery ? (
                <div className="mt-3 text-xs text-gray-600">
                  Найдено дней:{" "}
                  <span className="font-bold text-gray-900">{filteredDays.length}</span>
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-500">
                  Поиск покажет, в какие дни встречается нужный продукт
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-md px-4">
        {showTransferTools && (
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
          {filteredDays.length === 0 && normalizedQuery ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              По запросу <span className="font-bold text-gray-900">«{searchQuery}»</span>{" "}
              ничего не найдено.
            </div>
          ) : (
            filteredDays.map((d) => {
              const dateISO = startLoaded ? dayIndexToDateISO(d.dayIndex) : "";
              const doneCount = startLoaded ? (doneMap.get(`${d.dayIndex}|${dateISO}`) ?? 0) : 0;
              const allDone = doneCount >= (d.feedings?.length ?? 6);
              const isEditing = editingDays.includes(d.dayIndex);

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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-900">
                        <span>День {d.dayIndex}</span>

                        {d.dayIndex === todayDayIndex && (
                          <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white">
                            СЕГОДНЯ
                          </span>
                        )}

                        <SecondaryButton
                          onClick={() => toggleDayEditing(d.dayIndex)}
                          className="px-3 py-1 text-xs"
                        >
                          {isEditing ? "Готово" : "Редактировать"}
                        </SecondaryButton>
                      </div>
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
                      {!isEditing ? (
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

                            {!isEditing ? (
                              <div className="whitespace-pre-wrap text-xs text-gray-700">
                                {f.planText}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <textarea
                                  defaultValue={f.planText}
                                  onBlur={(e) =>
                                    upsertPlanOverride(d.dayIndex, f.time, e.target.value)
                                  }
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
            })
          )}
        </div>
      </div>

      {!searchOpen && (
        <button
          onClick={openSearch}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white shadow-lg"
          aria-label="Открыть поиск"
          title="Поиск"
        >
          🔍
        </button>
      )}

      <BottomNav />
    </div>
  );
}
