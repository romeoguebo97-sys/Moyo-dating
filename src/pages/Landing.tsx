import React, { useState, useEffect, useRef } from "react";
// ── Auto-extracted from monolith ──

export function Landing({ onNav }: { onNav: (p: string) => void }) {
  const NEW_FB = "https://www.facebook.com/share/1HssYavG19/?mibextid=wwXIfr";
  const svgFb = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  const svgIg = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  const svgTk = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>;
  const svgWa = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  const [showLandingMenu, setShowLandingMenu] = useState(false);
  const [openMenuSection, setOpenMenuSection] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingComment, setRatingComment] = useState("");
  const isMobile = useWindowWidth() < 768;
  const toggleSection = (s: string) => setOpenMenuSection(prev => prev === s ? null : s);

  const landingMenuSections = [
    { id: "conseils", title: "Conseils pour bien rencontrer", emoji: "💡", items: [
      { icon: "camera", titre: "Mets une vraie photo", desc: "Les profils avec une photo reçoivent 5x plus de messages. Utilise une photo récente et souriante." },
      { icon: "edit", titre: "Remplis bien ta bio", desc: "Parle de tes passions, tes valeurs. Une bio sincère attire les bonnes personnes." },
      { icon: "chat", titre: "Prends le temps de discuter", desc: "Ne te précipite pas. Apprends à connaître la personne avant de proposer une rencontre." },
      { icon: "lock2", titre: "Protège tes informations", desc: "Ne partage pas ton numéro trop vite. Vérifie que la personne est sérieuse." },
      { icon: "alert", titre: "Signale les faux profils", desc: "Si tu suspectes une arnaque, utilise le bouton Signaler. Tu protèges toute la communauté." },
      { icon: "handshake", titre: "Sois respectueux(se)", desc: "Traite les autres comme tu voudrais être traité(e)." },
    ]},
    { id: "services", title: "Nos services", emoji: "🌟", items: [
      { icon: "hearts", titre: "Rencontres en ligne", desc: "Trouve ton âme sœur parmi des profils vérifiés.", badge: "Gratuit" },
      { icon: "star2", titre: "Abonnement Premium", desc: "Likes illimités, messages illimités, voir qui t'a liké.", badge: "3 500 FCFA/mois" },
      { icon: "ring", titre: "Accompagnement mariage", desc: "Nous t'accompagnons dans l'organisation de ta cérémonie congolaise.", badge: "Sur demande" },
      { icon: "vip", titre: "Mise en relation VIP", desc: "Service personnalisé et discret dans ta recherche de l'âme sœur.", badge: "Premium" },
    ]},
    { id: "mariage", title: "Accompagnement mariage", emoji: "💍", items: [
      { icon: "✓", titre: "Organisation du mariage traditionnel et civil", desc: "Possibilité de préfinancement" },
      { icon: "✓", titre: "Coordination de la cérémonie traditionnelle", desc: "" },
      { icon: "✓", titre: "Mise en relation avec des prestataires congolais", desc: "" },
      { icon: "✓", titre: "Accompagnement pour les couples diaspora/Congo", desc: "" },
    ]},
    { id: "temoignages", title: "Témoignages", emoji: "💬", items: [
      { icon: "couple", titre: "Fatou & Rodrigue - Paris · Brazza", desc: "On s'est rencontrés sur Moyo en janvier. Aujourd'hui on est fiancés ! Merci Moyo 💕" },
      { icon: "star3", titre: "Céleste - Diaspora Belgique", desc: "Enfin une appli faite pour nous ! J'ai trouvé quelqu'un de sérieux en 2 semaines." },
{ icon: "thumbup", titre: "Patrick - Pointe-Noire", desc: "Simple, propre, efficace. Exactement ce qu'il fallait pour la diaspora congolaise." },
    ]},
    { id: "faq", title: "Questions fréquentes", emoji: "❓", items: [
      { icon: "Q", titre: "Moyo est-il gratuit ?", desc: "Oui, l'inscription est gratuite. 5 likes/jour et 3 messages/match. Premium à 3 500 FCFA/mois." },
      { icon: "Q", titre: "Comment annuler un match ?", desc: "Dans Matchs, appuyez sur les 3 traits → Annuler le match. La conversation, les likes et les vues sont supprimés. L'autre personne n'est pas notifiée." },
      { icon: "Q", titre: "Comment offrir le Premium ?", desc: "Dans une conversation, le bouton cadeau apparait uniquement si vous êtes Premium. Vous pouvez offrir le Premium à votre partenaire non-premium." },
      { icon: "Q", titre: "Comment obtenir le badge vérifié ?", desc: "Profil → Faire vérifier mon compte → WhatsApp. Gratuit, vérification sous 24h." },
      { icon: "Q", titre: "Comment inviter un ami ?", desc: "Dans Profil, appuyez sur Inviter un ami. Un message pré-rempli s'ouvre sur WhatsApp ou le partage natif." },
      { icon: "Q", titre: "Comment activer le mode sombre ?", desc: "Dans Profil, utilisez le bouton Mode clair/sombre pour basculer entre les deux thèmes." },
      { icon: "Q", titre: "Comment rendre mon profil invisible ?", desc: "Dans Profil, activez le bouton Profil invisible. Vous disparaissez de Découvrir sans supprimer votre compte." },
      { icon: "Q", titre: "Pourquoi je ne vois pas mon profil dans Découvrir ?", desc: "Votre profil doit être complet jusqu'à la dernière étape de l'inscription pour apparaître dans Découvrir. Vérifiez aussi que votre profil est bien visible dans les paramètres." },
      { icon: "Q", titre: "À quoi servent les onglets Likes et Vus ?", desc: "Deux onglets séparés : Likes (personnes qui vous ont liké) et Vus (personnes qui ont visité votre profil). Tout le monde voit le compteur. Premium requis pour voir les cartes et l'identité des personnes. Vous pouvez retirer une carte sans affecter les matchs." },
      { icon: "Q", titre: "Qui apparaît dans mes Vus ?", desc: "Uniquement les membres Premium qui ont consulté votre profil. Les membres gratuits ne génèrent pas de vues et n'apparaissent pas dans votre liste Vus." },
      { icon: "Q", titre: "Si je unlike quelqu'un, que se passe-t-il ?", desc: "Le like disparait des deux côtés instantanément. Si vous aviez un match, la conversation et tous les messages sont supprimés." },
      { icon: "Q", titre: "Que se passe-t-il si j'envoie un message irrespectueux ?", desc: "Moyo bloque automatiquement les insultes, menaces, arnaques et contenus inappropriés avant envoi. Le message ne part pas, un avertissement s'affiche, et un signalement automatique est envoyé à notre équipe. Les comportements répétés entraînent la suppression du compte." },
      { icon: "Q", titre: "Comment réagir à un message ?", desc: "Appuyez longuement sur un message pour ouvrir le menu de réactions (👍 ❤️ 😂 😮 😢 🙏). Une seule réaction par message est autorisée : choisir une nouvelle réaction remplace automatiquement la précédente." },
      { icon: "Q", titre: "Comment contacter l'assistance Moyo ?", desc: "Appuyez sur l'icône verte (Assistant Moyo) à côté du bouton Guide. Vous pouvez poser vos questions ou signaler un problème directement depuis l'app." },
      { icon: "Q", titre: "Puis-je voir le profil de quelqu'un depuis les messages ?", desc: "Oui. Dans une conversation, appuyez sur la photo de profil de votre match en haut de l'écran pour voir sa fiche complète." },
      { icon: "Q", titre: "Comment répondre à un message précis ?", desc: "Appuyez longuement sur le message → Répondre. Un bandeau s'affiche au-dessus du champ de saisie avec un aperçu du message cité. Appuyez sur ✕ pour annuler la réponse." },
      { icon: "Q", titre: "Comment supprimer un message ?", desc: "Appuyez longuement sur le message → Supprimer pour tous (efface le message des deux côtés) ou Supprimer pour moi (masque le message uniquement de votre côté, sans affecter l'autre personne)." },
      { icon: "Q", titre: "Que se passe-t-il si je reçois un avertissement ?", desc: "Une notification officielle MOYO apparaît à votre prochaine connexion. Elle détaille le motif. Vous devez cliquer \"OK, j\'ai compris\" pour continuer à utiliser l'application. Plusieurs avertissements peuvent entraîner la suspension du compte." },
    ]},
    { id: "securite", title: "Sécurité & Confidentialité", emoji: "🔒", items: [
      { icon: "shield", titre: "Données sécurisées", desc: "Vos informations sont hébergées de manière sécurisée et ne sont jamais partagées avec des tiers." },
      { icon: "eyeoff", titre: "Profil invisible", desc: "Rendez votre profil invisible depuis vos paramètres sans supprimer votre compte." },
      { icon: "block", titre: "Blocage utilisateur", desc: "Bloquez n'importe quel utilisateur d'un simple clic." },
      { icon: "adult", titre: "Majorité requise", desc: "Moyo est strictement réservé aux personnes de 18 ans et plus." },
    ]},
    { id: "confidentialite", title: "Confidentialité & CGU", emoji: "📋", items: [
      { icon: "shield", titre: "Responsable du traitement", desc: "Romeo GUEBO - contact : contact@moyo-congo.com" },
      { icon: "lock2", titre: "Données collectées", desc: "Nom, e-mail, photos, messages, données de connexion et abonnement. Utilisées uniquement pour le fonctionnement de Moyo." },
      { icon: "lock2", titre: "Conservation & sécurité", desc: "Données conservées le temps nécessaire au service. Aucune revente. Prestataires techniques liés à l'hébergement uniquement." },
      { icon: "verified", titre: "Vos droits (RGPD)", desc: "Accès, modification et suppression de vos données sur demande à contact@moyo-congo.com" },
      { icon: "chat", titre: "CGU - Utilisation", desc: "Moyo est réservé aux majeurs. Tout comportement frauduleux, haineux ou abusif entraîne la suppression du compte." },
      { icon: "alert", titre: "Contenus interdits", desc: "Faux profils, harcèlement, contenus illégaux, tentatives d'arnaque ou usurpation d'identité sont strictement interdits." },
      { icon: "star2", titre: "Premium & paiement", desc: "Certaines fonctionnalités sont accessibles via abonnement. Paiements via prestataires sécurisés (MTN MoMo, Airtel Money)." },
    ]},
    { id: "mentions", title: "Mentions légales", emoji: "⚖️", items: [
      { icon: "user", titre: "Éditeur du site", desc: "Romeo GUEBO - contact@moyo-congo.com" },
      { icon: "shield", titre: "Propriété intellectuelle", desc: "Tous les contenus, visuels et logos de Moyo sont protégés. Toute reproduction sans autorisation est interdite." },
      { icon: "verified", titre: "Droit applicable", desc: "Les présentes conditions sont régies par le droit français. Tout litige relève des tribunaux compétents." },
      { icon: "chat", titre: "Contact", desc: "Pour toute question légale : contact@moyo-congo.com" },
    ]},
    { id: "notation", title: "Noter Moyo", emoji: "⭐", items: [] },
  ];

  return (
    <div style={{ minHeight: "100vh", background: G.creme, overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ── */}
      <nav style={{ background: G.blanc, boxShadow: "0 2px 16px rgba(44,26,14,0.07)", flexShrink: 0, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div className="nav-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: "1.9rem", color: G.rouge, fontWeight: 700, letterSpacing: "-0.03em", display: "inline-flex", alignItems: "baseline", gap: 0 }}>
            <span>Mo</span><span style={{ color: G.or }}>yo</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span onClick={() => onNav("about")}
              style={{ fontSize: "0.6rem", fontWeight: 700, color: "#111", cursor: "pointer", width: 80, height: 46, borderRadius: 10, border: `2px solid ${G.brun}`, background: "transparent", transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.05em" }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = G.vert; el.style.color = G.blanc; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 16px rgba(44,26,14,0.2)"; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = G.brun; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            >À PROPOS</span>
            {/* Bouton MENU */}
            <div onClick={() => setShowLandingMenu(true)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", background: "transparent", border: `2px solid ${G.brun}`, borderRadius: 10, width: 80, height: 46, transition: "all 0.2s" }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = G.vert; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 18px rgba(26,92,58,0.4)"; const lines = el.querySelectorAll(".menu-line"); lines.forEach((l: any) => l.style.background = G.blanc); const label = el.querySelector(".menu-label") as HTMLElement; if(label) label.style.color = G.blanc; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; const lines = el.querySelectorAll(".menu-line"); lines.forEach((l: any) => l.style.background = G.brun); const label = el.querySelector(".menu-label") as HTMLElement; if(label) label.style.color = G.brun; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            >
              {[0,1,2].map(i => <div key={i} className="menu-line" style={{ width: 18, height: 2, borderRadius: 2, background: G.brun }} />)}
              <span className="menu-label" style={{ color: "#111", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em", marginTop: 1 }}>MENU</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MENU PANEL ACCORDÉON ── */}
      {showLandingMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}>
          <div onClick={() => setShowLandingMenu(false)} style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: "85%", maxWidth: 360, background: G.blanc, height: "100%", overflowY: "auto", boxShadow: "-8px 0 32px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            {/* Header vert */}
            <div style={{ background: `linear-gradient(160deg,${G.vert},#0D2E1C)`, padding: "24px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ color: G.blanc, fontSize: "1.1rem", fontWeight: 700 }}>Menu</div>
              <div onClick={() => setShowLandingMenu(false)} style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}>✕</div>
            </div>
            <div style={{ padding: "8px 0", flex: 1 }}>
              {landingMenuSections.map(s => (
                <div key={s.id} style={{ borderBottom: `1px solid ${G.gris}` }}>
                  <div onClick={() => toggleSection(s.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: openMenuSection === s.id ? "rgba(26,92,58,0.05)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Icône SVG par section */}
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: openMenuSection === s.id ? `linear-gradient(135deg,${G.vert},#0D4020)` : G.gris, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {s.id === "conseils" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4l3 3"/></svg>}
                        {s.id === "services" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                        {s.id === "mariage" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                        {s.id === "temoignages" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        {s.id === "faq" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                        {s.id === "securite" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                        {s.id === "confidentialite" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                        {s.id === "mentions" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                        {s.id === "notation" && <svg width="16" height="16" viewBox="0 0 24 24" fill={openMenuSection === s.id ? "white" : "#555"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "0.92rem", color: openMenuSection === s.id ? G.vert : G.brun }}>{s.title}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? G.vert : "#bbb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: openMenuSection === s.id ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {openMenuSection === s.id && (
                    <div style={{ padding: "4px 20px 16px" }}>
                      {s.id === "notation" ? (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                          {ratingSubmitted ? (
                            <div>
                              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
                              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: 4 }}>Merci pour ton avis !</div>
                              <div style={{ fontSize: "0.82rem", color: "#555" }}>Tu as noté Moyo {userRating}/5 étoiles</div>
                              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
                                {[1,2,3,4,5].map(s => (
                                  <svg key={s} width="24" height="24" viewBox="0 0 24 24" fill={s <= userRating ? G.or : "#ddd"} stroke="none">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", marginBottom: 4 }}>Comment tu trouves Moyo ?</div>
                              <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: 16 }}>Ton avis nous aide à améliorer la plateforme</div>
                              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                                {[1,2,3,4,5].map(star => (
                                  <div key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setUserRating(star)}
                                    style={{ cursor: "pointer", transform: (hoverRating || userRating) >= star ? "scale(1.2)" : "scale(1)", transition: "transform 0.15s" }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill={(hoverRating || userRating) >= star ? G.or : "#ddd"} stroke="none">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                  </div>
                                ))}
                              </div>
                              {userRating > 0 && <>
                                <textarea
                                  value={ratingComment}
                                  onChange={e => setRatingComment(e.target.value)}
                                  placeholder="Laisse un commentaire (optionnel)..."
                                  rows={3}
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid #ddd`, fontSize: "0.82rem", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 10 }}
                                />
                                <button onClick={() => setRatingSubmitted(true)} style={{ width: "100%", background: G.rouge, color: G.blanc, border: "none", borderRadius: 50, padding: "11px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
                                  Envoyer mon avis
                                </button>
                              </>}
                            </div>
                          )}
                        </div>
                      ) : s.id === "faq" ? (
                        s.items.map((item, i) => (
                          <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${G.gris}` }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                              <div style={{ background: G.rouge, color: G.blanc, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q</div>
                              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111" }}>{item.titre}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <div style={{ background: G.or, color: "#111", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>R</div>
                              <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>{item.desc}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        s.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${G.gris}` }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(26,92,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {(() => {
                                const menuIcons: Record<string, React.ReactElement> = {
                                  camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
                                  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                                  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                                  lock2: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                                  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                                  handshake: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                                  hearts: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                                  star2: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                                  ring: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>,
                                  vip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                                  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                                  eyeoff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
                                  block: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
                                  adult: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                                  star3: <svg width="14" height="14" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                                  thumbup: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
                                  couple: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                                };
                                return menuIcons[item.icon] || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
                              })()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 2, color: "#111" }}>{item.titre}</div>
                              {item.desc && <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5 }}>{item.desc}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(150deg,#F2F2F0 0%,#EEEEEC 60%,rgba(26,92,58,0.08) 100%)`, overflow: "hidden", position: "relative", paddingTop: 72 }}>

        {/* ── PHOTOS ARRIÈRE-PLAN style Tinder ── */}
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 4, opacity: 0.35, zIndex: 0, pointerEvents: "none" }}>
          {[
            "/bg1.webp",
            "/bg2.webp",
            "/bg3.webp",
            "/bg4.webp",
            "/bg5.webp",
            "/bg6.webp",
            "/bg7.webp",
            "/bg8.webp",
            "/bg9.webp",
            "/bg10.webp",
            "/bg11.webp",
            "/bg12.webp",
          ].map((url, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(100%)" }} />
            </div>
          ))}
        </div>

        {/* Overlay dégradé pour lisibilité */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg,rgba(242,242,240,0.82) 0%,rgba(238,238,236,0.75) 50%,rgba(26,92,58,0.15) 100%)`, zIndex: 1, pointerEvents: "none" }} />

        {/* Cercles déco supprimés pour ne pas cacher les photos */}

        <div className="landing-hero" style={{ padding: "52px 24px 0", textAlign: "center", alignItems: "flex-end", position: "relative", zIndex: 2 }}>

          {/* ── Texte gauche ── */}
          <div className="landing-hero-text fu1" style={{ paddingBottom: 52 }} id="hero-text-block">
            <div style={{ display: "inline-block", background: G.blanc, border: `2px solid #111`, padding: "7px 20px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 22, color: "#111", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              Site de rencontres Congolais
            </div>
            <h1 className="fu2" style={{ fontSize: "clamp(2.4rem,5.5vw,3.8rem)", lineHeight: 1.08, fontWeight: 700, marginBottom: 20, color: "#111" }}>
              Trouve ton{" "}
              <span className="heart" style={{ color: G.rouge, fontStyle: "italic" }}>âme sœur</span>
              <br />au Congo
            </h1>
            <p className="fu3" style={{ fontSize: "1rem", lineHeight: 1.8, color: "#555", marginBottom: 36, maxWidth: 440, width: "100%" }}>
              Moyo connecte les Congolais à la recherche d'une relation sincère et durable.
              Brazzaville, Pointe-Noire, Dolisie et toute la diaspora.
            </p>
            <div className="fu4 landing-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 4 }}>
              <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 36px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.35)", cursor: "pointer" }}>
                Créer mon compte gratuit
              </button>
              <button className="btn-o" onClick={() => onNav("login")} style={{ border: "2px solid #1a1a1a", borderRadius: 50, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", background: G.blanc, color: "#1a1a1a", cursor: "pointer", marginTop: 6 }}>
                Me connecter
              </button>
            </div>

            {/* ── Téléphones visibles sur MOBILE ── */}
            <div className="fu5" style={{ display: "block", position: "relative", margin: "0 auto", maxWidth: 340 }} id="hero-img-mobile">
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, height: 240 }}>
                {/* Téléphone gauche */}
                <div style={{ width: 90, height: 180, borderRadius: 16, background: "linear-gradient(160deg,#2C1A0E,#5C3A1E)", border: "3px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 12px 32px rgba(44,26,14,0.25)", flexShrink: 0, transform: "rotate(-8deg) translateY(20px)" }}>
                  <div style={{ background: G.rouge, padding: "4px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.45rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                  </div>
                  <div style={{ height: 100, overflow: "hidden", position: "relative" }}>
                    <img src="/phone-femme.webp" alt="Sandrine" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  </div>
                  <div style={{ padding: "4px 6px" }}>
                    <div style={{ fontSize: "0.42rem", fontWeight: 700, color: "#111" }}>Sandrine, 27</div>
                    <div style={{ fontSize: "0.35rem", color: "#555" }}>📍 Brazzaville</div>
                    <div style={{ marginTop: 4, background: G.rouge, borderRadius: 50, padding: "2px 6px", textAlign: "center", fontSize: "0.38rem", color: G.blanc, fontWeight: 700 }}>Liker</div>
                  </div>
                </div>
                {/* Téléphone central */}
                <div style={{ width: 112, height: 220, borderRadius: 18, background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: "3px solid rgba(255,255,255,0.2)", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.35)", flexShrink: 0, zIndex: 2 }}>
                  <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "5px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.55rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: G.blanc }}>CG</div>
                  </div>
                  <div style={{ height: 128, overflow: "hidden", position: "relative" }}>
                    <img src="/phone-homme.webp" alt="Romaric" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    <div style={{ position: "absolute", top: 6, right: 6, background: G.rouge, borderRadius: 50, padding: "2px 6px", fontSize: "0.35rem", color: G.blanc, fontWeight: 700 }}>Premium</div>
                  </div>
                  <div style={{ padding: "5px 8px" }}>
                    <div style={{ fontSize: "0.52rem", fontWeight: 700, color: G.blanc }}>Romaric, 30</div>
                    <div style={{ fontSize: "0.4rem", color: "rgba(255,255,255,0.6)" }}>📍 Pointe-Noire</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 5, justifyContent: "center" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem" }}>✕</div>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `rgba(212,168,67,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem" }}>⭐</div>
                    </div>
                  </div>
                </div>
                {/* Téléphone droit */}
                <div style={{ width: 90, height: 180, borderRadius: 16, background: "linear-gradient(160deg,#1a1a2e,#2d2d44)", border: "3px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.25)", flexShrink: 0, transform: "rotate(8deg) translateY(20px)" }}>
                  <div style={{ background: G.brun, padding: "4px 6px" }}>
                    <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.45rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                  </div>
                  <div style={{ padding: "4px 6px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "linear-gradient(160deg,#C47A4A,#8B4513)" }} />
                      <div>
                        <div style={{ fontSize: "0.38rem", fontWeight: 700, color: G.blanc }}>Nouveau match !</div>
                        <div style={{ fontSize: "0.32rem", color: "rgba(255,255,255,0.5)" }}>Junior t'a liké aussi</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 5px", fontSize: "0.32rem", color: "rgba(255,255,255,0.7)" }}>Bonsoir Lionel...</div>
                    <div style={{ marginTop: 2, background: G.rouge, borderRadius: 6, padding: "2px 5px", fontSize: "0.32rem", color: G.blanc, textAlign: "right" }}>Bonsoir ! Comment tu vas ?</div>
                    <div style={{ marginTop: 1, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 5px", fontSize: "0.32rem", color: "rgba(255,255,255,0.7)" }}>Très bien merci !</div>
                    <div style={{ marginTop: 3, background: "rgba(212,168,67,0.2)", border: `1px solid ${G.or}`, borderRadius: 6, padding: "2px 5px", display: "flex", alignItems: "center", gap: 2 }}>
                      <svg width="6" height="6" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize: "0.3rem", color: G.or, fontWeight: 600 }}>Profils vérifiés</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Bulles flottantes mobile */}
              <div style={{ position: "absolute", bottom: 10, right: 0, background: G.blanc, borderRadius: 14, padding: "6px 10px", boxShadow: "0 6px 20px rgba(44,26,14,0.14)", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                <div><div style={{ fontWeight: 800, fontSize: "0.65rem", color: "#111" }}>850+ couples</div><div style={{ fontSize: "0.5rem", color: "#555" }}>formés sur Moyo</div></div>
              </div>
            </div>
          </div>

          {/* ── Composition visuelle hero desktop ── */}
          <div className="fu1" style={{ display: "none", position: "relative", alignSelf: "center", justifyContent: "center" }} id="hero-img-desktop">

            {/* Cercle déco principal */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 440, height: 440, borderRadius: "50%",
              background: `linear-gradient(135deg,rgba(212,168,67,0.12),rgba(26,92,58,0.08))`,
              border: "2px solid rgba(212,168,67,0.3)",
              zIndex: 0,
            }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 350, height: 350, borderRadius: "50%",
              background: "rgba(212,168,67,0.05)",
              zIndex: 0,
            }} />

            {/* Mockup téléphone principal */}
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, height: 500 }}>

              {/* Téléphone gauche - légèrement incliné */}
              <div style={{
                transform: "rotate(-6deg) translateY(20px)",
                width: 160, flexShrink: 0,
              }}>
                <div style={{
                  background: "#1C1A2E",
                  borderRadius: 28,
                  padding: "10px",
                  boxShadow: "0 24px 60px rgba(44,26,14,0.25), 0 0 0 1px rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}>
                  {/* Encoche */}
                  <div style={{ width: 40, height: 8, background: "#0D0B1A", borderRadius: 8, margin: "0 auto 10px" }} />
                  {/* Écran - profil Moyo */}
                  <div style={{ background: G.creme, borderRadius: 20, overflow: "hidden", height: 310 }}>
                    {/* Header app */}
                    <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "14px 12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{  fontSize: "0.9rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                      <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: G.blanc }}>💬</div>
                    </div>
                    {/* Profil card */}
                    <div style={{ padding: "12px 10px" }}>
                      <div style={{ width: "100%", height: 110, borderRadius: 14, overflow: "hidden", marginBottom: 10, position: "relative" }}>
                        <img src="/phone-femme.webp" alt="Sandrine" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        <div style={{ position: "absolute", top: 8, right: 8, background: G.or, borderRadius: 6, padding: "2px 6px", fontSize: "0.45rem", fontWeight: 700, color: "#111" }}>Premium</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.72rem", color: "#111", marginBottom: 2 }}>Sandrine, 27</div>
                      <div style={{ fontSize: "0.6rem", color: "#555", marginBottom: 8 }}>📍 Brazzaville</div>
                      {/* Like button */}
                      <div style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 20, padding: "6px", textAlign: "center", fontSize: "0.6rem", color: G.blanc, fontWeight: 600 }}>❤️ Liker</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Téléphone central - principal, droit */}
              <div style={{ transform: "translateY(-10px)", width: 175, flexShrink: 0, zIndex: 3 }}>
                <div style={{
                  background: "#0D0B1A",
                  borderRadius: 32,
                  padding: "10px",
                  boxShadow: "0 32px 80px rgba(44,26,14,0.3), 0 0 0 1.5px rgba(212,168,67,0.4)",
                  overflow: "hidden",
                }}>
                  <div style={{ width: 44, height: 8, background: "#050408", borderRadius: 8, margin: "0 auto 10px" }} />
                  <div style={{ background: G.blanc, borderRadius: 22, overflow: "hidden", height: 310 }}>
                    {/* Header */}
                    <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "14px 14px 10px", display: "flex", alignItems: "center" }}>
                      <div style={{  fontSize: "1rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                      <div style={{ marginLeft: "auto", fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>🇨🇬</div>
                    </div>
                    {/* Match notification */}
                    <div style={{ background: `linear-gradient(135deg,rgba(192,57,43,0.08),rgba(212,168,67,0.06))`, margin: "10px 10px 0", borderRadius: 12, padding: "10px 10px", border: `1px solid rgba(192,57,43,0.15)` }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: G.rouge, marginBottom: 3 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#C0392B" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Nouveau match !</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "#111", fontWeight: 500 }}>Junior t'a liké aussi</div>
                      </div>
                    </div>
                    {/* Profil principal */}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ width: "100%", height: 120, borderRadius: 14, overflow: "hidden", position: "relative" }}>
                        <img src="/phone-homme.webp" alt="Romaric" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "8px 8px 6px" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.68rem", color: G.blanc }}>Romaric, 30</div>
                          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.8)" }}>📍 Pointe-Noire</div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <div style={{ flex: 1, background: G.gris, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.55rem", color: "#555" }}>✕</div>
                        <div style={{ flex: 2, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.58rem", color: G.blanc, fontWeight: 600 }}>❤️ Liker</div>
                        <div style={{ flex: 1, background: `rgba(212,168,67,0.15)`, border: `1px solid ${G.or}`, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.55rem", color: "#555" }}>⭐</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Téléphone droit - incliné */}
              <div style={{ transform: "rotate(6deg) translateY(20px)", width: 155, flexShrink: 0 }}>
                <div style={{
                  background: "#1C1A2E",
                  borderRadius: 28,
                  padding: "10px",
                  boxShadow: "0 20px 50px rgba(44,26,14,0.2), 0 0 0 1px rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}>
                  <div style={{ width: 38, height: 8, background: "#0D0B1A", borderRadius: 8, margin: "0 auto 10px" }} />
                  <div style={{ background: G.creme, borderRadius: 20, overflow: "hidden", height: 270 }}>
                    <div style={{ background: `linear-gradient(135deg,${G.brun},#5C3A1E)`, padding: "12px 10px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{  fontSize: "0.85rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                    </div>
                    {/* Conversation */}
                    <div style={{ padding: "8px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ alignSelf: "flex-start", background: G.blanc, borderRadius: "10px 10px 10px 2px", padding: "5px 8px", fontSize: "0.55rem", color: "#111", maxWidth: "80%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Bonsoir Lionel 😊</div>
                      <div style={{ alignSelf: "flex-end", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: "10px 10px 2px 10px", padding: "5px 8px", fontSize: "0.55rem", color: G.blanc, maxWidth: "80%" }}>Bonsoir ! Comment tu vas ?</div>
                      <div style={{ alignSelf: "flex-start", background: G.blanc, borderRadius: "10px 10px 10px 2px", padding: "5px 8px", fontSize: "0.55rem", color: "#111", maxWidth: "80%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Très bien merci ❤️</div>
                      <div style={{ fontSize: "0.5rem", color: "#555", textAlign: "center", marginTop: 4 }}>Match depuis 2 jours</div>
                      {/* Input message */}
                      <div style={{ background: G.blanc, borderRadius: 14, padding: "5px 8px", display: "flex", alignItems: "center", gap: 4, border: `1px solid ${G.gris}`, marginTop: 4 }}>
                        <div style={{ flex: 1, fontSize: "0.5rem", color: "#ccc" }}>Un message...</div>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: G.blanc }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bulle 850+ couples */}
            <div style={{ position: "absolute", bottom: 30, right: -20, background: G.blanc, borderRadius: 18, padding: "12px 18px", boxShadow: "0 12px 36px rgba(44,26,14,0.14)", display: "flex", alignItems: "center", gap: 10, zIndex: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>💞</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#111" }}>850+ couples</div>
                <div style={{ fontSize: "0.65rem", color: "#555" }}>formés sur Moyo</div>
              </div>
            </div>
            {/* Bulle 12 000+ */}
            <div style={{ position: "absolute", top: 30, left: -20, background: G.blanc, borderRadius: 18, padding: "10px 14px", boxShadow: "0 10px 30px rgba(44,26,14,0.12)", display: "flex", alignItems: "center", gap: 8, zIndex: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>🇨🇬</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#111" }}>12 000+ membres</div>
                <div style={{ fontSize: "0.62rem", color: "#555" }}>Congo & diaspora</div>
              </div>
            </div>
            {/* Badge vérifiés */}
            <div style={{ position: "absolute", top: 160, right: -20, background: `linear-gradient(135deg,${G.or},#B8860B)`, borderRadius: 50, padding: "6px 14px", boxShadow: "0 6px 20px rgba(212,168,67,0.4)", display: "flex", alignItems: "center", gap: 5, zIndex: 4 }}>
              <span style={{ fontSize: "0.68rem", color: "#111" }}>✓</span>
              <span style={{ fontWeight: 700, fontSize: "0.7rem", color: "#111" }}>Profils vérifiés</span>
            </div>

          </div>
      </div>
      </div>
      <style>{`
        @media(min-width:768px){
          #hero-img-desktop{display:flex!important}
          #hero-img-mobile{display:none!important}
        }
      `}</style>

      {/* ── STATS ── */}
      <div style={{ background: G.blanc, padding: "28px 24px", borderBottom: `1px solid ${G.gris}` }}>
        {/* Phrase déplacée ici */}
        <p style={{ textAlign: "center", color: "#555", fontSize: "0.85rem", marginBottom: 16, marginTop: -8 }}>Chaque jour, de nouveaux couples se forment au Congo et dans la diaspora</p>
        <div className="landing-stats fu5" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          {[
            { target: 12000, suffix: "+", l: "Membres inscrits", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { target: 850, suffix: "+", l: "Couples formés", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            { target: 19, suffix: "", l: "Villes & diasporas", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
          ].map(({ target, suffix, l, svg }) => (
            <StatCounter key={l} target={target} suffix={suffix} label={l} svg={svg} />
          ))}
        </div>
      </div>

      {/* ── CONFIANCE ── */}
      <div style={{ padding: "48px 24px" }}>
        <div className="landing-sections">
          <h2 className="fu2" style={{  fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, textAlign: "center", marginBottom: 8, color: "#111" }}>
            Pourquoi faire confiance à <span style={{ color: G.rouge }}>Moyo</span> ?
          </h2>
          <p style={{ textAlign: "center", color: "#555", fontSize: "0.88rem", marginBottom: 32 }}>
            Une plateforme pensée pour des rencontres sincères et sécurisées
          </p>
          <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { iconBg: G.rouge, titre: "Profils modérés", desc: "Les profils sont surveillés afin de limiter les faux comptes.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { iconBg: G.or, titre: "Signalement rapide", desc: "Signale rapidement un comportement inapproprié.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { iconBg: G.vert, titre: "Communauté congolaise", desc: "Des membres du Congo et de la diaspora.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { iconBg: G.rouge, titre: "Respect & sécurité", desc: "Des échanges sérieux et respectueux.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            ].map(c => (
              <div key={c.titre} className="trust-card" style={{ background: G.blanc, borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 4px 20px rgba(44,26,14,0.07)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{c.svg}</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 8, color: "#111" }}>{c.titre}</div>
                <div style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TÉMOIGNAGES PREMIUM ── */}
      <div style={{ background: `linear-gradient(160deg,${G.blanc} 0%,${G.creme} 100%)`, padding: "64px 24px", overflow: "hidden", position: "relative" }}>
        {/* Déco background */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `rgba(212,168,67,0.1)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `rgba(192,57,43,0.06)`, pointerEvents: "none" }} />
        <div className="landing-sections" style={{ position: "relative", zIndex: 1 }}>
          {/* Header section */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,168,67,0.15)", border: `1px solid ${G.or}`, borderRadius: 50, padding: "6px 18px", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 2 }}>{[0,1,2,3,4].map(i => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              <span style={{ color: "#555", fontSize: "0.75rem", fontWeight: 500 }}>Histoires vraies</span>
            </div>
            <h2 style={{  fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, color: "#111", marginBottom: 10 }}>
              Ils nous ont fait confiance
            </h2>
          </div>
          {/* Cartes témoignages — carrousel automatique */}
          {(() => {
            const temoignages = [
              {
                initiales: "OA",
                noms: "Orlane & Armel",
                lieu: "Diaspora France / Congo",
                since: "Ensemble depuis 2024",
                temoignage: "Même à distance, nous avons réussi à créer une vraie connexion. Moyo nous a donné l'espace pour nous découvrir vraiment avant de se rencontrer.",
                stars: 5,
                accent: G.rouge,
              },
              {
                initiales: "GJ",
                noms: "Grâce & Junior",
                lieu: "Brazzaville",
                since: "Mariage coutumier en préparation",
                temoignage: "On discutait simplement au début… aujourd'hui nous préparons notre mariage coutumier. Moyo nous a mis en contact avec les bonnes personnes.",
                stars: 5,
                accent: G.or,
              },
              {
                initiales: "RL",
                noms: "Ruth & Lionel",
                lieu: "Pointe-Noire",
                since: "En couple depuis 18 mois",
                temoignage: "Après plusieurs déceptions sur d'autres applis, Moyo nous a permis de construire une relation sérieuse. Ici les gens cherchent vraiment l'amour.",
                stars: 5,
                accent: G.vert,
              },
            ];
            const CarouselTesti = () => {
              const [idx, setIdx] = React.useState(0);
              const [anim, setAnim] = React.useState<"in"|"out">("in");
              const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

              const idxRef = React.useRef(0);

              const goTo = React.useCallback((next: number) => {
                setAnim("out");
                setTimeout(() => {
                  idxRef.current = next;
                  setIdx(next);
                  setAnim("in");
                }, 320);
              }, []);

              React.useEffect(() => {
                timerRef.current = setInterval(() => {
                  const next = (idxRef.current + 1) % temoignages.length;
                  goTo(next);
                }, 4000);
                return () => { if (timerRef.current) clearInterval(timerRef.current); };
              }, [goTo]);

              const t = temoignages[idx];
              return (
                <div style={{ position: "relative" }}>
                  <style>{`
                    @keyframes testiIn  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes testiOut { from { opacity: 1; transform: translateY(0); }  to { opacity: 0; transform: translateY(-10px); } }
                    .testi-in  { animation: testiIn  0.32s ease forwards; }
                    .testi-out { animation: testiOut 0.28s ease forwards; }
                  `}</style>

                  {/* Carte */}
                  <div
                    className={anim === "in" ? "testi-in" : "testi-out"}
                    style={{
                      background: G.blanc,
                      border: `1px solid ${G.gris}`,
                      boxShadow: "0 4px 24px rgba(44,26,14,0.07)",
                      borderRadius: 24,
                      padding: "28px 24px",
                      position: "relative",
                      overflow: "hidden",
                      minHeight: 220,
                    }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: t.accent, borderRadius: "24px 0 0 24px" }} />
                    <div style={{ position: "absolute", top: 16, right: 20, fontSize: "5rem", color: "rgba(44,26,14,0.06)", lineHeight: 1, userSelect: "none" as const }}>"</div>
                    <div style={{ display: "flex", gap: 3, marginBottom: 16, paddingLeft: 12 }}>
                      {[...Array(t.stars)].map((_, si) => (
                        <svg key={si} width="13" height="13" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.92rem", color: "#555", lineHeight: 1.8, fontStyle: "italic", marginBottom: 22, paddingLeft: 12 }}>
                      "{t.temoignage}"
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${G.cremeDark},${G.creme})`, border: `2px solid ${t.accent}`, boxShadow: `0 4px 14px rgba(44,26,14,0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111" }}>{t.initiales}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{t.noms}</div>
                        <div style={{ fontSize: "0.72rem", color: "#555", marginTop: 2 }}>{t.lieu}</div>
                        <div style={{ fontSize: "0.7rem", color: t.accent, fontWeight: 600, marginTop: 2 }}>{t.since}</div>
                      </div>
                    </div>
                  </div>

                  {/* Indicateurs dots */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                    {temoignages.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => { if (timerRef.current) clearInterval(timerRef.current); goTo(i); }}
                        style={{
                          width: i === idx ? 22 : 8,
                          height: 8,
                          borderRadius: 50,
                          background: i === idx ? G.rouge : G.gris,
                          cursor: "pointer",
                          transition: "all 0.35s ease",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            };
            return <CarouselTesti />;
          })()}
          {/* CTA sous les témoignages */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "#555", fontSize: "0.82rem", marginBottom: 16 }}>Rejoins des milliers de Congolais qui ont trouvé l'amour</p>
            <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 40px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 8px 28px rgba(192,57,43,0.4)", cursor: "pointer" }}>
              Créer mon profil, c'est gratuit
            </button>
          </div>
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div style={{ padding: "48px 24px", background: `linear-gradient(160deg,${G.creme},rgba(26,92,58,0.06))` }}>
        <div className="landing-sections">
          <h2 style={{  fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, textAlign: "center", marginBottom: 8, color: "#111" }}>
            Comment <span style={{ color: G.rouge }}>ça marche</span> ?
          </h2>
          <p style={{ textAlign: "center", color: "#555", fontSize: "0.88rem", marginBottom: 36 }}>3 étapes simples pour trouver l'amour</p>
          <div className="steps-layout" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { num: "1", iconBg: G.rouge, titre: "Crée ton profil", desc: "Inscris-toi gratuitement et complète ton profil.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { num: "2", iconBg: G.or, titre: "Découvre des célibataires", desc: "Parcours les profils compatibles.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { num: "3", iconBg: G.vert, titre: "Discute après un match", desc: "Échange en toute sécurité après un like mutuel.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            ].map((s, i) => (
              <div key={s.num} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 0", borderBottom: i < 2 ? `1px dashed ${G.gris}` : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 20px rgba(44,26,14,0.15)` }}>{s.svg}</div>
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: G.brun, display: "flex", alignItems: "center", justifyContent: "center", color: G.blanc, fontSize: "0.75rem", fontWeight: 700 }}>{s.num}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111" }}>{s.titre}</div>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL + STORES ── */}
      <div style={{ background: `linear-gradient(135deg,${G.vert},#0D2E1C)`, padding: "48px 24px", textAlign: "center" }}>
        <div className="landing-sections" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 500 }}>L'amour n'attend pas.</p>
          <h2 style={{  fontSize: "clamp(1.6rem,5vw,2.4rem)", fontWeight: 700, color: G.blanc, marginBottom: 28 }}>
            Rejoins <span style={{ color: G.or }}>Moyo</span> aujourd'hui.
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
            <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 36px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.4)", cursor: "pointer" }}>
              Créer mon compte gratuit
            </button>
            <button className="btn-o" onClick={() => onNav("login")} style={{ border: `2px solid rgba(255,255,255,0.6)`, borderRadius: 50, padding: "13px 28px", fontWeight: 600, fontSize: "0.95rem", background: "transparent", color: G.blanc, cursor: "pointer" }}>
              Se connecter
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: 16, fontWeight: 600 }}>Bientôt disponible sur</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div className="store" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: G.blanc, borderRadius: 12, padding: "10px 18px", minWidth: 150, cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.24.99.2l11.47-11.47L12.36 9.2 3.18 23.76zm16.3-12.04L16.6 9.97l-3.23 3.23 3.23 3.23 2.9-1.74c.82-.49.82-1.28-.02-1.97zM3.02.28C2.7.46 2.5.8 2.5 1.25v21.5c0 .44.2.79.52.96l.1.06 12.05-12.05v-.28L3.12.22l-.1.06zm9.34 9.34L3.18.24l-.1.06 9.28 9.32z"/></svg>
              <div><div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Disponible sur</div><div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Google Play</div></div>
            </div>
            <div className="store" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: G.blanc, borderRadius: 12, padding: "10px 18px", minWidth: 150, cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div><div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Télécharger dans</div><div style={{ fontSize: "0.9rem", fontWeight: 700 }}>App Store</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: G.vert, padding: "28px 24px" }}>
        <div className="landing-sections" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href={NEW_FB} target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="Facebook">{svgFb}</a>
            <a href="https://www.instagram.com/moyo_congo" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="Instagram">{svgIg}</a>
            <a href="https://www.tiktok.com/@moyo_congo" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="TikTok">{svgTk}</a>
            <a href="https://wa.me/33753356471" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="WhatsApp +33 07 53 35 64 71">{svgWa}</a>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "À propos", action: () => onNav("about") },
              { label: "Confidentialité & CGU", action: () => { setShowLandingMenu(true); setOpenMenuSection("confidentialite"); } },
              { label: "Mentions légales", action: () => { setShowLandingMenu(true); setOpenMenuSection("mentions"); } },
              { label: "Contact", action: () => onNav("about") },
            ].map(l => (
              <span key={l.label} onClick={l.action} style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", cursor: "pointer", transition: "color 0.2s" }}
                onMouseOver={e => { (e.target as HTMLElement).style.color = G.or; }}
                onMouseOut={e => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
              >{l.label}</span>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>6 rue Paul Valéry, 77000 Melun, France</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}


