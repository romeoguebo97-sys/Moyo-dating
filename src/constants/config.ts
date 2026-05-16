// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — URLs et limites applicatives
// ─────────────────────────────────────────────────────────────────────────────

export const SUPABASE_URL = "https://mcswcapxpruiffzrxfvl.supabase.co";
export const SUPABASE_KEY = "sb_publishable_nx44ipF3_X98flDVXxBZ5A_aztvDdgN";
export const APP_URL = "https://moyo-congo-appe.vercel.app";

export const FREE_LIMITS = { likes: 5, messages: 3 };
export const STATUS_LIMIT = 2; // Maximum de statuts actifs par utilisateur sur 24h

export const SUPPORT_TEAM_ID = "moyo-support-team";
export const SUPPORT_TEAM_NAME = "Assistance Moyo";
export const SUPPORT_PREFIX_USER = "[SUPPORT_USER]";
export const SUPPORT_PREFIX_REPLY = "[SUPPORT_REPLY]";

export const STATUS_BUCKETS = ["statuses", "status"] as const;
