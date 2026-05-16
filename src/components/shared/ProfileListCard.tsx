import React, { useState, useEffect, useRef } from "react";
// ── Auto-extracted from monolith ──

function ProfileListCard({ prof, liked, onLike, onBlock, onReport, onView, isPremium }: { prof: Profile; liked: boolean; onLike: () => void; onBlock: () => void; onReport: (r: string) => void; onView?: () => void; isPremium?: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSignalerMenu, setShowSignalerMenu] = useState(false);
  return (
    <div className="profile-card" style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc, borderRadius: 16, padding: "12px", marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
      <div style={{ width: 62, height: 62, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)" }}>
        {prof.photo_url
          ? <img src={prof.photo_url} alt={prof.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 5 }}>{prof.name}, {prof.age} ans {prof.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 3 }}><PremiumBadge size={11} /></span>} {prof.is_verified && <VerifiedBadge size={15} />}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
          <span style={{ background: prof.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: prof.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "1px 8px", fontSize: "0.68rem", fontWeight: 600 }}>{prof.gender === "Femme" ? "Femme" : "Homme"}</span>
          <span style={{ fontSize: "0.78rem", color: "#555" }}>{prof.city}</span>
          {prof.religion && <span style={{ fontSize: "0.72rem", color: "#555" }}>· {prof.religion}</span>}
        </div>
        {prof.bio && <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prof.bio}</div>}
      </div>
      {/* Cœur */}
      <div className="icon-btn" onClick={onLike} style={{ width: 42, height: 42, borderRadius: "50%", background: liked ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : "rgba(192,57,43,0.06)", border: liked ? "none" : `1.5px solid rgba(192,57,43,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "white" : "rgba(192,57,43,0.4)"} stroke={liked ? "white" : G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      {/* 3 traits */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div onClick={() => setShowMenu(m => !m)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", padding: 4 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
        </div>
        {showMenu && (
          <>
            {/* Overlay transparent pour fermer au clic extérieur */}
            <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowMenu(false)} />
            <div style={{ position: "absolute", right: 0, top: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
              {isPremium && onView && <div onClick={() => { setShowMenu(false); onView(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>Voir le profil</div>}
              <div onClick={() => { setShowMenu(false); onBlock(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>Bloquer</div>
              <div onClick={() => { setShowMenu(false); setShowSignalerMenu(true); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer" }}>Signaler</div>
            </div>
          </>
        )}
      </div>
      {/* Modal signaler */}
      {showSignalerMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
              <div onClick={() => setShowSignalerMenu(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
            </div>
            <div style={{ padding: "12px 16px 32px" }}>
              {["Faux profil / Arnaque", "Photos inappropriées", "Harcèlement", "Profil mineur", "Autre"].map(r => (
                <div key={r} onClick={() => { onReport(r); setShowSignalerMenu(false); }} style={{ padding: "14px 16px", background: "#F8F8F8", borderRadius: 12, marginBottom: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a" }}>{r}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CAROUSEL D'ENGAGEMENT PREMIUM ──
const premiumConversionSlides = [
  {
    id: 1,
    title: "Passe au niveau supérieur",
    description: "Profite d'une expérience plus complète pour faire de meilleures rencontres.",
    buttonText: "Découvrir Premium",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
      </svg>
    ),
    accent: G.or,
    bg: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",
  },
  {
    id: 2,
    title: "Découvre qui t'apprécie",
    description: "Gagne du temps en voyant les personnes déjà intéressées par ton profil.",
    buttonText: "Passer à Premium",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    accent: G.rouge,
    bg: "linear-gradient(135deg,rgba(192,57,43,0.08),rgba(192,57,43,0.02))",
  },
  {
    id: 3,
    title: "Sois plus visible",
    description: "Ton profil peut être mieux mis en avant auprès des personnes compatibles.",
    buttonText: "Améliorer mon profil",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    accent: G.vert,
    bg: "linear-gradient(135deg,rgba(26,92,58,0.08),rgba(26,92,58,0.02))",
  },
  {
    id: 4,
    title: "Des échanges plus qualifiés",
    description: "Accède à une expérience pensée pour ceux qui veulent vraiment construire quelque chose.",
    buttonText: "Découvrir Premium",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: "#7B5EA7",
    bg: "linear-gradient(135deg,rgba(123,94,167,0.08),rgba(123,94,167,0.02))",
  },
  {
    id: 5,
    title: "Moins de limites, plus de liberté",
    description: "Profite d'une navigation plus fluide et d'options avancées.",
    buttonText: "Voir les avantages",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    accent: G.or,
    bg: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",
  },
];

const premiumAdviceSlides = [
  {
    id: 1,
    title: "Choisis une photo claire",
    description: "Une photo lumineuse, nette et récente inspire plus facilement confiance.",
    buttonText: "Modifier mon profil",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
    accent: G.rouge,
    bg: "linear-gradient(135deg,rgba(192,57,43,0.08),rgba(192,57,43,0.02))",
    tab: "profile",
  },
  {
    id: 2,
    title: "Montre ton visage",
    description: "Les profils avec un visage bien visible donnent plus envie d'engager la conversation.",
    buttonText: "Ajouter une photo",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
      </svg>
    ),
    accent: G.vert,
    bg: "linear-gradient(135deg,rgba(26,92,58,0.08),rgba(26,92,58,0.02))",
    tab: "profile",
  },
  {
    id: 3,
    title: "Écris une bio simple",
    description: "Quelques phrases sincères suffisent pour montrer qui tu es et ce que tu recherches.",
    buttonText: "Compléter ma bio",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    ),
    accent: G.or,
    bg: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",
    tab: "profile",
  },
  {
    id: 4,
    title: "Reste naturel",
    description: "Les profils trop parfaits paraissent moins crédibles. Montre une vraie part de toi.",
    buttonText: "Améliorer mon profil",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    accent: "#7B5EA7",
    bg: "linear-gradient(135deg,rgba(123,94,167,0.08),rgba(123,94,167,0.02))",
    tab: "profile",
  },
  {
    id: 5,
    title: "Commence avec attention",
    description: "Un message personnalisé fonctionne mieux qu'un simple \"salut\".",
    buttonText: "Voir mes matchs",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: G.rouge,
    bg: "linear-gradient(135deg,rgba(192,57,43,0.08),rgba(192,57,43,0.02))",
    tab: "matches",
  },
];

const PremiumEngagementCarousel = React.memo(function PremiumEngagementCarousel({
  isPremium,
  onShowPremium,
  onNav,
}: {
  isPremium: boolean;
  onShowPremium: (r: string) => void;
  onNav?: (tab: string) => void;
}) {
  const slides = isPremium ? premiumAdviceSlides : premiumConversionSlides;
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % slides.length);
    }, 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPremium]);

  const goTo = (i: number) => { setIdx(i); resetTimer(); };
  const prev = () => goTo((idx - 1 + slides.length) % slides.length);
  const next = () => goTo((idx + 1) % slides.length);

  const slide = slides[idx];

  const handleAction = () => {
    if (isPremium) {
      onNav?.((slide as typeof premiumAdviceSlides[0]).tab || "profile");
    } else {
      onShowPremium("Passe Premium pour débloquer toutes les fonctionnalités de Moyo !");
    }
  };

  return (
    <div style={{ marginTop: 6, userSelect: "none", WebkitUserSelect: "none" }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        touchStartX.current = null;
        if (Math.abs(diff) < 35) return;
        diff > 0 ? next() : prev();
      }}
    >
      <div style={{
        background: G.blanc,
        borderRadius: 16,
        padding: "10px 14px",
        boxShadow: "0 2px 12px rgba(44,26,14,0.07)",
        border: `1px solid ${G.gris}`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Fond décoratif léger */}
        <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: slide.bg, pointerEvents: "none" }} />

        {/* Ligne unique : icône + texte + bouton */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          {/* Icône compacte */}
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: slide.bg, display: "flex", alignItems: "center", justifyContent: "center",
            color: slide.accent,
          }}>
            {slide.icon}
          </div>

          {/* Titre + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: G.brun, lineHeight: 1.2, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {slide.title}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#888", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {slide.description}
            </div>
          </div>

          {/* Bouton compact */}
          <button onClick={handleAction} style={{
            background: `linear-gradient(135deg,${slide.accent},${slide.accent}cc)`,
            color: G.blanc, border: "none", borderRadius: 50,
            padding: "6px 11px", fontSize: "0.66rem", fontWeight: 700,
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            boxShadow: `0 2px 8px ${slide.accent}44`,
          }}>
            {slide.buttonText}
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 8 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              width: i === idx ? 16 : 4, height: 4, borderRadius: 99,
              background: i === idx ? slide.accent : "#D8D0C8",
              transition: "width 0.3s ease, background 0.3s ease",
              cursor: "pointer",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
});

