"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState } from "react";
import { uploadAvatarAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function AvatarUploadForm({ studentId, avatarUrl }: { studentId: string; avatarUrl: string | null }) {
  const action = uploadAvatarAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs text-muted-foreground">
        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : "無照片"}
      </div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="avatar">學員照片</Label>
          <Input id="avatar" name="avatar" type="file" accept="image/*" className="w-56" />
        </div>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "上傳中..." : "上傳照片"}
        </Button>
        {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}
