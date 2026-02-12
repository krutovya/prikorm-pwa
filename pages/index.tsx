import { useEffect, useMemo, useState } from "react";
import planFile from "../data/plan.json";
import { PlanFile, PlanDay } from "../components/types";
import { BottomNav } from "../components/BottomNav";
import { Card, Badge, PrimaryButton, SecondaryButton } from "../components/ui";
import { detectCategory } from "../components/categories";
import { db, FeedingLog, Reaction } from "../components/db";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";

const PLAN = planFile as unknown as PlanFile;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TodayPage() {
  // SSR-safe: никаких localStorage в инициализации state
  const [startDateISO, setStartDateISO] = useState<string>(todayISO());
  const [startLoaded, setStartLoaded] = useState(false);

  // 1) читаем из localStorage ТОЛЬКО на клиенте
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

  // 2) пишем в localStorage ТОЛЬКО на клиенте, и только после загрузки
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!startLoaded) return;
    try {
      window.localStorage.setItem("prikorm.startDateISO", startDateISO);
    } catch {
      // ignore
    }
  }, [startDateISO, startLoaded]);

  const dayIndex = useMemo(() => {
    const start = new Date(startDateISO + "T00:00:00");
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), PLAN.days.length);
  }, [startDateISO]);

  const basePlanDay: PlanDay | undefined = PLAN.days.find((d) => d.dayIndex === dayIndex);

  // Подхватываем пользовательские правки плана для текущего дня
  const dayOverrides = useLiveQuery(async () => {
    const [o, m] = await Promise.all([
      db.planOverrides.where({ dayIndex }).toArray(),
      db.dayMeta.where({ dayIndex }).first(),
    ]);
    return { o, m };
  }, [dayIndex]);

  const planDay: PlanDay | undefined = useMemo(() => {
    if (!basePlanDay) return undefined;
    const map = new Map<string, string>();
    (dayOverrides?.o ?? []).forEach((x) => map.set(x.time, x.planText));
    return {
      ...basePlanDay,
      focus: dayOverrides?.m?.focus ?? basePlanDay.focus,
      feedings: basePlanDay.feedings.map((f) => ({ ...f, planText: map.get(f.time) ?? f.planText })),
    };
  }, [basePlanDay, dayOverrides]);

  const logs = useLiveQuery(async () => {
    const iso = todayISO();
    return db.logs.where({ dayIndex, dateISO: iso }).toArray();
  }, [dayIndex]);

  const doneCount = useMemo(() => (logs ?? []).filter((l) => l.done).length, [logs]);

  async function toggleDone(time: string, planText: string) {
    const iso = todayISO();
    const existing = await db.logs.where({ dayIndex, dateISO: iso, time }).first();
    const now = Date.now();

    if (!existing) {
      const rec: FeedingLog = {
        dayIndex,
        dateISO: iso,
        time,
        planText,
        done: true,
        updatedAt: now,
      };
      await db.logs.add(rec);
      return;
    }

    await db.logs.update(existing.id!, { done: !existing.done, updatedAt: now });
  }

  async function setDetails(time: string, patch: Partial<FeedingLog>) {
    const iso = todayISO();
    const existing = await db.logs.where({ dayIndex, dateISO: iso, time }).first();
    const now = Date.now();

    if (!existing) {
      await db.logs.add({
        dayIndex,
        dateISO: iso,
        time,
        planText: planDay?.feedings.find((f) => f.time === time)?.planText ?? "",
        done: false,
        updatedAt: now,
        ...patch,
      });
      return;
    }

    await db.logs.update(existing.id!, { ...patch, updatedAt: now });
  }

  const allDone = planDay ? doneCount === planDay.feedings.length : false;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className={"rounded-3xl p-5 text-white " + (allDone ? "bg-emerald-600" : "bg-gray-900")}>
          <div className="text-sm opacity-90">{format(new Date(), "dd.MM.yyyy")}</div>
          <div className="mt-1 text-2xl font-extrabold">Сегодня</div>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={allDone ? "ok" : "neutral"}>
              {doneCount}/{planDay?.feedings.length ?? 6} выполнено
            </Badge>
            <Badge>День {dayIndex} / {PLAN.days.length}</Badge>
          </div>

          <div className="mt-4">
            <label className="text-xs opacity-90">Дата старта прикорма (для расчёта “Дня N”)</label>
            <input
              type="date"
              value={startDateISO}
              onChange={(e) => setStartDateISO(e.target.value)}
              className="mt-1 w-full rounded-xl px-3 py-2 text-gray-900"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {planDay?.feedings.map((f) => {
            const cat = detectCategory(f.planText);
            const log = (logs ?? []).find((l) => l.time === f.time);
            const done = !!log?.done;

            return (
              <Card key={f.time}>
                <div className="flex gap-3">
                  <div className={"w-2 rounded-full " + cat.colorClass} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {f.time} <span className="ml-2">{cat.icon}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{f.planText}</div>
                        {log?.amount && <div className="mt-2 text-xs text-gray-600">Факт: {log.amount}</div>}
                        {log?.reaction && <div className="mt-1 text-xs text-gray-600">Реакция: {log.reaction}</div>}
                        {log?.note && <div className="mt-1 text-xs text-gray-600">Заметка: {log.note}</div>}
                      </div>

                      <div className="shrink-0">
                        <PrimaryButton onClick={() => toggleDone(f.time, f.planText)} className={done ? "bg-emerald-600" : ""}>
                          {done ? "✅ Выполнено" : "Отметить"}
                        </PrimaryButton>
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-gray-600">Добавить факт / реакцию</summary>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input
                          placeholder="Количество (например: 40 г / 170 мл)"
                          defaultValue={log?.amount ?? ""}
                          onBlur={(e) => setDetails(f.time, { amount: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        />

                        <select
                          defaultValue={log?.reaction ?? ""}
                          onChange={(e) => setDetails(f.time, { reaction: (e.target.value || undefined) as Reaction | undefined })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        >
                          <option value="">Реакция (если была)</option>
                          <option value="ok">ОК</option>
                          <option value="rash">Сыпь</option>
                          <option value="tummy">Живот</option>
                          <option value="stool">Стул</option>
                          <option value="other">Другое</option>
                        </select>

                        <textarea
                          placeholder="Заметка"
                          defaultValue={log?.note ?? ""}
                          onBlur={(e) => setDetails(f.time, { note: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>
                    </details>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <SecondaryButton onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="w-full">
            Наверх
          </SecondaryButton>
          <SecondaryButton onClick={() => alert("Дальше добавим экспорт/синхронизацию")} className="w-full">
            Экспорт
          </SecondaryButton>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
