export type CategoryKey =
  | "formula"
  | "vegetable"
  | "fruit"
  | "porridge"
  | "meat"
  | "dairy"
  | "water"
  | "other";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  colorClass: string; // tailwind class for left stripe
}

// Единый справочник (истина)
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

// Для быстрого доступа по ключу
const CAT = Object.fromEntries(categories.map(c => [c.key, c])) as Record<CategoryKey, Category>;

export function detectCategory(planText: string): Category {
  const t = (planText || "").toLowerCase();
  const has = (arr: string[]) => arr.some(w => t.includes(w));

  // ключевые слова (можно расширять)
  const MEAT = ["мяс", "индейк", "куриц", "говяд", "крол", "рыб", "треск", "лосос", "хек"];
  const PORRIDGE = ["каша", "греч", "рис", "овся", "кукуруз", "пшенн", "манк"];
  const VEG = ["кабач", "брокк", "цветн", "тыкв", "морков", "картоф", "пюре овощ", "овощ"];
  const FRUIT = ["яблок", "груш", "банан", "слив", "персик", "абрик", "фрукт", "пюре фрукт"];
  const DAIRY = ["йогурт", "кефир", "творог", "ряженк", "биолакт", "молочн"];
  const DRINKS = ["вода", "чай", "компот", "сок"];
  const FORMULA = ["смесь", "гв", "ив"]; // "молоко" специально НЕ тут, чтобы не спорить с молочным

  // ✅ Приоритет "еды" выше смеси
  if (has(MEAT)) return CAT.meat;
  if (has(PORRIDGE)) return CAT.porridge;
  if (has(VEG)) return CAT.vegetable;
  if (has(FRUIT)) return CAT.fruit;
  if (has(DAIRY)) return CAT.dairy;
  if (has(DRINKS)) return CAT.water;

  // Смесь — только если не нашлось ничего выше
  if (has(FORMULA) || t.includes("смесь")) return CAT.formula;

  // "молоко" одиночное (без йогурта/кефира/творога) — чаще как смесь/молочное?
  // Оставим как "Смесь/молоко" для простоты:
  if (t.includes("молоко")) return CAT.formula;

  return CAT.other;
}
