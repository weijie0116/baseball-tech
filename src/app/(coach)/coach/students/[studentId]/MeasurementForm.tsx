"use client";

import { useActionState } from "react";
import { addMeasurementAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const initialState: ActionState = {};

export function MeasurementForm({ studentId }: { studentId: string }) {
  const action = addMeasurementAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>新增身高體重紀錄</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="measured_at">量測日期</Label>
            <Input
              id="measured_at"
              name="measured_at"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="height_cm">身高 (cm)</Label>
            <Input id="height_cm" name="height_cm" type="number" step="0.1" className="w-28" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weight_kg">體重 (kg)</Label>
            <Input id="weight_kg" name="weight_kg" type="number" step="0.1" className="w-28" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "新增中..." : "新增紀錄"}
          </Button>
        </form>
        {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}
