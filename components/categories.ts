export type CategoryKey = "formula" | "vegetable" | "fruit" | "porridge" | "meat" | "dairy" | "water" | "other";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  colorClass: string;   // tailwind class for left stripe
}

// Простая эвристика: по ключевым словам в planText
export const categories: Category[] = [
  { key: "formula",   label: "Смесь/молоко", icon: "🍼", colorClass: "bg-sky-500" },
  { key: "vegetable", label: "Овощи",        icon: "🥦", colorClass: "bg-emerald-500" },
  { key: "fruit",     label: "Фрукты",       icon: "🍎", colorClass: "bg-rose-500" },
  { key: "porridge",  label: "Каши",         icon: "🍚", colorClass: "bg-amber-500" },
  { key: "meat",      label: "Мясо/рыба",    icon: "🍗", colorClass: "bg-orange-600" },
  { key: "dairy",     label: "Молочное",     icon: "🥛", colorClass: "bg-indigo-500" },
  { key: "water",     label: "Напитки",      icon: "💧", colorClass: "bg-teal-500" },
  { key: "other",     label: "Другое",       icon: "🍽️", colorClass: "bg-gray-500" },
];

export function detectCategory(planText: string): Category {
  const t = (planText || "").toLowerCase();

  if (/(смесь|молоко|гв|ив)/.test(t)) return categories[0];
  if (/(каша|греч|рис|кукуруз)/.test(t)) return categories.find(c=>c.key==="porridge")!;
  if (/(кабач|брок|цветн|морков|тыкв|картоф|овощ)/.test(t)) return categories.find(c=>c.key==="vegetable")!;
  if (/(яблок|груш|банан|фрукт|чернослив)/.test(t)) return categories.find(c=>c.key==="fruit")!;
  if (/(индейк|кролик|говядин|куриц|рыб)/.test(t)) return categories.find(c=>c.key==="meat")!;
  if (/(творог|йогурт|кефир)/.test(t)) return categories.find(c=>c.key==="dairy")!;
  if (/(вода|чай|напит)/.test(t)) return categories.find(c=>c.key==="water")!;

  return categories.find(c=>c.key==="other")!;
}
