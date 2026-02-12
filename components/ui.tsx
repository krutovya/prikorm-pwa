import React from "react";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral"|"ok"|"warn" }) {
  const cls =
    tone === "ok" ? "bg-emerald-100 text-emerald-800" :
    tone === "warn" ? "bg-amber-100 text-amber-800" :
    "bg-gray-100 text-gray-700";
  return <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " + cls}>{children}</span>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">{children}</div>;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={"rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold active:scale-[0.99] disabled:opacity-50 " + (props.className ?? "")} />;
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={"rounded-xl border border-gray-300 bg-white text-gray-900 px-4 py-2 text-sm font-semibold active:scale-[0.99] disabled:opacity-50 " + (props.className ?? "")} />;
}
