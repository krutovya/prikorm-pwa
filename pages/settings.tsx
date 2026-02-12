import { useEffect, useMemo, useState } from "react";
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

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd.MM HH:mm:ss");
}

const LS_THEME = "prikorm.theme"; // "light" | "dark"

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function SettingsPage() {
  const [startDateISO, setStartDateISO] = useState<string>(todayISO());
  const [loaded, setLoaded] = useState(false);

  const [familyCode, setFamilyCode] = useState<string>("");
  const [familyInput, setFamilyInput] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);

  // --- индикатор синка ---
  const [syncStatus, setSyncStatus] = useState<"idle" | "ok" | "error">("idle");
  const [lastPushAt, setLastPushAt] = useState<string | null>(null);
  const [lastPullAt, setLastPullAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // --- тема ---
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // read sync status
    const readSync = () => {
      const st = (window.localStorage.getItem("prikorm.sync.status") as any) ?? "idle";
      setSyncStatus(st === "ok" || st === "error" ? st : "idle");
      setLastPushAt(window.localStorage.getItem("prikorm.sync.lastPushAt"));
      setLastPullAt(window.localStorage.getItem("prikorm.sync.lastPullAt"));
      setLastError(window.localStorage.getItem("prikorm.sync.lastError"));
    };

    readSync();
    const t = setInterval(readSync, 1000);

    // read theme
    try {
      const saved = (window.localStorage.getItem(LS_THEME) as "light" | "dark" | null) ?? "light";
      setTheme(saved);
      applyTheme(saved);
    } catch {
      setTheme("light");
      applyTheme("light");
    }

    return () => clearInterval(t);
  }, []);

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
    if (!familyCode) return alert("Сначала создай/введи код семьи");
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
    if (!familyCode) return alert("Сначала создай/введи код семьи");
    setSyncBusy(true);
    try {
      const payload = await pullFromCloud(familyCode);
      await importAll(payload);
      alert("Загружено ✅ Перезагрузи приложение (или закрой/открой).");
    } catch (e: any) {
      alert("Ошибка загрузки: " + (e?.message ?? "unknown"));
    } finally {
      setSyncBusy(false);
    }
  }

  function setThemeAndApply(next: "light" | "dark") {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(LS_THEME, next);
    } catch {}
  }

  const syncPill = useMemo(() => {
    if (syncStatus === "error") return { text: "Ошибка 🔴", cls: "bg-rose-100 text-rose-700 border-rose-200" };
    if (syncStatus === "ok") return { text: "Синхронизировано ✅", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    return { text: "Ожидание…", cls: "bg-gray-100 text-gray-700 border-gray-200" };
  }, [syncStatus]);

  const dateInputClass =
    "w-full box-border rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 text-sm leading-5 dark:bg-gray-900 dark:border-gray-700 dark:text-white";
  const dateInputStyle = { WebkitAppearance: "none", appearance: "none" } as any;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="text-2xl font-extrabold text-gray-900 dark:text-white">Настройки</div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Дата старта, тема и синхронизация
        </div>

        {/* ТЕМА */}
        <Card className="mt-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="text-sm font-bold text-gray-900 dark:text-white">Тема приложения</div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Выбери удобную тему. Настройка сохранится на устройстве.
          </div>

          <div className="mt-3 flex gap-2">
            <SecondaryButton
              onClick={() => setThemeAndApply("light")}
              className={"w-full " + (theme === "light" ? "ring-2 ring-emerald-500" : "")}
            >
              ☀️ Светлая
            </SecondaryButton>
            <SecondaryButton
              onClick={() => setThemeAndApply("dark")}
              className={"w-full " + (theme === "dark" ? "ring-2 ring-emerald-500" : "")}
            >
              🌙 Тёмная
            </SecondaryButton>
          </div>
        </Card>

        {/* ДАТА СТАРТА */}
        <Card className="mt-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="text-sm font-bold text-gray-900 dark:text-white">Дата старта прикорма</div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
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

        {/* СТАТУС СИНХРОНИЗАЦИИ */}
        <Card className="mt-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-gray-900 dark:text-white">Статус синхронизации</div>
            <div className={"shrink-0 rounded-full border px-3 py-1 text-xs font-semibold " + syncPill.cls}>
              {syncPill.text}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:bg-gray-950 dark:border-gray-800">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Последний PUSH</div>
              <div className="mt-1">{fmtTime(lastPushAt)}</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:bg-gray-950 dark:border-gray-800">
              <div className="font-semibold text-gray-700 dark:text-gray-200">Последний PULL</div>
              <div className="mt-1">{fmtTime(lastPullAt)}</div>
            </div>
          </div>

          {lastError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-200">
              <div className="font-semibold">Последняя ошибка</div>
              <div className="mt-1 break-words">{lastError}</div>
            </div>
          )}
        </Card>

        {/* СИНХРОНИЗАЦИЯ */}
        <Card className="mt-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="text-sm font-bold text-gray-900 dark:text-white">Синхронизация (Код семьи)</div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Один код = одна “семья”. На одном устройстве жми “Отправить”, на другом — “Загрузить”.
          </div>

          {!familyCode ? (
            <>
              <div className="mt-3">
                <PrimaryButton onClick={createFamily} className="w-full" disabled={syncBusy}>
                  Создать код семьи
                </PrimaryButton>
              </div>

              <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">Или подключиться по коду:</div>

              <input
                type="text"
                placeholder="Введите код семьи"
                value={familyInput}
                onChange={(e) => setFamilyInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase dark:bg-gray-950 dark:border-gray-800 dark:text-white"
              />

              <div className="mt-2">
                <SecondaryButton onClick={joinFamily} className="w-full" disabled={syncBusy}>
                  Подключиться
                </SecondaryButton>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 text-sm text-gray-800 dark:text-gray-200">Ваш код семьи:</div>
              <div className="mt-1 text-xl font-bold tracking-widest text-gray-900 dark:text-white">{familyCode}</div>

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
