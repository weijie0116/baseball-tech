"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordButton({ userId, fullName }: { userId: string; fullName: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [state, setState] = useState<{ success?: boolean; error?: string } | null>(null);

  if (state?.success) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs">
        <span className="text-muted-foreground">已改好 {fullName} 的密碼,記得告知本人。</span>
        <button
          type="button"
          className="text-muted-foreground underline"
          onClick={() => {
            setState(null);
            setOpen(false);
            setPassword("");
          }}
        >
          關閉
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        重設密碼
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col items-end gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm(`確定要把 ${fullName} 的密碼改成這組新密碼嗎?原密碼會立刻失效。`)) return;
        startTransition(async () => {
          const res = await resetPasswordAction(userId, password);
          setState(res);
        });
      }}
    >
      <div className="flex gap-1.5">
        <Input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="輸入新密碼"
          minLength={6}
          required
          className="h-8 w-36"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "更新中..." : "確定"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            setOpen(false);
            setPassword("");
          }}
        >
          取消
        </Button>
      </div>
      {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
    </form>
  );
}
