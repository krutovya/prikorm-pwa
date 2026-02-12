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

export function detectCategory(planText: string) {
  const t = (planText || "").toLowerCase();

  // помощник
  const has = (arr: string[]) => arr.some(w => t.includes(w));

  // ключевые слова (можно расширять)
  const MEAT = ["мяс", "индейк", "куриц", "говяд", "крол", "рыб", "треск", "лосос", "хек"];
  const PORRIDGE = ["каша", "греч", "рис", "овся", "кукуруз", "пшенн", "манк"];
  const VEG = ["кабач", "брокк", "цветн", "тыкв", "морков", "картоф", "пюре овощ", "овощ"];
  const FRUIT = ["яблок", "груш", "банан", "слив", "персик", "абрик", "фрукт", "пюре фрукт"];
  const DAIRY = ["йогурт", "кефир", "творог", "ряженк", "биолакт", "молочн"];
  const DRINKS = ["вода", "чай", "компот", "сок"];
  const FORMULA = ["смесь", "гв", "ив", "молоко"]; // “молоко” оставим тут, но ниже будет приоритет у молочного/дринков/еды

  // ✅ ВАЖНО: сначала проверяем “еду”, а уже потом смесь
  if (has(MEAT)) {
    return { key: "meat", label: "Мясо/рыба", icon: "🍗", colorClass: "bg-orange-500" };
  }
  if (has(PORRIDGE)) {
    return { key: "porridge", label: "Каши", icon: "🥣", colorClass: "bg-amber-500" };
  }
  if (has(VEG)) {
    return { key: "veg", label: "Овощи", icon: "🥦", colorClass: "bg-emerald-500" };
  }
  if (has(FRUIT)) {
    return { key: "fruit", label: "Фрукты", icon: "🍎", colorClass: "bg-rose-500" };
  }
  if (has(DAIRY)) {
    return { key: "dairy", label: "Молочное", icon: "🥛", colorClass: "bg-sky-500" };
  }
  if (has(DRINKS)) {
    return { key: "drinks", label: "Напитки", icon: "💧", colorClass: "bg-cyan-500" };
  }

  // ✅ Смесь/молоко — ТОЛЬКО если не нашлось ничего выше
  if (has(FORMULA)) {
    return { key: "formula", label: "Смесь/молоко", icon: "🍼", colorClass: "bg-blue-500" };
  }

  return { key: "other", label: "Другое", icon: "🍽️", colorClass: "bg-gray-500" };
}

