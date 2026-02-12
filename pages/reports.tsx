import { useMemo } from "react";
import { BottomNav } from "../components/BottomNav";
import { Card, Badge } from "../components/ui";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../components/db";
import { categories, detectCategory } from "../components/categories";

export default function ReportsPage() {
  const logs = useLiveQuery(async () => db.logs.toArray(), []);

  const stats = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byDay = new Map<string, number>();
    for (const l of logs ?? []) {
      if (!l.done) continue;
      const cat = detectCategory(l.planText).key;
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
      byDay.set(l.dateISO, (byDay.get(l.dateISO) ?? 0) + 1);
    }
    return { byCategory, byDay };
  }, [logs]);

  const dayRows = useMemo(() => {
    const arr = Array.from(stats.byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
    return arr.slice(-14).reverse(); // последние 14 дней
  }, [stats.byDay]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="text-2xl font-extrabold text-gray-900">Отчёты</div>
        <div className="mt-1 text-sm text-gray-600">Статистика по отмеченным кормлениям</div>

        <div className="mt-4 space-y-3">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">Категории</div>
              <Badge>{(logs ?? []).filter(l=>l.done).length} выполнено</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {categories.map(c => {
                const n = stats.byCategory.get(c.key) ?? 0;
                return (
                  <div key={c.key} className="flex items-center gap-3">
                    <div className={"h-2 w-2 rounded-full " + c.colorClass} />
                    <div className="text-sm text-gray-800">{c.icon} {c.label}</div>
                    <div className="ml-auto text-sm font-semibold">{n}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-bold">Последние дни</div>
            <div className="mt-3 space-y-2">
              {dayRows.length === 0 ? (
                <div className="text-sm text-gray-600">Пока нет отметок — отметь кормления на экране “Сегодня”.</div>
              ) : dayRows.map(([dateISO, n]) => (
                <div key={dateISO} className="flex items-center justify-between">
                  <div className="text-sm text-gray-800">{dateISO}</div>
                  <Badge tone={n >= 6 ? "ok" : "neutral"}>{n} / 6</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-bold">Что дальше добавим</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Графики (круг/столбики) и “новые продукты”</li>
              <li>Экспорт отчёта (PDF/Excel)</li>
              <li>Напоминания по времени</li>
              <li>Синхронизация между устройствами (по желанию)</li>
            </ul>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
