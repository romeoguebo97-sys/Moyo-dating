import React, { useEffect, useState } from "react";
import { sb } from "../../lib/supabase";
import { G } from "../../constants/styles";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../../components/ui/Input";
import { Btn } from "../../components/ui/Btn";
import { Toast, ErrorModal } from "../../components/ui/Feedback";
import type { ToastState } from "../../types";

export function ResetPassword({ onNav }: { onNav: (p: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const t = params.get("access_token");
    const type = params.get("type");
    if (t && type === "recovery") {
      setToken(t);
    } else {
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
        <div style={{ fontSize: "2rem", color: G.rouge, fontWeight: 700 }}>
          <span>Mo</span><span style={{ color: G.or }}>yo</span>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 8 }}>Nouveau mot de passe</h2>
        <p style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>Choisis un nouveau mot de passe sécurisé</p>
      </div>
      <Input
        label="Nouveau mot de passe"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Minimum 6 caractères"
        icon="lock"
        hint="Au moins 6 caractères"
      />
      <Input
        label="Confirmer le mot de passe"
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Répète ton mot de passe"
        icon="lock"
      />
      <Btn
        variant="primary"
        onClick={handleReset}
        loading={loading}
        style={{ width: "100%", marginTop: 8 }}
        disabled={!password || !confirm}
      >
        Modifier le mot de passe
      </Btn>
    </AuthLayout>
  );
}
