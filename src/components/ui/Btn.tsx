import React from "react";
import { G } from "../../constants/styles";

// ─────────────────────────────────────────────────────────────────────────────
// BTN — Bouton réutilisable avec variantes et état loading
// ─────────────────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "gold" | "outline" | "ghost" | "danger" | "white";

interface BtnProps {
  children: React.ReactNode;
  variant?: BtnVariant;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
}

const VARIANT_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.3)" },
  gold:    { background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111" },
  outline: { background: "transparent", color: "#111", border: `2px solid ${G.brun}` },
  ghost:   { background: "rgba(44,26,14,0.06)", color: "#111" },
  danger:  { background: "#e74c3c", color: G.blanc },
  white:   { background: G.blanc, color: G.rouge },
};

const SpinnerIcon = () => (
  <svg
    width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: "pulse 0.8s ease-in-out infinite" }}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export function Btn({
  children,
  variant = "primary",
  onClick,
  style = {},
  disabled = false,
  loading = false,
}: BtnProps) {
  const isDisabled = disabled || loading;

  const base: React.CSSProperties = {
    border: "none",
    borderRadius: 50,
    padding: "13px 28px",
    fontWeight: 600,
    fontSize: "0.93rem",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.65 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.18s ease",
    ...VARIANT_STYLES[variant],
    ...style,
  };

  return (
    <button style={base} onClick={onClick} disabled={isDisabled}>
      {loading ? <SpinnerIcon /> : children}
    </button>
  );
}
