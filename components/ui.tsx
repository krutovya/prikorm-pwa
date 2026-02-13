import * as React from "react";

function cx(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/** CARD */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/** BADGE */
export type BadgeTone = "neutral" | "ok" | "warn" | "danger";
export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  const toneClass =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warn"
      ? "bg-amber-100 text-amber-700"
      : tone === "danger"
      ? "bg-rose-100 text-rose-700"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        toneClass,
        className
      )}
      {...props}
    />
  );
}


/** BUTTONS */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, ...props }: BtnProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: BtnProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
