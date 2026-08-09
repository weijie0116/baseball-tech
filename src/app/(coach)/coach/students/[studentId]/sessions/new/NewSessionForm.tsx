"use client";

import { useActionState } from "react";
import { createSessionAction, type CreateSessionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CreateSessionState = {};

export function NewSessionForm({ studentId }: { studentId: string }) {
  const action = createSessionAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="session_date">日期</Label>
          <Input
            id="session_date"
            name="session_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="location">地點</Label>
          <Input id="location" name="location" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="menu_notes">訓練菜單</Label>
        <Textarea id="menu_notes" name="menu_notes" rows={4} placeholder="今天練習的內容..." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="general_notes">備註</Label>
        <Textarea id="general_notes" name="general_notes" rows={2} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "建立中..." : "建立課程紀錄"}
      </Button>
    </form>
  );
}
