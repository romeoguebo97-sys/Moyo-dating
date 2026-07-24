// ════════════════════════════════════════════════════════════════════════
// api/paylink.js — Fonction Vercel (pas une page statique)
//
// But : quand quelqu'un partage son lien de paiement personnel ("Faire
// payer par quelqu'un d'autre") sur WhatsApp, la carte d'aperçu générée
// automatiquement doit rester DISCRÈTE — ne jamais révéler qu'il s'agit
// d'un site de rencontre. Le titre/description standard du site
// ("Moyo Dating | Le premier site de rencontres congolais...") ne doit
// jamais apparaître sur ce lien précis.
//
// Comme WhatsApp ne lit les balises Open Graph que dans le HTML brut
// (sans jamais exécuter le JavaScript), il faut générer ce HTML côté
// serveur, avant même que la page ne charge — une simple page statique
// ne suffit pas puisque le texte doit être personnalisé (le nom change
// à chaque lien). D'où cette fonction.
//
// La vraie personne qui clique dessus (pas un robot d'aperçu) est
// redirigée quasi instantanément vers l'écran de paiement réel.
// ════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://mcswcapxpruiffzrxfvl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nx44ipF3_X98flDVXxBZ5A_aztvDdgN";
const SITE_URL = "https://dating.moyo-congo.com";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  const token = (req.query && req.query.token) || "";

  // Nom de la personne, uniquement pour personnaliser le texte — jamais rien
  // qui laisse deviner "site de rencontre" ou "Premium".
  let name = "";
  if (token) {
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/resolve-payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => null);
      if (data && data.valid && data.name) name = data.name;
    } catch {
      // Échec silencieux : la carte reste générique, jamais bloquant pour la personne.
    }
  }

  const title = name ? `Paiement pour ${name}` : "Demande de paiement";
  const description = "Vous avez été invité(e) à effectuer un paiement en ligne.";
  const image = `${SITE_URL}/favicon.png`;
  const redirectUrl = `${SITE_URL}/?paylink=${encodeURIComponent(token)}`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Paiement en ligne">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${redirectUrl}">
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body>
  <p>Redirection vers la page de paiement…</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(html);
}
