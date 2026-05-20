import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY } from "./constants";
import { Auth } from "./types";
import { sb } from "./lib/supabase";

// ── Chargés immédiatement (nécessaires dès l'ouverture) ──
import { Landing, About, Login, SignUp, ResetPassword } from "./components/auth/LoginSignUp";
import { AppShell } from "./components/shell/AppShell";
import { PremiumModal } from "./components/premium/PremiumModal";
import { UserWarningModal } from "./components/admin/Admin";

// ── Lazy loading : chargés uniquement quand l'utilisateur y accède ──
const Discover         = lazy(() => import("./components/discover/Discover").then(m => ({ default: m.Discover })));
const LikesPage        = lazy(() => import("./components/likes/LikesPage").then(m => ({ default: m.LikesPage })));
const Matches          = lazy(() => import("./components/matches/Matches").then(m => ({ default: m.Matches })));
const Messages         = lazy(() => import("./components/messages/Messages").then(m => ({ default: m.Messages })));
const Profile          = lazy(() => import("./components/profile/Profile").then(m => ({ default: m.Profile })));
const AdminPinGate     = lazy(() => import("./components/admin/Admin").then(m => ({ default: m.AdminPinGate })));
const AdminDesktopPage = lazy(() => import("./components/admin/AdminDesktopPage").then(m => ({ default: m.AdminDesktopPage })));

// ── Spinner affiché pendant le chargement lazy ──
const LazyLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  </div>
);

export default function App() {
  const [page, setPage] = useState("landing");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("moyo_dark") === "1");
  const [tab, setTab] = useState("discover");
  const [auth, setAuth] = useState<Auth | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [viewsReceived, setViewsReceived] = useState(0);
  const [premiumModal, setPremiumModal] = useState<string | null>(null);
  const [pendingWarning, setPendingWarning] = useState<{ id: string; warning_number: number; reason: string } | null>(null);
  const [pendingBroadcast, setPendingBroadcast] = useState<{ id: string; message: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [openConvPartnerId, setOpenConvPartnerId] = useState<string | null>(null);
  const [adminBadgeCount, setAdminBadgeCount] = useState(0);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isUnmatchingRef = useRef(false);
  // Ref pour permettre à LikesPage de déclencher un refresh des badges
  const refreshBadgesRef = useRef<(() => void) | null>(null);

  // ── SESSION v2 : callback injecté dans sb pour déconnexion propre sur 401 irrécupérable ──
  // Défini ici (pas dans useEffect) pour être stable dès le premier render
  const authRef = useRef<Auth | null>(null);
  const handleSessionExpired = React.useCallback(() => {
    console.warn("[Moyo][Session] Session expirée - déconnexion propre");
    localStorage.removeItem("moyo_session");
    authRef.current = null;
    setAuth(null);
    setPage("landing");
    setUnreadCount(0);
    setNotifCount(0);
    setLikesReceived(0);
  }, []);

  // ── Injecter le handler dans sb une seule fois ──
  useEffect(() => {
    sb.setAuthFailureHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // ── Helper pour mettre à jour le token après un refresh réussi ──
  const handleTokenRefreshed = React.useCallback((newToken: string, newRefreshToken: string, newExpiresAt: number) => {
    setAuth(prev => {
      if (!prev) return prev;
      const updated: Auth = { ...prev, token: newToken, refreshToken: newRefreshToken, expiresAt: newExpiresAt };
      authRef.current = updated;
      try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
      console.log("[Moyo][Session] Auth state mis à jour avec le nouveau token");
      return updated;
    });
  }, []);

  // PWA - écouter l'événement d'installation
  useEffect(() => {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Ne pas afficher si déjà installé ou déjà dismissé
    const dismissed = localStorage.getItem("moyo_install_dismissed");
    const isInStandaloneMode = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;
    if (dismissed || isInStandaloneMode) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS - détecter Safari iPhone/iPad
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos && !isInStandaloneMode) {
      setTimeout(() => setShowInstall(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
    setDeferredPrompt(null);
  };
  // Restaurer session au chargement
  useEffect(() => {
    // Vérifier si c'est un lien de reset password ou confirmation email
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    if (type === "recovery") {
      setPage("reset-password");
      return;
    }
    // Confirmation email - rediriger vers login (Supabase valide le token automatiquement via l'URL)
    if ((type === "signup" || type === "email_confirmation") && accessToken) {
      window.location.hash = "";
      setPage("login");
      return;
    }
    try {
      const saved = localStorage.getItem("moyo_session");
      if (saved) {
        const a: Auth = JSON.parse(saved);
        if (a?.token && a?.userId) {

          // ── SESSION v2 : détecter si le token est déjà expiré avant même de l'utiliser ──
          const isExpired = a.expiresAt ? Date.now() > a.expiresAt - 60_000 : false; // marge 60s
          if (isExpired && a.refreshToken) {
            console.log("[Moyo][Session] Token expiré au chargement - refresh préventif…");
            sb.refreshSession(a.refreshToken).then(refreshed => {
              if (refreshed) {
                const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
                const updated: Auth = { ...a, token: refreshed.access_token, refreshToken: refreshed.refresh_token, expiresAt: newExpiresAt };
                authRef.current = updated;
                try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
                setAuth(updated);
              } else {
                // Refresh échoué → pas de session utilisable
                console.warn("[Moyo][Session] Refresh préventif échoué - retour landing");
                localStorage.removeItem("moyo_session");
                setAuth(null);
                setPage("landing");
              }
              setSessionLoaded(true);
            });
            setPage("app");
            setTab("discover");
            // Ne pas afficher l'app tant que le refresh n'est pas terminé
            return;
          }

          // Token non expiré (ou pas d'expiresAt) → restaurer immédiatement
          authRef.current = a;
          setAuth(a);
          setPage("app");
          setTab("discover");
          setSessionLoaded(true);

          // Vérifier en arrière-plan que le compte existe encore
          sb.query<Profile>(a.token, "profiles", `?id=eq.${a.userId}&select=id,is_premium,is_admin`, a.refreshToken, handleTokenRefreshed)
            .then(profiles => {
              if (!profiles || profiles.length === 0) {
                // ── Avant de déconnecter, vérifier que ce n'est pas un 401 récupéré ──
                // Si le token a été refreshé entre-temps, authRef.current.token ≠ a.token
                if (authRef.current?.token !== a.token) {
                  console.log("[Moyo][Session] Token refreshé entre-temps - pas de déconnexion");
                  return;
                }
                console.warn("[Moyo][Session] Profil introuvable au chargement - déconnexion");
                localStorage.removeItem("moyo_session");
                setAuth(null);
                setPage("landing");
              } else {
                // Mettre à jour Premium/isAdmin si changé
                const p = profiles[0];
                if (p.is_premium !== a.isPremium || (p.is_admin || false) !== a.isAdmin) {
                  const updated = { ...a, isPremium: p.is_premium, isAdmin: p.is_admin || false };
                  authRef.current = updated;
                  setAuth(updated);
                  try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
                }
              }
            })
            .catch(() => {
              // Erreur réseau : garder la session locale, pas de déconnexion
              console.log("[Moyo][Session] Vérification arrière-plan - erreur réseau ignorée");
            });
          return;
        }
      }
    } catch { localStorage.removeItem("moyo_session"); }
    setSessionLoaded(true);
  }, []);

  const handleAuth = (a: Auth) => {
    authRef.current = a;
    setAuth(a); setPage("app"); setTab("discover");
    try { localStorage.setItem("moyo_session", JSON.stringify(a)); } catch {}
    // Demander permission notifications push
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Moyo - Notifications activées !', {
              body: 'Vous recevrez des alertes pour vos nouveaux messages.',
              icon: '/favicon.png',
            });
          }
        });
      }, 3000);
    }
  };
  // ── Vérifier les avertissements non lus à chaque connexion ──
  useEffect(() => {
    if (!auth?.userId) return;
    const checkWarnings = async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/user_warnings?user_id=eq.${auth.userId}&acknowledged=eq.false&order=created_at.asc&limit=1`,
          { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}` } }
        );
        if (!r.ok) return;
        const data = await r.json().catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          const w = data[0];
          setPendingWarning({ id: w.id, warning_number: w.warning_number, reason: w.reason });
        }
      } catch {}
    };
    checkWarnings();
  }, [auth?.userId]);

  // ── Vérifier les broadcasts non vus à chaque connexion ──
  useEffect(() => {
    if (!auth?.userId) return;
    const checkBroadcast = async () => {
      try {
        const lastSeen = localStorage.getItem(`moyo_broadcast_seen_${auth.userId}`) || "1970-01-01";
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/broadcasts?created_at=gt.${lastSeen}&order=created_at.desc&limit=1`,
          { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}` } }
        );
        if (!r.ok) return;
        const data = await r.json().catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          setPendingBroadcast({ id: data[0].id, message: data[0].message });
        }
      } catch {}
    };
    checkBroadcast();
  }, [auth?.userId]);

  // ── Vérifier expiration Premium au login ──
  // Ne jamais retirer le Premium à vie (premium_until >= 2090)
  useEffect(() => {
    if (!auth?.userId || !auth.isPremium) return;
    const checkPremiumExpiry = async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${auth.userId}&select=premium_until`, { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}` } });
        const data = await r.json().catch(() => []);
        if (!Array.isArray(data) || !data[0]?.premium_until) return;
        const until = new Date(data[0].premium_until);
        localStorage.setItem(`moyo_premium_until_${auth.userId}`, until.toISOString());
        // ── Ne jamais toucher au Premium à vie (date >= 2090) ──
        if (until.getFullYear() >= 2090) return;
        // ── Retirer le Premium uniquement si vraiment expiré ──
        if (until < new Date()) {
          await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${auth.userId}`, { method: "PATCH", headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}` }, body: JSON.stringify({ is_premium: false }) });
        }
      } catch {}
    };
    checkPremiumExpiry();
  }, [auth?.userId]);

  const acknowledgeWarning = async () => {
    if (!pendingWarning || !auth) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_warnings?id=eq.${pendingWarning.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({ acknowledged: true, acknowledged_at: new Date().toISOString() }),
      });
    } catch {}
    setPendingWarning(null);
  };

  const handleLogout = () => {
    setAuth(null);
    setPage("landing");
    setUnreadCount(0);
    setNotifCount(0);
    setLikesReceived(0);
    try { localStorage.removeItem("moyo_session"); } catch {}
    // Après déconnexion, revenir en haut de la page d'accueil, au niveau du header.
    setTimeout(() => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch {}
    }, 0);
  };
  useEffect(() => {
    if (!auth) return;

    // ── SESSION v2 : validateSession sécurisée ──
    // • Ne déconnecte QUE si le profil est confirmé inexistant (compte supprimé par admin)
    // • Ignore les erreurs réseau (timeout, hors ligne, 401 récupéré par safeRequest)
    // • Met à jour Premium/isAdmin silencieusement
    const validateSession = async () => {
      try {
        const profiles = await sb.query<Profile>(
          auth.token, "profiles",
          `?id=eq.${auth.userId}&select=id,is_premium,is_admin`,
          auth.refreshToken,
          handleTokenRefreshed,
        );
        if (!profiles || profiles.length === 0) {
          // Vérification supplémentaire : le token a peut-être été refreshé
          // entre le moment de l'appel et maintenant → authRef est à jour
          if (authRef.current && authRef.current.token !== auth.token) {
            console.log("[Moyo][Session] validateSession - token refreshé, on garde la session");
            return true;
          }
          console.warn("[Moyo][Session] validateSession - profil inexistant → compte supprimé");
          localStorage.removeItem("moyo_session");
          setAuth(null);
          setPage("landing");
          return false;
        }
        // Mettre à jour Premium/isAdmin si changé
        const p = profiles[0];
        if (p.is_premium !== auth.isPremium || (p.is_admin || false) !== auth.isAdmin) {
          console.log("[Moyo][Session] validateSession - mise à jour Premium/isAdmin");
          const updated = { ...auth, isPremium: p.is_premium, isAdmin: p.is_admin || false };
          authRef.current = updated;
          setAuth(updated);
          try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
        }
        return true;
      } catch (e) {
        // ── ANCIEN comportement supprimé ──
        // Avant : on déconnectait sur toute erreur. Problème : un 401 résolu
        // par safeRequest() ne remonte PAS ici en exception → ce catch ne
        // reçoit que les vraies erreurs réseau (offline, timeout), auquel cas
        // on ne déconnecte PAS pour éviter les déconnexions fantômes.
        console.log("[Moyo][Session] validateSession - erreur réseau ignorée (session conservée)", e);
        return true;
      }
    };
    validateSession();

    // Vérifier la session toutes les 60s (compte supprimé par admin, token expiré)
    const sessionCheck = setInterval(validateSession, 60000);

    // Quand le téléphone se réveille (visibilitychange), revalider silencieusement
    // sans éjecter si c'est juste un timeout réseau
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Utiliser authRef.current pour avoir le token le plus récent
        const currentAuth = authRef.current || auth;
        sb.query<Profile>(
          currentAuth.token, "profiles",
          `?id=eq.${currentAuth.userId}&select=id,is_premium,is_admin`,
          currentAuth.refreshToken,
          handleTokenRefreshed,
        )
          .then(profiles => {
            if (!profiles || profiles.length === 0) {
              // Vérifier que le token n'a pas été refreshé entre-temps
              if (authRef.current && authRef.current.token !== currentAuth.token) {
                console.log("[Moyo][Session] visibilitychange - token refreshé, pas de déconnexion");
                return;
              }
              console.warn("[Moyo][Session] visibilitychange - profil inexistant → déconnexion");
              localStorage.removeItem("moyo_session");
              setAuth(null);
              setPage("landing");
            } else {
              const p = profiles[0];
              const cur = authRef.current || auth;
              if (p.is_premium !== cur.isPremium || (p.is_admin || false) !== cur.isAdmin) {
                const updated = { ...cur, isPremium: p.is_premium, isAdmin: p.is_admin || false };
                authRef.current = updated;
                setAuth(updated);
                try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
              }
            }
          })
          .catch(() => {
            // Erreur réseau (timeout, hors ligne) : NE PAS éjecter
            // L'utilisateur est juste de retour d'une veille sans connexion
          });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const updateLastSeen = () => sb.update(auth.token, "profiles", auth.userId, { last_seen: new Date().toISOString() });
    updateLastSeen();
    const lastSeenInterval = setInterval(updateLastSeen, 30000);

    // Chargement initial des likes reçus (badge séparé pour likes et vus)
    const loadLikesReceived = async () => {
      let dIds = new Set<string>();
      try {
        const dismissed = await sb.query<{ dismissed_id: string }>(auth.token, "dismissed_cards", `?user_id=eq.${auth.userId}&select=dismissed_id`);
        dIds = new Set(Array.isArray(dismissed) ? dismissed.map(d => d.dismissed_id) : []);
      } catch {}
      try {
        const [likes, views] = await Promise.all([
          sb.query<{ from_user: string }>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user`),
          sb.query<{ viewer_id: string }>(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}&viewer_id=neq.${auth.userId}&select=viewer_id`),
        ]);
        const likesCount = Array.isArray(likes) ? likes.filter(l => !dIds.has(l.from_user)).length : 0;
        const viewsCount = Array.isArray(views) ? [...new Set(views.map(v => v.viewer_id))].filter(id => !dIds.has(id)).length : 0;
        // ── Ne pas écraser le zéro si l'utilisateur est sur cet onglet (il vient de tout voir) ──
        setLikesReceived(prev => {
          const currentTab = document.querySelector('[data-active-tab]')?.getAttribute('data-active-tab') || '';
          return currentTab === 'likes' ? 0 : likesCount;
        });
        setViewsReceived(prev => {
          const currentTab = document.querySelector('[data-active-tab]')?.getAttribute('data-active-tab') || '';
          return currentTab === 'visitors' ? 0 : viewsCount;
        });
      } catch {}
    };
    loadLikesReceived();
    refreshBadgesRef.current = loadLikesReceived;

    // Chargement initial des matchs — badge = nouveaux matchs depuis la dernière visite
    const loadMatchCount = async () => {
      try {
        const lastVisit = localStorage.getItem(`moyo_matches_seen_${auth.userId}`) || "1970-01-01T00:00:00.000Z";
        const res = await sb.query<{ id: string; user1: string; user2: string; created_at?: string }>(
          auth.token, "matches",
          `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id,user1,user2,created_at`
        );
        if (Array.isArray(res)) {
          const seenPartners = new Set<string>();
          const newPartners = new Set<string>();
          for (const r of res) {
            const partnerId = r.user1 === auth.userId ? r.user2 : r.user1;
            if (!seenPartners.has(partnerId)) {
              seenPartners.add(partnerId);
              if (r.created_at && r.created_at > lastVisit) {
                newPartners.add(partnerId);
              }
            }
          }
          setNotifCount(newPartners.size);
        }
      } catch {}
    };
    loadMatchCount();

    // Chargement initial des messages non lus
    const checkUnread = async () => {
      try {
        const matches = await sb.query<{ id: string }>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id`);
        if (!matches.length) { setUnreadCount(0); return; }
        const matchIds = matches.map(m => m.id).join(",");
        const res = await sb.query<object>(auth.token, "messages", `?match_id=in.(${matchIds})&sender_id=neq.${auth.userId}&is_read=eq.false&select=id`);
        const count = Array.isArray(res) ? res.length : 0;
        setUnreadCount(prev => {
          if (count > prev && prev >= 0 && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Moyo - Nouveau message', {
              body: 'Vous avez reçu un nouveau message !',
              icon: '/favicon.png',
            });
          }
          return count;
        });
      } catch {}
    };
    checkUnread();

    // ── ADMIN badge - fetch au démarrage et toutes les 5s ──
    // Inclut : signalements pending + avis non lus + paiements en attente
    const checkAdminBadge = async () => {
      if (!auth.isAdmin) return;
      try {
        const h = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}`, "Prefer": "count=exact", "Range": "0-0" };
        const [rPending, rUnreadReviews, rPendingPayments] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/reports?select=id&status=eq.pending`, { headers: h }),
          fetch(`${SUPABASE_URL}/rest/v1/app_ratings?select=id&is_read=eq.false`, { headers: h }),
          fetch(`${SUPABASE_URL}/rest/v1/payment_requests?select=id&status=eq.pending`, { headers: h }),
        ]);
        const parseCount = (r: Response) => { const h2 = r.headers.get("content-range"); return h2 ? parseInt(h2.split("/")[1]) || 0 : 0; };
        setAdminBadgeCount(parseCount(rPending) + parseCount(rUnreadReviews) + parseCount(rPendingPayments));
      } catch {}
    };
    checkAdminBadge();
    const adminBadgeInterval = setInterval(checkAdminBadge, 5000);

    // ── REALTIME messages ──
    const wsMessages = sb.subscribeRealtime(auth.token, "messages", `match_id=neq.null`, () => {
      checkUnread();
    });

    // ── REALTIME likes ──
    const wsLikes = sb.subscribeRealtime(auth.token, "likes", `to_user=eq.${auth.userId}`, () => {
      loadLikesReceived();
    });

    // ── REALTIME matchs - badge mis à jour instantanément ──
    const wsMatches = sb.subscribeRealtime(auth.token, "matches", `user2=eq.${auth.userId}`, () => {
      if (isUnmatchingRef.current) return;
      loadMatchCount();
      loadLikesReceived();
    });
    const wsMatches2 = sb.subscribeRealtime(auth.token, "matches", `user1=eq.${auth.userId}`, () => {
      if (isUnmatchingRef.current) return;
      loadMatchCount();
    });

    // ── REALTIME profile_views ──
    const wsViews = sb.subscribeRealtime(auth.token, "profile_views", `viewed_id=eq.${auth.userId}`, () => {
      loadLikesReceived();
    });

    // ── REALTIME user_warnings — modal instantané sans refresh ──
    const checkWarningsRealtime = async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/user_warnings?user_id=eq.${auth.userId}&acknowledged=eq.false&order=created_at.asc&limit=1`,
          { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}` } }
        );
        if (!r.ok) return;
        const data = await r.json().catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          const w = data[0];
          setPendingWarning(prev => prev?.id === w.id ? prev : { id: w.id, warning_number: w.warning_number, reason: w.reason });
        }
      } catch {}
    };
    const wsWarnings = sb.subscribeRealtime(auth.token, "user_warnings", `user_id=eq.${auth.userId}`, () => {
      checkWarningsRealtime();
    });

    // ── REALTIME broadcasts — modal instantané sans refresh ──
    const checkBroadcastRealtime = async () => {
      try {
        const lastSeen = localStorage.getItem(`moyo_broadcast_seen_${auth.userId}`) || "1970-01-01";
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/broadcasts?created_at=gt.${lastSeen}&order=created_at.desc&limit=1`,
          { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${auth.token}` } }
        );
        if (!r.ok) return;
        const data = await r.json().catch(() => []);
        if (Array.isArray(data) && data.length > 0) {
          setPendingBroadcast(prev => prev?.id === data[0].id ? prev : { id: data[0].id, message: data[0].message });
        }
      } catch {}
    };
    const wsBroadcasts = sb.subscribeRealtime(auth.token, "broadcasts", `id=neq.00000000-0000-0000-0000-000000000000`, () => {
      checkBroadcastRealtime();
    });

    // Fallback polling toutes les 8s (le realtime gère l'instantané)
    const fallbackInterval = setInterval(() => {
      if (isUnmatchingRef.current) return;
      checkUnread();
      loadLikesReceived();
      loadMatchCount();
      checkWarningsRealtime();
      checkBroadcastRealtime();
    }, 8000);

    return () => {
      try { wsMessages?.close(); } catch {}
      try { wsLikes?.close(); } catch {}
      try { wsMatches?.close(); } catch {}
      try { wsMatches2?.close(); } catch {}
      try { wsViews?.close(); } catch {}
      try { wsWarnings?.close(); } catch {}
      try { wsBroadcasts?.close(); } catch {}
      clearInterval(fallbackInterval);
      clearInterval(adminBadgeInterval);
      clearInterval(lastSeenInterval);
      clearInterval(sessionCheck);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [auth?.userId]);
  const showPremium = (r = "") => setPremiumModal(r || "Passe Premium pour débloquer toutes les fonctionnalités !");

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const InstallBanner = showInstall ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.blanc, borderRadius: 24, width: "100%", maxWidth: 340, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "28px 24px 22px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", color: G.blanc, fontWeight: 800, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "10px auto 0" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          </div>
        </div>
        {/* Contenu */}
        <div style={{ padding: "22px 24px 24px", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Installe l'app Moyo !</h3>
          {isIos ? (
            <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
              Appuie sur <strong style={{ color: G.rouge }}>Partager</strong> en bas de ton navigateur, puis <strong style={{ color: G.rouge }}>Sur l'écran d'accueil</strong>
            </p>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
              Accède rapidement à Moyo depuis ton écran d'accueil - rapide, pratique et sans passer par le navigateur !
            </p>
          )}
          {!isIos && (
            <button onClick={handleInstall} style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc, border: "none", borderRadius: 50, padding: "14px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 14px rgba(192,57,43,0.35)" }}>
              Installer l'app
            </button>
          )}
          <button onClick={() => { setShowInstall(false); localStorage.setItem("moyo_install_dismissed", "1"); }} style={{ width: "100%", background: "transparent", color: "#555", border: `2px solid ${G.gris}`, borderRadius: 50, padding: "12px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
            OK
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!sessionLoaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.blanc }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>;

  // ── Mode Admin Desktop : ?admin=1 dans l'URL ──
  if (new URLSearchParams(window.location.search).get("admin") === "1") {
    return <AdminDesktopPage />;
  }
  if (page === "landing") return <>{<Landing onNav={setPage} />}{InstallBanner}</>;
  if (page === "about") return <About onBack={() => setPage("landing")} />;
  if (page === "signup") return <SignUp onNav={setPage} />;
  if (page === "login") return <Login onNav={setPage} onAuth={handleAuth} />;
  if (page === "reset-password") return <ResetPassword onNav={setPage} />;
  if (!auth) return <Landing onNav={setPage} />;
  return <div style={darkMode ? { filter: "invert(93%) hue-rotate(180deg)", minHeight: "100vh" } : {}}>
    {darkMode && <style>{`
      img, video { filter: invert(100%) hue-rotate(180deg) !important; }
      .no-invert { filter: invert(100%) hue-rotate(180deg) !important; }
      [style*="background: #C0392B"], [style*="background: rgb(192, 57, 43)"],
      [style*="background-color: #C0392B"], [style*="background: linear-gradient(135deg, rgb(192"],
      [style*="color: #C0392B"], [style*="color: rgb(192, 57, 43)"],
      [style*="stroke: #C0392B"], [style*="fill: #C0392B"] {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
    `}</style>}
    <AppShell tab={tab} setTab={(t) => {
      setTab(t);
      if (t === "messages") setUnreadCount(0);
      // ── Remise à zéro des badges au clic sur l'onglet correspondant ──
      if (t === "matches") {
        setNotifCount(0);
        try { localStorage.setItem(`moyo_matches_seen_${auth!.userId}`, new Date().toISOString()); } catch {}
      }
      if (t === "likes") setLikesReceived(0);
      if (t === "visitors") setViewsReceived(0);
    }} unreadCount={unreadCount} notifCount={notifCount} likesReceived={likesReceived} viewsReceived={viewsReceived} auth={auth} adminBadgeCount={adminBadgeCount}>
      <Suspense fallback={<LazyLoader />}>
        {tab === "discover" && <Discover auth={auth} onShowPremium={showPremium} isWide={window.innerWidth >= 768} />}
      {tab === "likes" && <LikesPage auth={auth} onShowPremium={showPremium} mode="likes" onBadgeUpdate={() => refreshBadgesRef.current?.()} />}
      {tab === "visitors" && <LikesPage auth={auth} onShowPremium={showPremium} mode="visitors" onBadgeUpdate={() => refreshBadgesRef.current?.()} />}
      {tab === "matches" && <Matches auth={auth} onShowPremium={showPremium} onNotifCount={setNotifCount} onGoMessages={(pid) => { setOpenConvPartnerId(pid || null); setTab("messages"); }} onUnmatchStart={() => { isUnmatchingRef.current = true; }} onUnmatchEnd={() => { setTimeout(() => { isUnmatchingRef.current = false; }, 2000); }} />}
      {tab === "messages" && <Messages auth={auth} onUnreadCount={setUnreadCount} onShowPremium={showPremium} initialPartnerId={openConvPartnerId} />}
      {tab === "profile" && <Profile auth={auth} onLogout={handleLogout} onShowPremium={showPremium} darkMode={darkMode} onToggleDark={() => { const v = !darkMode; setDarkMode(v); localStorage.setItem("moyo_dark", v ? "1" : "0"); }} />}
      {tab === "admin" && <AdminPinGate auth={auth} onBack={() => setTab("discover")} onBadgeCount={setAdminBadgeCount} />}
      </Suspense>
    </AppShell>
    {premiumModal && <PremiumModal reason={premiumModal} onClose={() => setPremiumModal(null)} userId={auth?.userId || ""} token={auth?.token || ""} />}
    {pendingWarning && <UserWarningModal warning={pendingWarning} onAcknowledge={acknowledgeWarning} />}
    {pendingBroadcast && !pendingWarning && <UserWarningModal warning={{ id: pendingBroadcast.id, warning_number: 0, reason: pendingBroadcast.message }} onAcknowledge={() => { localStorage.setItem(`moyo_broadcast_seen_${auth!.userId}`, new Date().toISOString()); setPendingBroadcast(null); }} />}
    {InstallBanner}
  </div>;
}
