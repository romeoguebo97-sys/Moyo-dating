import React, { useEffect } from "react";
import { G } from "../../constants/styles";
import { Btn } from "./Btn";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST — Notification temporaire (5s) en haut de l'écran
// ─────────────────────────────────────────────────────────────────────────────

interface ToastProps {
  msg: string;
  type?: "success" | "error" | "premium";
  onClose: () => void;
}

export function Toast({ msg, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, []);

  const bg =
    type === "error"   ? "#e74c3c" :
    type === "premium" ? `linear-gradient(135deg,${G.or},#B8860B)` :
    G.vert;

  const icon = type === "error" ? "❌" : type === "premium" ? "⭐" : "✅";

  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: bg, color: type === "premium" ? G.brun : G.blanc,
      padding: "12px 22px", borderRadius: 50, fontSize: "0.85rem",
      fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      maxWidth: "88vw", textAlign: "center",
    }}>
      {icon} {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MODAL — Modale d'erreur générique
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorModalProps {
  msg: string;
  onClose: () => void;
}

export function ErrorModal({ msg, onClose }: ErrorModalProps) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <p style={{ fontSize: "0.88rem", color: "#111", lineHeight: 1.6, marginBottom: 22, fontWeight: 500 }}>{msg}</p>
        <Btn variant="primary" onClick={onClose} style={{ width: "100%" }}>OK</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERATION MODAL — Avertissement après un message bloqué
// ─────────────────────────────────────────────────────────────────────────────

type ModerationType = "insult" | "scam" | "sexual";

interface ModerationModalProps {
  type: ModerationType;
  onClose: () => void;
}

const MODERATION_CONFIG: Record<ModerationType, { icon: string; text: string }> = {
  insult: {
    icon: "🚫",
    text: "Ce message contient des termes irrespectueux. Sur MOYO, nous encourageons le respect et la bienveillance ❤️",
  },
  scam: {
    icon: "⚠️",
    text: "Ce message contient des éléments suspects (demande d'argent, arnaque). Ce comportement est interdit sur MOYO ❤️",
  },
  sexual: {
    icon: "🔒",
    text: "Ce message contient du contenu inapproprié. Sur MOYO, nous encourageons le respect et la bienveillance ❤️",
  },
};

export function ModerationModal({ type, onClose }: ModerationModalProps) {
  const { icon, text } = MODERATION_CONFIG[type];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: G.blanc, borderRadius: 24, width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 24px 64px rgba(44,26,14,0.18)", overflow: "hidden", animation: "fadeUp 0.25s ease" }}>
        <div style={{ background: "linear-gradient(135deg, #fff5f5, #ffe8e8)", padding: "24px 20px 16px" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>{icon}</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: G.rouge, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Avertissement
          </div>
        </div>
        <div style={{ padding: "16px 24px 22px" }}>
          <p style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.65, marginBottom: 20, fontWeight: 400 }}>
            {text}
          </p>
          <button
            onClick={onClose}
            style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc, border: "none", borderRadius: 50, padding: "13px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", boxShadow: "0 4px 14px rgba(192,57,43,0.3)" }}
          >
            OK, J'AI COMPRIS
          </button>
        </div>
      </div>
    </div>
  );
}
