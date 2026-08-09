import Link from "next/link";
import { cn } from "@/lib/utils";
import { addMonthsKeepDay, getMonthInfo, todayISODate } from "@/lib/date";
import { buttonVariants } from "@/components/ui/button";

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function MonthCalendar({
  basePath,
  date,
  countsByDate,
}: {
  basePath: string;
  date: string; // currently selected date, also anchors which month is shown
  countsByDate: Record<string, number>;
}) {
  const info = getMonthInfo(date);
  const today = todayISODate();
  const prevMonth = addMonthsKeepDay(`${info.year}-${String(info.month).padStart(2, "0")}-01`, -1);
  const nextMonth = addMonthsKeepDay(`${info.year}-${String(info.month).padStart(2, "0")}-01`, 1);

  const cells: (string | null)[] = [
    ...Array(info.firstWeekday).fill(null),
    ...Array.from({ length: info.daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${info.year}-${String(info.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }),
  ];

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-center gap-2">
        <Link href={`${basePath}?date=${prevMonth}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          ← 上個月
        </Link>
        <span className="min-w-28 text-center font-medium">{info.label}</span>
        <Link href={`${basePath}?date=${nextMonth}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          下個月 →
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cellDate, i) => {
          if (!cellDate) return <div key={`blank-${i}`} />;
          const count = countsByDate[cellDate] ?? 0;
          const isToday = cellDate === today;
          const isSelected = cellDate === date;
          return (
            <Link
              key={cellDate}
              href={`${basePath}?date=${cellDate}`}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border text-xs",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : isToday
                    ? "border-primary"
                    : "border-border hover:bg-muted"
              )}
            >
              <span>{Number(cellDate.slice(-2))}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "text-[0.65rem] leading-none",
                    isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {count} 堂
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
