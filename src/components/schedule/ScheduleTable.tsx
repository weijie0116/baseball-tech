import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>時間</TableHead>
          <TableHead>學員</TableHead>
          {showCoach && <TableHead>教練</TableHead>}
          <TableHead>狀態</TableHead>
          <TableHead>來源</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.scheduled_time.slice(0, 5)}</TableCell>
            <TableCell>
              {studentLinkBase ? (
                <Link href={`${studentLinkBase}/${r.student_id}`} className="underline">
                  {r.student_name}
                </Link>
              ) : (
                r.student_name
              )}
            </TableCell>
            {showCoach && <TableCell>{r.coach_name}</TableCell>}
            <TableCell>
              <Badge variant={r.status === "confirmed" ? "default" : "outline"}>
                {r.status === "confirmed" ? "已確認" : "已取消"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {r.source === "line" ? "LINE" : "網站"}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={showCoach ? 5 : 4} className="text-muted-foreground text-center">
              這天沒有排課。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
