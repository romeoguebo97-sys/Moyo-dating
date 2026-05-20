import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function BotWidget({ onClose, auth }: { onClose: () => void; auth: Auth }) {
  const [mode, setMode] = useState<"home" | "chat" | "report">("home");
  const [msgs, setMsgs] = useState<{ from: "bot" | "user"; text: string }[]>([
    { from: "bot", text: `Bonjour ${auth.name || ""} ! Je suis l'assistant Moyo. Comment puis-je t'aider ?` }
  ]);
  const [input, setInput] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const sendMsg = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(prev => [...prev, { from: "user", text: userMsg }]);
    setTimeout(() => {
      setMsgs(prev => [...prev, { from: "bot", text: getBotResponse(userMsg) }]);
    }, 600);
  };

  const sendReport = async () => {
    if (!reportText.trim()) return;
    // ── Alerte bot : ce n'est PAS un signalement contre un profil précis.
    // reported_id = null (alerte système, pas d'utilisateur ciblé).
    console.log(`[Moyo][Support] Message support - auteur:${auth.userId}`);
    try {
      await sb.insert(auth.token, "reports", {
        reporter_id: auth.userId,
        reported_id: auth.userId,
        reason: `${SUPPORT_PREFIX_USER} ${reportText.trim()}`,
        status: "pending",
      });
      console.log("[Moyo][Support] ✅ Message support enregistré");
    } catch (e: any) {
      // Si reported_id n'accepte pas null → log sans crasher
      console.warn("[Moyo][Support] ⚠️ Message support non enregistré :", e?.message || e);
    }
    setReportSent(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
              <path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/>
              <circle cx="9" cy="11" r="1" fill="white" stroke="none"/>
              <circle cx="15" cy="11" r="1" fill="white" stroke="none"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: G.blanc }}>Assistant Moyo</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)" }}>Répond instantanément</div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", opacity: 0.7 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>

        {/* Home */}
        {mode === "home" && (
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 4 }}>Que puis-je faire pour toi ?</p>
            <div onClick={() => setMode("chat")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "#F8F8F8", borderRadius: 14, cursor: "pointer", border: `1px solid ${G.gris}` }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a1a" }}>Besoin d'aide</div>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Pose ta question, je réponds instantanément</div>
              </div>
            </div>
            <div onClick={() => setMode("report")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "#F8F8F8", borderRadius: 14, cursor: "pointer", border: `1px solid ${G.gris}` }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a1a" }}>Contacter notre équipe</div>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Écrire directement à l’assistance Moyo</div>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        {mode === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.from === "user" ? G.vert : "#F2F2F2", color: m.from === "user" ? G.blanc : "#1a1a1a", fontSize: "0.83rem", lineHeight: 1.5 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${G.gris}`, display: "flex", gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Pose ta question..." style={{ flex: 1, padding: "10px 14px", borderRadius: 50, border: `1px solid ${G.gris}`, fontSize: "0.85rem", outline: "none" }} />
              <div onClick={sendMsg} style={{ width: 40, height: 40, borderRadius: "50%", background: G.vert, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </>
        )}

        {/* Report */}
        {mode === "report" && (
          <div style={{ padding: "20px 16px" }}>
            {reportSent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(26,92,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>Message envoyé</div>
                <div style={{ fontSize: "0.82rem", color: "#555" }}>L’assistance Moyo vous répondra directement dans votre messagerie.</div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 14 }}>Écris ton message à l’équipe Moyo. La réponse apparaîtra ensuite dans ta messagerie.</p>
                <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="Ex : Bonjour, j’ai une question concernant mon compte..." style={{ width: "100%", minHeight: 100, padding: "12px", borderRadius: 12, border: `1px solid ${G.gris}`, fontSize: "0.85rem", resize: "none", outline: "none", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setMode("home")} style={{ flex: 1 }}>Retour</Btn>
                  <Btn variant="danger" onClick={sendReport} style={{ flex: 2 }} disabled={!reportText.trim()}>Envoyer le message</Btn>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Desktop detection ───────────────────────────────────────────────────────
const isDesktop = () =>
  typeof window !== "undefined" && window.innerWidth > 900 && !("ontouchstart" in window);

const openAdminPanel = (fallback: () => void) => {
  if (isDesktop()) {
    const url = `${window.location.origin}${window.location.pathname}?admin=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    fallback();
  }
};

// ─── Admin Desktop page (mounted when ?admin=1) ───────────────────────────────
