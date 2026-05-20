import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function ResetPassword({ onNav }: { onNav: (p: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Lire le access_token dans le hash de l'URL
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const t = params.get("access_token");
    const type = params.get("type");
    if (t && type === "recovery") {
      setToken(t);
    } else {
      // Pas de token valide → rediriger vers login
      onNav("login");
    }
  }, []);

  const handleReset = async () => {
    if (password.length < 6) { setErrorMsg("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== confirm) { setErrorMsg("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    const res = await sb.updatePassword(token, password);
    if (res?.error) {
      setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
    } else {
      setToast({ msg: "Mot de passe modifié avec succès !", type: "success" });
      setTimeout(() => { onNav("login"); }, 2000);
    }
    setLoading(false);
  };

  return (
    <AuthLayout onBack={() => onNav("landing")}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}>
          <span>Mo</span><span style={{ color: G.or }}>yo</span>
        </div>
        <h2 style={{  fontSize: "1.5rem", fontWeight: 700, marginTop: 8 }}>Nouveau mot de passe</h2>
        <p style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>Choisis un nouveau mot de passe sécurisé</p>
      </div>
      <Input label="Nouveau mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" icon="lock" hint="Au moins 6 caractères" />
      <Input label="Confirmer le mot de passe" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répète ton mot de passe" icon="lock" />
      <Btn variant="primary" onClick={handleReset} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!password || !confirm}>
        Changer mon mot de passe ✓
      </Btn>
    </AuthLayout>
  );
}

// Composant compteur animé
function StatCounter({ target, suffix, label, svg }: { target: number; suffix: string; label: string; svg: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        const duration = 1800;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  const display = target >= 1000
    ? (count >= 1000 ? `${Math.floor(count / 1000)} ${Math.floor((count % 1000) / 100) > 0 ? Math.floor((count % 1000) / 100) + "00" : "000"}` : count.toString())
    : count.toString();

  return (
    <div ref={ref} className="stat" style={{ background: G.creme, borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{svg}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: G.rouge, marginBottom: 2 }}>
        {target >= 1000 ? `${Math.floor(count / 1000)} ${String(count % 1000).padStart(3,'0')}${suffix}` : `${count}${suffix}`}
      </div>
      <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// Hook pour détecter la largeur d'écran
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 768);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

