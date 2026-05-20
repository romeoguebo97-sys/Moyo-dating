import React, { useState, useEffect } from "react";
import { G } from "../../constants";

// ── Bouton ──
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
    primary: { background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.3)" },
    gold: { background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111" },
    outline: { background: "transparent", color: "#111", border: `2px solid ${G.brun}` },
    ghost: { background: "rgba(44,26,14,0.06)", color: "#111" },
    danger: { background: "#e74c3c", color: G.blanc },
    white: { background: G.blanc, color: G.rouge },
  };
  return (
    <button style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled || loading}>
      {loading
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
        : children}
    </button>
  );
}

// ── Input ──
export function Input({ label, type = "text", value, onChange, placeholder, icon, error, hint }: {
  label?: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; icon?: string; error?: string; hint?: string;
}) {
  const [focus, setFocus] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  const svgIcon = icon === "email"
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    : icon === "lock" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    : icon === "user" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    : icon === "cake" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/></svg>
    : icon ? <span style={{ opacity: 0.5 }}>{icon}</span> : null;
  return (
    <div style={{ marginBottom: 18, width: "100%" }}>
      {label && <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>{label}</label>}
      <div style={{ position: "relative", width: "100%" }}>
        {svgIcon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5, pointerEvents: "none", zIndex: 1, color: "#555", display: "flex" }}>{svgIcon}</span>}
        <input
          type={isPwd ? (showPwd ? "text" : "password") : type}
          value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ width: "100%", boxSizing: "border-box", padding: icon ? (isPwd ? "13px 42px 13px 40px" : "13px 14px 13px 40px") : (isPwd ? "13px 42px 13px 14px" : "13px 14px"), border: `2px solid ${error ? "#e74c3c" : focus ? G.or : G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none", transition: "border-color 0.2s", display: "block" }}
        />
        {isPwd && <span onClick={() => setShowPwd(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6, zIndex: 1 }}>
          {showPwd
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
        </span>}
      </div>
      {hint && !error && <p style={{ color: "#555", fontSize: "0.75rem", marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ── Toast ──
export function Toast({ msg, type = "success", onClose }: { msg: string; type?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const borderColor = type === "error" ? "rgba(192,57,43,0.4)" : type === "premium" ? "rgba(212,168,67,0.4)" : "rgba(26,92,58,0.4)";
  const iconColor = type === "error" ? "#ff6b6b" : type === "premium" ? G.or : "#52d68a";
  const icon = type === "error"
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    : type === "premium"
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill={iconColor} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  return (
    <div style={{ position: "fixed", bottom: "calc(env(safe-area-inset-bottom) + 76px)", left: "50%", transform: "translateX(-50%)", background: "rgba(20,20,20,0.75)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", color: "rgba(255,255,255,0.92)", padding: "11px 18px", borderRadius: 50, fontSize: "0.84rem", fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", maxWidth: "88vw", textAlign: "center", display: "flex", alignItems: "center", gap: 8, border: `1px solid ${borderColor}`, animation: "fadeUp 0.25s ease", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {icon}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{msg}</span>
    </div>
  );
}

// ── ErrorModal ──
export function ErrorModal({ msg, onClose }: { msg: string; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
        <p style={{ fontSize: "0.88rem", color: "#111", lineHeight: 1.6, marginBottom: 22, fontWeight: 500 }}>{msg}</p>
        <Btn variant="primary" onClick={onClose} style={{ width: "100%" }}>OK</Btn>
      </div>
    </div>
  );
}

// ── ModerationModal ──
export function ModerationModal({ type, onClose }: { type: "insult" | "scam" | "sexual"; onClose: () => void }) {
  const config = {
    insult: { icon: "🚫", text: "Ce message contient des termes irrespectueux. Sur MOYO, nous encourageons le respect et la bienveillance ❤️" },
    scam: { icon: "⚠️", text: "Ce message contient des éléments suspects (demande d'argent, arnaque). Ce comportement est interdit sur MOYO ❤️" },
    sexual: { icon: "🔒", text: "Ce message contient du contenu inapproprié. Sur MOYO, nous encourageons le respect et la bienveillance ❤️" },
  };
  const { icon, text } = config[type];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: G.blanc, borderRadius: 24, width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 24px 64px rgba(44,26,14,0.18)", overflow: "hidden", animation: "fadeUp 0.25s ease" }}>
        <div style={{ background: "linear-gradient(135deg,#fff5f5,#ffe8e8)", padding: "24px 20px 16px" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>{icon}</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: G.rouge, letterSpacing: "0.08em", textTransform: "uppercase" }}>Avertissement</div>
        </div>
        <div style={{ padding: "16px 24px 22px" }}>
          <p style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.65, marginBottom: 20 }}>{text}</p>
          <button onClick={onClose} style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc, border: "none", borderRadius: 50, padding: "13px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(192,57,43,0.3)" }}>OK, J'AI COMPRIS</button>
        </div>
      </div>
    </div>
  );
}

// ── VerifiedBadge ──
export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#1d9bf0", borderRadius: "50%", width: size, height: size, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
  );
}

// ── PremiumBadge ──
export function PremiumBadge({ size = 16 }: { size?: number }) {
  return (
    <div aria-label="Profil premium" title="Profil premium" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#D4A843", borderRadius: "50%", width: size, height: size, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="#111" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    </div>
  );
}

// ── Avatar ──
export function Avatar({ url, gender, size = 54, border = false, premium = false }: { url?: string | null; gender?: string; size?: number; border?: boolean; premium?: boolean }) {
  const borderColor = border ? (premium ? G.or : G.rouge) : "none";
  const borderStyle = border ? `3px solid ${borderColor}` : "none";
  const boxShadow = border && premium ? `0 0 0 1px ${G.or}44` : "none";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: borderStyle, boxShadow, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45 }}>
        {url ? <img src={url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : (gender === "Femme" ? "👩🏿" : "👨🏿")}
      </div>
      {premium && <div style={{ position: "absolute", bottom: -2, right: -2, background: G.or, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", border: `2px solid ${G.blanc}` }}>⭐</div>}
    </div>
  );
}

// ── Spinner ──
export function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
  );
}

// ── EmptyState ──
export function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(212,168,67,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: "0.84rem", color: "#888", lineHeight: 1.5 }}>{subtitle}</div>}
    </div>
  );
}

// ── InnerSwitch ──
export function InnerSwitch({ options, value, onChange }: {
  options: { id: string; label: React.ReactNode; icon?: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", background: "rgba(44,26,14,0.06)", borderRadius: 50, padding: 4, marginBottom: 16, gap: 2 }}>
      {options.map(o => (
        <div key={o.id} onClick={() => onChange(o.id)} style={{ flex: 1, padding: "7px 10px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textAlign: "center", background: value === o.id ? G.blanc : "transparent", color: value === o.id ? G.rouge : "#888", boxShadow: value === o.id ? "0 2px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {o.icon}{o.label}
        </div>
      ))}
    </div>
  );
}

// ── Badge ──
export function Badge({ label, color = G.rouge, bg = "rgba(192,57,43,0.1)" }: { label: React.ReactNode; color?: string; bg?: string }) {
  return <span style={{ background: bg, color, borderRadius: 50, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>{label}</span>;
}

// ── PremiumBlur ──
export function PremiumBlur({ count, label, onShowPremium }: { count: number; label: string; onShowPremium: () => void }) {
  return (
    <div onClick={onShowPremium} style={{ cursor: "pointer", borderRadius: 16, overflow: "hidden", position: "relative", padding: "24px 20px", textAlign: "center", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc }}>
      <div style={{ fontSize: "2rem", fontWeight: 900, marginBottom: 4 }}>{count > 0 ? `${count > 9 ? "9+" : count}` : "?"}</div>
      <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: 16, opacity: 0.9 }}>{label}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.18)", borderRadius: 50, padding: "10px 20px", fontSize: "0.84rem", fontWeight: 700 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Passer Premium
      </div>
    </div>
  );
}
