export interface PlanFeeding {
  time: string;       // "07:00"
  planText: string;   // текст из Excel
}

export interface PlanDay {
  dayIndex: number;
  week: number | null;
  ageMonths: number | null;
  focus: string | null;
  feedings: PlanFeeding[];
}

export interface PlanFile {
  version: number;
  days: PlanDay[];
}
