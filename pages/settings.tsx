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

function generateFamilyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function SettingsPage() {
  const [startDateISO, setStartDateISO] = useState<string>(todayISO());
  const [loaded, setLoaded] = useState(false);

  const [familyCode, setFamilyCode] = useState<string>("");
  const [familyInput, setFamilyInput] = useState("");

  // --- load start date ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("prikorm.startDateISO");
      if (saved) setStartDateISO(saved);

      const savedFamily = window.localStorage.getItem("prikorm.familyCode");
      if (savedFamily) setFamilyCode(savedFamily);
    } catch {}
    setLoaded(true);
  }, []);

  // --- persist start date ---
  useEffect(() => {
    if (!loaded) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("prikorm.startDateISO", startDateISO);
    } catch {}
  }, [startDateISO, loaded]);

  function createFamily() {
    const code = generateFamilyCode();
    setFamilyCode(code);
    window.localStorage.setItem("prikorm.familyCode", code);
    alert("Код семьи создан ✅");
  }

  function joinFamily() {
    if (!familyInput.trim()) {
      alert("Введите код семьи");
      return;
    }

    const code = familyInput.trim().toUpperCase();
    setFamilyCode(code);
    window.localStorage.setItem("prikorm.familyCode", code);
    alert("Вы подключились к семье ✅");
  }

  function leaveFamily() {
    window.localStorage.removeItem("prikorm.familyCode");
    setFamilyCode("");
    setFamilyInput("");
    alert("Вы вышли из семьи");
  }

  const dateInputClass =
    "w-full box-border rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 text-sm leading-5";
  const dateInputStyle = { WebkitAppearance: "none", appearance: "none" } as any;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="text-2xl font-extrabold text-gray-900">Настройки</div>
        <div className="mt-1 text-sm text-gray-600">
          Управление приложением и синхронизацией
        </div>

        {/* ДАТА СТАРТА */}
        <Card className="mt-4">
          <div className="text-sm font-bold text-gray-900">
            Дата старта прикорма
          </div>
          <div className="mt-1 text-xs text-gray-600">
            Сейчас:{" "}
            <span className="font-semibold">
              {format(isoToDate(startDateISO), "dd.MM.yyyy")}
            </span>
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
            <SecondaryButton
              onClick={() => setStartDateISO(todayISO())}
              className="w-full"
            >
              Поставить сегодня
            </SecondaryButton>
            <PrimaryButton
              onClick={() => alert("Сохранено ✅")}
              className="w-full"
            >
              Готово
            </PrimaryButton>
          </div>
        </Card>

        {/* СЕМЕЙНАЯ СИНХРОНИЗАЦИЯ */}
        <Card className="mt-4">
          <div className="text-sm font-bold text-gray-900">
            Синхронизация между устройствами
          </div>

          {!familyCode && (
            <>
              <div className="mt-3">
                <PrimaryButton onClick={createFamily} className="w-full">
                  Создать код семьи
                </PrimaryButton>
              </div>

              <div className="mt-4 text-xs text-gray-600">
                Или подключиться по коду:
              </div>

              <input
                type="text"
                placeholder="Введите код семьи"
                value={familyInput}
                onChange={(e) => setFamilyInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase"
              />

              <div className="mt-2">
                <SecondaryButton onClick={joinFamily} className="w-full">
                  Подключиться
                </SecondaryButton>
              </div>
            </>
          )}

          {familyCode && (
            <>
              <div className="mt-3 text-sm">
                Ваш код семьи:
              </div>

              <div className="mt-1 text-xl font-bold tracking-widest">
                {familyCode}
              </div>

              <div className="mt-3 flex gap-2">
                <SecondaryButton
                  onClick={() => {
                    navigator.clipboard.writeText(familyCode);
                    alert("Скопировано 📋");
                  }}
                  className="w-full"
                >
                  Скопировать
                </SecondaryButton>

                <PrimaryButton
                  onClick={leaveFamily}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Выйти
                </PrimaryButton>
              </div>
            </>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
