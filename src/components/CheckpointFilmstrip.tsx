/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge";

export type CheckpointFrameDisplay = {
  id: string;
  url: string | null;
  phase_guess: string | null;
  confirmed_by_coach: boolean;
  caption: string | null;
};

export function CheckpointFilmstrip({ frames }: { frames: CheckpointFrameDisplay[] }) {
  if (frames.length === 0) {
    return <p className="text-muted-foreground text-sm">尚未擷取關鍵畫面。</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {frames.map((f) => (
        <figure key={f.id} className="flex w-64 shrink-0 flex-col gap-1.5 sm:w-80">
          <div className="overflow-hidden rounded-md bg-muted">
            {f.url && (
              // Source videos can be landscape or portrait depending on how
              // the coach filmed them — render at natural aspect ratio
              // (no fixed box + object-cover) so nothing gets cropped.
              <img src={f.url} alt={f.phase_guess ?? "投球動作截圖"} className="block w-full h-auto" />
            )}
          </div>
          <figcaption className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
            {f.phase_guess ?? "-"}
            {!f.confirmed_by_coach && (
              <Badge variant="outline" className="border-transparent bg-accent text-accent-foreground">
                AI 建議
              </Badge>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
