import React, { useState, useEffect, useRef } from "react";
// ── Auto-extracted from monolith ──

function LikesPage({ auth, onShowPremium, mode = "likes", onBadgeUpdate }: { auth: Auth; onShowPremium: (r: string) => void; mode?: "likes" | "visitors"; onBadgeUpdate?: () => void }) {
  // ── Sub-tab state ──
  const [likesSubTab, setLikesSubTab] = useState<"received" | "sent">("received");
  const [visitorsSubTab, setVisitorsSubTab] = useState<"visitors" | "visited">("visitors");

  // ── Données likes ──
  const [count, setCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [likers, setLikers] = useState<Profile[]>([]);
  const [likerMeta, setLikerMeta] = useState<Record<string, { date?: string; isMatch?: boolean }>>({});
  const [sentLikes, setSentLikes] = useState<Profile[]>([]);
  const [sentLikesMeta, setSentLikesMeta] = useState<Record<string, { date?: string; status: "pending"|"match"|"unavailable" }>>({});

  // ── Données visiteurs ──
  const [visitors, setVisitors] = useState<Profile[]>([]);
  const [visitorMeta, setVisitorMeta] = useState<Record<string, { date?: string }>>({});
  const [visitedProfiles, setVisitedProfiles] = useState<Profile[]>([]);
  const [visitedMeta, setVisitedMeta] = useState<Record<string, { date?: string }>>({});

  const [dismissedIds, setDismissedIds] = useState(new Set<string>());
  const [confirmDismiss, setConfirmDismiss] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [confirmUnlike, setConfirmUnlike] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [isPremiumReal, setIsPremiumReal] = useState(auth.isPremium);
  const loadData = async (premiumOverride?: boolean) => {
    const isPrem = premiumOverride !== undefined ? premiumOverride : isPremiumReal;
    setLoading(true);

    // 1. IDs dismissés
    let dIds = new Set<string>();
    try {
      const dismissed = await sb.query<{ dismissed_id: string }>(auth.token, "dismissed_cards", `?user_id=eq.${auth.userId}&select=dismissed_id`);
      dIds = new Set(Array.isArray(dismissed) ? dismissed.map(d => d.dismissed_id) : []);
      setDismissedIds(dIds);
    } catch {}

    // 2. Matches actuels (pour croiser)
    let matchedUserIds = new Set<string>();
    try {
      const matchRows = await sb.query<MatchRecord>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id,user1,user2`);
      if (Array.isArray(matchRows)) {
        matchRows.forEach(m => {
          matchedUserIds.add(m.user1 === auth.userId ? m.user2 : m.user1);
        });
      }
    } catch {}

    // ── LIKES REÇUS ──
    try {
      const res = await sb.query<LikeRecord>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user,created_at&order=created_at.desc`);
      const total = Array.isArray(res) ? res.length : 0;
      setCount(total);
      if (isPrem && total > 0) {
        const ids = res.map(r => r.from_user).filter(Boolean).join(",");
        if (ids) {
          const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${ids})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
          setLikers(Array.isArray(profiles) ? profiles.filter(p => p && !dIds.has(p.id)) : []);
          const meta: Record<string, { date?: string; isMatch?: boolean }> = {};
          res.forEach(r => { meta[r.from_user] = { date: r.created_at, isMatch: matchedUserIds.has(r.from_user) }; });
          setLikerMeta(meta);
        }
      }
    } catch (e) { console.error("LikesPage likes reçus error:", e); }

    // ── LIKES ENVOYÉS ──
    if (isPrem) {
      try {
        const sent = await sb.query<LikeRecord>(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user,created_at&order=created_at.desc&limit=50`);
        if (Array.isArray(sent) && sent.length > 0) {
          const sentIds = sent.map(s => s.to_user).filter(Boolean).join(",");
          const sentProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${sentIds})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
          const knownIds = new Set(Array.isArray(sentProfiles) ? sentProfiles.map(p => p.id) : []);
          setSentLikes(Array.isArray(sentProfiles) ? sentProfiles : []);
          const smeta: Record<string, { date?: string; status: "pending"|"match"|"unavailable" }> = {};
          sent.forEach(s => {
            const st = matchedUserIds.has(s.to_user) ? "match" : knownIds.has(s.to_user) ? "pending" : "unavailable";
            smeta[s.to_user] = { date: s.created_at, status: st };
          });
          setSentLikesMeta(smeta);
        }
      } catch {}
    }

    // ── VISITEURS (qui m'ont vu) ──
    try {
      const views = await sb.query<ViewRecord>(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}&select=viewer_id,created_at&order=created_at.desc&limit=100`);
      if (Array.isArray(views)) {
        // Dédoublonner — garder la visite la plus récente par visitor
        const seen = new Map<string, string>();
        views.forEach(v => { if (!seen.has(v.viewer_id)) seen.set(v.viewer_id, v.created_at || ""); });
        setViewsCount(seen.size);
        if (isPrem && seen.size > 0) {
          const vIds = [...seen.keys()].filter(id => !dIds.has(id)).join(",");
          if (vIds) {
            const vProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${vIds})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
            setVisitors(Array.isArray(vProfiles) ? vProfiles : []);
            const vmeta: Record<string, { date?: string }> = {};
            seen.forEach((date, id) => { vmeta[id] = { date }; });
            setVisitorMeta(vmeta);
          }
        }
      }
    } catch {}

    // ── PROFILS VUS PAR MOI ──
    if (isPrem) {
      try {
        const myVisits = await sb.query<VisitRecord>(auth.token, "profile_visits", `?visitor_id=eq.${auth.userId}&select=visited_id,created_at&order=created_at.desc&limit=50`);
        if (Array.isArray(myVisits) && myVisits.length > 0) {
          const seenVisited = new Map<string, string>();
          myVisits.forEach(v => { if (!seenVisited.has(v.visited_id)) seenVisited.set(v.visited_id, v.created_at || ""); });
          const vIds = [...seenVisited.keys()].join(",");
          const vProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${vIds})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
          setVisitedProfiles(Array.isArray(vProfiles) ? vProfiles : []);
          const pvmeta: Record<string, { date?: string }> = {};
          seenVisited.forEach((date, id) => { pvmeta[id] = { date }; });
          setVisitedMeta(pvmeta);
        }
      } catch {}
    }

    setLoading(false);
  };

  useEffect(() => {
    sb.query<{ is_premium: boolean }>(auth.token, "profiles", `?id=eq.${auth.userId}&select=is_premium`)
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          const prem = res[0].is_premium === true;
          setIsPremiumReal(prem);
          loadData(prem);
        }
      }).catch(() => {});
    loadData();
    const wsLikes = sb.subscribeRealtime(auth.token, "likes", `to_user=eq.${auth.userId}`, () => { loadData(); });
    const wsViews = sb.subscribeRealtime(auth.token, "profile_views", `viewed_id=eq.${auth.userId}`, () => { loadData(); });
    return () => {
      try { wsLikes?.close(); } catch {}
      try { wsViews?.close(); } catch {}
    };
  }, []);

  const confirmAndDismiss = async (profileId: string) => {
    setConfirmDismiss(null);
    setDismissedIds(prev => new Set([...prev, profileId]));
    setLikers(prev => prev.filter(p => p.id !== profileId));
    setVisitors(prev => prev.filter(p => p.id !== profileId));
    setCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/dismissed_cards`, {
        method: "POST",
        headers: { ...sb.h(auth.token), "Prefer": "return=minimal,resolution=ignore-duplicates" },
        body: JSON.stringify({ user_id: auth.userId, dismissed_id: profileId }),
      });
    } catch {}
    if (onBadgeUpdate) onBadgeUpdate();
  };

  const handleDismiss = (p: Profile, e: React.MouseEvent) => { e.stopPropagation(); setConfirmDismiss(p); };

  const handleLike = async (p: Profile) => {
    setLiking(true);
    try {
      await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
      const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
      if (Array.isArray(mutual) && mutual.length > 0) {
        await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id });
      }
    } catch {}
    setLiking(false);
    setSelectedProfile(null);
    loadData();
  };

  // Retirer un like envoyé — uniquement si pas de match
  const handleUnlike = async (p: Profile) => {
    const meta = sentLikesMeta[p.id];
    if (meta?.status === "match") return; // ne jamais casser un match
    try {
      await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${p.id}`);
      setSentLikes(prev => prev.filter(s => s.id !== p.id));
    } catch {}
    setConfirmUnlike(null);
  };

  // ── Sous-composant carte profil (grille) ──
  const ProfileCard = ({ p, meta, rightSlot, onView }: {
    p: Profile;
    meta?: { date?: string; isMatch?: boolean; status?: string };
    rightSlot?: React.ReactNode;
    onView: () => void;
  }) => (
    <div style={{ background: G.blanc, borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(44,26,14,0.09)", position: "relative", marginBottom: 12 }}>
      <div onClick={onView} style={{ height: 140, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)",
        overflow: "hidden", cursor: "pointer", position: "relative" }}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>}
        {/* Badges en overlay */}
        <div style={{ position: "absolute", top: 6, left: 6, display: "flex", flexDirection: "column", gap: 3 }}>
          {(meta?.isMatch || meta?.status === "match") && (
            <span style={{ background: G.vert, color: "white", borderRadius: 50, padding: "2px 7px", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Match
            </span>
          )}
          {meta?.date && isRecent(meta.date) && !meta?.isMatch && meta?.status !== "match" && (
            <span style={{ background: G.rouge, color: "white", borderRadius: 50, padding: "2px 7px", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Nouveau
            </span>
          )}
        </div>
        {/* Badges vérifiés + premium — bas à droite, fidèles au design de référence */}
        {(p.is_verified || p.is_premium) && (
          <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 6, alignItems: "center" }}>
            {p.is_verified && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4AABDB", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", border: "2.5px solid #fff", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
            {p.is_premium && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.22)", border: "2.5px solid #fff", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1a1a" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
            )}
          </div>
        )}
        {/* Bouton action (dismiss) en overlay */}
        {rightSlot && (
          <div style={{ position: "absolute", top: 6, right: 6 }}>{rightSlot}</div>
        )}
      </div>
      <div onClick={onView} style={{ padding: "8px 10px 10px", cursor: "pointer" }}>
        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}, {p.age} ans</div>
        <div style={{ fontSize: "0.68rem", color: "#777", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.city}</span>
        </div>
      </div>
    </div>
  );

  // ── Sous-composant carte profil (liste) ──
  const ProfileRow = ({ p, meta, rightSlot, onView }: {
    p: Profile;
    meta?: { date?: string; isMatch?: boolean; status?: string };
    rightSlot?: React.ReactNode;
    onView: () => void;
  }) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc,
      borderRadius: 16, padding: "12px 14px", marginBottom: 10,
      boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
      <div onClick={onView} style={{ width: 52, height: 52, borderRadius: 13, overflow: "hidden",
        flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", cursor: "pointer" }}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>}
      </div>
      <div onClick={onView} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{p.name}, {p.age} ans</span>
          {meta?.isMatch && <Badge label={<span style={{display:"flex",alignItems:"center",gap:3}}><svg width="10" height="10" viewBox="0 0 24 24" fill={G.vert} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Match</span>} color={G.vert} bg="rgba(26,92,58,0.1)" />}
          {meta?.status === "match" && <Badge label={<span style={{display:"flex",alignItems:"center",gap:3}}><svg width="10" height="10" viewBox="0 0 24 24" fill={G.vert} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Match</span>} color={G.vert} bg="rgba(26,92,58,0.1)" />}
          {meta?.status === "pending" && <Badge label="En attente" color="#888" bg="#F0F0F0" />}
          {meta?.status === "unavailable" && <Badge label="Profil indispo" color="#aaa" bg="#F5F5F5" />}
          {meta?.date && isRecent(meta.date) && !meta?.isMatch && meta?.status !== "match" && <Badge label={<span style={{display:"flex",alignItems:"center",gap:3}}><svg width="9" height="9" viewBox="0 0 24 24" fill={G.rouge} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Nouveau</span>} color={G.rouge} bg="rgba(192,57,43,0.08)" />}
        </div>
        <div style={{ fontSize: "0.73rem", color: "#777", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {p.city}
          </span>
          {meta?.date && <span style={{ color: "#aaa" }}>{fmtDate(meta.date)}</span>}
        </div>
      </div>
      {rightSlot}
    </div>
  );

  // ── Spinner ──
  const Spinner = () => (
    <div style={{ textAlign: "center", padding: 44 }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="2.5"
        strokeLinecap="round" style={{ animation: "pulse 0.9s ease-in-out infinite" }}>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
  );

  return (
    <div style={{ padding: "12px 16px 24px" }}>
      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: "1.18rem", fontWeight: 800, color: "#111" }}>
          {mode === "likes" ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={G.rouge} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Likes
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Vus
            </span>
          )}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div onClick={() => setViewMode(v => v === "card" ? "list" : "card")}
            style={{ background: G.blanc, color: "#111", border: `2px solid ${G.gris}`,
              borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
            {viewMode === "card" ? "≡ Liste" : "⊞ Carte"}
          </div>
          {isPremiumReal && (
            <span style={{ background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111",
              borderRadius: 50, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#111" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                PREMIUM
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          ONGLET LIKES
      ══════════════════════════════ */}
      {mode === "likes" && (
        <>
          {/* 1. Bandeau compteur */}
          <div style={{ background: isPremiumReal ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`,
            borderRadius: 14, padding: "13px 16px", marginBottom: 14,
            color: isPremiumReal ? "#111" : G.blanc,
            display: "flex", alignItems: "center", gap: 12,
            cursor: isPremiumReal ? "default" : "pointer" }}
            onClick={() => !isPremiumReal && onShowPremium("Découvre qui a liké ton profil en passant Premium !")}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isPremiumReal?"#111":"white"} stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {count > 0 ? `${count} personne${count > 1?"s ont":" a"} liké ton profil` : "Aucun like reçu pour l'instant"}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 2 }}>
                {isPremiumReal ? "Historique complet activé" : "Passe Premium pour voir qui"}
              </div>
            </div>
            {!isPremiumReal && count > 0 && (
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.95rem" }}>
                {count > 9 ? "9+" : count}
              </div>
            )}
          </div>

          {/* 2. Switch Reçus / Envoyés */}
          <InnerSwitch
            value={likesSubTab}
            onChange={v => setLikesSubTab(v as "received"|"sent")}
            options={[
              { id: "received", label: `Reçus${count > 0 ? ` (${count})` : ""}`,
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { id: "sent", label: "Envoyés",
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
            ]}
          />

          {/* 3. Contenu selon sous-onglet */}
          {/* ── Likes reçus ── */}
          {likesSubTab === "received" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                likers.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                    title="Aucun like reçu pour l'instant"
                    subtitle="Complète ton profil pour attirer plus d'attention ✨"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {likers.map(p => (
                      <ProfileCard key={p.id}
                        p={p}
                        meta={likerMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.35)",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {likers.map(p => (
                      <ProfileRow key={p.id}
                        p={p}
                        meta={likerMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F0EB",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={count}
                  label={count > 0 ? `personne${count>1?"s ont":" a"} liké ton profil` : "Découvre qui t'a liké"}
                  onShowPremium={() => onShowPremium("Découvre qui a liké ton profil en passant Premium !")}
                />
              )}
            </>
          )}

          {/* ── Likes envoyés ── */}
          {likesSubTab === "sent" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                sentLikes.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                    title="Tu n'as encore liké personne"
                    subtitle="Explore les profils et envoie des likes !"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {sentLikes.map(p => {
                      const meta = sentLikesMeta[p.id];
                      return (
                        <ProfileCard key={p.id}
                          p={p}
                          meta={meta}
                          onView={() => setSelectedProfile(p)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {sentLikes.map(p => {
                      const meta = sentLikesMeta[p.id];
                      return (
                        <ProfileRow key={p.id}
                          p={p}
                          meta={meta}
                          onView={() => setSelectedProfile(p)}
                          rightSlot={
                            meta?.status !== "match" ? (
                              <button onClick={() => setConfirmUnlike(p)}
                                style={{ border: `1.5px solid #eee`, borderRadius: 50,
                                  padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                                  color: "#aaa", background: G.blanc, cursor: "pointer",
                                  flexShrink: 0, whiteSpace: "nowrap" }}>
                                Retirer
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.7rem", color: G.vert, fontWeight: 700, flexShrink: 0 }}>✓ Match</span>
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={0}
                  label="Vois les profils que tu as likés"
                  onShowPremium={() => onShowPremium("Accède à l'historique de tes likes en passant Premium !")}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════
          ONGLET VISU / VISITEURS
      ══════════════════════════════ */}
      {mode === "visitors" && (
        <>
          {/* 1. Bandeau compteur */}
          <div style={{ background: isPremiumReal ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`,
            borderRadius: 14, padding: "13px 16px", marginBottom: 14,
            color: isPremiumReal ? "#111" : G.blanc,
            display: "flex", alignItems: "center", gap: 12,
            cursor: isPremiumReal ? "default" : "pointer" }}
            onClick={() => !isPremiumReal && onShowPremium("Découvre qui a visité ton profil en passant Premium !")}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPremiumReal?"#111":"white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {viewsCount > 0 ? `${viewsCount} visiteur${viewsCount>1?"s ont":" a"} consulté ton profil` : "Aucune visite pour l'instant"}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 2 }}>
                {isPremiumReal ? "Historique complet activé" : "Passe Premium pour voir qui"}
              </div>
            </div>
            {!isPremiumReal && viewsCount > 0 && (
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.95rem" }}>
                {viewsCount > 9 ? "9+" : viewsCount}
              </div>
            )}
          </div>

          {/* 2. Switch Visiteurs / Profils vus */}
          <InnerSwitch
            value={visitorsSubTab}
            onChange={v => setVisitorsSubTab(v as "visitors"|"visited")}
            options={[
              { id: "visitors", label: `Visiteurs${viewsCount > 0 ? ` (${viewsCount})` : ""}`,
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
              { id: "visited", label: "Profils vus",
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
            ]}
          />

          {/* 3. Contenu selon sous-onglet */}
          {/* ── Visiteurs ── */}
          {visitorsSubTab === "visitors" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                visitors.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    title="Aucun visiteur pour l'instant"
                    subtitle="Les personnes qui consultent ton profil apparaîtront ici"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {visitors.map(p => (
                      <ProfileCard key={p.id}
                        p={p}
                        meta={visitorMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.35)",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {visitors.map(p => (
                      <ProfileRow key={p.id}
                        p={p}
                        meta={visitorMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F0EB",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={viewsCount}
                  label={viewsCount > 0 ? `personne${viewsCount>1?"s ont":" a"} visité ton profil` : "Découvre qui t'a rendu visite"}
                  onShowPremium={() => onShowPremium("Découvre qui a visité ton profil en passant Premium !")}
                />
              )}
            </>
          )}

          {/* ── Profils vus par moi ── */}
          {visitorsSubTab === "visited" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                visitedProfiles.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                    title="Aucun profil consulté"
                    subtitle="Les profils que tu auras visités apparaîtront ici"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {visitedProfiles.map(p => (
                      <ProfileCard key={p.id}
                        p={p}
                        meta={visitedMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {visitedProfiles.map(p => (
                      <ProfileRow key={p.id}
                        p={p}
                        meta={visitedMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <button onClick={() => setSelectedProfile(p)}
                            style={{ border: `1.5px solid ${G.rouge}`, borderRadius: 50,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 700,
                              color: G.rouge, background: G.blanc, cursor: "pointer",
                              flexShrink: 0, whiteSpace: "nowrap" }}>
                            Revoir
                          </button>
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={0}
                  label="Vois les profils que tu as consultés"
                  onShowPremium={() => onShowPremium("Accède à l'historique de tes visites en passant Premium !")}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ── Modal profil ── */}
      {selectedProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 600,
          display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setSelectedProfile(null)}>
          <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%",
            maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
              {selectedProfile.photo_url
                ? <img src={selectedProfile.photo_url} alt={selectedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
              <div onClick={() => setSelectedProfile(null)}
                style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)",
                  borderRadius: "50%", width: 34, height: 34, display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                  color: G.blanc, fontWeight: 700, fontSize: "1rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <div style={{ position: "absolute", bottom: 14, left: 16 }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                  {selectedProfile.name}, {selectedProfile.age} ans
                  {selectedProfile.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 3 }}><PremiumBadge size={11} /></span>}
                  {selectedProfile.is_verified && <VerifiedBadge size={14} />}
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{selectedProfile.city}</div>
              </div>
            </div>
            <div style={{ padding: "18px 20px 32px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ background: selectedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: selectedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{selectedProfile.gender}</span>
                {selectedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{selectedProfile.religion}</span>}
              </div>
              {selectedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{selectedProfile.bio}</p>}
              <Btn variant="primary" onClick={() => handleLike(selectedProfile)} loading={liking} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>
                Liker {selectedProfile.name}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation dismiss ── */}
      {confirmDismiss && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%",
            maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F5F5F5",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Retirer {confirmDismiss.name} ?</h3>
            <p style={{ fontSize: "0.83rem", color: "#666", marginBottom: 22, lineHeight: 1.6 }}>
              Cette carte disparaîtra de ta liste. Tes likes, matchs et messages restent intacts.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmDismiss(null)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => confirmAndDismiss(confirmDismiss.id)} style={{ flex: 1 }}>Retirer</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation unlike ── */}
      {confirmUnlike && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%",
            maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%",
              background: "rgba(192,57,43,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Retirer ton like à {confirmUnlike.name} ?</h3>
            <p style={{ fontSize: "0.83rem", color: "#666", marginBottom: 22, lineHeight: 1.6 }}>
              Ton like sera retiré. Si un match existait déjà, il reste intact.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmUnlike(null)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => handleUnlike(confirmUnlike)} style={{ flex: 1 }}>Retirer le like</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

