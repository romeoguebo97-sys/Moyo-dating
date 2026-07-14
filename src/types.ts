// ── Types partagés entre App.tsx et Admin.tsx. ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).

export type Auth = {
  token: string;
  userId: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  isPremium: boolean;
  isAdmin: boolean;
  adminLevel?: "admin" | "superadmin";
  refreshToken?: string;
  expiresAt?: number;
};

export type Profile = { id: string; name: string; age: number; city: string; gender: string; bio: string; religion?: string; profession?: string; hobbies?: string; phone?: string | null; photo_url?: string | null; is_premium: boolean; is_admin?: boolean; is_visible?: boolean; is_verified?: boolean; is_certified?: boolean; last_seen?: string; hide_online_status?: boolean; warning_count?: number; is_banned?: boolean; ban_until?: string | null; ban_reason?: string | null; last_notice_acknowledged?: boolean; last_notice_at?: string | null; has_installed_pwa?: boolean; account_deleted?: boolean; share_phone_with_matches?: boolean };

export type Match = { id: string; user1: string; user2: string; partner?: Profile; lastMsg?: Message; unreadCount?: number; created_at?: string };

export type Message = { id?: string; match_id: string; sender_id: string; content: string; is_read: boolean; is_delivered?: boolean; is_edited?: boolean; created_at?: string; reactions?: Record<string, string[]>; is_view_once?: boolean; viewed_at?: string | null; is_destroyed?: boolean; destroyed_at?: string | null };

export type StatusPost = { id?: string; user_id: string; image_url?: string | null; image_path?: string | null; caption?: string | null; text?: string | null; created_at?: string; expires_at?: string; profile?: Profile; is_official?: boolean; is_sponsored?: boolean; link_url?: string | null; is_feature?: boolean; target_gender?: string | null; feature_user_id?: string | null; feature_profile?: Profile };

export type ToastState = { msg: string; type?: "success" | "error" | "premium" } | null;

export type PaymentRequest = { id: string; user_id: string; operator: string; tx_ref: string; amount: number; status: string; created_at: string; approved_at?: string; gift_for?: string; gift_for_name?: string; archived?: boolean; currency?: string; kind?: string; appointment_id?: string; profile?: { name: string; photo_url?: string | null; gender?: string } };
