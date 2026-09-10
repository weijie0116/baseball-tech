"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { positionLabel } from "@/lib/baseball";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type RailStudent = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  position: string | null;
  jersey_number: string | null;
  fastest_velocity_kph: number | null;
};

export function StudentRailList({
  roster,
  activeStudentId,
}: {
  roster: RailStudent[];
  activeStudentId: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? roster.filter((s) => s.full_name.toLowerCase().includes(query.trim().toLowerCase()))
    : roster;

  return (
    <>
      <Input
        placeholder="搜尋學員姓名…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="flex flex-col gap-1">
        {filtered.map((s) => {
          const isActive = s.id === activeStudentId;
          return (
            <Link
              key={s.id}
              href={`/coach/students/${s.id}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg p-2 text-sm",
                isActive ? "bg-accent" : "hover:bg-muted"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-[10px] text-muted-foreground">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  "照片"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("truncate", isActive ? "font-semibold text-accent-foreground" : "font-normal")}>
                  {s.full_name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {[positionLabel(s.position), s.jersey_number ? `#${s.jersey_number}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <span className="font-numeric shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                {s.fastest_velocity_kph ?? "-"}
              </span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground p-2 text-xs">
            {query ? `找不到符合「${query}」的學員。` : "目前還沒有學員。"}
          </p>
        )}
      </div>
    </>
  );
}
