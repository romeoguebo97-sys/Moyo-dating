// ─────────────────────────────────────────────────────────────────────────────
// MODERATION — Détection d'insultes, arnaques et contenu sexuel
// ─────────────────────────────────────────────────────────────────────────────

// ── Patterns de contact (numéros, emails, réseaux sociaux) ──
const CONTACT_PATTERNS = [
  /(\+?[\d][\s\-.]?){8,}/,
  /[\w.-]+@[\w.-]+\.\w+/,
  /(whatsapp|telegram|watsap|snapchat)/i,
  /(facebook|instagram|tiktok|twitter)/i,
  /(mon num|mon numero|mon numéro|appelle.?moi|contacte.?moi)/i,
];

export const hasContactInfo = (text: string): boolean =>
  CONTACT_PATTERNS.some((p) => p.test(text));

// ── Règles de modération ──
const MODERATION_RULES: { pattern: RegExp; type: "insult" | "scam" | "sexual" }[] = [
  // Insultes français — liste étendue
  {
    pattern:
      /(putain|putin|pute|salope|connard|connasse|con\b|fdp|fils.?de.?pute|bâtard|batard|va.?te.?faire|enculé|encule|merde|ta.?gueule|ferme.?ta.?gueule|ferme.?la|idiot|idiote|imbécile|imbecile|abruti|abrutie|débile|debile|crétin|cretin|nègre|negre|singe|bamboula|tafiole|tapette|mongol|nique.?ta.?mère|ntm\b|tg\b|sale.?chien|sale.?con|sale.?pute|bouffon|clochard|porc|sale.?race|sale.?noir|sale.?blanc|sale.?arabe|sale.?africain|sale.?congolais|sale.?étranger|retourne.?dans.?ton.?pays|nigga)/i,
    type: "insult",
  },
  // Menaces
  {
    pattern:
      /(je.?vais.?te.?tuer|je.?vais.?te.?frapper|je.?vais.?te.?retrouver|je.?vais.?venir.?chez.?toi|je.?vais.?te.?violer|suicide.?toi|crève\b|meurs\b)/i,
    type: "insult",
  },
  // Insultes lingala / congo — liste étendue
  {
    pattern: /(likata|libolo|lisoko|lissoko|punda|malewa|mbwa|boloko|bandeko.?ya.?mabe|wumela|zoba|lokuta)/i,
    type: "insult",
  },
  // Arnaques classiques
  {
    pattern:
      /(envoie.?moi|envoi.?moi|send.?me|vire.?moi|transfert|western.?union|moneygram|recharge.?(moi|mon)|carte.?cadeau|gift.?card|bitcoin|crypto.?facile|investiss(ement)?.?rapide|investissement.?rapide|placement|bénéfice|benefice|profit.?garanti|doubl.{1,5}argent|multipli.{1,5}argent|paypal.?urgent|clique.?ici|gagne.?de.?l.?argent|casino|paris.?sportif)/i,
    type: "scam",
  },
  {
    pattern:
      /(j.?ai.?besoin.?d.?argent|problème.?financier|probleme.?financier|urgence.?financière|urgence.?financiere|aide.?financière|aide.?financiere|prêt.?argent|pret.?argent|dépanne.?moi|depanne.?moi|avance.?moi|envoie.?l.?argent)/i,
    type: "scam",
  },
  {
    pattern:
      /(héritage|heritage|succession|millions.?fcfa|millions.?cfa|millions.?euro|compte.?bloqué|compte.?bloque|ambassade|visa.?contre|billet.?bloqué|billet.?bloque)/i,
    type: "scam",
  },
  // Redirection vers autres plateformes (contournement)
  {
    pattern: /(viens.?whatsapp|viens.?sur.?telegram|contacte.?moi.?sur.?telegram|écris.?moi.?sur.?whatsapp)/i,
    type: "scam",
  },
  // Contenu sexuel non sollicité — liste étendue
  {
    pattern:
      /(envoie.?moi.?(ta|tes|une|des).?(photo|pic|nude|nue|nichon|fesse|cul|seins?)|photo.?(nue?|sexy|hot|intime|coquine?)|video.?(nue?|hot|intime)|plan.?cul|viens.?dans.?mon.?lit|pipe\b|branlette|branler|sucer\b|chatte\b|bite\b|queue\b|grosse.?bite|nude\b|envoie.?tes.?seins|viens.?coucher)/i,
    type: "sexual",
  },
  // Mots sexuels directs
  {
    pattern: /\b(baise|baiser|nique\b|sexe\b)\b/i,
    type: "sexual",
  },
];

export const moderateMessage = (
  text: string
): { blocked: boolean; type?: "insult" | "scam" | "sexual" } => {
  for (const rule of MODERATION_RULES) {
    if (rule.pattern.test(text)) return { blocked: true, type: rule.type };
  }
  return { blocked: false };
};

export const getModerationMessage = (type: "insult" | "scam" | "sexual"): string => {
  if (type === "insult")
    return "Ce message contient des termes irrespectueux et ne peut pas être envoyé. Sur Moyo, nous encourageons la bienveillance, la douceur et le respect mutuel.";
  if (type === "scam")
    return "Ce message contient des demandes d'argent ou de transfert. Ce type de comportement est interdit sur Moyo et peut entraîner la suppression de votre compte.";
  if (type === "sexual")
    return "Ce message contient du contenu inapproprié et ne peut pas être envoyé.";
  return "Ce message ne respecte pas les règles de Moyo.";
};
