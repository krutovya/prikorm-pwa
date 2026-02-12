import planFile from "../data/plan.json";
import { PlanFile } from "../components/types";
import { BottomNav } from "../components/BottomNav";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../components/db";
import { exportOverrides, importOverrides, resetDayFocus, resetPlanOverride, upsertDayFocus, upsertPlanOverride } from "../components/planEdits";
import { Card, Badge, PrimaryButton, SecondaryButton } from "../components/ui";
import { detectCategory } from "../components/categories";

const PLAN = planFile as unknown as PlanFile;

export default function PlanPage() {
  const [editMode, setEditMode] = useState(false);
  const [importText, setImportText] = useState("");

  const overrides = useLiveQuery(async () => {
    const [o, m] = await Promise.all([db.planOverrides.toArray(), db.dayMeta.toArray()]);
    return { o, m };
  }, []);

  const merged = useMemo(() => {
    const map = new Map<string, string>();
    const focusMap = new Map<number, string>();
    (overrides?.o ?? []).forEach(x => map.set(`${x.dayIndex}|${x.time}`, x.planText));
    (overrides?.m ?? []).forEach(x => { if (x.focus) focusMap.set(x.dayIndex, x.focus); });

    return PLAN.days.map(d => ({
      ...d,
      focus: focusMap.get(d.dayIndex) ?? d.focus,
      feedings: d.feedings.map(f => ({ ...f, planText: map.get(`${d.dayIndex}|${f.time}`) ?? f.planText }))
    }));
  }, [overrides]);

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
    } catch (e) {
      alert("Не удалось импортировать: проверь JSON");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold text-gray-900">План</div>
            <div className="mt-1 text-sm text-gray-600">180 дней • 6 кормлений в день • можно редактировать</div>
          </div>
          <PrimaryButton onClick={()=>setEditMode(v=>!v)} className={editMode ? "bg-emerald-600" : ""}>
            {editMode ? "✅ Режим редактирования" : "Редактировать"}
          </PrimaryButton>
        </div>

        {editMode && (
          <Card className="mt-4">
            <div className="text-sm font-bold">Резервная копия / перенос на другое устройство</div>
            <div className="mt-1 text-xs text-gray-600">
              Экспорт/импорт сохраняет только твои правки плана (не отметки кормлений).
            </div>
            <div className="mt-3 flex gap-2">
              <SecondaryButton onClick={onExport} className="w-full">Экспорт (копировать JSON)</SecondaryButton>
            </div>
            <div className="mt-3">
              <textarea
                value={importText}
                onChange={(e)=>setImportText(e.target.value)}
                placeholder="Вставь сюда JSON и нажми Импорт"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                rows={4}
              />
              <div className="mt-2 flex gap-2">
                <PrimaryButton onClick={onImport} className="w-full">Импорт</PrimaryButton>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-4 space-y-3">
          {merged.map(d => (
            <Card key={d.dayIndex}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">День {d.dayIndex}</div>
                <div className="flex gap-2">
                  <Badge>Неделя {d.week ?? "-"}</Badge>
                </div>
              </div>
              {d.focus && (
                <div className="mt-1">
                  {!editMode ? (
                    <div className="text-xs text-gray-600">{d.focus}</div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        defaultValue={d.focus}
                        onBlur={(e)=>upsertDayFocus(d.dayIndex, e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                        placeholder="Фокус дня / недели"
                      />
                      <SecondaryButton onClick={()=>resetDayFocus(d.dayIndex)} className="w-full">Сбросить фокус (вернуть как в файле)</SecondaryButton>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-2">
                {d.feedings.map(f => {
                  const cat = detectCategory(f.planText);
                  return (
                    <div key={f.time} className="flex gap-3">
                      <div className={"w-2 rounded-full " + cat.colorClass} />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-900">{f.time} <span className="ml-1">{cat.icon}</span></div>
                        {!editMode ? (
                          <div className="text-xs text-gray-700 whitespace-pre-wrap">{f.planText}</div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              defaultValue={f.planText}
                              onBlur={(e)=>upsertPlanOverride(d.dayIndex, f.time, e.target.value)}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs"
                              rows={3}
                            />
                            <SecondaryButton onClick={()=>resetPlanOverride(d.dayIndex, f.time)} className="w-full">
                              Сбросить (как в файле)
                            </SecondaryButton>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
