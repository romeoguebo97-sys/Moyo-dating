import React, { useState, useRef, useEffect } from "react";
// ── Auto-extracted: PremiumBadge, PremiumModal, carousel ──

  return (
    <div
      aria-label="Profil premium"
      title="Profil premium"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#D4A843",
        borderRadius: "50%",
        width: size,
        height: size,
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="#111" stroke="none" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>
  );

export function Avatar({ url, gender, size = 54, border = false, premium = false }: { url?: string | null; gender?: string; size?: number; border?: boolean; premium?: boolean }) {
  return <div style={{ position: "relative", flexShrink: 0 }}><div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: border ? `3px solid ${G.rouge}` : "none", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45 }}>{url ? <img src={url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (gender === "Femme" ? "👩🏿" : "👨🏿")}</div>{premium && <div style={{ position: "absolute", bottom: -2, right: -2, background: G.or, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", border: `2px solid ${G.blanc}` }}>⭐</div>}</div>;
}

export function PremiumModal({ onClose, reason }: { onClose: () => void; reason: string }) {
  const avantages = [
    { icon: "msg", titre: "Messages illimités", desc: `Discute sans limite (gratuit = ${FREE_LIMITS.messages}/match)` },
    { icon: "phone", titre: "Partage tes coordonnées", desc: "Envoie ton numéro, email librement" },
    { icon: "heart", titre: "Likes illimités", desc: `Like sans limite (gratuit = ${FREE_LIMITS.likes}/jour)` },
    { icon: "eye", titre: "Voir qui t'a liké", desc: "Découvre tes admirateurs secrets" },
    { icon: "star2", titre: "Profil mis en avant", desc: "Apparais en premier dans Découvrir" },
    { icon: "check2", titre: "Messages lus", desc: "Vois quand tes messages ont été lus" },
    { icon: "filter", titre: "Filtres avancés", desc: "Filtre par ville, âge, situation" },
    { icon: "visitors", titre: "Visiteurs du profil", desc: "Vois toutes les personnes qui t'ont consulté" },
    { icon: "verified", titre: "Profil vérifié", desc: "Badge de confiance visible" },
    { icon: "support", titre: "Support prioritaire", desc: "Assistance rapide 7j/7" },
  ];

  const getIcon = (id: string) => {
    const svgs: Record<string, React.ReactElement> = {
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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,#D4A843,#B8922E)`, padding: "14px 20px 20px", position: "relative", flexShrink: 0 }}>
          {/* Ligne fermeture */}
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
          {reason && <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: "0.8rem", color: G.blanc, fontWeight: 600 }}>{reason}</div>}
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", marginTop: 8 }}>MTN MoMo · Airtel Money · Orange Money</div>
        </div>

        {/* Liste avantages - style Guide */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          {avantages.map((a, i) => (
            <div key={a.titre} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${G.gris}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${G.or},#B8922E)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {getIcon(a.icon)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111" }}>{a.titre}</div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 1 }}>{a.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div style={{ padding: "16px 20px 32px", flexShrink: 0 }}>
          <Btn variant="gold" onClick={() => {}} style={{ width: "100%", padding: "16px", fontSize: "1rem", marginBottom: 10 }}>
            Activer Premium - 3 500 FCFA/mois
          </Btn>
          <button onClick={onClose} style={{ width: "100%", fontSize: "0.88rem", color: "#555", cursor: "pointer", fontWeight: 600, padding: "13px", borderRadius: 50, border: `2px solid ${G.gris}`, background: G.blanc, transition: "all 0.2s" }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#999"; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = G.gris; }}>
            Non merci, plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

