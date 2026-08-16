"use client";

import { useTransition } from "react";
import { markNotificationReadAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Notification } from "@/types/database.types";

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [isPending, startTransition] = useTransition();

  if (notifications.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>通知</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-4 text-sm">
            <div>
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-muted-foreground">{n.body}</p>}
              <p className="text-muted-foreground text-xs">
                {new Date(n.created_at).toLocaleString("zh-TW")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => startTransition(() => markNotificationReadAction(n.id))}
            >
              標記已讀
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
