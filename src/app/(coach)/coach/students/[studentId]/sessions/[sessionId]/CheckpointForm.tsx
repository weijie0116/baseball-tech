"use client";

import { useActionState } from "react";
import { setCheckpointAction, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

const PHASE_LABEL_SUGGESTIONS = ["起始階段", "基準期", "進步期", "轉變期"];

export function CheckpointForm({
  studentId,
  sessionId,
  isCheckpoint,
  phaseLabel,
  analysisNotes,
}: {
  studentId: string;
  sessionId: string;
  isCheckpoint: boolean;
  phaseLabel: string | null;
  analysisNotes: string | null;
}) {
  const action = setCheckpointAction.bind(null, studentId, sessionId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="is_checkpoint" defaultChecked={isCheckpoint} className="size-4" />
        設為投球機制進步分析的代表性檢核點
      </label>

      <div className="flex flex-col gap-2">
        <Label htmlFor="checkpoint_phase_label">階段標籤</Label>
        <Input
          id="checkpoint_phase_label"
          name="checkpoint_phase_label"
          list="phase-label-suggestions"
          defaultValue={phaseLabel ?? ""}
          placeholder="例如:進步期"
        />
        <datalist id="phase-label-suggestions">
          {PHASE_LABEL_SUGGESTIONS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mechanics_analysis_notes">機制分析文字</Label>
        <Textarea
          id="mechanics_analysis_notes"
          name="mechanics_analysis_notes"
          rows={4}
          defaultValue={analysisNotes ?? ""}
          placeholder="這次課程觀察到的動作變化..."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">已儲存。</p>}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "儲存中..." : "儲存"}
      </Button>
    </form>
  );
}
