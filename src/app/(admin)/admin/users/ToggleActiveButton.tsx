"use client";

import { useTransition } from "react";
import { setUserActiveAction } from "./actions";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant={isActive ? "outline" : "default"}
      disabled={isPending}
      onClick={() => startTransition(() => setUserActiveAction(userId, !isActive))}
    >
      {isActive ? "停用" : "啟用"}
    </Button>
  );
}
