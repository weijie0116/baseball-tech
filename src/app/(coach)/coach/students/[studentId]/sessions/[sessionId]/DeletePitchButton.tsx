"use client";

import { useTransition } from "react";
import { deletePitchMetricAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DeletePitchButton({
  studentId,
  sessionId,
  pitchMetricId,
}: {
  studentId: string;
  sessionId: string;
  pitchMetricId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(() => deletePitchMetricAction(studentId, sessionId, pitchMetricId))
      }
    >
      刪除
    </Button>
  );
}
