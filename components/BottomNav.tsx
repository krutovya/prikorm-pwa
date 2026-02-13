import Link from "next/link";
import { useRouter } from "next/router";

export function BottomNav() {
  const router = useRouter();

  const itemClass = (path: string) =>
    "flex flex-1 flex-col items-center justify-center transition-all " +
    (router.pathname === path
      ? "text-emerald-600 font-semibold"
      : "text-gray-500");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-md h-20"> 
        {/* ↑ высота была меньше — теперь 80px */}

        <Link href="/" className={itemClass("/")}>
          <span className="text-lg">📅</span>
          <span className="mt-1 text-sm">Сегодня</span>
        </Link>

        <Link href="/plan" className={itemClass("/plan")}>
          <span className="text-lg">📝</span>
          <span className="mt-1 text-sm">План</span>
        </Link>

        <Link href="/reports" className={itemClass("/reports")}>
          <span className="text-lg">📊</span>
          <span className="mt-1 text-sm">Отчёты</span>
        </Link>
      </div>
    </div>
  );
}

