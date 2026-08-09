import { createClient } from "@/lib/supabase/server";
import { pitchTypeLabel } from "@/lib/baseball";
import { VideoLinksList } from "@/components/VideoLinksList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StudentSessionDetailPage({
  params,
}: PageProps<"/student/sessions/[sessionId]">) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const [{ data: session }, { data: pitches }, { data: videos }] = await Promise.all([
    supabase
      .from("training_sessions")
      .select("session_date, location, menu_notes, general_notes")
      .eq("id", sessionId)
      .single(),
    supabase
      .from("pitch_metrics")
      .select("id, pitch_number, pitch_type, velocity_kph, spin_rate_rpm, notes")
      .eq("session_id", sessionId)
      .order("pitch_number", { ascending: true }),
    supabase
      .from("session_videos")
      .select("id, storage_path, share_password, file_name")
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{session?.session_date} 訓練紀錄</h1>
        {session?.location && <p className="text-muted-foreground text-sm">地點:{session.location}</p>}
      </div>

      {(session?.menu_notes || session?.general_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>訓練菜單</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 whitespace-pre-wrap text-sm">
            {session?.menu_notes && <p>{session.menu_notes}</p>}
            {session?.general_notes && (
              <p className="text-muted-foreground">備註:{session.general_notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>投球數據</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>球種</TableHead>
                <TableHead>球速 (km/h)</TableHead>
                <TableHead>轉速 (rpm)</TableHead>
                <TableHead>備註</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pitches ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.pitch_number ?? "-"}</TableCell>
                  <TableCell>{pitchTypeLabel(p.pitch_type)}</TableCell>
                  <TableCell>{p.velocity_kph ?? "-"}</TableCell>
                  <TableCell>{p.spin_rate_rpm ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.notes ?? "-"}</TableCell>
                </TableRow>
              ))}
              {(pitches ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    尚無投球數據
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>投球影片</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoLinksList videos={videos ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
