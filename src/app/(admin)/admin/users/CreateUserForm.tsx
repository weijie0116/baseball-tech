"use client";

import { useActionState, useState } from "react";
import { createUserAction, type CreateUserState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { UserRole } from "@/types/database.types";

const initialState: CreateUserState = {};

export function CreateUserForm({
  coaches,
}: {
  coaches: { id: string; full_name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);
  const [role, setRole] = useState<UserRole | "">("");
  const [coachId, setCoachId] = useState<string>("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>建立新帳號</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {/* Select components are controlled via React state, not native
              form participation — mirror their values into hidden inputs
              so FormData picks them up. */}
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="coach_id" value={coachId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">姓名</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">角色</Label>
              <Select value={role} onValueChange={(v) => setRole((v ?? "") as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="選擇角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">教練</SelectItem>
                  <SelectItem value="student">學員</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">初始密碼</Label>
              <Input id="password" name="password" type="text" required minLength={6} />
            </div>
          </div>

          {role === "student" && (
            <div className="flex flex-col gap-2 sm:w-1/2">
              <Label htmlFor="coach_id">指派教練(選填)</Label>
              <Select value={coachId} onValueChange={(v) => setCoachId(v ?? "")}>
                <SelectTrigger id="coach_id">
                  <SelectValue placeholder="之後再指派也可以" />
                </SelectTrigger>
                <SelectContent>
                  {coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-green-600">帳號建立成功。</p>}

          <Button type="submit" disabled={isPending || !role} className="w-fit">
            {isPending ? "建立中..." : "建立帳號"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
