import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function AppShell({ children, tab, setTab, unreadCount, notifCount, likesReceived, viewsReceived, auth, adminBadgeCount }: { children: React.ReactNode; tab: string; setTab: (t: string) => void; unreadCount: number; notifCount: number; likesReceived: number; viewsReceived: number; auth: Auth; adminBadgeCount?: number; }) {
  const [showGuide, setShowGuide] = useState(false);
  const [openGuideSection, setOpenGuideSection] = useState<number | null>(null);
  const [showBot, setShowBot] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Écoute les événements fullscreen émis par Discover
  useEffect(() => {
    const handleFullscreen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsFullscreen(!!detail?.active);
    };
    window.addEventListener("moyo-fullscreen", handleFullscreen);
    return () => window.removeEventListener("moyo-fullscreen", handleFullscreen);
  }, []);

  // Réinitialise le fullscreen dès qu'on quitte l'onglet Découvrir
  useEffect(() => {
    if (tab !== "discover") {
      setIsFullscreen(false);
    }
  }, [tab]);

  const tabs = [
    {
      id: "discover",
      label: "Découvrir",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      id: "likes",
      label: "Likes",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      id: "visitors",
      label: "Vues",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3" fill={active ? G.rouge : "none"}/>
        </svg>
      ),
    },
    {
      id: "matches",
      label: "Matchs",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none"/>
          <circle cx="9" cy="7" r="4" fill="none"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      id: "messages",
      label: "Messages",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4" fill={active ? G.rouge : "none"}/>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const handleGuide = () => setShowGuide(true);
    const handleBot = () => setShowBot(true);
    window.addEventListener("moyo-show-guide", handleGuide);
    window.addEventListener("moyo-show-bot", handleBot);
    return () => {
      window.removeEventListener("moyo-show-guide", handleGuide);
      window.removeEventListener("moyo-show-bot", handleBot);
    };
  }, []);

  const screenWidth = useWindowWidth();
  const isDesktop = screenWidth >= 1024;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isWide = screenWidth >= 768;

  return <div data-active-tab={tab} style={{ maxWidth: isWide ? "none" : 500, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: isWide ? "row" : "column", background: isWide ? "#EAEDF2" : G.creme, boxShadow: isWide ? "none" : "0 0 60px rgba(44,26,14,0.12)" }}>
    <style>{`
      .moyo-footer-hidden { transform: translateX(-50%) translateY(100%) !important; transition: transform 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
      .moyo-footer-visible { transform: translateX(-50%) translateY(0) !important; transition: transform 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
      .moyo-sidebar { width: 220px; min-width: 220px; background: ${G.blanc}; border-right: 1px solid ${G.gris}; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; box-shadow: 2px 0 16px rgba(44,26,14,0.06); z-index: 100; }
      .moyo-sidebar-logo { padding: 20px 18px 16px; border-bottom: 1px solid ${G.gris}; display: flex; align-items: center; justify-content: space-between; }
      .moyo-sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
      .moyo-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: all 0.15s; position: relative; font-weight: 600; font-size: 0.83rem; color: #666; }
      .moyo-nav-item:hover { background: ${G.creme}; color: ${G.brun}; }
      .moyo-nav-item.active { background: rgba(192,57,43,0.08); color: ${G.rouge}; }
      .moyo-nav-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: #F5F5F7; flex-shrink: 0; }
      .moyo-nav-item.active .moyo-nav-icon { background: rgba(192,57,43,0.1); }
      .moyo-nav-badge { position: absolute; right: 10px; border-radius: 50px; font-size: 0.58rem; font-weight: 800; padding: 2px 6px; }
      .moyo-nav-badge-red { background: ${G.rouge}; color: white; }
      .moyo-nav-badge-gold { background: ${G.or}; color: #111; }
      .moyo-sidebar-bottom { padding: 12px 14px; border-top: 1px solid ${G.gris}; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.15s; }
      .moyo-sidebar-bottom:hover { background: ${G.creme}; }
      .moyo-main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; height: 100vh; overflow: hidden; }
      .moyo-topbar-wide { padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; background: ${G.blanc}; border-bottom: 1px solid ${G.gris}; flex-shrink: 0; }
      .moyo-content-wide { flex: 1; overflow-y: auto; padding-bottom: 0; }
    `}</style>

    {/* ── SIDEBAR (desktop/tablette) ── */}
    {isWide && (
      <div className="moyo-sidebar">
        <div className="moyo-sidebar-logo">
          <div style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: G.rouge }}>Mo</span><span style={{ color: G.or }}>yo</span>
          </div>
        </div>
        <nav className="moyo-sidebar-nav">
          {tabs.map(t => {
            const active = tab === t.id;
            const getBadge = () => {
              if (t.id === "messages" && unreadCount > 0) return <span className="moyo-nav-badge moyo-nav-badge-red">{unreadCount > 9 ? "9+" : unreadCount}</span>;
              if (t.id === "likes" && likesReceived > 0) return <span className="moyo-nav-badge moyo-nav-badge-red">{likesReceived > 9 ? "9+" : likesReceived}</span>;
              if (t.id === "visitors" && viewsReceived > 0) return <span className="moyo-nav-badge moyo-nav-badge-gold">{viewsReceived > 9 ? "9+" : viewsReceived}</span>;
              if (t.id === "matches" && notifCount > 0) return <span className="moyo-nav-badge moyo-nav-badge-red">{notifCount > 9 ? "9+" : notifCount}</span>;
              return null;
            };
            return (
              <div key={t.id} className={`moyo-nav-item${active ? " active" : ""}`} onClick={() => { setIsFullscreen(false); setTab(t.id); }}>
                <div className="moyo-nav-icon">{t.icon(active)}</div>
                {t.label}
                {getBadge()}
              </div>
            );
          })}
        </nav>
        {/* Admin juste au-dessus du bloc profil */}
        {auth.isAdmin && (
          <div className="moyo-nav-item" onClick={() => openAdminPanel(() => setTab("admin"))} style={{ margin: "0 10px 4px", borderRadius: 12 }}>
            <div className="moyo-nav-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            Admin
            {adminBadgeCount && adminBadgeCount > 0 ? <span className="moyo-nav-badge moyo-nav-badge-red">{adminBadgeCount > 99 ? "99+" : adminBadgeCount}</span> : null}
          </div>
        )}
        <div className="moyo-sidebar-bottom">
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${G.or},#8B6914)`, display: "flex", alignItems: "center", justifyContent: "center", color: G.blanc, fontSize: "0.65rem", fontWeight: 800, flexShrink: 0, border: `2px solid ${G.or}` }}>
            {auth.name?.slice(0, 2).toUpperCase() || "MO"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.83rem", color: G.brun }}>{auth.name}</div>
            <div style={{ fontSize: "0.62rem", color: G.or, fontWeight: 600, marginTop: 1 }}>{auth.isPremium ? "⭐ Premium actif" : "Gratuit"}</div>
          </div>
        </div>
      </div>
    )}

    {/* ── ZONE PRINCIPALE ── */}
    {isWide ? (
      <div className="moyo-main-area">
        <div className="moyo-content-wide">{children}</div>
      </div>
    ) : (
      <>
        {/* Header mobile */}
        <div style={{ padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.blanc, borderBottom: `1px solid ${G.gris}`, position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, zIndex: 100, boxSizing: "border-box" }}>
          <div style={{ marginLeft: 4, fontSize: "1.6rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginRight: 4 }}>
            {auth.isAdmin && (
              <div onClick={() => openAdminPanel(() => setTab("admin"))} style={{ display: "flex", alignItems: "center", gap: 5, background: G.rouge, color: G.blanc, borderRadius: 50, padding: "5px 12px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                <span>⚙️ Admin</span>
                {adminBadgeCount && adminBadgeCount > 0 ? <span style={{ background: G.blanc, color: G.rouge, borderRadius: 50, fontSize: "0.62rem", fontWeight: 800, padding: "1px 6px", lineHeight: 1.6 }}>{adminBadgeCount > 99 ? "99+" : adminBadgeCount}</span> : null}
              </div>
            )}
            <div onClick={() => setShowGuide(true)} style={{ fontSize: "0.75rem", fontWeight: 700, color: G.blanc, background: G.rouge, borderRadius: 50, padding: "6px 14px", cursor: "pointer", letterSpacing: "0.02em" }}>Guide</div>
            <div onClick={() => setShowBot(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: G.vert, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(26,92,58,0.35)", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/><line x1="8" y1="21" x2="8" y2="19"/><line x1="16" y1="21" x2="16" y2="19"/><circle cx="9" cy="11" r="1" fill="white"/><circle cx="15" cy="11" r="1" fill="white"/></svg>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: isFullscreen ? 0 : 71, paddingTop: 45, transition: "padding-bottom 0.35s cubic-bezier(0.4,0,0.2,1)" }}>{children}</div>
        {/* Footer mobile */}
        <div className={isFullscreen ? "moyo-footer-hidden" : "moyo-footer-visible"} style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, background: G.blanc, borderTop: `1px solid #eee`, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "5px 4px 13px", zIndex: 50 }}>
          {tabs.map(t => {
            const active = tab === t.id;
            return (
              <div key={t.id} onClick={() => { setIsFullscreen(false); setTab(t.id); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "5px 8px", borderRadius: 12, background: active ? "rgba(192,57,43,0.1)" : "transparent", transition: "background 0.2s", minWidth: 48 }}>
                  <div style={{ position: "relative" }}>
                    {t.icon(active)}
                    {t.id === "messages" && unreadCount > 0 && <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>{unreadCount > 9 ? "9+" : unreadCount}</div>}
                    {t.id === "likes" && likesReceived > 0 && <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>{likesReceived > 9 ? "9+" : likesReceived}</div>}
                    {t.id === "visitors" && viewsReceived > 0 && <div style={{ position: "absolute", top: -4, right: -6, background: G.or, color: "#111", borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>{viewsReceived > 9 ? "9+" : viewsReceived}</div>}
                    {t.id === "matches" && notifCount > 0 && <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>{notifCount > 9 ? "9+" : notifCount}</div>}
                  </div>
                  <div style={{ fontSize: "0.56rem", fontWeight: 700, color: active ? G.rouge : "#bbb", whiteSpace: "nowrap" }}>{t.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}

    {/* Bot Widget */}
    {showBot && <BotWidget onClose={() => setShowBot(false)} auth={auth} />}
    {showGuide && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 12px" }}>
      <div style={{ background: G.blanc, borderRadius: 20, width: "100%", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "24px 20px", position: "relative" }}>
          <div onClick={() => setShowGuide(false)} style={{ position: "absolute", top: 14, right: 16, cursor: "pointer", opacity: 0.8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div style={{ fontSize: "1.6rem", color: G.blanc, fontWeight: 800 }}>Guide <span style={{ color: G.or }}>Moyo</span></div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", marginTop: 4 }}>Tout ce que vous devez savoir</div>
        </div>
        {/* Accordéon */}
        <div style={{ padding: "8px 0" }}>
          {[
            { title: "Découvrir des profils", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, items: [
              "Sur ordinateur et tablette, l'application s'affiche en plein écran avec une barre de navigation sur la gauche (Découvrir, Likes, Vues, Matchs, Messages, Profil, Admin). Sur mobile, la navigation reste en bas de l'écran.",
              "L'onglet Découvrir propose 3 modes d'affichage : Vue carte (swipe), Vue liste et Plein écran. Sur ordinateur, les modes et les filtres sont dans le panneau à droite de la carte.",
              "En mode Plein écran, la carte prend toute la hauteur de l'écran pour une immersion maximale. Sur ordinateur, les panneaux latéraux restent visibles avec un effet de verre flouté.",
              "Les profils défilent en boucle continue — vous parcourez tous les membres disponibles avant de revenir au premier. Aucun profil ne se répète avant que vous ayez tout vu.",
              "Vous pouvez voir le profil complet de n'importe quel utilisateur gratuitement en appuyant sur les 3 traits (☰) de sa carte puis 'Voir le profil'.",
              "Compte gratuit : 5 likes par jour. Le compteur ❤️ X/5 s'affiche en haut à côté de 'Découvrir' et se met à jour en temps réel. Premium : likes illimités, pas de compteur.",
              "Filtres disponibles : genre, ville, âge (18-99), religion.",
              "Moyo est réservé aux rencontres hétérosexuelles uniquement.",
              "Seuls les membres Premium génèrent des vues sur les profils qu'ils consultent. Les non-premium peuvent naviguer sans laisser de trace.",
            ]},
            { title: "Menu ☰ — Options sur un profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>, items: [
              "Appuyez une seule fois sur le bouton ☰ d'une carte pour ouvrir le menu. Fonctionne au premier tap sur tous les appareils (iPhone, Android, tablette, ordinateur).",
              "Le menu s'ouvre depuis le bas de l'écran avec l'avatar et le nom du profil concerné.",
              "3 options disponibles : Voir le profil (gratuit pour tous), Bloquer (retire définitivement le profil de votre Découvrir), Signaler (envoie un rapport à notre équipe).",
              "Le menu fonctionne sur chaque profil indépendamment en mode carte, liste et plein écran.",
            ]},
            { title: "Matchs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, items: ["Un match se crée automatiquement quand deux personnes se likent mutuellement.", "Sur chaque match, appuyez sur les 3 traits pour accéder aux options : Voir le profil, Envoyer un message, Bloquer ou Annuler le match.", "Annuler un match supprime la conversation, les likes mutuels et les vues. Comme si vous ne vous étiez jamais matchés.", "Avec Premium, vous pouvez voir exactement qui vous a liké et qui a visité votre profil."] },
            { title: "Messages", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, items: ["Compte gratuit : 3 messages par match. Premium : messages illimités. Chaque conversation affiche son propre badge de messages non lus.", "Chaque message affiche l'heure d'envoi. Avec Premium : coches grises = reçu, coches bleues = lu.", "Un point vert indique que la personne est en ligne. Premium : envoi de photos, offrir Premium via le bouton cadeau.", "Répondre à un message : appuyez longuement sur un message → Répondre. Un bandeau apparaît au-dessus du champ de saisie avec un aperçu du message cité. Appuyez sur ✕ pour annuler.", "Supprimer un message : appuyez longuement → Supprimer pour tous (efface le message pour vous et votre interlocuteur) ou Supprimer pour moi (masque le message uniquement de votre côté).", "Appuyez sur la photo de profil de votre match en haut de la conversation pour voir sa fiche complète.", "Moyo encourage les échanges respectueux et bienveillants. Les mots doux, les compliments sincères et le respect mutuel sont au cœur de notre communauté."] },
            { title: "Mon Profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, items: ["Modifiez votre photo, prénom, âge, ville, religion et bio via l'engrenage. Le bouton visible/invisible permet de disparaître de Découvrir.", "Lors de l'upload de photo, un outil de recadrage s'ouvre : glissez pour repositionner et zoomez pour ajuster. Le rectangle montre la zone visible sur les cartes, le cercle doré montre l'avatar rond.", "Utilisez Voir mon profil pour voir exactement comment les autres vous voient (mode carte et liste).", "Demandez la vérification de votre compte pour obtenir le badge bleu. Gratuit, vérification sous 24h via WhatsApp."] },
            { title: "Bloquer et Signaler", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, items: ["Appuyez sur les 3 traits d'un profil pour accéder aux options. Bloquer fait disparaître le profil définitivement. Signaler envoie un rapport à notre équipe sous 24h.", "Les profils bloqués sont gérables depuis votre Liste noire dans le Profil.", "Moyo dispose d'une modération automatique : les insultes, arnaques et contenus inappropriés sont détectés et bloqués avant envoi. Tout incident est signalé automatiquement à l'équipe."] },
            { title: "Premium - 3 500 FCFA / mois", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, items: [
              "Avantages : messages illimités, likes illimités, envoi de photos, confirmations de lecture, voir qui vous a liké et visité votre profil, offrir Premium à un match.",
              "Paiement via MTN Mobile Money ou Airtel Money - les deux opérateurs sont disponibles.",
              "Comment payer : appuyez sur 'Passer Premium' → choisissez MTN Mobile Money → appuyez sur le bouton jaune pour composer automatiquement le code de paiement sur votre téléphone → validez le paiement → entrez le numéro de transaction reçu par SMS → appuyez sur 'J'ai payé'.",
              "Le numéro de transaction (ID) est reçu par SMS de votre opérateur après validation du paiement (ex: 7753031542 pour Airtel, 7753031542 pour MTN). Entrez-le exactement tel quel dans le champ prévu.",
              "L'activation Premium est manuelle par notre équipe. Délai : quelques minutes à 24h. Vous recevrez une notification dans l'application dès l'activation.",
              "Après activation, déconnectez-vous et reconnectez-vous pour que les changements prennent effet. Le bouton Premium sur votre page Profil devient doré et affiche le compteur de jours restants.",
              "Vous pouvez aussi offrir le Premium à quelqu'un depuis une conversation (bouton cadeau, réservé aux membres Premium).",
            ]},
            { title: "Parrainage — 7 jours offerts", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, items: [
              "Le parrainage est notre programme de récompense : parrainez vos amis et gagnez des jours Premium gratuits.",
              "Comment parrainer : allez sur votre page Profil → appuyez sur le bouton vert 'Parrainer un ami' → partagez votre lien unique par WhatsApp, SMS ou tout autre canal.",
              "Récompense : pour chaque ami qui s'inscrit via votre lien ET passe Premium, vous gagnez automatiquement 7 jours Premium offerts sur votre compte.",
              "Les 7 jours sont ajoutés à votre Premium actuel ou démarrent immédiatement si vous n'êtes pas abonné.",
              "Pas de limite : plus vous parrainez, plus vous cumulez. 3 filleuls Premium = 21 jours offerts.",
              "Votre lien de parrainage est unique et permanent, disponible depuis votre page Profil.",
            ]},
            { title: "Statuts", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, items: [
              "Les statuts sont réservés aux membres Premium. Ils apparaissent en haut de l'onglet Messages.",
              "Pour publier un statut : appuyez sur votre avatar dans la barre des statuts en haut de l'onglet Messages → choisissez une photo (photos uniquement).",
              "Chaque membre Premium peut publier jusqu'à 2 photos actives en même temps sur 24h.",
              "Les statuts expirent automatiquement après 24h. Vous pouvez aussi supprimer un statut manuellement.",
              "Appuyez sur le statut d'un autre membre pour le voir en plein écran.",
              "Sur votre propre statut, appuyez sur le compteur Vues ou Likes pour voir exactement qui a vu ou aimé votre statut.",
            ]},
            { title: "Messagerie", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, items: [
              "Sur ordinateur et tablette, la messagerie s'affiche en deux colonnes : la liste de vos conversations à gauche, et le chat actif à droite. Cliquez sur une conversation pour l'ouvrir sans quitter la liste.",
              "Sur mobile, le comportement reste identique : appuyez sur une conversation pour l'ouvrir en plein écran.",
              "Les statuts apparaissent en haut de la colonne gauche (ou en haut de l'écran sur mobile).",
            ]},
            { title: "Profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, items: [
              "Sur ordinateur et tablette, votre page Profil s'affiche en deux colonnes 50/50 : le menu à gauche, le contenu à droite. Cliquez sur un item du menu pour afficher son contenu à droite sans quitter la page.",
              "Menu disponible : Mon profil, Modifier mon profil, Modifier ma photo, Premium, Parrainer un ami, Vérification, Profil visible/invisible, Liste noire, Mode sombre, Noter l'application, Voir mon profil, Inviter un ami, Se déconnecter, Supprimer mon compte.",
              "Sur mobile, tout s'affiche verticalement dans une seule colonne, comme avant.",
            ]},
            { title: "Likes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, items: [
              "L'onglet Likes (coeur) affiche les profils qui vous ont liké. Le badge rouge se met à jour en temps réel.",
              "En Premium, vous voyez les cartes complètes des personnes qui vous ont liké. En gratuit, vous voyez uniquement le compteur.",
              "Cliquez sur un profil pour le voir en détail et liker en retour — ce qui crée un match automatiquement.",
              "Si vous retirez un like, il disparait aussi de la liste de l'autre personne instantanément.",
            ]},
            { title: "Vues", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>, items: [
              "L'onglet Vues (oeil) affiche les profils qui ont visité votre profil. Le badge se met à jour en temps réel.",
              "En Premium, vous voyez les cartes complètes des personnes qui ont consulté votre profil.",
              "Important : seuls les membres Premium génèrent des vues. Un membre gratuit qui consulte votre profil n'apparait pas dans vos Vues.",
              "Vue carte ou liste disponible via le bouton en haut à droite.",
            ]},
      { title: "Mode sombre", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>, items: ["Dans Profil, utilisez le bouton Mode clair/sombre pour basculer entre les deux thèmes. Votre choix est mémorisé automatiquement.", "Le mode sombre s'applique à toutes les pages sauf la page d'accueil."] },
      { title: "Sécurité et confidentialité", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, items: ["Moyo est réservé aux personnes majeures de 18 ans et plus.", "La modération automatique bloque les insultes, menaces, arnaques et contenus inappropriés avant envoi. Le message ne part pas, un avertissement s'affiche, et un signalement est automatiquement transmis à notre équipe.", "Si votre comportement enfreint les règles, un administrateur peut vous envoyer un avertissement officiel. Une notification apparaît à votre prochaine connexion. Après plusieurs avertissements, le compte peut être banni.", "Pour supprimer votre compte, rendez-vous dans Profil puis Supprimer mon compte. Cette action est définitive et irréversible."] },
      { title: "Assistant Moyo", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/></svg>, items: ["L'icône verte en forme de robot à côté du bouton Guide ouvre l'Assistant Moyo.", "Il propose deux options : Besoin d'aide (répond instantanément à vos questions sur l'app) et Signaler un problème (comportement abusif, arnaque, harcèlement).", "Les signalements sont traités par notre équipe sous 24h."] },
          ].map((s, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${G.gris}` }}>
              <div onClick={() => setOpenGuideSection(openGuideSection === i ? null : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: openGuideSection === i ? "rgba(192,57,43,0.03)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: openGuideSection === i ? G.rouge : G.gris, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: openGuideSection === i ? G.blanc : "#555" }}>
                    {s.icon}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "0.92rem", color: openGuideSection === i ? G.rouge : G.brun }}>{s.title}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openGuideSection === i ? G.rouge : "#bbb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: openGuideSection === i ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {openGuideSection === i && (
                <div style={{ padding: "4px 20px 16px" }}>
                  {s.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: j < s.items.length - 1 ? `1px solid ${G.gris}` : "none" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.rouge, flexShrink: 0, marginTop: 6 }} />
                      <p style={{ fontSize: "0.83rem", color: "#555", lineHeight: 1.6, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Contact */}
          <div style={{ background: "#f8f8f8", borderRadius: 14, padding: "16px", textAlign: "center", margin: "12px 16px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1a1a", marginBottom: 4 }}>Un problème ou une question ?</div>
            <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: 14, lineHeight: 1.5 }}>Notre équipe est disponible pour vous aider.</p>
            <button onClick={() => { setShowGuide(false); setShowBot(true); }} style={{ display: "inline-block", background: G.rouge, color: G.blanc, borderRadius: 50, padding: "10px 24px", fontSize: "0.85rem", fontWeight: 700, border: "none", cursor: "pointer" }}>Contacter notre équipe</button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

