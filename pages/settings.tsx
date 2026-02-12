import { useEffect, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { Card, SecondaryButton, PrimaryButton } from "../components/ui";
import { format } from "date-fns";
import { pullFromCloud, pushToCloud, importAll } from "../components/sync";

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

  const [syncBusy, setSyncBusy] = useState(false);

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
    alert("Код семьи создан ✅ Теперь нажми «Отправить в облако» на этом устройстве.");
  }

  function joinFamily() {
    if (!familyInput.trim()) {
      alert("Введите код семьи");
      return;
    }
    const code = familyInput.trim().toUpperCase();
    setFamilyCode(code);
    window.localStorage.setItem("prikorm.familyCode", code);
    alert("Подключились ✅ Теперь нажми «Загрузить из облака»");
  }

  function leaveFamily() {
    window.localStorage.removeItem("prikorm.familyCode");
    setFamilyCode("");
    setFamilyInput("");
    alert("Вы вышли из семьи");
  }

  async function onPush() {
    if (!familyCode) {
      alert("Сначала создай/введи код семьи");
      return;
    }
    setSyncBusy(true);
    try {
      await pushToCloud(familyCode);
      alert("Отправлено в облако ✅");
    } catch (e: any) {
      alert("Ошибка отправки: " + (e?.message ?? "unknown"));
    } finally {
      setSyncBusy(false);
    }
  }

  async function onPull() {
    if (!familyCode) {
      alert("Сначала создай/введи код семьи");
      return;
    }
    setSyncBusy(true);
    try {
      const payload = await pullFromCloud(familyCode);
      await importAll(payload);
      alert("Загружено ✅ Перезагрузи страницу приложения (или закрой/открой).");
    } catch (e: any) {
      alert("Ошибка загрузки: " + (e?.message ?? "unknown"));
    } finally {
      setSyncBusy(false);
    }
  }

  const dateInputClass =
    "w-full box-border rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 text-sm leading-5";
  const dateInputStyle = { WebkitAppearance: "none", appearance: "none" } as any;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="text-2xl font-extrabold text-gray-900">Настройки</div>
        <div className="mt-1 text-sm text-gray-600">Дата старта и синхронизация между устройствами</div>

        {/* ДАТА СТАРТА */}
        <Card className="mt-4">
          <div className="text-sm font-bold text-gray-900">Дата старта прикорма</div>
          <div className="mt-1 text-xs text-gray-600">
            Сейчас:{" "}
            <span className="font-semibold">{format(isoToDate(startDateISO), "dd.MM.yyyy")}</span>
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
            <PrimaryButton onClick={() => alert("Сохранено ✅")} className="w-full">
              Готово
            </PrimaryButton>
          </div>
        </Card>

        {/* СИНХРОНИЗАЦИЯ */}
        <Card className="mt-4">
          <div className="text-sm font-bold text-gray-900">Синхронизация (Код семьи)</div>
          <div className="mt-1 text-xs text-gray-600">
            Один код = одна “семья”. На одном устройстве нажми «Отправить в облако», на другом — «Загрузить из облака».
          </div>

          {!familyCode ? (
            <>
              <div className="mt-3">
                <PrimaryButton onClick={createFamily} className="w-full" disabled={syncBusy}>
                  Создать код семьи
                </PrimaryButton>
              </div>

              <div className="mt-4 text-xs text-gray-600">Или подключиться по коду:</div>

              <input
                type="text"
                placeholder="Введите код семьи"
                value={familyInput}
                onChange={(e) => setFamilyInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase"
              />

              <div className="mt-2">
                <SecondaryButton onClick={joinFamily} className="w-full" disabled={syncBusy}>
                  Подключиться
                </SecondaryButton>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 text-sm">Ваш код семьи:</div>
              <div className="mt-1 text-xl font-bold tracking-widest">{familyCode}</div>

              <div className="mt-3 flex gap-2">
                <SecondaryButton
                  onClick={() => {
                    navigator.clipboard.writeText(familyCode);
                    alert("Скопировано 📋");
                  }}
                  className="w-full"
                  disabled={syncBusy}
                >
                  Скопировать
                </SecondaryButton>

                <SecondaryButton onClick={leaveFamily} className="w-full" disabled={syncBusy}>
                  Выйти
                </SecondaryButton>
              </div>

              <div className="mt-3 flex gap-2">
                <PrimaryButton onClick={onPush} className="w-full" disabled={syncBusy}>
                  {syncBusy ? "Подождите..." : "📤 Отправить в облако"}
                </PrimaryButton>
                <SecondaryButton onClick={onPull} className="w-full" disabled={syncBusy}>
                  {syncBusy ? "Подождите..." : "📥 Загрузить из облака"}
                </SecondaryButton>
              </div>
            </>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
