// ── Composants UI simples et réutilisables, partagés entre App.tsx et Admin.tsx. ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).
import React, { useEffect, memo } from "react";
import { G } from "../theme";

export function Btn({ children, variant = "primary", onClick, style = {}, disabled = false, loading = false }: {
  children: React.ReactNode; variant?: string; onClick?: () => void;
  style?: React.CSSProperties; disabled?: boolean; loading?: boolean;
}) {
  const base: React.CSSProperties = {
    border: "none", borderRadius: 50, padding: "13px 28px", fontWeight: 600,
    fontSize: "0.93rem", cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.65 : 1, display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.18s ease", ...style,
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { background: G.rouge, color: "#fff", boxShadow: "0 4px 18px rgba(192,57,43,0.3)" },
    authPrimary: { background: "linear-gradient(135deg,#CC5347,#B8392E)", color: "#fff", boxShadow: "0 6px 20px rgba(184,57,46,0.28)" },
    gold: { background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111" },
    outline: { background: "transparent", color: G.brun, border: `2px solid ${G.brun}` },
    ghost: { background: "var(--c-ghost-bg)", color: G.brun },
    danger: { background: "#e74c3c", color: "#fff" },
    white: { background: G.blanc, color: G.rouge },
  };
  return <button style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled || loading}>{loading ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:"pulse 0.8s ease-in-out infinite"}}><circle cx="12" cy="12" r="10"/></svg> : children}</button>;
}

export function Toast({ msg, type = "success", onClose }: { msg: string; type?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, type === "error" ? 6000 : 4000); return () => clearTimeout(t); }, []);
  const isError = type === "error";
  const borderColor = isError ? "rgba(192,57,43,0.5)" : type === "premium" ? "rgba(212,168,67,0.4)" : "rgba(26,92,58,0.4)";
  const iconColor = isError ? "#ff6b6b" : type === "premium" ? G.or : "#52d68a";
  const bgColor = isError ? "rgba(30,10,10,0.88)" : "rgba(20,20,20,0.82)";
  const icon = isError
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    : type === "premium"
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill={iconColor} stroke="none" style={{ flexShrink: 0 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>;
  return (
    <div style={{
      position: "fixed",
      bottom: "calc(env(safe-area-inset-bottom) + 76px)",
      left: "50%",
      transform: "translateX(-50%)",
      background: bgColor,
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      color: "rgba(255,255,255,0.95)",
      padding: isError ? "14px 20px" : "11px 18px",
      borderRadius: isError ? 16 : 50,
      fontSize: "0.84rem",
      fontWeight: 600,
      zIndex: 12010,
      boxShadow: isError
        ? "0 12px 40px rgba(192,57,43,0.35), inset 0 1px 0 rgba(255,255,255,0.1)"
        : "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
      maxWidth: "min(480px, 90vw)",
      width: isError ? "min(480px, 90vw)" : "auto",
      textAlign: "left",
      display: "flex",
      alignItems: isError ? "flex-start" : "center",
      gap: 10,
      border: `1.5px solid ${borderColor}`,
      animation: "fadeUp 0.25s ease",
      lineHeight: 1.5,
    }}>
      {icon}
      <span style={{ flex: 1 }}>{msg}</span>
      {isError && (
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 0, flexShrink: 0, marginLeft: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#1d9bf0", borderRadius: "50%", width: size, height: size, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}

export function PremiumBadge({ size = 16 }: { size?: number }) {
  return (
    <div
      aria-label="Profil premium"
      title="Profil premium"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#D4A843",
        borderRadius: "50%",
        width: size,
        height: size,
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="#111" stroke="none" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
  );
}

export const Avatar = memo(function Avatar({ url, gender, size = 54, border = false, premium = false }: { url?: string | null; gender?: string; size?: number; border?: boolean; premium?: boolean }) {
  // ── Cercle doré pour les membres Premium, rouge pour les autres ──
  const borderColor = border ? (premium ? G.or : G.rouge) : "none";
  const borderStyle = border ? `3px solid ${borderColor}` : "none";
  const boxShadow = border && premium ? `0 0 0 1px ${G.or}44` : "none";
  return <div style={{ position: "relative", flexShrink: 0 }}><div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: borderStyle, boxShadow, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center" }}>{url ? <img src={url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : (<svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)}</div>{premium && <div style={{ position: "absolute", bottom: -2, right: -2, background: G.or, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${G.blanc}` }}><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>}</div>;
});

export function ConfirmModal({ msg, onConfirm, onCancel, confirmLabel = "Confirmer", danger = false }: { msg: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean }) {
  return (
    <div onClick={onCancel} className="moyo-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="moyo-card-in" onClick={e => e.stopPropagation()} style={{ background: G.blanc, borderRadius: 18, padding: "26px 24px", width: "100%", maxWidth: 380, boxShadow: "0 24px 70px rgba(0,0,0,0.3)" }}>
        <p style={{ fontSize: "0.92rem", color: "#111", lineHeight: 1.6, marginBottom: 22, fontWeight: 500, whiteSpace: "pre-line", textAlign: "center" }}>{msg}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 50, border: `1.5px solid ${G.gris}`, background: G.creme, fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", color: "#555" }}>Annuler</button>
          <button onClick={() => { onConfirm(); }} style={{ flex: 1, padding: "12px", borderRadius: 50, border: "none", background: danger ? G.rouge : `linear-gradient(135deg,${G.vert},#0D2E1C)`, color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export const Badge = memo(function Badge({ label, color = G.rouge, bg = "rgba(192,57,43,0.1)" }: { label: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 50, padding: "2px 8px",
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: 0.2, flexShrink: 0 }}>
      {label}
    </span>
  );
});
