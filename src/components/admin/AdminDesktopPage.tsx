import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { AdminPinGate } from "./Admin";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function AdminDesktopPage() {
  const [auth, setAuth] = React.useState<Auth | null>(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("moyo_session");
      if (saved) {
        const a: Auth = JSON.parse(saved);
        if (a?.token && a?.userId && a?.isAdmin) setAuth(a);
      }
    } catch {}
    setChecked(true);
  }, []);

  if (!checked) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F1F5" }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
    </div>
  );

  if (!auth) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F0F1F5", gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: G.brun, marginBottom: 8 }}>Accès refusé</div>
        <div style={{ fontSize: "0.9rem", color: "#777", marginBottom: 24 }}>Connectez-vous en tant qu'administrateur.</div>
        <button onClick={() => window.close()} style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc, border: "none", borderRadius: 50, padding: "12px 32px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>Fermer</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F0F1F5" }}>
      <style>{`
        /* ── Desktop Admin overrides ── */
        .adm-wrap { --adm-bg: #F0F1F5; }

        /* Header mobile de Admin caché - remplacé par la topbar ci-dessus */
        .adm-wrap [data-admhdr] { display: none !important; }

        /* Sur desktop, les onglets sticky se collent sous la topbar (60px) */
        @media (min-width: 900px) {
          .adm-wrap [data-admhdr] + div,
          .adm-wrap [data-admtabs] { top: 0 !important; }
        }

        /* Stats grille principale : 4 colonnes */
        @media (min-width: 900px) {
          .adm-wrap [data-admgrid="main"] { grid-template-columns: repeat(4,1fr) !important; gap: 18px !important; }
          .adm-wrap [data-admgrid="adv"]  { grid-template-columns: repeat(4,1fr) !important; gap: 16px !important; }
          .adm-wrap [data-admgrid="row"]  { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
          .adm-wrap [data-admlist]        { display: grid !important; grid-template-columns: repeat(2,1fr) !important; gap: 14px !important; }
          .adm-wrap [data-admlist] > * { margin-bottom: 0 !important; }
        }
        @media (min-width: 1200px) {
          .adm-wrap [data-admlist] { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>

      {/* Topbar desktop */}
      <div style={{ position: "sticky", top: 0, zIndex: 200, background: G.blanc, borderBottom: `1px solid ${G.gris}`, boxShadow: "0 2px 16px rgba(44,26,14,0.07)", padding: "0 32px", display: "flex", alignItems: "center", gap: 14, height: 60 }}>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: G.rouge }}>Mo<span style={{ color: G.or }}>yo</span></div>
        <div style={{ width: 1, height: 28, background: G.gris, flexShrink: 0 }} />
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: G.brun }}>Admin Dashboard</div>
        <div style={{ fontSize: "0.8rem", color: "#bbb" }}>— espace de modération</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: G.brun }}>{auth.name}</div>
        </div>
        <button
          onClick={() => {
            // Déclencher le modal d'aide dans le composant Admin via un event custom
            const el = document.querySelector("[data-admhelp]") as HTMLButtonElement | null;
            if (el) el.click();
          }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: G.creme, border: `1.5px solid ${G.gris}`, borderRadius: 20, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: G.brunLight, transition: "background 0.15s" }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = G.cremeDark; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = G.creme; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Aide
        </button>
        <button onClick={() => window.close()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: G.creme, border: `1.5px solid ${G.gris}`, borderRadius: 20, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "#888" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Fermer
        </button>      </div>

      {/* Contenu Admin dans wrapper desktop */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px 60px", boxSizing: "border-box" as const }}>
        <div className="adm-wrap">
          <AdminPinGate auth={auth} onBack={() => window.close()} onBadgeCount={() => {}} />
        </div>
      </div>
    </div>
  );
}

