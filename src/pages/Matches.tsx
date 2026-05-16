import React, { useState, useEffect, useRef, useCallback, memo } from "react";
// ── Auto-extracted from monolith ──
// TODO: replace inline references with imports from ../../lib, ../../constants, ../../components

export function Matches({ auth, onShowPremium, onNotifCount, onGoMessages, onUnmatchStart, onUnmatchEnd }: { auth: Auth; onShowPremium: (r: string) => void; onNotifCount: (n: number) => void; onGoMessages?: (partnerId?: string) => void; onUnmatchStart?: () => void; onUnmatchEnd?: () => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [menuMatchId, setMenuMatchId] = useState<string | null>(null);
  const [confirmUnmatch, setConfirmUnmatch] = useState<Match | null>(null);
  const [confirmBlockMatch, setConfirmBlockMatch] = useState<Match | null>(null);
  const isUnmatching = useRef(false);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    setLoading(true);
    const res = await sb.query<Match>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&order=created_at.desc`);
    const enriched = await Promise.all(res.map(async m => {
      const pid = m.user1 === auth.userId ? m.user2 : m.user1;
      const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${pid}`);
      return { ...m, partner: profiles[0] };
    }));
    const seen = new Set<string>();
    const valid = enriched.filter(m => {
      if (!m.partner) return false;
      if (seen.has(m.partner.id)) return false;
      seen.add(m.partner.id);
      return true;
    });
    setMatches(valid);
    onNotifCount(valid.length);
    setLoading(false);
  };

  const handleUnmatch = async (m: Match) => {
    isUnmatching.current = true;
    if (onUnmatchStart) onUnmatchStart();

    const partnerId = m.partner?.id;
    const updated = matches.filter(x => x.id !== m.id && !(
      (x.user1 === auth.userId && x.user2 === partnerId) ||
      (x.user1 === partnerId && x.user2 === auth.userId)
    ));
    setMatches(updated);
    onNotifCount(updated.length);
    setConfirmUnmatch(null);
    setMenuMatchId(null);

    if (!partnerId) { isUnmatching.current = false; if (onUnmatchEnd) onUnmatchEnd(); return; }

    try {
      const [fwd, rev] = await Promise.all([
        sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${partnerId}&select=id`),
        sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${partnerId}&user2=eq.${auth.userId}&select=id`),
      ]);
      const allIds = [
        ...(Array.isArray(fwd) ? fwd.map(x => x.id) : []),
        ...(Array.isArray(rev) ? rev.map(x => x.id) : []),
        m.id,
      ].filter((id, i, arr) => id && arr.indexOf(id) === i);

      for (const id of allIds) {
        await sb.delete(auth.token, "messages", `?match_id=eq.${id}`);
      }
      await sb.delete(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${partnerId}`);
      await sb.delete(auth.token, "matches", `?user1=eq.${partnerId}&user2=eq.${auth.userId}`);
      await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${partnerId}`);
      await sb.delete(auth.token, "likes", `?from_user=eq.${partnerId}&to_user=eq.${auth.userId}`);
    } catch {
      try {
        await sb.delete(auth.token, "messages", `?match_id=eq.${m.id}`);
        await sb.delete(auth.token, "matches", `?id=eq.${m.id}`);
      } catch {}
    } finally {
      setTimeout(() => {
        isUnmatching.current = false;
        if (onUnmatchEnd) onUnmatchEnd();
      }, 2000);
    }
  };

  const handleBlockMatch = async (m: Match) => {
    setConfirmBlockMatch(null);
    // Annuler le match d'abord (cascade complète)
    await handleUnmatch(m);
    // Bloquer la personne
    if (m.partner?.id) {
      try { await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: m.partner.id }); } catch {}
    }
  };

  const p = selectedMatch?.partner;

  return <div style={{ padding: "12px 16px 16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Matchs</h2>
      <div onClick={() => setViewMode(v => v === "card" ? "list" : "card")} style={{ background: G.blanc, color: "#111", border: `2px solid ${G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>{viewMode === "card" ? "≡ Liste" : "⊞ Carte"}</div>
    </div>
    {/* Overlay fermeture menu */}
    {menuMatchId && <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setMenuMatchId(null)} />}

    {loading ? <div style={{ textAlign: "center", padding: 40 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"pulse 1s ease-in-out infinite"}}><circle cx="12" cy="12" r="10"/></svg></div>
    : matches.length === 0 ? <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><p>Continue à liker des profils pour avoir des matchs !</p></div>
    : viewMode === "list" ? (
      <div>
        {matches.map(m => (
          <div key={m.id} className="card-hover" style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc, borderRadius: 16, padding: "12px", marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
            <div onClick={() => setSelectedMatch(m)} style={{ width: 58, height: 58, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", cursor: "pointer" }}>
              {m.partner?.photo_url ? <img src={m.partner.photo_url} alt={m.partner?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}
            </div>
            <div onClick={() => setSelectedMatch(m)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{m.partner?.name}, {m.partner?.age} ans</div>
              <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>{m.partner?.city}{m.partner?.religion && <span style={{ marginLeft: 6 }}>· {m.partner.religion}</span>}</div>
              <div style={{ fontSize: "0.7rem", color: "#27ae60", fontWeight: 600, marginTop: 2 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</div>
            </div>
            {/* 3 traits */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div onClick={() => setMenuMatchId(menuMatchId === m.id ? null : m.id)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", padding: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
              </div>
              {menuMatchId === m.id && (
                <div style={{ position: "absolute", right: 0, top: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.2)", zIndex: 200, minWidth: 190 }}>
                  <div onClick={() => { setMenuMatchId(null); setSelectedMatch(m); if (auth.isPremium && m.partner?.id) sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: m.partner.id }).catch(()=>{}); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Voir le profil
                  </div>
                  <div onClick={() => { setMenuMatchId(null); if (onGoMessages) onGoMessages(m.partner?.id); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Envoyer un message
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmBlockMatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Bloquer
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmUnmatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler le match
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {matches.map(m => (
          <div key={m.id} className="card-hover" style={{ background: G.blanc, borderRadius: 16, boxShadow: "0 3px 16px rgba(44,26,14,0.08)", position: "relative" }}>
            <div onClick={() => setSelectedMatch(m)} style={{ cursor: "pointer" }}>
              <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden" }}>
                {m.partner?.photo_url ? <img src={m.partner.photo_url} alt={m.partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "3rem" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}
              </div>
              <div style={{ padding: "10px 10px 6px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.partner?.name}, {m.partner?.age} ans</div>
                <div style={{ fontSize: "0.72rem", color: "#555" }}>📌 {m.partner?.city}</div>
                <div style={{ fontSize: "0.68rem", color: "#27ae60", fontWeight: 600, marginTop: 3 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</div>
              </div>
            </div>
            {/* 3 traits en bas */}
            <div style={{ position: "relative", padding: "4px 10px 10px", display: "flex", justifyContent: "flex-end" }}>
              <div onClick={() => setMenuMatchId(menuMatchId === m.id ? null : m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", padding: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 2, borderRadius: 2, background: "#aaa" }} />)}
              </div>
              {menuMatchId === m.id && (
                <div style={{ position: "absolute", right: 10, bottom: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.2)", zIndex: 200, minWidth: 190 }}>
                  <div onClick={() => { setMenuMatchId(null); setSelectedMatch(m); if (auth.isPremium && m.partner?.id) sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: m.partner.id }).catch(()=>{}); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Voir le profil
                  </div>
                  <div onClick={() => { setMenuMatchId(null); if (onGoMessages) onGoMessages(m.partner?.id); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Envoyer un message
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmBlockMatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Bloquer
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmUnmatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler le match
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedMatch && p && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSelectedMatch(null)}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 220, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={() => setSelectedMatch(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontSize: "1rem", fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
            <div style={{  fontSize: "1.5rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{p.name}, {p.age} ans</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{p.city}</div>
          </div>
        </div>
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</span>
            {p.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>⭐ Premium</span>}
            {p.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: `1px solid rgba(212,168,67,0.3)`, color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{p.religion}</span>}
          </div>
          {p.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{p.bio}</p>}
          <Btn variant="primary" onClick={() => { const pid = selectedMatch?.partner?.id; setSelectedMatch(null); if (onGoMessages) onGoMessages(pid); }} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>Envoyer un message</Btn>
        </div>
      </div>
    </div>}

    {/* Modal confirmation annulation match */}
    {confirmUnmatch && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="2" y1="2" x2="22" y2="22"/></svg></div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Annuler le match avec {confirmUnmatch.partner?.name} ?</h3>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 24, lineHeight: 1.6 }}>La conversation et les messages seront supprimés. L'autre personne ne sera pas notifiée.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmUnmatch(null)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn variant="danger" onClick={() => handleUnmatch(confirmUnmatch)} style={{ flex: 1 }}>Confirmer</Btn>
          </div>
        </div>
      </div>
    )}

    {/* Modal confirmation blocage */}
    {confirmBlockMatch && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Bloquer {confirmBlockMatch.partner?.name} ?</h3>
          <p style={{ fontSize: "0.83rem", color: "#666", marginBottom: 22, lineHeight: 1.6 }}>Le match et la conversation seront supprimés. Cette personne ne pourra plus te voir ni te contacter.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmBlockMatch(null)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn variant="danger" onClick={() => handleBlockMatch(confirmBlockMatch)} style={{ flex: 1 }}>Bloquer</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function getOnlineStatus(lastSeen?: string): { label: string; color: string } {
  if (!lastSeen) return { label: "Hors ligne", color: "#bbb" };
  const diff = (Date.now() - new Date(lastSeen).getTime()) / 1000 / 60; // en minutes
  if (diff < 2) return { label: "En ligne", color: "#27ae60" };
  if (diff < 10) return { label: `Vu il y a ${Math.floor(diff)} min`, color: "#f39c12" };
  if (diff < 60) return { label: `Vu il y a ${Math.floor(diff)} min`, color: "#bbb" };
  if (diff < 1440) return { label: `Vu il y a ${Math.floor(diff / 60)}h`, color: "#bbb" };
  return { label: `Vu il y a ${Math.floor(diff / 1440)}j`, color: "#bbb" };
}

function TickIcon({ read, isPremium, white = false }: { read: boolean; isPremium: boolean; white?: boolean }) {
  if (!isPremium) {
    // Gratuit : juste une coche grise
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={white ? "rgba(255,255,255,0.6)" : "#bbb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  // Premium : double coche - grise si pas lu, bleue si lu
  const color = read ? "#4fc3f7" : (white ? "rgba(255,255,255,0.6)" : "#bbb");
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -5 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}

const ReplyBanner = React.memo(function ReplyBanner({ replyTo, partnerName, myId, onCancel }: {
  replyTo: Message; partnerName?: string; myId: string; onCancel: () => void;
}) {
  const isMine = replyTo.sender_id === myId;
  const name = isMine ? "Toi" : (partnerName ?? "…");
  const accent = isMine ? G.vert : G.rouge;
  const isImg = replyTo.content.startsWith("[img]");
  const raw = replyTo.content.replace(/^\[↩.*?\]\n/, "");
  const preview = !isImg && raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
  return (
    // ── ReplyBanner v2 : visible, robuste iOS, sans overflow caché ──
    <div style={{
      display: "flex", alignItems: "stretch",
      background: "#F0F0F0",
      borderRadius: 12,
      border: `1px solid ${G.gris}`,
      boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
      minHeight: 52,
      width: "100%",
      flexShrink: 0,
    }}>
      {/* Barre colorée gauche */}
      <div style={{ width: 5, flexShrink: 0, background: accent, borderRadius: "12px 0 0 12px" }} />
      {/* Icône ↩ */}
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 10, paddingRight: 4, flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
        </svg>
      </div>
      {/* Texte */}
      <div style={{ flex: 1, padding: "8px 6px 8px 2px", minWidth: 0 }}>
        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: accent, marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: "0.78rem", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
          {isImg ? (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ color: "#888" }}>Photo</span>
            </span>
          ) : preview}
        </div>
      </div>
      {/* Miniature image */}
      {isImg && (
        <img src={replyTo.content.slice(5, -6)} alt="" style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0, alignSelf: "center", borderRadius: 8, margin: "0 6px" }} />
      )}
      {/* Bouton ✕ */}
      <div onClick={onCancel} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", cursor: "pointer", flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#DCDCDC", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

type ReportRowLike = { id?: string; reason: string; reporter_id: string; reported_id: string | null; status?: string; created_at?: string };

