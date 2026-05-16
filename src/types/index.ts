// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Modèles de données partagés dans toute l'application
// ─────────────────────────────────────────────────────────────────────────────

export type Auth = {
  token: string;
  userId: string;
  name: string;
  email: string;
  isPremium: boolean;
  isAdmin: boolean;
  /** refresh_token Supabase */
  refreshToken?: string;
  /** timestamp ms (Date.now()) d'expiration du access_token */
  expiresAt?: number;
};

export type Profile = {
  id: string;
  name: string;
  age: number;
  city: string;
  gender: string;
  bio: string;
  religion?: string;
  profession?: string;
  hobbies?: string;
  photo_url?: string | null;
  is_premium: boolean;
  is_admin?: boolean;
  is_visible?: boolean;
  is_verified?: boolean;
  is_certified?: boolean;
  last_seen?: string;
  warning_count?: number;
};

export type Match = {
  id: string;
  user1: string;
  user2: string;
  partner?: Profile;
  lastMsg?: Message;
  unreadCount?: number;
};

export type Message = {
  id?: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  is_delivered?: boolean;
  created_at?: string;
  reactions?: Record<string, string[]>;
};

export type StatusPost = {
  id?: string;
  user_id: string;
  image_url?: string | null;
  image_path?: string | null;
  caption?: string | null;
  text?: string | null;
  created_at?: string;
  expires_at?: string;
  profile?: Profile;
};

export type ToastState = { msg: string; type?: "success" | "error" | "premium" } | null;

export type LikeRecord  = { from_user: string; to_user: string; created_at?: string };
export type ViewRecord  = { viewer_id: string; viewed_id: string; created_at?: string };
export type VisitRecord = { visitor_id: string; visited_id: string; created_at?: string };
export type MatchRecord = { id: string; user1: string; user2: string };

export type ReportRowLike = {
  id?: string;
  reason: string;
  reporter_id: string;
  reported_id: string | null;
  status?: string;
  created_at?: string;
};
