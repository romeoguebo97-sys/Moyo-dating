import { CONTACT_PATTERNS, MODERATION_RULES } from "../constants";

export const hasContactInfo = (text: string): boolean =>
  CONTACT_PATTERNS.some(p => p.test(text));

export const moderateMessage = (text: string): { blocked: boolean; type?: "insult" | "scam" | "sexual" } => {
  for (const rule of MODERATION_RULES) {
    if (rule.pattern.test(text)) return { blocked: true, type: rule.type };
  }
  return { blocked: false };
};

export const getModerationMessage = (type: "insult" | "scam" | "sexual"): string => {
  if (type === "insult") return "Ce message contient des termes irrespectueux et ne peut pas être envoyé. Sur Moyo, nous encourageons la bienveillance, la douceur et le respect mutuel.";
  if (type === "scam") return "Ce message contient des demandes d'argent ou de transfert. Ce type de comportement est interdit sur Moyo et peut entraîner la suppression de votre compte.";
  if (type === "sexual") return "Ce message contient du contenu inapproprié et ne peut pas être envoyé.";
  return "Ce message ne respecte pas les règles de Moyo.";
};

export const isSupportReason = (reason?: string) =>
  !!reason && (reason.startsWith("[SUPPORT_USER]") || reason.startsWith("[SUPPORT_REPLY]"));

export const cleanSupportReason = (reason?: string) =>
  (reason || "").replace("[SUPPORT_USER]", "").replace("[SUPPORT_REPLY]", "").trim();
