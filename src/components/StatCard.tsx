import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  unit,
  subtext,
  primary,
}: {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  primary?: boolean;
}) {
  return (
    <Card className={primary ? "bg-primary text-primary-foreground" : undefined}>
      <CardContent className="flex flex-col gap-1.5">
        <div className={primary ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-numeric text-3xl font-bold leading-none tabular-nums">{value}</span>
          {unit && (
            <span className={primary ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
              {unit}
            </span>
          )}
        </div>
        {subtext && (
          <div className={primary ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
            {subtext}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
