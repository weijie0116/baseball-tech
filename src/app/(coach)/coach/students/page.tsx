import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CoachStudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: studentProfiles } = await supabase
    .from("student_profiles")
    .select("student_id, birth_date, dominant_hand")
    .eq("coach_id", user!.id);

  const studentIds = (studentProfiles ?? []).map((s) => s.student_id);
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">我的學員</h1>
        <p className="text-muted-foreground text-sm">點學員姓名查看/編輯詳細資料。</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>慣用手</TableHead>
            <TableHead>生日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(studentProfiles ?? []).map((s) => (
            <TableRow key={s.student_id}>
              <TableCell>
                <Link href={`/coach/students/${s.student_id}`} className="underline">
                  {nameById.get(s.student_id) ?? "(未命名)"}
                </Link>
              </TableCell>
              <TableCell>
                {s.dominant_hand === "left" ? "左投" : s.dominant_hand === "right" ? "右投" : "-"}
              </TableCell>
              <TableCell>{s.birth_date ?? "-"}</TableCell>
            </TableRow>
          ))}
          {(studentProfiles ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground text-center">
                目前還沒有指派給你的學員,請管理者指派。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
