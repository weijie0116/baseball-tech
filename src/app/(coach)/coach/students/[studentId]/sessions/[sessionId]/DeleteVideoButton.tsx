"use client";

import { useTransition } from "react";
import { deleteVideoLinkAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteVideoButton({
  studentId,
  sessionId,
  videoId,
}: {
  studentId: string;
  sessionId: string;
  videoId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => startTransition(() => deleteVideoLinkAction(studentId, sessionId, videoId))}
    >
      刪除
    </Button>
  );
}
