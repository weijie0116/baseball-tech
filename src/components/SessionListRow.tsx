import Link from "next/link";

export function SessionListRow({
  href,
  date,
  menu,
  place,
  veloKph,
}: {
  href: string;
  /** ISO date, e.g. "2026-09-07" */
  date: string;
  menu: string | null;
  place: string | null;
  veloKph: number | null;
}) {
  const [, month, day] = date.split("-");

  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:border-primary"
    >
      <div className="w-14 shrink-0 text-center">
        <div className="font-numeric text-xl leading-none font-bold tabular-nums">{day}</div>
        <div className="text-[11px] text-muted-foreground">{month}月</div>
      </div>
      <div className="h-9 w-px shrink-0 bg-border" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{menu ?? "-"}</div>
        <div className="truncate text-xs text-muted-foreground">{place ?? "-"}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-numeric text-lg leading-none font-bold tabular-nums">
          {veloKph ?? "-"}
        </div>
        <div className="text-[11px] text-muted-foreground">km/h</div>
      </div>
    </Link>
  );
}
