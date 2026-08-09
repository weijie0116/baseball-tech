// Hand-written types matching supabase/migrations/0001_init.sql.
// Once a real Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
// and this file can be replaced wholesale.
//
// IMPORTANT: these must be `type X = {...}` object-literal aliases, not
// `interface X {...}`. An interface used as a table's Row type fails the
// structural `extends GenericTable` check inside @supabase/postgrest-js,
// which silently degrades every query on that table to `never`. This is
// why the real `supabase gen types` CLI always emits `type`, never
// `interface` — mirror that convention here.

export type UserRole = "admin" | "coach" | "student";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type StudentProfile = {
  student_id: string;
  coach_id: string | null;
  birth_date: string | null;
  dominant_hand: "left" | "right" | null;
  notes: string | null;
  school: string | null;
  team: string | null;
  position: string | null;
  pitch_types: string[];
  updated_at: string;
};

export type StudentMeasurement = {
  id: string;
  student_id: string;
  measured_at: string;
  height_cm: number | null;
  weight_kg: number | null;
  recorded_by: string | null;
  created_at: string;
};

export type TrainingSession = {
  id: string;
  student_id: string;
  coach_id: string;
  session_date: string;
  location: string | null;
  menu_notes: string | null;
  general_notes: string | null;
  is_checkpoint: boolean;
  checkpoint_phase_label: string | null;
  mechanics_analysis_notes: string | null;
  created_at: string;
};

export type PitchMetric = {
  id: string;
  session_id: string;
  pitch_number: number | null;
  pitch_type: string | null;
  velocity_kph: number | null;
  spin_rate_rpm: number | null;
  notes: string | null;
  // Escape hatch for future metrics (release point, extension, movement, etc.)
  // without a schema migration.
  extra_metrics: Record<string, unknown>;
  recorded_at: string;
};

export type VideoStorageLocation = "nas";

export type SessionVideo = {
  id: string;
  session_id: string;
  storage_location: VideoStorageLocation;
  // For storage_location "nas": a Synology QuickConnect File Station share
  // URL (e.g. https://gofile.me/...). The app links out to it rather than
  // playing inline — HEVC-encoded iPhone videos don't get a browser
  // preview from Synology's share page, only a download button.
  storage_path: string;
  share_password: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type SessionCheckpointFrame = {
  id: string;
  session_id: string;
  frame_order: number;
  video_timestamp_seconds: number | null;
  image_storage_key: string;
  // AI's first-pass guess at which pitching phase this frame represents
  // (e.g. 抬腿/跨步/出手). Coach can confirm or override.
  phase_guess: string | null;
  is_ai_suggested: boolean;
  confirmed_by_coach: boolean;
  caption: string | null;
  created_at: string;
};

export type LinePendingContext = {
  line_user_id: string;
  student_id: string;
  updated_at: string;
};

export type LineVideoRequestStatus = "pending" | "processing" | "done" | "error";

export type LineVideoRequest = {
  id: string;
  line_user_id: string;
  line_message_id: string;
  student_id: string | null;
  student_name_hint: string | null;
  status: LineVideoRequestStatus;
  error_message: string | null;
  training_session_id: string | null;
  created_at: string;
  processed_at: string | null;
};

type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> } & NoRelationships;
      student_profiles: { Row: StudentProfile; Insert: Partial<StudentProfile>; Update: Partial<StudentProfile> } & NoRelationships;
      student_measurements: { Row: StudentMeasurement; Insert: Partial<StudentMeasurement>; Update: Partial<StudentMeasurement> } & NoRelationships;
      training_sessions: { Row: TrainingSession; Insert: Partial<TrainingSession>; Update: Partial<TrainingSession> } & NoRelationships;
      pitch_metrics: { Row: PitchMetric; Insert: Partial<PitchMetric>; Update: Partial<PitchMetric> } & NoRelationships;
      session_videos: { Row: SessionVideo; Insert: Partial<SessionVideo>; Update: Partial<SessionVideo> } & NoRelationships;
      session_checkpoint_frames: { Row: SessionCheckpointFrame; Insert: Partial<SessionCheckpointFrame>; Update: Partial<SessionCheckpointFrame> } & NoRelationships;
      line_pending_context: { Row: LinePendingContext; Insert: Partial<LinePendingContext>; Update: Partial<LinePendingContext> } & NoRelationships;
      line_video_requests: { Row: LineVideoRequest; Insert: Partial<LineVideoRequest>; Update: Partial<LineVideoRequest> } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      video_storage_location: VideoStorageLocation;
    };
    CompositeTypes: Record<string, never>;
  };
};
