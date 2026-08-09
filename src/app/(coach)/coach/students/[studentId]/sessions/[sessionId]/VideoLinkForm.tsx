"use client";

import { useActionState } from "react";
import { addVideoLinkAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function VideoLinkForm({ studentId, sessionId }: { studentId: string; sessionId: string }) {
  const action = addVideoLinkAction.bind(null, studentId, sessionId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-2 basis-64">
        <Label htmlFor="storage_path">NAS 分享連結</Label>
        <Input id="storage_path" name="storage_path" placeholder="https://gofile.me/..." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="share_password">連結密碼(選填)</Label>
        <Input id="share_password" name="share_password" className="w-32" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="file_name">影片說明(選填)</Label>
        <Input id="file_name" name="file_name" placeholder="例如:牛棚投球" className="w-40" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "新增中..." : "新增影片連結"}
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
