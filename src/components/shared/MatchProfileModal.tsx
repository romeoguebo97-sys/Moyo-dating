import React, { useState, useEffect, useRef } from "react";
// ── Auto-extracted from monolith ──

function MatchProfileModal({ match, onClose, onMessage }: { match: Match; onClose: () => void; onMessage: () => void }) {
  const p = match.partner;
  if (!p) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {/* Photo */}
        <div style={{ height: 220, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontSize: "1rem", fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
            <div style={{  fontSize: "1.6rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{p.name}, {p.age} ans</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{p.city}</div>
          </div>
        </div>
        {/* Infos */}
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</span>
            {p.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>⭐ Premium</span>}
            {p.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{p.religion}</span>}
          </div>
          {p.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{p.bio}</p>}
          <Btn variant="primary" onClick={onMessage} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>Envoyer un message</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Types enrichis pour l'historique avancé ───────────────────────────────
type LikeRecord = { from_user: string; to_user: string; created_at?: string };
type ViewRecord  = { viewer_id: string; viewed_id: string; created_at?: string };
type VisitRecord = { visitor_id: string; visited_id: string; created_at?: string };
type MatchRecord = { id: string; user1: string; user2: string };

// Helpers date
const isRecent = (iso?: string, hours = 48) => {
  if (!iso) return false;
  return (Date.now() - new Date(iso).getTime()) < hours * 3600 * 1000;
};
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`;
  if (diffH < 48) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

// Switch interne réutilisable
function InnerSwitch({ options, value, onChange }: {
  options: { id: string; label: string; icon: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", background: "#F0F0F0", borderRadius: 50, padding: 4, gap: 4, marginBottom: 16 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          style={{ flex: 1, border: "none", borderRadius: 50, padding: "8px 12px",
            background: value === o.id ? G.blanc : "transparent",
            color: value === o.id ? G.rouge : "#666",
            fontWeight: value === o.id ? 700 : 500,
            fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5,
            boxShadow: value === o.id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.18s ease" }}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

// Badge générique
function Badge({ label, color = G.rouge, bg = "rgba(192,57,43,0.1)" }: { label: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 50, padding: "2px 8px",
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: 0.2, flexShrink: 0 }}>
      {label}
    </span>
  );
}

// Bloc flou Premium CTA
function PremiumBlur({ count, label, onShowPremium }: { count: number; label: string; onShowPremium: () => void }) {
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
      {/* Cartes fantômes floutées */}
      <div style={{ filter: "blur(7px)", pointerEvents: "none", userSelect: "none" }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc,
            borderRadius: 16, padding: 12, marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg,#E8C5A0,#C47A4A)`, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, background: "#ddd", borderRadius: 50, width: "60%", marginBottom: 8 }} />
              <div style={{ height: 10, background: "#eee", borderRadius: 50, width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
      {/* Overlay CTA */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14, padding: 24,
        background: "rgba(255,255,255,0.72)", backdropFilter: "blur(2px)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(135deg,${G.or},#B8860B)`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#111" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#111", marginBottom: 6 }}>
            {count > 0 ? `${count} ${label}` : label}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5 }}>
            Passe Premium pour tout voir
          </div>
        </div>
        <button onClick={onShowPremium}
          style={{ background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111",
            border: "none", borderRadius: 50, padding: "12px 28px", fontWeight: 700,
            fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(212,168,67,0.4)" }}>
          Passer à Premium <svg width="11" height="11" viewBox="0 0 24 24" fill="#111" stroke="none" style={{ display: "inline", verticalAlign: "middle", marginLeft: 3 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
      </div>
    </div>
  );
}

// Empty state élégant
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 24px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 14 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F5F0EB",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#333", marginBottom: 6 }}>{title}</div>
        {subtitle && <div style={{ fontSize: "0.82rem", color: "#888", lineHeight: 1.6 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

