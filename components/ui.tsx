import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm " +
        "dark:border-gray-800 dark:bg-gray-900 " +
        className
      }
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-gray-200 " +
        "bg-white px-3 py-1 text-xs font-semibold text-gray-700 " +
        "dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 " +
        className
      }
    >
      {children}
    </span>
  );
}

function baseButtonClasses() {
  return (
    "inline-flex items-center justify-center rounded-xl px-4 py-2 " +
    "text-sm font-semibold transition active:scale-[0.99] " +
    "disabled:opacity-50 disabled:cursor-not-allowed"
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={
        baseButtonClasses() +
        " bg-gray-900 text-white hover:bg-gray-800 " +
        "dark:bg-emerald-600 dark:hover:bg-emerald-500 " +
        className
      }
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  className = "",
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={
        baseButtonClasses() +
        " border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 " +
        "dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900 " +
        className
      }
    >
      {children}
    </button>
  );
}
