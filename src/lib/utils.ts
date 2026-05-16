import { Profile } from "../types";
import { SUPPORT_PREFIX_USER, SUPPORT_PREFIX_REPLY } from "../constants/config";

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU — Mélange aléatoire
// ─────────────────────────────────────────────────────────────────────────────

export const shuffleArray = <T,>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILS — Tri prioritaire (premium > verified > certified) puis aléatoire
// ─────────────────────────────────────────────────────────────────────────────

export const priorityRandomizeProfiles = (items: Profile[]): Profile[] => {
  const score = (p: Profile) =>
    (p.is_premium ? 4 : 0) + (p.is_verified ? 3 : 0) + ((p as any).is_certified ? 2 : 0);

  const buckets = new Map<number, Profile[]>();
  for (const item of items) {
    const key = score(item);
    const list = buckets.get(key) || [];
    list.push(item);
    buckets.set(key, list);
  }
  return Array.from(buckets.keys())
    .sort((a, b) => b - a)
    .flatMap((k) => shuffleArray(buckets.get(k) || []));
};

// ─────────────────────────────────────────────────────────────────────────────
// DATES — Helpers d'affichage et de comparaison
// ─────────────────────────────────────────────────────────────────────────────

export const isRecent = (iso?: string, hours = 48): boolean => {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < hours * 3600 * 1000;
};

export const fmtDate = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export const getOnlineStatus = (lastSeen?: string): { label: string; color: string } => {
  if (!lastSeen) return { label: "Inconnu", color: "#aaa" };
  const diff = Date.now() - new Date(lastSeen).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 5) return { label: "En ligne", color: "#27ae60" };
  if (min < 30) return { label: `Vu il y a ${min} min`, color: "#f39c12" };
  if (min < 60) return { label: "Vu récemment", color: "#f39c12" };
  const h = Math.floor(min / 60);
  if (h < 24) return { label: `Vu il y a ${h}h`, color: "#aaa" };
  const d = Math.floor(h / 24);
  return { label: `Vu il y a ${d}j`, color: "#aaa" };
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT — Helpers pour identifier et nettoyer les messages d'assistance
// ─────────────────────────────────────────────────────────────────────────────

export const isSupportReason = (reason?: string): boolean =>
  !!reason &&
  (reason.startsWith(SUPPORT_PREFIX_USER) || reason.startsWith(SUPPORT_PREFIX_REPLY));

export const cleanSupportReason = (reason?: string): string =>
  (reason || "")
    .replace(SUPPORT_PREFIX_USER, "")
    .replace(SUPPORT_PREFIX_REPLY, "")
    .trim();

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Helpers desktop
// ─────────────────────────────────────────────────────────────────────────────

export const isDesktop = (): boolean =>
  typeof window !== "undefined" && window.innerWidth >= 1024;

export const openAdminPanel = (fallback: () => void): void => {
  if (isDesktop()) {
    window.open("/admin", "_blank");
  } else {
    fallback();
  }
};
