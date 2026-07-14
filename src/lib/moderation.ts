// ── Modération (insultes, arnaques, contenu interdit, partage de contact) partagée
//    entre App.tsx et Admin.tsx. ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).
//
// Bonus de ce déplacement : Admin.tsx avait sa PROPRE copie de BUILTIN_MODERATION_WORDS
// et BUILTIN_CONTACT_WORDS (identique, mais à maintenir à la main en double — le commentaire
// d'origine disait explicitement "Doit rester identique à App.tsx"). Les deux fichiers
// importent maintenant la même source, donc ce risque de désynchronisation disparaît.

const CONTACT_PATTERNS = [
  // ── Détection automatique (jamais désactivable, ce ne sont pas des "mots") ──
  /(?:\+?\d[\s.\-]*){7,}/,                                   // suite de 7+ chiffres même très espacés (0 6 6 8 9 3 5 1 9) — anti-contournement
  /(?:\+|\b00)\d{2,3}/,                                       // indicatifs internationaux : +33 +242 +243 +225 +221 +237, 0033…
  /\b0[67]\b/,                                                // préfixes mobiles 06 / 07
  /[\w.-]+@[\w.-]+\.\w+/,                                     // adresses e-mail
  /@[a-z0-9._]{2,}/i,                                         // pseudos précédés de @ (@instagram, @gmail, @snapchat…)
  /(https?:\/\/|www\.|wa\.me|t\.me|\.me\/|bit\.ly|tinyurl|tiktok\.com)/i, // liens
  /z[ée]ro\s?(six|sept)/i,                                    // « zéro six » / « zéro sept »
  // ── Chiffres dispersés dans une phrase pour contourner la détection (ex. "Viens me 913
  //    découvrir 79 tu 32 verras" = 9137932 caché) : 3 groupes de 1 à 3 chiffres ou plus,
  //    séparés par des mots courts (max ~20 caractères entre chaque). Les nombres à 4 chiffres
  //    seuls (années : 1990, 2010…) ne sont volontairement PAS capturés par \d{1,3}\b, pour
  //    limiter les faux positifs sur les bios mentionnant une année. ──
  /\b\d{1,3}\b(?:\D{1,20}\b\d{1,3}\b){2,}/,
];
// ── Mots-clés "contacts" désactivables individuellement depuis l'admin (comme les mots interdits),
//    séparés de CONTACT_PATTERNS ci-dessus qui reste toujours actif (détection technique). ──
const CONTACT_WORD_PATTERNS = [
  /(whatsapp|whatsap|whatsab|watsap|watsapp|wtsapp|wassap|\bwa\b|\bw\.?a\b|telegram|telega|snapchat|\bsnap\b|viber|wechat|we.?chat|skype|discord|messenger|\bimo\b|\bsignal\b|zangi|botim|\bkakao\b)/i,
  /(facebook|face.?book|\bfb\b|instagram|insta.?gram|\binsta\b|tiktok|tik.?tok|twitter)/i,
  /w\s*h\s*a\s*t\s*s\s*a\s*p\s*p/i,
  /n\s*u\s*m\s*[ée]?\s*r\s*o/i,
  /s\s*n\s*a\s*p/i,
  /(num[ée]ro|\bnumero\b|\bnum\b|t[ée]l[ée]phone|telephone|\btél\b|\btel\b(?!\s+(que|qu'|quel|le|les))|portable|\bmobile\b|\bphone\b|\bvisio\b|\bvocal\b|ar?obase)/i,
  /(donne|passe|envoie|envoi|file|balance|prends?|laisse).{0,14}(moi|ton|mon|votre).{0,8}(num[ée]ro|numero|\bnum\b|contact|mobile|portable|t[ée]l|whatsapp|insta|snap|facebook|phone|06|07)/i,
  /je te donne.{0,8}(mon|num[ée]ro|contact|whatsapp|insta|snap)/i,
  /(ton|votre|mon|son|nos|vos)\s*contacts?\b/i,
  /[ée]chang(?:er|eons|e|és?)\s*(?:nos|les|vos|des|ton|nos\s)?\s*(contacts?|num[ée]ros?|numero|coordonn|t[ée]l|whatsapp|insta|snap)/i,
  /(ton|votre)\s*0[67]\b/i,
  /comment.{0,10}(te|vous|t')\s*(joindre|contacter|recontacter|atteindre|appeler)/i,
  /(discuter|parler|parlons|continuer|on se parle|on parle|on discute|on continue).{0,12}(ailleurs|en priv[ée]|en dehors|autre part)/i,
  /viens.{0,8}(en priv[ée]|sur whatsapp|sur insta|sur snap|sur telegram|sur messenger|ailleurs)/i,
  /(ajoute|ajout|[ée]cris|ecris|contacte|rejoins|retrouve|trouve|message)[\s-]?(moi|nous)/i,
  /tu as.{0,8}(whatsapp|insta|instagram|snap|snapchat|telegram|facebook|tiktok|un compte)/i,
  /appel(le)?[\s-]?(moi|nous|vid[ée]o|vocal)/i,
  /fais.?moi.?un.?appel/i,
  /(mon num|mon numero|mon numéro|appelle.?moi|contacte.?moi|écris.?moi.?sur|ecris.?moi.?sur|rejoins.?moi.?sur|mon contact\b|mon tel\b)/i,
  /(give|send|text|share).{0,10}(me).{0,8}(your).{0,8}(number|whatsapp|contact|phone|insta|snap)/i,
  /(what.?s|whats).{0,4}your.{0,8}(number|whatsapp|contact|phone|insta|instagram|snap|snapchat)/i,
  /(text|call|message|whatsapp).{0,4}me\b/i,
  /(my|your)\s(number|whatsapp|phone number|contact|insta|instagram|snap|snapchat)\b/i,
  /do you have\s(whatsapp|instagram|telegram|snapchat|a phone)/i,
];
export const BUILTIN_CONTACT_WORDS = ["whatsapp", "telegram", "snapchat", "viber", "wechat", "skype", "discord", "messenger", "imo", "signal", "zangi", "botim", "kakao", "facebook", "instagram", "tiktok", "twitter", "numéro", "téléphone", "tel", "portable", "mobile", "phone", "visio", "vocal", "contact", "arobase"];
let EXEMPTED_CONTACT_WORDS: Set<string> = new Set();
export const setExemptedContactWords = (raw: string) => {
  EXEMPTED_CONTACT_WORDS = new Set((raw || "").split(",").map(w => w.trim().toLowerCase()).filter(Boolean));
};
const isExemptedContactMatch = (matchedText: string): boolean => {
  const lower = matchedText.toLowerCase();
  for (const w of EXEMPTED_CONTACT_WORDS) { if (lower.includes(w) || w.includes(lower)) return true; }
  return false;
};
// Mots interdits "contacts" (gratuit uniquement) — ajoutés par l'admin depuis Configuration → Sécurité
let CONTACT_BANNED_REGEX: RegExp | null = null;
// ── Mots intégrés par défaut, affichés et désactivables individuellement depuis l'admin
//    (Configuration → Sécurité & Système → "Mots intégrés (par défaut)"). Chaque mot ici est
//    juste une étiquette lisible ; la détection réelle reste gérée par MODERATION_RULES
//    ci-dessous, qu'on ne modifie jamais — on filtre seulement APRÈS le déclenchement, si le mot
//    exact détecté fait partie de la liste que l'admin a désactivée. ──
export const BUILTIN_MODERATION_WORDS: { word: string; type: "insult" | "scam" | "sexual"; group: string }[] = [
  // Insultes
  ...["putain", "pute", "salope", "connard", "con", "fdp", "fils de pute", "bâtard", "va te faire", "enculé", "merde", "ta gueule", "ferme la", "idiot", "imbécile", "abruti", "débile", "crétin", "nègre", "singe", "bamboula", "tafiole", "tapette", "mongol", "nique ta mère", "ntm", "tg", "sale chien", "sale con", "sale pute", "bouffon", "clochard", "porc", "sale race", "sale noir", "sale blanc", "sale arabe", "sale africain", "sale congolais", "sale étranger", "retourne dans ton pays", "nigga"].map(word => ({ word, type: "insult" as const, group: "Insultes" })),
  // Menaces
  ...["je vais te tuer", "je vais te frapper", "je vais te retrouver", "je vais venir chez toi", "je vais te violer", "suicide toi", "crève", "meurs"].map(word => ({ word, type: "insult" as const, group: "Menaces" })),
  // Lingala / Congo
  ...["likata", "libolo", "lisoko", "punda", "malewa", "mbwa", "boloko", "bandeko ya mabe", "wumela", "zoba", "lokuta"].map(word => ({ word, type: "insult" as const, group: "Lingala / Congo" })),
  // Arnaques
  ...["envoie moi", "vire moi", "transfert", "western union", "moneygram", "recharge moi", "carte cadeau", "bitcoin", "crypto facile", "investissement rapide", "placement", "bénéfice", "profit garanti", "double argent", "multiplie argent", "paypal urgent", "clique ici", "gagne de l'argent", "casino", "paris sportif", "j'ai besoin d'argent", "problème financier", "urgence financière", "aide financière", "prêt argent", "dépanne moi", "avance moi", "envoie l'argent", "héritage", "succession", "millions fcfa", "compte bloqué", "ambassade", "visa contre", "billet bloqué", "viens whatsapp"].map(word => ({ word, type: "scam" as const, group: "Arnaques" })),
  // Contenu sexuel
  ...["photo nue", "video nue", "plan cul", "viens dans mon lit", "pipe", "branlette", "branler", "sucer", "chatte", "bite", "queue", "nude", "envoie tes seins", "viens coucher", "baise", "baiser", "nique", "sexe"].map(word => ({ word, type: "sexual" as const, group: "Contenu sexuel" })),
];
let EXEMPTED_BUILTIN_WORDS: Set<string> = new Set();
export const setExemptedBuiltinWords = (raw: string) => {
  EXEMPTED_BUILTIN_WORDS = new Set((raw || "").split(",").map(w => w.trim().toLowerCase()).filter(Boolean));
};
// Un mot détecté par une règle est exempté si son texte contient un des mots retirés par l'admin
// (couvre les variantes d'orthographe puisque chaque règle regroupe plusieurs formes du même mot).
const isExemptedMatch = (matchedText: string): boolean => {
  const lower = matchedText.toLowerCase();
  for (const w of EXEMPTED_BUILTIN_WORDS) { if (lower.includes(w) || w.includes(lower)) return true; }
  return false;
};

export const buildContactBannedRegex = (raw: string) => {
  const words = (raw || "").split(/[\n,;]+/).map(w => w.trim()).filter(Boolean);
  if (words.length === 0) { CONTACT_BANNED_REGEX = null; return; }
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  try { CONTACT_BANNED_REGEX = new RegExp(`(${escaped.join("|")})`, "i"); } catch { CONTACT_BANNED_REGEX = null; }
};
// Compte les chiffres réels du texte (peu importe espaces/lettres/ponctuation entre eux) + chiffres écrits en toutes lettres.
const countObfuscatedDigits = (text: string): number => {
  const realDigits = (text.match(/\d/g) || []).length;
  // Chiffres écrits en toutes lettres, en français ET en anglais (certains contournent la
  // détection en épelant leur numéro en anglais) : on compte une SUITE d'au moins 4 mots-chiffres
  // consécutifs (évite "un homme", "two dogs").
  let spelled = 0;
  const seq = text.toLowerCase().match(/(?:\b(?:z[ée]ro|zero|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|one|two|three|four|five|six|seven|eight|nine|ten)\b[\s.,'\-]*){4,}/g);
  if (seq) for (const s of seq) spelled += (s.match(/z[ée]ro|zero|une|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|one|two|three|four|five|six|seven|eight|nine|ten/g) || []).length;
  return realDigits + spelled;
};
export const hasContactInfo = (text: string): boolean => {
  if (CONTACT_PATTERNS.some(p => p.test(text))) return true; // détection technique, toujours active
  for (const p of CONTACT_WORD_PATTERNS) {
    const m = text.match(p);
    if (m && !isExemptedContactMatch(m[0])) return true;
  }
  if (CONTACT_BANNED_REGEX !== null && CONTACT_BANNED_REGEX.test(text)) return true;
  if (countObfuscatedDigits(text) >= 8) return true; // 8 chiffres ou plus (sous n'importe quelle forme) = numéro déguisé
  return false;
};

// ── MODÉRATION : insultes, arnaques, contenu interdit ──
const MODERATION_RULES: { pattern: RegExp; type: "insult" | "scam" | "sexual" }[] = [
  // Insultes français - liste étendue
  { pattern: /(putain|putin|pute|salope|connard|connasse|con\b|fdp|fils.?de.?pute|bâtard|batard|va.?te.?faire|enculé|encule|merde|ta.?gueule|ferme.?ta.?gueule|ferme.?la|idiot|idiote|imbécile|imbecile|abruti|abrutie|débile|debile|crétin|cretin|nègre|negre|singe|bamboula|tafiole|tapette|mongol|nique.?ta.?mère|ntm\b|tg\b|sale.?chien|sale.?con|sale.?pute|bouffon|clochard|porc|sale.?race|sale.?noir|sale.?blanc|sale.?arabe|sale.?africain|sale.?congolais|sale.?étranger|retourne.?dans.?ton.?pays|nigga)/i, type: "insult" },
  // Menaces
  { pattern: /(je.?vais.?te.?tuer|je.?vais.?te.?frapper|je.?vais.?te.?retrouver|je.?vais.?venir.?chez.?toi|je.?vais.?te.?violer|suicide.?toi|crève\b|meurs\b)/i, type: "insult" },
  // Insultes lingala / congo - liste étendue
  { pattern: /(likata|libolo|lisoko|lissoko|punda|malewa|mbwa|boloko|bandeko.?ya.?mabe|wumela|zoba|lokuta)/i, type: "insult" },
  // Arnaques classiques
  { pattern: /(envoie.?moi|envoi.?moi|send.?me|vire.?moi|transfert|western.?union|moneygram|recharge.?(moi|mon)|carte.?cadeau|gift.?card|bitcoin|crypto.?facile|investiss(ement)?.?rapide|investissement.?rapide|placement|bénéfice|benefice|profit.?garanti|doubl.{1,5}argent|multipli.{1,5}argent|paypal.?urgent|clique.?ici|gagne.?de.?l.?argent|casino|paris.?sportif)/i, type: "scam" },
  { pattern: /(j.?ai.?besoin.?d.?argent|problème.?financier|probleme.?financier|urgence.?financière|urgence.?financiere|aide.?financière|aide.?financiere|prêt.?argent|pret.?argent|dépanne.?moi|depanne.?moi|avance.?moi|envoie.?l.?argent)/i, type: "scam" },
  { pattern: /(héritage|heritage|succession|millions.?fcfa|millions.?cfa|millions.?euro|compte.?bloqué|compte.?bloque|ambassade|visa.?contre|billet.?bloqué|billet.?bloque)/i, type: "scam" },
  // Redirection vers autres plateformes (contournement)
  { pattern: /(viens.?whatsapp|viens.?sur.?telegram|contacte.?moi.?sur.?telegram|écris.?moi.?sur.?whatsapp)/i, type: "scam" },
  // Contenu sexuel non sollicité - liste étendue
  { pattern: /(envoie.?moi.?(ta|tes|une|des).?(photo|pic|nude|nue|nichon|fesse|cul|seins?)|photo.?(nue?|sexy|hot|intime|coquine?)|video.?(nue?|hot|intime)|plan.?cul|viens.?dans.?mon.?lit|pipe\b|branlette|branler|sucer\b|chatte\b|bite\b|queue\b|grosse.?bite|nude\b|envoie.?tes.?seins|viens.?coucher)/i, type: "sexual" },
  // Mots sexuels directs
  { pattern: /\b(baise|baiser|nique\b|sexe\b)\b/i, type: "sexual" },
];

// Mots interdits personnalisés (ajoutés par l'admin depuis Configuration → Sécurité)
let CUSTOM_BANNED_REGEX: RegExp | null = null;
export const buildCustomBannedRegex = (raw: string) => {
  const words = (raw || "").split(/[\n,;]+/).map(w => w.trim()).filter(Boolean);
  if (words.length === 0) { CUSTOM_BANNED_REGEX = null; return; }
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  try { CUSTOM_BANNED_REGEX = new RegExp(`(${escaped.join("|")})`, "i"); } catch { CUSTOM_BANNED_REGEX = null; }
};

export const moderateMessage = (text: string): { blocked: boolean; type?: "insult" | "scam" | "sexual" } => {
  for (const rule of MODERATION_RULES) {
    const match = text.match(rule.pattern);
    if (match && !isExemptedMatch(match[0])) return { blocked: true, type: rule.type };
  }
  if (CUSTOM_BANNED_REGEX && CUSTOM_BANNED_REGEX.test(text)) return { blocked: true, type: "insult" };
  return { blocked: false };
};

export const getModerationMessage = (type: "insult" | "scam" | "sexual"): string => {
  if (type === "insult") return "Ce message contient des termes irrespectueux et ne peut pas être envoyé. Sur Moyo Dating, nous encourageons la bienveillance, la douceur et le respect mutuel.";
  if (type === "scam") return "Ce message contient des demandes d'argent ou de transfert. Ce type de comportement est interdit sur Moyo Dating et peut entraîner la suppression de votre compte.";
  if (type === "sexual") return "Ce message contient du contenu inapproprié et ne peut pas être envoyé.";
  return "Ce message ne respecte pas les règles de Moyo Dating.";
};
