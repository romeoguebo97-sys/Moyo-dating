// ─────────────────────────────────────────────────────────────────────────────
// DATA — Données statiques de référence
// ─────────────────────────────────────────────────────────────────────────────

export const VILLES = [
  "Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Owando",
  "Ouesso", "Impfondo", "Sibiti", "Djambala", "Kinkala",
  "Ewo", "Gamboma", "Madingou", "Mossaka", "Odziba",
  "──────────────",
  "Diaspora Europe", "Diaspora Amérique", "Diaspora Asie / Océanie", "Diaspora Afrique (autre pays)",
];

export const RELIGIONS = [
  "Chrétien(ne)", "Catholique", "Protestant(e)", "Évangélique",
  "Croyant du message", "Musulman(e)", "Autre", "Non pratiquant(e)",
];

export const BOT_FAQ = [
  {
    q: ["profil", "modifier", "photo", "changer"],
    a: "Pour modifier votre profil, allez dans l'onglet « Profil » (icône en bas à droite), puis appuyez sur « Modifier mon profil ».",
  },
  {
    q: ["match", "comment", "obtenir", "avoir"],
    a: "Pour obtenir un match, likez les profils qui vous intéressent. Si la personne vous like aussi, c'est un match ! Vous pouvez alors commencer à discuter.",
  },
  {
    q: ["premium", "abonnement", "payer", "prix", "tarif"],
    a: "Moyo Premium vous donne accès à des likes illimités, la messagerie illimitée, voir qui vous a liké et bien plus. Rendez-vous dans votre profil pour vous abonner.",
  },
  {
    q: ["signaler", "bloquer", "problème", "utilisateur"],
    a: "Vous pouvez signaler ou bloquer un utilisateur directement depuis son profil ou la conversation. Nous traitons chaque signalement sérieusement.",
  },
  {
    q: ["statut", "status", "story", "publier"],
    a: "Les statuts vous permettent de partager des photos et textes pendant 24h. Accédez-y via l'onglet Matches.",
  },
  {
    q: ["supprimer", "compte", "désactiver"],
    a: "Pour supprimer votre compte, allez dans Profil > Paramètres > Supprimer mon compte. Cette action est irréversible.",
  },
  {
    q: ["visible", "invisibilité", "masquer"],
    a: "Vous pouvez activer le mode invisible dans Profil > Paramètres. Vous ne serez plus visible dans la découverte.",
  },
  {
    q: ["message", "envoyer", "discuter", "conversation"],
    a: "Pour envoyer un message, vous devez d'abord avoir un match. Allez dans l'onglet Matches, puis cliquez sur la conversation.",
  },
  {
    q: ["notification", "alerte", "push"],
    a: "Activez les notifications dans les paramètres de votre téléphone pour ne rater aucun match ou message !",
  },
];
