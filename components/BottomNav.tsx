import Link from "next/link";
import { useRouter } from "next/router";

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 " +
        (active
          ? "bg-gray-900 text-white dark:bg-emerald-600"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800")
      }
    >
      <div className="text-xl leading-none">{icon}</div>
      <div className="text-[11px] font-semibold">{label}</div>
    </Link>
  );
}

export function BottomNav() {
  const r = useRouter();
  const path = r.pathname;

  const isToday = path === "/" || path === "/index";
  const isPlan = path === "/plan";
  const isReports = path === "/reports" || path === "/report";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* подложка */}
      <div className="mx-auto max-w-md px-4 pb-4">
        <div
          className={
            "rounded-3xl border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur " +
            "dark:border-gray-800 dark:bg-gray-950/90"
          }
        >
          <div className="flex gap-2">
            <Tab href="/" label="Сегодня" icon="🗓️" active={isToday} />
            <Tab href="/plan" label="План" icon="📋" active={isPlan} />
            <Tab href="/reports" label="Отчёты" icon="📊" active={isReports} />
          </div>
        </div>
      </div>
      {/* безопасная зона iPhone */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
