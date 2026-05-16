import React from "react";
import { G } from "../../constants/styles";

// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED BADGE — Coche bleue Twitter-like
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeSizeProps {
  size?: number;
}

export function VerifiedBadge({ size = 16 }: BadgeSizeProps) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "#1d9bf0", borderRadius: "50%",
      width: size, height: size, flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM BADGE — Étoile dorée pour les profils premium
// ─────────────────────────────────────────────────────────────────────────────

export function PremiumBadge({ size = 16 }: BadgeSizeProps) {
  return (
    <div
      aria-label="Profil premium"
      title="Profil premium"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "#D4A843", borderRadius: "50%",
        width: size, height: size, flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="#111" stroke="none" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR — Photo de profil circulaire avec indicateur premium
// ─────────────────────────────────────────────────────────────────────────────

interface AvatarProps {
  url?: string | null;
  gender?: string;
  size?: number;
  border?: boolean;
  premium?: boolean;
}

export function Avatar({ url, gender, size = 54, border = false, premium = false }: AvatarProps) {
  const defaultEmoji = gender === "Femme" ? "👩🏿" : "👨🏿";

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: border ? `3px solid ${G.rouge}` : "none",
        background: "linear-gradient(160deg,#E8C5A0,#C47A4A)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.45,
      }}>
        {url
          ? <img src={url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : defaultEmoji
        }
      </div>
      {premium && (
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          background: G.or, borderRadius: "50%",
          width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.6rem", border: `2px solid ${G.blanc}`,
        }}>
          ⭐
        </div>
      )}
    </div>
  );
}
