// ── Journal d'actions admin + helpers de préfixes support, partagés entre App.tsx et Admin.tsx. ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).
import { SUPABASE_URL, SUPABASE_KEY } from "./supabase";

export const SUPPORT_PREFIX_USER = "[SUPPORT_USER]";
export const SUPPORT_PREFIX_REPLY = "[SUPPORT_REPLY]";

export const isSupportReason = (reason?: string) => !!reason && (reason.startsWith(SUPPORT_PREFIX_USER) || reason.startsWith(SUPPORT_PREFIX_REPLY));
export const cleanSupportReason = (reason?: string) => (reason || "").replace(SUPPORT_PREFIX_USER, "").replace(SUPPORT_PREFIX_REPLY, "").trim();

export function logAdminAction(token: string, adminId: string, adminName: string, action: string, targetUserId?: string) {
  try {
    fetch(`${SUPABASE_URL}/rest/v1/admin_logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ admin_id: adminId, admin_name: adminName, action, target_user_id: targetUserId || null, created_at: new Date().toISOString() }),
    });
  } catch {}
}
