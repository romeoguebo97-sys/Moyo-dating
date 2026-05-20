import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function PremiumModal({ onClose, reason, userId, token }: { onClose: () => void; reason: string; userId: string; token: string }) {
  const [step, setStep] = useState<"offer" | "mtn" | "airtel" | "proof">("offer");
  const [txRef, setTxRef] = useState("");
  const [txSent, setTxSent] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  const avantages = [
    { icon: "msg", titre: "Messages illimités", desc: `Discute sans limite (gratuit = ${FREE_LIMITS.messages}/match)` },
    { icon: "heart", titre: "Likes illimités", desc: `Like sans limite (gratuit = ${FREE_LIMITS.likes}/jour)` },
    { icon: "eye", titre: "Voir qui t'a liké", desc: "Découvre tous tes admirateurs secrets" },
    { icon: "visitors", titre: "Voir qui a visité ton profil", desc: "Accède à la liste complète de tes Vues" },
    { icon: "photo", titre: "Envoi de photos", desc: "Partage des photos dans tes conversations" },
    { icon: "status", titre: "Publier des statuts", desc: "Partage jusqu'à 2 photos visibles 24h" },
    { icon: "star2", titre: "Profil mis en avant", desc: "Apparais en premier dans Découvrir" },
    { icon: "check2", titre: "Messages lus", desc: "Vois quand tes messages ont été lus" },
    { icon: "filter", titre: "Filtres avancés", desc: "Filtre par ville, âge, religion" },
    { icon: "phone", titre: "Partage tes coordonnées", desc: "Envoie ton numéro ou email librement" },
    { icon: "gift", titre: "Offrir Premium", desc: "Offre 1 mois de Premium à un match" },
    { icon: "referral", titre: "Parrainer & gagner", desc: "+7 jours offerts pour chaque ami abonné" },
    { icon: "verified", titre: "Profil vérifié", desc: "Badge de confiance visible sur ton profil" },
    { icon: "support", titre: "Support prioritaire", desc: "Assistance rapide 7j/7" },
  ];

  const getIcon = (id: string) => {
    const svgs: Record<string, React.ReactElement> = {
      photo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
      status: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      gift: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
      referral: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      msg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6.06 6.06l1.09-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      star: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      star2: <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      check2: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
      filter: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
      visitors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      verified: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      support: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    };
    return svgs[id] || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
  };

  // ── Étape offre ──
  if (step === "offer") return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg,#D4A843,#B8922E)`, padding: "14px 20px 20px", position: "relative", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <div onClick={onClose} style={{ cursor: "pointer", opacity: 0.85, background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem", fontWeight: 600 }}>Passe à</div>
              <div style={{ color: G.blanc, fontSize: "1.3rem", fontWeight: 800 }}>Premium</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: G.blanc, fontSize: "1.6rem", fontWeight: 800 }}>3 500 FCFA</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem" }}>/mois</div>
            </div>
          </div>
          {reason && <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: "0.8rem", color: G.blanc, fontWeight: 600, marginBottom: 12 }}>{reason}</div>}
          {/* Boutons opérateurs dans le header */}
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Payez avec</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("mtn")} style={{ flex: 1, background: "linear-gradient(135deg,#FFCC00,#F5A623)", color: "#1a1a1a", border: "none", borderRadius: 14, padding: "12px 10px", fontSize: "0.88rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
              <svg viewBox="0 0 120 60" width="36" height="18" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="60" fill="#FFCC00" rx="4"/><ellipse cx="60" cy="30" rx="52" ry="24" fill="none" stroke="#1a1a1a" strokeWidth="4"/><text x="60" y="38" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="22" fill="#1a1a1a">MTN</text></svg>
              MTN MoMo
            </button>
            <button onClick={() => setStep("airtel")} style={{ flex: 1, background: "white", color: "#c0392b", border: "2px solid #e74c3c", borderRadius: 14, padding: "12px 10px", fontSize: "0.88rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg viewBox="0 0 80 60" width="28" height="21" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="60" fill="white" rx="4"/><path d="M12 38 Q8 18 22 12 Q36 6 38 20 Q40 34 28 36 Q16 38 14 30" fill="#e74c3c" stroke="none"/><text x="44" y="28" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="#e74c3c">airtel</text><text x="44" y="44" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="#D4A843">money</text></svg>
              Airtel Money
            </button>
          </div>
        </div>
        <div style={{ padding: "8px 0", flex: 1 }}>
          {avantages.map((a) => (
            <div key={a.titre} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${G.gris}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${G.or},#B8922E)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{getIcon(a.icon)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111" }}>{a.titre}</div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 1 }}>{a.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px 32px", flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: "100%", fontSize: "0.88rem", color: "#555", cursor: "pointer", fontWeight: 600, padding: "13px", borderRadius: 50, border: `2px solid ${G.gris}`, background: G.blanc }}>
            Non merci, plus tard
          </button>
        </div>
      </div>
    </div>
  );

  // ── Étape MTN ──
  if (step === "mtn") return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ background: "linear-gradient(135deg,#FFCC00,#F5A623)", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div onClick={() => setStep("offer")} style={{ cursor: "pointer", background: "rgba(0,0,0,0.1)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1a1a1a", display: "flex", alignItems: "center", gap: 10 }}>
              <svg viewBox="0 0 120 60" width="48" height="24" xmlns="http://www.w3.org/2000/svg">
                <rect width="120" height="60" fill="#FFCC00" rx="4"/>
                <ellipse cx="60" cy="30" rx="52" ry="24" fill="none" stroke="#1a1a1a" strokeWidth="4"/>
                <text x="60" y="38" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="22" fill="#1a1a1a">MTN</text>
              </svg>
              MTN Mobile Money
            </div>
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.6)", marginLeft: 42 }}>Paiement sécurisé - 3 500 FCFA / 1 mois</div>
        </div>
        <div style={{ padding: "20px 20px 32px" }}>
          {/* Étape 1 */}
          <div style={{ background: "#fffbf0", border: "2px solid #FFCC00", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#F5A623", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>① Effectuez votre paiement MTN Mobile Money, qui sera reçu et traité par notre Responsable des finances : Juste-Emmanuelle AKOUMOU ISSOMBO</div>
            <a href="tel:*105*2*1*065132012*3500%23" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "linear-gradient(135deg,#FFCC00,#F5A623)", color: "#1a1a1a", border: "none", borderRadius: 50, padding: "15px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", textDecoration: "none", boxShadow: "0 4px 14px rgba(245,166,35,0.35)", boxSizing: "border-box" as any }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6.06 6.06l1.09-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Appuyer pour payer - 3 500 FCFA
            </a>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.78rem", color: "#888", fontFamily: "monospace", letterSpacing: 1 }}>*105*1*1*065132012*3500#</div>
          </div>
          {/* Étape 2 */}
          <div style={{ background: G.creme, borderRadius: 14, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>② Entrez votre numéro de transaction</div>
            <div style={{ fontSize: "0.78rem", color: "#777", marginBottom: 10, lineHeight: 1.5 }}>Après validation du paiement MTN, vous recevrez un SMS avec un numéro de transaction (ID). Entrez ce numéro ID ci-dessous.</div>
            <input value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="Ex de l'ID : 7753031542" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `2px solid ${txRef ? "#FFCC00" : G.gris}`, fontSize: "0.9rem", outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          </div>
          {/* Bouton envoyer */}
          {!txSent ? (
            <button disabled={!txRef.trim() || txLoading} onClick={async () => {
              setTxLoading(true);
              try {
                await fetch(`${SUPABASE_URL}/rest/v1/payment_requests`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=representation" },
                  body: JSON.stringify({ user_id: userId, operator: "MTN", tx_ref: txRef.trim(), amount: 3500, status: "pending" }),
                });
                setTxSent(true);
              } catch { setTxSent(true); }
              setTxLoading(false);
            }} style={{ width: "100%", background: !txRef.trim() || txLoading ? "#ccc" : "linear-gradient(135deg,#FFCC00,#F5A623)", color: "#1a1a1a", border: "none", borderRadius: 50, padding: "15px", fontSize: "0.95rem", fontWeight: 800, cursor: !txRef.trim() ? "not-allowed" : "pointer", boxShadow: txRef.trim() ? "0 4px 14px rgba(245,166,35,0.35)" : "none" }}>
              {txLoading ? "Envoi en cours…" : "✓ J'ai payé - Envoyer la preuve"}
            </button>
          ) : (
            <div style={{ background: "rgba(39,174,96,0.08)", border: "2px solid #27ae60", borderRadius: 14, padding: "18px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#27ae60", marginBottom: 6 }}>Preuve envoyée avec succès !</div>
              <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>Notre équipe va vérifier votre paiement et activer votre Premium dans les plus brefs délais. Vous recevrez une notification dès l'activation.</div>
              <button onClick={onClose} style={{ marginTop: 14, background: "#27ae60", color: G.blanc, border: "none", borderRadius: 50, padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}>Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Étape Airtel ──
  if (step === "airtel") return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ background: "linear-gradient(135deg,#e74c3c,#c0392b)", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div onClick={() => setStep("offer")} style={{ cursor: "pointer", background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: G.blanc, display: "flex", alignItems: "center", gap: 8 }}>
              <svg viewBox="0 0 80 60" width="42" height="28" xmlns="http://www.w3.org/2000/svg">
                <rect width="80" height="60" fill="rgba(255,255,255,0.15)" rx="4"/>
                <path d="M12 38 Q8 18 22 12 Q36 6 38 20 Q40 34 28 36 Q16 38 14 30" fill="white" stroke="none"/>
                <text x="44" y="28" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="white">airtel</text>
                <text x="44" y="44" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" fill="#D4A843">money</text>
              </svg>
              Airtel Money
            </div>
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", marginLeft: 42 }}>3 500 FCFA - 1 mois Premium</div>
        </div>
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ background: "#fff5f5", border: "2px solid #e74c3c", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#e74c3c", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>① Effectuez votre paiement Airtel Money, qui sera reçu et traité par notre Responsable des finances : THEOPHILE BEAUGARD LIBALI</div>
            <a href="tel:*128*2*1*1*056230067*3500%23" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "linear-gradient(135deg,#e74c3c,#c0392b)", color: G.blanc, border: "none", borderRadius: 50, padding: "15px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", textDecoration: "none", boxShadow: "0 4px 14px rgba(231,76,60,0.35)", boxSizing: "border-box" as any }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6.06 6.06l1.09-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Appuyer pour payer - 3 500 FCFA
            </a>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.78rem", color: "#888", fontFamily: "monospace", letterSpacing: 1 }}>*128*2*1*1*056230067*3500#</div>
          </div>
          <div style={{ background: G.creme, borderRadius: 14, padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>② Entrez votre numéro de transaction</div>
            <div style={{ fontSize: "0.78rem", color: "#777", marginBottom: 10, lineHeight: 1.5 }}>Après validation du paiement Airtel, vous recevrez un SMS avec un numéro de transaction (ID). Entrez ce numéro ID ci-dessous.</div>
            <input value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="Ex de l'ID : 7753031542" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `2px solid ${txRef ? "#e74c3c" : G.gris}`, fontSize: "0.9rem", outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          </div>
          {!txSent ? (
            <button disabled={!txRef.trim() || txLoading} onClick={async () => {
              setTxLoading(true);
              try {
                await fetch(`${SUPABASE_URL}/rest/v1/payment_requests`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Prefer": "return=representation" },
                  body: JSON.stringify({ user_id: userId, operator: "Airtel", tx_ref: txRef.trim(), amount: 3500, status: "pending" }),
                });
                setTxSent(true);
              } catch { setTxSent(true); }
              setTxLoading(false);
            }} style={{ width: "100%", background: !txRef.trim() || txLoading ? "#ccc" : "linear-gradient(135deg,#e74c3c,#c0392b)", color: G.blanc, border: "none", borderRadius: 50, padding: "15px", fontSize: "0.95rem", fontWeight: 800, cursor: !txRef.trim() ? "not-allowed" : "pointer", boxShadow: txRef.trim() ? "0 4px 14px rgba(231,76,60,0.35)" : "none" }}>
              {txLoading ? "Envoi en cours…" : "✓ J'ai payé - Envoyer la preuve"}
            </button>
          ) : (
            <div style={{ background: "rgba(39,174,96,0.08)", border: "2px solid #27ae60", borderRadius: 14, padding: "18px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#27ae60", marginBottom: 6 }}>Preuve envoyée avec succès !</div>
              <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>Notre équipe va vérifier votre paiement et activer votre Premium dans les plus brefs délais. Vous recevrez une notification dès l'activation.</div>
              <button onClick={onClose} style={{ marginTop: 14, background: "#27ae60", color: G.blanc, border: "none", borderRadius: 50, padding: "12px 28px", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}>Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return null;
}

