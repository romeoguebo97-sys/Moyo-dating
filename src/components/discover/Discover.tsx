import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function ProfileListCard({ prof, liked, onLike, onBlock, onReport, onView, isPremium }: { prof: Profile; liked: boolean; onLike: () => void; onBlock: () => void; onReport: (r: string) => void; onView?: () => void; isPremium?: boolean }) {
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
              {onView && <div onClick={() => { setShowMenu(false); onView(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>Voir le profil</div>}
              <div onClick={() => { setShowMenu(false); onBlock(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>Bloquer</div>
              <div onClick={() => { setShowMenu(false); setShowSignalerMenu(true); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer" }}>Signaler</div>
            </div>
          </>
        )}
      </div>
      {/* Modal signaler */}
      {showSignalerMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
              <div onClick={() => setShowSignalerMenu(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
            </div>
            <div style={{ padding: "12px 16px 24px" }}>
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
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "0 2px 10px rgba(44,26,14,0.06)",
        border: `1px solid ${G.gris}`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Fond décoratif léger */}
        <div style={{ position: "absolute", top: -14, right: -14, width: 62, height: 62, borderRadius: "50%", background: slide.bg, pointerEvents: "none" }} />

        {/* Ligne unique : icône + texte + bouton */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {/* Icône compacte */}
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: slide.bg, display: "flex", alignItems: "center", justifyContent: "center",
            color: slide.accent,
          }}>
            {slide.icon}
          </div>

          {/* Titre + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: G.brun, lineHeight: 1.2, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {slide.title}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#888", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {slide.description}
            </div>
          </div>

          {/* Bouton compact */}
          <button onClick={handleAction} style={{
            background: `linear-gradient(135deg,${slide.accent},${slide.accent}cc)`,
            color: G.blanc, border: "none", borderRadius: 50,
            padding: "5px 9px", fontSize: "0.60rem", fontWeight: 700,
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            boxShadow: `0 2px 8px ${slide.accent}44`,
          }}>
            {slide.buttonText}
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 3, marginTop: 6 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              width: i === idx ? 14 : 4, height: 4, borderRadius: 99,
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

export function Discover({ auth, onShowPremium, isWide = false }: { auth: Auth; onShowPremium: (r: string) => void; isWide?: boolean }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likedIds, setLikedIds] = useState(new Set<string>());
  const [blockedIds, setBlockedIds] = useState(new Set<string>());
  const [current, setCurrent] = useState(0);
  const [matchPop, setMatchPop] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likesToday, setLikesToday] = useState(0);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showSignaler, setShowSignaler] = useState(false);
  const [showSameGender, setShowSameGender] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [myGender, setMyGender] = useState("");
  const [filters, setFilters] = useState({ city: "", ageMin: "", ageMax: "", gender: "", religion: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list" | "full">("card");
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  // ── Bottom Sheet menu ──
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetProfile, setBottomSheetProfile] = useState<Profile | null>(null);
  const openBottomSheet = (prof: Profile) => {
    // Synchronise current pour que les actions bloquer/signaler ciblent ce profil
    const idx = profiles.findIndex(p => p.id === prof.id);
    if (idx >= 0) setCurrent(idx);
    setBottomSheetProfile(prof);
    setBottomSheetOpen(true);
  };
  const closeBottomSheet = () => {
    setBottomSheetOpen(false);
    setTimeout(() => setBottomSheetProfile(null), 320);
  };

  // Navigation circulaire - pure locale, aucun effet en base
  const navigate = (dir: "next" | "prev") => {
    if (profiles.length === 0) return;
    setCurrent(c => {
      let next: number;
      if (dir === "next") {
        next = c + 1 >= profiles.length ? 0 : c + 1;
        // Toast discret une seule fois au wrap vers 0
        if (c + 1 >= profiles.length) {
          // Boucle silencieuse : aucun message “On repart du début”.
        }
      } else {
        next = c - 1 < 0 ? profiles.length - 1 : c - 1;
      }
      if (profiles[next]) recordView(profiles[next].id);
      return next;
    });
  };
  useEffect(() => {
    loadProfiles();
    // Charger le genre de l'utilisateur connecté
    sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}&select=gender`)
      .then(res => { if (res[0]) setMyGender(res[0].gender); });
  }, []);
  useEffect(() => { if (profiles.length > 0 && profiles[current]) sb.recordVisit(auth.token, auth.userId, profiles[current].id); }, [current, profiles]);

  const loadProfiles = async (pageNum = 0, append = false) => {
    setLoading(true);
    try {
      // Chargement de TOUS les profils par batches de 1000 — mobile et desktop, quelle que soit la taille de la base
      const BATCH = 1000;
      let allProfiles: Profile[] = [];
      let offset = 0;
      let keepLoading = true;
      // Charger likes et bloqués une seule fois
      const [liked, blocked] = await Promise.all([
        sb.query<{ to_user: string }>(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user`),
        sb.query<{ blocked_id: string }>(auth.token, "blocks", `?blocker_id=eq.${auth.userId}&select=blocked_id`),
      ]);
      setLikedIds(new Set(liked.map(l => l.to_user)));
      const bIds = new Set(blocked.map(b => b.blocked_id));
      setBlockedIds(bIds);
      while (keepLoading) {
        let params = `?id=neq.${auth.userId}&is_visible=neq.false&is_complete=eq.true&order=is_premium.desc,is_verified.desc,created_at.desc&limit=${BATCH}&offset=${offset}`;
        if (filters.city && !filters.city.startsWith("──")) params += `&city=eq.${encodeURIComponent(filters.city)}`;
        if (filters.gender) params += `&gender=eq.${filters.gender}`;
        if (filters.ageMin) params += `&age=gte.${filters.ageMin}`;
        if (filters.ageMax) params += `&age=lte.${filters.ageMax}`;
        if (filters.religion) params += `&religion=eq.${encodeURIComponent(filters.religion)}`;
        const batch = await sb.query<Profile>(auth.token, "profiles", params);
        if (!Array.isArray(batch) || batch.length === 0) break;
        allProfiles = [...allProfiles, ...batch];
        if (batch.length < BATCH) keepLoading = false;
        else offset += BATCH;
      }
      const seen = new Set<string>();
      const unique = allProfiles.filter(p => {
        if (seen.has(p.id) || bIds.has(p.id)) return false;
        seen.add(p.id); return true;
      });
      const orderedUnique = priorityRandomizeProfiles(unique);
      setProfiles(orderedUnique);
      setCurrent(0);
      const today = new Date().toISOString().split("T")[0];
      const tl = await sb.query<object>(auth.token, "likes", `?from_user=eq.${auth.userId}&created_at=gte.${today}`);
      setLikesToday(Array.isArray(tl) ? tl.length : 0);
    } catch { if (!append) setProfiles([]); }
    setLoading(false);
  };

  const loadMore = async () => {
    // Plus de pagination — tous les profils sont déjà chargés
  };

  const handleBlock = async () => {
    const target = profiles[current];
    if (!target) return;
    await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: target.id });
    setShowBlockConfirm(false);
    setProfiles(prev => prev.filter(p => p.id !== target.id));
    setCurrent(c => Math.max(0, c - 1));
  };

  const recordView = async (profileId: string) => {
    // La vue n'est enregistrée que si le visiteur est Premium
    if (!auth.isPremium) return;
    if (profileId === auth.userId) return;
    try {
      await sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: profileId });
    } catch {}
  };

  const handleLike = async (p: Profile) => {
    if (myGender && p.gender && myGender === p.gender) { setShowSameGender(true); return; }
    if (likedIds.has(p.id)) {
      // Unlike - mise à jour optimiste immédiate
      setLikedIds(s => { const n = new Set(s); n.delete(p.id); return n; });
      setLikesToday(l => Math.max(0, l - 1));
      // Suppression en cascade : like + match + messages + vues
      try {
        const [fwd, rev] = await Promise.all([
          sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}&select=id`),
          sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}&select=id`),
        ]);
        const matchIds = [
          ...(Array.isArray(fwd) ? fwd.map(x => x.id) : []),
          ...(Array.isArray(rev) ? rev.map(x => x.id) : []),
        ];
        // Supprimer messages de tous les matchs
        for (const id of matchIds) {
          await sb.delete(auth.token, "messages", `?match_id=eq.${id}`);
        }
        await Promise.all([
          sb.delete(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}`),
          sb.delete(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}`),
          sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${p.id}`),
          // Supprimer aussi mon profil de ses likes (retrait symétrique)
          sb.delete(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`),
          // Supprimer les vues mutuelles
          sb.delete(auth.token, "profile_views", `?viewer_id=eq.${auth.userId}&viewed_id=eq.${p.id}`),
        ]);
      } catch {}
      return;
    }
    if (!auth.isPremium && likesToday >= FREE_LIMITS.likes) { onShowPremium(`Tu as utilisé tes ${FREE_LIMITS.likes} likes gratuits aujourd'hui. Passe Premium pour liker sans limite !`); return; }
    // Like - mise à jour optimiste immédiate
    setLikedIds(s => new Set([...s, p.id]));
    setLikesToday(l => l + 1);
    await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
    const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
    if (mutual.length > 0) {
      // ── Anti-doublon : vérifier qu'aucun match n'existe déjà dans les deux sens ──
      const [existFwd, existRev] = await Promise.all([
        sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}&select=id&limit=1`),
        sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}&select=id&limit=1`),
      ]);
      const alreadyExists = (existFwd?.[0]?.id || existRev?.[0]?.id) ? true : false;
      if (alreadyExists) {
        setMatchPop(p);
      } else {
        const matchRes = await sb.insert<{id: string}>(auth.token, "matches", { user1: auth.userId, user2: p.id });
        const matchId = matchRes?.[0]?.id;
        if (matchId) await sendMatchWelcomeMessage(auth.token, matchId, auth.name, p.name);
        setMatchPop(p);
      }
    }
  };

  // ── État toast local pour Discover ──
  const [discoverToast, setDiscoverToast] = useState<ToastState>(null);
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async (reason: string) => {
    if (!profiles[current]) return;
    const reportedProfile = profiles[current];
    setIsReporting(true);
    console.log(`[Moyo][Report] Signalement en cours - reporter:${auth.userId} reported:${reportedProfile.id} motif:"${reason}"`);
    try {
      const res = await sb.insert<{ id: string }>(
        auth.token,
        "reports",
        {
          reporter_id: auth.userId,
          reported_id: reportedProfile.id,
          reason,
          status: "pending",
        },
        auth.refreshToken,
        // onNewToken : pas nécessaire ici, safeRequest le gère en interne
      );
      if (res && res.length > 0) {
        console.log(`[Moyo][Report] ✅ Signalement enregistré - id:${res[0]?.id}`);
        setDiscoverToast({ msg: "Signalement envoyé. Merci de protéger la communauté Moyo.", type: "success" });
        
        setShowSignaler(false);
      } else {
        // Supabase a renvoyé un tableau vide sans erreur (RLS silencieuse possible)
        console.warn("[Moyo][Report] ⚠️ Insert report : réponse vide - vérifier les policies RLS de la table reports");
        setDiscoverToast({ msg: "Signalement non enregistré. Réessaie dans quelques instants.", type: "error" });
      }
    } catch (e: any) {
      console.error("[Moyo][Report] ❌ Erreur insert report :", e?.message || e);
      setDiscoverToast({ msg: "Erreur lors du signalement. Vérifie ta connexion.", type: "error" });
    }
    setIsReporting(false);
  };

  const p = profiles[current];
  const fullscreenProfiles = React.useMemo(() => {
    if (!profiles.length) return [];
    return [...profiles];
  }, [profiles]);
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Chargement...</div>;

  return <div style={{ padding: isWide ? 0 : "14px 16px 8px", display: isWide ? "flex" : "block", height: isWide ? "100%" : "auto" }}>
    {/* ── LISTE PROFILS GAUCHE (desktop uniquement) ── */}
    {isWide && (
      <div style={{ width: 220, minWidth: 220, background: viewMode === "full" ? "rgba(255,255,255,0.72)" : G.blanc, backdropFilter: viewMode === "full" ? "blur(18px) saturate(1.8)" : "none", WebkitBackdropFilter: viewMode === "full" ? "blur(18px) saturate(1.8)" : "none", borderRight: `1px solid ${viewMode === "full" ? "rgba(255,255,255,0.4)" : G.gris}`, overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", transition: "background 0.35s, backdrop-filter 0.35s", zIndex: viewMode === "full" ? 10 : 1 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {profiles.map((prof, idx) => {
            const isActive = idx === current;
            return (
              <div key={prof.id} onClick={() => { setCurrent(idx); recordView(prof.id); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, cursor: "pointer", marginBottom: 4, background: isActive ? "rgba(192,57,43,0.07)" : "transparent", border: `1.5px solid ${isActive ? G.rouge : "transparent"}`, transition: "all 0.15s" }}>
                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#E8C5A0,#C47A4A)" }}>
                  {prof.photo_url
                    ? <img src={prof.photo_url} alt={prof.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                  }
                </div>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: isActive ? G.rouge : G.brun, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>
                    {prof.name}
                    {prof.is_premium && <svg width="9" height="9" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                    {prof.is_verified && <svg width="10" height="10" viewBox="0 0 24 24" fill="#1a73e8" stroke="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>}
                  </div>
                  <div style={{ fontSize: "0.67rem", color: "#888", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prof.age} ans · {prof.city}</div>
                </div>
                {/* Aimé */}
                {likedIds.has(prof.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill={G.rouge} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>}
              </div>
            );
          })}
        </div>
      </div>
    )}
    {/* ── CONTENU PRINCIPAL DÉCOUVRIR ── */}
    <div style={{ flex: 1, padding: isWide ? "16px 20px" : 0, overflowY: isWide ? "auto" : "visible", minWidth: 0, display: isWide ? "flex" : "block", flexDirection: isWide ? "column" : undefined, height: isWide ? "100%" : "auto" }}>
    {discoverToast && <Toast msg={discoverToast.msg} type={discoverToast.type} onClose={() => setDiscoverToast(null)} />}
    {/* ── CSS animations bottom sheet + fullscreen footer ── */}
    <style>{`
      @keyframes moyoSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      @keyframes moyoSlideDown{from{transform:translateY(0)}to{transform:translateY(100%)}}
      @keyframes moyoFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes moyoFadeOut{from{opacity:1}to{opacity:0}}
      .moyo-bottom-sheet-enter{animation:moyoSlideUp 0.32s cubic-bezier(0.32,0.72,0,1) forwards}
      .moyo-bottom-sheet-exit{animation:moyoSlideDown 0.28s cubic-bezier(0.4,0,1,1) forwards}
      .moyo-overlay-enter{animation:moyoFadeIn 0.22s ease forwards}
      .moyo-overlay-exit{animation:moyoFadeOut 0.22s ease forwards}
      /* Footer auto-hide en fullscreen */
      .moyo-fullscreen-expand{max-height:calc(100dvh - 65px)!important;padding-bottom:0!important}
    `}</style>
    {/* ── BOTTOM SHEET GLOBAL ── */}
    {bottomSheetOpen && bottomSheetProfile && (
      <div
        className="moyo-overlay-enter"
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(2px)" }}
        onPointerDown={(e) => { if (e.target === e.currentTarget) closeBottomSheet(); }}
      >
        <div
          className="moyo-bottom-sheet-enter"
          style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom, 16px)", boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: "#E0D5CC" }} />
          </div>
          {/* Header */}
          <div style={{ padding: "12px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {bottomSheetProfile.photo_url && <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={bottomSheetProfile.photo_url} alt={bottomSheetProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
              <div>
                <div style={{ fontSize: "0.97rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{bottomSheetProfile.name}, {bottomSheetProfile.age} ans</div>
                {bottomSheetProfile.city && <div style={{ fontSize: "0.72rem", color: "#888", marginTop: 1 }}>{bottomSheetProfile.city}</div>}
              </div>
            </div>
            <div onPointerDown={closeBottomSheet} style={{ width: 32, height: 32, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          {/* Options */}
          <div style={{ padding: "8px 0 8px" }}>
            <div
              onPointerDown={() => { closeBottomSheet(); setViewedProfile(bottomSheetProfile); recordView(bottomSheetProfile.id); }}
              style={{ padding: "15px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: "1px solid #F8F8F8", WebkitTapHighlightColor: "transparent" }}
            >
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(26,92,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.93rem", color: "#1a1a1a" }}>Voir le profil</div>
            </div>
            <div
              onPointerDown={() => { closeBottomSheet(); setTimeout(() => setShowBlockConfirm(true), 50); }}
              style={{ padding: "15px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: "1px solid #F8F8F8", WebkitTapHighlightColor: "transparent" }}
            >
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.93rem", color: "#1a1a1a" }}>Bloquer</div>
            </div>
            <div
              onPointerDown={() => { closeBottomSheet(); setTimeout(() => setShowSignaler(true), 50); }}
              style={{ padding: "15px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
            >
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(231,76,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.93rem", color: "#e74c3c" }}>Signaler</div>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Boutons vue/filtres mobile — masqués sur desktop (panneau droit) */}
    {!isWide && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 14, width: "100%" }}>
      {/* Filtres à gauche — icône SVG uniquement */}
      <div onClick={() => setShowFilters(s => !s)} style={{ background: showFilters ? G.rouge : G.blanc, color: showFilters ? G.blanc : G.brun, border: `2px solid ${showFilters ? G.rouge : G.gris}`, borderRadius: 50, padding: "6px 8px", fontSize: "0.68rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showFilters ? G.blanc : G.brun} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="18" x2="20" y2="18"/>
          <circle cx="8" cy="6" r="2" fill={showFilters ? G.blanc : G.brun} stroke="none"/>
          <circle cx="15" cy="12" r="2" fill={showFilters ? G.blanc : G.brun} stroke="none"/>
          <circle cx="10" cy="18" r="2" fill={showFilters ? G.blanc : G.brun} stroke="none"/>
        </svg>
      </div>
      {/* Compteur likes gratuits — centré */}
      {!auth.isPremium && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: likesToday >= FREE_LIMITS.likes ? "rgba(231,76,60,0.1)" : "rgba(26,92,58,0.08)", borderRadius: 50, padding: "4px 10px 4px 8px", border: `1.5px solid ${likesToday >= FREE_LIMITS.likes ? "#e74c3c" : G.vert}`, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill={likesToday >= FREE_LIMITS.likes ? "#e74c3c" : G.vert} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: likesToday >= FREE_LIMITS.likes ? "#e74c3c" : G.vert, letterSpacing: 0.2 }}>
            {Math.max(0, FREE_LIMITS.likes - likesToday)}/{FREE_LIMITS.likes}
          </span>
        </div>
      )}
      {/* Plein écran + Liste/Carte à droite */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <div onClick={() => {
          const next = viewMode === "list" ? "card" : "list";
          setViewMode(next);
          window.dispatchEvent(new CustomEvent("moyo-fullscreen", { detail: { active: false } }));
        }} style={{ background: viewMode === "list" ? G.rouge : G.blanc, color: viewMode === "list" ? G.blanc : "#111", border: `2px solid ${viewMode === "list" ? G.rouge : G.gris}`, borderRadius: 50, padding: "5px 7px", fontSize: "0.68rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
          {viewMode === "list" ? "Carte" : "Liste"}
        </div>
        <div onClick={() => {
          setViewMode("full");
          window.dispatchEvent(new CustomEvent("moyo-fullscreen", { detail: { active: true } }));
        }} style={{ background: viewMode === "full" ? G.rouge : G.blanc, color: viewMode === "full" ? G.blanc : "#111", border: `2px solid ${viewMode === "full" ? G.rouge : G.gris}`, borderRadius: 50, padding: "5px 7px", fontSize: "0.68rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1 }}>
          Plein écran
        </div>
      </div>
    </div>}{(!isWide && showFilters) && <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
  <select value={filters.city} onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Toutes les villes</option>
    {VILLES.filter(c => !c.startsWith("──")).map(c => <option key={c} value={c}>{c}</option>)}
  </select>
  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: G.brun, margin: "2px 0 6px" }}>Genre recherché</div>
  <select value={filters.gender} onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Homme et Femme</option>
    <option value="Homme">Homme</option>
    <option value="Femme">Femme</option>
  </select>
  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
    <input type="number" value={filters.ageMin} onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))} placeholder="Âge min (18)" min={18} max={99} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${filters.ageMin && parseInt(filters.ageMin) < 18 ? "#e74c3c" : G.gris}`, fontSize: "0.9rem" }} />
    <input type="number" value={filters.ageMax} onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))} placeholder="Âge max (99)" min={18} max={99} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${filters.ageMax && parseInt(filters.ageMax) > 99 ? "#e74c3c" : G.gris}`, fontSize: "0.9rem" }} />
  </div>
  {filters.ageMin && parseInt(filters.ageMin) < 18 && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>Âge minimum : 18 ans</p>}
  {filters.ageMax && parseInt(filters.ageMax) > 99 && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>Âge maximum : 99 ans</p>}
  {filters.ageMin && filters.ageMax && parseInt(filters.ageMin) > parseInt(filters.ageMax) && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>L'âge min doit être inférieur à l'âge max</p>}
  <select value={filters.religion} onChange={e => setFilters(prev => ({ ...prev, religion: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Toutes les religions</option>
    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
  </select>
  <Btn variant="primary" onClick={() => {
    const min = parseInt(filters.ageMin);
    const max = parseInt(filters.ageMax);
    if (filters.ageMin && (min < 18 || min > 99)) return;
    if (filters.ageMax && (max < 18 || max > 99)) return;
    if (filters.ageMin && filters.ageMax && min > max) return;
    loadProfiles(0); setShowFilters(false);
  }} style={{ width: "100%" }}>Appliquer</Btn>
</div>}{profiles.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: "56px", height: "56px", borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={() => { loadProfiles(0); }}>Actualiser</Btn></div> : viewMode === "full" ? <div ref={fullscreenScrollRef} className="no-invert moyo-fullscreen-view" onScroll={(e) => {
  const el = e.currentTarget;
  if (!profiles.length) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 900) {
    // Fin de la liste — reshuffler et repartir du début
    setProfiles(prev => shuffleArray([...prev]));
    el.scrollTop = 0;
  }
}} style={{ margin: "0 -16px", padding: "0 10px 0", maxHeight: "calc(100dvh - 100px)", overflowY: "auto", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", background: "#F0F1F5", willChange: "scroll-position", WebkitTransform: "translateZ(0)" }}>
  <style>{`.moyo-fullscreen-view img{filter:none!important} .moyo-status-view *{-webkit-tap-highlight-color:transparent;outline:none;user-select:none;-webkit-user-select:none;}`}</style>
  {fullscreenProfiles.map((prof, idx) => (
    <div key={`${prof.id}-${idx}`} style={{ position: "relative", height: "calc(100dvh - 110px)", minHeight: 560, borderRadius: 28, overflow: "hidden", marginBottom: 12, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", boxShadow: "0 8px 32px rgba(44,26,14,0.22)", scrollSnapAlign: "start", willChange: "transform", WebkitTransform: "translateZ(0)" }}>
      {prof.photo_url ? <img src={prof.photo_url} alt={prof.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading={idx === 0 ? "eager" : "lazy"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.48) 32%, rgba(0,0,0,0.05) 66%, rgba(0,0,0,0.22) 100%)", pointerEvents: "none" }} />
      {/* ✕ haut droite - sur chaque carte */}
      <button onClick={() => { setViewMode("card"); window.dispatchEvent(new CustomEvent("moyo-fullscreen", { detail: { active: false } })); }} style={{ position: "absolute", top: 16, right: 16, width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.48)", color: G.blanc, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", cursor: "pointer", backdropFilter: "blur(8px)", padding: 0, flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style={{ position: "absolute", left: 18, right: 18, bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)", color: G.blanc }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, minWidth: 0 }}>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.05, textShadow: "0 2px 10px rgba(0,0,0,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{prof.name}, {prof.age} ans</div>
          {prof.is_premium && <PremiumBadge size={20} />}
          {prof.is_verified && <VerifiedBadge size={20} />}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {prof.gender && <span style={{ background: "rgba(255,255,255,0.18)", color: G.blanc, borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)" }}>{prof.gender}</span>}
          {prof.city && <span style={{ background: "rgba(255,255,255,0.18)", color: G.blanc, borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.city}</span>}
          {prof.religion && <span style={{ background: "rgba(212,168,67,0.28)", color: G.blanc, border: "1px solid rgba(212,168,67,0.55)", borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.religion}</span>}
          {prof.profession && <span style={{ background: "rgba(255,255,255,0.16)", color: G.blanc, borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.profession}</span>}
          {prof.hobbies && <span style={{ background: "rgba(26,92,58,0.38)", color: G.blanc, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 50, padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700, backdropFilter: "blur(6px)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.hobbies}</span>}
        </div>
        <div style={{ fontSize: "0.86rem", lineHeight: 1.45, opacity: 0.92, textShadow: "0 1px 8px rgba(0,0,0,0.5)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 38 }}>{prof.bio || ""}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button onClick={() => handleLike(prof)} style={{ width: 68, height: 68, minWidth: 68, minHeight: 68, borderRadius: "50%", border: "none", background: likedIds.has(prof.id) ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : "rgba(255,255,255,0.92)", color: likedIds.has(prof.id) ? G.blanc : G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 28px rgba(0,0,0,0.35)", cursor: "pointer", padding: 0, flexShrink: 0 }}><svg width="32" height="32" viewBox="0 0 24 24" fill={likedIds.has(prof.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <button
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); openBottomSheet(prof); }}
            style={{ width: 68, height: 68, minWidth: 68, minHeight: 68, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(0,0,0,0.55)", color: G.blanc, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, boxShadow: "0 10px 28px rgba(0,0,0,0.35)", cursor: "pointer", backdropFilter: "blur(8px)", padding: 0, flexShrink: 0, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            {[0,1,2].map(i => <div key={i} style={{ width: 22, height: 2.5, borderRadius: 2, background: "white" }} />)}
          </button>
        </div>
      </div>
    </div>
  ))}
  {/* fin fullscreen */}
</div> : viewMode === "list" ? <div>
  {profiles.map((prof, idx) => <ProfileListCard key={prof.id} prof={prof} liked={likedIds.has(prof.id)} onLike={() => handleLike(prof)} onBlock={async () => { await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: prof.id }); setProfiles(prev => prev.filter(p => p.id !== prof.id)); }} onReport={(r) => handleReport(r)} isPremium={auth.isPremium} onView={() => { setViewedProfile(prof); recordView(prof.id); }} />)}
  {/* fin liste */}
</div> : !p ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: "56px", height: "56px", borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={() => { loadProfiles(0); }}>Actualiser</Btn></div> : <><div
  onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
  onTouchEnd={(e) => {
    if (swipeStartX.current === null) return;
    const diff = swipeStartX.current - e.changedTouches[0].clientX;
    swipeStartX.current = null;
    if (Math.abs(diff) < 40) return; // trop petit = pas un swipe
    if (diff > 0) {
      // swipe gauche → profil suivant (avec wrap)
      navigate("next");
    } else {
      // swipe droite → profil précédent (avec wrap)
      navigate("prev");
    }
  }}
  style={{ background: G.blanc, borderRadius: 22, boxShadow: "0 8px 36px rgba(44,26,14,0.12)", overflow: "hidden", marginBottom: 6, position: "relative", touchAction: "pan-y", flex: isWide ? 1 : "none", display: isWide ? "flex" : "block", flexDirection: isWide ? "column" : undefined }}><div style={{ height: isWide ? undefined : 210, flex: isWide ? 1 : "none", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: isWide ? 200 : "none" }}>{p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <span style={{ fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}</div><div style={{ padding: "10px 14px", flexShrink: 0 }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111" }}>{p.name}, {p.age} ans {p.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 4 }}><PremiumBadge size={16} /></span>} {p.is_verified && <VerifiedBadge size={16} />}</div>
    {/* 3 traits menu - single tap/click → bottom sheet */}
    <div style={{ position: "relative" }}>
      <div
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); openBottomSheet(p); }}
        style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", padding: 6, borderRadius: 10, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
      >
        {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 2, borderRadius: 2, background: "#555" }} />)}
      </div>
    </div>
  </div>
  <div style={{ minHeight: 88, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 4 }}>
  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden", minHeight: 24 }}>
    {p.gender && <span style={{ background: p.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: p.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{p.gender === "Femme" ? "Femme" : "Homme"}</span>}
    {p.city && p.city.trim() && <span style={{ background: "rgba(44,26,14,0.06)", borderRadius: 50, padding: "2px 9px", fontSize: "0.72rem", color: "#555", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1, minWidth: 0, maxWidth: 130 }}>{p.city.trim()}</span>}
    {p.religion && p.religion.trim() && <span style={{ background: "rgba(212,168,67,0.12)", border: `1px solid rgba(212,168,67,0.35)`, borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#555", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", flexShrink: 1, minWidth: 0, maxWidth: 160 }}>{p.religion.trim()}</span>}
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden", minHeight: 24 }}>
    {p.profession && p.profession.trim() && <span style={{ background: "rgba(44,26,14,0.05)", border: "1px solid rgba(44,26,14,0.14)", borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#555", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", flexShrink: 1, minWidth: 0, maxWidth: "48%" }}>{p.profession.trim()}</span>}
    {p.hobbies && p.hobbies.trim() && <span style={{ background: "rgba(26,92,58,0.07)", border: "1px solid rgba(26,92,58,0.18)", borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#2a5a3a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", flexShrink: 1, minWidth: 0, maxWidth: "48%" }}>{p.hobbies.trim()}</span>}
  </div>
  <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5, marginTop: 2, marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", minHeight: "1.23rem" }}>{p.bio || ""}</p>
</div>
</div></div>
{/* Boutons ← ❤️ → */}
<div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", marginTop: isWide ? "auto" : 8, marginBottom: 6, paddingTop: isWide ? 12 : 0, flexShrink: 0 }}>
  <div onClick={() => navigate("prev")} style={{ width: 38, height: 38, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", boxShadow: "0 2px 8px rgba(44,26,14,0.08)" }}>←</div>
  <div onClick={() => handleLike(p)} style={{ width: 54, height: 54, borderRadius: "50%", background: likedIds.has(p.id) ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : G.blanc, border: likedIds.has(p.id) ? "none" : `2px solid ${G.gris}`, boxShadow: likedIds.has(p.id) ? "0 6px 20px rgba(192,57,43,0.4)" : "0 2px 8px rgba(44,26,14,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", cursor: "pointer" }}>{likedIds.has(p.id) ? "❤️" : "🤍"}</div>
  <div onClick={() => navigate("next")} style={{ width: 38, height: 38, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", boxShadow: "0 2px 8px rgba(44,26,14,0.08)" }}>→</div>
</div>
<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 4, marginBottom: 6 }}>
  {profiles.slice(Math.max(0, current - 2), Math.min(profiles.length, current + 3)).map((_, i) => {
    const idx = Math.max(0, current - 2) + i;
    const isActive = idx === current;
    return (
      <div key={idx} style={{ width: isActive ? 23 : 7, height: 7, borderRadius: 99, background: isActive ? G.rouge : "#E0D5CC", transition: "width 0.25s ease, background 0.25s ease" }} />
    );
  })}
</div><div style={{ marginTop: 6 }}>{!isWide && <PremiumEngagementCarousel isPremium={auth.isPremium} onShowPremium={onShowPremium} onNav={undefined} />}</div></>}{viewedProfile && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setViewedProfile(null)}>
      <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
          {viewedProfile.photo_url ? <img src={viewedProfile.photo_url} alt={viewedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={() => setViewedProfile(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{viewedProfile.name}, {viewedProfile.age} ans {viewedProfile.is_premium && <span style={{ display: "inline-flex", verticalAlign: "middle", marginLeft: 3 }}><PremiumBadge size={11} /></span>}{viewedProfile.is_verified && <VerifiedBadge size={14} />}</div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{viewedProfile.city}</div>
          </div>
        </div>
        <div style={{ padding: "18px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: viewedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: viewedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{viewedProfile.gender}</span>
            {viewedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{viewedProfile.religion}</span>}
          </div>
          {viewedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{viewedProfile.bio}</p>}
          <Btn variant="primary" onClick={() => { handleLike(viewedProfile); setViewedProfile(null); }} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>❤️ Liker ce profil</Btn>
        </div>
      </div>
    </div>
  )}
  {showSameGender && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div style={{ background: G.blanc, borderRadius: 20, padding: "32px 24px", width: "100%", maxWidth: 300, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>{myGender === "Homme" ? "🕺" : "💃"}</div>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>
        {myGender === "Homme" ? "Eh frère, reste du bon côté ! 😂" : "Eh sœur, reste du bon côté ! 😂"}
      </h3>
      <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
        Moyo c'est pour les rencontres hétérosexuelles 😄
      </p>
      <Btn variant="primary" onClick={() => setShowSameGender(false)} style={{ width: "100%" }}>J'ai compris 😄</Btn>
    </div>
  </div>
)}
{showBlockConfirm && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
  <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Bloquer {p?.name} ?</h3>
    <p style={{ fontSize: "0.88rem", color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Ce profil disparaîtra de Découvrir. Vous pourrez débloquer depuis votre profil.</p>
    <div style={{ display: "flex", gap: 10 }}>
      <Btn variant="ghost" onClick={() => setShowBlockConfirm(false)} style={{ flex: 1 }}>Annuler</Btn>
      <Btn variant="danger" onClick={handleBlock} style={{ flex: 1 }}>Bloquer</Btn>
    </div>
  </div>
</div>}
{showSignaler && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
  <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)" }}>
    <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
      <div onClick={() => !isReporting && setShowSignaler(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
    </div>
    <div style={{ padding: "12px 16px 24px" }}>
      {isReporting ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#555", fontSize: "0.88rem" }}>
          Envoi du signalement…
        </div>
      ) : (
        ["Faux profil / Arnaque", "Photos inappropriées", "Harcèlement", "Profil mineur", "Autre"].map(r => (
          <div key={r} onClick={() => { handleReport(r); setShowSignaler(false); }} style={{ padding: "14px 16px", background: "#F8F8F8", borderRadius: 12, marginBottom: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a" }}>{r}</div>
        ))
      )}
    </div>
  </div>
</div>}{matchPop && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}><div style={{ textAlign: "center", color: G.blanc }}><div style={{ fontSize: "4rem", marginBottom: 12 }}>💞</div><h2 style={{  fontSize: "2.2rem", color: G.or, marginBottom: 8 }}>C'est un Match !</h2><p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>Toi et {matchPop.name} vous plaisez mutuellement !</p><Btn variant="white" onClick={() => setMatchPop(null)}>Continuer →</Btn></div></div>}
    </div>{/* fin contenu principal */}

    {/* ── PANNEAU DROIT (desktop/tablette uniquement) ── */}
    {isWide && (
      <div style={{ width: 300, minWidth: 300, background: viewMode === "full" ? "rgba(255,255,255,0.72)" : G.blanc, backdropFilter: viewMode === "full" ? "blur(18px) saturate(1.8)" : "none", WebkitBackdropFilter: viewMode === "full" ? "blur(18px) saturate(1.8)" : "none", borderLeft: `1px solid ${viewMode === "full" ? "rgba(255,255,255,0.4)" : G.gris}`, padding: "20px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, height: "100%", transition: "background 0.35s", zIndex: viewMode === "full" ? 10 : 1 }}>

        {/* 1. Affichage */}
        <div>
          <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Affichage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { key: "card", label: "Vue Carte", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
              { key: "list", label: "Vue Liste", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
              { key: "full", label: "Plein écran", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg> },
            ].map(v => (
              <div key={v.key} onClick={() => { setViewMode(v.key as "card" | "list" | "full"); window.dispatchEvent(new CustomEvent("moyo-fullscreen", { detail: { active: v.key === "full" } })); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 11, border: `1.5px solid ${viewMode === v.key ? G.rouge : G.gris}`, background: viewMode === v.key ? "rgba(192,57,43,0.05)" : G.blanc, color: viewMode === v.key ? G.rouge : "#555", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: viewMode === v.key ? "rgba(192,57,43,0.1)" : "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center" }}>{v.icon}</div>
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Filtres */}
        <div>
          <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Filtres</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <div style={{ fontSize: "0.63rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Ville</div>
              <select value={filters.city} onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: `1.5px solid ${G.gris}`, background: G.blanc, fontSize: "0.76rem", color: G.brun, fontWeight: 500, outline: "none", cursor: "pointer" }}>
                <option value="">Toutes les villes</option>
                {VILLES.filter(c => !c.startsWith("──")).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "0.63rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Genre</div>
              <select value={filters.gender} onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: `1.5px solid ${G.gris}`, background: G.blanc, fontSize: "0.76rem", color: G.brun, fontWeight: 500, outline: "none", cursor: "pointer" }}>
                <option value="">Homme et Femme</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: "0.63rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Âge</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="number" value={filters.ageMin} onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))} placeholder="Min (18)" min={18} max={99} style={{ flex: 1, padding: "7px 8px", borderRadius: 9, border: `1.5px solid ${G.gris}`, fontSize: "0.76rem", outline: "none" }} />
                <input type="number" value={filters.ageMax} onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))} placeholder="Max (99)" min={18} max={99} style={{ flex: 1, padding: "7px 8px", borderRadius: 9, border: `1.5px solid ${G.gris}`, fontSize: "0.76rem", outline: "none" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.63rem", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Religion</div>
              <select value={filters.religion} onChange={e => setFilters(prev => ({ ...prev, religion: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: `1.5px solid ${G.gris}`, background: G.blanc, fontSize: "0.76rem", color: G.brun, fontWeight: 500, outline: "none", cursor: "pointer" }}>
                <option value="">Toutes</option>
                {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Btn variant="primary" onClick={() => { const min = parseInt(filters.ageMin); const max = parseInt(filters.ageMax); if (filters.ageMin && (min < 18 || min > 99)) return; if (filters.ageMax && (max < 18 || max > 99)) return; if (filters.ageMin && filters.ageMax && min > max) return; loadProfiles(0); }} style={{ width: "100%", padding: "9px", fontSize: "0.78rem" }}>Appliquer</Btn>
          </div>
        </div>

        {/* 3. Carrousel */}
        <div>
          <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Conseil du moment</div>
          <PremiumEngagementCarousel isPremium={auth.isPremium} onShowPremium={onShowPremium} onNav={undefined} />
        </div>

        {/* 4. Guide + Assistant Moyo */}
        <div style={{ display: "flex", gap: 8 }}>
          <div onClick={() => { const evt = new CustomEvent("moyo-show-guide"); window.dispatchEvent(evt); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${G.rouge}`, background: G.rouge, color: G.blanc, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, transition: "opacity 0.15s" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Guide
          </div>
          <div onClick={() => { const evt = new CustomEvent("moyo-show-bot"); window.dispatchEvent(evt); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${G.vert}`, background: G.vert, color: G.blanc, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, transition: "opacity 0.15s" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/><circle cx="9" cy="11" r="1" fill="white"/><circle cx="15" cy="11" r="1" fill="white"/></svg>
            Assistant
          </div>
        </div>

        {/* 4. CTA Premium si gratuit */}
        {!auth.isPremium && (
          <div onClick={() => onShowPremium("")} style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "16px", cursor: "pointer", boxShadow: "0 6px 20px rgba(192,57,43,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: G.blanc }}>Passer à Moyo Premium</span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5, marginBottom: 10 }}>Messages illimités · Likes illimités · Voir qui vous like</div>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: G.or }}>3 500 <span style={{ fontSize: "0.62rem", fontWeight: 600, opacity: 0.85 }}>FCFA/mois</span></div>
          </div>
        )}

      </div>
    )}
  </div>;
}

