import Link from "next/link";
import { addDaysISO, formatDateLabel, todayISODate } from "@/lib/date";
import { buttonVariants } from "@/components/ui/button";

export function DateNav({ basePath, date }: { basePath: string; date: string }) {
  const prev = addDaysISO(date, -1);
  const next = addDaysISO(date, 1);
  const today = todayISODate();

  return (
    <div className="flex items-center gap-2">
      <Link href={`${basePath}?date=${prev}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        ← 前一天
      </Link>
      <span className="min-w-40 text-center font-medium">{formatDateLabel(date)}</span>
      <Link href={`${basePath}?date=${next}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        後一天 →
      </Link>
      {date !== today && (
        <Link href={`${basePath}?date=${today}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          回到今天
        </Link>
      )}
    </div>
  );
}
