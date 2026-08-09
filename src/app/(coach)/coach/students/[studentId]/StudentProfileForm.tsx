"use client";

import { useActionState } from "react";
import { updateStudentProfileAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PITCH_TYPE_OPTIONS, FIELDING_POSITION_OPTIONS } from "@/lib/baseball";
import type { StudentProfile } from "@/types/database.types";

const initialState: ActionState = {};

type Props = {
  studentId: string;
  studentProfile: Pick<
    StudentProfile,
    "birth_date" | "dominant_hand" | "notes" | "school" | "team" | "position" | "pitch_types"
  > | null;
};

export function StudentProfileForm({ studentId, studentProfile }: Props) {
  const action = updateStudentProfileAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const selectedPitchTypes = new Set(studentProfile?.pitch_types ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本資料</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="school">學校</Label>
              <Input id="school" name="school" defaultValue={studentProfile?.school ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="team">球隊</Label>
              <Input id="team" name="team" defaultValue={studentProfile?.team ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="position">守備位置</Label>
              <select
                id="position"
                name="position"
                defaultValue={studentProfile?.position ?? ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">未設定</option>
                {FIELDING_POSITION_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dominant_hand">慣用手</Label>
              <select
                id="dominant_hand"
                name="dominant_hand"
                defaultValue={studentProfile?.dominant_hand ?? ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">未設定</option>
                <option value="right">右投</option>
                <option value="left">左投</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birth_date">生日</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                defaultValue={studentProfile?.birth_date ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>球種</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {PITCH_TYPE_OPTIONS.map((pt) => (
                <label key={pt.value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="pitch_types"
                    value={pt.value}
                    defaultChecked={selectedPitchTypes.has(pt.value)}
                    className="size-4"
                  />
                  {pt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">備註</Label>
            <Textarea id="notes" name="notes" defaultValue={studentProfile?.notes ?? ""} rows={3} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-green-600">已儲存。</p>}

          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? "儲存中..." : "儲存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
