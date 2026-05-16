import { SUPABASE_URL, SUPABASE_KEY, STATUS_BUCKETS } from "../constants/config";

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE — Helpers pour les URLs de statuts (images 24h)
// ─────────────────────────────────────────────────────────────────────────────

/** Extrait le chemin relatif d'un storage path depuis une URL complète ou partielle */
export const getStatusStoragePath = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    if (!url.startsWith("http"))
      return url
        .replace(/^statuses\//, "")
        .replace(/^status\//, "")
        .replace(/^\//, "");

    const marker = "/storage/v1/object/";
    const pos = url.indexOf(marker);
    if (pos < 0) return null;

    const after = url.slice(pos + marker.length);
    const parts = after.split("?")[0].split("/").filter(Boolean);
    if (parts.length < 3) return null;

    return decodeURIComponent(parts.slice(2).join("/"));
  } catch {
    return null;
  }
};

/** Crée une URL signée Supabase Storage pour un chemin donné */
export const createStatusSignedUrl = async (
  token: string,
  path: string,
  expiresIn = 86400,
  bucket = "statuses"
): Promise<string | null> => {
  try {
    const cleanPath = path
      .replace(/^statuses\//, "")
      .replace(/^status\//, "")
      .replace(/^\//, "");
    const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");

    const r = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${encodedPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn }),
      }
    );
    if (!r.ok) return null;

    const data = (await r.json().catch(() => null)) as any;
    const signed = data?.signedURL || data?.signedUrl || data?.signed_url;
    if (!signed) return null;

    return signed.startsWith("http")
      ? signed
      : `${SUPABASE_URL}/storage/v1${signed}`;
  } catch {
    return null;
  }
};

/** Construit l'URL publique d'un fichier storage (sans signature) */
export const buildStatusPublicUrl = (path: string, bucket = "statuses"): string => {
  const cleanPath = path
    .replace(/^statuses\//, "")
    .replace(/^status\//, "")
    .replace(/^\//, "");
  const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}?v=${Date.now()}`;
};

/**
 * Résout l'URL finale d'une image de statut :
 * tente une URL signée sur chaque bucket, puis retombe sur l'URL publique.
 */
export const resolveStatusImageUrl = async (
  token: string,
  url?: string | null
): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  const path = getStatusStoragePath(url) || url;
  for (const bucket of STATUS_BUCKETS) {
    const signed = await createStatusSignedUrl(token, path, 86400, bucket);
    if (signed) return signed;
  }
  return buildStatusPublicUrl(path, "statuses");
};

/** Fallback : tente les buckets dans l'ordre, puis URL publique */
export const getStatusSignedFallbackUrl = async (
  token: string,
  url?: string | null
): Promise<string | null> => {
  const path = getStatusStoragePath(url) || url || null;
  if (!path) return null;

  for (const bucket of STATUS_BUCKETS) {
    const signed = await createStatusSignedUrl(token, path, 86400, bucket);
    if (signed) return signed;
  }
  return buildStatusPublicUrl(path, "status");
};
