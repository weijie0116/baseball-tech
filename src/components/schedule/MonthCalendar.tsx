import Link from "next/link";
import { cn } from "@/lib/utils";
import { addMonthsKeepDay, getMonthInfo, todayISODate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
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
  const monthTotal = Object.values(countsByDate).reduce((a, b) => a + b, 0);

  const cells: (string | null)[] = [
    ...Array(info.firstWeekday).fill(null),
    ...Array.from({ length: info.daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${info.year}-${String(info.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }),
  ];

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-base font-semibold">{info.label}</span>
          <span className="font-numeric text-xs text-muted-foreground">{monthTotal} 堂課</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${basePath}?date=${prevMonth}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            ← 上個月
          </Link>
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
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                )}
              >
                <span className="font-numeric">{Number(cellDate.slice(-2))}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
