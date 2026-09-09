// Shared baseball vocabulary used across student profile and (later) pitch
// metrics forms, so labels stay consistent in one place.

export const PITCH_TYPE_OPTIONS = [
  { value: "fastball", label: "直球" },
  { value: "curveball", label: "曲球" },
  { value: "slider", label: "滑球" },
  { value: "changeup", label: "變速球" },
  { value: "forkball", label: "指叉球" },
  { value: "sinker", label: "伸卡球" },
  { value: "other", label: "其他" },
] as const;

export function pitchTypeLabel(value: string | null): string {
  if (!value) return "-";
  return PITCH_TYPE_OPTIONS.find((pt) => pt.value === value)?.label ?? value;
}

export const FIELDING_POSITION_OPTIONS = [
  { value: "P", label: "投手" },
  { value: "C", label: "捕手" },
  { value: "1B", label: "一壘手" },
  { value: "2B", label: "二壘手" },
  { value: "3B", label: "三壘手" },
  { value: "SS", label: "游擊手" },
  { value: "LF", label: "左外野手" },
  { value: "CF", label: "中外野手" },
  { value: "RF", label: "右外野手" },
  { value: "DH", label: "指定打擊" },
] as const;

export function positionLabel(value: string | null): string {
  if (!value) return "-";
  return FIELDING_POSITION_OPTIONS.find((p) => p.value === value)?.label ?? value;
}
