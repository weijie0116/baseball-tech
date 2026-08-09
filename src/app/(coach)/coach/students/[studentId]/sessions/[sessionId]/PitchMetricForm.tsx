"use client";

import { useActionState } from "react";
import { addPitchMetricAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PITCH_TYPE_OPTIONS } from "@/lib/baseball";

const initialState: ActionState = {};

export function PitchMetricForm({
  studentId,
  sessionId,
  nextPitchNumber,
}: {
  studentId: string;
  sessionId: string;
  nextPitchNumber: number;
}) {
  const action = addPitchMetricAction.bind(null, studentId, sessionId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} key={nextPitchNumber} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pitch_number">第幾球</Label>
        <Input
          id="pitch_number"
          name="pitch_number"
          type="number"
          defaultValue={nextPitchNumber}
          className="w-20"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pitch_type">球種</Label>
        <select
          id="pitch_type"
          name="pitch_type"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">未指定</option>
          {PITCH_TYPE_OPTIONS.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="velocity_kph">球速 (km/h)</Label>
        <Input id="velocity_kph" name="velocity_kph" type="number" step="0.1" className="w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="spin_rate_rpm">轉速 (rpm)</Label>
        <Input id="spin_rate_rpm" name="spin_rate_rpm" type="number" step="1" className="w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">備註</Label>
        <Input id="notes" name="notes" className="w-32" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "新增中..." : "新增"}
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
