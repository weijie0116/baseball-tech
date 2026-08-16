"use client";

import { useActionState, useState } from "react";
import { createStudentAction, type CreateStudentState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const initialState: CreateStudentState = {};

export function CreateStudentForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createStudentAction, initialState);

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        新增學員
      </Button>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>新增學員</CardTitle>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>學員帳號建立成功,已自動指派給你。</p>
            <p>
              Email:<span className="font-mono">{state.success.email}</span>
            </p>
            <p>
              臨時密碼:<span className="font-mono">{state.success.tempPassword}</span>
            </p>
            <p className="text-muted-foreground">
              請把這組帳密告訴學員,他登入後可以自己到登入頁用「忘記密碼」改成自己的密碼。
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setOpen(false)}
            >
              關閉
            </Button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name">學員姓名</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email(學員登入用)</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending} className="w-fit">
                {isPending ? "建立中..." : "建立帳號"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
