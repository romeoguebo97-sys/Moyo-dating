import React, { useState, useEffect, useRef, useCallback, memo } from "react";
// ── Auto-extracted from monolith ──
// TODO: replace inline references with imports from ../../lib, ../../constants, ../../components

export function Discover({ auth, onShowPremium }: { auth: Auth; onShowPremium: (r: string) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likedIds, setLikedIds] = useState(new Set<string>());
  const [blockedIds, setBlockedIds] = useState(new Set<string>());
  const [current, setCurrent] = useState(0);
  const [matchPop, setMatchPop] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const [likesToday, setLikesToday] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showSignaler, setShowSignaler] = useState(false);
  const [showSameGender, setShowSameGender] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [myGender, setMyGender] = useState("");
  const [filters, setFilters] = useState({ city: "", ageMin: "", ageMax: "", gender: "", religion: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list" | "full">("card");
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const [wrapToast, setWrapToast] = useState(false);
  const wrapToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation circulaire — pure locale, aucun effet en base
  const navigate = (dir: "next" | "prev") => {
    if (profiles.length === 0) return;
    setCurrent(c => {
      let next: number;
      if (dir === "next") {
        next = c + 1 >= profiles.length ? 0 : c + 1;
        // Toast discret une seule fois au wrap vers 0
        if (c + 1 >= profiles.length) {
          // Boucle silencieuse : aucun message “On repart du début”.
        }
      } else {
        next = c - 1 < 0 ? profiles.length - 1 : c - 1;
      }
      if (profiles[next]) recordView(profiles[next].id);
      return next;
    });
  };
  useEffect(() => {
    loadProfiles();
    // Charger le genre de l'utilisateur connecté
    sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}&select=gender`)
      .then(res => { if (res[0]) setMyGender(res[0].gender); });
  }, []);
  useEffect(() => { if (profiles.length > 0 && profiles[current]) sb.recordVisit(auth.token, auth.userId, profiles[current].id); }, [current, profiles]);

  const loadProfiles = async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true); else setLoadingMore(true);
    try {
      const offset = pageNum * PAGE_SIZE;
      let params = `?id=neq.${auth.userId}&is_visible=neq.false&is_complete=eq.true&order=is_premium.desc,is_verified.desc,created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`;
      if (filters.city && !filters.city.startsWith("──")) params += `&city=eq.${encodeURIComponent(filters.city)}`;
      if (filters.gender) params += `&gender=eq.${filters.gender}`;
      if (filters.ageMin) params += `&age=gte.${filters.ageMin}`;
      if (filters.ageMax) params += `&age=lte.${filters.ageMax}`;
      if (filters.religion) params += `&religion=eq.${encodeURIComponent(filters.religion)}`;
      const [all, liked, blocked] = await Promise.all([
        sb.query<Profile>(auth.token, "profiles", params),
        pageNum === 0 ? sb.query<{ to_user: string }>(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user`) : Promise.resolve([] as { to_user: string }[]),
        pageNum === 0 ? sb.query<{ blocked_id: string }>(auth.token, "blocks", `?blocker_id=eq.${auth.userId}&select=blocked_id`) : Promise.resolve([] as { blocked_id: string }[]),
      ]);
      if (pageNum === 0) {
        setLikedIds(new Set(liked.map(l => l.to_user)));
        const bIds = new Set(blocked.map(b => b.blocked_id));
        setBlockedIds(bIds);
      }
      const bIds = pageNum === 0 ? new Set(blocked.map(b => b.blocked_id)) : blockedIds;
      const seen = new Set<string>(append ? profiles.map(p => p.id) : []);
      const unique = (Array.isArray(all) ? all : []).filter(p => {
        if (seen.has(p.id) || bIds.has(p.id)) return false;
        seen.add(p.id); return true;
      });
      const orderedUnique = priorityRandomizeProfiles(unique);
      setHasMore(all.length === PAGE_SIZE);
      if (append) setProfiles(prev => [...prev, ...orderedUnique]);
      else { setProfiles(orderedUnique); setCurrent(0); }
      if (pageNum === 0) {
        const today = new Date().toISOString().split("T")[0];
        const tl = await sb.query<object>(auth.token, "likes", `?from_user=eq.${auth.userId}&created_at=gte.${today}`);
        setLikesToday(Array.isArray(tl) ? tl.length : 0);
      }
    } catch { if (!append) setProfiles([]); }
    if (pageNum === 0) setLoading(false); else setLoadingMore(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadProfiles(nextPage, true);
  };

  const handleBlock = async () => {
    const target = profiles[current];
    if (!target) return;
    await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: target.id });
    setShowBlockConfirm(false);
    setProfiles(prev => prev.filter(p => p.id !== target.id));
    setCurrent(c => Math.max(0, c - 1));
  };

  const recordView = async (profileId: string) => {
    // La vue n'est enregistrée que si le visiteur est Premium
    if (!auth.isPremium) return;
    if (profileId === auth.userId) return;
    try {
      await sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: profileId });
    } catch {}
  };

  const handleLike = async (p: Profile) => {
    if (myGender && p.gender && myGender === p.gender) { setShowSameGender(true); return; }
    if (likedIds.has(p.id)) {
      // Unlike — mise à jour optimiste immédiate
      setLikedIds(s => { const n = new Set(s); n.delete(p.id); return n; });
      setLikesToday(l => Math.max(0, l - 1));
      // Suppression en cascade : like + match + messages + vues
      try {
        const [fwd, rev] = await Promise.all([
          sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}&select=id`),
          sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}&select=id`),
        ]);
        const matchIds = [
          ...(Array.isArray(fwd) ? fwd.map(x => x.id) : []),
          ...(Array.isArray(rev) ? rev.map(x => x.id) : []),
        ];
        // Supprimer messages de tous les matchs
        for (const id of matchIds) {
          await sb.delete(auth.token, "messages", `?match_id=eq.${id}`);
        }
        await Promise.all([
          sb.delete(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}`),
          sb.delete(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}`),
          sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${p.id}`),
          // Supprimer aussi mon profil de ses likes (retrait symétrique)
          sb.delete(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`),
          // Supprimer les vues mutuelles
          sb.delete(auth.token, "profile_views", `?viewer_id=eq.${auth.userId}&viewed_id=eq.${p.id}`),
        ]);
      } catch {}
      return;
    }
    if (!auth.isPremium && likesToday >= FREE_LIMITS.likes) { onShowPremium(`Tu as utilisé tes ${FREE_LIMITS.likes} likes gratuits aujourd'hui. Passe Premium pour liker sans limite !`); return; }
    // Like — mise à jour optimiste immédiate
    setLikedIds(s => new Set([...s, p.id]));
    setLikesToday(l => l + 1);
    await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
    const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
    if (mutual.length > 0) {
      await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id });
      setMatchPop(p);
    }
  };

  // ── État toast local pour Discover ──
  const [discoverToast, setDiscoverToast] = useState<ToastState>(null);
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async (reason: string) => {
    if (!profiles[current]) return;
    const reportedProfile = profiles[current];
    setIsReporting(true);
    console.log(`[Moyo][Report] Signalement en cours — reporter:${auth.userId} reported:${reportedProfile.id} motif:"${reason}"`);
    try {
      const res = await sb.insert<{ id: string }>(
        auth.token,
        "reports",
        {
          reporter_id: auth.userId,
          reported_id: reportedProfile.id,
          reason,
          status: "pending",
        },
        auth.refreshToken,
        // onNewToken : pas nécessaire ici, safeRequest le gère en interne
      );
      if (res && res.length > 0) {
        console.log(`[Moyo][Report] ✅ Signalement enregistré — id:${res[0]?.id}`);
        setDiscoverToast({ msg: "Signalement envoyé. Merci de protéger la communauté Moyo.", type: "success" });
        setShowReport(false);
        setShowSignaler(false);
      } else {
        // Supabase a renvoyé un tableau vide sans erreur (RLS silencieuse possible)
        console.warn("[Moyo][Report] ⚠️ Insert report : réponse vide — vérifier les policies RLS de la table reports");
        setDiscoverToast({ msg: "Signalement non enregistré. Réessaie dans quelques instants.", type: "error" });
      }
    } catch (e: any) {
      console.error("[Moyo][Report] ❌ Erreur insert report :", e?.message || e);
      setDiscoverToast({ msg: "Erreur lors du signalement. Vérifie ta connexion.", type: "error" });
    }
    setIsReporting(false);
  };

  const p = profiles[current];
  const fullscreenProfiles = profiles.length ? Array.from({ length: 40 }, () => profiles).flat() : [];
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Chargement...</div>;

  return <div style={{ padding: "14px 16px 8px" }}>
    {discoverToast && <Toast msg={discoverToast.msg} type={discoverToast.type} onClose={() => setDiscoverToast(null)} />}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 14, width: "100%" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, flexShrink: 0 }}>Découvrir</h2>
      <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "flex-end", flexWrap: "nowrap", minWidth: 0 }}>
        <div onClick={() => setViewMode(viewMode === "list" ? "card" : "list")} style={{ background: viewMode === "list" ? G.rouge : G.blanc, color: viewMode === "list" ? G.blanc : "#111", border: `2px solid ${viewMode === "list" ? G.rouge : G.gris}`, borderRadius: 50, padding: "5px 7px", fontSize: "0.68rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
          {viewMode === "list" ? "Carte" : "Liste"}
        </div>
        <div onClick={() => setViewMode("full")} style={{ background: viewMode === "full" ? G.rouge : G.blanc, color: viewMode === "full" ? G.blanc : "#111", border: `2px solid ${viewMode === "full" ? G.rouge : G.gris}`, borderRadius: 50, padding: "5px 7px", fontSize: "0.68rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
          Plein écran
        </div>
        <div onClick={() => setShowFilters(s => !s)} style={{ background: showFilters ? G.rouge : G.blanc, color: showFilters ? G.blanc : G.brun, border: `2px solid ${showFilters ? G.rouge : G.gris}`, borderRadius: 50, padding: "5px 7px", fontSize: "0.68rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
          Filtres
        </div>
      </div>
    </div>{showFilters && <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
  <select value={filters.city} onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Toutes les villes</option>
    {VILLES.filter(c => !c.startsWith("──")).map(c => <option key={c} value={c}>{c}</option>)}
  </select>
  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: G.brun, margin: "2px 0 6px" }}>Genre recherché</div>
  <select value={filters.gender} onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Homme et Femme</option>
    <option value="Homme">Homme</option>
    <option value="Femme">Femme</option>
  </select>
  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
    <input type="number" value={filters.ageMin} onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))} placeholder="Âge min (18)" min={18} max={99} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${filters.ageMin && parseInt(filters.ageMin) < 18 ? "#e74c3c" : G.gris}`, fontSize: "0.9rem" }} />
    <input type="number" value={filters.ageMax} onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))} placeholder="Âge max (99)" min={18} max={99} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${filters.ageMax && parseInt(filters.ageMax) > 99 ? "#e74c3c" : G.gris}`, fontSize: "0.9rem" }} />
  </div>
  {filters.ageMin && parseInt(filters.ageMin) < 18 && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>Âge minimum : 18 ans</p>}
  {filters.ageMax && parseInt(filters.ageMax) > 99 && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>Âge maximum : 99 ans</p>}
  {filters.ageMin && filters.ageMax && parseInt(filters.ageMin) > parseInt(filters.ageMax) && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>L'âge min doit être inférieur à l'âge max</p>}
  <select value={filters.religion} onChange={e => setFilters(prev => ({ ...prev, religion: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Toutes les religions</option>
    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
  </select>
  <Btn variant="primary" onClick={() => {
    const min = parseInt(filters.ageMin);
    const max = parseInt(filters.ageMax);
    if (filters.ageMin && (min < 18 || min > 99)) return;
    if (filters.ageMax && (max < 18 || max > 99)) return;
    if (filters.ageMin && filters.ageMax && min > max) return;
    setPage(0); loadProfiles(0); setShowFilters(false);
  }} style={{ width: "100%" }}>Appliquer</Btn>
</div>}{profiles.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: "56px", height: "56px", borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={() => { setPage(0); loadProfiles(0); }}>Actualiser</Btn></div> : viewMode === "full" ? <div ref={fullscreenScrollRef} className="no-invert moyo-fullscreen-view" onScroll={(e) => {
  const el = e.currentTarget;
  if (!profiles.length) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 900) {
    const approxCycle = Math.max(1, el.scrollHeight / 40);
    el.scrollTop = Math.max(0, el.scrollTop - approxCycle * 20);
  }
}} style={{ margin: "0 -16px", padding: "0 10px 16px", maxHeight: "calc(100dvh - 146px)", overflowY: "auto", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", background: "#F0F1F5" }}>
  <style>{`.moyo-fullscreen-view img{filter:none!important}`}</style>
  <div style={{ position: "sticky", top: 8, zIndex: 20, display: "flex", justifyContent: "flex-end", marginBottom: 8, pointerEvents: "none" }}>
    <button onClick={() => setViewMode("card")} style={{ pointerEvents: "auto", width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.48)", color: G.blanc, fontSize: "1.05rem", fontWeight: 800, backdropFilter: "blur(8px)", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
  </div>
  {fullscreenProfiles.map((prof, idx) => (
    <div key={`${prof.id}-${idx}`} style={{ position: "relative", height: "calc(100dvh - 155px)", minHeight: 560, borderRadius: 28, overflow: "hidden", marginBottom: 16, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", boxShadow: "0 12px 42px rgba(44,26,14,0.18)", scrollSnapAlign: "start" }}>
      {prof.photo_url ? <img src={prof.photo_url} alt={prof.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.48) 32%, rgba(0,0,0,0.05) 66%, rgba(0,0,0,0.22) 100%)" }} />
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 22, color: G.blanc }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, minWidth: 0 }}>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.05, textShadow: "0 2px 10px rgba(0,0,0,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{prof.name}, {prof.age} ans</div>
          {prof.is_premium && <PremiumBadge size={20} />}
          {prof.is_verified && <VerifiedBadge size={20} />}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {prof.gender && <span style={{ background: "rgba(255,255,255,0.18)", color: G.blanc, borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)" }}>{prof.gender}</span>}
          {prof.city && <span style={{ background: "rgba(255,255,255,0.18)", color: G.blanc, borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.city}</span>}
          {prof.religion && <span style={{ background: "rgba(212,168,67,0.28)", color: G.blanc, border: "1px solid rgba(212,168,67,0.55)", borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.religion}</span>}
          {prof.profession && <span style={{ background: "rgba(255,255,255,0.16)", color: G.blanc, borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.profession}</span>}
          {prof.hobbies && <span style={{ background: "rgba(26,92,58,0.38)", color: G.blanc, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.hobbies}</span>}
        </div>
        <div style={{ fontSize: "0.86rem", lineHeight: 1.45, opacity: 0.92, textShadow: "0 1px 8px rgba(0,0,0,0.5)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 38 }}>{prof.bio || ""}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button onClick={() => handleLike(prof)} style={{ width: 58, height: 58, borderRadius: "50%", border: "none", background: likedIds.has(prof.id) ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : "rgba(255,255,255,0.92)", color: likedIds.has(prof.id) ? G.blanc : G.rouge, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", boxShadow: "0 10px 28px rgba(0,0,0,0.28)", cursor: "pointer" }}><svg width="26" height="26" viewBox="0 0 24 24" fill={likedIds.has(prof.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <button onClick={() => { setCurrent(idx % profiles.length); setShowReport(true); }} style={{ width: 58, height: 58, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(0,0,0,0.45)", color: G.blanc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.55rem", boxShadow: "0 10px 28px rgba(0,0,0,0.28)", cursor: "pointer", backdropFilter: "blur(8px)" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg></button>
        </div>
      </div>
    </div>
  ))}
  {showReport && profiles[current] && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowReport(false)}>
      <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a" }}>{profiles[current].name}</div>
          <div onClick={() => setShowReport(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
        </div>
        <div style={{ padding: "8px 16px 32px" }}>
          {auth.isPremium && <div onClick={() => { const target = profiles[current]; setShowReport(false); setViewedProfile(target); recordView(target.id); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(26,92,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: G.vert }}>Voir le profil</div>
          </div>}
          <div onClick={() => { setShowReport(false); setShowBlockConfirm(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#1a1a1a" }}>Bloquer</div>
          </div>
          <div onClick={() => { setShowReport(false); setShowSignaler(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(231,76,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#e74c3c" }}>Signaler</div>
          </div>
        </div>
      </div>
    </div>
  )}
  {hasMore && <div onClick={loadMore} style={{ textAlign: "center", padding: "14px", background: G.blanc, borderRadius: 14, margin: "4px 6px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: G.rouge, border: `1px solid ${G.gris}` }}>{loadingMore ? "Chargement..." : "Voir plus de profils"}</div>}
</div> : viewMode === "list" ? <div>
  {profiles.map((prof, idx) => <ProfileListCard key={prof.id} prof={prof} liked={likedIds.has(prof.id)} onLike={() => handleLike(prof)} onBlock={async () => { await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: prof.id }); setProfiles(prev => prev.filter(p => p.id !== prof.id)); }} onReport={(r) => handleReport(r)} isPremium={auth.isPremium} onView={auth.isPremium ? () => { setViewedProfile(prof); recordView(prof.id); } : undefined} />)}
  {hasMore && <div onClick={loadMore} style={{ textAlign: "center", padding: "14px", background: G.blanc, borderRadius: 14, marginTop: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: G.rouge, border: `1px solid ${G.gris}` }}>{loadingMore ? "Chargement..." : "Voir plus de profils"}</div>}
</div> : !p ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: "56px", height: "56px", borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={() => { setPage(0); loadProfiles(0); }}>Actualiser</Btn></div> : <><div
  onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
  onTouchEnd={(e) => {
    if (swipeStartX.current === null) return;
    const diff = swipeStartX.current - e.changedTouches[0].clientX;
    swipeStartX.current = null;
    if (Math.abs(diff) < 40) return; // trop petit = pas un swipe
    if (diff > 0) {
      // swipe gauche → profil suivant (avec wrap)
      navigate("next");
    } else {
      // swipe droite → profil précédent (avec wrap)
      navigate("prev");
    }
  }}
  style={{ background: G.blanc, borderRadius: 22, boxShadow: "0 8px 36px rgba(44,26,14,0.12)", overflow: "hidden", marginBottom: 8, position: "relative", touchAction: "pan-y" }}><div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}</div><div style={{ padding: "10px 14px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111" }}>{p.name}, {p.age} ans {p.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 4 }}><PremiumBadge size={18} /></span>} {p.is_verified && <VerifiedBadge size={18} />}</div>
    {/* 3 traits menu */}
    <div style={{ position: "relative" }}>
      <div onClick={() => setShowReport(v => !v)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", padding: 4 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
      </div>
    </div>
  </div>
  {/* Bottom sheet options - en dehors de la carte */}
  {showReport && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowReport(false)}>
      <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a" }}>{p.name}</div>
          <div onClick={() => setShowReport(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
        </div>
        <div style={{ padding: "8px 16px 32px" }}>
          {auth.isPremium && <div onClick={() => { setShowReport(false); setViewedProfile(p); recordView(p.id); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(26,92,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: G.vert }}>Voir le profil</div>
          </div>}
          <div onClick={() => { setShowReport(false); setShowBlockConfirm(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#1a1a1a" }}>Bloquer</div>
          </div>
          <div onClick={() => { setShowReport(false); setShowSignaler(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(231,76,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#e74c3c" }}>Signaler</div>
          </div>
        </div>
      </div>
    </div>
  )}
  <div style={{ minHeight: 88, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 4 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden", minHeight: 24 }}>
    {p.gender && <span style={{ background: p.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: p.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{p.gender === "Femme" ? "Femme" : "Homme"}</span>}
    {p.city && p.city.trim() && <span style={{ background: "rgba(44,26,14,0.06)", borderRadius: 50, padding: "2px 9px", fontSize: "0.72rem", color: "#555", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1, minWidth: 0, maxWidth: 130 }}>{p.city.trim()}</span>}
    {p.religion && p.religion.trim() && <span style={{ background: "rgba(212,168,67,0.12)", border: `1px solid rgba(212,168,67,0.35)`, borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#555", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", flexShrink: 1, minWidth: 0, maxWidth: 160 }}>{p.religion.trim()}</span>}
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden", minHeight: 24 }}>
    {p.profession && p.profession.trim() && <span style={{ background: "rgba(44,26,14,0.05)", border: "1px solid rgba(44,26,14,0.14)", borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#555", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", flexShrink: 1, minWidth: 0, maxWidth: "48%" }}>{p.profession.trim()}</span>}
    {p.hobbies && p.hobbies.trim() && <span style={{ background: "rgba(26,92,58,0.07)", border: "1px solid rgba(26,92,58,0.18)", borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#2a5a3a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", flexShrink: 1, minWidth: 0, maxWidth: "48%" }}>{p.hobbies.trim()}</span>}
  </div>

  <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5, marginTop: 2, marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", minHeight: "1.23rem" }}>{p.bio || ""}</p>
</div>
</div></div><div style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center", marginTop: 14, marginBottom: 12 }}><div onClick={() => navigate("prev")} style={{ width: 48, height: 48, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>←</div><div onClick={() => handleLike(p)} style={{ width: 67, height: 67, borderRadius: "50%", background: likedIds.has(p.id) ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : G.blanc, border: likedIds.has(p.id) ? "none" : `2px solid ${G.gris}`, boxShadow: likedIds.has(p.id) ? "0 6px 20px rgba(192,57,43,0.4)" : "0 2px 8px rgba(44,26,14,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.73rem", cursor: "pointer" }}>{likedIds.has(p.id) ? "❤️" : "🤍"}</div><div onClick={() => navigate("next")} style={{ width: 48, height: 48, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>→</div></div><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 12 }}>
  {profiles.slice(Math.max(0, current - 2), Math.min(profiles.length, current + 3)).map((_, i) => {
    const idx = Math.max(0, current - 2) + i;
    const isActive = idx === current;
    return (
      <div key={idx} style={{ width: isActive ? 23 : 7, height: 7, borderRadius: 99, background: isActive ? G.rouge : "#E0D5CC", transition: "width 0.25s ease, background 0.25s ease" }} />
    );
  })}
</div><div style={{ marginTop: 12 }}><PremiumEngagementCarousel isPremium={auth.isPremium} onShowPremium={onShowPremium} onNav={undefined} /></div></>}{viewedProfile && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setViewedProfile(null)}>
      <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
          {viewedProfile.photo_url ? <img src={viewedProfile.photo_url} alt={viewedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={() => setViewedProfile(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{viewedProfile.name}, {viewedProfile.age} ans {viewedProfile.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 3 }}><PremiumBadge size={11} /></span>}{viewedProfile.is_verified && <VerifiedBadge size={14} />}</div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{viewedProfile.city}</div>
          </div>
        </div>
        <div style={{ padding: "18px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: viewedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: viewedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{viewedProfile.gender}</span>
            {viewedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{viewedProfile.religion}</span>}
          </div>
          {viewedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{viewedProfile.bio}</p>}
          <Btn variant="primary" onClick={() => { handleLike(viewedProfile); setViewedProfile(null); }} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>❤️ Liker ce profil</Btn>
        </div>
      </div>
    </div>
  )}
  {showSameGender && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div style={{ background: G.blanc, borderRadius: 20, padding: "32px 24px", width: "100%", maxWidth: 300, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>{myGender === "Homme" ? "🕺" : "💃"}</div>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>
        {myGender === "Homme" ? "Eh frère, reste du bon côté ! 😂" : "Eh sœur, reste du bon côté ! 😂"}
      </h3>
      <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
        Moyo c'est pour les rencontres hétérosexuelles 😄
      </p>
      <Btn variant="primary" onClick={() => setShowSameGender(false)} style={{ width: "100%" }}>J'ai compris 😄</Btn>
    </div>
  </div>
)}
{showBlockConfirm && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
  <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Bloquer {p?.name} ?</h3>
    <p style={{ fontSize: "0.88rem", color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Ce profil disparaîtra de Découvrir. Vous pourrez débloquer depuis votre profil.</p>
    <div style={{ display: "flex", gap: 10 }}>
      <Btn variant="ghost" onClick={() => setShowBlockConfirm(false)} style={{ flex: 1 }}>Annuler</Btn>
      <Btn variant="danger" onClick={handleBlock} style={{ flex: 1 }}>Bloquer</Btn>
    </div>
  </div>
</div>}
{showSignaler && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
  <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }}>
    <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
      <div onClick={() => !isReporting && setShowSignaler(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
    </div>
    <div style={{ padding: "12px 16px 32px" }}>
      {isReporting ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#555", fontSize: "0.88rem" }}>
          Envoi du signalement…
        </div>
      ) : (
        ["Faux profil / Arnaque", "Photos inappropriées", "Harcèlement", "Profil mineur", "Autre"].map(r => (
          <div key={r} onClick={() => { handleReport(r); setShowSignaler(false); }} style={{ padding: "14px 16px", background: "#F8F8F8", borderRadius: 12, marginBottom: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a" }}>{r}</div>
        ))
      )}
    </div>
  </div>
</div>}{matchPop && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}><div style={{ textAlign: "center", color: G.blanc }}><div style={{ fontSize: "4rem", marginBottom: 12 }}>💞</div><h2 style={{  fontSize: "2.2rem", color: G.or, marginBottom: 8 }}>C'est un Match !</h2><p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>Toi et {matchPop.name} vous plaisez mutuellement !</p><Btn variant="white" onClick={() => setMatchPop(null)}>Continuer →</Btn></div></div>}</div>;
}

function LikesReceivedBanner({ auth, onShowPremium }: { auth: Auth; onShowPremium: (r: string) => void }) {
  const [count, setCount] = useState(0);
  const [likers, setLikers] = useState<Profile[]>([]);
  const [visitors, setVisitors] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"likes" | "visitors">("likes");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [liking, setLiking] = useState(false);

  const handleLikeFromBanner = async (p: Profile) => {
    setLiking(true);
    try {
      await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
      // Vérifier si match mutuel
      const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
      if (Array.isArray(mutual) && mutual.length > 0) {
        await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id });
      }
    } catch {}
    setLiking(false);
    setSelectedProfile(null);
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Likes reçus
        const res = await sb.query<{ from_user: string }>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user`);
        setCount(Array.isArray(res) ? res.length : 0);
        if (auth.isPremium && Array.isArray(res) && res.length > 0) {
          const ids = res.map(r => r.from_user).join(",");
          const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${ids})&select=*`);
          setLikers(Array.isArray(profiles) ? profiles : []);
        }
        // Visiteurs du profil (Premium uniquement)
        if (auth.isPremium) {
          const views = await sb.query<{ viewer_id: string }>(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}&select=viewer_id&order=created_at.desc&limit=20`);
          if (Array.isArray(views) && views.length > 0) {
            const vIds = [...new Set(views.map(v => v.viewer_id))].join(",");
            const vProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${vIds})&select=*`);
            setVisitors(Array.isArray(vProfiles) ? vProfiles : []);
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Bandeau */}
      <div onClick={() => !auth.isPremium && onShowPremium("Découvre qui a liké ton profil en passant Premium ! 👀")}
        style={{ background: auth.isPremium ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "14px 18px", marginBottom: auth.isPremium && likers.length > 0 ? 12 : 0, color: auth.isPremium ? G.brun : G.blanc, cursor: auth.isPremium ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {auth.isPremium
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
            {auth.isPremium
              ? count > 0 ? `${count} personne${count > 1 ? "s ont" : " a"} liké ton profil` : "Personne n'a encore liké ton profil"
              : count > 0 ? `${count} personne${count > 1 ? "s ont" : " a"} liké ton profil` : "Des personnes ont liké ton profil"}
          </div>
          <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
            {auth.isPremium ? "Accès Premium activé ✓" : "Passe Premium pour découvrir qui 👀"}
          </div>
        </div>
        {!auth.isPremium && count > 0 && (
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
            {count > 9 ? "9+" : count}
          </div>
        )}
      </div>

      {/* Onglets likes / visiteurs — Premium uniquement */}
      {auth.isPremium && (likers.length > 0 || visitors.length > 0) && (
        <div style={{ display: "flex", background: G.gris, borderRadius: 50, padding: 3, gap: 2, marginBottom: 10 }}>
          {[{ id: "likes", label: <span style={{display:"flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{`Likes (${likers.length})`}</span> }, { id: "visitors", label: <span style={{display:"flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{`Visiteurs (${visitors.length})`}</span> }].map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id as "likes" | "visitors")} style={{ flex: 1, padding: "6px 10px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textAlign: "center", background: activeTab === t.id ? G.blanc : "transparent", color: activeTab === t.id ? G.rouge : "#888", boxShadow: activeTab === t.id ? "0 2px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
              {t.label}
            </div>
          ))}
        </div>
      )}
      {auth.isPremium && (likers.length > 0 || visitors.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(activeTab === "likes" ? likers : visitors).map(p => (
            <div key={p.id} onClick={() => setSelectedProfile(p)} style={{ background: G.blanc, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", cursor: "pointer" }}>
              <div style={{ height: 120, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                }
                <div style={{ position: "absolute", top: 6, right: 6, background: activeTab === "likes" ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : "rgba(0,0,0,0.5)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {activeTab === "likes"
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>{p.name}, {p.age} ans</div>
                <div style={{ fontSize: "0.72rem", color: "#555", marginTop: 2 }}>{p.city}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal profil cliquable */}
      {selectedProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSelectedProfile(null)}>
          <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
              {selectedProfile.photo_url
                ? <img src={selectedProfile.photo_url} alt={selectedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              }
              <div onClick={() => setSelectedProfile(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
              <div style={{ position: "absolute", bottom: 14, left: 16 }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{selectedProfile.name}, {selectedProfile.age} ans {selectedProfile.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 3 }}><PremiumBadge size={11} /></span>}{selectedProfile.is_verified && <VerifiedBadge size={14} />}</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{selectedProfile.city}</div>
              </div>
            </div>
            <div style={{ padding: "18px 20px 32px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ background: selectedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: selectedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{selectedProfile.gender}</span>
                {selectedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{selectedProfile.religion}</span>}
              </div>
              {selectedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{selectedProfile.bio}</p>}
              <Btn variant="primary" onClick={() => handleLikeFromBanner(selectedProfile)} loading={liking} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Liker {selectedProfile.name}
                </span>
              </Btn>
            </div>
          </div>
        </div>
      )}

      {auth.isPremium && loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#555", fontSize: "0.85rem" }}>Chargement...</div>
      )}
    </div>
  );
}

