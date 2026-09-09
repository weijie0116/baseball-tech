import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ScheduleRow = {
  id: string;
  student_id: string;
  scheduled_time: string;
  student_name: string;
  coach_name?: string;
  status: "confirmed" | "cancelled";
  source: "web" | "line";
};

export function ScheduleTable({
  rows,
  showCoach,
  studentLinkBase,
}: {
  rows: ScheduleRow[];
  showCoach?: boolean;
  /** e.g. "/coach/students" — if given, student names link to `${studentLinkBase}/${student_id}` */
  studentLinkBase?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-base font-semibold">今天 {rows.length} 堂課</span>
        </div>
        <div className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 border-b py-3 last:border-b-0"
            >
              <span className="font-numeric w-14 shrink-0 text-lg font-bold tabular-nums">
                {r.scheduled_time.slice(0, 5)}
              </span>
              <span
                className={
                  "h-8 w-0.5 shrink-0 rounded-full " +
                  (r.status === "confirmed" ? "bg-primary" : "bg-border")
                }
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {studentLinkBase ? (
                    <Link href={`${studentLinkBase}/${r.student_id}`} className="hover:underline">
                      {r.student_name}
                    </Link>
                  ) : (
                    r.student_name
                  )}
                </div>
                {showCoach && (
                  <div className="truncate text-xs text-muted-foreground">教練:{r.coach_name}</div>
                )}
              </div>
              <Badge variant={r.status === "confirmed" ? "default" : "outline"}>
                {r.status === "confirmed" ? "已確認" : "已取消"}
              </Badge>
              <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                {r.source === "line" ? "LINE" : "網站"}
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">這天沒有排課。</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
