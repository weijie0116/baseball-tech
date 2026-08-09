export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${dateStr}(週${weekday})`;
}

export type MonthInfo = {
  year: number;
  month: number; // 1-12
  daysInMonth: number;
  firstWeekday: number; // 0=Sun .. 6=Sat, weekday of the 1st
  monthStartISO: string;
  monthEndISO: string;
  label: string;
};

export function getMonthInfo(dateStr: string): MonthInfo {
  const d = new Date(`${dateStr}T00:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const mm = String(month).padStart(2, "0");
  return {
    year,
    month,
    daysInMonth,
    firstWeekday,
    monthStartISO: `${year}-${mm}-01`,
    monthEndISO: `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`,
    label: `${year} 年 ${month} 月`,
  };
}

export function addMonthsKeepDay(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const targetMonthIndex = d.getMonth() + months;
  const daysInTargetMonth = new Date(d.getFullYear(), targetMonthIndex + 1, 0).getDate();
  d.setDate(Math.min(d.getDate(), daysInTargetMonth));
  d.setMonth(targetMonthIndex);
  return d.toISOString().slice(0, 10);
}
