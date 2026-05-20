import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function AuthLayout({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(160deg,${G.creme},${G.cremeDark})`, padding: 0, overflowX: "hidden" }}>
    <div onClick={onBack} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(192,57,43,0.35)", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </div>
      <span style={{ color: "#555", fontWeight: 600, fontSize: "0.9rem" }}>Accueil</span>
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px 40px" }}><div style={{ background: G.blanc, borderRadius: 24, padding: "36px 24px", width: "100%", maxWidth: 420, boxShadow: "0 20px 70px rgba(44,26,14,0.12)", overflowX: "hidden" }}>{children}</div></div>
  </div>;
}

export function Login({ onNav, onAuth }: { onNav: (p: string) => void; onAuth: (a: Auth) => void }) {
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
        const errMsg = res.error?.message || "";
        if (errMsg.includes("Email not confirmed") || errMsg.includes("email_not_confirmed")) {
          setErrorMsg("Votre email n'est pas encore confirmé. Vérifiez votre boîte mail et cliquez sur le lien d'activation.");
        } else if (errMsg.includes("Invalid login") || errMsg.includes("invalid_credentials") || errMsg.includes("Invalid credentials")) {
          setErrorMsg("Adresse e-mail ou mot de passe incorrect. Vérifiez vos informations et réessayez.");
        } else if (errMsg.includes("Too many requests") || errMsg.includes("over_request_rate_limit")) {
          setErrorMsg("Trop de tentatives. Patientez quelques minutes avant de réessayer.");
        } else {
          setErrorMsg("Connexion impossible. Vérifiez votre email et mot de passe, puis réessayez.");
        }
        setLoading(false); return;
      }
      // ── Vérification défensive : access_token et user.id requis ──
      if (!res.access_token || !res.user?.id) {
        setErrorMsg("Connexion impossible. Vérifiez votre email et mot de passe, puis réessayez.");
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
    } catch (e) {
      console.error("[Moyo][Login] Erreur inattendue :", e);
      setErrorMsg("Une erreur est survenue. Vérifie ta connexion internet et réessaie.");
    }
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

export function SignUp({ onNav }: { onNav: (p: string) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", name: "", age: "", city: "", gender: "", bio: "", religion: "", profession: "", hobbies: "" });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cropSrcSignup, setCropSrcSignup] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Étape 1 → vérifier email et créer le compte, puis passer à l'étape 2 (photo)
  const checkEmailAndContinue = async () => {
    if (!form.email || form.password.length < 6) return;

    const emailClean = form.email.trim().toLowerCase();

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(emailClean)) {
      setErrorMsg("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    // Bloquer les domaines jetables
    const BLOCKED_DOMAINS = [
      "guerrillamail.com","guerrillamail.net","guerrillamail.org","guerrillamail.biz","guerrillamail.de","guerrillamail.info",
      "tempmail.com","temp-mail.org","tempmail.net","tempmail.io","temp-mail.io","tempr.email",
      "mailinator.com","maildrop.cc","mailnull.com","mailnesia.com","mailnull.com",
      "yopmail.com","yopmail.fr","cool.fr.nf","jetable.fr.nf","nospam.ze.tc",
      "throwam.com","throwam.net","throwaway.email","dispostable.com","disposablemail.com",
      "spamgourmet.com","spamgourmet.net","spamgourmet.org","spamgourmet.com",
      "trashmail.com","trashmail.at","trashmail.io","trashmail.me","trashmail.net",
      "fakeinbox.com","fakeinbox.net","fakemail.fr","fakemail.net","filzmail.com",
      "getnada.com","getairmail.com","getairmail.net","givmail.com","grr.la",
      "10minutemail.com","10minutemail.net","10minutemail.org","10mail.org",
      "20minutemail.com","20minutemail.it","tempemail.net","tempemail.org",
      "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
      "spam4.me","spamfree24.org","spamgob.com","spamherelots.com",
      "maildrop.cc","mailexpire.com","mailfall.com","mailfreeonline.com",
      "mohmal.com","mt2009.com","mt2014.com","mytrashmail.com",
      "nwldx.com","objectmail.com","obobbo.com","odnorazovoe.ru",
      "proxymail.eu","rcpt.at","recode.me","recursor.net",
      "s0ny.net","safe-mail.net","safetymail.info","safetypost.de",
      "sendspamhere.com","sharedmailbox.org","sharklasers.com",
      "spamavert.com","spambox.info","spambox.irishspringrealty.com",
      "spamcannon.com","spamcannon.net","spamcero.com","spamcon.org",
      "sogetthis.com","soodonims.com","stop-my-spam.com",
      "supergreatmail.com","supermailer.jp","superrito.com","superstachel.de",
      "suremail.info","tempalias.com","tempinbox.co.uk","tempinbox.com",
      "throwam.com","throwam.net","thinltd.com","thrott.com",
      "trbvm.com","trommlergroup.com","trshmail.com","ttirv.net",
      "turual.com","uggsrock.com","uroid.com","veryrealemail.com",
      "vidchart.com","viditag.com","viewcastmedia.com","viewcastmedia.net",
      "wegwerfmail.de","wegwerfmail.net","wegwerfmail.org",
      "wh4f.org","whyspam.me","willhackforfood.biz","willselfdestruct.com",
      "wronghead.com","wuzupmail.net","xagloo.com","xemaps.com",
      "xents.com","xmaily.com","xoxy.net","yepmail.net","yomail.info",
      "yuurok.com","z1p.biz","za.com","zehnminutenmail.de","zetmail.com",
      "zippymail.info","zoemail.com","zoemail.net","zoemail.org","zomg.info"
    ];

    const domain = emailClean.split("@")[1];
    if (BLOCKED_DOMAINS.includes(domain)) {
      setErrorMsg("Les adresses e-mail temporaires ne sont pas acceptées. Veuillez utiliser une vraie adresse e-mail.");
      return;
    }

    setLoading(true);
    try {
      const existing = await sb.query<Profile>(SUPABASE_KEY, "profiles", `?email=eq.${encodeURIComponent(emailClean)}&select=id`);
      if (existing.length > 0) { setErrorMsg("Cette adresse e-mail est déjà utilisée. Connectez-vous plutôt."); setLoading(false); return; }

      // Créer le compte dès l'étape 1
      const authRes = await sb.signUp(emailClean, form.password, { name: "...", age: "18", city: "Brazzaville", gender: "Homme", bio: "", religion: "", photo_url: null });
      if (authRes?.error) {
        const code = authRes.error.message || "";
        let msg = "Impossible de créer le compte.";
        if (code.includes("already registered")) msg = "Email déjà utilisé.";
        else if (code.includes("password")) msg = "Mot de passe trop court (6 caractères minimum).";
        setErrorMsg(msg); setLoading(false); return;
      }
      if (authRes.user?.identities?.length === 0) { setErrorMsg("Email déjà utilisé."); setLoading(false); return; }

      // Se connecter immédiatement pour avoir le vrai token
      const loginRes = await sb.signIn(emailClean, form.password);
      if (loginRes?.access_token) {
        setTempToken(loginRes.access_token);
        setTempUserId(loginRes.user?.id || authRes.user?.id || "");
      }
      setStep(2);
    } catch { setStep(2); }
    setLoading(false);
  };

  // Étape 2 → upload photo en arrière-plan pendant que l'utilisateur remplit l'étape 3
  const handlePhotoAndContinue = async () => {
    if (!photoFile || !tempToken || !tempUserId) { setStep(3); return; }
    setUploadingPhoto(true);
    try {
      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${tempUserId}/avatar.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tempToken}`, "Content-Type": photoFile.type || "image/jpeg", "x-upsert": "true" },
        body: photoFile,
      });
      if (uploadRes.ok) {
        setPhotoUrl(`${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`);
      }
    } catch {}
    setUploadingPhoto(false);
    setStep(3);
  };

  // Étape 3 → finaliser le profil
  const handleSubmit = async () => {
    setLoading(true);
    const ageNum = parseInt(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      setErrorMsg("Vous devez avoir au moins 18 ans."); setLoading(false); return;
    }
    if (!tempToken || !tempUserId) { setErrorMsg("Erreur de session. Recommencez."); setLoading(false); return; }
    try {
      // Mettre à jour le profil avec toutes les infos + photo
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${tempUserId}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${tempToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          name: form.name.trim(),
          age: parseInt(form.age),
          city: form.city,
          gender: form.gender,
          bio: form.bio.trim(),
          religion: form.religion,
          profession: form.profession.trim() || null,
          hobbies: form.hobbies.trim() || null,
          photo_url: photoUrl,
          is_complete: true,
          ...((() => { const ref = new URLSearchParams(window.location.search).get("ref"); return ref ? { referred_by: ref } : {}; })()),
        }),
      });
      // Mettre à jour le display_name dans Supabase Auth
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${tempToken}` },
          body: JSON.stringify({ data: { display_name: form.name.trim() } }),
        });
      } catch {}
      setLoading(false);
      setSuccessMsg("Compte créé !");
      setTimeout(() => { onNav("login"); }, 6000);
    } catch {
      setErrorMsg("Erreur technique. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={() => step === 1 ? onNav("landing") : setStep(s => s - 1)}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {successMsg && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(26,92,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A5C3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111", marginBottom: 10 }}>COMPTE CRÉÉ !</h3><p style={{ fontSize: "0.92rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>Consultez vos emails pour confirmer votre compte.</p><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.78rem", color: "#aaa" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: G.rouge }} />Redirection...</div></div></div>}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 6 }}>Crée ton compte</h2>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, background: "rgba(192,57,43,0.08)", border: `1.5px solid rgba(192,57,43,0.2)`, borderRadius: 50, padding: "6px 16px" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: G.blanc }}>{step}</div>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: G.rouge }}>
            {step === 1 && "Identifiant et mot de passe"}
            {step === 2 && "Photo de profil"}
            {step === 3 && "Informations personnelles"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#555", fontWeight: 500 }}>{step}/3</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? G.rouge : G.gris, transition: "background 0.3s" }} />
        ))}
      </div>

      {/* ÉTAPE 1 - Email + mot de passe */}
      {step === 1 && <>
        <Input label="Email" type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="ton@email.com" icon="email" />
        <Input label="Veuillez définir votre mot de passe" type="password" value={form.password} onChange={e => upd("password", e.target.value)} placeholder="Minimum 6 caractères" icon="lock" hint="Au moins 6 caractères" />
        <Btn variant="primary" onClick={checkEmailAndContinue} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!form.email || form.password.length < 6}>Continuer →</Btn>
      </>}

      {/* ÉTAPE 2 - Photo */}
      {step === 2 && <>
        {/* CropModal pour l'inscription */}
        {cropSrcSignup && (
          <CropModal
            src={cropSrcSignup}
            onConfirm={(blob) => {
              setCropSrcSignup(null);
              const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
              setPhotoFile(croppedFile);
              setPhotoPreview(URL.createObjectURL(blob));
              if (fileRef.current) fileRef.current.value = "";
            }}
            onCancel={() => { setCropSrcSignup(null); if (fileRef.current) fileRef.current.value = ""; }}
          />
        )}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: 24, lineHeight: 1.6 }}>
            Ajoute une photo pour que les autres puissent te reconnaître 😊
          </p>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setCropSrcSignup(reader.result as string);
            reader.readAsDataURL(file);
          }} style={{ display: "none" }} />
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }} onClick={() => fileRef.current?.click()}>
            {photoPreview ? (
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${G.rouge}`, cursor: "pointer" }}>
                <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(192,57,43,0.4)", cursor: "pointer" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.rouge}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: G.rouge, fontWeight: 900, lineHeight: 1, pointerEvents: "none" }}>+</div>
          </div>
          {photoPreview
            ? <div onClick={() => fileRef.current?.click()} style={{ fontSize: "0.82rem", color: G.rouge, cursor: "pointer", fontWeight: 600 }}>Changer la photo</div>
            : <p style={{ fontSize: "0.78rem", color: "#e74c3c", fontWeight: 600, marginTop: 4 }}>Une photo est obligatoire</p>
          }
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Retour</Btn>
          <Btn variant="primary" onClick={handlePhotoAndContinue} loading={uploadingPhoto} style={{ flex: 2 }} disabled={!photoPreview}>
            {uploadingPhoto ? "Upload en cours..." : "Continuer →"}
          </Btn>
        </div>
      </>}

      {/* ÉTAPE 3 - Infos personnelles */}
      {step === 3 && <>
        {photoPreview && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(26,92,58,0.06)", borderRadius: 12, padding: "8px 14px", marginBottom: 16 }}>
            <img src={photoPreview} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} loading="lazy" />
            <div style={{ fontSize: "0.78rem", color: "#1A5C3A", fontWeight: 600 }}>
              {photoUrl ? "✓ Photo uploadée avec succès" : "Photo en cours d'upload..."}
            </div>
          </div>
        )}
        <Input label="Prénom" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Ex: Faïda" icon="user" />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Je suis</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["Homme", "Femme"].map(g => (
              <div key={g} onClick={() => upd("gender", g)} style={{ flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `2px solid ${form.gender === g ? G.rouge : G.gris}`, background: form.gender === g ? "rgba(192,57,43,0.06)" : G.blanc, fontWeight: 600, fontSize: "0.88rem" }}>
                {g === "Homme" ? "👨🏿 Homme" : "👩🏿 Femme"}
              </div>
            ))}
          </div>
        </div>
        <Input label="Âge" type="number" value={form.age} onChange={e => { const v = e.target.value.slice(0,2); upd("age", v); }} placeholder="Ex: 25" icon="cake" hint="Entre 18 et 99 ans" error={form.age && parseInt(form.age) < 18 ? "Vous devez avoir au moins 18 ans." : undefined} />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Ville</label>
          <select value={form.city} onChange={e => upd("city", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none" }}>
            <option value="">Sélectionne ta ville</option>
            {VILLES.map(c => c.startsWith("──") ? <option key={c} disabled>{c}</option> : <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Religion <span style={{ color: G.rouge, fontSize: "0.8rem", fontWeight: 600 }}>(fortement recommandé)</span></label>
          <select value={form.religion} onChange={e => upd("religion", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none" }}>
            <option value="">Sélectionne ta religion</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Profession <span style={{ color: "#aaa", fontSize: "0.78rem", fontWeight: 400 }}>(optionnel)</span></label>
          <input value={form.profession} onChange={e => upd("profession", e.target.value.slice(0, 60))} placeholder="Ex : Infirmière, Ingénieur, Étudiant…" style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none", marginBottom: 18 }} />
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Centres d'intérêt / Hobbies <span style={{ color: "#aaa", fontSize: "0.78rem", fontWeight: 400 }}>(optionnel)</span></label>
          <input value={form.hobbies} onChange={e => upd("hobbies", e.target.value.slice(0, 80))} placeholder="Ex : Lecture, Musique, Voyages, Sport…" style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none", marginBottom: 18 }} />
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Bio (optionnel)</label>
          <textarea value={form.bio} onChange={e => upd("bio", e.target.value.slice(0, 160))} placeholder="Parle un peu de toi..." rows={3} maxLength={160} style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none", resize: "none" }} />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: form.bio.length >= 150 ? G.rouge : "#aaa", marginTop: 4 }}>{form.bio.length}/160</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>← Retour</Btn>
          <Btn variant="primary" onClick={handleSubmit} loading={loading} style={{ flex: 2 }} disabled={!form.name || !form.gender || !form.age || parseInt(form.age) < 18 || parseInt(form.age) > 99 || !form.city}>Créer mon compte</Btn>
        </div>
      </>}

      <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#555" }}>
        Déjà un compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("login")}>Se connecter</span>
      </p>
      <p style={{ textAlign: "center", marginTop: 14, fontSize: "0.7rem", color: "#aaa", lineHeight: 1.6, padding: "0 12px" }}>
        En continuant, vous acceptez nos{" "}
        <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>Conditions d'utilisation</a>
        {" "}et confirmez avoir lu notre{" "}
        <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>Politique de confidentialité</a>.
      </p>
    </AuthLayout>
  );
}


// ── FAQ pour le bot ──
const BOT_FAQ = [
  { q: ["premium", "abonnement", "payer", "prix", "coût", "momo", "airtel"], r: "Le Premium coûte 3 500 FCFA/mois. Il donne accès aux likes illimités, messages illimités, voir qui vous a liké et visité, envoi de photos et bien plus. Paiement via MTN Mobile Money ou Airtel Money. Activation manuelle sous 24h." },
  { q: ["parrain", "parrainage", "filleul", "inviter", "lien", "7 jours", "jours offerts"], r: "Le parrainage est simple : sur votre Profil, appuyez sur 'Parrainer un ami' pour partager votre lien unique. Quand un ami s'inscrit via ce lien et passe Premium, vous gagnez automatiquement 7 jours Premium offerts. Pas de limite !" },
  { q: ["match", "matcher", "matchs"], r: "Un match se crée automatiquement quand deux personnes se likent mutuellement. Un message de bienvenue apparaît automatiquement dans la conversation. Depuis l'onglet Matchs, appuyez sur les 3 traits pour envoyer un message, voir le profil, bloquer ou annuler le match." },
  { q: ["like", "liker", "coeur", "j'ai pas", "limite"], r: "Compte gratuit : 5 likes par jour. Premium : likes illimités. Si vous avez unliké quelqu'un, le like disparaît des deux côtés instantanément." },
  { q: ["message", "envoyer", "écrire", "conversation"], r: "Compte gratuit : 3 messages par match. Premium : messages illimités. Vous devez avoir un match pour envoyer un message." },
  { q: ["réaction", "réagir", "emoji", "like message"], r: "Appuyez longuement sur un message pour ouvrir le menu de réactions. Une seule réaction par message est autorisée : choisir une nouvelle réaction remplace automatiquement l'ancienne." },
  { q: ["insulte", "bloqué", "interdit", "avertissement", "modération"], r: "Moyo bloque automatiquement les insultes, menaces, arnaques et contenus inappropriés. Un avertissement s'affiche et un signalement est transmis à notre équipe. Les comportements répétés entraînent la suppression du compte." },
  { q: ["photo", "image", "profil", "modifier"], r: "Allez dans l'onglet Profil → Modifier ma photo. Un outil de recadrage s'ouvre pour cadrer votre photo parfaitement." },
  { q: ["visible", "invisible", "disparaître", "cacher"], r: "Dans Profil, activez le bouton Profil invisible. Vous disparaissez de Découvrir sans supprimer votre compte." },
  { q: ["badge", "vérifié", "vérification", "bleu"], r: "La vérification est gratuite. Allez dans Profil → Faire vérifier mon compte → WhatsApp. Réponse sous 24h." },
  { q: ["bloquer", "signaler", "harcèlement", "problème"], r: "Appuyez sur les 3 traits d'un profil → Bloquer ou Signaler. Les profils bloqués sont gérables depuis votre Liste noire dans le Profil." },
  { q: ["supprimer", "compte", "désinscrire"], r: "Dans Profil → Supprimer mon compte. Cette action est définitive et irréversible." },
  { q: ["inscription", "créer", "inscrire", "rejoindre"], r: "L'inscription est gratuite. Cliquez sur Créer mon compte gratuit, renseignez votre email et mot de passe, ajoutez une photo et complétez votre profil." },
  { q: ["vus", "visiteurs", "qui a vu"], r: "L'onglet Vus affiche le nombre de personnes qui ont visité votre profil. Le compteur est visible pour tous. Premium requis pour voir l'identité des visiteurs. Seuls les membres Premium génèrent des vues." },
  { q: ["sombre", "thème", "dark", "nuit"], r: "Dans Profil, utilisez le bouton Mode clair/sombre pour basculer entre les deux thèmes." },
  { q: ["annuler", "unmatch", "fin"], r: "Dans Matchs → 3 traits → Annuler le match. La conversation et les messages sont supprimés. L'autre personne n'est pas notifiée." },
  { q: ["répondre", "citer", "reply", "bandeau", "réponse message"], r: "Appuyez longuement sur un message → Répondre. Un bandeau s'affiche au-dessus du champ de saisie avec un aperçu du message cité. Appuyez sur ✕ pour annuler." },
  { q: ["supprimer message", "effacer message", "pour moi", "pour tous"], r: "Appuyez longuement sur un message → Supprimer pour tous (efface le message des deux côtés) ou Supprimer pour moi (masque le message uniquement de votre côté)." },
  { q: ["avertissement", "sanction", "notification officielle", "banni", "suspension"], r: "Un avertissement est une notification officielle MOYO qui apparaît à votre connexion. Vous devez cliquer \"OK, j\'ai compris\" pour continuer. Plusieurs avertissements peuvent entraîner la suspension du compte." },
  { q: ["confirmer", "confirmation", "email confirmation", "activer compte", "lien email"], r: "Après votre inscription, un email de confirmation vous est envoyé. Consultez votre boîte mail (y compris les spams) et cliquez sur le lien pour activer votre compte avant de vous connecter." },
  { q: ["pas reçu", "email introuvable", "spam", "confirmation pas reçue"], r: "Vérifiez vos spams ou courriers indésirables. Si vous ne trouvez toujours pas l'email, contactez notre équipe via l'Assistant Moyo avec votre adresse email." },
];

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of BOT_FAQ) {
    if (entry.q.some(k => lower.includes(k))) return entry.r;
  }
  return "Je n'ai pas trouvé de réponse précise à ta question. Tu peux contacter notre équipe sur WhatsApp au +242 06 513 20 12 ou via notre page Facebook.";
}

