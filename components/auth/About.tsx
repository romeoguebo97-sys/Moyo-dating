import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function About({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: G.creme }}>
      {/* Header vert */}
      <div style={{ background: `linear-gradient(160deg,${G.vert},#0D2E1C)`, padding: "24px 24px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(192,57,43,0.4)", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem", fontWeight: 600 }}>Retour</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", color: G.blanc, fontWeight: 700, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>Le premier site de rencontres congolais</p>
        </div>
      </div>

      <div style={{ padding: "0 20px 60px", maxWidth: 600, margin: "0 auto" }}>
        {/* Notre mission */}
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginTop: -20, boxShadow: "0 8px 32px rgba(44,26,14,0.1)", marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 10 }}>Notre mission</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#555" }}>
            <strong>Moyo</strong> (qui signifie "cœur" en swahili) est le premier site de rencontres dédié aux Congolais. Notre mission est simple : créer des rencontres sincères et durables entre Congolais, qu'ils soient au pays ou dans la diaspora.
          </p>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#555", marginTop: 10 }}>
            Nous croyons que chaque Congolais mérite de trouver l'amour dans un espace sûr, respectueux et adapté à notre culture et nos valeurs.
          </p>
        </div>

        {/* Nous contacter */}
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6.06 6.06l1.09-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>Restons connectés</h2>
          <a href="https://facebook.com/MoyoCongoOfficiel" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#1877F2", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>Rejoins-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Facebook - Page Moyo Congo</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://www.tiktok.com/@moyo_congo" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#111111", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", fontWeight: 500 }}>Suis-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>TikTok - MOYO Congo</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://www.instagram.com/moyo_congo" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem", fontWeight: 500 }}>Retrouve-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Instagram - MOYO Congo</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://wa.me/242065132012" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#25D366", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>WhatsApp / Téléphone</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>+242 06 513 20 12</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="mailto:contact@moyo-congo.com"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 14, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>Email</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>contact@moyo-congo.com</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        <div style={{ textAlign: "center", color: "#555" }}>
          <p style={{ fontSize: "0.75rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
          <p style={{ fontSize: "0.72rem", marginTop: 4, color: "#555" }}>
            <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#555", textDecoration: "underline" }}>Confidentialité & CGU</a>
            {" · "}
            <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#555", textDecoration: "underline" }}>Mentions légales</a>
            {" · "}
            <span onClick={() => onBack()} style={{ cursor: "pointer", textDecoration: "underline" }}>Contact</span>
          </p>
        </div>
      </div>

    </div>
  );
}

