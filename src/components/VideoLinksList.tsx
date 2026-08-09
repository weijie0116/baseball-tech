import type { ReactNode } from "react";

export type VideoLinkDisplay = {
  id: string;
  storage_path: string;
  share_password: string | null;
  file_name: string | null;
};

export function VideoLinksList({
  videos,
  renderActions,
}: {
  videos: VideoLinkDisplay[];
  renderActions?: (video: VideoLinkDisplay) => ReactNode;
}) {
  if (videos.length === 0) {
    return <p className="text-muted-foreground text-sm">尚未新增影片連結。</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {videos.map((v) => (
        <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-md border p-2 text-sm">
          <a
            href={v.storage_path}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {v.file_name || "開啟影片下載連結"}
          </a>
          {v.share_password && (
            <span className="text-muted-foreground">連結密碼:{v.share_password}</span>
          )}
          {renderActions && <div className="ml-auto">{renderActions(v)}</div>}
        </li>
      ))}
    </ul>
  );
}
