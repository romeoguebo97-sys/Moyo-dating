// ── Fonctions de formatage partagées entre App.tsx et Admin.tsx. ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).

export const formatMoney = (amount: number, currency: string) => currency === "EUR" ? `${(amount || 0).toLocaleString("fr-FR")} €` : `${(amount || 0).toLocaleString()} FCFA`;

// ── Score de compatibilité relationnelle entre deux profils (réutilisé admin + utilisateur) ──
export const mmScore = (a: any, b: any): { score: number; reasons: string[] } => {
  const ra = a?.relational_profile || {}, rb = b?.relational_profile || {};
  let s = 0; const reasons: string[] = [];
  if (a?.religion && b?.religion && a.religion === b.religion) { s += 25; reasons.push(`Même religion : ${a.religion}`); }
  else if (ra.religion === "Sans importance" || rb.religion === "Sans importance") s += 10;
  if (ra.project && rb.project && ra.project === rb.project) { s += 25; reasons.push(`Même objectif : ${ra.project}`); }
  if (a?.city && b?.city && a.city === b.city) { s += 15; reasons.push(`Même ville : ${a.city}`); }
  else if (/diaspora/i.test(a?.city || "") && /diaspora/i.test(b?.city || "")) { s += 8; reasons.push("Tous deux en diaspora"); }
  const ci = (Array.isArray(ra.interests) ? ra.interests : []).filter((x: string) => (Array.isArray(rb.interests) ? rb.interests : []).includes(x));
  if (ci.length) { s += Math.min(ci.length * 5, 20); reasons.push(`${ci.length} centre${ci.length > 1 ? "s" : ""} d'intérêt commun${ci.length > 1 ? "s" : ""}`); }
  const cq = (Array.isArray(ra.qualities) ? ra.qualities : []).filter((x: string) => (Array.isArray(rb.qualities) ? rb.qualities : []).includes(x));
  if (cq.length) { s += Math.min(cq.length * 4, 20); reasons.push(`${cq.length} valeur${cq.length > 1 ? "s" : ""} commune${cq.length > 1 ? "s" : ""}`); }
  return { score: Math.min(s, 99), reasons };
};
export const mmLevel = (score: number) => score >= 90 ? { label: "Compatibilité élevée", color: "#8e44ad" } : score >= 75 ? { label: "Bonne compatibilité", color: "#e67e22" } : score >= 50 ? { label: "Compatibilité moyenne", color: "#2980b9" } : { label: "Profil sélectionné pour vous", color: "#9aa0a6" };

export const fmtApptDT = (s?: string) => s ? new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(":", "h") : "";

export const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`;
  if (diffH < 48) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};
