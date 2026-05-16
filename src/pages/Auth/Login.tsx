import React, { useState, useEffect, useRef, useCallback, memo } from "react";
// ── imports à compléter depuis ../lib, ../constants, ../components ──

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
        setErrorMsg("Adresse e-mail ou mot de passe incorrect. Veuillez vérifier vos informations et réessayer.");
        setLoading(false); return;
      }
      const profiles = await sb.query<Profile>(res.access_token, "profiles", `?id=eq.${res.user.id}`);
      if (!profiles[0]) {
        setErrorMsg("Profil introuvable. Réessaie dans quelques secondes.");
        setLoading(false); return;
      }
      if ((profiles[0] as any).is_banned) {
        await sb.signOut(res.access_token);
        setErrorMsg("Ton compte a été suspendu suite à une violation des conditions d'utilisation de Moyo. Pour toute réclamation, contacte-nous à contact@moyo-congo.com");
        setLoading(false); return;
      }
      onAuth({
        token: res.access_token,
        userId: res.user.id,
        name: profiles[0].name || "Utilisateur",
        email: res.user.email || "",
        isPremium: profiles[0].is_premium || false,
        isAdmin: profiles[0].is_admin || false,
        // ── SESSION v2 : persist refresh_token + expiration ──
        refreshToken: res.refresh_token || undefined,
        expiresAt: res.expires_in ? Date.now() + res.expires_in * 1000 : undefined,
      });
    } catch { setErrorMsg("Erreur de connexion. Veuillez vérifier votre adresse e-mail ou votre mot de passe."); }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!forgotEmail) { setErrorMsg("Entre ton email."); return; }
    await sb.resetPassword(forgotEmail.trim());
    setForgotSent(true);
  };

  if (showForgot) return <AuthLayout onBack={() => onNav("landing")}><ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}<div style={{ textAlign: "center", marginBottom: 24 }}><div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div><h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginTop: 8 }}>Mot de passe oublié</h2></div>{forgotSent ? <div style={{ textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><p style={{ color: "#555", fontSize: "0.88rem", marginBottom: 20 }}>Email envoyé ! Vérifie ta boîte mail.</p><Btn variant="ghost" onClick={() => { setShowForgot(false); setForgotSent(false); }}>← Retour à la connexion</Btn></div> : <><Input label="Ton email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="ton@email.com" icon="email" /><Btn variant="primary" onClick={handleForgot} style={{ width: "100%", marginBottom: 12 }}>Envoyer le lien</Btn><div style={{ textAlign: "center" }}><span onClick={() => setShowForgot(false)} style={{ fontSize: "0.85rem", color: "#555", cursor: "pointer" }}>← Retour</span></div></>}</AuthLayout>;

  return <AuthLayout onBack={() => onNav("landing")}><ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}<div style={{ textAlign: "center", marginBottom: 28 }}><div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div><h2 style={{  fontSize: "1.6rem", fontWeight: 700, marginTop: 6 }}>Bon retour !</h2><p style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>Retrouve tes matchs</p></div><Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ton@email.com" icon="email" /><Input label="Mot de passe" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" icon="lock" /><div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}><span onClick={() => setShowForgot(true)} style={{ fontSize: "0.82rem", color: G.rouge, cursor: "pointer", fontWeight: 500 }}>Mot de passe oublié ?</span></div><Btn variant="primary" onClick={handleLogin} loading={loading} style={{ width: "100%" }} disabled={!form.email || !form.password}>Se connecter →</Btn><p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#555" }}>Pas encore de compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("signup")}>S'inscrire</span></p></AuthLayout>;
}
