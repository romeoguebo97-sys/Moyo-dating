import React, { useState, useEffect, useRef } from "react";
// ── Auto-extracted from monolith ──

function Admin({ auth, onBack, onBadgeCount }: { auth: Auth; onBack: () => void; onBadgeCount?: (n: number) => void }) {
  // ── Sécurité : redirection si non-admin ──
  useEffect(() => {
    if (!auth.isAdmin) {
      console.warn("[Moyo][Admin] Accès refusé — non-admin");
      onBack();
    }
  }, [auth.isAdmin]);

  type ReportRow = {
    id?: string;
    reason: string;
    reporter_id: string;
    reported_id: string | null;
    status: string;
    created_at?: string;
  };

  type AdminProfile = {
    id: string;
    name: string;
    age: number;
    city: string;
    gender: string;
    is_premium: boolean;
    is_admin?: boolean;
    is_verified?: boolean;
    is_banned?: boolean;
    is_visible?: boolean;
    created_at?: string;
    warning_count?: number;
  };

  // ── Onglet actif ──
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "reports" | "reviews">("stats");

  // ── Avis utilisateurs ──
  type ReviewRow = { id: string; user_id: string; rating: number; comment?: string; is_read?: boolean; created_at: string; updated_at: string; profile?: { name: string; city?: string; gender?: string } };
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsStats, setReviewsStats] = useState<{ total: number; avg: number } | null>(null);
  const [hiddenReviews, setHiddenReviews] = useState<Set<string>>(new Set());

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const rows = await sb.query<ReviewRow>(auth.token, "app_ratings", "?select=id,user_id,rating,comment,is_read,created_at,updated_at&order=created_at.desc&limit=200");
      const enriched = await Promise.all(rows.map(async r => {
        const prof = await sb.query<{ name: string; city?: string; gender?: string }>(auth.token, "profiles", `?id=eq.${r.user_id}&select=name,city,gender`);
        return { ...r, profile: prof[0] };
      }));
      setReviews(enriched);
      if (enriched.length) {
        const avg = enriched.reduce((s, r) => s + r.rating, 0) / enriched.length;
        setReviewsStats({ total: enriched.length, avg: Math.round(avg * 10) / 10 });
      } else {
        setReviewsStats({ total: 0, avg: 0 });
      }
    } catch {}
    setReviewsLoading(false);
  };

  const deleteReview = async (id: string) => {
    await sb.delete(auth.token, "app_ratings", `?id=eq.${id}`);
    setReviews(prev => prev.filter(r => r.id !== id));
    setReviewsStats(prev => {
      if (!prev || prev.total <= 1) return { total: 0, avg: 0 };
      const remaining = reviews.filter(r => r.id !== id);
      const avg = remaining.length ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length : 0;
      return { total: remaining.length, avg: Math.round(avg * 10) / 10 };
    });
  };

  const markReviewRead = async (id: string) => {
    await fetch(`${SUPABASE_URL}/rest/v1/app_ratings?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}`, "Prefer": "return=minimal" },
      body: JSON.stringify({ is_read: true }),
    });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
  };

  const toggleHideReview = (id: string) => {
    setHiddenReviews(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ── Avertissements ──
  type WarnModal = { user: AdminProfile } | null;
  const WARN_REASONS = [
    "Comportement inapproprié",
    "Propos insultants",
    "Suspicion de faux profil",
    "Suspicion d'arnaque",
    "Non-respect des règles",
    "Autre motif",
  ];
  const [warnModal, setWarnModal] = useState<WarnModal>(null);
  const [warnReason, setWarnReason] = useState(WARN_REASONS[0]);
  const [warnCustom, setWarnCustom] = useState("");
  const [warnLoading, setWarnLoading] = useState(false);

  // ── Stats ──
  const [stats, setStats] = useState({
    users: 0, matches: 0, messages: 0, reports: 0,
    todayUsers: 0, premiumUsers: 0, verifiedUsers: 0, bannedUsers: 0,
    maleCount: 0, femaleCount: 0,
    topCities: [] as { city: string; count: number }[],
    recentUsers: [] as AdminProfile[],
  });

  // ── Reports ──
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportFilter, setReportFilter] = useState<"all" | "user" | "system" | "messaging" | "archived">("all");
  const [reportActionLoading, setReportActionLoading] = useState<string | null>(null); // report id en cours
  const [reportProfilePreview, setReportProfilePreview] = useState<AdminProfile | null>(null);
  const [reportProfileLoading, setReportProfileLoading] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState<{ report: ReportRow; userId: string } | null>(null);
  const [supportReplyText, setSupportReplyText] = useState("");

  // ── Users ──
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const USER_PAGE_SIZE = 20;

  // ── Global ──
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmModal, setConfirmModal] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId en cours
  const [showHelp, setShowHelp] = useState(false);

  // ── Utilitaires ──
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ── Chargement des stats globales ──
  const loadStats = async () => {
    setLoading(true);
    console.log("[Moyo][Admin] Chargement du dashboard…");
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const todayIso = today.toISOString();

      const [allUsers, matches, messages, reps, totalReps] = await Promise.all([
        sb.query<AdminProfile>(auth.token, "profiles", "?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,created_at&order=created_at.desc&limit=500"),
        sb.query<{ id: string }>(auth.token, "matches", "?select=id"),
        sb.query<{ id: string }>(auth.token, "messages", "?select=id"),
        sb.query<ReportRow>(auth.token, "reports", "?select=id,reason,reporter_id,reported_id,status,created_at&order=created_at.desc&limit=50"),
        sb.query<{ id: string }>(auth.token, "reports", "?select=id"),
      ]);

      // Calculs stats avancées
      const todayUsers = allUsers.filter(u => u.created_at && u.created_at >= todayIso).length;
      const premiumUsers = allUsers.filter(u => u.is_premium).length;
      const verifiedUsers = allUsers.filter(u => u.is_verified).length;
      const bannedUsers = allUsers.filter(u => u.is_banned).length;
      const maleCount = allUsers.filter(u => u.gender === "Homme").length;
      const femaleCount = allUsers.filter(u => u.gender === "Femme").length;

      // Top villes
      const cityMap: Record<string, number> = {};
      allUsers.forEach(u => { if (u.city) cityMap[u.city] = (cityMap[u.city] || 0) + 1; });
      const topCities = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      // Derniers inscrits
      const recentUsers = allUsers.slice(0, 5);

      setStats({
        users: allUsers.length,
        matches: matches.length,
        messages: messages.length,
        reports: totalReps.length,
        todayUsers, premiumUsers, verifiedUsers, bannedUsers,
        maleCount, femaleCount, topCities, recentUsers,
      });
      setReports(reps);
      console.log(`[Moyo][Admin] ✅ Dashboard chargé — ${allUsers.length} profils, ${reps.length} signalements`);
    } catch (e: any) {
      console.error("[Moyo][Admin] ❌ Erreur chargement dashboard :", e?.message || e);
      showToast("Erreur chargement dashboard : " + (e?.message || "inconnue"), "error");
    }
    setLoading(false);
  };

  // ── Chargement des utilisateurs avec recherche ──
  const loadUsers = async (search = "", page = 0) => {
    setUsersLoading(true);
    try {
      const offset = page * USER_PAGE_SIZE;
      let params = `?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,created_at&order=created_at.desc&limit=${USER_PAGE_SIZE}&offset=${offset}`;
      if (search.trim()) {
        // Recherche par nom (ilike)
        params = `?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,created_at&name=ilike.*${encodeURIComponent(search.trim())}*&order=created_at.desc&limit=${USER_PAGE_SIZE}&offset=${offset}`;
      }
      const res = await sb.query<AdminProfile>(auth.token, "profiles", params);
      setUsers(res);
    } catch (e: any) {
      console.error("[Moyo][Admin][Users] ❌ Erreur :", e?.message || e);
      showToast("Erreur chargement utilisateurs : " + (e?.message || "inconnue"), "error");
    }
    setUsersLoading(false);
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (activeTab === "users") loadUsers(userSearch, userPage);
  }, [activeTab, userPage]);

  // ── Action admin générique sur un profil ──
  const adminAction = async (
    userId: string,
    updates: Partial<AdminProfile>,
    successMsg: string,
  ) => {
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setActionLoading(userId);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify(updates),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const errMsg = data?.message || data?.code || `HTTP ${r.status}`;
        console.error("[Moyo][Admin][Action] ❌ Supabase error :", data);
        if (r.status === 403 || r.status === 401) {
          showToast(`Action bloquée par Supabase RLS (policy). Détail : ${errMsg}`, "error");
        } else {
          showToast(`Erreur Supabase : ${errMsg}`, "error");
        }
        return;
      }
      console.log("[Moyo][Admin][Action] ✅", successMsg, updates);
      showToast(successMsg, "success");
      // Mise à jour locale immédiate
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    } catch (e: any) {
      console.error("[Moyo][Admin][Action] ❌ Erreur réseau :", e?.message || e);
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setActionLoading(null);
  };

  // ── Suppression de compte ──
  const deleteAccount = async (user: AdminProfile) => {
    if (user.id === auth.userId) { showToast("Vous ne pouvez pas supprimer votre propre compte.", "error"); return; }
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setActionLoading(user.id);
    try {
      // Supprimer le profil (cascade selon policies)
      await sb.delete(auth.token, "profiles", `?id=eq.${user.id}`);
      console.log("[Moyo][Admin][Delete] ✅ Profil supprimé :", user.id);
      showToast(`Profil de ${user.name} supprimé.`, "success");
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setStats(s => ({ ...s, users: s.users - 1 }));
    } catch (e: any) {
      console.error("[Moyo][Admin][Delete] ❌ Erreur :", e?.message || e);
      showToast("Erreur suppression : " + (e?.message || "inconnue"), "error");
    }
    setActionLoading(null);
  };

  // ── Envoi d'un avertissement ──
  const sendWarning = async (user: AdminProfile) => {
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setWarnLoading(true);
    try {
      const finalReason = warnReason === "Autre motif" && warnCustom.trim()
        ? warnCustom.trim()
        : warnReason;
      const newCount = (user.warning_count || 0) + 1;
      // 1. Insérer l'avertissement
      const r = await fetch(`${SUPABASE_URL}/rest/v1/user_warnings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          user_id: user.id,
          admin_id: auth.userId,
          reason: finalReason,
          warning_number: newCount,
          acknowledged: false,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => null);
        showToast(`Erreur : ${err?.message || r.status}`, "error");
        setWarnLoading(false);
        return;
      }
      // 2. Incrémenter warning_count sur le profil
      await sb.update(auth.token, "profiles", user.id, { warning_count: newCount });
      // 3. Mise à jour locale
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, warning_count: newCount } : u));
      showToast(`Avertissement ${newCount}/3 envoyé à ${user.name}.`, "success");
      setWarnModal(null);
      setWarnReason(WARN_REASONS[0]);
      setWarnCustom("");
    } catch (e: any) {
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setWarnLoading(false);
  };

  // ── Confirmation modale ──
  const confirm = (msg: string, fn: () => void) => setConfirmModal({ msg, onConfirm: fn });

  // ── Actions sur les signalements ──
  const updateReportStatus = async (reportId: string, newStatus: string, successMsg: string) => {
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setReportActionLoading(reportId);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => null);
        const errMsg = err?.message || err?.code || `HTTP ${r.status}`;
        if (r.status === 403 || r.status === 401) {
          showToast(`Bloqué par RLS. Exécute le SQL de policy dans Supabase. (${errMsg})`, "error");
        } else {
          showToast(`Erreur Supabase : ${errMsg}`, "error");
        }
        setReportActionLoading(null);
        return;
      }
      // Mise à jour locale immédiate
      setReports(prev => prev.map(rep => rep.id === reportId ? { ...rep, status: newStatus } : rep));
      showToast(successMsg, "success");
    } catch (e: any) {
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setReportActionLoading(null);
  };

  // ── Suppression définitive d'un signalement archivé ──
  const deleteReport = async (reportId: string) => {
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setReportActionLoading(reportId);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${reportId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
        },
      });
      if (!r.ok && r.status !== 204) {
        const err = await r.json().catch(() => null);
        const errMsg = err?.message || err?.code || `HTTP ${r.status}`;
        if (r.status === 403 || r.status === 401) {
          showToast(`Bloqué par RLS. Exécute ce SQL dans Supabase :\nCREATE POLICY "Admin can delete reports" ON public.reports FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));`, "error");
        } else {
          showToast(`Erreur suppression : ${errMsg}`, "error");
        }
        setReportActionLoading(null);
        return;
      }
      // Suppression locale immédiate
      setReports(prev => prev.filter(rep => rep.id !== reportId));
      showToast("Signalement supprimé définitivement.", "success");
    } catch (e: any) {
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setReportActionLoading(null);
  };

  // ── Suppression de TOUTES les archives (bulk delete) ──
  const deleteAllArchivedReports = async () => {
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    const archivedIds = reports
      .filter(r => ARCHIVED_STATUSES.includes(r.status) && r.id)
      .map(r => r.id as string);
    if (archivedIds.length === 0) return;
    setReportActionLoading("bulk");
    try {
      // Supabase : DELETE avec filtre IN sur les IDs archivés uniquement
      const inList = archivedIds.map(id => `"${id}"`).join(",");
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/reports?id=in.(${archivedIds.join(",")})&status=in.(reviewed,rejected,banned)`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${auth.token}`,
          },
        }
      );
      if (!r.ok && r.status !== 204) {
        const err = await r.json().catch(() => null);
        const errMsg = err?.message || err?.code || `HTTP ${r.status}`;
        if (r.status === 403 || r.status === 401) {
          showToast(`Bloqué par RLS. Exécute ce SQL dans Supabase :
CREATE POLICY "Admin can delete reports" ON public.reports FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));`, "error");
        } else {
          showToast(`Erreur suppression globale : ${errMsg}`, "error");
        }
        setReportActionLoading(null);
        return;
      }
      // Suppression locale immédiate — ne touche qu'aux archivés
      setReports(prev => prev.filter(rep => !ARCHIVED_STATUSES.includes(rep.status)));
      showToast(`${archivedIds.length} archive${archivedIds.length > 1 ? "s" : ""} supprimée${archivedIds.length > 1 ? "s" : ""} définitivement.`, "success");
    } catch (e: any) {
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setReportActionLoading(null);
  };

  const sendSupportReply = async () => {
    if (!supportReply || !supportReplyText.trim()) return;
    setReportActionLoading(supportReply.report.id || "support-reply");
    try {
      await sb.insert<ReportRow>(auth.token, "reports", {
        reporter_id: auth.userId,
        reported_id: supportReply.userId,
        reason: `${SUPPORT_PREFIX_REPLY} ${supportReplyText.trim()}`,
        // Une réponse admin est déjà traitée côté back-office : elle doit apparaître chez l’utilisateur,
        // mais ne doit pas revenir comme un nouveau message en attente dans l’onglet Messagerie admin.
        status: "reviewed",
      });
      if (supportReply.report.id) {
        await updateReportStatus(supportReply.report.id, "reviewed", "Réponse envoyée à l’utilisateur dans sa messagerie.");
      } else {
        showToast("Réponse envoyée à l’utilisateur dans sa messagerie.", "success");
      }
      setSupportReply(null);
      setSupportReplyText("");
      loadStats();
    } catch (e: any) {
      showToast("Impossible d’envoyer la réponse. Vérifiez les policies RLS de la table reports.", "error");
    } finally {
      setReportActionLoading(null);
    }
  };

  const banReportedProfile = async (report: ReportRow) => {
    if (!auth.isAdmin || !report.reported_id || !report.id) return;
    setReportActionLoading(report.id);
    try {
      // 1. Bannir le profil
      const rProfile = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${report.reported_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({ is_banned: true, is_visible: false }),
      });
      if (!rProfile.ok) {
        const err = await rProfile.json().catch(() => null);
        showToast(`Erreur bannissement profil : ${err?.message || rProfile.status}`, "error");
        setReportActionLoading(null);
        return;
      }
      // 2. Mettre à jour le report → status "banned"
      await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({ status: "banned" }),
      });
      // 3. Mise à jour locale
      setReports(prev => prev.map(rep => rep.id === report.id ? { ...rep, status: "banned" } : rep));
      setUsers(prev => prev.map(u => u.id === report.reported_id ? { ...u, is_banned: true, is_visible: false } : u));
      showToast("Profil banni et signalement clôturé.", "success");
    } catch (e: any) {
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setReportActionLoading(null);
  };

  const loadReportedProfile = async (reportedId: string) => {
    setReportProfileLoading(reportedId);
    try {
      const res = await sb.query<AdminProfile>(
        auth.token, "profiles",
        `?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,is_visible,warning_count,created_at&id=eq.${reportedId}`
      );
      if (res.length > 0) {
        setReportProfilePreview(res[0]);
      } else {
        showToast("Profil introuvable (supprimé ?)", "error");
      }
    } catch (e: any) {
      showToast("Erreur chargement profil : " + (e?.message || "inconnue"), "error");
    }
    setReportProfileLoading(null);
  };

  // ── Couleur badge statut report ──
  const reportStatusStyle = (status: string): { bg: string; color: string; label: string } => {
    switch (status) {
      case "pending":    return { bg: "rgba(243,156,18,0.12)", color: "#f39c12", label: "En attente" };
      case "reviewed":   return { bg: "rgba(39,174,96,0.12)",  color: "#27ae60", label: "Traité" };
      case "rejected":   return { bg: "rgba(127,140,141,0.12)", color: "#7f8c8d", label: "Rejeté" };
      case "banned":     return { bg: "rgba(231,76,60,0.12)",  color: "#e74c3c", label: "Banni" };
      default:           return { bg: "rgba(52,152,219,0.12)", color: "#3498db", label: status };
    }
  };

  // ── Classify reports ──
  const classifyReport = (r: ReportRow): { label: string; color: string } => {
    if (r.reason?.startsWith("[AUTO-MOD")) return { label: "Auto-modération", color: "#e67e22" };
    if (r.reason?.startsWith("[BOT SIGNALEMENT]")) return { label: "Alerte bot", color: "#8e44ad" };
    if (isSupportReason(r.reason)) return { label: "Messagerie", color: G.vert };
    if (!r.reported_id) return { label: "Alerte système", color: "#7f8c8d" };
    return { label: "Signalement profil", color: G.rouge };
  };

  const ARCHIVED_STATUSES = ["reviewed", "rejected", "banned"];
  const isPending = (r: ReportRow) => !ARCHIVED_STATUSES.includes(r.status);
  const isSupportReport = (r: ReportRow) => isSupportReason(r.reason);
  const isSupportUserMessage = (r: ReportRow) => !!r.reason?.startsWith(SUPPORT_PREFIX_USER);
  const isSupportAdminReply = (r: ReportRow) => !!r.reason?.startsWith(SUPPORT_PREFIX_REPLY);
  const isSystemReport = (r: ReportRow) => !isSupportReport(r) && (r.reason?.startsWith("[AUTO-MOD") || r.reason?.startsWith("[BOT") || !r.reported_id);
  const isProfileReport = (r: ReportRow) => !isSupportReport(r) && !isSystemReport(r) && !!r.reported_id;

  const filteredReports = reports.filter(r => {
    if (reportFilter === "archived") return ARCHIVED_STATUSES.includes(r.status);
    // Vues actives : exclure les archivés
    if (!isPending(r)) return false;
    if (reportFilter === "user") return isProfileReport(r);
    if (reportFilter === "system") return isSystemReport(r);
    if (reportFilter === "messaging") return isSupportUserMessage(r);
    return true; // "all" = tous les éléments en attente, toutes catégories confondues
  });

  const archivedCount = reports.filter(r => ARCHIVED_STATUSES.includes(r.status)).length;
  const pendingCount = reports.filter(isPending).length;
  const profilePendingCount = reports.filter(r => isPending(r) && isProfileReport(r)).length;
  const systemPendingCount = reports.filter(r => isPending(r) && isSystemReport(r)).length;
  const messagingPendingCount = reports.filter(r => isPending(r) && isSupportUserMessage(r)).length;
  const unreadReviewsCount = reviews.filter(r => !r.is_read).length;
  const adminBadgeCount = pendingCount + unreadReviewsCount;
  // Sync badge vers App parent
  useEffect(() => { onBadgeCount?.(adminBadgeCount); }, [adminBadgeCount]);

  // ── SVG Icons ──
  const IcoUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const IcoStats = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
  const IcoAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  const IcoStar = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="#D4A843" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  const IcoShield = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const IcoBan = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
  const IcoEye = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const IcoCheckCircle = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
  const IcoXCircle = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
  const IcoBanLg = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
  const IcoWarnLg = ({ size = 13 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const IcoTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
  const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  const IcoRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
  const IcoArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
  const IcoGear = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  const IcoWarn = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

  // ── Rendu d'un badge statut ──
  const StatusBadge = ({ label, active, color, Icon }: { label: string; active: boolean; color: string; Icon: () => React.ReactElement }) => (
    active ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: `${color}18`, color, borderRadius: 50, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>
        <Icon />{label}
      </span>
    ) : null
  );

  // ── Rendu d'un bouton d'action utilisateur ──
  const ActionBtn = ({ label, onClick, color = G.rouge, disabled = false }: {
    label: string; onClick: () => void; color?: string; disabled?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: `${color}14`, color, border: `1px solid ${color}30`, borderRadius: 8,
        padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  if (!auth.isAdmin) return null;

  return (
    <div style={{ padding: "0 0 80px", minHeight: "100vh", background: G.creme }}>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal confirmation */}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#111", lineHeight: 1.6, marginBottom: 22, fontWeight: 500 }}>{confirmModal.msg}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "11px" }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} style={{ flex: 1, padding: "11px" }}>Confirmer</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal avertissement admin */}
      {supportReply && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 12000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: G.blanc, borderRadius: 20, width: "100%", maxWidth: 420, padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: G.brun, marginBottom: 8 }}>Répondre via {SUPPORT_TEAM_NAME}</h3>
            <p style={{ fontSize: "0.78rem", color: "#666", lineHeight: 1.5, marginBottom: 12 }}>La réponse apparaîtra directement dans la messagerie de l’utilisateur comme une conversation avec l’assistance Moyo.</p>
            <div style={{ background: "rgba(26,92,58,0.06)", border: "1px solid rgba(26,92,58,0.15)", borderRadius: 12, padding: 10, fontSize: "0.78rem", color: "#444", lineHeight: 1.5, marginBottom: 12 }}>{cleanSupportReason(supportReply.report.reason)}</div>
            <textarea value={supportReplyText} onChange={e => setSupportReplyText(e.target.value)} placeholder="Écrire la réponse de l’assistance Moyo..." style={{ width: "100%", minHeight: 110, boxSizing: "border-box", border: `1px solid ${G.gris}`, borderRadius: 12, padding: 12, fontSize: "0.86rem", outline: "none", resize: "vertical", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => { setSupportReply(null); setSupportReplyText(""); }} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="primary" onClick={sendSupportReply} disabled={!supportReplyText.trim()} style={{ flex: 2 }}>Envoyer</Btn>
            </div>
          </div>
        </div>
      )}

      {warnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: G.blanc, borderRadius: 22, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(44,26,14,0.22)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #fff9ec, #fff3cc)", padding: "22px 20px 16px", textAlign: "center", borderBottom: `1px solid rgba(243,156,18,0.2)` }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(243,156,18,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1a1a1a" }}>Avertir {warnModal.user.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 4 }}>
                Avertissement {(warnModal.user.warning_count || 0) + 1}/3
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "18px 20px 20px" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Motif</div>
              {WARN_REASONS.map(r => (
                <div key={r} onClick={() => setWarnReason(r)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 6, cursor: "pointer", background: warnReason === r ? "rgba(243,156,18,0.1)" : G.creme, border: `1.5px solid ${warnReason === r ? "#f39c12" : "transparent"}`, transition: "all 0.15s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${warnReason === r ? "#f39c12" : "#ccc"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {warnReason === r && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f39c12" }} />}
                  </div>
                  <span style={{ fontSize: "0.83rem", fontWeight: warnReason === r ? 600 : 400, color: warnReason === r ? "#b7770d" : "#333" }}>{r}</span>
                </div>
              ))}
              {warnReason === "Autre motif" && (
                <textarea
                  value={warnCustom}
                  onChange={e => setWarnCustom(e.target.value)}
                  placeholder="Précisez le motif…"
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `2px solid rgba(243,156,18,0.4)`, fontSize: "0.82rem", resize: "none", outline: "none", marginTop: 4, fontFamily: "inherit" }}
                />
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => { setWarnModal(null); setWarnReason(WARN_REASONS[0]); setWarnCustom(""); }} style={{ flex: 1, background: G.creme, color: "#555", border: `1.5px solid ${G.gris}`, borderRadius: 50, padding: "12px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Annuler
                </button>
                <button
                  onClick={() => sendWarning(warnModal.user)}
                  disabled={warnLoading || (warnReason === "Autre motif" && !warnCustom.trim())}
                  style={{ flex: 1, background: warnLoading ? "#f9e4a0" : "linear-gradient(135deg,#f39c12,#e67e22)", color: G.blanc, border: "none", borderRadius: 50, padding: "12px", fontSize: "0.85rem", fontWeight: 700, cursor: warnLoading ? "not-allowed" : "pointer", opacity: warnLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  {warnLoading
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal aperçu profil signalé */}
      {reportProfilePreview && (
        <div
          onClick={() => setReportProfilePreview(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: G.blanc, borderRadius: 22, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(44,26,14,0.22)", overflow: "hidden", animation: "fadeUp 0.25s ease" }}
          >
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "22px 20px 18px", textAlign: "center", position: "relative" }}>
              <button
                onClick={() => setReportProfilePreview(null)}
                style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "2rem" }}>
                {reportProfilePreview.gender === "Femme" ? "👩🏿" : "👨🏿"}
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: G.blanc }}>{reportProfilePreview.name}</div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", marginTop: 3 }}>
                {reportProfilePreview.age} ans · {reportProfilePreview.city}
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "18px 20px 20px" }}>
              {/* Statuts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {reportProfilePreview.is_banned && (
                  <span style={{ background: "rgba(231,76,60,0.12)", color: "#e74c3c", borderRadius: 50, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700 }}>
                    🚫 Banni
                  </span>
                )}
                {reportProfilePreview.is_premium && (
                  <span style={{ background: "rgba(212,168,67,0.15)", color: "#B8860B", borderRadius: 50, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700 }}>
                    ⭐ Premium
                  </span>
                )}
                {reportProfilePreview.is_verified && (
                  <span style={{ background: "rgba(29,155,240,0.12)", color: "#1d9bf0", borderRadius: 50, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700 }}>
                    ✓ Vérifié
                  </span>
                )}
                {reportProfilePreview.is_admin && (
                  <span style={{ background: `rgba(26,92,58,0.12)`, color: G.vert, borderRadius: 50, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700 }}>
                    🛡️ Admin
                  </span>
                )}
                {(reportProfilePreview.warning_count || 0) > 0 && (
                  <span style={{ background: "rgba(243,156,18,0.12)", color: "#e67e22", borderRadius: 50, padding: "3px 10px", fontSize: "0.7rem", fontWeight: 700 }}>
                    ⚠️ Avert. {reportProfilePreview.warning_count}/3
                  </span>
                )}
              </div>
              {/* Infos */}
              <div style={{ background: G.creme, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "#888" }}>Genre</span>
                    <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{reportProfilePreview.gender}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "#888" }}>Ville</span>
                    <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{reportProfilePreview.city}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "#888" }}>ID</span>
                    <span style={{ fontWeight: 500, color: "#666", fontSize: "0.72rem", fontFamily: "monospace" }}>{reportProfilePreview.id.slice(0, 20)}…</span>
                  </div>
                  {reportProfilePreview.created_at && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                      <span style={{ color: "#888" }}>Inscrit le</span>
                      <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{formatDate(reportProfilePreview.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setReportProfilePreview(null)}
                style={{ width: "100%", background: G.creme, color: G.brun, border: `1.5px solid ${G.gris}`, borderRadius: 50, padding: "12px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aide Admin */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s ease" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", animation: "fadeUp 0.28s ease" }}
          >
            {/* En-tête modal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px", borderBottom: `1px solid ${G.gris}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: G.brun }}>Guide Admin</div>
                  <div style={{ fontSize: "0.72rem", color: "#999", marginTop: 1 }}>Tableau de bord MOYO</div>
                </div>
              </div>
              <div onClick={() => setShowHelp(false)} style={{ cursor: "pointer", width: 32, height: 32, borderRadius: "50%", background: G.creme, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            </div>
            {/* Contenu scrollable */}
            <div style={{ overflowY: "auto", padding: "18px 20px 32px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Section 1 — Rôle admin */}
              <div style={{ background: `linear-gradient(135deg,${G.rouge}12,${G.rouge}06)`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${G.rouge}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.rouge }}>Rôle d'un administrateur</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: G.brun, lineHeight: 1.65 }}>Un admin supervise la plateforme, protège les utilisateurs, vérifie les signalements et applique les décisions de modération. Il agit avec neutralité, sans jamais utiliser ses droits à des fins personnelles.</p>
              </div>

              {/* Section 2 — Stats */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Statistiques</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["Membres total", "Nombre total de comptes créés sur la plateforme."],
                    ["Matchs", "Nombre de paires qui se sont mutuellement likées."],
                    ["Messages", "Volume total de messages échangés."],
                    ["Signalements", "Nombre de signalements reçus toutes sources confondues."],
                    ["Nouveaux membres", "Inscriptions du jour en cours."],
                    ["Premium actifs", "Utilisateurs ayant un abonnement Premium actif."],
                    ["Profils vérifiés", "Comptes ayant obtenu le badge de vérification."],
                    ["Profils bannis", "Comptes actuellement bannis de la plateforme."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3 — Utilisateurs */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Utilisateurs</span>
                </div>
                <div style={{ background: "#FFF8F0", borderRadius: 10, padding: "9px 12px", marginBottom: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontSize: "0.79rem", color: "#7a5500" }}>Les actions sensibles doivent toujours être utilisées avec prudence et discernement.</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {([
                    ["Rendre Premium / Retirer Premium", "Attribue ou retire l'accès aux fonctionnalités payantes."],
                    ["Rendre Admin / Retirer Admin", "Accorde ou révoque les droits d'administration. À utiliser avec la plus grande prudence."],
                    ["Vérifier / Retirer vérification", "Attribue ou retire le badge bleu de vérification du profil."],
                    ["Avertir", "Envoie un avertissement officiel visible par l'utilisateur à sa prochaine connexion."],
                    ["Bannir", "Interdit l'accès à la plateforme. Action irréversible sans intervention admin."],
                    ["Supprimer", "Efface définitivement le compte et toutes ses données."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4 — Signalements */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Signalements</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["En attente (tous)", "Vue par défaut. Affiche tous les signalements non encore traités. Le badge rouge indique le nombre en attente."],
                    ["Profils", "Filtre les signalements manuels d'utilisateurs contre d'autres profils. À examiner en priorité."],
                    ["Système", "Signalements générés automatiquement par la modération (insultes, arnaques, contenus sexuels, alertes techniques)."],
                    ["Messagerie", "Messages envoyés par les utilisateurs via Guide → Contacter notre équipe. Les admins peuvent répondre directement, la réponse apparaît dans la messagerie utilisateur sous le nom Assistance Moyo."],
                    ["Archivés", "Signalements traités, rejetés ou ayant entraîné un bannissement. Chaque archive peut être supprimée définitivement. Le bouton 'Tout supprimer' nettoie toutes les archives d'un coup."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5 — Statuts */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Traitement des signalements</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["En attente", "#e67e22", "Pas encore examiné par un administrateur."],
                    ["Traité", G.vert, "Signalement vérifié et pris en charge par un admin."],
                    ["Rejeté", "#999", "Signalement examiné mais non retenu (sans suite)."],
                    ["Banni", G.rouge, "Sanction appliquée suite au signalement."],
                  ] as [string, string, string][]).map(([label, color, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, marginTop: 3, flexShrink: 0 }} />
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6 — Avertissements */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Avertissements utilisateurs</span>
                </div>
                <div style={{ background: G.creme, borderRadius: 10, padding: "12px 14px", fontSize: "0.82rem", color: G.brun, lineHeight: 1.7 }}>
                  Un avertissement est une étape préventive avant bannissement. L'utilisateur voit une modal officielle MOYO à sa prochaine connexion. Lorsqu'il clique <strong>"OK, j'ai compris"</strong>, la plateforme enregistre qu'il a bien pris connaissance de l'avertissement. L'admin peut ainsi suivre le 1er, 2e ou 3e avertissement et adapter la décision en conséquence.
                </div>
              </div>

              {/* Section 7 — Onglet Avis */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Avis</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["Avis non lus", "Les avis avec une bordure rouge sont non lus. Cliquez sur 'Marquer lu' pour les acquitter et réduire le badge compteur de l'onglet."],
                    ["Masquer / Afficher", "Masquer un avis le rend discret visuellement sans le supprimer. Utile pour les avis déjà traités."],
                    ["Supprimer un avis", "Supprime définitivement l'avis de la base de données. Cette action est irréversible."],
                    ["Badge compteur", "Le badge doré sur l'onglet Avis indique le nombre d'avis non lus. Il disparaît quand tous les avis sont marqués comme lus."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 8 — Badges et notifications admin */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Badges et alertes admin</span>
                </div>
                <div style={{ background: G.creme, borderRadius: 10, padding: "12px 14px", fontSize: "0.82rem", color: G.brun, lineHeight: 1.7 }}>
                  Le bouton <strong>⚙️ Admin</strong> dans le header affiche un badge blanc avec un nombre rouge dès qu'il y a des actions en attente. Ce badge additionne les signalements en attente et les avis non lus. Il est visible depuis n'importe quel onglet de l'application et se met à jour automatiquement toutes les quelques secondes — même si le dashboard admin n'est pas ouvert.
                </div>
              </div>

              {/* Section 10 — Bonnes pratiques */}
              <div style={{ background: `linear-gradient(135deg,${G.vert}14,${G.vert}06)`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${G.vert}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.vert }}>Bonnes pratiques admin</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    "Rester neutre en toutes circonstances.",
                    "Ne jamais utiliser les droits admin pour des raisons personnelles.",
                    "Vérifier les faits avant d'appliquer une sanction.",
                    "Protéger les données des utilisateurs — elles sont confidentielles.",
                    "Ne jamais partager d'informations privées avec des tiers.",
                    "Privilégier l'avertissement avant le bannissement quand c'est possible.",
                  ].map((rule, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize: "0.82rem", color: G.brun, lineHeight: 1.6 }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature */}
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${G.gris}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Conçu et développé par</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: G.brun, letterSpacing: "0.01em" }}>Roméo GUEBO</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: G.rouge }}>CEO Moyo</span>
                  {[
                    "Chargé de communication et marketing",
                    "Responsable marketing et développement commercial",
                    "Chef de projet digital",
                  ].map((role, i) => (
                    <span key={i} style={{ fontSize: "0.71rem", color: "#888", lineHeight: 1.5 }}>· {role}</span>
                  ))}
                </div>
                <a href="mailto:romeoguebo97@gmail.com" style={{ marginTop: 4, fontSize: "0.72rem", color: G.rouge, textDecoration: "none", fontWeight: 600, opacity: 0.8 }}>
                  romeoguebo97@gmail.com
                </a>
                <div style={{ marginTop: 4, fontSize: "0.75rem", fontWeight: 800, color: G.brun, letterSpacing: "0.05em" }}>
                  Mo<span style={{ color: G.or }}>yo</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: G.blanc, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Ligne titre — cachée sur desktop (remplacée par la topbar) */}
        <div data-admhdr="" style={{ padding: "14px 16px 0 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}><IcoArrowLeft /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IcoGear />
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: G.brun }}>Admin Dashboard</span>
          </div>
          <button
            data-admhelp=""
            onClick={() => setShowHelp(true)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: G.creme, border: `1.5px solid ${G.cremeDark}`, borderRadius: 20, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: G.brunLight, transition: "all 0.18s ease", flexShrink: 0 }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = G.cremeDark; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = G.creme; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Aide
          </button>
        </div>
        {/* Onglets — toujours visibles mobile ET desktop */}
        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${G.gris}` }}>
          {([
            ["stats", "Statistiques", IcoStats],
            ["users", "Utilisateurs", IcoUsers],
            ["reports", "Signalements", IcoAlert],
            ["reviews", "Avis", () => <svg width="16" height="16" viewBox="0 0 24 24" fill={activeTab === "reviews" ? G.or : "#999"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>],
          ] as [string, string, () => React.ReactElement][]).map(([key, label, Icon]) => (
            <div
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                if (key === "users" && users.length === 0) loadUsers("", 0);
                if (key === "reviews" && reviews.length === 0) loadReviews();
              }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 0 12px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
                color: activeTab === key ? (key === "reviews" ? "#B8860B" : G.rouge) : "#999",
                borderBottom: activeTab === key ? `2.5px solid ${key === "reviews" ? G.or : G.rouge}` : "2.5px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <Icon />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {label}
                {key === "reports" && pendingCount > 0 && (
                  <span style={{ background: G.blanc, color: G.rouge, borderRadius: 50, fontSize: "0.6rem", fontWeight: 800, padding: "1px 5px", lineHeight: 1.6, boxShadow: "0 1px 4px rgba(192,57,43,0.2)", border: `1px solid rgba(192,57,43,0.15)` }}>
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                {key === "reviews" && unreadReviewsCount > 0 && (
                  <span style={{ background: G.blanc, color: "#B8860B", borderRadius: 50, fontSize: "0.6rem", fontWeight: 800, padding: "1px 5px", lineHeight: 1.6, boxShadow: "0 1px 4px rgba(184,134,11,0.2)", border: "1px solid rgba(184,134,11,0.15)" }}>
                    {unreadReviewsCount > 99 ? "99+" : unreadReviewsCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ ONGLET STATS */}
      {activeTab === "stats" && (
        <div style={{ padding: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
            </div>
          ) : (
            <>
              {/* Grille stats principales */}
              <div data-admgrid="main" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
                {([
                  ["Membres total", stats.users, G.rouge, <IcoUsers key="u"/>],
                  ["Matchs", stats.matches, "#8e44ad", <svg key="m" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>],
                  ["Messages", stats.messages, "#2980b9", <svg key="ms" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>],
                  ["Signalements", stats.reports, "#e67e22", <IcoAlert key="a"/>],
                ] as [string, number, string, React.ReactNode][]).map(([label, value, color, icon]) => (
                  <div key={label} style={{ background: G.blanc, borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ color, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "0.73rem", color: "#777", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Stats avancées */}
              <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 14 }}>Statistiques avancées</h3>
                <div data-admgrid="adv" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                  {([
                    ["Nouveaux aujourd'hui", stats.todayUsers, "#27ae60"],
                    ["Premium actifs", stats.premiumUsers, "#D4A843"],
                    ["Profils vérifiés", stats.verifiedUsers, G.vert],
                    ["Profils bannis", stats.bannedUsers, "#e74c3c"],
                  ] as [string, number, string][]).map(([label, val, color]) => (
                    <div key={label} style={{ background: `${color}0d`, borderRadius: 12, padding: "12px", border: `1px solid ${color}25` }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: "0.7rem", color: "#555", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div data-admgrid="row">
              {/* Ratio Genre */}
              <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 12 }}>Ratio Homme / Femme</h3>
                {stats.users > 0 ? (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a6ef5" }}>{stats.maleCount}</div>
                        <div style={{ fontSize: "0.7rem", color: "#555" }}>Hommes</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#e91e8c" }}>{stats.femaleCount}</div>
                        <div style={{ fontSize: "0.7rem", color: "#555" }}>Femmes</div>
                      </div>
                    </div>
                    <div style={{ height: 10, borderRadius: 50, background: "#f0f0f0", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${Math.round(stats.maleCount / stats.users * 100)}%`, background: "#1a6ef5", borderRadius: "50px 0 0 50px", transition: "width 0.5s" }} />
                      <div style={{ flex: 1, background: "#e91e8c", borderRadius: "0 50px 50px 0" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.68rem", color: "#888" }}>
                      <span>{Math.round(stats.maleCount / stats.users * 100)}% H</span>
                      <span>{Math.round(stats.femaleCount / stats.users * 100)}% F</span>
                    </div>
                  </>
                ) : <p style={{ fontSize: "0.82rem", color: "#aaa" }}>Données insuffisantes</p>}
              </div>

              {/* Top villes */}
              {stats.topCities.length > 0 && (
                <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 12 }}>Top villes</h3>
                  {stats.topCities.map(({ city, count }, i) => (
                    <div key={city} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: G.rouge, color: G.blanc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{city}</span>
                          <span style={{ fontSize: "0.78rem", color: G.rouge, fontWeight: 700 }}>{count}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 50, background: "#f0f0f0", overflow: "hidden" }}>
                          <div style={{ width: `${Math.round(count / stats.users * 100)}%`, background: `linear-gradient(90deg,${G.rouge},${G.or})`, height: "100%", borderRadius: 50 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Derniers inscrits */}
              {stats.recentUsers.length > 0 && (
                <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 12 }}>Derniers inscrits</h3>
                  {stats.recentUsers.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${G.gris}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.gender === "Femme" ? "rgba(233,30,140,0.1)" : "rgba(26,110,245,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={u.gender === "Femme" ? "#e91e8c" : "#1a6ef5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
                          {u.name}{u.is_premium && <IcoStar />}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#888" }}>{u.city} · {u.age} ans</div>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#aaa" }}>{formatDate(u.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}

              </div>{/* /admgrid-row */}

              <Btn variant="ghost" onClick={loadStats} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                <IcoRefresh />Actualiser
              </Btn>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ ONGLET UTILISATEURS */}
      {activeTab === "users" && (
        <div style={{ padding: "16px" }}>
          {/* Barre de recherche */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><IcoSearch /></span>
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setUserPage(0); loadUsers(userSearch, 0); } }}
              placeholder="Rechercher par nom…"
              style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, border: `2px solid ${G.gris}`, fontSize: "0.9rem", background: G.blanc, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Btn variant="primary" onClick={() => { setUserPage(0); loadUsers(userSearch, 0); }} style={{ flex: 1, padding: "10px" }}>
              Rechercher
            </Btn>
            <Btn variant="ghost" onClick={() => { setUserSearch(""); setUserPage(0); loadUsers("", 0); }} style={{ padding: "10px 16px" }}>
              Réinitialiser
            </Btn>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: "0.88rem" }}>Aucun utilisateur trouvé</div>
          ) : (
            <>
              <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 10, fontWeight: 600 }}>{users.length} utilisateur(s) affichés</div>
              <div data-admlist="">
              {users.map(u => {
                const isLoading = actionLoading === u.id;
                const isSelf = u.id === auth.userId;
                return (
                  <div key={u.id} style={{ background: G.blanc, borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    {/* En-tête utilisateur */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: u.gender === "Femme" ? "rgba(233,30,140,0.1)" : "rgba(26,110,245,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={u.gender === "Femme" ? "#e91e8c" : "#1a6ef5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
                          {u.name}
                          {isSelf && <span style={{ fontSize: "0.65rem", background: "rgba(26,92,58,0.1)", color: G.vert, borderRadius: 50, padding: "1px 7px", fontWeight: 700 }}>Vous</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>
                          {u.age} ans · {u.city} · {u.gender}
                          {u.created_at && <span> · inscrit le {formatDate(u.created_at)}</span>}
                        </div>
                        {/* Badges statuts */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          <StatusBadge label="Premium" active={u.is_premium} color="#D4A843" Icon={IcoStar} />
                          <StatusBadge label="Admin" active={!!u.is_admin} color={G.rouge} Icon={IcoGear} />
                          <StatusBadge label="Vérifié" active={!!u.is_verified} color={G.vert} Icon={IcoCheck} />
                          <StatusBadge label="Banni" active={!!u.is_banned} color="#e74c3c" Icon={IcoBan} />
                          {(u.warning_count || 0) > 0 && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: (u.warning_count || 0) >= 3 ? "rgba(231,76,60,0.12)" : "rgba(243,156,18,0.12)", color: (u.warning_count || 0) >= 3 ? "#e74c3c" : "#e67e22", borderRadius: 50, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>
                              <IcoWarn />
                              Avert. {u.warning_count}/3
                              {(u.warning_count || 0) >= 3 && <span style={{ marginLeft: 2 }}>· Risque bannissement</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      {isLoading && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 0.8s ease-in-out infinite", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/></svg>
                      )}
                    </div>

                    {/* Actions — ligne 1 : Premium & Admin */}
                    <div style={{ borderTop: `1px solid ${G.gris}`, paddingTop: 10 }}>
                      <div style={{ fontSize: "0.68rem", color: "#aaa", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Statuts</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {!u.is_premium ? (
                          <ActionBtn label="+ Premium" color="#D4A843" disabled={isLoading}
                            onClick={() => confirm(`Rendre ${u.name} Premium ?`, () => adminAction(u.id, { is_premium: true }, `${u.name} est maintenant Premium.`))} />
                        ) : (
                          <ActionBtn label="— Premium" color="#B8860B" disabled={isLoading}
                            onClick={() => confirm(`Retirer le Premium de ${u.name} ?`, () => adminAction(u.id, { is_premium: false }, `Premium retiré pour ${u.name}.`))} />
                        )}
                        {!u.is_admin ? (
                          <ActionBtn label="+ Admin" color={G.rouge} disabled={isLoading}
                            onClick={() => confirm(`Rendre ${u.name} administrateur(trice) ?`, () => adminAction(u.id, { is_admin: true }, `${u.name} est maintenant admin.`))} />
                        ) : (
                          <ActionBtn label="— Admin" color="#c0392b" disabled={isLoading || isSelf}
                            onClick={() => {
                              if (isSelf) { showToast("Vous ne pouvez pas retirer vos propres droits admin.", "error"); return; }
                              confirm(`Retirer les droits admin de ${u.name} ?`, () => adminAction(u.id, { is_admin: false }, `Droits admin retirés pour ${u.name}.`));
                            }} />
                        )}
                        {!u.is_verified ? (
                          <ActionBtn label="+ Vérifier" color={G.vert} disabled={isLoading}
                            onClick={() => confirm(`Vérifier le profil de ${u.name} ?`, () => adminAction(u.id, { is_verified: true }, `Profil de ${u.name} vérifié.`))} />
                        ) : (
                          <ActionBtn label="— Vérifier" color="#555" disabled={isLoading}
                            onClick={() => confirm(`Retirer la vérification de ${u.name} ?`, () => adminAction(u.id, { is_verified: false }, `Vérification retirée pour ${u.name}.`))} />
                        )}
                      </div>

                      {/* Actions modération */}
                      <div style={{ fontSize: "0.68rem", color: "#aaa", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Modération</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <ActionBtn label="Avertir" color="#f39c12" disabled={isLoading || isSelf}
                          onClick={() => { if (isSelf) { showToast("Vous ne pouvez pas vous avertir vous-même.", "error"); return; } setWarnModal({ user: u }); setWarnReason(WARN_REASONS[0]); setWarnCustom(""); }} />
                        {!u.is_banned ? (
                          <ActionBtn label="Bannir" color="#e74c3c" disabled={isLoading || isSelf}
                            onClick={() => {
                              if (isSelf) { showToast("Vous ne pouvez pas vous bannir vous-même.", "error"); return; }
                              confirm(`Bannir ${u.name} ? Il/elle ne pourra plus accéder à l'application.`, () => adminAction(u.id, { is_banned: true, is_visible: false }, `${u.name} a été banni(e).`));
                            }} />
                        ) : (
                          <ActionBtn label="Débannir" color={G.vert} disabled={isLoading}
                            onClick={() => confirm(`Débannir ${u.name} ?`, () => adminAction(u.id, { is_banned: false, is_visible: true }, `${u.name} a été débanni(e).`))} />
                        )}
                        <ActionBtn label="Supprimer" color="#c0392b" disabled={isLoading || isSelf}
                          onClick={() => {
                            if (isSelf) { showToast("Vous ne pouvez pas supprimer votre propre compte.", "error"); return; }
                            confirm(`⚠️ Supprimer définitivement le compte de ${u.name} ? Cette action est irréversible.`, () => deleteAccount(u));
                          }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>{/* /admlist users */}

              {/* Pagination */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <Btn variant="ghost" onClick={() => { const p = Math.max(0, userPage - 1); setUserPage(p); loadUsers(userSearch, p); }} disabled={userPage === 0} style={{ flex: 1, padding: "10px" }}>
                  ← Précédent
                </Btn>
                <span style={{ display: "flex", alignItems: "center", fontSize: "0.8rem", color: "#888", padding: "0 8px" }}>
                  Page {userPage + 1}
                </span>
                <Btn variant="ghost" onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(userSearch, p); }} disabled={users.length < USER_PAGE_SIZE} style={{ flex: 1, padding: "10px" }}>
                  Suivant →
                </Btn>
              </div>
            </>
          )}

          {/* Note colonnes manquantes */}
          <div style={{ background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.3)", borderRadius: 12, padding: "12px 14px", marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#f39c12" }}>Note technique</span>
            </div>
            <p style={{ fontSize: "0.73rem", color: "#555", lineHeight: 1.5 }}>
              Si les actions Bannir/Débannir échouent, la colonne <code>is_banned</code> est peut-être absente. SQL à exécuter dans Supabase : <code>ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;</code>
            </p>
            <p style={{ fontSize: "0.73rem", color: "#555", lineHeight: 1.5, marginTop: 6 }}>
              Si les mises à jour sont bloquées (erreur 403), les policies RLS doivent autoriser les admins à modifier les profils. Contactez le développeur.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ ONGLET SIGNALEMENTS */}
      {activeTab === "reports" && (
        <div style={{ padding: "16px" }}>
          {/* Filtres */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
            {(["all", "user", "system", "messaging", "archived"] as const).map(f => {
              const isActive = reportFilter === f;
              const isArchived = f === "archived";
              const label = f === "all" ? "En attente" : f === "user" ? "Profils" : f === "system" ? "Système" : f === "messaging" ? "Messagerie" : "Archivés";
              const count = f === "archived" ? archivedCount : f === "all" ? pendingCount : f === "user" ? profilePendingCount : f === "system" ? systemPendingCount : f === "messaging" ? messagingPendingCount : null;
              return (
                <div
                  key={f}
                  onClick={() => setReportFilter(f)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 13px", borderRadius: 50, fontSize: "0.74rem", fontWeight: 600,
                    cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
                    background: isActive
                      ? isArchived ? "#6c757d" : G.rouge
                      : G.blanc,
                    color: isActive ? G.blanc : isArchived ? "#6c757d" : "#555",
                    boxShadow: isActive ? `0 2px 8px ${isArchived ? "rgba(108,117,125,0.3)" : "rgba(192,57,43,0.25)"}` : "none",
                    border: `1px solid ${isActive ? (isArchived ? "#6c757d" : G.rouge) : G.gris}`,
                  }}
                >
                  {isArchived && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                    </svg>
                  )}
                  {label}
                  {count !== null && count > 0 && (
                    <span style={{
                      background: isActive ? "rgba(255,255,255,0.25)" : isArchived ? "rgba(108,117,125,0.12)" : "rgba(192,57,43,0.12)",
                      color: isActive ? G.blanc : isArchived ? "#6c757d" : G.rouge,
                      borderRadius: 50, padding: "1px 6px", fontSize: "0.65rem", fontWeight: 700, minWidth: 18, textAlign: "center",
                    }}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>
                {reportFilter === "archived"
                  ? `Archivés (${archivedCount})`
                  : reportFilter === "user"
                    ? `Profils (${filteredReports.length})`
                    : reportFilter === "system"
                      ? `Système (${filteredReports.length})`
                      : reportFilter === "messaging"
                        ? `Messagerie (${filteredReports.length})`
                        : `En attente (${filteredReports.length})`
                }
              </h3>
              {reportFilter === "archived" && archivedCount > 0 && (
                <span style={{ fontSize: "0.7rem", color: "#aaa" }}>Supprimables</span>
              )}
            </div>

            {filteredReports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                {reportFilter === "archived"
                  ? <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                      <p style={{ color: "#bbb", fontSize: "0.82rem" }}>Aucun signalement archivé</p>
                    </>
                  : <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <p style={{ color: "#bbb", fontSize: "0.82rem" }}>Aucun signalement en attente 🎉</p>
                    </>
                }
              </div>
            ) : (
              <div data-admlist="">
              {filteredReports.map((r, i) => {
                const cat = classifyReport(r);
                const statusStyle = reportStatusStyle(r.status);
                const isSupport = isSupportReport(r);
                const isSystemAlert = isSystemReport(r);
                const isProfileAlert = isProfileReport(r);
                const isLoading = reportActionLoading === r.id;
                const alreadyHandled = r.status !== "pending";
                const isArchiveView = reportFilter === "archived";
                const supportUserId = r.reason?.startsWith(SUPPORT_PREFIX_REPLY) ? r.reported_id : r.reporter_id;
                const targetProfileId = isSupport ? supportUserId : (r.reported_id || r.reporter_id);
                return (
                  <div key={r.id || i} style={{ padding: "14px 0", borderBottom: i < filteredReports.length - 1 ? `1px solid ${G.gris}` : "none" }}>
                    {/* Ligne 1 : badges catégorie + statut */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ background: `${cat.color}18`, color: cat.color, borderRadius: 50, padding: "2px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
                        {cat.label}
                      </span>
                      {r.status && (
                        <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 50, padding: "2px 10px", fontSize: "0.66rem", fontWeight: 600 }}>
                          {statusStyle.label}
                        </span>
                      )}
                    </div>

                    {/* Ligne 2 : raison */}
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a1a1a", marginBottom: 5, lineHeight: 1.4 }}>{isSupport ? cleanSupportReason(r.reason) : r.reason}</div>

                    {/* Ligne 3 : IDs + date */}
                    <div style={{ fontSize: "0.72rem", color: "#999", display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {r.reporter_id?.slice(0, 12)}…
                      </span>
                      {isSupport
                        ? <span style={{ color: G.vert }}>Conversation support</span>
                        : r.reported_id
                          ? <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              {r.reported_id?.slice(0, 12)}…
                            </span>
                          : <span style={{ color: "#ccc" }}>Alerte système</span>
                      }
                      {r.created_at && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {formatDateTime(r.created_at)}
                        </span>
                      )}
                    </div>

                    {/* Ligne 4 : boutons d'action (masqués en vue archive) */}
                    {/* Bouton suppression définitive — vue archive uniquement */}
                    {isArchiveView && r.id && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                        <button
                          onClick={() => {
                            if (!r.id) return;
                            const rid = r.id;
                            setConfirmModal({
                              msg: "Supprimer définitivement ce signalement archivé ? Cette action est irréversible. Le profil et les messages liés ne seront pas supprimés.",
                              onConfirm: () => { setConfirmModal(null); deleteReport(rid); },
                            });
                          }}
                          disabled={isLoading}
                          title="Supprimer définitivement"
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            background: "rgba(192,57,43,0.06)",
                            color: "#C0392B",
                            border: "1px solid rgba(192,57,43,0.2)",
                            borderRadius: 8,
                            padding: "5px 10px",
                            fontSize: "0.7rem", fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.5 : 1,
                          }}
                        >
                          {isLoading
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          }
                          Supprimer
                        </button>
                      </div>
                    )}
                    {!isArchiveView && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {isSupport && supportUserId && (
                        <button
                          onClick={() => { setSupportReply({ report: r, userId: supportUserId }); setSupportReplyText(""); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "rgba(26,92,58,0.1)", color: G.vert,
                            border: "1px solid rgba(26,92,58,0.25)", borderRadius: 8,
                            padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Répondre
                        </button>
                      )}
                      {targetProfileId && (
                        <button
                          onClick={() => loadReportedProfile(targetProfileId)}
                          disabled={reportProfileLoading === targetProfileId}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "rgba(52,152,219,0.1)", color: "#2980b9",
                            border: "1px solid rgba(52,152,219,0.25)", borderRadius: 8,
                            padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                            cursor: reportProfileLoading === targetProfileId ? "not-allowed" : "pointer",
                            opacity: reportProfileLoading === targetProfileId ? 0.65 : 1,
                          }}
                        >
                          {reportProfileLoading === targetProfileId
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                            : <IcoEye size={12} />
                          }
                          Voir profil
                        </button>
                      )}
                      {isSupport && r.id && (
                        <button
                          onClick={() => !alreadyHandled && updateReportStatus(r.id!, "reviewed", "Message archivé.")}
                          disabled={isLoading || alreadyHandled}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: alreadyHandled ? "rgba(108,117,125,0.06)" : "rgba(108,117,125,0.1)",
                            color: "#6c757d", border: "1px solid rgba(108,117,125,0.25)", borderRadius: 8,
                            padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                            cursor: alreadyHandled || isLoading ? "not-allowed" : "pointer",
                            opacity: alreadyHandled ? 0.5 : 1,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                          Archiver
                        </button>
                      )}
                      {/* ── Actions communes (alerte système) ── */}
                      {isSystemAlert && (
                        <>
                          <button
                            onClick={() => !alreadyHandled && r.id && updateReportStatus(r.id, "reviewed", "Signalement marqué comme traité.")}
                            disabled={isLoading || alreadyHandled}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: alreadyHandled ? "rgba(39,174,96,0.06)" : "rgba(39,174,96,0.1)",
                              color: "#27ae60", border: "1px solid rgba(39,174,96,0.25)", borderRadius: 8,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                              cursor: alreadyHandled || isLoading ? "not-allowed" : "pointer",
                              opacity: alreadyHandled ? 0.5 : 1,
                            }}
                          >
                            <IcoCheckCircle size={12} /> Traiter
                          </button>
                          <button
                            onClick={() => !alreadyHandled && r.id && updateReportStatus(r.id, "rejected", "Signalement rejeté.")}
                            disabled={isLoading || alreadyHandled}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: alreadyHandled ? "rgba(127,140,141,0.06)" : "rgba(127,140,141,0.1)",
                              color: "#7f8c8d", border: "1px solid rgba(127,140,141,0.25)", borderRadius: 8,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                              cursor: alreadyHandled || isLoading ? "not-allowed" : "pointer",
                              opacity: alreadyHandled ? 0.5 : 1,
                            }}
                          >
                            <IcoXCircle size={12} /> Rejeter
                          </button>
                        </>
                      )}

                      {/* ── Actions profil uniquement (vrais signalements de profil) ── */}
                      {isProfileAlert && r.reported_id && (
                        <>
                          {/* Avertir */}
                          <button
                            onClick={() => {
                              // Cherche le user dans la liste locale ou crée un objet minimal
                              const knownUser = users.find(u => u.id === r.reported_id);
                              setWarnModal({ user: knownUser || { id: r.reported_id!, name: r.reported_id!.slice(0, 8) + "…", age: 0, city: "", gender: "", is_premium: false } });
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: "rgba(243,156,18,0.1)", color: "#e67e22",
                              border: "1px solid rgba(243,156,18,0.25)", borderRadius: 8,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            <IcoWarnLg size={12} /> Avertir
                          </button>

                          {/* Marquer traité */}
                          <button
                            onClick={() => !alreadyHandled && r.id && updateReportStatus(r.id, "reviewed", "Signalement marqué comme traité.")}
                            disabled={isLoading || alreadyHandled}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: alreadyHandled ? "rgba(39,174,96,0.06)" : "rgba(39,174,96,0.1)",
                              color: "#27ae60", border: "1px solid rgba(39,174,96,0.25)", borderRadius: 8,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                              cursor: alreadyHandled || isLoading ? "not-allowed" : "pointer",
                              opacity: alreadyHandled ? 0.5 : 1,
                            }}
                          >
                            <IcoCheckCircle size={12} /> Traité
                          </button>

                          {/* Rejeter */}
                          <button
                            onClick={() => !alreadyHandled && r.id && updateReportStatus(r.id, "rejected", "Signalement rejeté.")}
                            disabled={isLoading || alreadyHandled}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: alreadyHandled ? "rgba(127,140,141,0.06)" : "rgba(127,140,141,0.1)",
                              color: "#7f8c8d", border: "1px solid rgba(127,140,141,0.25)", borderRadius: 8,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                              cursor: alreadyHandled || isLoading ? "not-allowed" : "pointer",
                              opacity: alreadyHandled ? 0.5 : 1,
                            }}
                          >
                            <IcoXCircle size={12} /> Rejeter
                          </button>

                          {/* Bannir */}
                          <button
                            onClick={() => {
                              if (alreadyHandled && r.status === "banned") return;
                              confirm(
                                `Bannir ce profil (${r.reported_id?.slice(0, 12)}…) ? Il/elle ne pourra plus accéder à MOYO. Cette action est irréversible depuis ici.`,
                                () => banReportedProfile(r)
                              );
                            }}
                            disabled={isLoading || r.status === "banned"}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: r.status === "banned" ? "rgba(231,76,60,0.06)" : "rgba(231,76,60,0.1)",
                              color: "#e74c3c", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 8,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                              cursor: isLoading || r.status === "banned" ? "not-allowed" : "pointer",
                              opacity: r.status === "banned" ? 0.5 : 1,
                            }}
                          >
                            {isLoading
                              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                              : <IcoBanLg size={12} />
                            }
                            Bannir
                          </button>
                        </>
                      )}
                    </div>}
                  </div>
                );
              })}
              </div>
            )}
          </div>

          {/* Info policy SQL — visible seulement hors archive */}
          {reportFilter !== "archived" && (
            <div style={{ background: "rgba(52,152,219,0.06)", border: "1px solid rgba(52,152,219,0.2)", borderRadius: 12, padding: "12px 14px", marginTop: 12, fontSize: "0.74rem", color: "#2980b9", lineHeight: 1.6 }}>
              <strong>Si "Traiter" / "Rejeter" retourne une erreur 403</strong>, exécute ce SQL dans Supabase → SQL Editor :<br />
              <code style={{ display: "block", marginTop: 6, background: "rgba(52,152,219,0.1)", padding: "8px 10px", borderRadius: 8, fontSize: "0.7rem", color: "#1a6a9a", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{`CREATE POLICY "Admin can update reports" ON public.reports FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));`}</code>
            </div>
          )}

          {/* Note archive + SQL policy DELETE */}
          {reportFilter === "archived" && archivedCount > 0 && (
            <>
              <div style={{ background: "rgba(108,117,125,0.06)", border: "1px solid rgba(108,117,125,0.15)", borderRadius: 12, padding: "10px 14px", marginTop: 12, fontSize: "0.74rem", color: "#6c757d", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                {archivedCount} signalement{archivedCount > 1 ? "s" : ""} archivé{archivedCount > 1 ? "s" : ""} — traités, rejetés ou bannis. Clique "Supprimer" pour nettoyer définitivement.
              </div>
              <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 12, padding: "12px 14px", marginTop: 10, fontSize: "0.74rem", color: "#C0392B", lineHeight: 1.6 }}>
                <strong>Si "Supprimer" retourne une erreur 403</strong>, exécute ce SQL dans Supabase :<br />
                <code style={{ display: "block", marginTop: 6, background: "rgba(192,57,43,0.08)", padding: "8px 10px", borderRadius: 8, fontSize: "0.7rem", color: "#922B21", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{`CREATE POLICY "Admin can delete reports" ON public.reports FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));`}</code>
              </div>
            </>
          )}

          <Btn variant="ghost" onClick={loadStats} style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IcoRefresh />Actualiser
          </Btn>

          {/* Bouton Tout supprimer — visible uniquement dans la vue Archivés */}
          {reportFilter === "archived" && (
            <button
              disabled={archivedCount === 0 || reportActionLoading === "bulk"}
              onClick={() => {
                if (archivedCount === 0) return;
                setConfirmModal({
                  msg: `Voulez-vous vraiment supprimer définitivement toutes les archives (${archivedCount} signalement${archivedCount > 1 ? "s" : ""}) ? Cette action est irréversible. Les profils, messages et avertissements ne seront pas supprimés.`,
                  onConfirm: () => { setConfirmModal(null); deleteAllArchivedReports(); },
                });
              }}
              style={{
                width: "100%",
                marginTop: 8,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: archivedCount === 0 ? "rgba(192,57,43,0.03)" : "rgba(192,57,43,0.07)",
                color: archivedCount === 0 ? "#ccc" : "#C0392B",
                border: `1px solid ${archivedCount === 0 ? "#eee" : "rgba(192,57,43,0.2)"}`,
                borderRadius: 12,
                padding: "11px 16px",
                fontSize: "0.82rem", fontWeight: 600,
                cursor: archivedCount === 0 || reportActionLoading === "bulk" ? "not-allowed" : "pointer",
                opacity: archivedCount === 0 ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              {reportActionLoading === "bulk"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
              }
              {reportActionLoading === "bulk" ? "Suppression…" : `Tout supprimer (${archivedCount})`}
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ ONGLET AVIS */}
      {activeTab === "reviews" && (
        <div style={{ padding: "16px" }}>
          {reviewsLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
            </div>
          ) : (
            <>
              {/* ── Résumé stats ── */}
              {reviewsStats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div style={{ background: G.blanc, borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#B8860B", lineHeight: 1 }}>{reviewsStats.total}</div>
                    <div style={{ fontSize: "0.73rem", color: "#777", marginTop: 4 }}>Avis total</div>
                  </div>
                  <div style={{ background: G.blanc, borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: "2rem", fontWeight: 800, color: "#B8860B", lineHeight: 1 }}>{reviewsStats.avg || "—"}</span>
                      {reviewsStats.avg > 0 && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      )}
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "#777" }}>Note moyenne /5</div>
                  </div>
                </div>
              )}

              {/* ── Répartition par note ── */}
              {reviews.length > 0 && (
                <div style={{ background: G.blanc, borderRadius: 16, padding: "14px 16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: G.brun, marginBottom: 10 }}>Répartition des notes</div>
                  {[5,4,3,2,1].map(n => {
                    const count = reviews.filter(r => r.rating === n).length;
                    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, width: 60 }}>
                          {[...Array(n)].map((_, i) => (
                            <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          ))}
                        </div>
                        <div style={{ flex: 1, background: "#F0F0F0", borderRadius: 50, height: 7, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: n >= 4 ? "#27ae60" : n === 3 ? G.or : G.rouge, borderRadius: 50, transition: "width 0.5s" }} />
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#888", flexShrink: 0, width: 34, textAlign: "right" }}>{count} ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Liste des avis ── */}
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <div style={{ fontSize: "0.88rem" }}>Aucun avis pour l'instant</div>
                </div>
              ) : (
                <div data-admlist="" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reviews.map(r => {
                    const isHidden = hiddenReviews.has(r.id);
                    const isUnread = !r.is_read;
                    return (
                      <div key={r.id} style={{ background: isHidden ? "#F8F8F8" : G.blanc, borderRadius: 14, padding: "14px 16px", boxShadow: isUnread ? "0 1px 8px rgba(192,57,43,0.1)" : "0 1px 6px rgba(0,0,0,0.05)", border: `1px solid ${isUnread ? "rgba(192,57,43,0.18)" : isHidden ? "#E8E8E8" : "#F0F0F0"}`, opacity: isHidden ? 0.55 : 1, transition: "opacity 0.2s" }}>
                        {/* Header : user + date */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: G.gris, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                              {r.profile?.gender === "Femme" ? "👩🏿" : "👨🏿"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.83rem", color: "#1a1a1a" }}>{r.profile?.name || "Utilisateur"}</div>
                              <div style={{ fontSize: "0.7rem", color: "#aaa" }}>{r.profile?.city || "—"} · {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
                            </div>
                          </div>
                          {/* Note */}
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= r.rating ? G.or : "#DDD"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            ))}
                          </div>
                        </div>

                        {/* Commentaire */}
                        {r.comment && (
                          <div style={{ fontSize: "0.82rem", color: "#444", lineHeight: 1.6, fontStyle: "italic", background: "#F7F7F7", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                            "{r.comment}"
                          </div>
                        )}

                        {/* Actions admin */}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {isUnread && (
                            <div
                              onClick={() => markReviewRead(r.id)}
                              style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(192,57,43,0.07)", borderRadius: 50, padding: "5px 12px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: G.rouge }}
                            >
                              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={G.rouge}/></svg>
                              Marquer lu
                            </div>
                          )}
                          <div
                            onClick={() => toggleHideReview(r.id)}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: isHidden ? "rgba(39,174,96,0.08)" : "rgba(0,0,0,0.04)", borderRadius: 50, padding: "5px 12px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: isHidden ? "#27ae60" : "#888" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              {isHidden
                                ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                                : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                              }
                            </svg>
                            {isHidden ? "Afficher" : "Masquer"}
                          </div>
                          <div
                            onClick={() => { if (window.confirm(`Supprimer l'avis de ${r.profile?.name || "cet utilisateur"} ?`)) deleteReview(r.id); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(231,76,60,0.07)", borderRadius: 50, padding: "5px 12px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: "#e74c3c" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            Supprimer
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Btn variant="ghost" onClick={loadReviews} style={{ width: "100%", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <IcoRefresh />Actualiser
              </Btn>
            </>
          )}
        </div>
      )}
    </div>
  );
}

