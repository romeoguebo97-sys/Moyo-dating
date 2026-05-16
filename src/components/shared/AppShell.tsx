import React, { useState, useEffect, useRef } from "react";
// ── Auto-extracted from monolith ──

function AppShell({ children, tab, setTab, unreadCount, notifCount, likesReceived, viewsReceived, auth, adminBadgeCount }: { children: React.ReactNode; tab: string; setTab: (t: string) => void; unreadCount: number; notifCount: number; likesReceived: number; viewsReceived: number; auth: Auth; adminBadgeCount?: number; }) {
  const [showGuide, setShowGuide] = useState(false);
  const [openGuideSection, setOpenGuideSection] = useState<number | null>(null);
  const [showBot, setShowBot] = useState(false);

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
      label: "Vus",
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

  return <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: G.creme, boxShadow: "0 0 60px rgba(44,26,14,0.12)" }}>
    <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.blanc, borderBottom: `1px solid ${G.gris}`, position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, zIndex: 100, boxSizing: "border-box" }}>
      <div style={{ marginLeft: 4, fontSize: "1.6rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginRight: 4 }}>
        {auth.isAdmin && (
          <div onClick={() => openAdminPanel(() => setTab("admin"))} style={{ display: "flex", alignItems: "center", gap: 5, background: G.rouge, color: G.blanc, borderRadius: 50, padding: "5px 12px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
            <span>⚙️ Admin</span>
            {adminBadgeCount && adminBadgeCount > 0 ? (
              <span style={{ background: G.blanc, color: G.rouge, borderRadius: 50, fontSize: "0.62rem", fontWeight: 800, padding: "1px 6px", lineHeight: 1.6, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                {adminBadgeCount > 99 ? "99+" : adminBadgeCount}
              </span>
            ) : null}
          </div>
        )}
        <div onClick={() => setShowGuide(true)} style={{ fontSize: "0.75rem", fontWeight: 700, color: G.blanc, background: G.rouge, borderRadius: 50, padding: "6px 14px", cursor: "pointer", letterSpacing: "0.02em" }}>Guide</div>
        <div onClick={() => setShowBot(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: G.vert, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(26,92,58,0.35)", flexShrink: 0 }} title="Assistant Moyo">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
            <path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/>
            <line x1="8" y1="21" x2="8" y2="19"/>
            <line x1="16" y1="21" x2="16" y2="19"/>
            <circle cx="9" cy="11" r="1" fill="white"/>
            <circle cx="15" cy="11" r="1" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 75, paddingTop: 48 }}>{children}</div>

    {/* Bot Widget */}
    {showBot && <BotWidget onClose={() => setShowBot(false)} auth={auth} />}

    {/* ── NAVBAR BAS STYLE TINDER (6 onglets) ── */}
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, background: G.blanc, borderTop: `1px solid #eee`, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "6px 4px 14px", zIndex: 50 }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative", flex: 1 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "5px 8px", borderRadius: 12,
              background: active ? "rgba(192,57,43,0.1)" : "transparent",
              transition: "background 0.2s",
              minWidth: 48,
            }}>
              <div style={{ position: "relative" }}>
                {t.icon(active)}
                {/* Badge messages */}
                {t.id === "messages" && unreadCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
                {/* Badge likes reçus */}
                {t.id === "likes" && likesReceived > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {likesReceived > 9 ? "9+" : likesReceived}
                  </div>
                )}
                {/* Badge visiteurs */}
                {t.id === "visitors" && viewsReceived > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.or, color: "#111", borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {viewsReceived > 9 ? "9+" : viewsReceived}
                  </div>
                )}
                {/* Badge matchs */}
                {t.id === "matches" && notifCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "0.56rem", fontWeight: 700, color: active ? G.rouge : "#bbb", whiteSpace: "nowrap" }}>
                {t.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
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
            { title: "Découvrir des profils", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, items: ["L'onglet Découvrir affiche les profils en mode carte ou en liste. En vue carte, utilisez les flèches pour naviguer et le cœur pour liker.", "Chaque profil affiche un badge Femme ou Homme pour identifier clairement le genre.", "Compte gratuit : 5 likes par jour. Premium : likes illimités. Filtres disponibles : genre, ville, âge (18-99), religion.", "Moyo est réservé aux rencontres hétérosexuelles uniquement.", "Seuls les membres Premium génèrent des vues sur les profils qu'ils consultent. Les non-premium peuvent naviguer sans laisser de trace."] },
            { title: "Matchs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, items: ["Un match se crée automatiquement quand deux personnes se likent mutuellement.", "Sur chaque match, appuyez sur les 3 traits pour accéder aux options : Voir le profil, Envoyer un message, Bloquer ou Annuler le match.", "Annuler un match supprime la conversation, les likes mutuels et les vues. Comme si vous ne vous étiez jamais matchés.", "Avec Premium, vous pouvez voir exactement qui vous a liké et qui a visité votre profil."] },
            { title: "Messages", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, items: ["Compte gratuit : 3 messages par match. Premium : messages illimités. Chaque conversation affiche son propre badge de messages non lus.", "Chaque message affiche l'heure d'envoi. Avec Premium : coches grises = reçu, coches bleues = lu.", "Un point vert indique que la personne est en ligne. Premium : envoi de photos, offrir Premium via le bouton cadeau.", "Répondre à un message : appuyez longuement sur un message → Répondre. Un bandeau apparaît au-dessus du champ de saisie avec un aperçu du message cité. Appuyez sur ✕ pour annuler.", "Supprimer un message : appuyez longuement → Supprimer pour tous (efface le message pour vous et votre interlocuteur) ou Supprimer pour moi (masque le message uniquement de votre côté).", "Appuyez sur la photo de profil de votre match en haut de la conversation pour voir sa fiche complète.", "Moyo encourage les échanges respectueux et bienveillants. Les mots doux, les compliments sincères et le respect mutuel sont au cœur de notre communauté."] },
            { title: "Mon Profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, items: ["Modifiez votre photo, prénom, âge, ville, religion et bio via l'engrenage. Le bouton visible/invisible permet de disparaître de Découvrir.", "Lors de l'upload de photo, un outil de recadrage s'ouvre : glissez pour repositionner et zoomez pour ajuster. Le rectangle montre la zone visible sur les cartes, le cercle doré montre l'avatar rond.", "Utilisez Voir mon profil pour voir exactement comment les autres vous voient (mode carte et liste).", "Demandez la vérification de votre compte pour obtenir le badge bleu. Gratuit, vérification sous 24h via WhatsApp."] },
            { title: "Bloquer et Signaler", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, items: ["Appuyez sur les 3 traits d'un profil pour accéder aux options. Bloquer fait disparaître le profil définitivement. Signaler envoie un rapport à notre équipe sous 24h.", "Les profils bloqués sont gérables depuis votre Liste noire dans le Profil.", "Moyo dispose d'une modération automatique : les insultes, arnaques et contenus inappropriés sont détectés et bloqués avant envoi. Tout incident est signalé automatiquement à l'équipe."] },
            { title: "Premium - 3 500 FCFA / mois", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, items: ["Avantages : messages illimités, likes illimités, envoi de photos, confirmations de lecture, voir qui vous a liké et visité votre profil, offrir Premium à un match.", "Paiement via MTN MoMo ou Airtel MoMo uniquement. Activation sous 24h. Vous pouvez aussi offrir le Premium à quelqu'un depuis une conversation."] },
            { title: "Likes & Visiteurs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, items: ["Deux onglets séparés dans la barre de navigation : Likes (coeur) et Vus (oeil). Les badges se mettent à jour instantanément.", "En Premium, tu vois les cartes complètes des personnes qui t'ont liké ou visité. Tu peux retirer une carte sans affecter les matchs ni les messages.", "Important : seuls les membres Premium génèrent des vues. Un membre gratuit qui consulte ton profil n'apparaît pas dans tes Vus.", "Si tu unlikes un profil, ton like disparait aussi de sa liste à lui instantanément.", "Vue carte ou liste disponible via le bouton en haut à droite."] },
      { title: "Inviter un ami", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, items: ["Dans Profil, appuyez sur Inviter un ami. Un message pré-rempli s'ouvre via WhatsApp ou le partage natif de votre téléphone.", "Le lien pointe directement vers moyo-congo.com pour que votre ami puisse s'inscrire facilement."] },
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

