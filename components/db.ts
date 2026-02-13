import Dexie, { Table } from "dexie";

export type Reaction = "ok" | "rash" | "tummy" | "stool" | "other";

export interface FeedingLog {
  id?: number;
  dayIndex: number;        // 1..180 (как в плане)
  dateISO: string;         // реальная дата (YYYY-MM-DD)
  time: string;            // "07:00" ...
  planText: string;        // что было по плану
  done: boolean;           // отметка
  amount?: string;         // "40 г" / "170 мл" / "2 ч.л."
  reaction?: Reaction;
  note?: string;
  updatedAt: number;
}

// Переопределения плана (редактирование пользователем)
export interface PlanOverride {
  id?: number;
  dayIndex: number;   // 1..180
  time: string;       // "07:00" ...
  planText: string;   // новый текст плана для этого времени
  updatedAt: number;
}

export interface DayMetaOverride {
  id?: number;
  dayIndex: number;
  focus?: string;
  updatedAt: number;
}

class AppDB extends Dexie {
  logs!: Table<FeedingLog, number>;
  planOverrides!: Table<PlanOverride, number>;
  dayMeta!: Table<DayMetaOverride, number>;

  constructor() {
    super("prikormDB");
    this.version(1).stores({
      logs: "++id, dayIndex, dateISO, time, done, updatedAt"
    });

    // v2: добавили редактирование плана
    this.version(2).stores({
      logs: "++id, dayIndex, dateISO, time, done, updatedAt",
      planOverrides: "++id, [dayIndex+time], dayIndex, time, updatedAt",
      dayMeta: "++id, dayIndex, updatedAt"
    });
  }
}

export const db = new AppDB();
