import Link from "next/link";
import { addDaysISO, formatDateLabel, todayISODate } from "@/lib/date";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DateNav({ basePath, date }: { basePath: string; date: string }) {
  const prev = addDaysISO(date, -1);
  const next = addDaysISO(date, 1);
  const today = todayISODate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`${basePath}?date=${prev}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
        ← 前一天
      </Link>
      <span className="font-numeric rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
        {formatDateLabel(date)}
      </span>
      <Link href={`${basePath}?date=${next}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
        後一天 →
      </Link>
      {date !== today && (
        <Link href={`${basePath}?date=${today}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}>
          回到今天
        </Link>
      )}
    </div>
  );
}
