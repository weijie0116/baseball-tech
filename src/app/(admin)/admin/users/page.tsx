import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "./CreateUserForm";
import { ToggleActiveButton } from "./ToggleActiveButton";
import { NotificationsList } from "./NotificationsList";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_LABEL: Record<string, string> = {
  admin: "管理者",
  coach: "教練",
  student: "學員",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, recipient_id, type, title, body, link_path, read_at, created_at")
    .eq("recipient_id", user!.id)
    .is("read_at", null)
    .order("created_at", { ascending: false });

  const coaches = (profiles ?? []).filter((p) => p.role === "coach");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">帳號管理</h1>
        <p className="text-muted-foreground text-sm">
          建立教練/學員帳號、停用不再使用的帳號。
        </p>
      </div>

      <NotificationsList notifications={notifications ?? []} />

      <CreateUserForm coaches={coaches.map((c) => ({ id: c.id, full_name: c.full_name }))} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>建立時間</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(profiles ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.full_name}</TableCell>
              <TableCell>{ROLE_LABEL[p.role] ?? p.role}</TableCell>
              <TableCell>
                <Badge variant={p.is_active ? "default" : "outline"}>
                  {p.is_active ? "啟用中" : "已停用"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(p.created_at).toLocaleDateString("zh-TW")}
              </TableCell>
              <TableCell className="text-right">
                <ToggleActiveButton userId={p.id} isActive={p.is_active} />
              </TableCell>
            </TableRow>
          ))}
          {(profiles ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                目前還沒有任何帳號。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
