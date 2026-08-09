/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
};

export function StudentCard({ student, href }: { student: StudentCardData; href: string }) {
  const subtitle = [student.team, student.school].filter(Boolean).join(" · ");

  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col items-center gap-2 pt-2 text-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-md bg-muted text-xs text-muted-foreground">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              "無照片"
            )}
          </div>
          <div className="font-semibold">{student.full_name}</div>
          {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          <div className="text-sm text-muted-foreground">
            {student.jersey_number ? `#${student.jersey_number}` : null}
            {student.jersey_number && student.position ? "  " : null}
            {positionLabel(student.position)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
