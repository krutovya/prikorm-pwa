import { useEffect, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { Card, SecondaryButton, PrimaryButton } from "../components/ui";
import { format } from "date-fns";

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

export default function SettingsPage() {
  const [startDateISO, setStartDateISO] = useState<string>(todayISO());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("prikorm.startDateISO");
      if (saved) setStartDateISO(saved);
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("prikorm.startDateISO", startDateISO);
    } catch {
      // ignore
    }
  }, [startDateISO, loaded]);

  const dateInputClass =
    "w-full box-border rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 text-sm leading-5";
  const dateInputStyle = { WebkitAppearance: "none", appearance: "none" } as any;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="text-2xl font-extrabold text-gray-900">Настройки</div>
        <div className="mt-1 text-sm text-gray-600">
          Дата старта нужна для расчёта “День N”
        </div>

        <Card className="mt-4">
          <div className="text-sm font-bold text-gray-900">Дата старта прикорма</div>
          <div className="mt-1 text-xs text-gray-600">
            Сейчас: <span className="font-semibold">{format(isoToDate(startDateISO), "dd.MM.yyyy")}</span>
          </div>

          <div className="mt-3 w-full overflow-hidden rounded-xl">
            <input
              type="date"
              value={startDateISO}
              onChange={(e) => setStartDateISO(e.target.value)}
              className={dateInputClass}
              style={dateInputStyle}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <SecondaryButton onClick={() => setStartDateISO(todayISO())} className="w-full">
              Поставить сегодня
            </SecondaryButton>
            <PrimaryButton
              onClick={() => {
                alert("Сохранено ✅");
              }}
              className="w-full"
            >
              Готово
            </PrimaryButton>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
