export const SUPABASE_URL = "https://mcswcapxpruiffzrxfvl.supabase.co";
export const SUPABASE_KEY = "sb_publishable_nx44ipF3_X98flDVXxBZ5A_aztvDdgN";
export const APP_URL = "https://moyo-congo-appe.vercel.app";

export const VILLES = [
  "Brazzaville","Pointe-Noire","Dolisie","Nkayi","Owando",
  "Ouesso","Impfondo","Sibiti","Djambala","Kinkala",
  "Ewo","Gamboma","Madingou","Mossaka","Odziba",
  "──────────────",
  "Diaspora Europe","Diaspora Amérique","Diaspora Asie / Océanie","Diaspora Afrique (autre pays)",
];

export const RELIGIONS = [
  "Chrétien(ne)", "Catholique", "Protestant(e)", "Évangélique",
  "Croyant du message", "Musulman(e)", "Autre", "Non pratiquant(e)",
];

export const CONTACT_PATTERNS = [
  /(\+?[\d][\s\-.]?){8,}/,
  /[\w.-]+@[\w.-]+\.\w+/,
  /(whatsapp|telegram|watsap|snapchat)/i,
  /(facebook|instagram|tiktok|twitter)/i,
  /(mon num|mon numero|mon numéro|appelle.?moi|contacte.?moi)/i,
];

export const MODERATION_RULES: { pattern: RegExp; type: "insult" | "scam" | "sexual" }[] = [
  { pattern: /(putain|putin|pute|salope|connard|connasse|con\b|fdp|fils.?de.?pute|bâtard|batard|va.?te.?faire|enculé|encule|merde|ta.?gueule|ferme.?ta.?gueule|ferme.?la|idiot|idiote|imbécile|imbecile|abruti|abrutie|débile|debile|crétin|cretin|nègre|negre|singe|bamboula|tafiole|tapette|mongol|nique.?ta.?mère|ntm\b|tg\b|sale.?chien|sale.?con|sale.?pute|bouffon|clochard|porc|sale.?race|sale.?noir|sale.?blanc|sale.?arabe|sale.?africain|sale.?congolais|sale.?étranger|retourne.?dans.?ton.?pays|nigga)/i, type: "insult" },
  { pattern: /(je.?vais.?te.?tuer|je.?vais.?te.?frapper|je.?vais.?te.?retrouver|je.?vais.?venir.?chez.?toi|je.?vais.?te.?violer|suicide.?toi|crève\b|meurs\b)/i, type: "insult" },
  { pattern: /(likata|libolo|lisoko|lissoko|punda|malewa|mbwa|boloko|bandeko.?ya.?mabe|wumela|zoba|lokuta)/i, type: "insult" },
  { pattern: /(envoie.?moi|envoi.?moi|send.?me|vire.?moi|transfert|western.?union|moneygram|recharge.?(moi|mon)|carte.?cadeau|gift.?card|bitcoin|crypto.?facile|investiss(ement)?.?rapide|investissement.?rapide|placement|bénéfice|benefice|profit.?garanti|doubl.{1,5}argent|multipli.{1,5}argent|paypal.?urgent|clique.?ici|gagne.?de.?l.?argent|casino|paris.?sportif)/i, type: "scam" },
  { pattern: /(j.?ai.?besoin.?d.?argent|problème.?financier|probleme.?financier|urgence.?financière|urgence.?financiere|aide.?financière|aide.?financiere|prêt.?argent|pret.?argent|dépanne.?moi|depanne.?moi|avance.?moi|envoie.?l.?argent)/i, type: "scam" },
  { pattern: /(héritage|heritage|succession|millions.?fcfa|millions.?cfa|millions.?euro|compte.?bloqué|compte.?bloque|ambassade|visa.?contre|billet.?bloqué|billet.?bloque)/i, type: "scam" },
  { pattern: /(viens.?whatsapp|viens.?sur.?telegram|contacte.?moi.?sur.?telegram|écris.?moi.?sur.?whatsapp)/i, type: "scam" },
  { pattern: /(envoie.?moi.?(ta|tes|une|des).?(photo|pic|nude|nue|nichon|fesse|cul|seins?)|photo.?(nue?|sexy|hot|intime|coquine?)|video.?(nue?|hot|intime)|plan.?cul|viens.?dans.?mon.?lit|pipe\b|branlette|branler|sucer\b|chatte\b|bite\b|queue\b|grosse.?bite|nude\b|envoie.?tes.?seins|viens.?coucher)/i, type: "sexual" },
  { pattern: /\b(baise|baiser|nique\b|sexe\b)\b/i, type: "sexual" },
];

export const G = {
  rouge: "#C0392B", rougeDark: "#922B21", or: "#D4A843",
  vert: "#1A5C3A", creme: "#F0F1F5", cremeDark: "#E4E6ED",
  brun: "#2C1A0E", brunLight: "#5C3D2A", blanc: "#FFFFFF", gris: "#E8DDD0",
};

export const MSG_BG_STYLE: React.CSSProperties = { position: "relative" };
export const SUPER_ADMIN_ID = "2b70da16-9e1e-48b0-802e-580d8d150b44";
export const REFERRAL_BONUS_DAYS = 7;
export const FREE_LIMITS = { likes: 5, messages: 3 };
export const STATUS_LIMIT = 2;
export const LIFETIME_PREMIUM_UNTIL = "2099-12-31T23:59:59.000Z";
export const PREMIUM_30_DAYS_MS = 31 * 24 * 60 * 60 * 1000;
export const STATUS_BUCKETS = ["statuses", "status"] as const;

export const SUPPORT_TEAM_ID = "moyo-support-team";
export const SUPPORT_TEAM_NAME = "Assistance Moyo";
export const SUPPORT_PREFIX_USER = "[SUPPORT_USER]";
export const SUPPORT_PREFIX_REPLY = "[SUPPORT_REPLY]";
