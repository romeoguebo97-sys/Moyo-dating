import React, { useState } from "react";
import { G } from "../../constants/styles";

// ─────────────────────────────────────────────────────────────────────────────
// INPUT — Champ de formulaire avec icônes, validation et toggle mot de passe
// ─────────────────────────────────────────────────────────────────────────────

type InputIcon = "email" | "lock" | "user" | "cake";

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: InputIcon | string;
  error?: string;
  hint?: string;
}

// ── SVG Icons ──

const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconCake = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
    <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>
    <path d="M2 21h20"/>
    <path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/>
    <path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ICONS: Record<InputIcon, React.ReactNode> = {
  email: <IconEmail />,
  lock:  <IconLock />,
  user:  <IconUser />,
  cake:  <IconCake />,
};

export function Input({
  label, type = "text", value, onChange,
  placeholder, icon, error, hint,
}: InputProps) {
  const [focus, setFocus] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";

  const svgIcon = icon && ICONS[icon as InputIcon]
    ? ICONS[icon as InputIcon]
    : icon ? <span style={{ opacity: 0.5 }}>{icon}</span> : null;

  return (
    <div style={{ marginBottom: 18, width: "100%" }}>
      {label && (
        <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", width: "100%" }}>
        {svgIcon && (
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5, pointerEvents: "none", zIndex: 1, color: "#555", display: "flex" }}>
            {svgIcon}
          </span>
        )}
        <input
          type={isPwd ? (showPwd ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: svgIcon
              ? (isPwd ? "13px 42px 13px 40px" : "13px 14px 13px 40px")
              : (isPwd ? "13px 42px 13px 14px" : "13px 14px"),
            border: `2px solid ${error ? "#e74c3c" : focus ? G.or : G.gris}`,
            borderRadius: 12,
            fontSize: "0.93rem",
            background: G.blanc,
            color: "#111",
            outline: "none",
            transition: "border-color 0.2s",
            display: "block",
          }}
        />
        {isPwd && (
          <span
            onClick={() => setShowPwd((s) => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6, zIndex: 1 }}
          >
            {showPwd ? <IconEyeOff /> : <IconEye />}
          </span>
        )}
      </div>
      {hint && !error && <p style={{ color: "#555", fontSize: "0.75rem", marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}
