import Link from "next/link";
import { useRouter } from "next/router";

const tabs = [
  { href: "/", label: "Сегодня" },
  { href: "/plan", label: "План" },
  { href: "/reports", label: "Отчёты" },
];

export function BottomNav() {
  const r = useRouter();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-md grid grid-cols-3">
        {tabs.map(t => {
          const active = r.pathname === t.href;
          return (
            <Link key={t.href} href={t.href} className={"py-3 text-center text-sm font-semibold " + (active ? "text-gray-900" : "text-gray-500")}>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
