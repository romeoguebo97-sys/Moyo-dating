import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://mcswcapxpruiffzrxfvl.supabase.co";
const SUPABASE_KEY = "sb_publishable_nx44ipF3_X98flDVXxBZ5A_aztvDdgN";
const APP_URL = "https://moyo-congo-appe.vercel.app";

const VILLES = [
  "Brazzaville","Pointe-Noire","Dolisie","Nkayi","Owando",
  "Ouesso","Impfondo","Sibiti","Djambala","Kinkala",
  "Ewo","Gamboma","Madingou","Mossaka","Odziba",
  "──────────────",
  "Diaspora Europe","Diaspora Amérique","Diaspora Asie / Océanie","Diaspora Afrique (autre pays)",
];

const RELIGIONS = [
  "Chrétien(ne)", "Catholique", "Protestant(e)", "Évangélique",
  "Croyant du message", "Musulman(e)", "Autre", "Non pratiquant(e)",
];
const CONTACT_PATTERNS = [
  /(\+?[\d][\s\-.]?){8,}/,
  /[\w.-]+@[\w.-]+\.\w+/,
  /(whatsapp|telegram|watsap|snapchat)/i,
  /(facebook|instagram|tiktok|twitter)/i,
  /(mon num|mon numero|mon numéro|appelle.?moi|contacte.?moi)/i,
];
const hasContactInfo = (text: string): boolean => CONTACT_PATTERNS.some(p => p.test(text));
const FREE_LIMITS = { likes: 5, messages: 5 };

const G = {
  rouge: "#C0392B", rougeDark: "#922B21", or: "#D4A843",
  vert: "#1A5C3A", creme: "#F0F1F5", cremeDark: "#E4E6ED",
  brun: "#2C1A0E", brunLight: "#5C3D2A", blanc: "#FFFFFF", gris: "#E8DDD0",
};

type Auth = { token: string; userId: string; name: string; email: string; isPremium: boolean; isAdmin: boolean };
type Profile = { id: string; name: string; age: number; city: string; gender: string; bio: string; religion?: string; photo_url?: string | null; is_premium: boolean; is_admin?: boolean; is_visible?: boolean };
type Match = { id: string; user1: string; user2: string; partner?: Profile; lastMsg?: Message; unreadCount?: number };
type Message = { id?: string; match_id: string; sender_id: string; content: string; is_read: boolean; created_at?: string };
type ToastState = { msg: string; type?: "success" | "error" | "premium" } | null;

const sb = {
  h: (token?: string) => ({
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${token || SUPABASE_KEY}`,
    "Prefer": "return=representation",
  }),
  async signUp(email: string, password: string, metadata: object) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: this.h(),
      body: JSON.stringify({ email, password, data: metadata }),
    });
    return r.json();
  },
  async signIn(email: string, password: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.h(),
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(token: string) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: this.h(token) });
  },
  async resetPassword(email: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST", headers: this.h(),
      body: JSON.stringify({ email, redirect_to: `${APP_URL}/reset-password` }),
    });
    return r.json();
  },
  async query<T>(token: string, table: string, params = ""): Promise<T[]> {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: this.h(token) });
    const data = await r.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  },
  async insert<T>(token: string, table: string, data: object): Promise<T[]> {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: this.h(token), body: JSON.stringify(data),
    });
    const res = await r.json().catch(() => null);
    return Array.isArray(res) ? res : res ? [res] : [];
  },
  async update(token: string, table: string, id: string, data: object) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: this.h(token), body: JSON.stringify(data),
    });
    return r.json().catch(() => null);
  },
  async upsert(token: string, table: string, data: object) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.h(token), "Prefer": "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(data),
    });
    return r.json().catch(() => null);
  },
  async delete(token: string, table: string, params: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { method: "DELETE", headers: this.h(token) });
  },
  async rpc(token: string, fn: string) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: this.h(token), body: JSON.stringify({}),
    });
    return r.json().catch(() => null);
  },
  async updatePassword(accessToken: string, newPassword: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: { ...this.h(accessToken), "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({ password: newPassword }),
    });
    return r.json().catch(() => null);
  },
  async uploadPhoto(token: string, userId: string, file: File): Promise<string | null> {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${ext}`;
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": file.type || "image/jpeg", "x-upsert": "true", "Cache-Control": "3600" },
        body: file,
      });
      if (!r.ok) return null;
      return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
    } catch { return null; }
  },
  async markMessagesRead(token: string, matchId: string, userId: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/messages?match_id=eq.${matchId}&sender_id=neq.${userId}&is_read=eq.false`, {
      method: "PATCH", headers: this.h(token), body: JSON.stringify({ is_read: true }),
    });
  },
  async recordVisit(token: string, visitorId: string, visitedId: string) {
    if (visitorId === visitedId) return;
    await fetch(`${SUPABASE_URL}/rest/v1/profile_visits`, {
      method: "POST",
      headers: { ...this.h(token), "Prefer": "return=minimal" },
      body: JSON.stringify({ visitor_id: visitorId, visited_id: visitedId }),
    });
  },
};

const GLOBAL_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  html,body,#root{overflow-x:hidden;max-width:100vw;min-height:100vh}
  @media(min-width:520px){body{background-color:#EDE5D8;background-image:radial-gradient(circle,rgba(192,57,43,0.06) 1px,transparent 1px),radial-gradient(circle,rgba(212,168,67,0.05) 1px,transparent 1px);background-size:30px 30px,50px 50px}}
  input,select,textarea,button{font-family:inherit;box-sizing:border-box;max-width:100%}
  input,select,textarea{display:block}
  img{max-width:100%;height:auto}
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  .fu1{animation:fadeUp 0.7s 0.1s both ease-out}
  .fu2{animation:fadeUp 0.7s 0.25s both ease-out}
  .fu3{animation:fadeUp 0.7s 0.4s both ease-out}
  .fu4{animation:fadeUp 0.7s 0.55s both ease-out}
  .fu5{animation:fadeUp 0.7s 0.7s both ease-out}
  .fu6{animation:fadeUp 0.7s 0.85s both ease-out}
  .heart{animation:float 3s ease-in-out infinite;display:inline-block}
  .btn-p{transition:all 0.2s ease!important}
  .btn-p:hover{transform:translateY(-3px)!important;box-shadow:0 14px 36px rgba(192,57,43,0.5)!important}
  .btn-p:active{transform:translateY(0) scale(0.97)!important}
  .btn-o{transition:all 0.2s ease!important;border:2px solid #1a1a1a!important}
  .btn-o:hover{background:#1a1a1a!important;color:#ffffff!important;transform:translateY(-2px)!important}
  .btn-o:active{transform:scale(0.97)!important}
  .stat:hover{transform:translateY(-5px) scale(1.04)!important;box-shadow:0 10px 28px rgba(44,26,14,0.14)!important}
  .stat{transition:all 0.25s ease!important}
  .store:hover{transform:translateY(-3px);opacity:0.92}
  .store{transition:all 0.22s ease!important}
  .fb:hover{opacity:0.88;transform:translateY(-2px)}
  .fb{transition:all 0.2s!important}
  .nav-link:hover{color:#C0392B!important}
  .nav-link{transition:color 0.2s!important}
  .card-hover{transition:transform 0.18s ease,box-shadow 0.18s ease!important}
  .card-hover:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px rgba(44,26,14,0.12)!important}
  .card-hover:active{transform:scale(0.98)!important}
  .trust-card{transition:transform 0.22s ease,box-shadow 0.22s ease!important}
  .trust-card:hover{transform:translateY(-6px)!important;box-shadow:0 16px 40px rgba(44,26,14,0.13)!important}
  .testi-card{transition:transform 0.22s ease,box-shadow 0.22s ease!important}
  .testi-card:hover{transform:translateY(-5px)!important;box-shadow:0 14px 36px rgba(44,26,14,0.12)!important}
  .social-icon{transition:transform 0.18s ease,opacity 0.18s ease!important}
  .social-icon:hover{transform:translateY(-3px) scale(1.12)!important;opacity:0.85!important}
  .profile-card{transition:transform 0.18s ease,box-shadow 0.18s ease!important}
  .profile-card:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(44,26,14,0.13)!important}
  .profile-card:active{transform:scale(0.99)!important}
  .action-card{transition:transform 0.15s ease,box-shadow 0.15s ease,background 0.15s ease!important}
  .action-card:hover{transform:translateX(3px)!important;box-shadow:0 4px 16px rgba(0,0,0,0.08)!important}
  .action-card:active{transform:scale(0.98)!important}
  .icon-btn{transition:transform 0.15s ease,opacity 0.15s ease!important}
  .icon-btn:hover{transform:scale(1.08)!important;opacity:0.9!important}
  .icon-btn:active{transform:scale(0.93)!important}
  @media(min-width:768px){
    .landing-hero{display:grid!important;grid-template-columns:1fr 1fr!important;gap:48px!important;align-items:center!important;text-align:left!important;max-width:1100px!important;margin:0 auto!important;padding:60px 40px 40px!important}
    .landing-hero-text{text-align:left!important}
    .landing-hero-btns{justify-content:flex-start!important}
    .landing-stats{max-width:900px!important;margin:0 auto!important;padding:0 40px 0!important;grid-template-columns:repeat(3,1fr)!important}
    .landing-sections{max-width:1100px!important;margin:0 auto!important;padding:0 40px!important}
    .trust-grid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:20px!important}
    .testi-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:20px!important}
    .steps-layout{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:32px!important}
    .step-connector{display:block!important}
    .nav-inner{max-width:1100px!important;margin:0 auto!important;padding:0 40px!important;width:100%!important}
  }
`;

function Btn({ children, variant = "primary", onClick, style = {}, disabled = false, loading = false }: {
  children: React.ReactNode; variant?: string; onClick?: () => void;
  style?: React.CSSProperties; disabled?: boolean; loading?: boolean;
}) {
  const base: React.CSSProperties = {
    border: "none", borderRadius: 50, padding: "13px 28px", fontWeight: 600,
    fontSize: "0.93rem", cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.65 : 1, display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.18s ease", ...style,
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.3)" },
    gold: { background: `linear-gradient(135deg,${G.or},#B8860B)`, color: G.brun },
    outline: { background: "transparent", color: G.brun, border: `2px solid ${G.brun}` },
    ghost: { background: "rgba(44,26,14,0.06)", color: G.brun },
    danger: { background: "#e74c3c", color: G.blanc },
    white: { background: G.blanc, color: G.rouge },
  };
  return <button style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled || loading}>{loading ? "⏳" : children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, icon, error, hint }: {
  label?: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; icon?: string; error?: string; hint?: string;
}) {
  const [focus, setFocus] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  return (
    <div style={{ marginBottom: 18, width: "100%" }}>
      {label && <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>{label}</label>}
      <div style={{ position: "relative", width: "100%" }}>
        {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5, pointerEvents: "none", zIndex: 1 }}>{icon}</span>}
        <input
          type={isPwd ? (showPwd ? "text" : "password") : type}
          value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: icon ? (isPwd ? "13px 42px 13px 40px" : "13px 14px 13px 40px") : (isPwd ? "13px 42px 13px 14px" : "13px 14px"),
            border: `2px solid ${error ? "#e74c3c" : focus ? G.or : G.gris}`,
            borderRadius: 12, fontSize: "0.93rem", background: G.blanc,
            color: G.brun, outline: "none", transition: "border-color 0.2s", display: "block",
          }}
        />
        {isPwd && <span onClick={() => setShowPwd(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6, zIndex: 1 }}>{showPwd ? "🙈" : "👁️"}</span>}
      </div>
      {hint && !error && <p style={{ color: G.brunLight, fontSize: "0.75rem", marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Toast({ msg, type = "success", onClose }: { msg: string; type?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? "#e74c3c" : type === "premium" ? `linear-gradient(135deg,${G.or},#B8860B)` : G.vert;
  return <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: bg, color: type === "premium" ? G.brun : G.blanc, padding: "12px 22px", borderRadius: 50, fontSize: "0.85rem", fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", maxWidth: "88vw", textAlign: "center" }}>{type === "error" ? "❌" : type === "premium" ? "⭐" : "✅"} {msg}</div>;
}

function ErrorModal({ msg, onClose }: { msg: string; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>❌</div>
        <p style={{ fontSize: "0.88rem", color: G.brun, lineHeight: 1.6, marginBottom: 22, fontWeight: 500 }}>{msg}</p>
        <Btn variant="primary" onClick={onClose} style={{ width: "100%" }}>OK</Btn>
      </div>
    </div>
  );
}

function Avatar({ url, gender, size = 54, border = false, premium = false }: { url?: string | null; gender?: string; size?: number; border?: boolean; premium?: boolean }) {
  return <div style={{ position: "relative", flexShrink: 0 }}><div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: border ? `3px solid ${G.rouge}` : "none", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45 }}>{url ? <img src={url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (gender === "Femme" ? "👩🏿" : "👨🏿")}</div>{premium && <div style={{ position: "absolute", bottom: -2, right: -2, background: G.or, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", border: `2px solid ${G.blanc}` }}>⭐</div>}</div>;
}

function PremiumModal({ onClose, reason }: { onClose: () => void; reason: string }) {
  const avantages = [
    { icon: "💬", titre: "Messages illimités", desc: `Discute sans limite (gratuit = ${FREE_LIMITS.messages}/match)` },
    { icon: "📞", titre: "Partage tes coordonnées", desc: "Envoie ton numéro, email librement" },
    { icon: "❤️", titre: "Likes illimités", desc: `Like sans limite (gratuit = ${FREE_LIMITS.likes}/jour)` },
    { icon: "👀", titre: "Voir qui t'a liké", desc: "Découvre tes admirateurs secrets" },
    { icon: "⭐", titre: "Profil mis en avant", desc: "Apparais en premier dans Découvrir" },
    { icon: "💛", titre: "Super Like", desc: "Notifie spécialement quelqu'un" },
    { icon: "✓✓", titre: "Messages lus", desc: "Vois quand tes messages ont été lus" },
    { icon: "🎯", titre: "Filtres avancés", desc: "Filtre par ville, âge, situation" },
    { icon: "👁️", titre: "Visiteurs du profil", desc: "Vois toutes les personnes qui t'ont consulté" },
    { icon: "🔒", titre: "Profil vérifié", desc: "Badge de confiance visible" },
    { icon: "🎧", titre: "Support prioritaire", desc: "Assistance rapide 7j/7" },
  ];
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div style={{ background: G.blanc, borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", padding: "32px 20px 40px" }}><div style={{ textAlign: "center", marginBottom: 24 }}><div style={{ fontSize: "2.5rem", marginBottom: 8 }}>⭐</div><h2 style={{  fontSize: "1.7rem", fontWeight: 700, marginBottom: 8 }}>Passe à Premium</h2>{reason && <div style={{ background: "rgba(192,57,43,0.08)", border: `1px solid ${G.rouge}`, borderRadius: 12, padding: "10px 16px", fontSize: "0.82rem", color: G.rouge, fontWeight: 600, marginBottom: 12 }}>{reason}</div>}<div style={{  fontSize: "2rem", fontWeight: 700, color: G.or }}>3 500 FCFA<span style={{ fontSize: "0.9rem", color: G.brunLight, fontWeight: 400 }}>/mois</span></div><div style={{ fontSize: "0.75rem", color: G.brunLight, marginTop: 4 }}>MTN MoMo · Airtel Money · Orange Money · Carte bancaire</div></div><div style={{ background: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(192,57,43,0.08))", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: "0.84rem", color: G.brunLight, lineHeight: 1.6, textAlign: "center", fontStyle: "italic" }}>✨ Premium t'aide à discuter plus librement et à augmenter tes chances de rencontre sérieuse.</div><h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: "0.88rem", textTransform: "uppercase", letterSpacing: "0.05em", color: G.brunLight }}>Tout ce que tu obtiens :</h3>{avantages.map(a => <div key={a.titre} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${G.gris}` }}><div style={{ fontSize: "1.3rem", width: 30, textAlign: "center", flexShrink: 0 }}>{a.icon}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.titre}</div><div style={{ fontSize: "0.78rem", color: G.brunLight }}>{a.desc}</div></div><div style={{ color: "#27ae60", fontWeight: 700 }}>✓</div></div>)}<Btn variant="gold" onClick={() => {}} style={{ width: "100%", padding: "16px", fontSize: "1rem", marginTop: 20, marginBottom: 12 }}>Activer Premium — 3 500 FCFA/mois</Btn><div style={{ textAlign: "center" }}><button onClick={onClose} style={{ fontSize: "0.88rem", color: G.brunLight, cursor: "pointer", fontWeight: 600, padding: "12px 32px", display: "inline-block", borderRadius: 50, border: `2px solid ${G.gris}`, background: G.blanc, width: "100%", transition: "all 0.2s" }} onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = G.brunLight; (e.currentTarget as HTMLButtonElement).style.color = G.brun; }} onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = G.gris; (e.currentTarget as HTMLButtonElement).style.color = G.brunLight; }}>Non merci, plus tard</button></div></div></div>;
}

function ResetPassword({ onNav }: { onNav: (p: string) => void }) {
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
      setToast({ msg: "Mot de passe modifié avec succès ! 🎉", type: "success" });
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
        <p style={{ color: G.brunLight, fontSize: "0.85rem", marginTop: 4 }}>Choisis un nouveau mot de passe sécurisé</p>
      </div>
      <Input label="Nouveau mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" icon="🔒" hint="Au moins 6 caractères" />
      <Input label="Confirmer le mot de passe" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répète ton mot de passe" icon="🔒" />
      <Btn variant="primary" onClick={handleReset} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!password || !confirm}>
        Changer mon mot de passe ✓
      </Btn>
    </AuthLayout>
  );
}

function Landing({ onNav }: { onNav: (p: string) => void }) {
  const NEW_FB = "https://www.facebook.com/share/1HssYavG19/?mibextid=wwXIfr";
  const svgFb = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  const svgIg = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  const svgTk = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>;

  return (
    <div style={{ minHeight: "100vh", background: G.creme, overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ── */}
      <nav style={{ background: G.blanc, boxShadow: "0 2px 16px rgba(44,26,14,0.07)", flexShrink: 0 }}>
        <div className="nav-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px" }}>
          <div style={{  fontSize: "1.9rem", color: G.rouge, fontWeight: 700, letterSpacing: "-0.03em", display: "inline-flex", alignItems: "baseline", gap: 0 }}>
            <span>Mo</span><span style={{ color: G.or }}>yo</span>
          </div>
          <span onClick={() => onNav("about")} style={{ fontSize: "0.85rem", fontWeight: 600, color: G.blanc, cursor: "pointer", padding: "9px 22px", borderRadius: 50, background: G.rouge, boxShadow: "0 4px 14px rgba(192,57,43,0.3)", transition: "all 0.2s", display: "inline-block", letterSpacing: "0.01em" }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = G.rougeDark; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(192,57,43,0.4)"; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = G.rouge; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(192,57,43,0.3)"; }}>À propos</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(150deg,${G.creme} 0%,#F0E8D8 60%,rgba(26,92,58,0.12) 100%)`, overflow: "hidden", position: "relative" }}>
        {/* Cercle déco fond */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 520, height: 520, borderRadius: "50%", border: `2px solid rgba(212,168,67,0.25)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 20, right: -10, width: 420, height: 420, borderRadius: "50%", background: "rgba(212,168,67,0.08)", pointerEvents: "none" }} />

        <div className="landing-hero" style={{ padding: "52px 24px 0", textAlign: "center", alignItems: "flex-end" }}>

          {/* ── Texte gauche ── */}
          <div className="landing-hero-text fu1" style={{ paddingBottom: 52 }}>
            <div style={{ display: "inline-block", background: "rgba(212,168,67,0.15)", border: `1px solid ${G.or}`, padding: "6px 16px", borderRadius: 50, fontSize: "0.73rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 22, color: G.brunLight }}>
              Site de rencontres Congolais
            </div>
            <h1 className="fu2" style={{  fontSize: "clamp(2.4rem,5.5vw,3.8rem)", lineHeight: 1.08, fontWeight: 700, marginBottom: 20, color: G.brun }}>
              Trouve ton{" "}
              <span className="heart" style={{ color: G.rouge, fontStyle: "italic" }}>âme sœur</span>
              <br />au Congo
            </h1>
            <p className="fu3" style={{ fontSize: "1rem", lineHeight: 1.8, color: G.brunLight, marginBottom: 36, maxWidth: 440 }}>
              Moyo connecte les Congolais à la recherche d'une relation sincère et durable.
              Brazzaville, Pointe-Noire, Dolisie et toute la diaspora.
            </p>
            <div className="fu4 landing-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
              <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 36px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.35)", cursor: "pointer" }}>
                Créer mon profil gratuit
              </button>
              <button className="btn-o" onClick={() => onNav("login")} style={{ border: "2px solid #1a1a1a", borderRadius: 50, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", background: G.blanc, color: "#1a1a1a", cursor: "pointer" }}>
                Me connecter
              </button>
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

              {/* Téléphone gauche — légèrement incliné */}
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
                  {/* Écran — profil Moyo */}
                  <div style={{ background: G.creme, borderRadius: 20, overflow: "hidden", height: 280 }}>
                    {/* Header app */}
                    <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "14px 12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{  fontSize: "0.9rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                      <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: G.blanc }}>💬</div>
                    </div>
                    {/* Profil card */}
                    <div style={{ padding: "12px 10px" }}>
                      <div style={{ width: "100%", height: 110, borderRadius: 14, background: `linear-gradient(160deg,#C47A4A,#8B4513)`, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                        {/* Silhouette abstraite — cercle + ovale */}
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)", marginBottom: 0, position: "absolute", top: 18 }} />
                        <div style={{ width: 54, height: 32, borderRadius: "50% 50% 0 0", background: "rgba(255,255,255,0.18)", position: "absolute", bottom: 0 }} />
                        {/* Badge premium */}
                        <div style={{ position: "absolute", top: 8, right: 8, background: G.or, borderRadius: 6, padding: "2px 6px", fontSize: "0.45rem", fontWeight: 700, color: G.brun }}>⭐ Premium</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.72rem", color: G.brun, marginBottom: 2 }}>Sandrine, 27</div>
                      <div style={{ fontSize: "0.6rem", color: G.brunLight, marginBottom: 8 }}>📍 Brazzaville</div>
                      {/* Like button */}
                      <div style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 20, padding: "6px", textAlign: "center", fontSize: "0.6rem", color: G.blanc, fontWeight: 600 }}>❤️ Liker</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Téléphone central — principal, droit */}
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
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: G.rouge, marginBottom: 3 }}>💞 Nouveau match !</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <div style={{ fontSize: "0.6rem", color: G.brun, fontWeight: 500 }}>Junior t'a liké aussi</div>
                      </div>
                    </div>
                    {/* Profil principal */}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ width: "100%", height: 120, borderRadius: 14, background: `linear-gradient(160deg,#7A4A20,#3D1A05)`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.22)", position: "absolute", top: 16 }} />
                        <div style={{ width: 64, height: 36, borderRadius: "50% 50% 0 0", background: "rgba(255,255,255,0.16)", position: "absolute", bottom: 0 }} />
                        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.68rem", color: G.blanc }}>Faïda, 25</div>
                          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.7)" }}>📍 Pointe-Noire</div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <div style={{ flex: 1, background: G.gris, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.55rem", color: G.brunLight }}>✕</div>
                        <div style={{ flex: 2, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.58rem", color: G.blanc, fontWeight: 600 }}>❤️ Liker</div>
                        <div style={{ flex: 1, background: `rgba(212,168,67,0.15)`, border: `1px solid ${G.or}`, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.55rem", color: G.brunLight }}>⭐</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Téléphone droit — incliné */}
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
                      <div style={{ alignSelf: "flex-start", background: G.blanc, borderRadius: "10px 10px 10px 2px", padding: "5px 8px", fontSize: "0.55rem", color: G.brun, maxWidth: "80%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Bonsoir Lionel 😊</div>
                      <div style={{ alignSelf: "flex-end", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: "10px 10px 2px 10px", padding: "5px 8px", fontSize: "0.55rem", color: G.blanc, maxWidth: "80%" }}>Bonsoir ! Comment tu vas ?</div>
                      <div style={{ alignSelf: "flex-start", background: G.blanc, borderRadius: "10px 10px 10px 2px", padding: "5px 8px", fontSize: "0.55rem", color: G.brun, maxWidth: "80%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Très bien merci ❤️</div>
                      <div style={{ fontSize: "0.5rem", color: G.brunLight, textAlign: "center", marginTop: 4 }}>Match depuis 2 jours</div>
                      {/* Input message */}
                      <div style={{ background: G.blanc, borderRadius: 14, padding: "5px 8px", display: "flex", alignItems: "center", gap: 4, border: `1px solid ${G.gris}`, marginTop: 4 }}>
                        <div style={{ flex: 1, fontSize: "0.5rem", color: "#ccc" }}>Un message...</div>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: G.blanc }}>➤</div>
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
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: G.brun }}>850+ couples</div>
                <div style={{ fontSize: "0.65rem", color: G.brunLight }}>formés sur Moyo</div>
              </div>
            </div>
            {/* Bulle 12 000+ */}
            <div style={{ position: "absolute", top: 30, left: -20, background: G.blanc, borderRadius: 18, padding: "10px 14px", boxShadow: "0 10px 30px rgba(44,26,14,0.12)", display: "flex", alignItems: "center", gap: 8, zIndex: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>🇨🇬</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.8rem", color: G.brun }}>12 000+ membres</div>
                <div style={{ fontSize: "0.62rem", color: G.brunLight }}>Congo & diaspora</div>
              </div>
            </div>
            {/* Badge vérifiés */}
            <div style={{ position: "absolute", top: 160, right: -20, background: `linear-gradient(135deg,${G.or},#B8860B)`, borderRadius: 50, padding: "6px 14px", boxShadow: "0 6px 20px rgba(212,168,67,0.4)", display: "flex", alignItems: "center", gap: 5, zIndex: 4 }}>
              <span style={{ fontSize: "0.68rem", color: G.brun }}>✓</span>
              <span style={{ fontWeight: 700, fontSize: "0.7rem", color: G.brun }}>Profils vérifiés</span>
            </div>

          </div>

        </div>
      </div>
      <style>{`@media(min-width:768px){#hero-img-desktop{display:flex!important}}`}</style>

      {/* ── STATS ── */}
      <div style={{ background: G.blanc, padding: "28px 24px", borderBottom: `1px solid ${G.gris}` }}>
        <div className="landing-stats fu5" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          {[
            ["12 000+", "Membres inscrits", "👥"],
            ["850+", "Couples formés", "💞"],
            ["19", "Villes & diasporas", "📍"],
          ].map(([n, l, icon]) => (
            <div key={l} className="stat" style={{ background: G.creme, borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{icon}</div>
              <div style={{  fontSize: "1.4rem", fontWeight: 700, color: G.rouge, marginBottom: 2 }}>{n}</div>
              <div style={{ fontSize: "0.7rem", color: G.brunLight, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONFIANCE ── */}
      <div style={{ padding: "48px 24px" }}>
        <div className="landing-sections">
          <h2 className="fu2" style={{  fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, textAlign: "center", marginBottom: 8, color: G.brun }}>
            Pourquoi faire confiance à <span style={{ color: G.rouge }}>Moyo</span> ?
          </h2>
          <p style={{ textAlign: "center", color: G.brunLight, fontSize: "0.88rem", marginBottom: 32 }}>
            Une plateforme pensée pour des rencontres sincères et sécurisées
          </p>
          <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { icon: "🛡️", iconBg: G.rouge, titre: "Profils modérés", desc: "Les profils sont surveillés afin de limiter les faux comptes." },
              { icon: "🔔", iconBg: G.or, titre: "Signalement rapide", desc: "Signale rapidement un comportement inapproprié." },
              { icon: "👥", iconBg: G.vert, titre: "Communauté congolaise", desc: "Des membres du Congo et de la diaspora." },
              { icon: "❤️", iconBg: G.rouge, titre: "Respect & sécurité", desc: "Des échanges sérieux et respectueux." },
            ].map(c => (
              <div key={c.titre} className="trust-card" style={{ background: G.blanc, borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 4px 20px rgba(44,26,14,0.07)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 16px" }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 8, color: G.brun }}>{c.titre}</div>
                <div style={{ fontSize: "0.8rem", color: G.brunLight, lineHeight: 1.6 }}>{c.desc}</div>
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
              <span style={{ color: G.or, fontSize: "0.78rem" }}>★★★★★</span>
              <span style={{ color: G.brunLight, fontSize: "0.75rem", fontWeight: 500 }}>Histoires vraies</span>
            </div>
            <h2 style={{  fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, color: G.brun, marginBottom: 10 }}>
              Des histoires qui commencent sur <span style={{ color: G.rouge }}>Moyo</span> ❤️
            </h2>
            <p style={{ color: G.brunLight, fontSize: "0.9rem", maxWidth: 460, margin: "0 auto" }}>
              Chaque jour, de nouveaux couples se forment au Congo et dans la diaspora
            </p>
          </div>
          {/* Cartes témoignages */}
          <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {[
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
            ].map((t, i) => (
              <div key={t.noms} className="testi-card" style={{
                background: G.blanc,
                border: `1px solid ${G.gris}`,
                boxShadow: "0 4px 24px rgba(44,26,14,0.07)",
                borderRadius: 24,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Accent couleur */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: t.accent, borderRadius: "24px 0 0 24px" }} />
                {/* Guillemet décoratif */}
                <div style={{ position: "absolute", top: 16, right: 20,  fontSize: "5rem", color: "rgba(44,26,14,0.06)", lineHeight: 1, userSelect: "none" }}>"</div>
                {/* Étoiles */}
                <div style={{ display: "flex", gap: 3, marginBottom: 16, paddingLeft: 12 }}>
                  {[...Array(t.stars)].map((_, si) => (
                    <span key={si} style={{ color: G.or, fontSize: "0.85rem" }}>★</span>
                  ))}
                </div>
                {/* Texte */}
                <p style={{ fontSize: "0.92rem", color: G.brunLight, lineHeight: 1.8, fontStyle: "italic", marginBottom: 22, paddingLeft: 12, }}>
                  "{t.temoignage}"
                </p>
                {/* Profil */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 12 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg,${G.cremeDark},${G.creme})`,
                    border: `2px solid ${t.accent}`,
                    boxShadow: `0 4px 14px rgba(44,26,14,0.12), 0 0 0 3px rgba(212,168,67,0.15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                       fontWeight: 700,
                      fontSize: "1rem", color: G.brun, letterSpacing: "0.02em",
                    }}>{t.initiales}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: G.brun }}>{t.noms}</div>
                    <div style={{ fontSize: "0.72rem", color: G.brunLight, marginTop: 2 }}>📍 {t.lieu}</div>
                    <div style={{ fontSize: "0.7rem", color: t.accent, fontWeight: 600, marginTop: 2 }}>💍 {t.since}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* CTA sous les témoignages */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: G.brunLight, fontSize: "0.82rem", marginBottom: 16 }}>Rejoins des milliers de Congolais qui ont trouvé l'amour</p>
            <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 40px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 8px 28px rgba(192,57,43,0.4)", cursor: "pointer" }}>
              Créer mon profil — c'est gratuit ❤️
            </button>
          </div>
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div style={{ padding: "48px 24px", background: `linear-gradient(160deg,${G.creme},rgba(26,92,58,0.06))` }}>
        <div className="landing-sections">
          <h2 style={{  fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, textAlign: "center", marginBottom: 8, color: G.brun }}>
            Comment <span style={{ color: G.rouge }}>ça marche</span> ?
          </h2>
          <p style={{ textAlign: "center", color: G.brunLight, fontSize: "0.88rem", marginBottom: 36 }}>3 étapes simples pour trouver l'amour</p>
          <div className="steps-layout" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { num: "1", icon: "👤", iconBg: G.rouge, titre: "Crée ton profil", desc: "Inscris-toi gratuitement et complète ton profil." },
              { num: "2", icon: "❤️", iconBg: G.or, titre: "Découvre des célibataires", desc: "Parcours les profils compatibles." },
              { num: "3", icon: "💬", iconBg: G.vert, titre: "Discute après un match", desc: "Échange en toute sécurité après un like mutuel." },
            ].map((s, i) => (
              <div key={s.num} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 0", borderBottom: i < 2 ? `1px dashed ${G.gris}` : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0, boxShadow: `0 6px 20px rgba(44,26,14,0.15)` }}>{s.icon}</div>
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: G.brun, display: "flex", alignItems: "center", justifyContent: "center", color: G.blanc, fontSize: "0.75rem", fontWeight: 700 }}>{s.num}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: G.brun }}>{s.titre}</div>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: G.brunLight, lineHeight: 1.6 }}>{s.desc}</p>
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
              Créer mon profil gratuit
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
            <a href="javascript:void(0)" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="Instagram">{svgIg}</a>
            <a href="javascript:void(0)" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="TikTok">{svgTk}</a>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {["À propos", "Confidentialité", "Conditions d'utilisation", "Contact"].map(l => (
              <span key={l} onClick={l === "À propos" ? () => onNav("about") : undefined} style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", cursor: l === "À propos" ? "pointer" : "default" }}
                onMouseOver={e => { if(l === "À propos") (e.target as HTMLElement).style.color = G.or; }}
                onMouseOut={e => { if(l === "À propos") (e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
              >{l}</span>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>📍 6 rue Paul Valéry, 77000 Melun, France</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}


function About({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: G.creme }}>
      <div style={{ background: `linear-gradient(160deg,${G.vert},#0D2E1C)`, padding: "24px 24px 40px" }}>
        <div onClick={onBack} style={{ cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(192,57,43,0.4)", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem", fontWeight: 600 }}>Retour</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{  fontSize: "2.5rem", color: G.blanc, fontWeight: 700, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>Le premier site de rencontres congolais</p>
        </div>
      </div>
      <div style={{ padding: "0 20px 60px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginTop: -20, boxShadow: "0 8px 32px rgba(44,26,14,0.1)", marginBottom: 16 }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>❤️</div>
          <h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginBottom: 10 }}>Notre mission</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: G.brunLight }}>
            <strong>Moyo</strong> (qui signifie "cœur" en swahili) est le premier site de rencontres dédié aux Congolais. Notre mission est simple : créer des rencontres sincères et durables entre Congolais, qu'ils soient au pays ou dans la diaspora.
          </p>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: G.brunLight, marginTop: 10 }}>
            Nous croyons que chaque Congolais mérite de trouver l'amour dans un espace sûr, respectueux et adapté à notre culture et nos valeurs.
          </p>
        </div>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>💡</div>
          <h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>Conseils pour bien rencontrer</h2>
          {[
            { icon: "📸", titre: "Mets une vraie photo", desc: "Les profils avec une photo reçoivent 5x plus de messages. Utilise une photo récente et souriante." },
            { icon: "✍️", titre: "Remplis bien ta bio", desc: "Parle de tes passions, tes valeurs. Une bio sincère attire les bonnes personnes." },
            { icon: "💬", titre: "Prends le temps de discuter", desc: "Ne te précipite pas. Apprends à connaître la personne avant de proposer une rencontre." },
            { icon: "🔒", titre: "Protège tes informations", desc: "Ne partage pas ton numéro trop vite. Vérifie que la personne est sérieuse." },
            { icon: "🚨", titre: "Signale les faux profils", desc: "Si tu suspectes une arnaque, utilise le bouton Signaler le profil. Tu protèges toute la communauté." },
            { icon: "🤝", titre: "Sois respectueux(se)", desc: "Traite les autres comme tu voudrais être traité(e)." },
          ].map(c => (
            <div key={c.titre} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${G.gris}` }}>
              <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 3 }}>{c.titre}</div>
                <div style={{ fontSize: "0.82rem", color: G.brunLight, lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>🌟</div>
          <h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>Nos services</h2>
          {[
            { icon: "💞", titre: "Rencontres en ligne", desc: "Trouve ton âme sœur parmi des profils vérifiés.", badge: "Gratuit" },
            { icon: "⭐", titre: "Abonnement Premium", desc: "Likes illimités, messages illimités, voir qui t'a liké et bien plus.", badge: "3 500 FCFA/mois" },
            { icon: "💍", titre: "Accompagnement mariage", desc: "Nous t'accompagnons dans l'organisation de ta cérémonie congolaise.", badge: "Sur demande" },
            { icon: "🤵", titre: "Mise en relation VIP", desc: "Service personnalisé et discret dans ta recherche de l'âme sœur.", badge: "Premium" },
            { icon: "📋", titre: "Conseil relationnel", desc: "Nos conseillers t'aident à rédiger ton profil et te guident.", badge: "Bientôt" },
          ].map(s => (
            <div key={s.titre} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${G.gris}` }}>
              <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.titre}</div>
                  <div style={{ background: "rgba(212,168,67,0.15)", border: `1px solid ${G.or}`, borderRadius: 50, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 600, color: G.brunLight, marginLeft: 8 }}>{s.badge}</div>
                </div>
                <div style={{ fontSize: "0.82rem", color: G.brunLight, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 20, padding: "24px", marginBottom: 16, color: G.blanc }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>💍</div>
          <h2 style={{  fontSize: "1.3rem", fontWeight: 700, marginBottom: 10 }}>Accompagnement mariage congolais</h2>
          {["Organisation du mariage traditionnel et civil (Possibilité de préfinancement)", "Coordination de la cérémonie traditionnelle", "Mise en relation avec des prestataires congolais", "Accompagnement pour les couples diaspora/Congo", "Accompagnement administratif (mariage civil)"].map(s => (
            <div key={s} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", fontSize: "0.82rem", opacity: 0.9 }}>
              <span style={{ color: G.or, fontWeight: 700, flexShrink: 0 }}>✓</span> {s}
            </div>
          ))}
          <div style={{ marginTop: 16, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📱</span>
            <div><div style={{ fontWeight: 700 }}>SR Event — Agence événementielle</div><div style={{ opacity: 0.85 }}>Mariages · Dots · Conférences · Anniversaires · Brazzaville</div></div>
          </div>
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", fontSize: "0.82rem" }}>
            📘 <a href="https://www.facebook.com/share/1Cvwa61SKv/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{ color: G.blanc, fontWeight: 700, textDecoration: "none" }}>Contacter SR Event sur Facebook</a>
          </div>
        </div>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>💬</div>
          <h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}>Questions fréquentes</h2>
          <p style={{ fontSize: "0.82rem", color: G.brunLight, marginBottom: 20 }}>Tout ce que vous devez savoir avant de vous lancer</p>
          {[
            {
              q: "Moyo est-il gratuit ?",
              a: "Oui, l'inscription et la découverte de profils sont entièrement gratuites. En compte gratuit, vous avez droit à 5 likes par jour et 5 messages par match. Un abonnement Premium à 3 500 FCFA/mois débloque les likes illimités, les messages illimités et la possibilité de voir qui vous a liké."
            },
            {
              q: "Comment fonctionne le système de match ?",
              a: "Lorsque deux personnes se likent mutuellement, un match est créé automatiquement. Vous pouvez alors commencer à échanger des messages. En compte gratuit, vous avez droit à 5 messages par match."
            },
            {
              q: "Comment passer à Premium ?",
              a: "Le Premium est disponible à 3 500 FCFA/mois. Le paiement se fait uniquement via MTN MoMo ou Airtel MoMo. Contactez notre service client via WhatsApp ou Facebook pour procéder au paiement. L'activation est effectuée sous 24h maximum."
            },
            {
              q: "Comment bloquer un utilisateur ?",
              a: "Dans l'onglet Découvrir, appuyez sur les 3 traits à droite d'un profil puis choisissez Bloquer. Le profil disparaît immédiatement et n'apparaîtra plus dans vos résultats. Vous pouvez gérer votre liste noire depuis votre Profil."
            },
            {
              q: "Comment signaler un profil suspect ?",
              a: "Appuyez sur les 3 traits à droite d'un profil et choisissez Signaler. Sélectionnez le motif approprié. Notre équipe examine chaque signalement sous 24h et prend les mesures nécessaires."
            },
            {
              q: "Mes données personnelles sont-elles protégées ?",
              a: "Absolument. Vos informations sont hébergées de manière sécurisée et ne sont jamais partagées avec des tiers. Seuls les membres connectés peuvent consulter votre profil. Vous pouvez également rendre votre profil invisible depuis vos paramètres."
            },
            {
              q: "Puis-je utiliser Moyo depuis l'étranger ?",
              a: "Oui ! Moyo est conçu pour connecter les Congolais du pays et de toute la diaspora. Vous pouvez filtrer les profils par ville ou par zone diaspora."
            },
            {
              q: "Comment supprimer mon compte ?",
              a: "Vous pouvez supprimer votre compte à tout moment depuis votre profil. Toutes vos données sont effacées définitivement. Cette action est irréversible."
            },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${G.gris}`, paddingBottom: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ background: G.rouge, color: G.blanc, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: G.brun }}>{item.q}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ background: G.or, color: G.brun, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>R</div>
                <div style={{ fontSize: "0.83rem", color: G.brunLight, lineHeight: 1.7 }}>{item.a}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>💑</div>
          <h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}>Conseils pour les couples</h2>
          <p style={{ fontSize: "0.82rem", color: G.brunLight, marginBottom: 20 }}>Pour construire une relation solide et épanouie</p>
          {[
            { icon: "🗣️", titre: "Communiquer avec sincérité", desc: "Une relation saine repose sur une communication ouverte et honnête. Exprimez vos attentes, vos besoins et vos limites dès le départ pour éviter les malentendus." },
            { icon: "⏳", titre: "Prendre le temps de se découvrir", desc: "Ne brûlez pas les étapes. Apprenez à connaître votre partenaire progressivement — ses valeurs, sa famille, ses projets de vie. La confiance se construit dans la durée." },
            { icon: "🌍", titre: "Naviguer la distance diaspora/Congo", desc: "Les couples entre diaspora et Congo font face à des défis spécifiques : décalage culturel, distance géographique, projets de vie différents. Discutez-en ouvertement et très tôt." },
            { icon: "👨‍👩‍👧", titre: "Impliquer les familles au bon moment", desc: "Dans la culture congolaise, la famille joue un rôle central. Présentez votre partenaire à votre famille lorsque la relation est sérieuse et que vous êtes tous les deux prêts." },
            { icon: "💍", titre: "Préparer le mariage traditionnel", desc: "Dans la culture congolaise, la dot est une étape incontournable : elle symbolise le respect et la reconnaissance envers la famille de la future épouse. Prévoyez suffisamment de temps pour la préparer avec les deux familles." },
            { icon: "🔄", titre: "Surmonter les désaccords", desc: "Tout couple traverse des difficultés. L'important est de ne pas laisser les conflits s'envenimer. Cherchez le dialogue, respectez-vous mutuellement et cherchez des compromis." },
          ].map(c => (
            <div key={c.titre} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${G.gris}` }}>
              <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 4, color: G.brun }}>{c.titre}</div>
                <div style={{ fontSize: "0.82rem", color: G.brunLight, lineHeight: 1.7 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 20, marginBottom: 16 }}>
          <h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>Nous contacter</h2>
          <a href="https://www.facebook.com/share/1HssYavG19/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#1877F2", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>Rejoins-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Facebook — Page Moyo Congo</div>
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.7)", fontSize: "1.2rem" }}>→</div>
          </a>
          <a href="https://wa.me/33753356471" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#25D366", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.3rem" }}>💬</div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>WhatsApp / Téléphone</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>+33 07 53 35 64 71</div>
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.7)", fontSize: "1.2rem" }}>→</div>
          </a>
          <a href="mailto:contact@moyo-congo.com"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 14, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.3rem" }}>✉️</div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>Email</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>contact@moyo-congo.com</div>
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.7)", fontSize: "1.2rem" }}>→</div>
          </a>
        </div>
        <div style={{ textAlign: "center", color: G.brunLight }}>
          <p style={{ fontSize: "0.75rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
          <p style={{ fontSize: "0.72rem", marginTop: 4 }}>Confidentialité · CGU · Contact</p>
        </div>
      </div>
    </div>
  );
}

function AuthLayout({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(160deg,${G.creme},${G.cremeDark})`, padding: 0, overflowX: "hidden" }}>
    <div onClick={onBack} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(192,57,43,0.35)", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </div>
      <span style={{ color: G.brunLight, fontWeight: 600, fontSize: "0.9rem" }}>Accueil</span>
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px 40px" }}><div style={{ background: G.blanc, borderRadius: 24, padding: "36px 24px", width: "100%", maxWidth: 420, boxShadow: "0 20px 70px rgba(44,26,14,0.12)", overflowX: "hidden" }}>{children}</div></div>
  </div>;
}

function Login({ onNav, onAuth }: { onNav: (p: string) => void; onAuth: (a: Auth) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await sb.signIn(form.email.trim(), form.password);
      if (res.error) {
        setErrorMsg(res.error.message === "Email not confirmed" ? "Confirme ton email avant de te connecter. Vérifie ta boîte mail." : "Email ou mot de passe incorrect.");
        setLoading(false); return;
      }
      const profiles = await sb.query<Profile>(res.access_token, "profiles", `?id=eq.${res.user.id}`);
      if (!profiles[0]) {
        setErrorMsg("Profil introuvable. Réessaie dans quelques secondes.");
        setLoading(false); return;
      }
      onAuth({ token: res.access_token, userId: res.user.id, name: profiles[0].name || "Utilisateur", email: res.user.email || "", isPremium: profiles[0].is_premium || false, isAdmin: profiles[0].is_admin || false });
    } catch { setErrorMsg("Erreur de connexion. Réessaie."); }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!forgotEmail) { setErrorMsg("Entre ton email."); return; }
    await sb.resetPassword(forgotEmail.trim());
    setForgotSent(true);
  };

  if (showForgot) return <AuthLayout onBack={() => onNav("landing")}><ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}<div style={{ textAlign: "center", marginBottom: 24 }}><div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div><h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginTop: 8 }}>Mot de passe oublié</h2></div>{forgotSent ? <div style={{ textAlign: "center" }}><div style={{ fontSize: "3rem", marginBottom: 12 }}>📧</div><p style={{ color: G.brunLight, fontSize: "0.88rem", marginBottom: 20 }}>Email envoyé ! Vérifie ta boîte mail.</p><Btn variant="ghost" onClick={() => { setShowForgot(false); setForgotSent(false); }}>← Retour à la connexion</Btn></div> : <><Input label="Ton email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="ton@email.com" icon="✉️" /><Btn variant="primary" onClick={handleForgot} style={{ width: "100%", marginBottom: 12 }}>Envoyer le lien 📧</Btn><div style={{ textAlign: "center" }}><span onClick={() => setShowForgot(false)} style={{ fontSize: "0.85rem", color: G.brunLight, cursor: "pointer" }}>← Retour</span></div></>}</AuthLayout>;

  return <AuthLayout onBack={() => onNav("landing")}><ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}<div style={{ textAlign: "center", marginBottom: 28 }}><div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div><h2 style={{  fontSize: "1.6rem", fontWeight: 700, marginTop: 6 }}>Bon retour !</h2><p style={{ color: G.brunLight, fontSize: "0.85rem", marginTop: 4 }}>Retrouve tes matchs</p></div><Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ton@email.com" icon="✉️" /><Input label="Mot de passe" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" icon="🔒" /><div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}><span onClick={() => setShowForgot(true)} style={{ fontSize: "0.82rem", color: G.rouge, cursor: "pointer", fontWeight: 500 }}>Mot de passe oublié ?</span></div><Btn variant="primary" onClick={handleLogin} loading={loading} style={{ width: "100%" }} disabled={!form.email || !form.password}>Se connecter →</Btn><p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: G.brunLight }}>Pas encore de compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("signup")}>S'inscrire</span></p></AuthLayout>;
}

function SignUp({ onNav }: { onNav: (p: string) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", name: "", age: "", city: "", gender: "", bio: "", religion: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const checkEmailAndContinue = async () => {
    if (!form.email || form.password.length < 6) return;
    setLoading(true);
    try {
      const emailClean = form.email.trim().toLowerCase();
      // Vérifier si l'email existe déjà dans la table profiles
      const existing = await sb.query<Profile>(
        SUPABASE_KEY,
        "profiles",
        `?email=eq.${encodeURIComponent(emailClean)}&select=id`
      );
      if (existing.length > 0) {
        setErrorMsg("Cette adresse e-mail est déjà utilisée. Connectez-vous plutôt.");
        setLoading(false);
        return;
      }
      // Email libre → passer à l'étape 2
      setStep(2);
    } catch {
      setStep(2);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Vérification âge
    const ageNum = parseInt(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      setErrorMsg("Vous êtes mineur(e). Votre inscription a échoué. Moyo est réservé aux personnes majeures.");
      setLoading(false);
      return;
    }
    try {
      const emailClean = form.email.trim().toLowerCase();

      // Vérifier si email déjà utilisé via identities
      const metadata = {
        name: form.name.trim(),
        age: form.age,
        city: form.city,
        gender: form.gender,
        bio: form.bio.trim(),
        religion: form.religion,
        photo_url: null,
      };

      const authRes = await sb.signUp(emailClean, form.password, metadata);

      if (authRes?.error) {
        const code = authRes.error.message || "";
        let msg = "Impossible de créer le compte. Veuillez réessayer.";
        if (code.includes("already registered") || code.includes("already been registered") || code.includes("User already registered")) {
          msg = "Cette adresse e-mail est déjà utilisée. Connectez-vous plutôt à votre compte.";
        } else if (code.includes("password") || code.includes("characters")) {
          msg = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (code.includes("invalid") || code.includes("email")) {
          msg = "Adresse e-mail invalide.";
        }
        setErrorMsg(msg);
        setLoading(false);
        return;
      }

      if (authRes.user?.identities && authRes.user.identities.length === 0) {
        setErrorMsg("Cette adresse e-mail possède déjà un compte. Connectez-vous directement.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccessMsg("Compte créé avec succès ! 🎉\nVeuillez maintenant vous connecter.");
      setTimeout(() => { onNav("login"); }, 3000);

    } catch (e) {
      console.error("Signup error:", e);
      setErrorMsg("Erreur technique pendant la création du compte. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={() => onNav("landing")}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {successMsg && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}><div style={{ fontSize: "3rem", marginBottom: 14 }}>🎉</div><h3 style={{  fontSize: "1.3rem", fontWeight: 700, color: G.brun, marginBottom: 10 }}>COMPTE CRÉÉ AVEC SUCCÈS !</h3><p style={{ fontSize: "0.92rem", color: G.brunLight, lineHeight: 1.6, marginBottom: 20 }}>Veuillez maintenant vous connecter.</p><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.78rem", color: "#aaa" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: G.rouge, animation: "fadeIn 1s infinite alternate" }} />Redirection en cours...</div></div></div>}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
        <h2 style={{  fontSize: "1.5rem", fontWeight: 700, marginTop: 6 }}>Crée ton compte</h2>
        <p style={{ color: G.brunLight, fontSize: "0.85rem", marginTop: 4 }}>Étape {step}/2</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[1, 2].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? G.rouge : G.gris }} />)}
      </div>
      {step === 1 && <>
        <Input label="Email" type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="ton@email.com" icon="✉️" />
        <Input label="Mot de passe" type="password" value={form.password} onChange={e => upd("password", e.target.value)} placeholder="Minimum 6 caractères" icon="🔒" hint="Au moins 6 caractères" />
        <Btn variant="primary" onClick={checkEmailAndContinue} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!form.email || form.password.length < 6}>Continuer →</Btn>
      </>}
      {step === 2 && <>
        <Input label="Prénom" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Ex: Faïda" icon="👤" />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Je suis</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["Homme", "Femme"].map(g => (
              <div key={g} onClick={() => upd("gender", g)} style={{ flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `2px solid ${form.gender === g ? G.rouge : G.gris}`, background: form.gender === g ? "rgba(192,57,43,0.06)" : G.blanc, fontWeight: 600, fontSize: "0.88rem" }}>
                {g === "Homme" ? "👨🏿 Homme" : "👩🏿 Femme"}
              </div>
            ))}
          </div>
        </div>
        <Input label="Âge" type="number" value={form.age} onChange={e => { const v = e.target.value.slice(0,2); upd("age", v); }} placeholder="Ex: 25" icon="🎂" hint="Entre 18 et 99 ans" error={form.age && parseInt(form.age) < 18 ? "Vous devez avoir au moins 18 ans pour vous inscrire." : undefined} />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Ville</label>
          <select value={form.city} onChange={e => upd("city", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: G.brun, outline: "none" }}>
            <option value="">Sélectionne ta ville</option>
            {VILLES.map(c => c.startsWith("──") ? <option key={c} disabled>{c}</option> : <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Religion <span style={{ color: G.rouge, fontSize: "0.8rem", fontWeight: 600 }}>(fortement recommandé)</span></label>
          <select value={form.religion} onChange={e => upd("religion", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: G.brun, outline: "none" }}>
            <option value="">Sélectionne ta religion</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Bio (optionnel)</label>
          <textarea value={form.bio} onChange={e => upd("bio", e.target.value)} placeholder="Parle un peu de toi..." rows={3} style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: G.brun, outline: "none", resize: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Retour</Btn>
          <Btn variant="primary" onClick={handleSubmit} loading={loading} style={{ flex: 2 }} disabled={!form.name || !form.gender || !form.age || parseInt(form.age) < 18 || parseInt(form.age) > 99 || !form.city}>Créer mon compte 🎉</Btn>
        </div>
      </>}
      <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: G.brunLight }}>
        Déjà un compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("login")}>Se connecter</span>
      </p>
    </AuthLayout>
  );
}

function AppShell({ children, tab, setTab, unreadCount, notifCount, auth }: { children: React.ReactNode; tab: string; setTab: (t: string) => void; unreadCount: number; notifCount: number; auth: Auth; }) {
  const [showGuide, setShowGuide] = useState(false);

  const tabs = [
    {
      id: "discover",
      label: "Découvrir",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      id: "matches",
      label: "Matchs",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      id: "messages",
      label: "Messages",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4" fill={active ? G.rouge : "none"}/>
        </svg>
      ),
    },
  ];

  return <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: G.creme, boxShadow: "0 0 60px rgba(44,26,14,0.12)" }}>
    <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.blanc, borderBottom: `1px solid ${G.gris}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ fontSize: "1.6rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {auth.isAdmin && <div onClick={() => setTab("admin")} style={{ background: G.rouge, color: G.blanc, borderRadius: 50, padding: "5px 12px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>⚙️ Admin</div>}
        <div onClick={() => setShowGuide(true)} style={{ fontSize: "0.75rem", fontWeight: 700, color: G.blanc, background: G.rouge, borderRadius: 50, padding: "5px 14px", cursor: "pointer", letterSpacing: "0.02em" }}>Guide</div>
      </div>
    </div>
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 75 }}>{children}</div>

    {/* ── NAVBAR BAS STYLE TINDER ── */}
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, background: G.blanc, borderTop: `1px solid #eee`, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 8px 16px", zIndex: 50 }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", position: "relative", flex: 1 }}>
            {/* Fond arrondi sur l'onglet actif */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "6px 16px", borderRadius: 14,
              background: active ? "rgba(192,57,43,0.1)" : "transparent",
              transition: "background 0.2s",
              minWidth: 64,
            }}>
              {/* Icône SVG */}
              <div style={{ position: "relative" }}>
                {t.icon(active)}
                {/* Badge messages */}
                {t.id === "messages" && unreadCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.52rem", fontWeight: 700 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
                {/* Badge matchs */}
                {t.id === "matches" && notifCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.or, color: G.brun, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.52rem", fontWeight: 700 }}>
                    {notifCount}
                  </div>
                )}
              </div>
              {/* Label */}
              <div style={{ fontSize: "0.62rem", fontWeight: active ? 700 : 400, color: active ? G.rouge : "#bbb", whiteSpace: "nowrap" }}>
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
          <div onClick={() => setShowGuide(false)} style={{ position: "absolute", top: 14, right: 16, color: G.blanc, fontSize: "1.2rem", cursor: "pointer", opacity: 0.8 }}>✕</div>
          <div style={{ fontSize: "1.6rem", color: G.blanc, fontWeight: 800 }}>Guide <span style={{ color: G.or }}>Moyo</span></div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", marginTop: 4, fontWeight: 400 }}>Tout ce que vous devez savoir pour bien utiliser Moyo</div>
        </div>
        {/* Contenu */}
        <div style={{ padding: "20px" }}>
          {[
            {
              title: "Découvrir des profils",
              color: G.rouge,
              items: [
                "L'onglet Découvrir affiche les profils en mode carte ou en liste. En vue carte, utilisez les flèches pour naviguer et le cœur pour liker. En vue liste, le cœur est directement visible sur chaque profil.",
                "Compte gratuit : 5 likes par jour. Premium : likes illimités. Utilisez les filtres pour affiner par genre, ville, âge ou religion.",
              ]
            },
            {
              title: "Matchs",
              color: G.rouge,
              items: [
                "Un match se crée automatiquement quand deux personnes se likent mutuellement. Une fois le match créé, vous pouvez vous envoyer des messages. Le badge sur l'onglet Matchs indique le nombre de personnes qui ont liké votre profil. Avec Premium, vous pouvez voir exactement qui vous a liké.",
              ]
            },
            {
              title: "Messages",
              color: G.rouge,
              items: [
                "Compte gratuit : 5 messages par match. Premium : messages illimités. Le badge rouge sur l'onglet Messages indique un nouveau message non lu. Pour supprimer une conversation, ouvrez-la puis appuyez sur l'icône corbeille en haut à droite.",
              ]
            },
            {
              title: "Mon Profil",
              color: G.rouge,
              items: [
                "Modifiez votre photo, prénom, âge, ville, religion et bio en appuyant sur l'engrenage. Le bouton visible/invisible vous permet d'apparaître ou non dans Découvrir sans supprimer votre compte.",
                "La Liste noire vous permet de gérer les utilisateurs bloqués et de les débloquer à tout moment.",
              ]
            },
            {
              title: "Bloquer et Signaler",
              color: G.rouge,
              items: [
                "Sur chaque profil, appuyez sur les 3 traits pour accéder aux options. Bloquer fait disparaître définitivement le profil de vos résultats. Signaler envoie un rapport à notre équipe qui examine le cas sous 24h. Les profils bloqués sont gérables depuis votre Liste noire.",
              ]
            },
            {
              title: "Premium — 3 500 FCFA / mois",
              color: G.or,
              items: [
                "Avantages : messages illimités, likes illimités, voir qui vous a liké, profil mis en avant.",
                "Paiement uniquement via MTN MoMo ou Airtel MoMo. Contactez notre service client via WhatsApp ou Facebook pour payer. L'activation est effectuée sous 24h maximum.",
              ]
            },
            {
              title: "Sécurité et confidentialité",
              color: G.rouge,
              items: [
                "Pour supprimer votre compte, rendez-vous dans Profil puis Supprimer mon compte. Cette action est définitive et irréversible. Moyo est réservé aux personnes majeures de 18 ans et plus.",
              ]
            },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: s.color, marginBottom: 6, paddingBottom: 5, borderBottom: `2px solid ${s.color === G.or ? "rgba(212,168,67,0.25)" : "rgba(192,57,43,0.12)"}` }}>
                {s.title}
              </div>
              {s.items.map((item, j) => (
                <p key={j} style={{ fontSize: "0.83rem", color: "#555", lineHeight: 1.6, fontWeight: 400, marginBottom: 3 }}>{item}</p>
              ))}
            </div>
          ))}
          {/* Contact */}
          <div style={{ background: "#f8f8f8", borderRadius: 14, padding: "16px", textAlign: "center", marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1a1a", marginBottom: 4 }}>Un problème ou une question ?</div>
            <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: 14, lineHeight: 1.5, fontWeight: 400 }}>Notre équipe est disponible pour vous aider.</p>
            <a href="https://www.facebook.com/share/1HssYavG19/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: G.rouge, color: G.blanc, borderRadius: 50, padding: "10px 24px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>Contacter notre équipe</a>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

function ProfileListCard({ prof, liked, onLike, onBlock, onReport }: { prof: Profile; liked: boolean; onLike: () => void; onBlock: () => void; onReport: (r: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSignalerMenu, setShowSignalerMenu] = useState(false);
  return (
    <div className="profile-card" style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc, borderRadius: 16, padding: "12px", marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
      <div style={{ width: 62, height: 62, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
        {prof.photo_url ? <img src={prof.photo_url} alt={prof.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{prof.gender === "Femme" ? "👩🏿" : "👨🏿"}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{prof.name}, {prof.age} ans {prof.is_premium && "⭐"}</div>
        <div style={{ fontSize: "0.78rem", color: G.brunLight, marginTop: 2 }}>📍 {prof.city}{prof.religion && <span style={{ marginLeft: 6, fontSize: "0.72rem" }}>· 🙏 {prof.religion}</span>}</div>
        {prof.bio && <div style={{ fontSize: "0.78rem", color: G.brunLight, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prof.bio}</div>}
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
            <div style={{ position: "absolute", right: 0, top: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 150, overflow: "hidden" }}>
              <div onClick={() => { setShowMenu(false); onBlock(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>🚫 Bloquer</div>
              <div onClick={() => { setShowMenu(false); setShowSignalerMenu(true); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer" }}>🚨 Signaler</div>
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

function Discover({ auth, onShowPremium }: { auth: Auth; onShowPremium: (r: string) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likedIds, setLikedIds] = useState(new Set<string>());
  const [blockedIds, setBlockedIds] = useState(new Set<string>());
  const [current, setCurrent] = useState(0);
  const [matchPop, setMatchPop] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likesToday, setLikesToday] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showSignaler, setShowSignaler] = useState(false);
  const [filters, setFilters] = useState({ city: "", ageMin: "", ageMax: "", gender: "", religion: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  useEffect(() => { loadProfiles(); }, []);
  useEffect(() => { if (profiles[current]) sb.recordVisit(auth.token, auth.userId, profiles[current].id); }, [current, profiles]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      let params = `?id=neq.${auth.userId}&is_visible=neq.false&order=is_premium.desc,created_at.desc&limit=50`;
      if (filters.city && !filters.city.startsWith("──")) params += `&city=eq.${encodeURIComponent(filters.city)}`;
      if (filters.gender) params += `&gender=eq.${filters.gender}`;
      if (filters.ageMin) params += `&age=gte.${filters.ageMin}`;
      if (filters.ageMax) params += `&age=lte.${filters.ageMax}`;
      if (filters.religion) params += `&religion=eq.${encodeURIComponent(filters.religion)}`;
      const [all, liked, blocked] = await Promise.all([
        sb.query<Profile>(auth.token, "profiles", params),
        sb.query<{ to_user: string }>(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user`),
        sb.query<{ blocked_id: string }>(auth.token, "blocks", `?blocker_id=eq.${auth.userId}&select=blocked_id`),
      ]);
      setLikedIds(new Set(liked.map(l => l.to_user)));
      const bIds = new Set(blocked.map(b => b.blocked_id));
      setBlockedIds(bIds);
      const seen = new Set<string>();
      const unique = (Array.isArray(all) ? all : []).filter(p => {
        if (seen.has(p.id) || bIds.has(p.id)) return false;
        seen.add(p.id); return true;
      });
      setProfiles(unique);
      const today = new Date().toISOString().split("T")[0];
      const tl = await sb.query<object>(auth.token, "likes", `?from_user=eq.${auth.userId}&created_at=gte.${today}`);
      setLikesToday(Array.isArray(tl) ? tl.length : 0);
      setCurrent(0);
    } catch { setProfiles([]); }
    setLoading(false);
  };

  const handleBlock = async () => {
    const target = profiles[current];
    if (!target) return;
    await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: target.id });
    setShowBlockConfirm(false);
    setProfiles(prev => prev.filter(p => p.id !== target.id));
    setCurrent(c => Math.max(0, c - 1));
  };

  const handleLike = async (p: Profile) => {
    if (likedIds.has(p.id)) {
      // DÉLIKE : supprimer le like
      setLikedIds(s => { const n = new Set(s); n.delete(p.id); return n; });
      setLikesToday(l => Math.max(0, l - 1));
      await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${p.id}`);
      return;
    }
    if (!auth.isPremium && likesToday >= FREE_LIMITS.likes) { onShowPremium(`Tu as utilisé tes ${FREE_LIMITS.likes} likes gratuits aujourd'hui. Passe Premium pour liker sans limite ! ❤️`); return; }
    setLikedIds(s => new Set([...s, p.id])); setLikesToday(l => l + 1);
    await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
    const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
    if (mutual.length > 0) { await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id }); setMatchPop(p); }
  };

  const handleReport = async (reason: string) => {
    if (!profiles[current]) return;
    await sb.insert(auth.token, "reports", { reporter_id: auth.userId, reported_id: profiles[current].id, reason });
    setShowReport(false);
  };

  const p = profiles[current];
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: G.brunLight }}>⏳ Chargement...</div>;

  return <div style={{ padding: "16px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h2 style={{  fontSize: "1.3rem", fontWeight: 700 }}>Découvrir</h2><div style={{ display: "flex", gap: 8 }}>{!auth.isPremium && <div onClick={() => onShowPremium("")} style={{ background: "rgba(212,168,67,0.12)", border: `1px solid ${G.or}`, borderRadius: 50, padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", color: G.brunLight }}>❤️ {Math.max(0, FREE_LIMITS.likes - likesToday)}/{FREE_LIMITS.likes}</div>}<div onClick={() => setViewMode(v => v === "card" ? "list" : "card")} style={{ background: G.blanc, color: G.brun, border: `2px solid ${G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>{viewMode === "card" ? "☰ Liste" : "⊞ Carte"}</div><div onClick={() => setShowFilters(s => !s)} style={{ background: showFilters ? G.rouge : G.blanc, color: showFilters ? G.blanc : G.brun, border: `2px solid ${showFilters ? G.rouge : G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>🎯 Filtres</div></div></div>{showFilters && <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 16 }}><select value={filters.city} onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}><option value="">Toutes les villes</option>{VILLES.filter(c => !c.startsWith("──")).map(c => <option key={c} value={c}>{c}</option>)}</select><select value={filters.gender} onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}><option value="">Tous les genres</option><option value="Homme">Homme</option><option value="Femme">Femme</option></select><select value={filters.religion} onChange={e => setFilters(prev => ({ ...prev, religion: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}><option value="">Toutes les religions</option>{RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select><Btn variant="primary" onClick={() => { loadProfiles(); setShowFilters(false); }} style={{ width: "100%" }}>Appliquer</Btn></div>}{profiles.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: G.brunLight }}><div style={{ fontSize: "3rem", marginBottom: 16 }}>😊</div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={loadProfiles}>🔄 Actualiser</Btn></div> : viewMode === "list" ? <div>{profiles.map((prof, idx) => <ProfileListCard key={prof.id} prof={prof} liked={likedIds.has(prof.id)} onLike={() => handleLike(prof)} onBlock={async () => { await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: prof.id }); setProfiles(prev => prev.filter(p => p.id !== prof.id)); }} onReport={(r) => handleReport(r)} />)}</div> : !p ? <div style={{ textAlign: "center", padding: "60px 20px", color: G.brunLight }}><div style={{ fontSize: "3rem", marginBottom: 16 }}>😊</div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={loadProfiles}>🔄 Actualiser</Btn></div> : <><div style={{ background: G.blanc, borderRadius: 22, boxShadow: "0 8px 36px rgba(44,26,14,0.12)", overflow: "hidden", marginBottom: 16, position: "relative" }}><div style={{ height: 280, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "6rem" }}>{p.gender === "Femme" ? "👩🏿" : "👨🏿"}</span>}</div><div style={{ padding: "14px 16px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: G.brun }}>{p.name}, {p.age} ans {p.is_premium && "⭐"}</div>
    {/* 3 traits menu */}
    <div style={{ position: "relative" }}>
      <div onClick={() => setShowReport(v => !v)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", padding: 4 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
      </div>
    </div>
  </div>
  {/* Bottom sheet options — en dehors de la carte */}
  {showReport && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowReport(false)}>
      <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a" }}>{p.name}</div>
          <div onClick={() => setShowReport(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
        </div>
        <div style={{ padding: "8px 16px 32px" }}>
          <div onClick={() => { setShowReport(false); setShowBlockConfirm(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🚫</div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#1a1a1a" }}>Bloquer</div>
          </div>
          <div onClick={() => { setShowReport(false); setShowSignaler(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(231,76,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🚨</div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#e74c3c" }}>Signaler</div>
          </div>
        </div>
      </div>
    </div>
  )}
  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    <span style={{ fontSize: "0.78rem", color: G.brunLight }}>📍 {p.city}</span>
    {p.religion && <span style={{ background: "rgba(212,168,67,0.12)", border: `1px solid rgba(212,168,67,0.35)`, borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: G.brunLight, fontWeight: 500 }}>🙏 {p.religion}</span>}
  </div>
  {p.bio && <p style={{ fontSize: "0.82rem", color: G.brunLight, lineHeight: 1.5, marginTop: 6, marginBottom: 0 }}>{p.bio}</p>}
</div></div><div style={{ display: "flex", justifyContent: "center", gap: 14, alignItems: "center", marginBottom: 10 }}><div onClick={() => setCurrent(c => Math.max(0, c - 1))} style={{ width: 48, height: 48, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>←</div><div onClick={() => handleLike(p)} style={{ width: 68, height: 68, borderRadius: "50%", background: likedIds.has(p.id) ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : G.blanc, border: likedIds.has(p.id) ? "none" : `2px solid ${G.gris}`, boxShadow: likedIds.has(p.id) ? "0 6px 20px rgba(192,57,43,0.4)" : "0 2px 8px rgba(44,26,14,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", cursor: "pointer" }}>{likedIds.has(p.id) ? "❤️" : "🤍"}</div><div onClick={() => setCurrent(c => Math.min(profiles.length - 1, c + 1))} style={{ width: 48, height: 48, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>→</div></div><p style={{ textAlign: "center", fontSize: "0.72rem", color: "#ccc" }}>{current + 1} / {profiles.length}</p></>}{showBlockConfirm && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
  <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
    <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🚫</div>
    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Bloquer {p?.name} ?</h3>
    <p style={{ fontSize: "0.88rem", color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Ce profil disparaîtra de Découvrir. Vous pourrez débloquer depuis votre profil.</p>
    <div style={{ display: "flex", gap: 10 }}>
      <Btn variant="ghost" onClick={() => setShowBlockConfirm(false)} style={{ flex: 1 }}>Annuler</Btn>
      <Btn variant="danger" onClick={handleBlock} style={{ flex: 1 }}>Bloquer</Btn>
    </div>
  </div>
</div>}
{showSignaler && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
  <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }}>
    <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
      <div onClick={() => setShowSignaler(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
    </div>
    <div style={{ padding: "12px 16px 32px" }}>
      {["Faux profil / Arnaque", "Photos inappropriées", "Harcèlement", "Profil mineur", "Autre"].map(r => (
        <div key={r} onClick={() => { handleReport(r); setShowSignaler(false); }} style={{ padding: "14px 16px", background: "#F8F8F8", borderRadius: 12, marginBottom: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a" }}>{r}</div>
      ))}
    </div>
  </div>
</div>}{matchPop && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}><div style={{ textAlign: "center", color: G.blanc }}><div style={{ fontSize: "4rem", marginBottom: 12 }}>💞</div><h2 style={{  fontSize: "2.2rem", color: G.or, marginBottom: 8 }}>C'est un Match !</h2><p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>Toi et {matchPop.name} vous plaisez mutuellement !</p><Btn variant="white" onClick={() => setMatchPop(null)}>Continuer →</Btn></div></div>}</div>;
}

function LikesReceivedBanner({ auth, onShowPremium }: { auth: Auth; onShowPremium: (r: string) => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = async () => {
      const res = await sb.query<object>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user`);
      setCount(Array.isArray(res) ? res.length : 0);
    };
    load();
  }, []);
  return (
    <div onClick={() => !auth.isPremium && onShowPremium("Découvre qui a liké ton profil en passant Premium ! 👀")}
      style={{ background: auth.isPremium ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "14px 18px", marginBottom: 16, color: auth.isPremium ? G.brun : G.blanc, cursor: auth.isPremium ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: "1.8rem" }}>{auth.isPremium ? "👁️" : "🔒"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
          {auth.isPremium ? "Voir qui t'a liké" : count > 0 ? `${count} personne${count > 1 ? "s ont" : " a"} liké ton profil` : "Des personnes ont liké ton profil"}
        </div>
        <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
          {auth.isPremium ? "Accès Premium activé ✓" : "Passe Premium pour découvrir qui 👀"}
        </div>
      </div>
      {!auth.isPremium && count > 0 && (
        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
          {count > 9 ? "9+" : count}
        </div>
      )}
    </div>
  );
}

function MatchProfileModal({ match, onClose, onMessage }: { match: Match; onClose: () => void; onMessage: () => void }) {
  const p = match.partner;
  if (!p) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {/* Photo */}
        <div style={{ height: 280, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>{p.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>}
          <div onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontSize: "1rem", fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
            <div style={{  fontSize: "1.6rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{p.name}, {p.age} ans</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>📍 {p.city}</div>
          </div>
        </div>
        {/* Infos */}
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>💞 Match !</span>
            {p.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: G.brunLight, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>⭐ Premium</span>}
            {p.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: G.brunLight, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>🙏 {p.religion}</span>}
          </div>
          {p.bio && <p style={{ fontSize: "0.88rem", color: G.brunLight, lineHeight: 1.6, marginBottom: 20 }}>{p.bio}</p>}
          <Btn variant="primary" onClick={onMessage} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>💬 Envoyer un message</Btn>
        </div>
      </div>
    </div>
  );
}

function Matches({ auth, onShowPremium, onNotifCount, onGoMessages }: { auth: Auth; onShowPremium: (r: string) => void; onNotifCount: (n: number) => void; onGoMessages?: () => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  useEffect(() => { loadMatches(); }, []);
  const loadMatches = async () => { setLoading(true); const res = await sb.query<Match>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&order=created_at.desc`); const enriched = await Promise.all(res.map(async m => { const pid = m.user1 === auth.userId ? m.user2 : m.user1; const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${pid}`); return { ...m, partner: profiles[0] }; })); const valid = enriched.filter(m => m.partner); setMatches(valid); onNotifCount(valid.length); setLoading(false); };
  const p = selectedMatch?.partner;
  return <div style={{ padding: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <h2 style={{  fontSize: "1.3rem", fontWeight: 700 }}>Matchs</h2>
      <div onClick={() => setViewMode(v => v === "card" ? "list" : "card")} style={{ background: G.blanc, color: G.brun, border: `2px solid ${G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>{viewMode === "card" ? "☰ Liste" : "⊞ Carte"}</div>
    </div>
    <LikesReceivedBanner auth={auth} onShowPremium={onShowPremium} />
    {loading ? <div style={{ textAlign: "center", padding: 40 }}>⏳</div> : matches.length === 0 ? <div style={{ textAlign: "center", padding: "40px 20px", color: G.brunLight }}><div style={{ fontSize: "3rem", marginBottom: 12 }}>💘</div><p>Continue à liker des profils pour avoir des matchs !</p></div> : viewMode === "list" ? <div>{matches.map(m => <div key={m.id} onClick={() => setSelectedMatch(m)} className="card-hover" style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc, borderRadius: 16, padding: "12px", marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)", cursor: "pointer" }}><div style={{ width: 58, height: 58, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>{m.partner?.photo_url ? <img src={m.partner.photo_url} alt={m.partner?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{m.partner?.gender === "Femme" ? "👩🏿" : "👨🏿"}</span>}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{m.partner?.name}, {m.partner?.age} ans</div><div style={{ fontSize: "0.78rem", color: G.brunLight, marginTop: 2 }}>📍 {m.partner?.city}{m.partner?.religion && <span style={{ marginLeft: 6 }}>· 🙏 {m.partner.religion}</span>}</div><div style={{ fontSize: "0.7rem", color: "#27ae60", fontWeight: 600, marginTop: 2 }}>💞 Match !</div></div><div style={{ fontSize: "0.72rem", color: G.rouge, fontWeight: 600 }}>Voir →</div></div>)}</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>{matches.map(m => <div key={m.id} onClick={() => setSelectedMatch(m)} className="card-hover" style={{ background: G.blanc, borderRadius: 16, overflow: "hidden", boxShadow: "0 3px 16px rgba(44,26,14,0.08)", cursor: "pointer" }}><div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden" }}>{m.partner?.photo_url ? <img src={m.partner.photo_url} alt={m.partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "3rem" }}>{m.partner?.gender === "Femme" ? "👩🏿" : "👨🏿"}</span>}</div><div style={{ padding: "10px" }}><div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.partner?.name}, {m.partner?.age} ans</div><div style={{ fontSize: "0.72rem", color: G.brunLight }}>📍 {m.partner?.city}</div><div style={{ fontSize: "0.68rem", color: "#27ae60", fontWeight: 600, marginTop: 3 }}>💞 Match !</div></div></div>)}</div>}
    {selectedMatch && p && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSelectedMatch(null)}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 280, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>{p.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>}
          <div onClick={() => setSelectedMatch(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontSize: "1rem", fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
            <div style={{  fontSize: "1.5rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{p.name}, {p.age} ans</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>📍 {p.city}</div>
          </div>
        </div>
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>💞 Match !</span>
            {p.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: G.brunLight, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>⭐ Premium</span>}
            {p.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: `1px solid rgba(212,168,67,0.3)`, color: G.brunLight, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>🙏 {p.religion}</span>}
          </div>
          {p.bio && <p style={{ fontSize: "0.88rem", color: G.brunLight, lineHeight: 1.6, marginBottom: 20 }}>{p.bio}</p>}
          <Btn variant="primary" onClick={() => { setSelectedMatch(null); if (onGoMessages) onGoMessages(); }} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>💬 Envoyer un message</Btn>
        </div>
      </div>
    </div>}
  </div>;
}

function Messages({ auth, onUnreadCount, onShowPremium }: { auth: Auth; onUnreadCount: (n: number) => void; onShowPremium: (r: string) => void }) {
  const [convs, setConvs] = useState<Match[]>([]); const [open, setOpen] = useState<Match | null>(null); const [msgs, setMsgs] = useState<Message[]>([]); const [text, setText] = useState(""); const [loading, setLoading] = useState(true); const [msgCount, setMsgCount] = useState(0); const [showDeleteConv, setShowDeleteConv] = useState(false); const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { loadConvs(); }, []); useEffect(() => { if (open) loadMsgs(open); }, [open]); useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const loadConvs = async () => { setLoading(true); const res = await sb.query<Match>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})`); if (!res.length) { setConvs([]); onUnreadCount(0); setLoading(false); return; } const enriched = await Promise.all(res.map(async m => { const pid = m.user1 === auth.userId ? m.user2 : m.user1; const [profiles, lastMsgs, unread] = await Promise.all([sb.query<Profile>(auth.token, "profiles", `?id=eq.${pid}`), sb.query<Message>(auth.token, "messages", `?match_id=eq.${m.id}&order=created_at.desc&limit=1`), sb.query<Message>(auth.token, "messages", `?match_id=eq.${m.id}&sender_id=neq.${auth.userId}&is_read=eq.false`)]); return { ...m, partner: profiles[0], lastMsg: lastMsgs[0], unreadCount: unread.length }; })); const filtered = enriched.filter(c => c.partner); setConvs(filtered); onUnreadCount(filtered.reduce((s, c) => s + (c.unreadCount || 0), 0)); setLoading(false); };
  const loadMsgs = async (conv: Match) => { const res = await sb.query<Message>(auth.token, "messages", `?match_id=eq.${conv.id}&order=created_at.asc`); setMsgs(res); setMsgCount(res.filter(m => m.sender_id === auth.userId).length); await sb.markMessagesRead(auth.token, conv.id, auth.userId); loadConvs(); };
  const deleteConv = async () => { if (!open) return; await sb.delete(auth.token, "messages", `?match_id=eq.${open.id}`); setShowDeleteConv(false); setOpen(null); loadConvs(); };
  const send = async () => { if (!text.trim() || !open) return; if (!auth.isPremium && hasContactInfo(text)) { onShowPremium("💌 Pour partager tes coordonnées, passe à Premium. Cela protège aussi ta sécurité !"); return; } if (!auth.isPremium && msgCount >= FREE_LIMITS.messages) { onShowPremium(`Tu as envoyé tes ${FREE_LIMITS.messages} messages gratuits avec ${open.partner?.name}. Passe Premium ! 💛`); return; } const res = await sb.insert<Message>(auth.token, "messages", { match_id: open.id, sender_id: auth.userId, content: text, is_read: false }); if (res[0]) { setMsgs(m => [...m, res[0]]); setMsgCount(c => c + 1); setText(""); } };
  if (open) return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: G.creme, zIndex: 100, maxWidth: 500, margin: "0 auto" }}>
      {/* Header fixe */}
      <div style={{ padding: "12px 16px", background: G.blanc, borderBottom: `1px solid ${G.gris}`, display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        <div onClick={() => { setOpen(null); loadConvs(); }} style={{ cursor: "pointer", fontSize: "1.1rem", color: G.brunLight, padding: "4px 8px" }}>←</div>
        <Avatar url={open.partner?.photo_url} gender={open.partner?.gender} size={38} premium={open.partner?.is_premium} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{open.partner?.name}</div>
          <div style={{ fontSize: "0.7rem", color: "#27ae60" }}>● Actif</div>
        </div>
        {!auth.isPremium && <div style={{ fontSize: "0.7rem", color: G.brunLight, background: G.creme, padding: "4px 8px", borderRadius: 50 }}>{Math.max(0, FREE_LIMITS.messages - msgCount)}/{FREE_LIMITS.messages} msg</div>}
        <div onClick={() => setShowDeleteConv(true)} style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 8, color: "#e74c3c", fontSize: "1rem", opacity: 0.7 }}>🗑️</div>
      </div>
      {/* Zone messages scrollable */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 && <div style={{ textAlign: "center", color: G.brunLight, padding: "24px 0", fontSize: "0.85rem" }}>Dites bonjour ! 👋</div>}
        {msgs.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.sender_id === auth.userId ? "flex-end" : "flex-start" }}><div style={{ background: m.sender_id === auth.userId ? G.rouge : G.blanc, color: m.sender_id === auth.userId ? G.blanc : G.brun, padding: "10px 14px", borderRadius: m.sender_id === auth.userId ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "72%", fontSize: "0.88rem", lineHeight: 1.5 }}>{m.content}</div></div>)}
        <div ref={bottomRef} />
      </div>
      {/* Barre envoi fixe */}
      <div style={{ padding: "10px 12px", background: G.blanc, borderTop: `1px solid ${G.gris}`, display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Écris un message..." style={{ flex: 1, minWidth: 0, padding: "11px 14px", border: `2px solid ${G.gris}`, borderRadius: 50, fontSize: "16px", outline: "none", background: G.creme }} />
        <div onClick={send} style={{ width: 44, height: 44, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.95rem", color: G.blanc, flexShrink: 0, flexGrow: 0 }}>➤</div>
      </div>
      {/* Modal suppression */}
      {showDeleteConv && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}><div style={{ fontSize: "2rem", marginBottom: 12 }}>🗑️</div><h3 style={{  fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: G.brun }}>Supprimer la conversation ?</h3><p style={{ fontSize: "0.82rem", color: G.brunLight, marginBottom: 20, lineHeight: 1.5 }}>Tous les messages seront supprimés. Cette action est irréversible.</p><div style={{ display: "flex", gap: 10 }}><Btn variant="ghost" onClick={() => setShowDeleteConv(false)} style={{ flex: 1 }}>Annuler</Btn><Btn variant="danger" onClick={deleteConv} style={{ flex: 1 }}>Supprimer</Btn></div></div></div>}
    </div>
  );
  return <div style={{ padding: "16px" }}><h2 style={{  fontSize: "1.3rem", fontWeight: 700, marginBottom: 16 }}>Messages</h2>{loading ? <div style={{ textAlign: "center", padding: 40 }}>⏳</div> : convs.length === 0 ? <div style={{ textAlign: "center", padding: "50px 20px", color: G.brunLight }}><div style={{ fontSize: "3rem", marginBottom: 12 }}>💬</div><p style={{ fontSize: "0.85rem" }}>Fais des matchs pour commencer à discuter !</p></div> : convs.map(c => <div key={c.id} onClick={() => setOpen(c)} className="card-hover" style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px", background: G.blanc, borderRadius: 14, marginBottom: 8, cursor: "pointer" }}><Avatar url={c.partner?.photo_url} gender={c.partner?.gender} size={48} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, marginBottom: 3, fontSize: "0.92rem" }}>{c.partner?.name}</div><div style={{ fontSize: "0.82rem", color: G.brunLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMsg?.content || "Dis bonjour ! 👋"}</div></div></div>)}</div>;
}

function Profile({ auth, onLogout, onShowPremium }: { auth: Auth; onLogout: () => void; onShowPremium: (r: string) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; blocked_id: string; profile?: Profile }>>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"card" | "list">("card");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); loadBlocked(); }, []);
  const loadProfile = async () => {
    const res = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}`);
    if (res[0]) { setProfile(res[0]); setForm(res[0]); }
    setLoading(false);
  };
  const loadBlocked = async () => {
    const blocks = await sb.query<{ id: string; blocked_id: string }>(auth.token, "blocks", `?blocker_id=eq.${auth.userId}`);
    if (!blocks.length) { setBlockedUsers([]); return; }
    const enriched = await Promise.all(blocks.map(async b => {
      const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${b.blocked_id}`);
      return { ...b, profile: profiles[0] };
    }));
    setBlockedUsers(enriched);
  };
  const handleUnblock = async (blockId: string) => {
    await sb.delete(auth.token, "blocks", `?id=eq.${blockId}`);
    setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
    setToast({ msg: "Utilisateur débloqué ✅" });
  };
  const saveProfile = async () => {
    if (form.age && (form.age < 18 || form.age > 99)) { setErrorMsg("Vous devez avoir entre 18 et 99 ans. Modification refusée."); return; }
    await sb.update(auth.token, "profiles", auth.userId, { name: form.name, age: form.age, city: form.city, bio: form.bio, religion: form.religion });
    setProfile(p => p ? { ...p, ...(form as Profile) } : null);
    setEditing(false);
    setToast({ msg: "Profil mis à jour !" });
  };
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadLoading(true);
    const url = await sb.uploadPhoto(auth.token, auth.userId, file);
    if (url) { await sb.update(auth.token, "profiles", auth.userId, { photo_url: url }); setProfile(p => p ? { ...p, photo_url: url } : null); setToast({ msg: "Photo mise à jour ! 📸" }); }
    else setErrorMsg("Erreur lors du téléchargement de la photo. Réessaie.");
    setUploadLoading(false);
  };
  const handleDelete = async () => {
    await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}`);
    await sb.delete(auth.token, "likes", `?to_user=eq.${auth.userId}`);
    await sb.rpc(auth.token, "delete_user");
    await sb.signOut(auth.token);
    onLogout();
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>⏳</div>;

  /* ── FORMULAIRE EDITION ── */
  if (editing) return (
    <div style={{ paddingBottom: 30 }}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header édition */}
      <div style={{ background: G.blanc, borderBottom: `1px solid ${G.gris}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => setEditing(false)} style={{ cursor: "pointer", color: G.brunLight, fontSize: "1.1rem" }}>←</div>
        <div style={{  fontWeight: 700, fontSize: "1.1rem", color: G.brun }}>Modifier mon profil</div>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Prénom</label>
        <input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", fontFamily: "inherit" }} />
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Âge</label>
        <input type="number" value={form.age || ""} min={18} max={99} onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", fontFamily: "inherit" }} />
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Ville</label>
        <select value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", background: G.blanc, color: G.brun, fontFamily: "inherit" }}>
          {VILLES.map(c => c.startsWith("──") ? <option key={c} disabled>{c}</option> : <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Religion</label>
        <select value={form.religion || ""} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", background: G.blanc, color: G.brun, fontFamily: "inherit" }}>
          <option value="">Religion (optionnel)</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Bio</label>
        <textarea value={form.bio || ""} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 20, fontSize: "0.93rem", resize: "none", fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setEditing(false)} style={{ flex: 1 }}>Annuler</Btn>
          <Btn variant="primary" onClick={saveProfile} style={{ flex: 2 }}>Sauvegarder ✓</Btn>
        </div>
      </div>
    </div>
  );

  /* ── VUE PROFIL (style Tinder) ── */
  const isVisible = profile?.is_visible !== false;

  return (
    <div style={{ paddingBottom: 30, background: "#EEEEF2", minHeight: "100%" }}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />

      {/* ── ZONE BLANCHE : photo + nom + boutons ── */}
      <div style={{ background: G.blanc, textAlign: "center", paddingTop: 32, paddingBottom: 8 }}>

        {/* Photo ronde */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: `conic-gradient(${G.rouge} 0% 100%, ${G.gris} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 32px rgba(192,57,43,0.25)` }}>
            <div style={{ width: 108, height: 108, borderRadius: "50%", overflow: "hidden", background: G.gris, border: `3px solid ${G.blanc}` }}>
              <Avatar url={profile?.photo_url} gender={profile?.gender} size={108} premium={profile?.is_premium} />
            </div>
          </div>
          {profile?.is_premium ? (
            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${G.or},#B8860B)`, borderRadius: 50, padding: "4px 14px", fontSize: "0.68rem", fontWeight: 700, color: G.brun, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(212,168,67,0.4)" }}>⭐ Premium</div>
          ) : (
            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 50, padding: "4px 14px", fontSize: "0.68rem", fontWeight: 700, color: G.blanc, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(192,57,43,0.35)" }}>Gratuit</div>
          )}
        </div>

        {/* Nom + infos */}
        <div style={{ marginTop: 16, paddingBottom: 24, paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            {profile?.name}
          </div>
          <div style={{ color: "#444", fontSize: "0.92rem", fontWeight: 600, marginBottom: 4 }}>{profile?.age} ans · {profile?.gender}</div>
          {profile?.religion && <div style={{ color: "#444", fontSize: "0.88rem", fontWeight: 500, marginBottom: 3 }}>🙏 {profile.religion}</div>}
          {profile?.city && <div style={{ color: "#444", fontSize: "0.88rem", fontWeight: 500, marginBottom: 3 }}>📍 {profile.city}</div>}
          {profile?.bio && <div style={{ color: "#333", fontSize: "0.88rem", fontWeight: 600, lineHeight: 1.6, maxWidth: 260, margin: "8px auto 0" }}>"{profile.bio}"</div>}
        </div>

        {/* 4 Boutons : Modifier profil, Modifier photo, Liste noire, Voir mon profil */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingBottom: 0, paddingLeft: 8, paddingRight: 8 }}>
          {/* Modifier mon profil */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }} onClick={() => setEditing(true)}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Modifier mon<br/>profil</div>
          </div>

          {/* Modifier ma photo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }} onClick={() => fileRef.current?.click()}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(192,57,43,0.4)", position: "relative" }}>
              {uploadLoading ? <span style={{ fontSize: "1.3rem" }}>⏳</span> : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: G.blanc, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                <span style={{ fontSize: "0.65rem", color: G.rouge, fontWeight: 900, lineHeight: 1 }}>+</span>
              </div>
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Modifier ma<br/>photo</div>
          </div>

          {/* Liste noire */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }} onClick={() => setShowBlocked(true)}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", position: "relative" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              {blockedUsers.length > 0 && (
                <div style={{ position: "absolute", top: -2, right: -2, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, border: `2px solid ${G.blanc}` }}>{blockedUsers.length}</div>
              )}
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Liste<br/>noire</div>
          </div>

          {/* Voir mon profil */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }} onClick={() => setShowPreview(true)}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(26,92,58,0.35)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Voir mon<br/>profil</div>
          </div>
        </div>
      </div>

      {/* ── MODAL APERÇU PROFIL ── */}
      {showPreview && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#EEEEF2", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: G.blanc, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${G.gris}`, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1a1a1a" }}>Aperçu de mon profil</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Toggle carte / liste */}
                <div style={{ display: "flex", background: G.gris, borderRadius: 50, padding: 3, gap: 2 }}>
                  {(["card","list"] as const).map(m => (
                    <div key={m} onClick={() => setPreviewMode(m)} style={{ padding: "5px 14px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", background: previewMode === m ? G.blanc : "transparent", color: previewMode === m ? G.rouge : "#888", boxShadow: previewMode === m ? "0 2px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                      {m === "card" ? "Carte" : "Liste"}
                    </div>
                  ))}
                </div>
                <div onClick={() => setShowPreview(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
              </div>
            </div>

            {/* Contenu aperçu */}
            <div style={{ overflowY: "auto", flex: 1, padding: "20px 16px" }}>
              {previewMode === "card" ? (
                /* VUE CARTE */
                <div style={{ background: G.blanc, borderRadius: 22, boxShadow: "0 8px 36px rgba(44,26,14,0.12)", overflow: "hidden" }}>
                  <div style={{ height: 280, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {profile.photo_url ? <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "6rem" }}>{profile.gender === "Femme" ? "👩🏿" : "👨🏿"}</span>}
                  </div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: G.brun, marginBottom: 8 }}>{profile.name}, {profile.age} ans {profile.is_premium && "⭐"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.82rem", color: G.brunLight }}>📍 {profile.city}</span>
                      {profile.religion && <span style={{ background: "rgba(212,168,67,0.12)", border: `1px solid rgba(212,168,67,0.35)`, borderRadius: 50, padding: "2px 8px", fontSize: "0.75rem", color: G.brunLight }}>🙏 {profile.religion}</span>}
                    </div>
                    {profile.bio && <p style={{ fontSize: "0.85rem", color: G.brunLight, lineHeight: 1.5 }}>{profile.bio}</p>}
                  </div>
                  {/* Boutons nav factices */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, alignItems: "center", padding: "12px 16px 20px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>←</div>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", opacity: 0.4 }}>🤍</div>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>→</div>
                  </div>
                </div>
              ) : (
                /* VUE LISTE */
                <div style={{ background: G.blanc, borderRadius: 16, padding: "12px", boxShadow: "0 2px 12px rgba(44,26,14,0.07)", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 62, height: 62, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                    {profile.photo_url ? <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{profile.gender === "Femme" ? "👩🏿" : "👨🏿"}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{profile.name}, {profile.age} ans {profile.is_premium && "⭐"}</div>
                    <div style={{ fontSize: "0.78rem", color: G.brunLight, marginTop: 2 }}>📍 {profile.city}{profile.religion && <span style={{ marginLeft: 6 }}>· 🙏 {profile.religion}</span>}</div>
                    {profile.bio && <div style={{ fontSize: "0.78rem", color: G.brunLight, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.bio}</div>}
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(192,57,43,0.06)", border: `1.5px solid rgba(192,57,43,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(192,57,43,0.4)" stroke={G.rouge} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                </div>
              )}
              <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#aaa", marginTop: 16, fontStyle: "italic" }}>C'est ainsi que les autres voient votre profil</p>
            </div>

            {/* Bouton modifier */}
            <div style={{ padding: "12px 16px 24px", background: "#EEEEF2", flexShrink: 0 }}>
              <Btn variant="primary" onClick={() => { setShowPreview(false); setEditing(true); }} style={{ width: "100%" }}>✏️ Modifier mon profil</Btn>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: "#EEEEF2", position: "relative" }}>
        <svg viewBox="0 0 500 40" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 40, marginTop: -1 }}>
          <path d="M0,0 Q125,40 250,40 Q375,40 500,0 L500,0 L0,0 Z" fill={G.blanc}/>
        </svg>

        {/* ── ACTIONS (cartes empilées) ── */}
        <div style={{ padding: "32px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Passer à Premium — visible seulement si gratuit */}
        {!auth.isPremium && (
          <div onClick={() => onShowPremium("")} style={{
            background: `linear-gradient(135deg,${G.rouge} 0%,${G.rougeDark} 100%)`,
            borderRadius: 18, padding: "18px 20px", cursor: "pointer",
            boxShadow: "0 8px 28px rgba(192,57,43,0.35)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}>
            <div>
              <div style={{  fontSize: "1rem", fontWeight: 700, color: G.blanc, marginBottom: 3 }}>✨ Passer à Moyo Premium</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>Messages illimités · Likes illimités · Voir qui vous like</div>
            </div>
            <div style={{  fontSize: "1.2rem", fontWeight: 800, color: G.or, marginLeft: 12, flexShrink: 0 }}>3 500<br/><span style={{ fontSize: "0.65rem",  fontWeight: 600 }}>FCFA/mois</span></div>
          </div>
        )}

        {/* Toggle Visible / Invisible */}
        <div style={{
          background: G.blanc, borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #E8E8E8`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: isVisible ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              {isVisible ? "👁️" : "🔒"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>Profil {isVisible ? "visible" : "invisible"}</div>
              <div style={{ fontSize: "0.82rem", color: "#888", fontWeight: 400, marginTop: 2 }}>{isVisible ? "Tu apparais dans Découvrir" : "Tu n'apparais plus dans Découvrir"}</div>
            </div>
          </div>
          <div onClick={async () => {
            const newVal = !isVisible;
            await sb.update(auth.token, "profiles", auth.userId, { is_visible: newVal });
            setProfile(p => p ? { ...p, is_visible: newVal } : null);
            setToast({ msg: newVal ? "Profil rendu visible ✅" : "Profil rendu invisible 🔒" });
          }} style={{ width: 52, height: 28, borderRadius: 50, background: isVisible ? "#27ae60" : "#e74c3c", cursor: "pointer", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: isVisible ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: G.blanc, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "left 0.3s" }} />
          </div>
        </div>

        {/* Se déconnecter */}
        <div onClick={() => setShowLogout(true)} className="action-card" style={{
          background: G.rouge, borderRadius: 50, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 18px rgba(192,57,43,0.3)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: G.blanc }}>Se déconnecter</div>
        </div>

        {/* Supprimer mon compte */}
        <div onClick={() => setShowDelete(true)} className="action-card" style={{
          background: G.blanc, borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #FFE0E0`,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🗑️</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#e74c3c" }}>Supprimer mon compte</div>
          <div style={{ marginLeft: "auto", color: "#ffb3b3", fontSize: "1rem", fontWeight: 400 }}>›</div>
        </div>

        {/* Email de connexion — grisé, non modifiable */}
        <div style={{ marginTop: 4, background: G.blanc, borderRadius: 16, padding: "14px 18px", border: `1px solid #E8E8E8`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>✉️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Email de connexion</div>
            <div style={{ fontSize: "0.88rem", color: "#aaa", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{auth.email || "—"}</div>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#ccc", background: "#F5F5F5", padding: "3px 10px", borderRadius: 50, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>Non modifiable</div>
        </div>

      </div>{/* fin actions */}
      </div>{/* fin zone grise */}

      {/* ── MODAL LISTE NOIRE ── */}
      {showBlocked && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid #F5F5F5` }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Liste noire</div>
              <div onClick={() => setShowBlocked(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.2rem" }}>✕</div>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 0 20px" }}>
              {blockedUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>✅</div>
                  <p style={{ fontSize: "0.88rem" }}>Aucun utilisateur bloqué</p>
                </div>
              ) : blockedUsers.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: G.gris, overflow: "hidden", flexShrink: 0 }}>
                    {b.profile?.photo_url ? <img src={b.profile.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{b.profile?.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1a1a" }}>{b.profile?.name || "Utilisateur"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>📍 {b.profile?.city || "—"}</div>
                  </div>
                  <div onClick={() => handleUnblock(b.id)} style={{ background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.2)`, borderRadius: 50, padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, color: G.rouge, cursor: "pointer", flexShrink: 0 }}>Débloquer</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DÉCONNEXION ── */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>👋</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Se déconnecter ?</h3>
            <p style={{ fontSize: "0.88rem", fontWeight: 400, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Tu seras redirigé vers la page d'accueil. À bientôt sur Moyo !</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setShowLogout(false)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => { sb.signOut(auth.token); onLogout(); }} style={{ flex: 1 }}>Se déconnecter</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION ── */}
      {showDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Supprimer mon compte ?</h3>
            <p style={{ fontSize: "0.88rem", fontWeight: 400, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>Ton profil, tes likes et tes messages seront <strong style={{ color: "#1a1a1a" }}>définitivement supprimés</strong>.</p>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e74c3c", marginBottom: 24 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setShowDelete(false)} style={{ flex: 1 }}>Non, garder</Btn>
              <Btn variant="danger" onClick={handleDelete} style={{ flex: 1 }}>Oui, supprimer</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Admin({ auth, onBack }: { auth: Auth; onBack: () => void }) {
  const [stats, setStats] = useState({ users: 0, matches: 0, messages: 0, reports: 0 }); const [reports, setReports] = useState<Array<{ reason: string; reporter_id: string; status: string }>>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => { setLoading(true); const [users, matches, messages, reps] = await Promise.all([sb.query<Profile>(auth.token, "profiles", "?select=id"), sb.query<Match>(auth.token, "matches", "?select=id"), sb.query<Message>(auth.token, "messages", "?select=id"), sb.query<{ reason: string; reporter_id: string; status: string }>(auth.token, "reports", "?order=created_at.desc&limit=20")]); setStats({ users: users.length, matches: matches.length, messages: messages.length, reports: reps.length }); setReports(reps); setLoading(false); };
  return <div style={{ padding: "16px" }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div onClick={onBack} style={{ cursor: "pointer", fontSize: "1.1rem", color: G.brunLight }}>←</div><h2 style={{  fontSize: "1.3rem", fontWeight: 700 }}>⚙️ Admin Dashboard</h2></div>{loading ? <div style={{ textAlign: "center", padding: 40 }}>⏳</div> : <><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>{[["Membres", stats.users, "👥"], ["Matchs", stats.matches, "💞"], ["Messages", stats.messages, "💬"], ["Signalements", stats.reports, "🚨"]].map(([label, value, icon]: any) => <div key={label} style={{ background: G.blanc, borderRadius: 16, padding: "16px" }}><div style={{ fontSize: "1.8rem" }}>{icon}</div><div style={{  fontSize: "1.8rem", fontWeight: 700, color: G.rouge }}>{value}</div><div style={{ fontSize: "0.75rem", color: G.brunLight }}>{label}</div></div>)}</div><div style={{ background: G.blanc, borderRadius: 16, padding: "16px" }}><h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 12, color: G.brunLight }}>🚨 Signalements récents</h3>{reports.length === 0 ? <p style={{ color: G.brunLight, fontSize: "0.85rem" }}>Aucun signalement</p> : reports.map((r, i) => <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${G.gris}`, fontSize: "0.82rem" }}><div style={{ fontWeight: 600, color: G.rouge }}>Motif : {r.reason}</div><div style={{ color: G.brunLight }}>ID : {r.reporter_id?.slice(0, 12)}...</div></div>)}</div><Btn variant="ghost" onClick={loadStats} style={{ width: "100%", marginTop: 12 }}>🔄 Actualiser</Btn></>}</div>;
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [tab, setTab] = useState("discover");
  const [auth, setAuth] = useState<Auth | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [premiumModal, setPremiumModal] = useState<string | null>(null);
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
    // Confirmation email — rediriger vers login (Supabase valide le token automatiquement via l'URL)
    if ((type === "signup" || type === "email_confirmation") && accessToken) {
      window.location.hash = "";
      setPage("login");
      return;
    }
    try {
      const saved = localStorage.getItem("moyo_session");
      if (saved) {
        const a: Auth = JSON.parse(saved);
        if (a?.token && a?.userId) { setAuth(a); setPage("app"); }
      }
    } catch { localStorage.removeItem("moyo_session"); }
  }, []);

  const handleAuth = (a: Auth) => {
    setAuth(a); setPage("app");
    try { localStorage.setItem("moyo_session", JSON.stringify(a)); } catch {}
  };
  const handleLogout = () => {
    setAuth(null); setPage("landing"); setUnreadCount(0); setNotifCount(0); setLikesReceived(0);
    try { localStorage.removeItem("moyo_session"); } catch {}
  };
  useEffect(() => {
    if (!auth) return;

    // Rafraîchir le statut premium
    const refreshPremium = async () => {
      const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}`);
      if (profiles[0] && profiles[0].is_premium !== auth.isPremium) {
        const updated = { ...auth, isPremium: profiles[0].is_premium, isAdmin: profiles[0].is_admin || false };
        setAuth(updated);
        try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
      }
    };
    refreshPremium();

    // Likes reçus
    const loadLikesReceived = async () => {
      const res = await sb.query<object>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user`);
      setLikesReceived(Array.isArray(res) ? res.length : 0);
    };
    loadLikesReceived();
    const likesInterval = setInterval(loadLikesReceived, 30000);

    // Polling 5s pour les messages non lus
    const checkUnread = async () => {
      try {
        const res = await sb.query<object>(auth.token, "messages",
          `?sender_id=neq.${auth.userId}&is_read=eq.false&select=id`
        );
        setUnreadCount(Array.isArray(res) ? res.length : 0);
      } catch {}
    };
    checkUnread();
    const msgInterval = setInterval(checkUnread, 5000);

    return () => {
      clearInterval(likesInterval);
      clearInterval(msgInterval);
    };
  }, [auth?.userId]);
  const showPremium = (r = "") => setPremiumModal(r || "Passe Premium pour débloquer toutes les fonctionnalités !");
  if (page === "landing") return <Landing onNav={setPage} />;
  if (page === "about") return <About onBack={() => setPage("landing")} />;
  if (page === "signup") return <SignUp onNav={setPage} />;
  if (page === "login") return <Login onNav={setPage} onAuth={handleAuth} />;
  if (page === "reset-password") return <ResetPassword onNav={setPage} />;
  if (!auth) return <Landing onNav={setPage} />;
  return <><AppShell tab={tab} setTab={setTab} unreadCount={unreadCount} notifCount={likesReceived} auth={auth}>{tab === "discover" && <Discover auth={auth} onShowPremium={showPremium} />}{tab === "matches" && <Matches auth={auth} onShowPremium={showPremium} onNotifCount={setNotifCount} onGoMessages={() => setTab("messages")} />}{tab === "messages" && <Messages auth={auth} onUnreadCount={setUnreadCount} onShowPremium={showPremium} />}{tab === "profile" && <Profile auth={auth} onLogout={handleLogout} onShowPremium={showPremium} />}{tab === "admin" && <Admin auth={auth} onBack={() => setTab("discover")} />}</AppShell>{premiumModal && <PremiumModal reason={premiumModal} onClose={() => setPremiumModal(null)} />}</>;
}
