/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FIELDING_POSITION_OPTIONS } from "@/lib/baseball";

function positionLabel(value: string | null): string {
  if (!value) return "-";
  return FIELDING_POSITION_OPTIONS.find((p) => p.value === value)?.label ?? value;
}

export type StudentCardData = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  school: string | null;
  team: string | null;
  position: string | null;
  jersey_number: string | null;
  fastest_velocity_kph?: number | null;
};

export function StudentCard({ student, href }: { student: StudentCardData; href: string }) {
  const subtitle = [student.team, student.school].filter(Boolean).join(" · ");

  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs text-muted-foreground">
              {student.avatar_url ? (
                <img src={student.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                "照片"
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">{student.full_name}</div>
              {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {student.position && (
              <Badge variant="outline" className="border-transparent bg-accent text-accent-foreground">
                {positionLabel(student.position)}
              </Badge>
            )}
            {student.jersey_number && <Badge variant="secondary">#{student.jersey_number}</Badge>}
          </div>

          <div className="flex items-end justify-between border-t pt-2.5">
            <div className="text-xs text-muted-foreground">最快球速</div>
            <div className="flex items-baseline gap-1">
              <span className="font-numeric text-lg font-bold tabular-nums">
                {student.fastest_velocity_kph ?? "-"}
              </span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
