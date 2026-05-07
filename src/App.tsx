import { useState, useEffect, useRef } from "react";

/* ─── SUPABASE CONFIG ─── */
const SUPABASE_URL = "https://jqcrpdoyvrhsjrfyaakn.supabase.co";
const SUPABASE_KEY = "sb_publishable_zVgmtOt6bLmBxT8JQKDoAw_odpG-8g5";

const sb = {
  headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  async fetch(path, opts = {}) {
    const r = await fetch(`${SUPABASE_URL}${path}`, { headers: this.headers, ...opts });
    return r.json();
  },
  // Auth
  async signUp(email, password) {
    return fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    }).then(r => r.json());
  },
  async signIn(email, password) {
    return fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    }).then(r => r.json());
  },
  async signOut(token) {
    return fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { ...this.headers, "Authorization": `Bearer ${token}` }
    });
  },
  async getUser(token) {
    return fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { ...this.headers, "Authorization": `Bearer ${token}` }
    }).then(r => r.json());
  },
  // DB avec token utilisateur
  authHeaders(token) {
    return { ...this.headers, "Authorization": `Bearer ${token}` };
  },
  async query(token, table, params = "") {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
      headers: { ...this.authHeaders(token), "Prefer": "return=representation" }
    }).then(r => r.json());
  },
  async insert(token, table, data) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.authHeaders(token), "Prefer": "return=representation" },
      body: JSON.stringify(data)
    }).then(r => r.json());
  },
  async update(token, table, id, data) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...this.authHeaders(token), "Prefer": "return=representation" },
      body: JSON.stringify(data)
    }).then(r => r.json());
  },
  async upsert(token, table, data) {
    return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.authHeaders(token), "Prefer": "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(data)
    }).then(r => r.json());
  },
};

/* ─── PALETTE ─── */
const G = {
  rouge: "#C0392B", rougeDark: "#922B21",
  or: "#D4A843", orLight: "#F0C96A",
  vert: "#1A5C3A", creme: "#FAF3E8",
  cremeDark: "#F0E6D3", brun: "#2C1A0E",
  brunLight: "#5C3D2A", blanc: "#FFFFFF", gris: "#E8DDD0",
};

/* ─── HELPERS UI ─── */
function Btn({ children, variant = "primary", onClick, style = {}, disabled = false, loading = false }) {
  const base = {
    border: "none", borderRadius: 50, padding: "13px 28px",
    fontWeight: 600, fontSize: "0.93rem", transition: "all 0.2s",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.65 : 1, fontFamily: "inherit", ...style,
  };
  const v = {
    primary: { background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.3)" },
    gold: { background: G.or, color: G.brun, boxShadow: "0 4px 18px rgba(212,168,67,0.3)" },
    outline: { background: "transparent", color: G.brun, border: `2px solid ${G.brun}` },
    ghost: { background: "rgba(44,26,14,0.06)", color: G.brun },
    danger: { background: "#e74c3c", color: G.blanc },
    white: { background: G.blanc, color: G.rouge },
  };
  return <button style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled || loading}>{loading ? "⏳" : children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, icon, error }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>{label}</label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", opacity: 0.6 }}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", padding: icon ? "13px 14px 13px 42px" : "13px 14px",
            border: `2px solid ${error ? "#e74c3c" : focus ? G.or : G.gris}`,
            borderRadius: 12, fontSize: "0.93rem", background: G.blanc,
            color: G.brun, outline: "none", transition: "border-color 0.2s", fontFamily: "inherit",
          }}
        />
      </div>
      {error && <p style={{ color: "#e74c3c", fontSize: "0.78rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: type === "error" ? "#e74c3c" : G.vert,
      color: G.blanc, padding: "12px 24px", borderRadius: 50,
      fontSize: "0.9rem", fontWeight: 600, zIndex: 9999,
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
    }}>{type === "error" ? "❌" : "✅"} {msg}</div>
  );
}

/* ─── LANDING ─── */
function Landing({ onNav }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${G.creme} 55%, ${G.vert} 100%)` }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: G.rouge, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="ghost" onClick={() => onNav("login")} style={{ padding: "10px 20px" }}>Connexion</Btn>
          <Btn variant="primary" onClick={() => onNav("signup")} style={{ padding: "10px 22px" }}>S'inscrire →</Btn>
        </div>
      </nav>
      <div style={{ maxWidth: 600, margin: "60px auto 0", padding: "0 32px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(212,168,67,0.15)", border: `1px solid ${G.or}`, padding: "6px 18px", borderRadius: 50, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 28, color: G.brunLight }}>🇨🇬 Site de rencontres — Congo-Brazzaville</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.5rem,6vw,4rem)", lineHeight: 1.1, fontWeight: 700, marginBottom: 24 }}>
          Trouve ton <em style={{ color: G.rouge, fontStyle: "italic" }}>âme sœur</em><br />au Congo
        </h1>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.75, color: G.brunLight, marginBottom: 40 }}>
          Moyo connecte les Congolais à la recherche d'une relation sincère — Brazzaville, Pointe-Noire, Dolisie et la diaspora.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" onClick={() => onNav("signup")} style={{ padding: "16px 40px", fontSize: "1rem" }}>Créer mon profil gratuit</Btn>
          <Btn variant="outline" onClick={() => onNav("login")} style={{ padding: "14px 32px", fontSize: "1rem" }}>J'ai déjà un compte</Btn>
        </div>
        <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 56 }}>
          {[["❤️", "Rencontres sincères"], ["✅", "Profils vérifiés"], ["🇨🇬", "100% Congolais"]].map(([i, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{i}</div>
              <div style={{ fontSize: "0.8rem", color: G.brunLight, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SIGNUP ─── */
function SignUp({ onNav, onAuth }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", name: "", age: "", city: "", gender: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Créer le compte auth
      const auth = await sb.signUp(form.email, form.password);
      if (auth.error) { setToast({ msg: auth.error.message, type: "error" }); setLoading(false); return; }

      // 2. Se connecter pour avoir le token
      const login = await sb.signIn(form.email, form.password);
      if (login.error) { setToast({ msg: "Compte créé ! Vérifie ton email.", type: "success" }); setLoading(false); return; }

      const token = login.access_token;
      const userId = login.user.id;

      // 3. Créer le profil
      await sb.upsert(token, "profiles", {
        id: userId,
        name: form.name,
        age: parseInt(form.age),
        city: form.city,
        gender: form.gender,
        bio: form.bio,
        is_premium: false,
      });

      onAuth({ token, userId, name: form.name });
    } catch (e) {
      setToast({ msg: "Erreur de connexion. Réessaie.", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: `linear-gradient(160deg, ${G.creme}, ${G.cremeDark})` }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ background: G.blanc, borderRadius: 28, padding: "44px 40px", width: "100%", maxWidth: 440, boxShadow: "0 20px 70px rgba(44,26,14,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: G.rouge, fontWeight: 700, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700 }}>{step === 1 ? "Crée ton compte" : "Ton profil"}</h2>
          <p style={{ color: G.brunLight, fontSize: "0.88rem", marginTop: 4 }}>Étape {step}/2</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[1, 2].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? G.rouge : G.gris, transition: "background 0.3s" }} />)}
        </div>

        {step === 1 && <>
          <Input label="Email" type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="ton@email.com" icon="✉️" />
          <Input label="Mot de passe" type="password" value={form.password} onChange={e => upd("password", e.target.value)} placeholder="Minimum 6 caractères" icon="🔒" />
          <Btn variant="primary" onClick={() => setStep(2)} style={{ width: "100%", marginTop: 8 }} disabled={!form.email || form.password.length < 6}>
            Continuer →
          </Btn>
        </>}

        {step === 2 && <>
          <Input label="Prénom" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Ex: Faïda" icon="👤" />
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Je suis</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["Homme", "Femme"].map(g => (
                <div key={g} onClick={() => upd("gender", g)} style={{
                  flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", cursor: "pointer",
                  border: `2px solid ${form.gender === g ? G.rouge : G.gris}`,
                  background: form.gender === g ? "rgba(192,57,43,0.06)" : G.blanc,
                  fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s",
                }}>{g === "Homme" ? "👨🏿 Homme" : "👩🏿 Femme"}</div>
              ))}
            </div>
          </div>
          <Input label="Âge" type="number" value={form.age} onChange={e => upd("age", e.target.value)} placeholder="Ex: 25" icon="🎂" />
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Ville</label>
            <select value={form.city} onChange={e => upd("city", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: G.brun, outline: "none", fontFamily: "inherit" }}>
              <option value="">Sélectionne ta ville</option>
              {["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Impfondo", "Ouesso", "Madingou", "Diaspora / Autre"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Bio (optionnel)</label>
            <textarea value={form.bio} onChange={e => upd("bio", e.target.value)} placeholder="Parle un peu de toi..." rows={3}
              style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: G.brun, outline: "none", resize: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Retour</Btn>
            <Btn variant="primary" onClick={handleSubmit} loading={loading} style={{ flex: 2 }} disabled={!form.name || !form.gender || !form.age || !form.city}>
              Créer mon compte 🎉
            </Btn>
          </div>
        </>}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: G.brunLight }}>
          Déjà un compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("login")}>Se connecter</span>
        </p>
      </div>
    </div>
  );
}

/* ─── LOGIN ─── */
function Login({ onNav, onAuth }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await sb.signIn(form.email, form.password);
      if (res.error) { setToast({ msg: "Email ou mot de passe incorrect.", type: "error" }); setLoading(false); return; }
      const profile = await sb.query(res.access_token, "profiles", `?id=eq.${res.user.id}`);
      onAuth({ token: res.access_token, userId: res.user.id, name: profile[0]?.name || "Utilisateur" });
    } catch { setToast({ msg: "Erreur de connexion.", type: "error" }); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: `linear-gradient(160deg, ${G.creme}, ${G.cremeDark})` }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ background: G.blanc, borderRadius: 28, padding: "44px 40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 70px rgba(44,26,14,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: G.rouge, fontWeight: 700, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700 }}>Bon retour !</h2>
          <p style={{ color: G.brunLight, fontSize: "0.88rem", marginTop: 4 }}>Retrouve tes matchs</p>
        </div>
        <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ton@email.com" icon="✉️" />
        <Input label="Mot de passe" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" icon="🔒" />
        <Btn variant="primary" onClick={handleLogin} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!form.email || !form.password}>
          Se connecter →
        </Btn>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: G.brunLight }}>
          Pas encore de compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("signup")}>S'inscrire</span>
        </p>
      </div>
    </div>
  );
}

/* ─── APP SHELL ─── */
function AppShell({ children, tab, setTab, name, onLogout }) {
  const tabs = [
    { id: "discover", icon: "🔥", label: "Découvrir" },
    { id: "matches", icon: "💞", label: "Matchs" },
    { id: "messages", icon: "💬", label: "Messages" },
    { id: "profile", icon: "👤", label: "Profil" },
  ];
  return (
    <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: G.creme }}>
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.blanc, borderBottom: `1px solid ${G.gris}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", color: G.rouge, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
        <div style={{ fontSize: "0.85rem", color: G.brunLight, fontWeight: 500 }}>Bonjour {name} 👋</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 75 }}>{children}</div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, background: G.blanc, borderTop: `1px solid ${G.gris}`, display: "flex", justifyContent: "space-around", padding: "10px 0 14px", zIndex: 50 }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: tab === t.id ? G.rouge : "#bbb", transition: "color 0.2s" }}>
            <div style={{ fontSize: "1.3rem", transform: tab === t.id ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s" }}>{t.icon}</div>
            <div style={{ fontSize: "0.62rem", fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DISCOVER ─── */
function Discover({ auth }) {
  const [profiles, setProfiles] = useState([]);
  const [idx, setIdx] = useState(0);
  const [action, setAction] = useState(null);
  const [matchPop, setMatchPop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      // Charger profils sauf le sien + ceux déjà likés
      const all = await sb.query(auth.token, "profiles", `?id=neq.${auth.userId}&limit=20`);
      const liked = await sb.query(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user`);
      const likedIds = liked.map ? liked.map(l => l.to_user) : [];
      setProfiles((all || []).filter(p => !likedIds.includes(p.id)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const swipe = async (dir) => {
    if (!profiles[idx]) return;
    setAction(dir);
    const target = profiles[idx];

    if (dir === "like") {
      try {
        await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: target.id });
        // Vérifier si match mutuel
        const mutual = await sb.query(auth.token, "likes", `?from_user=eq.${target.id}&to_user=eq.${auth.userId}`);
        if (mutual && mutual.length > 0) {
          await sb.insert(auth.token, "matches", { user1: auth.userId, user2: target.id });
          setTimeout(() => setMatchPop(target), 300);
        }
      } catch (e) { console.error(e); }
    }

    setTimeout(() => {
      setAction(null);
      setIdx(i => i + 1);
    }, 400);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: G.brunLight }}>⏳ Chargement des profils...</div>;

  const p = profiles[idx];

  return (
    <div style={{ padding: "20px" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 700, marginBottom: 20 }}>Découvrir 🔥</h2>

      {!p ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: G.brunLight }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>😊</div>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", marginBottom: 8 }}>Tu as vu tous les profils !</h3>
          <p style={{ fontSize: "0.9rem", marginBottom: 24 }}>Reviens plus tard quand de nouveaux membres s'inscriront.</p>
          <Btn variant="primary" onClick={loadProfiles}>Actualiser</Btn>
        </div>
      ) : (
        <>
          <div style={{ position: "relative", marginBottom: 24 }}>
            {/* Carte arrière */}
            {profiles[idx + 1] && <div style={{ position: "absolute", inset: "10px 10px -4px", background: G.blanc, borderRadius: 24, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }} />}
            {/* Carte principale */}
            <div style={{
              background: G.blanc, borderRadius: 24,
              boxShadow: "0 8px 36px rgba(44,26,14,0.13)", overflow: "hidden",
              transform: action === "like" ? "rotate(7deg) translateX(50px)" : action === "nope" ? "rotate(-7deg) translateX(-50px)" : "none",
              opacity: action ? 0.4 : 1, transition: "all 0.35s ease", position: "relative",
            }}>
              {/* Photo placeholder */}
              <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem", background: `linear-gradient(160deg, #E8C5A0, #C47A4A)`, position: "relative" }}>
                {p.gender === "Femme" ? "👩🏿" : "👨🏿"}
                {action === "like" && <div style={{ position: "absolute", top: 20, left: 20, border: "4px solid #27ae60", color: "#27ae60", borderRadius: 8, padding: "5px 14px", fontWeight: 700, fontSize: "1.3rem", transform: "rotate(-15deg)", background: "rgba(255,255,255,0.9)" }}>LIKE ✓</div>}
                {action === "nope" && <div style={{ position: "absolute", top: 20, right: 20, border: `4px solid ${G.rouge}`, color: G.rouge, borderRadius: 8, padding: "5px 14px", fontWeight: 700, fontSize: "1.3rem", transform: "rotate(15deg)", background: "rgba(255,255,255,0.9)" }}>NOPE ✗</div>}
              </div>
              <div style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700 }}>{p.name}, {p.age}</div>
                    <div style={{ color: G.brunLight, fontSize: "0.83rem" }}>📍 {p.city}</div>
                  </div>
                </div>
                {p.bio && <p style={{ fontSize: "0.88rem", color: G.brunLight, lineHeight: 1.6 }}>{p.bio}</p>}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", justifyContent: "center", gap: 28, alignItems: "center" }}>
            <div onClick={() => swipe("nope")} style={{ width: 60, height: 60, borderRadius: "50%", background: G.blanc, border: "2px solid #e74c3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(231,76,60,0.18)", transition: "transform 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>✗</div>
            <div onClick={() => swipe("like")} style={{ width: 70, height: 70, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", cursor: "pointer", boxShadow: `0 6px 22px rgba(192,57,43,0.38)`, transition: "transform 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>❤️</div>
          </div>
          <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.78rem", color: "#bbb" }}>{profiles.length - idx - 1} profil(s) restant(s)</p>
        </>
      )}

      {/* Match popup */}
      {matchPop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}>
          <div style={{ textAlign: "center", color: G.blanc }}>
            <div style={{ fontSize: "4.5rem", marginBottom: 12 }}>💞</div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", color: G.or, marginBottom: 8 }}>C'est un Match !</h2>
            <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 32, fontSize: "1rem" }}>Toi et {matchPop.name} vous vous plaisez mutuellement !</p>
            <Btn variant="white" onClick={() => setMatchPop(null)}>Continuer à découvrir →</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MATCHES ─── */
function Matches({ auth }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await sb.query(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})`);
      if (!res || !res.length) { setMatches([]); setLoading(false); return; }
      // Charger les profils des partenaires
      const enriched = await Promise.all(res.map(async m => {
        const partnerId = m.user1 === auth.userId ? m.user2 : m.user1;
        const p = await sb.query(auth.token, "profiles", `?id=eq.${partnerId}`);
        return { ...m, partner: p[0] };
      }));
      setMatches(enriched.filter(m => m.partner));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 700, marginBottom: 20 }}>Mes Matchs 💞</h2>
      {loading ? <div style={{ textAlign: "center", color: G.brunLight, padding: 40 }}>⏳ Chargement...</div> :
        matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: G.brunLight }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>💘</div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", marginBottom: 8 }}>Pas encore de matchs</h3>
            <p style={{ fontSize: "0.88rem" }}>Continue à liker des profils pour avoir des matchs !</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {matches.map(m => (
              <div key={m.id} style={{ background: G.blanc, borderRadius: 18, overflow: "hidden", boxShadow: "0 3px 16px rgba(44,26,14,0.08)" }}>
                <div style={{ height: 110, background: `linear-gradient(160deg, #E8C5A0, #C47A4A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
                  {m.partner.gender === "Femme" ? "👩🏿" : "👨🏿"}
                </div>
                <div style={{ padding: "12px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{m.partner.name}, {m.partner.age}</div>
                  <div style={{ fontSize: "0.75rem", color: G.brunLight }}>📍 {m.partner.city}</div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#27ae60", fontWeight: 600 }}>💞 Match !</div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ─── MESSAGES ─── */
function Messages({ auth }) {
  const [convs, setConvs] = useState([]);
  const [open, setOpen] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { loadConvs(); }, []);
  useEffect(() => { if (open) loadMsgs(open); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const loadConvs = async () => {
    setLoading(true);
    try {
      const res = await sb.query(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})`);
      if (!res?.length) { setConvs([]); setLoading(false); return; }
      const enriched = await Promise.all(res.map(async m => {
        const partnerId = m.user1 === auth.userId ? m.user2 : m.user1;
        const p = await sb.query(auth.token, "profiles", `?id=eq.${partnerId}`);
        const lastMsg = await sb.query(auth.token, "messages", `?match_id=eq.${m.id}&order=created_at.desc&limit=1`);
        return { ...m, partner: p[0], lastMsg: lastMsg[0] };
      }));
      setConvs(enriched.filter(c => c.partner));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadMsgs = async (conv) => {
    const res = await sb.query(auth.token, "messages", `?match_id=eq.${conv.id}&order=created_at.asc`);
    setMsgs(res || []);
  };

  const send = async () => {
    if (!text.trim() || !open) return;
    setSending(true);
    const res = await sb.insert(auth.token, "messages", { match_id: open.id, sender_id: auth.userId, content: text });
    if (res && !res.error) { setMsgs(m => [...m, res[0]]); setText(""); }
    setSending(false);
  };

  if (open) return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      <div style={{ padding: "14px 18px", background: G.blanc, borderBottom: `1px solid ${G.gris}`, display: "flex", gap: 14, alignItems: "center" }}>
        <div onClick={() => { setOpen(null); loadConvs(); }} style={{ cursor: "pointer", fontSize: "1.2rem", color: G.brunLight }}>←</div>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(160deg,#E8C5A0,#C47A4A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{open.partner?.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{open.partner?.name}</div>
          <div style={{ fontSize: "0.72rem", color: "#27ae60" }}>● Actif</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 && <div style={{ textAlign: "center", color: G.brunLight, padding: "30px 0", fontSize: "0.88rem" }}>C'est votre nouveau match ! Dites bonjour 👋</div>}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.sender_id === auth.userId ? "flex-end" : "flex-start" }}>
            <div style={{ background: m.sender_id === auth.userId ? G.rouge : G.blanc, color: m.sender_id === auth.userId ? G.blanc : G.brun, padding: "10px 15px", borderRadius: m.sender_id === auth.userId ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "72%", fontSize: "0.9rem", lineHeight: 1.5, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 14px", background: G.blanc, borderTop: `1px solid ${G.gris}`, display: "flex", gap: 10 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Écris un message..." style={{ flex: 1, padding: "12px 16px", border: `2px solid ${G.gris}`, borderRadius: 50, fontSize: "0.9rem", outline: "none", background: G.creme, fontFamily: "inherit" }} />
        <div onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: sending ? G.gris : G.rouge, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1rem", color: G.blanc }}>➤</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 700, marginBottom: 20 }}>Messages 💬</h2>
      {loading ? <div style={{ textAlign: "center", color: G.brunLight, padding: 40 }}>⏳ Chargement...</div> :
        convs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: G.brunLight }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>💬</div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", marginBottom: 8 }}>Pas encore de conversations</h3>
            <p style={{ fontSize: "0.88rem" }}>Fais des matchs pour pouvoir envoyer des messages !</p>
          </div>
        ) : convs.map(c => (
          <div key={c.id} onClick={() => setOpen(c)} style={{ display: "flex", gap: 14, alignItems: "center", padding: "15px", background: G.blanc, borderRadius: 16, marginBottom: 10, cursor: "pointer", boxShadow: "0 2px 10px rgba(44,26,14,0.05)", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(160deg,#E8C5A0,#C47A4A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>{c.partner?.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 3 }}>{c.partner?.name}</div>
              <div style={{ fontSize: "0.82rem", color: G.brunLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMsg?.content || "Dis bonjour ! 👋"}</div>
            </div>
          </div>
        ))}
    </div>
  );
}

/* ─── PROFILE ─── */
function Profile({ auth, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const res = await sb.query(auth.token, "profiles", `?id=eq.${auth.userId}`);
    if (res[0]) { setProfile(res[0]); setForm(res[0]); }
    setLoading(false);
  };

  const saveProfile = async () => {
    const res = await sb.update(auth.token, "profiles", auth.userId, { name: form.name, age: form.age, city: form.city, bio: form.bio });
    if (res && !res.error) { setProfile(form); setEditing(false); setToast({ msg: "Profil mis à jour !" }); }
  };

  const handleLogout = async () => {
    await sb.signOut(auth.token);
    onLogout();
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: G.brunLight }}>⏳ Chargement...</div>;

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast msg={toast.msg} onClose={() => setToast(null)} />}
      {/* Cover */}
      <div style={{ height: 120, background: `linear-gradient(160deg, ${G.vert}, #0D2E1C)`, position: "relative" }}>
        <div style={{ position: "absolute", bottom: -34, left: "50%", transform: "translateX(-50%)", width: 70, height: 70, borderRadius: "50%", background: `linear-gradient(160deg,#E8C5A0,#C47A4A)`, border: "4px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>
          {profile?.gender === "Femme" ? "👩🏿" : "👨🏿"}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 44, padding: "0 20px 0" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700 }}>{profile?.name}</h2>
        <p style={{ color: G.brunLight, fontSize: "0.85rem" }}>📍 {profile?.city} · {profile?.age} ans</p>
        {profile?.bio && <p style={{ color: G.brunLight, fontSize: "0.88rem", marginTop: 8, lineHeight: 1.6, maxWidth: 300, margin: "8px auto 0" }}>{profile.bio}</p>}
      </div>

      {/* Edit form */}
      {editing ? (
        <div style={{ padding: "20px" }}>
          <Input label="Prénom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Âge" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Ville</label>
            <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: G.brun, outline: "none", fontFamily: "inherit" }}>
              {["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Impfondo", "Ouesso", "Madingou", "Diaspora / Autre"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: G.brunLight }}>Bio</label>
            <textarea value={form.bio || ""} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
              style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, resize: "none", outline: "none", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setEditing(false)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn variant="primary" onClick={saveProfile} style={{ flex: 2 }}>Sauvegarder ✓</Btn>
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px" }}>
          <Btn variant="ghost" onClick={() => setEditing(true)} style={{ width: "100%", marginBottom: 10 }}>✏️ Modifier mon profil</Btn>
          <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 18, padding: "20px", marginBottom: 10, color: G.blanc, textAlign: "center" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>✨ Passe à Premium</div>
            <div style={{ fontSize: "0.82rem", opacity: 0.85, marginBottom: 12 }}>Likes illimités · Voir qui t'a liké · Messages illimités</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "1.7rem", fontWeight: 700, color: G.or, marginBottom: 12 }}>5 000 FCFA/mois</div>
            <Btn variant="gold" style={{ width: "100%", opacity: 0.9 }}>Bientôt disponible 🔜</Btn>
          </div>
          <Btn variant="danger" onClick={handleLogout} style={{ width: "100%", marginTop: 8 }}>🚪 Se déconnecter</Btn>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN ─── */
export default function App() {
  const [page, setPage] = useState("landing");
  const [tab, setTab] = useState("discover");
  const [auth, setAuth] = useState(null);

  const handleAuth = (authData) => { setAuth(authData); setPage("app"); };
  const handleLogout = () => { setAuth(null); setPage("landing"); };

  if (page === "landing") return <Landing onNav={setPage} />;
  if (page === "signup") return <SignUp onNav={setPage} onAuth={handleAuth} />;
  if (page === "login") return <Login onNav={setPage} onAuth={handleAuth} />;

  return (
    <AppShell tab={tab} setTab={setTab} name={auth?.name} onLogout={handleLogout}>
      {tab === "discover" && <Discover auth={auth} />}
      {tab === "matches" && <Matches auth={auth} />}
      {tab === "messages" && <Messages auth={auth} />}
      {tab === "profile" && <Profile auth={auth} onLogout={handleLogout} />}
    </AppShell>
  );
}