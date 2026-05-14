import React, { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://mcswcapxpruiffzrxfvl.supabase.co";
const SUPABASE_KEY = "sb_publishable_nx44ipF3_X98flDVXxBZ5A_aztvDdgN";
const APP_URL = "https://moyo-congo-appe.vercel.app";

const VILLES = [
  "Brazzaville","Pointe-Noire","Dolisie","Nkayi","Owando",
  "Ouesso","Impfondo","Sibiti","Djambala","Kinkala",
  "Ewo","Gamboma","Madingou","Mossaka","Odziba",
  "──────────────",
  "Diaspora Europe","Diaspora Amérique","Diaspora Asie / Océanie","Diaspora Afrique (autre pays)",
];

const RELIGIONS = [
  "Chrétien(ne)", "Catholique", "Protestant(e)", "Évangélique",
  "Croyant du message", "Musulman(e)", "Autre", "Non pratiquant(e)",
];
const CONTACT_PATTERNS = [
  /(\+?[\d][\s\-.]?){8,}/,
  /[\w.-]+@[\w.-]+\.\w+/,
  /(whatsapp|telegram|watsap|snapchat)/i,
  /(facebook|instagram|tiktok|twitter)/i,
  /(mon num|mon numero|mon numéro|appelle.?moi|contacte.?moi)/i,
];
const hasContactInfo = (text: string): boolean => CONTACT_PATTERNS.some(p => p.test(text));

// ── MODÉRATION : insultes, arnaques, contenu interdit ──
const MODERATION_RULES: { pattern: RegExp; type: "insult" | "scam" | "sexual" }[] = [
  // Insultes français — liste étendue
  { pattern: /(putain|putin|pute|salope|connard|connasse|con\b|fdp|fils.?de.?pute|bâtard|batard|va.?te.?faire|enculé|encule|merde|ta.?gueule|ferme.?ta.?gueule|ferme.?la|idiot|idiote|imbécile|imbecile|abruti|abrutie|débile|debile|crétin|cretin|nègre|negre|singe|bamboula|tafiole|tapette|mongol|nique.?ta.?mère|ntm\b|tg\b|sale.?chien|sale.?con|sale.?pute|bouffon|clochard|porc|sale.?race|sale.?noir|sale.?blanc|sale.?arabe|sale.?africain|sale.?congolais|sale.?étranger|retourne.?dans.?ton.?pays|nigga)/i, type: "insult" },
  // Menaces
  { pattern: /(je.?vais.?te.?tuer|je.?vais.?te.?frapper|je.?vais.?te.?retrouver|je.?vais.?venir.?chez.?toi|je.?vais.?te.?violer|suicide.?toi|crève\b|meurs\b)/i, type: "insult" },
  // Insultes lingala / congo — liste étendue
  { pattern: /(likata|libolo|lisoko|lissoko|punda|malewa|mbwa|boloko|bandeko.?ya.?mabe|wumela|zoba|lokuta)/i, type: "insult" },
  // Arnaques classiques
  { pattern: /(envoie.?moi|envoi.?moi|send.?me|vire.?moi|transfert|western.?union|moneygram|recharge.?(moi|mon)|carte.?cadeau|gift.?card|bitcoin|crypto.?facile|investiss(ement)?.?rapide|investissement.?rapide|placement|bénéfice|benefice|profit.?garanti|doubl.{1,5}argent|multipli.{1,5}argent|paypal.?urgent|clique.?ici|gagne.?de.?l.?argent|casino|paris.?sportif)/i, type: "scam" },
  { pattern: /(j.?ai.?besoin.?d.?argent|problème.?financier|probleme.?financier|urgence.?financière|urgence.?financiere|aide.?financière|aide.?financiere|prêt.?argent|pret.?argent|dépanne.?moi|depanne.?moi|avance.?moi|envoie.?l.?argent)/i, type: "scam" },
  { pattern: /(héritage|heritage|succession|millions.?fcfa|millions.?cfa|millions.?euro|compte.?bloqué|compte.?bloque|ambassade|visa.?contre|billet.?bloqué|billet.?bloque)/i, type: "scam" },
  // Redirection vers autres plateformes (contournement)
  { pattern: /(viens.?whatsapp|viens.?sur.?telegram|contacte.?moi.?sur.?telegram|écris.?moi.?sur.?whatsapp)/i, type: "scam" },
  // Contenu sexuel non sollicité — liste étendue
  { pattern: /(envoie.?moi.?(ta|tes|une|des).?(photo|pic|nude|nue|nichon|fesse|cul|seins?)|photo.?(nue?|sexy|hot|intime|coquine?)|video.?(nue?|hot|intime)|plan.?cul|viens.?dans.?mon.?lit|pipe\b|branlette|branler|sucer\b|chatte\b|bite\b|queue\b|grosse.?bite|nude\b|envoie.?tes.?seins|viens.?coucher)/i, type: "sexual" },
  // Mots sexuels directs
  { pattern: /\b(baise|baiser|nique\b|sexe\b)\b/i, type: "sexual" },
];

const moderateMessage = (text: string): { blocked: boolean; type?: "insult" | "scam" | "sexual" } => {
  for (const rule of MODERATION_RULES) {
    if (rule.pattern.test(text)) return { blocked: true, type: rule.type };
  }
  return { blocked: false };
};

const getModerationMessage = (type: "insult" | "scam" | "sexual"): string => {
  if (type === "insult") return "Ce message contient des termes irrespectueux et ne peut pas être envoyé. Sur Moyo, nous encourageons la bienveillance, la douceur et le respect mutuel.";
  if (type === "scam") return "Ce message contient des demandes d'argent ou de transfert. Ce type de comportement est interdit sur Moyo et peut entraîner la suppression de votre compte.";
  if (type === "sexual") return "Ce message contient du contenu inapproprié et ne peut pas être envoyé.";
  return "Ce message ne respecte pas les règles de Moyo.";
};

// Fond messages style Moyo — compatible tous navigateurs mobiles
const MSG_BG_STYLE: React.CSSProperties = {
  position: "relative",
};
const FREE_LIMITS = { likes: 5, messages: 3 };

const G = {
  rouge: "#C0392B", rougeDark: "#922B21", or: "#D4A843",
  vert: "#1A5C3A", creme: "#F0F1F5", cremeDark: "#E4E6ED",
  brun: "#2C1A0E", brunLight: "#5C3D2A", blanc: "#FFFFFF", gris: "#E8DDD0",
};

type Auth = {
  token: string;
  userId: string;
  name: string;
  email: string;
  isPremium: boolean;
  isAdmin: boolean;
  // ── SESSION v2 : refresh automatique JWT ──
  refreshToken?: string;   // refresh_token Supabase
  expiresAt?: number;      // timestamp ms (Date.now()) d'expiration du access_token
};
type Profile = { id: string; name: string; age: number; city: string; gender: string; bio: string; religion?: string; photo_url?: string | null; is_premium: boolean; is_admin?: boolean; is_visible?: boolean; is_verified?: boolean; last_seen?: string };
type Match = { id: string; user1: string; user2: string; partner?: Profile; lastMsg?: Message; unreadCount?: number };
type Message = { id?: string; match_id: string; sender_id: string; content: string; is_read: boolean; is_delivered?: boolean; created_at?: string; reactions?: Record<string, string[]> };
type ToastState = { msg: string; type?: "success" | "error" | "premium" } | null;

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT SUPABASE — v2 avec refresh automatique JWT
// Stratégie :
//   • Toutes les requêtes REST passent par safeRequest()
//   • Si Supabase répond 401 → on tente un refresh du token (une seule fois)
//   • Si le refresh réussit → on relance la requête avec le nouveau token
//   • Si le refresh échoue → on appelle onAuthFailure() (déconnexion propre)
//   • Un flag _isRefreshing évite les boucles infinies
//   • onAuthFailure est injecté par App au montage via sb.setAuthFailureHandler()
// ─────────────────────────────────────────────────────────────────────────────
const sb = {
  // ── Callback injecté par App pour déclencher la déconnexion propre ──
  _onAuthFailure: null as (() => void) | null,
  setAuthFailureHandler(fn: () => void) { this._onAuthFailure = fn; },

  // ── Anti-boucle : un seul refresh en cours à la fois ──
  _isRefreshing: false,
  _pendingRefreshToken: null as string | null,

  // ── Headers standard REST ──
  h: (token?: string) => ({
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${token || SUPABASE_KEY}`,
    "Prefer": "return=representation",
  }),

  // ────────────────────────────────────────────────────────────────────────
  // AUTH
  // ────────────────────────────────────────────────────────────────────────
  async signUp(email: string, password: string, metadata: object) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: this.h(),
      body: JSON.stringify({ email, password, data: metadata }),
    });
    return r.json();
  },
  async signIn(email: string, password: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.h(),
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async signOut(token: string) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: this.h(token) });
  },
  async resetPassword(email: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST", headers: this.h(),
      body: JSON.stringify({ email, redirect_to: `${APP_URL}/reset-password` }),
    });
    return r.json();
  },
  async updatePassword(accessToken: string, newPassword: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: { ...this.h(accessToken), "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({ password: newPassword }),
    });
    return r.json().catch(() => null);
  },

  // ────────────────────────────────────────────────────────────────────────
  // REFRESH SESSION
  // Appelle /auth/v1/token?grant_type=refresh_token
  // Retourne { access_token, refresh_token, expires_in } ou null si échec
  // ────────────────────────────────────────────────────────────────────────
  async refreshSession(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
    if (this._isRefreshing) {
      console.log("[Moyo][Session] Refresh déjà en cours — skip");
      return null;
    }
    this._isRefreshing = true;
    console.log("[Moyo][Session] Tentative de refresh du token…");
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: this.h(),
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await r.json().catch(() => null);
      if (data?.access_token) {
        console.log("[Moyo][Session] ✅ Refresh réussi — nouveau token obtenu");
        return data;
      }
      console.warn("[Moyo][Session] ❌ Refresh échoué :", data?.error_description || data?.message || "réponse invalide");
      return null;
    } catch (e) {
      console.warn("[Moyo][Session] ❌ Refresh — erreur réseau :", e);
      return null;
    } finally {
      this._isRefreshing = false;
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // SAFE REQUEST
  // Wrapper central : exécute fn(token), détecte 401, tente refresh, relance.
  // fn = fonction qui prend un token et retourne une Promise<Response>
  // refreshToken = le refresh_token courant (passé par l'appelant)
  // onNewToken = callback appelé si un nouveau token a été obtenu (pour màj Auth)
  // ────────────────────────────────────────────────────────────────────────
  async safeRequest(
    token: string,
    refreshToken: string | undefined,
    fn: (t: string) => Promise<Response>,
    onNewToken?: (newToken: string, newRefreshToken: string, newExpiresAt: number) => void,
  ): Promise<Response> {
    const r = await fn(token);

    // Pas de 401 → tout va bien, retourner directement
    if (r.status !== 401) return r;

    console.warn("[Moyo][Session] 401 détecté — JWT probablement expiré");

    // Pas de refresh_token disponible → déconnexion propre
    if (!refreshToken) {
      console.warn("[Moyo][Session] Pas de refresh_token — déconnexion");
      this._onAuthFailure?.();
      return r;
    }

    // Tentative de refresh
    const refreshed = await this.refreshSession(refreshToken);
    if (!refreshed) {
      console.warn("[Moyo][Session] Refresh impossible — déconnexion");
      this._onAuthFailure?.();
      return r;
    }

    // Refresh réussi → notifier App pour màj du state/localStorage
    const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
    onNewToken?.(refreshed.access_token, refreshed.refresh_token, newExpiresAt);

    // Relancer la requête originale avec le nouveau token
    console.log("[Moyo][Session] ✅ Requête relancée avec le nouveau token");
    return fn(refreshed.access_token);
  },

  // ────────────────────────────────────────────────────────────────────────
  // REST — toutes les méthodes passent par safeRequest
  // ────────────────────────────────────────────────────────────────────────
  async query<T>(
    token: string, table: string, params = "",
    refreshToken?: string,
    onNewToken?: (t: string, rt: string, exp: number) => void,
  ): Promise<T[]> {
    const r = await this.safeRequest(token, refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: this.h(t) }),
      onNewToken,
    );
    const data = await r.json().catch(() => []);
    if (!Array.isArray(data)) {
      if (data?.code || data?.message) throw new Error(data.message || data.code);
      return [];
    }
    return data;
  },

  async insert<T>(
    token: string, table: string, data: object,
    refreshToken?: string,
    onNewToken?: (t: string, rt: string, exp: number) => void,
  ): Promise<T[]> {
    const r = await this.safeRequest(token, refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers: this.h(t), body: JSON.stringify(data),
      }),
      onNewToken,
    );
    const res = await r.json().catch(() => null);
    return Array.isArray(res) ? res : res ? [res] : [];
  },

  async update(
    token: string, table: string, id: string, data: object,
    refreshToken?: string,
    onNewToken?: (t: string, rt: string, exp: number) => void,
  ) {
    const r = await this.safeRequest(token, refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: "PATCH", headers: this.h(t), body: JSON.stringify(data),
      }),
      onNewToken,
    );
    return r.json().catch(() => null);
  },

  async upsert(
    token: string, table: string, data: object,
    refreshToken?: string,
    onNewToken?: (t: string, rt: string, exp: number) => void,
  ) {
    const r = await this.safeRequest(token, refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...this.h(t), "Prefer": "return=representation,resolution=merge-duplicates" },
        body: JSON.stringify(data),
      }),
      onNewToken,
    );
    return r.json().catch(() => null);
  },

  async delete(
    token: string, table: string, params: string,
    refreshToken?: string,
    onNewToken?: (t: string, rt: string, exp: number) => void,
  ) {
    await this.safeRequest(token, refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { method: "DELETE", headers: this.h(t) }),
      onNewToken,
    );
  },

  async rpc(
    token: string, fn: string,
    refreshToken?: string,
    onNewToken?: (t: string, rt: string, exp: number) => void,
  ) {
    const r = await this.safeRequest(token, refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST", headers: this.h(t), body: JSON.stringify({}),
      }),
      onNewToken,
    );
    return r.json().catch(() => null);
  },

  // ────────────────────────────────────────────────────────────────────────
  // UTILITAIRES (pas de refresh nécessaire — pas de données privées)
  // ────────────────────────────────────────────────────────────────────────
  async uploadPhoto(token: string, userId: string, file: File): Promise<string | null> {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${ext}`;
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": file.type || "image/jpeg", "x-upsert": "true", "Cache-Control": "3600" },
        body: file,
      });
      if (!r.ok) return null;
      return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
    } catch { return null; }
  },

  async markMessagesRead(token: string, matchId: string, userId: string) {
    await fetch(`${SUPABASE_URL}/rest/v1/messages?match_id=eq.${matchId}&sender_id=neq.${userId}&is_read=eq.false`, {
      method: "PATCH", headers: this.h(token), body: JSON.stringify({ is_read: true }),
    });
  },

  async recordVisit(token: string, visitorId: string, visitedId: string) {
    if (visitorId === visitedId) return;
    await fetch(`${SUPABASE_URL}/rest/v1/profile_visits`, {
      method: "POST",
      headers: { ...this.h(token), "Prefer": "return=minimal" },
      body: JSON.stringify({ visitor_id: visitorId, visited_id: visitedId }),
    });
  },

  subscribeRealtime(token: string, table: string, filter: string, callback: () => void): WebSocket | null {
    try {
      const wsUrl = SUPABASE_URL.replace("https://", "wss://").replace("http://", "ws://");
      const ws = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ topic: "realtime:public", event: "phx_join", payload: { access_token: token }, ref: "1" }));
        ws.send(JSON.stringify({ topic: `realtime:public:${table}:${filter}`, event: "phx_join", payload: { access_token: token }, ref: "2" }));
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "INSERT" || msg.event === "UPDATE" || msg.event === "DELETE") callback();
        } catch {}
      };
      ws.onerror = () => {};
      return ws;
    } catch { return null; }
  },
};

const GLOBAL_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  html{overflow-x:hidden;width:100%;max-width:100vw}
  body{overflow-x:hidden;width:100%;max-width:100vw;min-height:100vh;-webkit-text-size-adjust:100%}
  #root{overflow-x:hidden;width:100%;max-width:100vw;min-height:100vh}
  @media(min-width:520px){body{background-color:#EDE5D8;background-image:radial-gradient(circle,rgba(192,57,43,0.06) 1px,transparent 1px),radial-gradient(circle,rgba(212,168,67,0.05) 1px,transparent 1px);background-size:30px 30px,50px 50px}}
  input,select,textarea,button{font-family:inherit;box-sizing:border-box;max-width:100%;-webkit-appearance:none}
  input,select,textarea{display:block;width:100%}
  img{max-width:100%;height:auto;display:block}
  div,section,nav,header,footer{max-width:100%;box-sizing:border-box}
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  .msg-bg {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' opacity='0.055'%3E%3Ctext x='10' y='20' font-family='Georgia,serif' font-size='11' font-weight='700' fill='%23C0392B'%3EMo%3C/text%3E%3Ctext x='31' y='20' font-family='Georgia,serif' font-size='11' font-weight='700' fill='%23D4A843'%3Eyo%3C/text%3E%3Ccircle cx='15' cy='52' r='5' fill='none' stroke='%23C0392B' stroke-width='1.2'/%3E%3Cpath d='M10,57 Q15,70 20,57' fill='none' stroke='%23C0392B' stroke-width='1.2'/%3E%3Ccircle cx='28' cy='52' r='5' fill='none' stroke='%23D4A843' stroke-width='1.2'/%3E%3Cpath d='M23,57 Q28,70 33,57' fill='none' stroke='%23D4A843' stroke-width='1.2'/%3E%3Cpath d='M19,49 C19,47 22,46 22,49 C22,46 25,47 25,49 C25,52 22,55 22,55Z' fill='%23C0392B'/%3E%3Ccircle cx='75' cy='15' r='7' fill='none' stroke='%23D4A843' stroke-width='1.5'/%3E%3Cpath d='M110,8 C110,4 115,3 115,8 C115,3 120,4 120,8 C120,13 115,17 115,17Z' fill='none' stroke='%23C0392B' stroke-width='1.3'/%3E%3Ccircle cx='100' cy='95' r='3' fill='%23D4A843'/%3E%3Ccircle cx='100' cy='88' r='3' fill='none' stroke='%23C0392B' stroke-width='1'/%3E%3Ccircle cx='107' cy='95' r='3' fill='none' stroke='%23C0392B' stroke-width='1'/%3E%3Ccircle cx='93' cy='95' r='3' fill='none' stroke='%23C0392B' stroke-width='1'/%3E%3Cpath d='M155,20 L156.5,24 L161,24 L157.5,27 L159,31 L155,28 L151,31 L152.5,27 L149,24 L153.5,24Z' fill='none' stroke='%23D4A843' stroke-width='0.9'/%3E%3Cpath d='M140,105 L136,112 L144,112 Z' fill='none' stroke='%23D4A843' stroke-width='1.2'/%3E%3Cline x1='140' y1='112' x2='140' y2='120' stroke='%23D4A843' stroke-width='1.2'/%3E%3Cline x1='136' y1='120' x2='144' y2='120' stroke='%23D4A843' stroke-width='1.2'/%3E%3Ctext x='60' y='185' font-family='Georgia,serif' font-size='9' font-weight='700' fill='%23C0392B'%3EMo%3C/text%3E%3Ctext x='76' y='185' font-family='Georgia,serif' font-size='9' font-weight='700' fill='%23D4A843'%3Eyo%3C/text%3E%3Cpath d='M185,175 C185,173 188,172 188,175 C188,172 191,173 191,175 C191,178 188,181 188,181Z' fill='%23C0392B'/%3E%3Cpath d='M50,140 Q55,135 60,140 Q65,145 70,140 Q75,135 80,140' fill='none' stroke='%23D4A843' stroke-width='1.2'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
  }
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  .msg-arrow{opacity:0;transition:opacity 0.15s}
  .msg-row:hover .msg-arrow{opacity:1}
  @media(hover:none){.msg-arrow{opacity:1}}
  .fu2{animation:fadeUp 0.7s 0.25s both ease-out}
  .fu3{animation:fadeUp 0.7s 0.4s both ease-out}
  .fu4{animation:fadeUp 0.7s 0.55s both ease-out}
  .fu5{animation:fadeUp 0.7s 0.7s both ease-out}
  .fu6{animation:fadeUp 0.7s 0.85s both ease-out}
  .heart{animation:float 3s ease-in-out infinite;display:inline-block}
  .btn-p{transition:all 0.2s ease!important}
  .btn-p:hover{transform:translateY(-3px)!important;box-shadow:0 14px 36px rgba(192,57,43,0.5)!important}
  .btn-p:active{transform:translateY(0) scale(0.97)!important}
  .btn-o{transition:all 0.2s ease!important;border:2px solid #1a1a1a!important}
  .btn-o:hover{background:#1a1a1a!important;color:#ffffff!important;transform:translateY(-2px)!important}
  .btn-o:active{transform:scale(0.97)!important}
  .stat:hover{transform:translateY(-5px) scale(1.04)!important;box-shadow:0 10px 28px rgba(44,26,14,0.14)!important}
  .stat{transition:all 0.25s ease!important}
  .store:hover{transform:translateY(-3px);opacity:0.92}
  .store{transition:all 0.22s ease!important}
  .fb:hover{opacity:0.88;transform:translateY(-2px)}
  .fb{transition:all 0.2s!important}
  .nav-link:hover{color:#C0392B!important}
  .nav-link{transition:color 0.2s!important}
  .card-hover{transition:transform 0.18s ease,box-shadow 0.18s ease!important}
  .card-hover:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px rgba(44,26,14,0.12)!important}
  .card-hover:active{transform:scale(0.98)!important}
  .trust-card{transition:transform 0.22s ease,box-shadow 0.22s ease!important}
  .trust-card:hover{transform:translateY(-6px)!important;box-shadow:0 16px 40px rgba(44,26,14,0.13)!important}
  .testi-card{transition:transform 0.22s ease,box-shadow 0.22s ease!important}
  .testi-card:hover{transform:translateY(-5px)!important;box-shadow:0 14px 36px rgba(44,26,14,0.12)!important}
  .social-icon{transition:transform 0.18s ease,opacity 0.18s ease!important}
  .social-icon:hover{transform:translateY(-3px) scale(1.12)!important;opacity:0.85!important}
  .profile-card{transition:transform 0.18s ease,box-shadow 0.18s ease!important}
  .profile-card:hover{transform:translateY(-2px)!important;box-shadow:0 8px 28px rgba(44,26,14,0.13)!important}
  .profile-card:active{transform:scale(0.99)!important}
  .action-card{transition:transform 0.15s ease,box-shadow 0.15s ease,background 0.15s ease!important}
  .action-card:hover{transform:translateX(3px)!important;box-shadow:0 4px 16px rgba(0,0,0,0.08)!important}
  .action-card:active{transform:scale(0.98)!important}
  .icon-btn{transition:transform 0.15s ease,opacity 0.15s ease!important}
  .icon-btn:hover{transform:scale(1.08)!important;opacity:0.9!important}
  .icon-btn:active{transform:scale(0.93)!important}
  .nav-tab{transition:all 0.2s ease!important}
  .nav-tab-active{background:rgba(192,57,43,0.12)!important;border-radius:14px!important}
  .verified-badge{display:inline-flex;align-items:center;justify-content:center;background:#1d9bf0;border-radius:50%;width:18px;height:18px;flex-shrink:0}
  @media(max-width:767px){
    .landing-hero-text{text-align:center!important}
    .fu3{text-align:center!important;margin-left:auto!important;margin-right:auto!important}
    .landing-hero-btns{justify-content:center!important}
  }
  @media(min-width:768px){
    .landing-hero{display:grid!important;grid-template-columns:1fr 1fr!important;gap:48px!important;align-items:center!important;text-align:left!important;max-width:1100px!important;margin:0 auto!important;padding:60px 40px 40px!important}
    .landing-hero-text{text-align:left!important}
    .landing-hero-btns{justify-content:flex-start!important}
    .landing-stats{max-width:900px!important;margin:0 auto!important;padding:0 40px 0!important;grid-template-columns:repeat(3,1fr)!important}
    .landing-sections{max-width:1100px!important;margin:0 auto!important;padding:0 40px!important}
    .trust-grid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:20px!important}
    .testi-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:20px!important}
    .steps-layout{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:32px!important}
    .step-connector{display:block!important}
    .nav-inner{max-width:1100px!important;margin:0 auto!important;padding:0 40px!important;width:100%!important}
  }
`;

function Btn({ children, variant = "primary", onClick, style = {}, disabled = false, loading = false }: {
  children: React.ReactNode; variant?: string; onClick?: () => void;
  style?: React.CSSProperties; disabled?: boolean; loading?: boolean;
}) {
  const base: React.CSSProperties = {
    border: "none", borderRadius: 50, padding: "13px 28px", fontWeight: 600,
    fontSize: "0.93rem", cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.65 : 1, display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.18s ease", ...style,
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.3)" },
    gold: { background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111" },
    outline: { background: "transparent", color: "#111", border: `2px solid ${G.brun}` },
    ghost: { background: "rgba(44,26,14,0.06)", color: "#111" },
    danger: { background: "#e74c3c", color: G.blanc },
    white: { background: G.blanc, color: G.rouge },
  };
  return <button style={{ ...base, ...v[variant] }} onClick={onClick} disabled={disabled || loading}>{loading ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:"pulse 0.8s ease-in-out infinite"}}><circle cx="12" cy="12" r="10"/></svg> : children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, icon, error, hint }: {
  label?: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; icon?: string; error?: string; hint?: string;
}) {
  const svgIcon = icon === "email" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    : icon === "lock" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    : icon === "user" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    : icon === "cake" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>
    : icon ? <span style={{ opacity: 0.5 }}>{icon}</span> : null;
  const [focus, setFocus] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  return (
    <div style={{ marginBottom: 18, width: "100%" }}>
      {label && <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>{label}</label>}
      <div style={{ position: "relative", width: "100%" }}>
        {svgIcon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5, pointerEvents: "none", zIndex: 1, color: "#555", display: "flex" }}>{svgIcon}</span>}
        <input
          type={isPwd ? (showPwd ? "text" : "password") : type}
          value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: icon ? (isPwd ? "13px 42px 13px 40px" : "13px 14px 13px 40px") : (isPwd ? "13px 42px 13px 14px" : "13px 14px"),
            border: `2px solid ${error ? "#e74c3c" : focus ? G.or : G.gris}`,
            borderRadius: 12, fontSize: "0.93rem", background: G.blanc,
            color: "#111", outline: "none", transition: "border-color 0.2s", display: "block",
          }}
        />
        {isPwd && <span onClick={() => setShowPwd(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6, zIndex: 1 }}>
          {showPwd
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </span>}
      </div>
      {hint && !error && <p style={{ color: "#555", fontSize: "0.75rem", marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ color: "#e74c3c", fontSize: "0.75rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Toast({ msg, type = "success", onClose }: { msg: string; type?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? "#e74c3c" : type === "premium" ? `linear-gradient(135deg,${G.or},#B8860B)` : G.vert;
  return <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: bg, color: type === "premium" ? G.brun : G.blanc, padding: "12px 22px", borderRadius: 50, fontSize: "0.85rem", fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", maxWidth: "88vw", textAlign: "center" }}>{type === "error" ? "❌" : type === "premium" ? "⭐" : "✅"} {msg}</div>;
}

function ErrorModal({ msg, onClose }: { msg: string; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
        <p style={{ fontSize: "0.88rem", color: "#111", lineHeight: 1.6, marginBottom: 22, fontWeight: 500 }}>{msg}</p>
        <Btn variant="primary" onClick={onClose} style={{ width: "100%" }}>OK</Btn>
      </div>
    </div>
  );
}

function ModerationModal({ type, onClose }: { type: "insult" | "scam" | "sexual"; onClose: () => void }) {
  const config = {
    insult: {
      icon: "🚫",
      text: "Ce message contient des termes irrespectueux. Sur MOYO, nous encourageons le respect et la bienveillance ❤️",
    },
    scam: {
      icon: "⚠️",
      text: "Ce message contient des éléments suspects (demande d'argent, arnaque). Ce comportement est interdit sur MOYO ❤️",
    },
    sexual: {
      icon: "🔒",
      text: "Ce message contient du contenu inapproprié. Sur MOYO, nous encourageons le respect et la bienveillance ❤️",
    },
  };
  const { icon, text } = config[type];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.2s ease" }}>
      <div style={{ background: G.blanc, borderRadius: 24, width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 24px 64px rgba(44,26,14,0.18)", overflow: "hidden", animation: "fadeUp 0.25s ease" }}>
        <div style={{ background: "linear-gradient(135deg, #fff5f5, #ffe8e8)", padding: "24px 20px 16px" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>{icon}</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: G.rouge, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Avertissement
          </div>
        </div>
        <div style={{ padding: "16px 24px 22px" }}>
          <p style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.65, marginBottom: 20, fontWeight: 400 }}>
            {text}
          </p>
          <button
            onClick={onClose}
            style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc, border: "none", borderRadius: 50, padding: "13px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", boxShadow: "0 4px 14px rgba(192,57,43,0.3)" }}
          >
            OK, J'AI COMPRIS
          </button>
        </div>
      </div>
    </div>
  );
}

function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#1d9bf0", borderRadius: "50%", width: size, height: size, flexShrink: 0 }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}

function Avatar({ url, gender, size = 54, border = false, premium = false }: { url?: string | null; gender?: string; size?: number; border?: boolean; premium?: boolean }) {
  return <div style={{ position: "relative", flexShrink: 0 }}><div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: border ? `3px solid ${G.rouge}` : "none", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45 }}>{url ? <img src={url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (gender === "Femme" ? "👩🏿" : "👨🏿")}</div>{premium && <div style={{ position: "absolute", bottom: -2, right: -2, background: G.or, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", border: `2px solid ${G.blanc}` }}>⭐</div>}</div>;
}

function PremiumModal({ onClose, reason }: { onClose: () => void; reason: string }) {
  const avantages = [
    { icon: "msg", titre: "Messages illimités", desc: `Discute sans limite (gratuit = ${FREE_LIMITS.messages}/match)` },
    { icon: "phone", titre: "Partage tes coordonnées", desc: "Envoie ton numéro, email librement" },
    { icon: "heart", titre: "Likes illimités", desc: `Like sans limite (gratuit = ${FREE_LIMITS.likes}/jour)` },
    { icon: "eye", titre: "Voir qui t'a liké", desc: "Découvre tes admirateurs secrets" },
    { icon: "star2", titre: "Profil mis en avant", desc: "Apparais en premier dans Découvrir" },
    { icon: "check2", titre: "Messages lus", desc: "Vois quand tes messages ont été lus" },
    { icon: "filter", titre: "Filtres avancés", desc: "Filtre par ville, âge, situation" },
    { icon: "visitors", titre: "Visiteurs du profil", desc: "Vois toutes les personnes qui t'ont consulté" },
    { icon: "verified", titre: "Profil vérifié", desc: "Badge de confiance visible" },
    { icon: "support", titre: "Support prioritaire", desc: "Assistance rapide 7j/7" },
  ];

  const getIcon = (id: string) => {
    const svgs: Record<string, React.ReactElement> = {
      msg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
      phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6.06 6.06l1.09-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      eye: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      star: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      star2: <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      check2: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
      filter: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
      visitors: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      verified: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      support: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    };
    return svgs[id] || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,#D4A843,#B8922E)`, padding: "14px 20px 20px", position: "relative", flexShrink: 0 }}>
          {/* Ligne fermeture */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <div onClick={onClose} style={{ cursor: "pointer", opacity: 0.85, background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem", fontWeight: 600 }}>Passe à</div>
              <div style={{ color: G.blanc, fontSize: "1.3rem", fontWeight: 800 }}>Premium</div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ color: G.blanc, fontSize: "1.6rem", fontWeight: 800 }}>3 500 FCFA</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem" }}>/mois</div>
            </div>
          </div>
          {reason && <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: "0.8rem", color: G.blanc, fontWeight: 600 }}>{reason}</div>}
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", marginTop: 8 }}>MTN MoMo · Airtel Money · Orange Money</div>
        </div>

        {/* Liste avantages - style Guide */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          {avantages.map((a, i) => (
            <div key={a.titre} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: `1px solid ${G.gris}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg,${G.or},#B8922E)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {getIcon(a.icon)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111" }}>{a.titre}</div>
                <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 1 }}>{a.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div style={{ padding: "16px 20px 32px", flexShrink: 0 }}>
          <Btn variant="gold" onClick={() => {}} style={{ width: "100%", padding: "16px", fontSize: "1rem", marginBottom: 10 }}>
            Activer Premium - 3 500 FCFA/mois
          </Btn>
          <button onClick={onClose} style={{ width: "100%", fontSize: "0.88rem", color: "#555", cursor: "pointer", fontWeight: 600, padding: "13px", borderRadius: 50, border: `2px solid ${G.gris}`, background: G.blanc, transition: "all 0.2s" }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#999"; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = G.gris; }}>
            Non merci, plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPassword({ onNav }: { onNav: (p: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Lire le access_token dans le hash de l'URL
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const t = params.get("access_token");
    const type = params.get("type");
    if (t && type === "recovery") {
      setToken(t);
    } else {
      // Pas de token valide → rediriger vers login
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
        <div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}>
          <span>Mo</span><span style={{ color: G.or }}>yo</span>
        </div>
        <h2 style={{  fontSize: "1.5rem", fontWeight: 700, marginTop: 8 }}>Nouveau mot de passe</h2>
        <p style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>Choisis un nouveau mot de passe sécurisé</p>
      </div>
      <Input label="Nouveau mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 caractères" icon="lock" hint="Au moins 6 caractères" />
      <Input label="Confirmer le mot de passe" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répète ton mot de passe" icon="lock" />
      <Btn variant="primary" onClick={handleReset} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!password || !confirm}>
        Changer mon mot de passe ✓
      </Btn>
    </AuthLayout>
  );
}

// Composant compteur animé
function StatCounter({ target, suffix, label, svg }: { target: number; suffix: string; label: string; svg: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        const duration = 1800;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  const display = target >= 1000
    ? (count >= 1000 ? `${Math.floor(count / 1000)} ${Math.floor((count % 1000) / 100) > 0 ? Math.floor((count % 1000) / 100) + "00" : "000"}` : count.toString())
    : count.toString();

  return (
    <div ref={ref} className="stat" style={{ background: G.creme, borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{svg}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: G.rouge, marginBottom: 2 }}>
        {target >= 1000 ? `${Math.floor(count / 1000)} ${String(count % 1000).padStart(3,'0')}${suffix}` : `${count}${suffix}`}
      </div>
      <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// Hook pour détecter la largeur d'écran
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 768);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

function Landing({ onNav }: { onNav: (p: string) => void }) {
  const NEW_FB = "https://www.facebook.com/share/1HssYavG19/?mibextid=wwXIfr";
  const svgFb = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  const svgIg = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  const svgTk = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>;
  const svgWa = <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  const [showLandingMenu, setShowLandingMenu] = useState(false);
  const [openMenuSection, setOpenMenuSection] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingComment, setRatingComment] = useState("");
  const isMobile = useWindowWidth() < 768;
  const toggleSection = (s: string) => setOpenMenuSection(prev => prev === s ? null : s);

  const landingMenuSections = [
    { id: "conseils", title: "Conseils pour bien rencontrer", emoji: "💡", items: [
      { icon: "camera", titre: "Mets une vraie photo", desc: "Les profils avec une photo reçoivent 5x plus de messages. Utilise une photo récente et souriante." },
      { icon: "edit", titre: "Remplis bien ta bio", desc: "Parle de tes passions, tes valeurs. Une bio sincère attire les bonnes personnes." },
      { icon: "chat", titre: "Prends le temps de discuter", desc: "Ne te précipite pas. Apprends à connaître la personne avant de proposer une rencontre." },
      { icon: "lock2", titre: "Protège tes informations", desc: "Ne partage pas ton numéro trop vite. Vérifie que la personne est sérieuse." },
      { icon: "alert", titre: "Signale les faux profils", desc: "Si tu suspectes une arnaque, utilise le bouton Signaler. Tu protèges toute la communauté." },
      { icon: "handshake", titre: "Sois respectueux(se)", desc: "Traite les autres comme tu voudrais être traité(e)." },
    ]},
    { id: "services", title: "Nos services", emoji: "🌟", items: [
      { icon: "hearts", titre: "Rencontres en ligne", desc: "Trouve ton âme sœur parmi des profils vérifiés.", badge: "Gratuit" },
      { icon: "star2", titre: "Abonnement Premium", desc: "Likes illimités, messages illimités, voir qui t'a liké.", badge: "3 500 FCFA/mois" },
      { icon: "ring", titre: "Accompagnement mariage", desc: "Nous t'accompagnons dans l'organisation de ta cérémonie congolaise.", badge: "Sur demande" },
      { icon: "vip", titre: "Mise en relation VIP", desc: "Service personnalisé et discret dans ta recherche de l'âme sœur.", badge: "Premium" },
    ]},
    { id: "mariage", title: "Accompagnement mariage", emoji: "💍", items: [
      { icon: "✓", titre: "Organisation du mariage traditionnel et civil", desc: "Possibilité de préfinancement" },
      { icon: "✓", titre: "Coordination de la cérémonie traditionnelle", desc: "" },
      { icon: "✓", titre: "Mise en relation avec des prestataires congolais", desc: "" },
      { icon: "✓", titre: "Accompagnement pour les couples diaspora/Congo", desc: "" },
    ]},
    { id: "temoignages", title: "Témoignages", emoji: "💬", items: [
      { icon: "couple", titre: "Fatou & Rodrigue - Paris · Brazza", desc: "On s'est rencontrés sur Moyo en janvier. Aujourd'hui on est fiancés ! Merci Moyo 💕" },
      { icon: "star3", titre: "Céleste - Diaspora Belgique", desc: "Enfin une appli faite pour nous ! J'ai trouvé quelqu'un de sérieux en 2 semaines." },
{ icon: "thumbup", titre: "Patrick - Pointe-Noire", desc: "Simple, propre, efficace. Exactement ce qu'il fallait pour la diaspora congolaise." },
    ]},
    { id: "faq", title: "Questions fréquentes", emoji: "❓", items: [
      { icon: "Q", titre: "Moyo est-il gratuit ?", desc: "Oui, l'inscription est gratuite. 5 likes/jour et 3 messages/match. Premium à 3 500 FCFA/mois." },
      { icon: "Q", titre: "Comment annuler un match ?", desc: "Dans Matchs, appuyez sur les 3 traits → Annuler le match. La conversation, les likes et les vues sont supprimés. L'autre personne n'est pas notifiée." },
      { icon: "Q", titre: "Comment offrir le Premium ?", desc: "Dans une conversation, le bouton cadeau apparait uniquement si vous êtes Premium. Vous pouvez offrir le Premium à votre partenaire non-premium." },
      { icon: "Q", titre: "Comment obtenir le badge vérifié ?", desc: "Profil → Faire vérifier mon compte → WhatsApp. Gratuit, vérification sous 24h." },
      { icon: "Q", titre: "Comment inviter un ami ?", desc: "Dans Profil, appuyez sur Inviter un ami. Un message pré-rempli s'ouvre sur WhatsApp ou le partage natif." },
      { icon: "Q", titre: "Comment activer le mode sombre ?", desc: "Dans Profil, utilisez le bouton Mode clair/sombre pour basculer entre les deux thèmes." },
      { icon: "Q", titre: "Comment rendre mon profil invisible ?", desc: "Dans Profil, activez le bouton Profil invisible. Vous disparaissez de Découvrir sans supprimer votre compte." },
      { icon: "Q", titre: "Pourquoi je ne vois pas mon profil dans Découvrir ?", desc: "Votre profil doit être complet jusqu'à la dernière étape de l'inscription pour apparaître dans Découvrir. Vérifiez aussi que votre profil est bien visible dans les paramètres." },
      { icon: "Q", titre: "À quoi servent les onglets Likes et Vus ?", desc: "Deux onglets séparés : Likes (personnes qui vous ont liké) et Vus (personnes qui ont visité votre profil). Tout le monde voit le compteur. Premium requis pour voir les cartes et l'identité des personnes. Vous pouvez retirer une carte sans affecter les matchs." },
      { icon: "Q", titre: "Qui apparaît dans mes Vus ?", desc: "Uniquement les membres Premium qui ont consulté votre profil. Les membres gratuits ne génèrent pas de vues et n'apparaissent pas dans votre liste Vus." },
      { icon: "Q", titre: "Si je unlike quelqu'un, que se passe-t-il ?", desc: "Le like disparait des deux côtés instantanément. Si vous aviez un match, la conversation et tous les messages sont supprimés." },
      { icon: "Q", titre: "Que se passe-t-il si j'envoie un message irrespectueux ?", desc: "Moyo bloque automatiquement les insultes, menaces, arnaques et contenus inappropriés avant envoi. Le message ne part pas, un avertissement s'affiche, et un signalement automatique est envoyé à notre équipe. Les comportements répétés entraînent la suppression du compte." },
      { icon: "Q", titre: "Comment réagir à un message ?", desc: "Appuyez longuement sur un message pour ouvrir le menu de réactions (👍 ❤️ 😂 😮 😢 🙏). Une seule réaction par message est autorisée : choisir une nouvelle réaction remplace automatiquement la précédente." },
      { icon: "Q", titre: "Comment contacter l'assistance Moyo ?", desc: "Appuyez sur l'icône verte (Assistant Moyo) à côté du bouton Guide. Vous pouvez poser vos questions ou signaler un problème directement depuis l'app." },
      { icon: "Q", titre: "Puis-je voir le profil de quelqu'un depuis les messages ?", desc: "Oui. Dans une conversation, appuyez sur la photo de profil de votre match en haut de l'écran pour voir sa fiche complète." },
    ]},
    { id: "securite", title: "Sécurité & Confidentialité", emoji: "🔒", items: [
      { icon: "shield", titre: "Données sécurisées", desc: "Vos informations sont hébergées de manière sécurisée et ne sont jamais partagées avec des tiers." },
      { icon: "eyeoff", titre: "Profil invisible", desc: "Rendez votre profil invisible depuis vos paramètres sans supprimer votre compte." },
      { icon: "block", titre: "Blocage utilisateur", desc: "Bloquez n'importe quel utilisateur d'un simple clic." },
      { icon: "adult", titre: "Majorité requise", desc: "Moyo est strictement réservé aux personnes de 18 ans et plus." },
    ]},
    { id: "confidentialite", title: "Confidentialité & CGU", emoji: "📋", items: [
      { icon: "shield", titre: "Responsable du traitement", desc: "Romeo GUEBO - contact : contact@moyo-congo.com" },
      { icon: "lock2", titre: "Données collectées", desc: "Nom, e-mail, photos, messages, données de connexion et abonnement. Utilisées uniquement pour le fonctionnement de Moyo." },
      { icon: "lock2", titre: "Conservation & sécurité", desc: "Données conservées le temps nécessaire au service. Aucune revente. Prestataires techniques liés à l'hébergement uniquement." },
      { icon: "verified", titre: "Vos droits (RGPD)", desc: "Accès, modification et suppression de vos données sur demande à contact@moyo-congo.com" },
      { icon: "chat", titre: "CGU - Utilisation", desc: "Moyo est réservé aux majeurs. Tout comportement frauduleux, haineux ou abusif entraîne la suppression du compte." },
      { icon: "alert", titre: "Contenus interdits", desc: "Faux profils, harcèlement, contenus illégaux, tentatives d'arnaque ou usurpation d'identité sont strictement interdits." },
      { icon: "star2", titre: "Premium & paiement", desc: "Certaines fonctionnalités sont accessibles via abonnement. Paiements via prestataires sécurisés (MTN MoMo, Airtel Money)." },
    ]},
    { id: "mentions", title: "Mentions légales", emoji: "⚖️", items: [
      { icon: "user", titre: "Éditeur du site", desc: "Romeo GUEBO - contact@moyo-congo.com" },
      { icon: "shield", titre: "Propriété intellectuelle", desc: "Tous les contenus, visuels et logos de Moyo sont protégés. Toute reproduction sans autorisation est interdite." },
      { icon: "verified", titre: "Droit applicable", desc: "Les présentes conditions sont régies par le droit français. Tout litige relève des tribunaux compétents." },
      { icon: "chat", titre: "Contact", desc: "Pour toute question légale : contact@moyo-congo.com" },
    ]},
    { id: "notation", title: "Noter Moyo", emoji: "⭐", items: [] },
  ];

  return (
    <div style={{ minHeight: "100vh", background: G.creme, overflow: "hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── NAV ── */}
      <nav style={{ background: G.blanc, boxShadow: "0 2px 16px rgba(44,26,14,0.07)", flexShrink: 0, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div className="nav-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: "1.9rem", color: G.rouge, fontWeight: 700, letterSpacing: "-0.03em", display: "inline-flex", alignItems: "baseline", gap: 0 }}>
            <span>Mo</span><span style={{ color: G.or }}>yo</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span onClick={() => onNav("about")}
              style={{ fontSize: "0.6rem", fontWeight: 700, color: "#111", cursor: "pointer", width: 80, height: 46, borderRadius: 10, border: `2px solid ${G.brun}`, background: "transparent", transition: "all 0.2s", display: "inline-flex", alignItems: "center", justifyContent: "center", letterSpacing: "0.05em" }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = G.vert; el.style.color = G.blanc; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 16px rgba(44,26,14,0.2)"; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = G.brun; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            >À PROPOS</span>
            {/* Bouton MENU */}
            <div onClick={() => setShowLandingMenu(true)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", background: "transparent", border: `2px solid ${G.brun}`, borderRadius: 10, width: 80, height: 46, transition: "all 0.2s" }}
              onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = G.vert; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 18px rgba(26,92,58,0.4)"; const lines = el.querySelectorAll(".menu-line"); lines.forEach((l: any) => l.style.background = G.blanc); const label = el.querySelector(".menu-label") as HTMLElement; if(label) label.style.color = G.blanc; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; const lines = el.querySelectorAll(".menu-line"); lines.forEach((l: any) => l.style.background = G.brun); const label = el.querySelector(".menu-label") as HTMLElement; if(label) label.style.color = G.brun; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            >
              {[0,1,2].map(i => <div key={i} className="menu-line" style={{ width: 18, height: 2, borderRadius: 2, background: G.brun }} />)}
              <span className="menu-label" style={{ color: "#111", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em", marginTop: 1 }}>MENU</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MENU PANEL ACCORDÉON ── */}
      {showLandingMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}>
          <div onClick={() => setShowLandingMenu(false)} style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: "85%", maxWidth: 360, background: G.blanc, height: "100%", overflowY: "auto", boxShadow: "-8px 0 32px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            {/* Header vert */}
            <div style={{ background: `linear-gradient(160deg,${G.vert},#0D2E1C)`, padding: "24px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ color: G.blanc, fontSize: "1.1rem", fontWeight: 700 }}>Menu</div>
              <div onClick={() => setShowLandingMenu(false)} style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}>✕</div>
            </div>
            <div style={{ padding: "8px 0", flex: 1 }}>
              {landingMenuSections.map(s => (
                <div key={s.id} style={{ borderBottom: `1px solid ${G.gris}` }}>
                  <div onClick={() => toggleSection(s.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: openMenuSection === s.id ? "rgba(26,92,58,0.05)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Icône SVG par section */}
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: openMenuSection === s.id ? `linear-gradient(135deg,${G.vert},#0D4020)` : G.gris, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {s.id === "conseils" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4l3 3"/></svg>}
                        {s.id === "services" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                        {s.id === "mariage" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                        {s.id === "temoignages" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        {s.id === "faq" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                        {s.id === "securite" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                        {s.id === "confidentialite" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                        {s.id === "mentions" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? "white" : "#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                        {s.id === "notation" && <svg width="16" height="16" viewBox="0 0 24 24" fill={openMenuSection === s.id ? "white" : "#555"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "0.92rem", color: openMenuSection === s.id ? G.vert : G.brun }}>{s.title}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openMenuSection === s.id ? G.vert : "#bbb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: openMenuSection === s.id ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {openMenuSection === s.id && (
                    <div style={{ padding: "4px 20px 16px" }}>
                      {s.id === "notation" ? (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                          {ratingSubmitted ? (
                            <div>
                              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
                              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: 4 }}>Merci pour ton avis !</div>
                              <div style={{ fontSize: "0.82rem", color: "#555" }}>Tu as noté Moyo {userRating}/5 étoiles</div>
                              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
                                {[1,2,3,4,5].map(s => (
                                  <svg key={s} width="24" height="24" viewBox="0 0 24 24" fill={s <= userRating ? G.or : "#ddd"} stroke="none">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", marginBottom: 4 }}>Comment tu trouves Moyo ?</div>
                              <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: 16 }}>Ton avis nous aide à améliorer la plateforme</div>
                              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                                {[1,2,3,4,5].map(star => (
                                  <div key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setUserRating(star)}
                                    style={{ cursor: "pointer", transform: (hoverRating || userRating) >= star ? "scale(1.2)" : "scale(1)", transition: "transform 0.15s" }}>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill={(hoverRating || userRating) >= star ? G.or : "#ddd"} stroke="none">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                  </div>
                                ))}
                              </div>
                              {userRating > 0 && <>
                                <textarea
                                  value={ratingComment}
                                  onChange={e => setRatingComment(e.target.value)}
                                  placeholder="Laisse un commentaire (optionnel)..."
                                  rows={3}
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid #ddd`, fontSize: "0.82rem", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 10 }}
                                />
                                <button onClick={() => setRatingSubmitted(true)} style={{ width: "100%", background: G.rouge, color: G.blanc, border: "none", borderRadius: 50, padding: "11px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}>
                                  Envoyer mon avis
                                </button>
                              </>}
                            </div>
                          )}
                        </div>
                      ) : s.id === "faq" ? (
                        s.items.map((item, i) => (
                          <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${G.gris}` }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
                              <div style={{ background: G.rouge, color: G.blanc, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q</div>
                              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111" }}>{item.titre}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <div style={{ background: G.or, color: "#111", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>R</div>
                              <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>{item.desc}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        s.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${G.gris}` }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(26,92,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {(() => {
                                const menuIcons: Record<string, React.ReactElement> = {
                                  camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
                                  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                                  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                                  lock2: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
                                  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                                  handshake: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                                  hearts: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                                  star2: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                                  ring: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>,
                                  vip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                                  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                                  eyeoff: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
                                  block: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
                                  adult: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                                  star3: <svg width="14" height="14" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                                  thumbup: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
                                  couple: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                                };
                                return menuIcons[item.icon] || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
                              })()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 2, color: "#111" }}>{item.titre}</div>
                              {item.desc && <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5 }}>{item.desc}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(150deg,#F2F2F0 0%,#EEEEEC 60%,rgba(26,92,58,0.08) 100%)`, overflow: "hidden", position: "relative", paddingTop: 72 }}>

        {/* ── PHOTOS ARRIÈRE-PLAN style Tinder ── */}
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 4, opacity: 0.35, zIndex: 0, pointerEvents: "none" }}>
          {[
            "/bg1.webp",
            "/bg2.webp",
            "/bg3.webp",
            "/bg4.webp",
            "/bg5.webp",
            "/bg6.webp",
            "/bg7.webp",
            "/bg8.webp",
            "/bg9.webp",
            "/bg10.webp",
            "/bg11.webp",
            "/bg12.webp",
          ].map((url, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(100%)" }} />
            </div>
          ))}
        </div>

        {/* Overlay dégradé pour lisibilité */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg,rgba(242,242,240,0.82) 0%,rgba(238,238,236,0.75) 50%,rgba(26,92,58,0.15) 100%)`, zIndex: 1, pointerEvents: "none" }} />

        {/* Cercles déco supprimés pour ne pas cacher les photos */}

        <div className="landing-hero" style={{ padding: "52px 24px 0", textAlign: "center", alignItems: "flex-end", position: "relative", zIndex: 2 }}>

          {/* ── Texte gauche ── */}
          <div className="landing-hero-text fu1" style={{ paddingBottom: 52 }} id="hero-text-block">
            <div style={{ display: "inline-block", background: G.blanc, border: `2px solid #111`, padding: "7px 20px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 22, color: "#111", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              Site de rencontres Congolais
            </div>
            <h1 className="fu2" style={{ fontSize: "clamp(2.4rem,5.5vw,3.8rem)", lineHeight: 1.08, fontWeight: 700, marginBottom: 20, color: "#111" }}>
              Trouve ton{" "}
              <span className="heart" style={{ color: G.rouge, fontStyle: "italic" }}>âme sœur</span>
              <br />au Congo
            </h1>
            <p className="fu3" style={{ fontSize: "1rem", lineHeight: 1.8, color: "#555", marginBottom: 36, maxWidth: 440, width: "100%" }}>
              Moyo connecte les Congolais à la recherche d'une relation sincère et durable.
              Brazzaville, Pointe-Noire, Dolisie et toute la diaspora.
            </p>
            <div className="fu4 landing-hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 4 }}>
              <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 36px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.35)", cursor: "pointer" }}>
                Créer mon compte gratuit
              </button>
              <button className="btn-o" onClick={() => onNav("login")} style={{ border: "2px solid #1a1a1a", borderRadius: 50, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", background: G.blanc, color: "#1a1a1a", cursor: "pointer", marginTop: 6 }}>
                Me connecter
              </button>
            </div>

            {/* ── Téléphones visibles sur MOBILE ── */}
            <div className="fu5" style={{ display: "block", position: "relative", margin: "0 auto", maxWidth: 340 }} id="hero-img-mobile">
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, height: 240 }}>
                {/* Téléphone gauche */}
                <div style={{ width: 90, height: 180, borderRadius: 16, background: "linear-gradient(160deg,#2C1A0E,#5C3A1E)", border: "3px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 12px 32px rgba(44,26,14,0.25)", flexShrink: 0, transform: "rotate(-8deg) translateY(20px)" }}>
                  <div style={{ background: G.rouge, padding: "4px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.45rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                  </div>
                  <div style={{ height: 100, overflow: "hidden", position: "relative" }}>
                    <img src="/phone-femme.webp" alt="Sandrine" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  </div>
                  <div style={{ padding: "4px 6px" }}>
                    <div style={{ fontSize: "0.42rem", fontWeight: 700, color: "#111" }}>Sandrine, 27</div>
                    <div style={{ fontSize: "0.35rem", color: "#555" }}>📍 Brazzaville</div>
                    <div style={{ marginTop: 4, background: G.rouge, borderRadius: 50, padding: "2px 6px", textAlign: "center", fontSize: "0.38rem", color: G.blanc, fontWeight: 700 }}>Liker</div>
                  </div>
                </div>
                {/* Téléphone central */}
                <div style={{ width: 112, height: 220, borderRadius: 18, background: "linear-gradient(160deg,#1a1a2e,#16213e)", border: "3px solid rgba(255,255,255,0.2)", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.35)", flexShrink: 0, zIndex: 2 }}>
                  <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "5px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.55rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: G.blanc }}>CG</div>
                  </div>
                  <div style={{ height: 128, overflow: "hidden", position: "relative" }}>
                    <img src="/phone-homme.webp" alt="Romaric" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    <div style={{ position: "absolute", top: 6, right: 6, background: G.rouge, borderRadius: 50, padding: "2px 6px", fontSize: "0.35rem", color: G.blanc, fontWeight: 700 }}>Premium</div>
                  </div>
                  <div style={{ padding: "5px 8px" }}>
                    <div style={{ fontSize: "0.52rem", fontWeight: 700, color: G.blanc }}>Romaric, 30</div>
                    <div style={{ fontSize: "0.4rem", color: "rgba(255,255,255,0.6)" }}>📍 Pointe-Noire</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 5, justifyContent: "center" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem" }}>✕</div>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `rgba(212,168,67,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem" }}>⭐</div>
                    </div>
                  </div>
                </div>
                {/* Téléphone droit */}
                <div style={{ width: 90, height: 180, borderRadius: 16, background: "linear-gradient(160deg,#1a1a2e,#2d2d44)", border: "3px solid rgba(255,255,255,0.15)", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.25)", flexShrink: 0, transform: "rotate(8deg) translateY(20px)" }}>
                  <div style={{ background: G.brun, padding: "4px 6px" }}>
                    <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.45rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                  </div>
                  <div style={{ padding: "4px 6px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "linear-gradient(160deg,#C47A4A,#8B4513)" }} />
                      <div>
                        <div style={{ fontSize: "0.38rem", fontWeight: 700, color: G.blanc }}>Nouveau match !</div>
                        <div style={{ fontSize: "0.32rem", color: "rgba(255,255,255,0.5)" }}>Junior t'a liké aussi</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 5px", fontSize: "0.32rem", color: "rgba(255,255,255,0.7)" }}>Bonsoir Lionel...</div>
                    <div style={{ marginTop: 2, background: G.rouge, borderRadius: 6, padding: "2px 5px", fontSize: "0.32rem", color: G.blanc, textAlign: "right" }}>Bonsoir ! Comment tu vas ?</div>
                    <div style={{ marginTop: 1, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 5px", fontSize: "0.32rem", color: "rgba(255,255,255,0.7)" }}>Très bien merci !</div>
                    <div style={{ marginTop: 3, background: "rgba(212,168,67,0.2)", border: `1px solid ${G.or}`, borderRadius: 6, padding: "2px 5px", display: "flex", alignItems: "center", gap: 2 }}>
                      <svg width="6" height="6" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span style={{ fontSize: "0.3rem", color: G.or, fontWeight: 600 }}>Profils vérifiés</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Bulles flottantes mobile */}
              <div style={{ position: "absolute", bottom: 10, right: 0, background: G.blanc, borderRadius: 14, padding: "6px 10px", boxShadow: "0 6px 20px rgba(44,26,14,0.14)", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                <div><div style={{ fontWeight: 800, fontSize: "0.65rem", color: "#111" }}>850+ couples</div><div style={{ fontSize: "0.5rem", color: "#555" }}>formés sur Moyo</div></div>
              </div>
            </div>
          </div>

          {/* ── Composition visuelle hero desktop ── */}
          <div className="fu1" style={{ display: "none", position: "relative", alignSelf: "center", justifyContent: "center" }} id="hero-img-desktop">

            {/* Cercle déco principal */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 440, height: 440, borderRadius: "50%",
              background: `linear-gradient(135deg,rgba(212,168,67,0.12),rgba(26,92,58,0.08))`,
              border: "2px solid rgba(212,168,67,0.3)",
              zIndex: 0,
            }} />
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 350, height: 350, borderRadius: "50%",
              background: "rgba(212,168,67,0.05)",
              zIndex: 0,
            }} />

            {/* Mockup téléphone principal */}
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, height: 500 }}>

              {/* Téléphone gauche - légèrement incliné */}
              <div style={{
                transform: "rotate(-6deg) translateY(20px)",
                width: 160, flexShrink: 0,
              }}>
                <div style={{
                  background: "#1C1A2E",
                  borderRadius: 28,
                  padding: "10px",
                  boxShadow: "0 24px 60px rgba(44,26,14,0.25), 0 0 0 1px rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}>
                  {/* Encoche */}
                  <div style={{ width: 40, height: 8, background: "#0D0B1A", borderRadius: 8, margin: "0 auto 10px" }} />
                  {/* Écran - profil Moyo */}
                  <div style={{ background: G.creme, borderRadius: 20, overflow: "hidden", height: 310 }}>
                    {/* Header app */}
                    <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "14px 12px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{  fontSize: "0.9rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                      <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: G.blanc }}>💬</div>
                    </div>
                    {/* Profil card */}
                    <div style={{ padding: "12px 10px" }}>
                      <div style={{ width: "100%", height: 110, borderRadius: 14, overflow: "hidden", marginBottom: 10, position: "relative" }}>
                        <img src="/phone-femme.webp" alt="Sandrine" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        <div style={{ position: "absolute", top: 8, right: 8, background: G.or, borderRadius: 6, padding: "2px 6px", fontSize: "0.45rem", fontWeight: 700, color: "#111" }}>Premium</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.72rem", color: "#111", marginBottom: 2 }}>Sandrine, 27</div>
                      <div style={{ fontSize: "0.6rem", color: "#555", marginBottom: 8 }}>📍 Brazzaville</div>
                      {/* Like button */}
                      <div style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 20, padding: "6px", textAlign: "center", fontSize: "0.6rem", color: G.blanc, fontWeight: 600 }}>❤️ Liker</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Téléphone central - principal, droit */}
              <div style={{ transform: "translateY(-10px)", width: 175, flexShrink: 0, zIndex: 3 }}>
                <div style={{
                  background: "#0D0B1A",
                  borderRadius: 32,
                  padding: "10px",
                  boxShadow: "0 32px 80px rgba(44,26,14,0.3), 0 0 0 1.5px rgba(212,168,67,0.4)",
                  overflow: "hidden",
                }}>
                  <div style={{ width: 44, height: 8, background: "#050408", borderRadius: 8, margin: "0 auto 10px" }} />
                  <div style={{ background: G.blanc, borderRadius: 22, overflow: "hidden", height: 310 }}>
                    {/* Header */}
                    <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "14px 14px 10px", display: "flex", alignItems: "center" }}>
                      <div style={{  fontSize: "1rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                      <div style={{ marginLeft: "auto", fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>🇨🇬</div>
                    </div>
                    {/* Match notification */}
                    <div style={{ background: `linear-gradient(135deg,rgba(192,57,43,0.08),rgba(212,168,67,0.06))`, margin: "10px 10px 0", borderRadius: 12, padding: "10px 10px", border: `1px solid rgba(192,57,43,0.15)` }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: G.rouge, marginBottom: 3 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#C0392B" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Nouveau match !</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "#111", fontWeight: 500 }}>Junior t'a liké aussi</div>
                      </div>
                    </div>
                    {/* Profil principal */}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ width: "100%", height: 120, borderRadius: 14, overflow: "hidden", position: "relative" }}>
                        <img src="/phone-homme.webp" alt="Romaric" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "8px 8px 6px" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.68rem", color: G.blanc }}>Romaric, 30</div>
                          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.8)" }}>📍 Pointe-Noire</div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <div style={{ flex: 1, background: G.gris, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.55rem", color: "#555" }}>✕</div>
                        <div style={{ flex: 2, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.58rem", color: G.blanc, fontWeight: 600 }}>❤️ Liker</div>
                        <div style={{ flex: 1, background: `rgba(212,168,67,0.15)`, border: `1px solid ${G.or}`, borderRadius: 16, padding: "5px", textAlign: "center", fontSize: "0.55rem", color: "#555" }}>⭐</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Téléphone droit - incliné */}
              <div style={{ transform: "rotate(6deg) translateY(20px)", width: 155, flexShrink: 0 }}>
                <div style={{
                  background: "#1C1A2E",
                  borderRadius: 28,
                  padding: "10px",
                  boxShadow: "0 20px 50px rgba(44,26,14,0.2), 0 0 0 1px rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}>
                  <div style={{ width: 38, height: 8, background: "#0D0B1A", borderRadius: 8, margin: "0 auto 10px" }} />
                  <div style={{ background: G.creme, borderRadius: 20, overflow: "hidden", height: 270 }}>
                    <div style={{ background: `linear-gradient(135deg,${G.brun},#5C3A1E)`, padding: "12px 10px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{  fontSize: "0.85rem", color: G.blanc, fontWeight: 700 }}>Mo<span style={{ color: G.or }}>yo</span></div>
                    </div>
                    {/* Conversation */}
                    <div style={{ padding: "8px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ alignSelf: "flex-start", background: G.blanc, borderRadius: "10px 10px 10px 2px", padding: "5px 8px", fontSize: "0.55rem", color: "#111", maxWidth: "80%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Bonsoir Lionel 😊</div>
                      <div style={{ alignSelf: "flex-end", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: "10px 10px 2px 10px", padding: "5px 8px", fontSize: "0.55rem", color: G.blanc, maxWidth: "80%" }}>Bonsoir ! Comment tu vas ?</div>
                      <div style={{ alignSelf: "flex-start", background: G.blanc, borderRadius: "10px 10px 10px 2px", padding: "5px 8px", fontSize: "0.55rem", color: "#111", maxWidth: "80%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>Très bien merci ❤️</div>
                      <div style={{ fontSize: "0.5rem", color: "#555", textAlign: "center", marginTop: 4 }}>Match depuis 2 jours</div>
                      {/* Input message */}
                      <div style={{ background: G.blanc, borderRadius: 14, padding: "5px 8px", display: "flex", alignItems: "center", gap: 4, border: `1px solid ${G.gris}`, marginTop: 4 }}>
                        <div style={{ flex: 1, fontSize: "0.5rem", color: "#ccc" }}>Un message...</div>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: G.blanc }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bulle 850+ couples */}
            <div style={{ position: "absolute", bottom: 30, right: -20, background: G.blanc, borderRadius: 18, padding: "12px 18px", boxShadow: "0 12px 36px rgba(44,26,14,0.14)", display: "flex", alignItems: "center", gap: 10, zIndex: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>💞</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#111" }}>850+ couples</div>
                <div style={{ fontSize: "0.65rem", color: "#555" }}>formés sur Moyo</div>
              </div>
            </div>
            {/* Bulle 12 000+ */}
            <div style={{ position: "absolute", top: 30, left: -20, background: G.blanc, borderRadius: 18, padding: "10px 14px", boxShadow: "0 10px 30px rgba(44,26,14,0.12)", display: "flex", alignItems: "center", gap: 8, zIndex: 4 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0 }}>🇨🇬</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#111" }}>12 000+ membres</div>
                <div style={{ fontSize: "0.62rem", color: "#555" }}>Congo & diaspora</div>
              </div>
            </div>
            {/* Badge vérifiés */}
            <div style={{ position: "absolute", top: 160, right: -20, background: `linear-gradient(135deg,${G.or},#B8860B)`, borderRadius: 50, padding: "6px 14px", boxShadow: "0 6px 20px rgba(212,168,67,0.4)", display: "flex", alignItems: "center", gap: 5, zIndex: 4 }}>
              <span style={{ fontSize: "0.68rem", color: "#111" }}>✓</span>
              <span style={{ fontWeight: 700, fontSize: "0.7rem", color: "#111" }}>Profils vérifiés</span>
            </div>

          </div>
      </div>
      </div>
      <style>{`
        @media(min-width:768px){
          #hero-img-desktop{display:flex!important}
          #hero-img-mobile{display:none!important}
        }
      `}</style>

      {/* ── STATS ── */}
      <div style={{ background: G.blanc, padding: "28px 24px", borderBottom: `1px solid ${G.gris}` }}>
        {/* Phrase déplacée ici */}
        <p style={{ textAlign: "center", color: "#555", fontSize: "0.85rem", marginBottom: 16, marginTop: -8 }}>Chaque jour, de nouveaux couples se forment au Congo et dans la diaspora</p>
        <div className="landing-stats fu5" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          {[
            { target: 12000, suffix: "+", l: "Membres inscrits", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { target: 850, suffix: "+", l: "Couples formés", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            { target: 19, suffix: "", l: "Villes & diasporas", svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
          ].map(({ target, suffix, l, svg }) => (
            <StatCounter key={l} target={target} suffix={suffix} label={l} svg={svg} />
          ))}
        </div>
      </div>

      {/* ── CONFIANCE ── */}
      <div style={{ padding: "48px 24px" }}>
        <div className="landing-sections">
          <h2 className="fu2" style={{  fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, textAlign: "center", marginBottom: 8, color: "#111" }}>
            Pourquoi faire confiance à <span style={{ color: G.rouge }}>Moyo</span> ?
          </h2>
          <p style={{ textAlign: "center", color: "#555", fontSize: "0.88rem", marginBottom: 32 }}>
            Une plateforme pensée pour des rencontres sincères et sécurisées
          </p>
          <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { iconBg: G.rouge, titre: "Profils modérés", desc: "Les profils sont surveillés afin de limiter les faux comptes.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { iconBg: G.or, titre: "Signalement rapide", desc: "Signale rapidement un comportement inapproprié.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { iconBg: G.vert, titre: "Communauté congolaise", desc: "Des membres du Congo et de la diaspora.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { iconBg: G.rouge, titre: "Respect & sécurité", desc: "Des échanges sérieux et respectueux.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            ].map(c => (
              <div key={c.titre} className="trust-card" style={{ background: G.blanc, borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 4px 20px rgba(44,26,14,0.07)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{c.svg}</div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 8, color: "#111" }}>{c.titre}</div>
                <div style={{ fontSize: "0.8rem", color: "#555", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TÉMOIGNAGES PREMIUM ── */}
      <div style={{ background: `linear-gradient(160deg,${G.blanc} 0%,${G.creme} 100%)`, padding: "64px 24px", overflow: "hidden", position: "relative" }}>
        {/* Déco background */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `rgba(212,168,67,0.1)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `rgba(192,57,43,0.06)`, pointerEvents: "none" }} />
        <div className="landing-sections" style={{ position: "relative", zIndex: 1 }}>
          {/* Header section */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,168,67,0.15)", border: `1px solid ${G.or}`, borderRadius: 50, padding: "6px 18px", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 2 }}>{[0,1,2,3,4].map(i => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</div>
              <span style={{ color: "#555", fontSize: "0.75rem", fontWeight: 500 }}>Histoires vraies</span>
            </div>
            <h2 style={{  fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 700, color: "#111", marginBottom: 10 }}>
              Ils nous ont fait confiance
            </h2>
          </div>
          {/* Cartes témoignages */}
          <div className="testi-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {[
              {
                initiales: "OA",
                noms: "Orlane & Armel",
                lieu: "Diaspora France / Congo",
                since: "Ensemble depuis 2024",
                temoignage: "Même à distance, nous avons réussi à créer une vraie connexion. Moyo nous a donné l'espace pour nous découvrir vraiment avant de se rencontrer.",
                stars: 5,
                accent: G.rouge,
              },
              {
                initiales: "GJ",
                noms: "Grâce & Junior",
                lieu: "Brazzaville",
                since: "Mariage coutumier en préparation",
                temoignage: "On discutait simplement au début… aujourd'hui nous préparons notre mariage coutumier. Moyo nous a mis en contact avec les bonnes personnes.",
                stars: 5,
                accent: G.or,
              },
              {
                initiales: "RL",
                noms: "Ruth & Lionel",
                lieu: "Pointe-Noire",
                since: "En couple depuis 18 mois",
                temoignage: "Après plusieurs déceptions sur d'autres applis, Moyo nous a permis de construire une relation sérieuse. Ici les gens cherchent vraiment l'amour.",
                stars: 5,
                accent: G.vert,
              },
            ].map((t, i) => (
              <div key={t.noms} className="testi-card" style={{
                background: G.blanc,
                border: `1px solid ${G.gris}`,
                boxShadow: "0 4px 24px rgba(44,26,14,0.07)",
                borderRadius: 24,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Accent couleur */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: t.accent, borderRadius: "24px 0 0 24px" }} />
                {/* Guillemet décoratif */}
                <div style={{ position: "absolute", top: 16, right: 20,  fontSize: "5rem", color: "rgba(44,26,14,0.06)", lineHeight: 1, userSelect: "none" }}>"</div>
                {/* Étoiles */}
                <div style={{ display: "flex", gap: 3, marginBottom: 16, paddingLeft: 12 }}>
                  {[...Array(t.stars)].map((_, si) => (
                    <svg key={si} width="13" height="13" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}
                </div>
                {/* Texte */}
                <p style={{ fontSize: "0.92rem", color: "#555", lineHeight: 1.8, fontStyle: "italic", marginBottom: 22, paddingLeft: 12, }}>
                  "{t.temoignage}"
                </p>
                {/* Profil */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 12 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg,${G.cremeDark},${G.creme})`,
                    border: `2px solid ${t.accent}`,
                    boxShadow: `0 4px 14px rgba(44,26,14,0.12), 0 0 0 3px rgba(212,168,67,0.15)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                       fontWeight: 700,
                      fontSize: "1rem", color: "#111", letterSpacing: "0.02em",
                    }}>{t.initiales}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{t.noms}</div>
                    <div style={{ fontSize: "0.72rem", color: "#555", marginTop: 2 }}>{t.lieu}</div>
                    <div style={{ fontSize: "0.7rem", color: t.accent, fontWeight: 600, marginTop: 2 }}>{t.since}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* CTA sous les témoignages */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "#555", fontSize: "0.82rem", marginBottom: 16 }}>Rejoins des milliers de Congolais qui ont trouvé l'amour</p>
            <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 40px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 8px 28px rgba(192,57,43,0.4)", cursor: "pointer" }}>
              Créer mon profil, c'est gratuit
            </button>
          </div>
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div style={{ padding: "48px 24px", background: `linear-gradient(160deg,${G.creme},rgba(26,92,58,0.06))` }}>
        <div className="landing-sections">
          <h2 style={{  fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, textAlign: "center", marginBottom: 8, color: "#111" }}>
            Comment <span style={{ color: G.rouge }}>ça marche</span> ?
          </h2>
          <p style={{ textAlign: "center", color: "#555", fontSize: "0.88rem", marginBottom: 36 }}>3 étapes simples pour trouver l'amour</p>
          <div className="steps-layout" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { num: "1", iconBg: G.rouge, titre: "Crée ton profil", desc: "Inscris-toi gratuitement et complète ton profil.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { num: "2", iconBg: G.or, titre: "Découvre des célibataires", desc: "Parcours les profils compatibles.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { num: "3", iconBg: G.vert, titre: "Discute après un match", desc: "Échange en toute sécurité après un like mutuel.", svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            ].map((s, i) => (
              <div key={s.num} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 0", borderBottom: i < 2 ? `1px dashed ${G.gris}` : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 20px rgba(44,26,14,0.15)` }}>{s.svg}</div>
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: G.brun, display: "flex", alignItems: "center", justifyContent: "center", color: G.blanc, fontSize: "0.75rem", fontWeight: 700 }}>{s.num}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111" }}>{s.titre}</div>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL + STORES ── */}
      <div style={{ background: `linear-gradient(135deg,${G.vert},#0D2E1C)`, padding: "48px 24px", textAlign: "center" }}>
        <div className="landing-sections" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 500 }}>L'amour n'attend pas.</p>
          <h2 style={{  fontSize: "clamp(1.6rem,5vw,2.4rem)", fontWeight: 700, color: G.blanc, marginBottom: 28 }}>
            Rejoins <span style={{ color: G.or }}>Moyo</span> aujourd'hui.
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
            <button className="btn-p" onClick={() => onNav("signup")} style={{ border: "none", borderRadius: 50, padding: "15px 36px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.4)", cursor: "pointer" }}>
              Créer mon compte gratuit
            </button>
            <button className="btn-o" onClick={() => onNav("login")} style={{ border: `2px solid rgba(255,255,255,0.6)`, borderRadius: 50, padding: "13px 28px", fontWeight: 600, fontSize: "0.95rem", background: "transparent", color: G.blanc, cursor: "pointer" }}>
              Se connecter
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: 16, fontWeight: 600 }}>Bientôt disponible sur</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div className="store" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: G.blanc, borderRadius: 12, padding: "10px 18px", minWidth: 150, cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.24.99.2l11.47-11.47L12.36 9.2 3.18 23.76zm16.3-12.04L16.6 9.97l-3.23 3.23 3.23 3.23 2.9-1.74c.82-.49.82-1.28-.02-1.97zM3.02.28C2.7.46 2.5.8 2.5 1.25v21.5c0 .44.2.79.52.96l.1.06 12.05-12.05v-.28L3.12.22l-.1.06zm9.34 9.34L3.18.24l-.1.06 9.28 9.32z"/></svg>
              <div><div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Disponible sur</div><div style={{ fontSize: "0.9rem", fontWeight: 700 }}>Google Play</div></div>
            </div>
            <div className="store" style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: G.blanc, borderRadius: 12, padding: "10px 18px", minWidth: 150, cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div><div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Télécharger dans</div><div style={{ fontSize: "0.9rem", fontWeight: 700 }}>App Store</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: G.vert, padding: "28px 24px" }}>
        <div className="landing-sections" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a href={NEW_FB} target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="Facebook">{svgFb}</a>
            <a href="https://www.instagram.com/moyo_congo" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="Instagram">{svgIg}</a>
            <a href="https://www.tiktok.com/@moyo_congo" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="TikTok">{svgTk}</a>
            <a href="https://wa.me/33753356471" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#fff", opacity: 0.7, display: "flex" }} title="WhatsApp +33 07 53 35 64 71">{svgWa}</a>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "À propos", action: () => onNav("about") },
              { label: "Confidentialité & CGU", action: () => { setShowLandingMenu(true); setOpenMenuSection("confidentialite"); } },
              { label: "Mentions légales", action: () => { setShowLandingMenu(true); setOpenMenuSection("mentions"); } },
              { label: "Contact", action: () => onNav("about") },
            ].map(l => (
              <span key={l.label} onClick={l.action} style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", cursor: "pointer", transition: "color 0.2s" }}
                onMouseOver={e => { (e.target as HTMLElement).style.color = G.or; }}
                onMouseOut={e => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
              >{l.label}</span>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>6 rue Paul Valéry, 77000 Melun, France</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}


function About({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: G.creme }}>
      {/* Header vert */}
      <div style={{ background: `linear-gradient(160deg,${G.vert},#0D2E1C)`, padding: "24px 24px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(192,57,43,0.4)", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem", fontWeight: 600 }}>Retour</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", color: G.blanc, fontWeight: 700, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>Le premier site de rencontres congolais</p>
        </div>
      </div>

      <div style={{ padding: "0 20px 60px", maxWidth: 600, margin: "0 auto" }}>
        {/* Notre mission */}
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginTop: -20, boxShadow: "0 8px 32px rgba(44,26,14,0.1)", marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 10 }}>Notre mission</h2>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#555" }}>
            <strong>Moyo</strong> (qui signifie "cœur" en swahili) est le premier site de rencontres dédié aux Congolais. Notre mission est simple : créer des rencontres sincères et durables entre Congolais, qu'ils soient au pays ou dans la diaspora.
          </p>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#555", marginTop: 10 }}>
            Nous croyons que chaque Congolais mérite de trouver l'amour dans un espace sûr, respectueux et adapté à notre culture et nos valeurs.
          </p>
        </div>

        {/* Nous contacter */}
        <div style={{ background: G.blanc, borderRadius: 20, padding: "24px", marginBottom: 16, boxShadow: "0 4px 16px rgba(44,26,14,0.07)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6.06 6.06l1.09-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>Restons connectés</h2>
          <a href="https://www.facebook.com/profile.php?id=61576092648690" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#1877F2", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>Rejoins-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Facebook - Page Moyo Congo</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://www.tiktok.com/@moyo_congo" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#111111", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", fontWeight: 500 }}>Suis-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>TikTok - MOYO Congo</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://www.instagram.com/moyo_congo" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem", fontWeight: 500 }}>Retrouve-nous sur</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>Instagram - MOYO Congo</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://wa.me/33753356471" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#25D366", borderRadius: 14, marginBottom: 10, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>WhatsApp / Téléphone</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>+33 07 53 35 64 71</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="mailto:contact@moyo-congo.com"
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 14, textDecoration: "none" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", fontWeight: 500 }}>Email</div>
              <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>contact@moyo-congo.com</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        <div style={{ textAlign: "center", color: "#555" }}>
          <p style={{ fontSize: "0.75rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
          <p style={{ fontSize: "0.72rem", marginTop: 4, color: "#555" }}>
            <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#555", textDecoration: "underline" }}>Confidentialité & CGU</a>
            {" · "}
            <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#555", textDecoration: "underline" }}>Mentions légales</a>
            {" · "}
            <span onClick={() => onBack()} style={{ cursor: "pointer", textDecoration: "underline" }}>Contact</span>
          </p>
        </div>
      </div>

    </div>
  );
}

function AuthLayout({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(160deg,${G.creme},${G.cremeDark})`, padding: 0, overflowX: "hidden" }}>
    <div onClick={onBack} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(192,57,43,0.35)", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </div>
      <span style={{ color: "#555", fontWeight: 600, fontSize: "0.9rem" }}>Accueil</span>
    </div>
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px 40px" }}><div style={{ background: G.blanc, borderRadius: 24, padding: "36px 24px", width: "100%", maxWidth: 420, boxShadow: "0 20px 70px rgba(44,26,14,0.12)", overflowX: "hidden" }}>{children}</div></div>
  </div>;
}

function Login({ onNav, onAuth }: { onNav: (p: string) => void; onAuth: (a: Auth) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await sb.signIn(form.email.trim(), form.password);
      if (res.error) {
        setErrorMsg("Adresse e-mail ou mot de passe incorrect. Veuillez vérifier vos informations et réessayer.");
        setLoading(false); return;
      }
      const profiles = await sb.query<Profile>(res.access_token, "profiles", `?id=eq.${res.user.id}`);
      if (!profiles[0]) {
        setErrorMsg("Profil introuvable. Réessaie dans quelques secondes.");
        setLoading(false); return;
      }
      if ((profiles[0] as any).is_banned) {
        await sb.signOut(res.access_token);
        setErrorMsg("Ton compte a été suspendu suite à une violation des conditions d'utilisation de Moyo. Pour toute réclamation, contacte-nous à contact@moyo-congo.com");
        setLoading(false); return;
      }
      onAuth({
        token: res.access_token,
        userId: res.user.id,
        name: profiles[0].name || "Utilisateur",
        email: res.user.email || "",
        isPremium: profiles[0].is_premium || false,
        isAdmin: profiles[0].is_admin || false,
        // ── SESSION v2 : persist refresh_token + expiration ──
        refreshToken: res.refresh_token || undefined,
        expiresAt: res.expires_in ? Date.now() + res.expires_in * 1000 : undefined,
      });
    } catch { setErrorMsg("Erreur de connexion. Veuillez vérifier votre adresse e-mail ou votre mot de passe."); }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!forgotEmail) { setErrorMsg("Entre ton email."); return; }
    await sb.resetPassword(forgotEmail.trim());
    setForgotSent(true);
  };

  if (showForgot) return <AuthLayout onBack={() => onNav("landing")}><ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}<div style={{ textAlign: "center", marginBottom: 24 }}><div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div><h2 style={{  fontSize: "1.4rem", fontWeight: 700, marginTop: 8 }}>Mot de passe oublié</h2></div>{forgotSent ? <div style={{ textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><p style={{ color: "#555", fontSize: "0.88rem", marginBottom: 20 }}>Email envoyé ! Vérifie ta boîte mail.</p><Btn variant="ghost" onClick={() => { setShowForgot(false); setForgotSent(false); }}>← Retour à la connexion</Btn></div> : <><Input label="Ton email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="ton@email.com" icon="email" /><Btn variant="primary" onClick={handleForgot} style={{ width: "100%", marginBottom: 12 }}>Envoyer le lien</Btn><div style={{ textAlign: "center" }}><span onClick={() => setShowForgot(false)} style={{ fontSize: "0.85rem", color: "#555", cursor: "pointer" }}>← Retour</span></div></>}</AuthLayout>;

  return <AuthLayout onBack={() => onNav("landing")}><ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}<div style={{ textAlign: "center", marginBottom: 28 }}><div style={{  fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div><h2 style={{  fontSize: "1.6rem", fontWeight: 700, marginTop: 6 }}>Bon retour !</h2><p style={{ color: "#555", fontSize: "0.85rem", marginTop: 4 }}>Retrouve tes matchs</p></div><Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ton@email.com" icon="email" /><Input label="Mot de passe" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" icon="lock" /><div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}><span onClick={() => setShowForgot(true)} style={{ fontSize: "0.82rem", color: G.rouge, cursor: "pointer", fontWeight: 500 }}>Mot de passe oublié ?</span></div><Btn variant="primary" onClick={handleLogin} loading={loading} style={{ width: "100%" }} disabled={!form.email || !form.password}>Se connecter →</Btn><p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#555" }}>Pas encore de compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("signup")}>S'inscrire</span></p></AuthLayout>;
}

function SignUp({ onNav }: { onNav: (p: string) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "", name: "", age: "", city: "", gender: "", bio: "", religion: "" });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cropSrcSignup, setCropSrcSignup] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Étape 1 → vérifier email et créer le compte, puis passer à l'étape 2 (photo)
  const checkEmailAndContinue = async () => {
    if (!form.email || form.password.length < 6) return;

    const emailClean = form.email.trim().toLowerCase();

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(emailClean)) {
      setErrorMsg("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    // Bloquer les domaines jetables
    const BLOCKED_DOMAINS = [
      "guerrillamail.com","guerrillamail.net","guerrillamail.org","guerrillamail.biz","guerrillamail.de","guerrillamail.info",
      "tempmail.com","temp-mail.org","tempmail.net","tempmail.io","temp-mail.io","tempr.email",
      "mailinator.com","maildrop.cc","mailnull.com","mailnesia.com","mailnull.com",
      "yopmail.com","yopmail.fr","cool.fr.nf","jetable.fr.nf","nospam.ze.tc",
      "throwam.com","throwam.net","throwaway.email","dispostable.com","disposablemail.com",
      "spamgourmet.com","spamgourmet.net","spamgourmet.org","spamgourmet.com",
      "trashmail.com","trashmail.at","trashmail.io","trashmail.me","trashmail.net",
      "fakeinbox.com","fakeinbox.net","fakemail.fr","fakemail.net","filzmail.com",
      "getnada.com","getairmail.com","getairmail.net","givmail.com","grr.la",
      "10minutemail.com","10minutemail.net","10minutemail.org","10mail.org",
      "20minutemail.com","20minutemail.it","tempemail.net","tempemail.org",
      "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
      "spam4.me","spamfree24.org","spamgob.com","spamherelots.com",
      "maildrop.cc","mailexpire.com","mailfall.com","mailfreeonline.com",
      "mohmal.com","mt2009.com","mt2014.com","mytrashmail.com",
      "nwldx.com","objectmail.com","obobbo.com","odnorazovoe.ru",
      "proxymail.eu","rcpt.at","recode.me","recursor.net",
      "s0ny.net","safe-mail.net","safetymail.info","safetypost.de",
      "sendspamhere.com","sharedmailbox.org","sharklasers.com",
      "spamavert.com","spambox.info","spambox.irishspringrealty.com",
      "spamcannon.com","spamcannon.net","spamcero.com","spamcon.org",
      "sogetthis.com","soodonims.com","stop-my-spam.com",
      "supergreatmail.com","supermailer.jp","superrito.com","superstachel.de",
      "suremail.info","tempalias.com","tempinbox.co.uk","tempinbox.com",
      "throwam.com","throwam.net","thinltd.com","thrott.com",
      "trbvm.com","trommlergroup.com","trshmail.com","ttirv.net",
      "turual.com","uggsrock.com","uroid.com","veryrealemail.com",
      "vidchart.com","viditag.com","viewcastmedia.com","viewcastmedia.net",
      "wegwerfmail.de","wegwerfmail.net","wegwerfmail.org",
      "wh4f.org","whyspam.me","willhackforfood.biz","willselfdestruct.com",
      "wronghead.com","wuzupmail.net","xagloo.com","xemaps.com",
      "xents.com","xmaily.com","xoxy.net","yepmail.net","yomail.info",
      "yuurok.com","z1p.biz","za.com","zehnminutenmail.de","zetmail.com",
      "zippymail.info","zoemail.com","zoemail.net","zoemail.org","zomg.info"
    ];

    const domain = emailClean.split("@")[1];
    if (BLOCKED_DOMAINS.includes(domain)) {
      setErrorMsg("Les adresses e-mail temporaires ne sont pas acceptées. Veuillez utiliser une vraie adresse e-mail.");
      return;
    }

    setLoading(true);
    try {
      const existing = await sb.query<Profile>(SUPABASE_KEY, "profiles", `?email=eq.${encodeURIComponent(emailClean)}&select=id`);
      if (existing.length > 0) { setErrorMsg("Cette adresse e-mail est déjà utilisée. Connectez-vous plutôt."); setLoading(false); return; }

      // Créer le compte dès l'étape 1
      const authRes = await sb.signUp(emailClean, form.password, { name: "...", age: "18", city: "Brazzaville", gender: "Homme", bio: "", religion: "", photo_url: null });
      if (authRes?.error) {
        const code = authRes.error.message || "";
        let msg = "Impossible de créer le compte.";
        if (code.includes("already registered")) msg = "Email déjà utilisé.";
        else if (code.includes("password")) msg = "Mot de passe trop court (6 caractères minimum).";
        setErrorMsg(msg); setLoading(false); return;
      }
      if (authRes.user?.identities?.length === 0) { setErrorMsg("Email déjà utilisé."); setLoading(false); return; }

      // Se connecter immédiatement pour avoir le vrai token
      const loginRes = await sb.signIn(emailClean, form.password);
      if (loginRes?.access_token) {
        setTempToken(loginRes.access_token);
        setTempUserId(loginRes.user?.id || authRes.user?.id || "");
      }
      setStep(2);
    } catch { setStep(2); }
    setLoading(false);
  };

  // Étape 2 → upload photo en arrière-plan pendant que l'utilisateur remplit l'étape 3
  const handlePhotoAndContinue = async () => {
    if (!photoFile || !tempToken || !tempUserId) { setStep(3); return; }
    setUploadingPhoto(true);
    try {
      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${tempUserId}/avatar.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tempToken}`, "Content-Type": photoFile.type || "image/jpeg", "x-upsert": "true" },
        body: photoFile,
      });
      if (uploadRes.ok) {
        setPhotoUrl(`${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`);
      }
    } catch {}
    setUploadingPhoto(false);
    setStep(3);
  };

  // Étape 3 → finaliser le profil
  const handleSubmit = async () => {
    setLoading(true);
    const ageNum = parseInt(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      setErrorMsg("Vous devez avoir au moins 18 ans."); setLoading(false); return;
    }
    if (!tempToken || !tempUserId) { setErrorMsg("Erreur de session. Recommencez."); setLoading(false); return; }
    try {
      // Mettre à jour le profil avec toutes les infos + photo
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${tempUserId}`, {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${tempToken}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          name: form.name.trim(),
          age: parseInt(form.age),
          city: form.city,
          gender: form.gender,
          bio: form.bio.trim(),
          religion: form.religion,
          photo_url: photoUrl,
          is_complete: true,
        }),
      });
      setLoading(false);
      setSuccessMsg("Compte créé avec succès !");
      setTimeout(() => { onNav("login"); }, 2500);
    } catch {
      setErrorMsg("Erreur technique. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={() => step === 1 ? onNav("landing") : setStep(s => s - 1)}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {successMsg && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}><div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(26,92,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A5C3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111", marginBottom: 10 }}>COMPTE CRÉÉ !</h3><p style={{ fontSize: "0.92rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>Veuillez maintenant vous connecter.</p><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.78rem", color: "#aaa" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: G.rouge }} />Redirection...</div></div></div>}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: "2rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 6 }}>Crée ton compte</h2>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, background: "rgba(192,57,43,0.08)", border: `1.5px solid rgba(192,57,43,0.2)`, borderRadius: 50, padding: "6px 16px" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: G.blanc }}>{step}</div>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: G.rouge }}>
            {step === 1 && "Identifiant et mot de passe"}
            {step === 2 && "Photo de profil"}
            {step === 3 && "Informations personnelles"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#555", fontWeight: 500 }}>{step}/3</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? G.rouge : G.gris, transition: "background 0.3s" }} />
        ))}
      </div>

      {/* ÉTAPE 1 - Email + mot de passe */}
      {step === 1 && <>
        <Input label="Email" type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="ton@email.com" icon="email" />
        <Input label="Veuillez définir votre mot de passe" type="password" value={form.password} onChange={e => upd("password", e.target.value)} placeholder="Minimum 6 caractères" icon="lock" hint="Au moins 6 caractères" />
        <Btn variant="primary" onClick={checkEmailAndContinue} loading={loading} style={{ width: "100%", marginTop: 8 }} disabled={!form.email || form.password.length < 6}>Continuer →</Btn>
      </>}

      {/* ÉTAPE 2 - Photo */}
      {step === 2 && <>
        {/* CropModal pour l'inscription */}
        {cropSrcSignup && (
          <CropModal
            src={cropSrcSignup}
            onConfirm={(blob) => {
              setCropSrcSignup(null);
              const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
              setPhotoFile(croppedFile);
              setPhotoPreview(URL.createObjectURL(blob));
              if (fileRef.current) fileRef.current.value = "";
            }}
            onCancel={() => { setCropSrcSignup(null); if (fileRef.current) fileRef.current.value = ""; }}
          />
        )}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: 24, lineHeight: 1.6 }}>
            Ajoute une photo pour que les autres puissent te reconnaître 😊
          </p>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setCropSrcSignup(reader.result as string);
            reader.readAsDataURL(file);
          }} style={{ display: "none" }} />
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 16px" }} onClick={() => fileRef.current?.click()}>
            {photoPreview ? (
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${G.rouge}`, cursor: "pointer" }}>
                <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(192,57,43,0.4)", cursor: "pointer" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.rouge}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: G.rouge, fontWeight: 900, lineHeight: 1, pointerEvents: "none" }}>+</div>
          </div>
          {photoPreview
            ? <div onClick={() => fileRef.current?.click()} style={{ fontSize: "0.82rem", color: G.rouge, cursor: "pointer", fontWeight: 600 }}>Changer la photo</div>
            : <p style={{ fontSize: "0.78rem", color: "#e74c3c", fontWeight: 600, marginTop: 4 }}>Une photo est obligatoire</p>
          }
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Retour</Btn>
          <Btn variant="primary" onClick={handlePhotoAndContinue} loading={uploadingPhoto} style={{ flex: 2 }} disabled={!photoPreview}>
            {uploadingPhoto ? "Upload en cours..." : "Continuer →"}
          </Btn>
        </div>
      </>}

      {/* ÉTAPE 3 - Infos personnelles */}
      {step === 3 && <>
        {photoPreview && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(26,92,58,0.06)", borderRadius: 12, padding: "8px 14px", marginBottom: 16 }}>
            <img src={photoPreview} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ fontSize: "0.78rem", color: "#1A5C3A", fontWeight: 600 }}>
              {photoUrl ? "✓ Photo uploadée avec succès" : "Photo en cours d'upload..."}
            </div>
          </div>
        )}
        <Input label="Prénom" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Ex: Faïda" icon="user" />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Je suis</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["Homme", "Femme"].map(g => (
              <div key={g} onClick={() => upd("gender", g)} style={{ flex: 1, padding: "12px", borderRadius: 12, textAlign: "center", cursor: "pointer", border: `2px solid ${form.gender === g ? G.rouge : G.gris}`, background: form.gender === g ? "rgba(192,57,43,0.06)" : G.blanc, fontWeight: 600, fontSize: "0.88rem" }}>
                {g === "Homme" ? "👨🏿 Homme" : "👩🏿 Femme"}
              </div>
            ))}
          </div>
        </div>
        <Input label="Âge" type="number" value={form.age} onChange={e => { const v = e.target.value.slice(0,2); upd("age", v); }} placeholder="Ex: 25" icon="cake" hint="Entre 18 et 99 ans" error={form.age && parseInt(form.age) < 18 ? "Vous devez avoir au moins 18 ans." : undefined} />
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Ville</label>
          <select value={form.city} onChange={e => upd("city", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none" }}>
            <option value="">Sélectionne ta ville</option>
            {VILLES.map(c => c.startsWith("──") ? <option key={c} disabled>{c}</option> : <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Religion <span style={{ color: G.rouge, fontSize: "0.8rem", fontWeight: 600 }}>(fortement recommandé)</span></label>
          <select value={form.religion} onChange={e => upd("religion", e.target.value)} style={{ width: "100%", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none" }}>
            <option value="">Sélectionne ta religion</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Bio (optionnel)</label>
          <textarea value={form.bio} onChange={e => upd("bio", e.target.value.slice(0, 160))} placeholder="Parle un peu de toi..." rows={3} maxLength={160} style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, fontSize: "0.93rem", background: G.blanc, color: "#111", outline: "none", resize: "none" }} />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: form.bio.length >= 150 ? G.rouge : "#aaa", marginTop: 4 }}>{form.bio.length}/160</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>← Retour</Btn>
          <Btn variant="primary" onClick={handleSubmit} loading={loading} style={{ flex: 2 }} disabled={!form.name || !form.gender || !form.age || parseInt(form.age) < 18 || parseInt(form.age) > 99 || !form.city}>Créer mon compte</Btn>
        </div>
      </>}

      <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#555" }}>
        Déjà un compte ? <span style={{ color: G.rouge, cursor: "pointer", fontWeight: 600 }} onClick={() => onNav("login")}>Se connecter</span>
      </p>
      <p style={{ textAlign: "center", marginTop: 14, fontSize: "0.7rem", color: "#aaa", lineHeight: 1.6, padding: "0 12px" }}>
        En continuant, vous acceptez nos{" "}
        <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>Conditions d'utilisation</a>
        {" "}et confirmez avoir lu notre{" "}
        <a href="https://www.moyo-congo.com/#confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "underline" }}>Politique de confidentialité</a>.
      </p>
    </AuthLayout>
  );
}


// ── FAQ pour le bot ──
const BOT_FAQ = [
  { q: ["premium", "abonnement", "payer", "prix", "coût", "momo", "airtel"], r: "Le Premium coûte 3 500 FCFA/mois. Il donne accès aux likes illimités, messages illimités, voir qui vous a liké et visité, envoi de photos et bien plus. Paiement via MTN MoMo ou Airtel MoMo. Activation sous 24h." },
  { q: ["match", "matcher", "matchs"], r: "Un match se crée automatiquement quand deux personnes se likent mutuellement. Depuis l'onglet Matchs, appuyez sur les 3 traits pour envoyer un message, voir le profil, bloquer ou annuler le match." },
  { q: ["like", "liker", "coeur", "j'ai pas", "limite"], r: "Compte gratuit : 5 likes par jour. Premium : likes illimités. Si vous avez unliké quelqu'un, le like disparaît des deux côtés instantanément." },
  { q: ["message", "envoyer", "écrire", "conversation"], r: "Compte gratuit : 3 messages par match. Premium : messages illimités. Vous devez avoir un match pour envoyer un message." },
  { q: ["réaction", "réagir", "emoji", "like message"], r: "Appuyez longuement sur un message pour ouvrir le menu de réactions. Une seule réaction par message est autorisée : choisir une nouvelle réaction remplace automatiquement l'ancienne." },
  { q: ["insulte", "bloqué", "interdit", "avertissement", "modération"], r: "Moyo bloque automatiquement les insultes, menaces, arnaques et contenus inappropriés. Un avertissement s'affiche et un signalement est transmis à notre équipe. Les comportements répétés entraînent la suppression du compte." },
  { q: ["photo", "image", "profil", "modifier"], r: "Allez dans l'onglet Profil → Modifier ma photo. Un outil de recadrage s'ouvre pour cadrer votre photo parfaitement." },
  { q: ["visible", "invisible", "disparaître", "cacher"], r: "Dans Profil, activez le bouton Profil invisible. Vous disparaissez de Découvrir sans supprimer votre compte." },
  { q: ["badge", "vérifié", "vérification", "bleu"], r: "La vérification est gratuite. Allez dans Profil → Faire vérifier mon compte → WhatsApp. Réponse sous 24h." },
  { q: ["bloquer", "signaler", "harcèlement", "problème"], r: "Appuyez sur les 3 traits d'un profil → Bloquer ou Signaler. Les profils bloqués sont gérables depuis votre Liste noire dans le Profil." },
  { q: ["supprimer", "compte", "désinscrire"], r: "Dans Profil → Supprimer mon compte. Cette action est définitive et irréversible." },
  { q: ["inscription", "créer", "inscrire", "rejoindre"], r: "L'inscription est gratuite. Cliquez sur Créer mon compte gratuit, renseignez votre email et mot de passe, ajoutez une photo et complétez votre profil." },
  { q: ["vus", "visiteurs", "qui a vu"], r: "L'onglet Vus affiche le nombre de personnes qui ont visité votre profil. Le compteur est visible pour tous. Premium requis pour voir l'identité des visiteurs. Seuls les membres Premium génèrent des vues." },
  { q: ["sombre", "thème", "dark", "nuit"], r: "Dans Profil, utilisez le bouton Mode clair/sombre pour basculer entre les deux thèmes." },
  { q: ["annuler", "unmatch", "fin"], r: "Dans Matchs → 3 traits → Annuler le match. La conversation et les messages sont supprimés. L'autre personne n'est pas notifiée." },
];

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const entry of BOT_FAQ) {
    if (entry.q.some(k => lower.includes(k))) return entry.r;
  }
  return "Je n'ai pas trouvé de réponse précise à ta question. Tu peux contacter notre équipe sur WhatsApp au +33 07 53 35 64 71 ou via notre page Facebook.";
}

function BotWidget({ onClose, auth }: { onClose: () => void; auth: Auth }) {
  const [mode, setMode] = useState<"home" | "chat" | "report">("home");
  const [msgs, setMsgs] = useState<{ from: "bot" | "user"; text: string }[]>([
    { from: "bot", text: `Bonjour ${auth.name || ""} ! Je suis l'assistant Moyo. Comment puis-je t'aider ?` }
  ]);
  const [input, setInput] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const sendMsg = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(prev => [...prev, { from: "user", text: userMsg }]);
    setTimeout(() => {
      setMsgs(prev => [...prev, { from: "bot", text: getBotResponse(userMsg) }]);
    }, 600);
  };

  const sendReport = async () => {
    if (!reportText.trim()) return;
    // ── Alerte bot : ce n'est PAS un signalement contre un profil précis.
    // reported_id = null (alerte système, pas d'utilisateur ciblé).
    console.log(`[Moyo][BotReport] Signalement bot — auteur:${auth.userId}`);
    try {
      await sb.insert(auth.token, "reports", {
        reporter_id: auth.userId,
        reported_id: null,
        reason: `[BOT SIGNALEMENT] ${reportText.trim()}`,
        status: "pending",
      });
      console.log("[Moyo][BotReport] ✅ Signalement bot enregistré");
    } catch (e: any) {
      // Si reported_id n'accepte pas null → log sans crasher
      console.warn("[Moyo][BotReport] ⚠️ Signalement bot non enregistré :", e?.message || e);
    }
    setReportSent(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
              <path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/>
              <circle cx="9" cy="11" r="1" fill="white" stroke="none"/>
              <circle cx="15" cy="11" r="1" fill="white" stroke="none"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.92rem", color: G.blanc }}>Assistant Moyo</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.75)" }}>Répond instantanément</div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", opacity: 0.7 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>

        {/* Home */}
        {mode === "home" && (
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 4 }}>Que puis-je faire pour toi ?</p>
            <div onClick={() => setMode("chat")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "#F8F8F8", borderRadius: 14, cursor: "pointer", border: `1px solid ${G.gris}` }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a1a" }}>Besoin d'aide</div>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Pose ta question, je réponds instantanément</div>
              </div>
            </div>
            <div onClick={() => setMode("report")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "#F8F8F8", borderRadius: 14, cursor: "pointer", border: `1px solid ${G.gris}` }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a1a" }}>Signaler un problème</div>
                <div style={{ fontSize: "0.75rem", color: "#888" }}>Comportement abusif, arnaque, harcèlement</div>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        {mode === "chat" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.from === "user" ? G.vert : "#F2F2F2", color: m.from === "user" ? G.blanc : "#1a1a1a", fontSize: "0.83rem", lineHeight: 1.5 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${G.gris}`, display: "flex", gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Pose ta question..." style={{ flex: 1, padding: "10px 14px", borderRadius: 50, border: `1px solid ${G.gris}`, fontSize: "0.85rem", outline: "none" }} />
              <div onClick={sendMsg} style={{ width: 40, height: 40, borderRadius: "50%", background: G.vert, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </>
        )}

        {/* Report */}
        {mode === "report" && (
          <div style={{ padding: "20px 16px" }}>
            {reportSent ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(26,92,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>Signalement envoyé</div>
                <div style={{ fontSize: "0.82rem", color: "#555" }}>Notre équipe traite votre signalement sous 24h.</div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: 14 }}>Décris le problème rencontré. Notre équipe intervient sous 24h.</p>
                <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="Ex: un utilisateur m'a envoyé des messages harcelants..." style={{ width: "100%", minHeight: 100, padding: "12px", borderRadius: 12, border: `1px solid ${G.gris}`, fontSize: "0.85rem", resize: "none", outline: "none", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setMode("home")} style={{ flex: 1 }}>Retour</Btn>
                  <Btn variant="danger" onClick={sendReport} style={{ flex: 2 }} disabled={!reportText.trim()}>Envoyer le signalement</Btn>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppShell({ children, tab, setTab, unreadCount, notifCount, likesReceived, viewsReceived, auth }: { children: React.ReactNode; tab: string; setTab: (t: string) => void; unreadCount: number; notifCount: number; likesReceived: number; viewsReceived: number; auth: Auth; }) {
  const [showGuide, setShowGuide] = useState(false);
  const [openGuideSection, setOpenGuideSection] = useState<number | null>(null);
  const [showBot, setShowBot] = useState(false);

  const tabs = [
    {
      id: "discover",
      label: "Découvrir",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      id: "likes",
      label: "Likes",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      id: "visitors",
      label: "Vus",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3" fill={active ? G.rouge : "none"}/>
        </svg>
      ),
    },
    {
      id: "matches",
      label: "Matchs",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none"/>
          <circle cx="9" cy="7" r="4" fill="none"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      id: "messages",
      label: "Messages",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? G.rouge : "none"} stroke={active ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4" fill={active ? G.rouge : "none"}/>
        </svg>
      ),
    },
  ];

  return <div style={{ maxWidth: 500, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: G.creme, boxShadow: "0 0 60px rgba(44,26,14,0.12)" }}>
    <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: G.blanc, borderBottom: `1px solid ${G.gris}`, position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, zIndex: 100, boxSizing: "border-box" }}>
      <div style={{ marginLeft: 4, fontSize: "1.6rem", color: G.rouge, fontWeight: 700 }}><span>Mo</span><span style={{ color: G.or }}>yo</span></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginRight: 4 }}>
        {auth.isAdmin && <div onClick={() => setTab("admin")} style={{ background: G.rouge, color: G.blanc, borderRadius: 50, padding: "5px 12px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>⚙️ Admin</div>}
        <div onClick={() => setShowGuide(true)} style={{ fontSize: "0.75rem", fontWeight: 700, color: G.blanc, background: G.rouge, borderRadius: 50, padding: "6px 14px", cursor: "pointer", letterSpacing: "0.02em" }}>Guide</div>
        <div onClick={() => setShowBot(true)} style={{ width: 32, height: 32, borderRadius: "50%", background: G.vert, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(26,92,58,0.35)", flexShrink: 0 }} title="Assistant Moyo">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
            <path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/>
            <line x1="8" y1="21" x2="8" y2="19"/>
            <line x1="16" y1="21" x2="16" y2="19"/>
            <circle cx="9" cy="11" r="1" fill="white"/>
            <circle cx="15" cy="11" r="1" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 75, paddingTop: 48 }}>{children}</div>

    {/* Bot Widget */}
    {showBot && <BotWidget onClose={() => setShowBot(false)} auth={auth} />}

    {/* ── NAVBAR BAS STYLE TINDER (6 onglets) ── */}
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, background: G.blanc, borderTop: `1px solid #eee`, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "6px 4px 14px", zIndex: 50 }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <div key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative", flex: 1 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "5px 8px", borderRadius: 12,
              background: active ? "rgba(192,57,43,0.1)" : "transparent",
              transition: "background 0.2s",
              minWidth: 48,
            }}>
              <div style={{ position: "relative" }}>
                {t.icon(active)}
                {/* Badge messages */}
                {t.id === "messages" && unreadCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
                {/* Badge likes reçus */}
                {t.id === "likes" && likesReceived > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {likesReceived > 9 ? "9+" : likesReceived}
                  </div>
                )}
                {/* Badge visiteurs */}
                {t.id === "visitors" && viewsReceived > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.or, color: "#111", borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {viewsReceived > 9 ? "9+" : viewsReceived}
                  </div>
                )}
                {/* Badge matchs */}
                {t.id === "matches" && notifCount > 0 && (
                  <div style={{ position: "absolute", top: -4, right: -6, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.48rem", fontWeight: 700 }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "0.56rem", fontWeight: 700, color: active ? G.rouge : "#bbb", whiteSpace: "nowrap" }}>
                {t.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    {showGuide && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "20px 12px" }}>
      <div style={{ background: G.blanc, borderRadius: 20, width: "100%", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "24px 20px", position: "relative" }}>
          <div onClick={() => setShowGuide(false)} style={{ position: "absolute", top: 14, right: 16, cursor: "pointer", opacity: 0.8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div style={{ fontSize: "1.6rem", color: G.blanc, fontWeight: 800 }}>Guide <span style={{ color: G.or }}>Moyo</span></div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", marginTop: 4 }}>Tout ce que vous devez savoir</div>
        </div>
        {/* Accordéon */}
        <div style={{ padding: "8px 0" }}>
          {[
            { title: "Découvrir des profils", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, items: ["L'onglet Découvrir affiche les profils en mode carte ou en liste. En vue carte, utilisez les flèches pour naviguer et le cœur pour liker.", "Chaque profil affiche un badge Femme ou Homme pour identifier clairement le genre.", "Compte gratuit : 5 likes par jour. Premium : likes illimités. Filtres disponibles : genre, ville, âge (18-99), religion.", "Moyo est réservé aux rencontres hétérosexuelles uniquement.", "Seuls les membres Premium génèrent des vues sur les profils qu'ils consultent. Les non-premium peuvent naviguer sans laisser de trace."] },
            { title: "Matchs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, items: ["Un match se crée automatiquement quand deux personnes se likent mutuellement.", "Sur chaque match, appuyez sur les 3 traits pour accéder aux options : Voir le profil, Envoyer un message, Bloquer ou Annuler le match.", "Annuler un match supprime la conversation, les likes mutuels et les vues. Comme si vous ne vous étiez jamais matchés.", "Avec Premium, vous pouvez voir exactement qui vous a liké et qui a visité votre profil."] },
            { title: "Messages", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, items: ["Compte gratuit : 3 messages par match. Premium : messages illimités. Chaque conversation affiche son propre badge de messages non lus.", "Chaque message affiche l'heure d'envoi. Avec Premium : coches grises = reçu, coches bleues = lu.", "Un point vert indique que la personne est en ligne. Premium : envoi de photos, offrir Premium via le bouton cadeau.", "Appuyez sur la photo de profil de votre match en haut de la conversation pour voir sa fiche complète.", "Moyo encourage les échanges respectueux et bienveillants. Les mots doux, les compliments sincères et le respect mutuel sont au cœur de notre communauté."] },
            { title: "Mon Profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, items: ["Modifiez votre photo, prénom, âge, ville, religion et bio via l'engrenage. Le bouton visible/invisible permet de disparaître de Découvrir.", "Lors de l'upload de photo, un outil de recadrage s'ouvre : glissez pour repositionner et zoomez pour ajuster. Le rectangle montre la zone visible sur les cartes, le cercle doré montre l'avatar rond.", "Utilisez Voir mon profil pour voir exactement comment les autres vous voient (mode carte et liste).", "Demandez la vérification de votre compte pour obtenir le badge bleu. Gratuit, vérification sous 24h via WhatsApp."] },
            { title: "Bloquer et Signaler", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, items: ["Appuyez sur les 3 traits d'un profil pour accéder aux options. Bloquer fait disparaître le profil définitivement. Signaler envoie un rapport à notre équipe sous 24h.", "Les profils bloqués sont gérables depuis votre Liste noire dans le Profil.", "Moyo dispose d'une modération automatique : les insultes, arnaques et contenus inappropriés sont détectés et bloqués avant envoi. Tout incident est signalé automatiquement à l'équipe."] },
            { title: "Premium - 3 500 FCFA / mois", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, items: ["Avantages : messages illimités, likes illimités, envoi de photos, confirmations de lecture, voir qui vous a liké et visité votre profil, offrir Premium à un match.", "Paiement via MTN MoMo ou Airtel MoMo uniquement. Activation sous 24h. Vous pouvez aussi offrir le Premium à quelqu'un depuis une conversation."] },
            { title: "Likes & Visiteurs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, items: ["Deux onglets séparés dans la barre de navigation : Likes (coeur) et Vus (oeil). Les badges se mettent à jour instantanément.", "En Premium, tu vois les cartes complètes des personnes qui t'ont liké ou visité. Tu peux retirer une carte sans affecter les matchs ni les messages.", "Important : seuls les membres Premium génèrent des vues. Un membre gratuit qui consulte ton profil n'apparaît pas dans tes Vus.", "Si tu unlikes un profil, ton like disparait aussi de sa liste à lui instantanément.", "Vue carte ou liste disponible via le bouton en haut à droite."] },
      { title: "Inviter un ami", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, items: ["Dans Profil, appuyez sur Inviter un ami. Un message pré-rempli s'ouvre via WhatsApp ou le partage natif de votre téléphone.", "Le lien pointe directement vers moyo-congo.com pour que votre ami puisse s'inscrire facilement."] },
      { title: "Mode sombre", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>, items: ["Dans Profil, utilisez le bouton Mode clair/sombre pour basculer entre les deux thèmes. Votre choix est mémorisé automatiquement.", "Le mode sombre s'applique à toutes les pages sauf la page d'accueil."] },
      { title: "Sécurité et confidentialité", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, items: ["Moyo est réservé aux personnes majeures de 18 ans et plus.", "La modération automatique bloque les insultes, menaces, arnaques et contenus inappropriés avant envoi. Un avertissement s'affiche et un signalement automatique est transmis à notre équipe.", "Pour supprimer votre compte, rendez-vous dans Profil puis Supprimer mon compte. Cette action est définitive et irréversible."] },
      { title: "Assistant Moyo", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><path d="M5 14v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4"/></svg>, items: ["L'icône verte en forme de robot à côté du bouton Guide ouvre l'Assistant Moyo.", "Il propose deux options : Besoin d'aide (répond instantanément à vos questions sur l'app) et Signaler un problème (comportement abusif, arnaque, harcèlement).", "Les signalements sont traités par notre équipe sous 24h."] },
          ].map((s, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${G.gris}` }}>
              <div onClick={() => setOpenGuideSection(openGuideSection === i ? null : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: openGuideSection === i ? "rgba(192,57,43,0.03)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: openGuideSection === i ? G.rouge : G.gris, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: openGuideSection === i ? G.blanc : "#555" }}>
                    {s.icon}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "0.92rem", color: openGuideSection === i ? G.rouge : G.brun }}>{s.title}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={openGuideSection === i ? G.rouge : "#bbb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: openGuideSection === i ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {openGuideSection === i && (
                <div style={{ padding: "4px 20px 16px" }}>
                  {s.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: j < s.items.length - 1 ? `1px solid ${G.gris}` : "none" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: G.rouge, flexShrink: 0, marginTop: 6 }} />
                      <p style={{ fontSize: "0.83rem", color: "#555", lineHeight: 1.6, margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {/* Contact */}
          <div style={{ background: "#f8f8f8", borderRadius: 14, padding: "16px", textAlign: "center", margin: "12px 16px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1a1a", marginBottom: 4 }}>Un problème ou une question ?</div>
            <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: 14, lineHeight: 1.5 }}>Notre équipe est disponible pour vous aider.</p>
            <a href="https://www.facebook.com/share/1HssYavG19/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: G.rouge, color: G.blanc, borderRadius: 50, padding: "10px 24px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>Contacter notre équipe</a>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

function ProfileListCard({ prof, liked, onLike, onBlock, onReport, onView, isPremium }: { prof: Profile; liked: boolean; onLike: () => void; onBlock: () => void; onReport: (r: string) => void; onView?: () => void; isPremium?: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSignalerMenu, setShowSignalerMenu] = useState(false);
  return (
    <div className="profile-card" style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc, borderRadius: 16, padding: "12px", marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
      <div style={{ width: 62, height: 62, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)" }}>
        {prof.photo_url
          ? <img src={prof.photo_url} alt={prof.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 5 }}>{prof.name}, {prof.age} ans {prof.is_premium && <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4A843" stroke="none" style={{display:"inline",verticalAlign:"middle",marginLeft:3}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} {prof.is_verified && <VerifiedBadge size={15} />}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
          <span style={{ background: prof.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: prof.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "1px 8px", fontSize: "0.68rem", fontWeight: 600 }}>{prof.gender === "Femme" ? "Femme" : "Homme"}</span>
          <span style={{ fontSize: "0.78rem", color: "#555" }}>{prof.city}</span>
          {prof.religion && <span style={{ fontSize: "0.72rem", color: "#555" }}>· {prof.religion}</span>}
        </div>
        {prof.bio && <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prof.bio}</div>}
      </div>
      {/* Cœur */}
      <div className="icon-btn" onClick={onLike} style={{ width: 42, height: 42, borderRadius: "50%", background: liked ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : "rgba(192,57,43,0.06)", border: liked ? "none" : `1.5px solid rgba(192,57,43,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "white" : "rgba(192,57,43,0.4)"} stroke={liked ? "white" : G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      {/* 3 traits */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div onClick={() => setShowMenu(m => !m)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", padding: 4 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
        </div>
        {showMenu && (
          <>
            {/* Overlay transparent pour fermer au clic extérieur */}
            <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowMenu(false)} />
            <div style={{ position: "absolute", right: 0, top: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
              {isPremium && onView && <div onClick={() => { setShowMenu(false); onView(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>Voir le profil</div>}
              <div onClick={() => { setShowMenu(false); onBlock(); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>Bloquer</div>
              <div onClick={() => { setShowMenu(false); setShowSignalerMenu(true); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer" }}>Signaler</div>
            </div>
          </>
        )}
      </div>
      {/* Modal signaler */}
      {showSignalerMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
              <div onClick={() => setShowSignalerMenu(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
            </div>
            <div style={{ padding: "12px 16px 32px" }}>
              {["Faux profil / Arnaque", "Photos inappropriées", "Harcèlement", "Profil mineur", "Autre"].map(r => (
                <div key={r} onClick={() => { onReport(r); setShowSignalerMenu(false); }} style={{ padding: "14px 16px", background: "#F8F8F8", borderRadius: 12, marginBottom: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a" }}>{r}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CAROUSEL D'ENGAGEMENT PREMIUM ──
const premiumConversionSlides = [
  {
    id: 1,
    title: "Passe au niveau supérieur",
    description: "Profite d'une expérience plus complète pour faire de meilleures rencontres.",
    buttonText: "Découvrir Premium",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
      </svg>
    ),
    accent: G.or,
    bg: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",
  },
  {
    id: 2,
    title: "Découvre qui t'apprécie",
    description: "Gagne du temps en voyant les personnes déjà intéressées par ton profil.",
    buttonText: "Passer à Premium",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    accent: G.rouge,
    bg: "linear-gradient(135deg,rgba(192,57,43,0.08),rgba(192,57,43,0.02))",
  },
  {
    id: 3,
    title: "Sois plus visible",
    description: "Ton profil peut être mieux mis en avant auprès des personnes compatibles.",
    buttonText: "Améliorer mon profil",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    accent: G.vert,
    bg: "linear-gradient(135deg,rgba(26,92,58,0.08),rgba(26,92,58,0.02))",
  },
  {
    id: 4,
    title: "Des échanges plus qualifiés",
    description: "Accède à une expérience pensée pour ceux qui veulent vraiment construire quelque chose.",
    buttonText: "Découvrir Premium",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: "#7B5EA7",
    bg: "linear-gradient(135deg,rgba(123,94,167,0.08),rgba(123,94,167,0.02))",
  },
  {
    id: 5,
    title: "Moins de limites, plus de liberté",
    description: "Profite d'une navigation plus fluide et d'options avancées.",
    buttonText: "Voir les avantages",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    accent: G.or,
    bg: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",
  },
];

const premiumAdviceSlides = [
  {
    id: 1,
    title: "Choisis une photo claire",
    description: "Une photo lumineuse, nette et récente inspire plus facilement confiance.",
    buttonText: "Modifier mon profil",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
    accent: G.rouge,
    bg: "linear-gradient(135deg,rgba(192,57,43,0.08),rgba(192,57,43,0.02))",
    tab: "profile",
  },
  {
    id: 2,
    title: "Montre ton visage",
    description: "Les profils avec un visage bien visible donnent plus envie d'engager la conversation.",
    buttonText: "Ajouter une photo",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
      </svg>
    ),
    accent: G.vert,
    bg: "linear-gradient(135deg,rgba(26,92,58,0.08),rgba(26,92,58,0.02))",
    tab: "profile",
  },
  {
    id: 3,
    title: "Écris une bio simple",
    description: "Quelques phrases sincères suffisent pour montrer qui tu es et ce que tu recherches.",
    buttonText: "Compléter ma bio",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    ),
    accent: G.or,
    bg: "linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))",
    tab: "profile",
  },
  {
    id: 4,
    title: "Reste naturel",
    description: "Les profils trop parfaits paraissent moins crédibles. Montre une vraie part de toi.",
    buttonText: "Améliorer mon profil",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    accent: "#7B5EA7",
    bg: "linear-gradient(135deg,rgba(123,94,167,0.08),rgba(123,94,167,0.02))",
    tab: "profile",
  },
  {
    id: 5,
    title: "Commence avec attention",
    description: "Un message personnalisé fonctionne mieux qu'un simple \"salut\".",
    buttonText: "Voir mes matchs",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    accent: G.rouge,
    bg: "linear-gradient(135deg,rgba(192,57,43,0.08),rgba(192,57,43,0.02))",
    tab: "matches",
  },
];

const PremiumEngagementCarousel = React.memo(function PremiumEngagementCarousel({
  isPremium,
  onShowPremium,
  onNav,
}: {
  isPremium: boolean;
  onShowPremium: (r: string) => void;
  onNav?: (tab: string) => void;
}) {
  const slides = isPremium ? premiumAdviceSlides : premiumConversionSlides;
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % slides.length);
    }, 4000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPremium]);

  const goTo = (i: number) => { setIdx(i); resetTimer(); };
  const prev = () => goTo((idx - 1 + slides.length) % slides.length);
  const next = () => goTo((idx + 1) % slides.length);

  const slide = slides[idx];

  const handleAction = () => {
    if (isPremium) {
      onNav?.((slide as typeof premiumAdviceSlides[0]).tab || "profile");
    } else {
      onShowPremium("Passe Premium pour débloquer toutes les fonctionnalités de Moyo !");
    }
  };

  return (
    <div style={{ marginTop: 6, userSelect: "none", WebkitUserSelect: "none" }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        touchStartX.current = null;
        if (Math.abs(diff) < 35) return;
        diff > 0 ? next() : prev();
      }}
    >
      <div style={{
        background: G.blanc,
        borderRadius: 16,
        padding: "10px 14px",
        boxShadow: "0 2px 12px rgba(44,26,14,0.07)",
        border: `1px solid ${G.gris}`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Fond décoratif léger */}
        <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: slide.bg, pointerEvents: "none" }} />

        {/* Ligne unique : icône + texte + bouton */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          {/* Icône compacte */}
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: slide.bg, display: "flex", alignItems: "center", justifyContent: "center",
            color: slide.accent,
          }}>
            {slide.icon}
          </div>

          {/* Titre + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: G.brun, lineHeight: 1.2, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {slide.title}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#888", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {slide.description}
            </div>
          </div>

          {/* Bouton compact */}
          <button onClick={handleAction} style={{
            background: `linear-gradient(135deg,${slide.accent},${slide.accent}cc)`,
            color: G.blanc, border: "none", borderRadius: 50,
            padding: "6px 11px", fontSize: "0.66rem", fontWeight: 700,
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
            boxShadow: `0 2px 8px ${slide.accent}44`,
          }}>
            {slide.buttonText}
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 8 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              width: i === idx ? 16 : 4, height: 4, borderRadius: 99,
              background: i === idx ? slide.accent : "#D8D0C8",
              transition: "width 0.3s ease, background 0.3s ease",
              cursor: "pointer",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
});

function Discover({ auth, onShowPremium }: { auth: Auth; onShowPremium: (r: string) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likedIds, setLikedIds] = useState(new Set<string>());
  const [blockedIds, setBlockedIds] = useState(new Set<string>());
  const [current, setCurrent] = useState(0);
  const [matchPop, setMatchPop] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const [likesToday, setLikesToday] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showSignaler, setShowSignaler] = useState(false);
  const [showSameGender, setShowSameGender] = useState(false);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [myGender, setMyGender] = useState("");
  const [filters, setFilters] = useState({ city: "", ageMin: "", ageMax: "", gender: "", religion: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const swipeStartX = useRef<number | null>(null);
  useEffect(() => {
    loadProfiles();
    // Charger le genre de l'utilisateur connecté
    sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}&select=gender`)
      .then(res => { if (res[0]) setMyGender(res[0].gender); });
  }, []);
  useEffect(() => { if (profiles[current]) sb.recordVisit(auth.token, auth.userId, profiles[current].id); }, [current, profiles]);

  const loadProfiles = async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true); else setLoadingMore(true);
    try {
      const offset = pageNum * PAGE_SIZE;
      let params = `?id=neq.${auth.userId}&is_visible=neq.false&is_complete=eq.true&order=is_premium.desc,created_at.desc&limit=${PAGE_SIZE}&offset=${offset}`;
      if (filters.city && !filters.city.startsWith("──")) params += `&city=eq.${encodeURIComponent(filters.city)}`;
      if (filters.gender) params += `&gender=eq.${filters.gender}`;
      if (filters.ageMin) params += `&age=gte.${filters.ageMin}`;
      if (filters.ageMax) params += `&age=lte.${filters.ageMax}`;
      if (filters.religion) params += `&religion=eq.${encodeURIComponent(filters.religion)}`;
      const [all, liked, blocked] = await Promise.all([
        sb.query<Profile>(auth.token, "profiles", params),
        pageNum === 0 ? sb.query<{ to_user: string }>(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user`) : Promise.resolve([] as { to_user: string }[]),
        pageNum === 0 ? sb.query<{ blocked_id: string }>(auth.token, "blocks", `?blocker_id=eq.${auth.userId}&select=blocked_id`) : Promise.resolve([] as { blocked_id: string }[]),
      ]);
      if (pageNum === 0) {
        setLikedIds(new Set(liked.map(l => l.to_user)));
        const bIds = new Set(blocked.map(b => b.blocked_id));
        setBlockedIds(bIds);
      }
      const bIds = pageNum === 0 ? new Set(blocked.map(b => b.blocked_id)) : blockedIds;
      const seen = new Set<string>(append ? profiles.map(p => p.id) : []);
      const unique = (Array.isArray(all) ? all : []).filter(p => {
        if (seen.has(p.id) || bIds.has(p.id)) return false;
        seen.add(p.id); return true;
      });
      setHasMore(all.length === PAGE_SIZE);
      if (append) setProfiles(prev => [...prev, ...unique]);
      else { setProfiles(unique); setCurrent(0); }
      if (pageNum === 0) {
        const today = new Date().toISOString().split("T")[0];
        const tl = await sb.query<object>(auth.token, "likes", `?from_user=eq.${auth.userId}&created_at=gte.${today}`);
        setLikesToday(Array.isArray(tl) ? tl.length : 0);
      }
    } catch { if (!append) setProfiles([]); }
    if (pageNum === 0) setLoading(false); else setLoadingMore(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadProfiles(nextPage, true);
  };

  const handleBlock = async () => {
    const target = profiles[current];
    if (!target) return;
    await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: target.id });
    setShowBlockConfirm(false);
    setProfiles(prev => prev.filter(p => p.id !== target.id));
    setCurrent(c => Math.max(0, c - 1));
  };

  const recordView = async (profileId: string) => {
    // La vue n'est enregistrée que si le visiteur est Premium
    if (!auth.isPremium) return;
    if (profileId === auth.userId) return;
    try {
      await sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: profileId });
    } catch {}
  };

  const handleLike = async (p: Profile) => {
    if (myGender && p.gender && myGender === p.gender) { setShowSameGender(true); return; }
    if (likedIds.has(p.id)) {
      // Unlike — mise à jour optimiste immédiate
      setLikedIds(s => { const n = new Set(s); n.delete(p.id); return n; });
      setLikesToday(l => Math.max(0, l - 1));
      // Suppression en cascade : like + match + messages + vues
      try {
        const [fwd, rev] = await Promise.all([
          sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}&select=id`),
          sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}&select=id`),
        ]);
        const matchIds = [
          ...(Array.isArray(fwd) ? fwd.map(x => x.id) : []),
          ...(Array.isArray(rev) ? rev.map(x => x.id) : []),
        ];
        // Supprimer messages de tous les matchs
        for (const id of matchIds) {
          await sb.delete(auth.token, "messages", `?match_id=eq.${id}`);
        }
        await Promise.all([
          sb.delete(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${p.id}`),
          sb.delete(auth.token, "matches", `?user1=eq.${p.id}&user2=eq.${auth.userId}`),
          sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${p.id}`),
          // Supprimer aussi mon profil de ses likes (retrait symétrique)
          sb.delete(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`),
          // Supprimer les vues mutuelles
          sb.delete(auth.token, "profile_views", `?viewer_id=eq.${auth.userId}&viewed_id=eq.${p.id}`),
        ]);
      } catch {}
      return;
    }
    if (!auth.isPremium && likesToday >= FREE_LIMITS.likes) { onShowPremium(`Tu as utilisé tes ${FREE_LIMITS.likes} likes gratuits aujourd'hui. Passe Premium pour liker sans limite !`); return; }
    // Like — mise à jour optimiste immédiate
    setLikedIds(s => new Set([...s, p.id]));
    setLikesToday(l => l + 1);
    await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
    const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
    if (mutual.length > 0) {
      await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id });
      setMatchPop(p);
    }
  };

  // ── État toast local pour Discover ──
  const [discoverToast, setDiscoverToast] = useState<ToastState>(null);
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async (reason: string) => {
    if (!profiles[current]) return;
    const reportedProfile = profiles[current];
    setIsReporting(true);
    console.log(`[Moyo][Report] Signalement en cours — reporter:${auth.userId} reported:${reportedProfile.id} motif:"${reason}"`);
    try {
      const res = await sb.insert<{ id: string }>(
        auth.token,
        "reports",
        {
          reporter_id: auth.userId,
          reported_id: reportedProfile.id,
          reason,
          status: "pending",
        },
        auth.refreshToken,
        // onNewToken : pas nécessaire ici, safeRequest le gère en interne
      );
      if (res && res.length > 0) {
        console.log(`[Moyo][Report] ✅ Signalement enregistré — id:${res[0]?.id}`);
        setDiscoverToast({ msg: "Signalement envoyé. Merci de protéger la communauté Moyo.", type: "success" });
        setShowReport(false);
        setShowSignaler(false);
      } else {
        // Supabase a renvoyé un tableau vide sans erreur (RLS silencieuse possible)
        console.warn("[Moyo][Report] ⚠️ Insert report : réponse vide — vérifier les policies RLS de la table reports");
        setDiscoverToast({ msg: "Signalement non enregistré. Réessaie dans quelques instants.", type: "error" });
      }
    } catch (e: any) {
      console.error("[Moyo][Report] ❌ Erreur insert report :", e?.message || e);
      setDiscoverToast({ msg: "Erreur lors du signalement. Vérifie ta connexion.", type: "error" });
    }
    setIsReporting(false);
  };

  const p = profiles[current];
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#555" }}>Chargement...</div>;

  return <div style={{ padding: "4px 16px 8px" }}>
    {discoverToast && <Toast msg={discoverToast.msg} type={discoverToast.type} onClose={() => setDiscoverToast(null)} />}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Découvrir</h2><div style={{ display: "flex", gap: 6 }}>{!auth.isPremium && <div onClick={() => onShowPremium("")} style={{ background: "rgba(212,168,67,0.12)", border: `1px solid ${G.or}`, borderRadius: 50, padding: "4px 10px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", color: "#555" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#C0392B" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {Math.max(0, FREE_LIMITS.likes - likesToday)}/{FREE_LIMITS.likes}</div>}<div onClick={() => setViewMode(v => v === "card" ? "list" : "card")} style={{ background: G.blanc, color: "#111", border: `2px solid ${G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>{viewMode === "card" ? "≡ Liste" : "⊞ Carte"}</div><div onClick={() => setShowFilters(s => !s)} style={{ background: showFilters ? G.rouge : G.blanc, color: showFilters ? G.blanc : G.brun, border: `2px solid ${showFilters ? G.rouge : G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Filtres</div></div></div>{showFilters && <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 16 }}>
  <select value={filters.city} onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Toutes les villes</option>
    {VILLES.filter(c => !c.startsWith("──")).map(c => <option key={c} value={c}>{c}</option>)}
  </select>
  <select value={filters.gender} onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Tous les genres</option>
    <option value="Homme">Homme</option>
    <option value="Femme">Femme</option>
  </select>
  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
    <input type="number" value={filters.ageMin} onChange={e => setFilters(prev => ({ ...prev, ageMin: e.target.value }))} placeholder="Âge min (18)" min={18} max={99} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${filters.ageMin && parseInt(filters.ageMin) < 18 ? "#e74c3c" : G.gris}`, fontSize: "0.9rem" }} />
    <input type="number" value={filters.ageMax} onChange={e => setFilters(prev => ({ ...prev, ageMax: e.target.value }))} placeholder="Âge max (99)" min={18} max={99} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${filters.ageMax && parseInt(filters.ageMax) > 99 ? "#e74c3c" : G.gris}`, fontSize: "0.9rem" }} />
  </div>
  {filters.ageMin && parseInt(filters.ageMin) < 18 && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>Âge minimum : 18 ans</p>}
  {filters.ageMax && parseInt(filters.ageMax) > 99 && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>Âge maximum : 99 ans</p>}
  {filters.ageMin && filters.ageMax && parseInt(filters.ageMin) > parseInt(filters.ageMax) && <p style={{ fontSize: "0.75rem", color: "#e74c3c", marginBottom: 6, marginTop: -4 }}>L'âge min doit être inférieur à l'âge max</p>}
  <select value={filters.religion} onChange={e => setFilters(prev => ({ ...prev, religion: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 10, marginBottom: 8 }}>
    <option value="">Toutes les religions</option>
    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
  </select>
  <Btn variant="primary" onClick={() => {
    const min = parseInt(filters.ageMin);
    const max = parseInt(filters.ageMax);
    if (filters.ageMin && (min < 18 || min > 99)) return;
    if (filters.ageMax && (max < 18 || max > 99)) return;
    if (filters.ageMin && filters.ageMax && min > max) return;
    setPage(0); loadProfiles(0); setShowFilters(false);
  }} style={{ width: "100%" }}>Appliquer</Btn>
</div>}{profiles.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: "56px", height: "56px", borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={() => { setPage(0); loadProfiles(0); }}>Actualiser</Btn></div> : viewMode === "list" ? <div>
  {profiles.map((prof, idx) => <ProfileListCard key={prof.id} prof={prof} liked={likedIds.has(prof.id)} onLike={() => handleLike(prof)} onBlock={async () => { await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: prof.id }); setProfiles(prev => prev.filter(p => p.id !== prof.id)); }} onReport={(r) => handleReport(r)} isPremium={auth.isPremium} onView={auth.isPremium ? () => { setViewedProfile(prof); recordView(prof.id); } : undefined} />)}
  {hasMore && <div onClick={loadMore} style={{ textAlign: "center", padding: "14px", background: G.blanc, borderRadius: 14, marginTop: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", color: G.rouge, border: `1px solid ${G.gris}` }}>{loadingMore ? "Chargement..." : "Voir plus de profils"}</div>}
</div> : !p ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: "56px", height: "56px", borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div><h3 style={{  marginBottom: 8, fontSize: "1.2rem" }}>Aucun profil disponible pour le moment.</h3><p style={{ fontSize: "0.85rem", marginBottom: 20 }}>Reviens plus tard, de nouveaux membres arrivent bientôt !</p><Btn variant="primary" onClick={() => { setPage(0); loadProfiles(0); }}>Actualiser</Btn></div> : <><div
  onTouchStart={(e) => { swipeStartX.current = e.touches[0].clientX; }}
  onTouchEnd={(e) => {
    if (swipeStartX.current === null) return;
    const diff = swipeStartX.current - e.changedTouches[0].clientX;
    swipeStartX.current = null;
    if (Math.abs(diff) < 40) return; // trop petit = pas un swipe
    if (diff > 0) {
      // swipe gauche → profil suivant
      const next = Math.min(profiles.length - 1, current + 1);
      setCurrent(next); if (profiles[next]) recordView(profiles[next].id);
    } else {
      // swipe droite → profil précédent
      const prev = Math.max(0, current - 1);
      setCurrent(prev); if (profiles[prev]) recordView(profiles[prev].id);
    }
  }}
  style={{ background: G.blanc, borderRadius: 22, boxShadow: "0 8px 36px rgba(44,26,14,0.12)", overflow: "hidden", marginBottom: 8, position: "relative", touchAction: "pan-y" }}><div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}</div><div style={{ padding: "10px 14px" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111" }}>{p.name}, {p.age} ans {p.is_premium && <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4A843" stroke="none" style={{display:"inline",verticalAlign:"middle",marginLeft:3}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} {p.is_verified && <VerifiedBadge size={18} />}</div>
    {/* 3 traits menu */}
    <div style={{ position: "relative" }}>
      <div onClick={() => setShowReport(v => !v)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", padding: 4 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
      </div>
    </div>
  </div>
  {/* Bottom sheet options - en dehors de la carte */}
  {showReport && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowReport(false)}>
      <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1a1a" }}>{p.name}</div>
          <div onClick={() => setShowReport(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
        </div>
        <div style={{ padding: "8px 16px 32px" }}>
          {auth.isPremium && <div onClick={() => { setShowReport(false); setViewedProfile(p); recordView(p.id); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(26,92,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: G.vert }}>Voir le profil</div>
          </div>}
          <div onClick={() => { setShowReport(false); setShowBlockConfirm(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: "1px solid #F5F5F5" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#1a1a1a" }}>Bloquer</div>
          </div>
          <div onClick={() => { setShowReport(false); setShowSignaler(true); }} style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(231,76,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "#e74c3c" }}>Signaler</div>
          </div>
        </div>
      </div>
    </div>
  )}
  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    <span style={{ background: p.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: p.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600 }}>{p.gender === "Femme" ? "Femme" : "Homme"}</span>
    <span style={{ fontSize: "0.78rem", color: "#555" }}>{p.city}</span>
    {p.religion && <span style={{ background: "rgba(212,168,67,0.12)", border: `1px solid rgba(212,168,67,0.35)`, borderRadius: 50, padding: "2px 8px", fontSize: "0.72rem", color: "#555", fontWeight: 500 }}>{p.religion}</span>}
  </div>
  {p.bio && <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5, marginTop: 6, marginBottom: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{p.bio}</p>}
</div></div><div style={{ display: "flex", justifyContent: "center", gap: 14, alignItems: "center", marginBottom: 6 }}><div onClick={() => { const prev = Math.max(0, current - 1); setCurrent(prev); if (profiles[prev]) recordView(profiles[prev].id); }} style={{ width: 42, height: 42, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>←</div><div onClick={() => handleLike(p)} style={{ width: 58, height: 58, borderRadius: "50%", background: likedIds.has(p.id) ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : G.blanc, border: likedIds.has(p.id) ? "none" : `2px solid ${G.gris}`, boxShadow: likedIds.has(p.id) ? "0 6px 20px rgba(192,57,43,0.4)" : "0 2px 8px rgba(44,26,14,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", cursor: "pointer" }}>{likedIds.has(p.id) ? "❤️" : "🤍"}</div><div onClick={() => { const next = Math.min(profiles.length - 1, current + 1); setCurrent(next); if (profiles[next]) recordView(profiles[next].id); }} style={{ width: 42, height: 42, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>→</div></div><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 1, marginBottom: 4 }}>
  {profiles.slice(Math.max(0, current - 2), Math.min(profiles.length, current + 3)).map((_, i) => {
    const idx = Math.max(0, current - 2) + i;
    const isActive = idx === current;
    return (
      <div key={idx} style={{ width: isActive ? 20 : 6, height: 6, borderRadius: 99, background: isActive ? G.rouge : "#E0D5CC", transition: "width 0.25s ease, background 0.25s ease" }} />
    );
  })}
</div><PremiumEngagementCarousel isPremium={auth.isPremium} onShowPremium={onShowPremium} onNav={undefined} /></>}{viewedProfile && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setViewedProfile(null)}>
      <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
          {viewedProfile.photo_url ? <img src={viewedProfile.photo_url} alt={viewedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={() => setViewedProfile(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{viewedProfile.name}, {viewedProfile.age} ans {viewedProfile.is_premium && <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4A843" stroke="none" style={{display:"inline",verticalAlign:"middle",marginLeft:3}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}{viewedProfile.is_verified && <VerifiedBadge size={14} />}</div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{viewedProfile.city}</div>
          </div>
        </div>
        <div style={{ padding: "18px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: viewedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: viewedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{viewedProfile.gender}</span>
            {viewedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{viewedProfile.religion}</span>}
          </div>
          {viewedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{viewedProfile.bio}</p>}
          <Btn variant="primary" onClick={() => { handleLike(viewedProfile); setViewedProfile(null); }} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>❤️ Liker ce profil</Btn>
        </div>
      </div>
    </div>
  )}
  {showSameGender && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div style={{ background: G.blanc, borderRadius: 20, padding: "32px 24px", width: "100%", maxWidth: 300, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>{myGender === "Homme" ? "🕺" : "💃"}</div>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>
        {myGender === "Homme" ? "Eh frère, reste du bon côté ! 😂" : "Eh sœur, reste du bon côté ! 😂"}
      </h3>
      <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
        Moyo c'est pour les rencontres hétérosexuelles 😄
      </p>
      <Btn variant="primary" onClick={() => setShowSameGender(false)} style={{ width: "100%" }}>J'ai compris 😄</Btn>
    </div>
  </div>
)}
{showBlockConfirm && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
  <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Bloquer {p?.name} ?</h3>
    <p style={{ fontSize: "0.88rem", color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Ce profil disparaîtra de Découvrir. Vous pourrez débloquer depuis votre profil.</p>
    <div style={{ display: "flex", gap: 10 }}>
      <Btn variant="ghost" onClick={() => setShowBlockConfirm(false)} style={{ flex: 1 }}>Annuler</Btn>
      <Btn variant="danger" onClick={handleBlock} style={{ flex: 1 }}>Bloquer</Btn>
    </div>
  </div>
</div>}
{showSignaler && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
  <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, overflow: "hidden" }}>
    <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F5F5" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Signaler ce profil</h3>
      <div onClick={() => !isReporting && setShowSignaler(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
    </div>
    <div style={{ padding: "12px 16px 32px" }}>
      {isReporting ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#555", fontSize: "0.88rem" }}>
          Envoi du signalement…
        </div>
      ) : (
        ["Faux profil / Arnaque", "Photos inappropriées", "Harcèlement", "Profil mineur", "Autre"].map(r => (
          <div key={r} onClick={() => { handleReport(r); setShowSignaler(false); }} style={{ padding: "14px 16px", background: "#F8F8F8", borderRadius: 12, marginBottom: 8, cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a" }}>{r}</div>
        ))
      )}
    </div>
  </div>
</div>}{matchPop && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}><div style={{ textAlign: "center", color: G.blanc }}><div style={{ fontSize: "4rem", marginBottom: 12 }}>💞</div><h2 style={{  fontSize: "2.2rem", color: G.or, marginBottom: 8 }}>C'est un Match !</h2><p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>Toi et {matchPop.name} vous plaisez mutuellement !</p><Btn variant="white" onClick={() => setMatchPop(null)}>Continuer →</Btn></div></div>}</div>;
}

function LikesReceivedBanner({ auth, onShowPremium }: { auth: Auth; onShowPremium: (r: string) => void }) {
  const [count, setCount] = useState(0);
  const [likers, setLikers] = useState<Profile[]>([]);
  const [visitors, setVisitors] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<"likes" | "visitors">("likes");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [liking, setLiking] = useState(false);

  const handleLikeFromBanner = async (p: Profile) => {
    setLiking(true);
    try {
      await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
      // Vérifier si match mutuel
      const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
      if (Array.isArray(mutual) && mutual.length > 0) {
        await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id });
      }
    } catch {}
    setLiking(false);
    setSelectedProfile(null);
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Likes reçus
        const res = await sb.query<{ from_user: string }>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user`);
        setCount(Array.isArray(res) ? res.length : 0);
        if (auth.isPremium && Array.isArray(res) && res.length > 0) {
          const ids = res.map(r => r.from_user).join(",");
          const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${ids})&select=*`);
          setLikers(Array.isArray(profiles) ? profiles : []);
        }
        // Visiteurs du profil (Premium uniquement)
        if (auth.isPremium) {
          const views = await sb.query<{ viewer_id: string }>(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}&select=viewer_id&order=created_at.desc&limit=20`);
          if (Array.isArray(views) && views.length > 0) {
            const vIds = [...new Set(views.map(v => v.viewer_id))].join(",");
            const vProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${vIds})&select=*`);
            setVisitors(Array.isArray(vProfiles) ? vProfiles : []);
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Bandeau */}
      <div onClick={() => !auth.isPremium && onShowPremium("Découvre qui a liké ton profil en passant Premium ! 👀")}
        style={{ background: auth.isPremium ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 16, padding: "14px 18px", marginBottom: auth.isPremium && likers.length > 0 ? 12 : 0, color: auth.isPremium ? G.brun : G.blanc, cursor: auth.isPremium ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {auth.isPremium
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
            {auth.isPremium
              ? count > 0 ? `${count} personne${count > 1 ? "s ont" : " a"} liké ton profil` : "Personne n'a encore liké ton profil"
              : count > 0 ? `${count} personne${count > 1 ? "s ont" : " a"} liké ton profil` : "Des personnes ont liké ton profil"}
          </div>
          <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
            {auth.isPremium ? "Accès Premium activé ✓" : "Passe Premium pour découvrir qui 👀"}
          </div>
        </div>
        {!auth.isPremium && count > 0 && (
          <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
            {count > 9 ? "9+" : count}
          </div>
        )}
      </div>

      {/* Onglets likes / visiteurs — Premium uniquement */}
      {auth.isPremium && (likers.length > 0 || visitors.length > 0) && (
        <div style={{ display: "flex", background: G.gris, borderRadius: 50, padding: 3, gap: 2, marginBottom: 10 }}>
          {[{ id: "likes", label: <span style={{display:"flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{`Likes (${likers.length})`}</span> }, { id: "visitors", label: <span style={{display:"flex",alignItems:"center",gap:4}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>{`Visiteurs (${visitors.length})`}</span> }].map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id as "likes" | "visitors")} style={{ flex: 1, padding: "6px 10px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textAlign: "center", background: activeTab === t.id ? G.blanc : "transparent", color: activeTab === t.id ? G.rouge : "#888", boxShadow: activeTab === t.id ? "0 2px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
              {t.label}
            </div>
          ))}
        </div>
      )}
      {auth.isPremium && (likers.length > 0 || visitors.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {(activeTab === "likes" ? likers : visitors).map(p => (
            <div key={p.id} onClick={() => setSelectedProfile(p)} style={{ background: G.blanc, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", cursor: "pointer" }}>
              <div style={{ height: 120, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                }
                <div style={{ position: "absolute", top: 6, right: 6, background: activeTab === "likes" ? `linear-gradient(135deg,${G.rouge},${G.rougeDark})` : "rgba(0,0,0,0.5)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {activeTab === "likes"
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#111" }}>{p.name}, {p.age} ans</div>
                <div style={{ fontSize: "0.72rem", color: "#555", marginTop: 2 }}>{p.city}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal profil cliquable */}
      {selectedProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSelectedProfile(null)}>
          <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
              {selectedProfile.photo_url
                ? <img src={selectedProfile.photo_url} alt={selectedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              }
              <div onClick={() => setSelectedProfile(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
              <div style={{ position: "absolute", bottom: 14, left: 16 }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{selectedProfile.name}, {selectedProfile.age} ans {selectedProfile.is_premium && <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4A843" stroke="none" style={{display:"inline",verticalAlign:"middle",marginLeft:3}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}{selectedProfile.is_verified && <VerifiedBadge size={14} />}</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{selectedProfile.city}</div>
              </div>
            </div>
            <div style={{ padding: "18px 20px 32px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ background: selectedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: selectedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{selectedProfile.gender}</span>
                {selectedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{selectedProfile.religion}</span>}
              </div>
              {selectedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{selectedProfile.bio}</p>}
              <Btn variant="primary" onClick={() => handleLikeFromBanner(selectedProfile)} loading={liking} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  Liker {selectedProfile.name}
                </span>
              </Btn>
            </div>
          </div>
        </div>
      )}

      {auth.isPremium && loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#555", fontSize: "0.85rem" }}>Chargement...</div>
      )}
    </div>
  );
}

function MatchProfileModal({ match, onClose, onMessage }: { match: Match; onClose: () => void; onMessage: () => void }) {
  const p = match.partner;
  if (!p) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {/* Photo */}
        <div style={{ height: 220, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontSize: "1rem", fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
            <div style={{  fontSize: "1.6rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{p.name}, {p.age} ans</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{p.city}</div>
          </div>
        </div>
        {/* Infos */}
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</span>
            {p.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>⭐ Premium</span>}
            {p.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{p.religion}</span>}
          </div>
          {p.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{p.bio}</p>}
          <Btn variant="primary" onClick={onMessage} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>Envoyer un message</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Types enrichis pour l'historique avancé ───────────────────────────────
type LikeRecord = { from_user: string; to_user: string; created_at?: string };
type ViewRecord  = { viewer_id: string; viewed_id: string; created_at?: string };
type VisitRecord = { visitor_id: string; visited_id: string; created_at?: string };
type MatchRecord = { id: string; user1: string; user2: string };

// Helpers date
const isRecent = (iso?: string, hours = 48) => {
  if (!iso) return false;
  return (Date.now() - new Date(iso).getTime()) < hours * 3600 * 1000;
};
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`;
  if (diffH < 48) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

// Switch interne réutilisable
function InnerSwitch({ options, value, onChange }: {
  options: { id: string; label: string; icon: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", background: "#F0F0F0", borderRadius: 50, padding: 4, gap: 4, marginBottom: 16 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          style={{ flex: 1, border: "none", borderRadius: 50, padding: "8px 12px",
            background: value === o.id ? G.blanc : "transparent",
            color: value === o.id ? G.rouge : "#666",
            fontWeight: value === o.id ? 700 : 500,
            fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 5,
            boxShadow: value === o.id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.18s ease" }}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

// Badge générique
function Badge({ label, color = G.rouge, bg = "rgba(192,57,43,0.1)" }: { label: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 50, padding: "2px 8px",
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: 0.2, flexShrink: 0 }}>
      {label}
    </span>
  );
}

// Bloc flou Premium CTA
function PremiumBlur({ count, label, onShowPremium }: { count: number; label: string; onShowPremium: () => void }) {
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
      {/* Cartes fantômes floutées */}
      <div style={{ filter: "blur(7px)", pointerEvents: "none", userSelect: "none" }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc,
            borderRadius: 16, padding: 12, marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg,#E8C5A0,#C47A4A)`, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, background: "#ddd", borderRadius: 50, width: "60%", marginBottom: 8 }} />
              <div style={{ height: 10, background: "#eee", borderRadius: 50, width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
      {/* Overlay CTA */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14, padding: 24,
        background: "rgba(255,255,255,0.72)", backdropFilter: "blur(2px)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%",
          background: `linear-gradient(135deg,${G.or},#B8860B)`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#111" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#111", marginBottom: 6 }}>
            {count > 0 ? `${count} ${label}` : label}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.5 }}>
            Passe Premium pour tout voir
          </div>
        </div>
        <button onClick={onShowPremium}
          style={{ background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111",
            border: "none", borderRadius: 50, padding: "12px 28px", fontWeight: 700,
            fontSize: "0.88rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(212,168,67,0.4)" }}>
          Passer à Premium <svg width="11" height="11" viewBox="0 0 24 24" fill="#111" stroke="none" style={{ display: "inline", verticalAlign: "middle", marginLeft: 3 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
      </div>
    </div>
  );
}

// Empty state élégant
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 24px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 14 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F5F0EB",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#333", marginBottom: 6 }}>{title}</div>
        {subtitle && <div style={{ fontSize: "0.82rem", color: "#888", lineHeight: 1.6 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function LikesPage({ auth, onShowPremium, mode = "likes", onBadgeUpdate }: { auth: Auth; onShowPremium: (r: string) => void; mode?: "likes" | "visitors"; onBadgeUpdate?: () => void }) {
  // ── Sub-tab state ──
  const [likesSubTab, setLikesSubTab] = useState<"received" | "sent">("received");
  const [visitorsSubTab, setVisitorsSubTab] = useState<"visitors" | "visited">("visitors");

  // ── Données likes ──
  const [count, setCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [likers, setLikers] = useState<Profile[]>([]);
  const [likerMeta, setLikerMeta] = useState<Record<string, { date?: string; isMatch?: boolean }>>({});
  const [sentLikes, setSentLikes] = useState<Profile[]>([]);
  const [sentLikesMeta, setSentLikesMeta] = useState<Record<string, { date?: string; status: "pending"|"match"|"unavailable" }>>({});

  // ── Données visiteurs ──
  const [visitors, setVisitors] = useState<Profile[]>([]);
  const [visitorMeta, setVisitorMeta] = useState<Record<string, { date?: string }>>({});
  const [visitedProfiles, setVisitedProfiles] = useState<Profile[]>([]);
  const [visitedMeta, setVisitedMeta] = useState<Record<string, { date?: string }>>({});

  const [dismissedIds, setDismissedIds] = useState(new Set<string>());
  const [confirmDismiss, setConfirmDismiss] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [confirmUnlike, setConfirmUnlike] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [isPremiumReal, setIsPremiumReal] = useState(auth.isPremium);
  const loadData = async (premiumOverride?: boolean) => {
    const isPrem = premiumOverride !== undefined ? premiumOverride : isPremiumReal;
    setLoading(true);

    // 1. IDs dismissés
    let dIds = new Set<string>();
    try {
      const dismissed = await sb.query<{ dismissed_id: string }>(auth.token, "dismissed_cards", `?user_id=eq.${auth.userId}&select=dismissed_id`);
      dIds = new Set(Array.isArray(dismissed) ? dismissed.map(d => d.dismissed_id) : []);
      setDismissedIds(dIds);
    } catch {}

    // 2. Matches actuels (pour croiser)
    let matchedUserIds = new Set<string>();
    try {
      const matchRows = await sb.query<MatchRecord>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id,user1,user2`);
      if (Array.isArray(matchRows)) {
        matchRows.forEach(m => {
          matchedUserIds.add(m.user1 === auth.userId ? m.user2 : m.user1);
        });
      }
    } catch {}

    // ── LIKES REÇUS ──
    try {
      const res = await sb.query<LikeRecord>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user,created_at&order=created_at.desc`);
      const total = Array.isArray(res) ? res.length : 0;
      setCount(total);
      if (isPrem && total > 0) {
        const ids = res.map(r => r.from_user).filter(Boolean).join(",");
        if (ids) {
          const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${ids})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
          setLikers(Array.isArray(profiles) ? profiles.filter(p => p && !dIds.has(p.id)) : []);
          const meta: Record<string, { date?: string; isMatch?: boolean }> = {};
          res.forEach(r => { meta[r.from_user] = { date: r.created_at, isMatch: matchedUserIds.has(r.from_user) }; });
          setLikerMeta(meta);
        }
      }
    } catch (e) { console.error("LikesPage likes reçus error:", e); }

    // ── LIKES ENVOYÉS ──
    if (isPrem) {
      try {
        const sent = await sb.query<LikeRecord>(auth.token, "likes", `?from_user=eq.${auth.userId}&select=to_user,created_at&order=created_at.desc&limit=50`);
        if (Array.isArray(sent) && sent.length > 0) {
          const sentIds = sent.map(s => s.to_user).filter(Boolean).join(",");
          const sentProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${sentIds})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
          const knownIds = new Set(Array.isArray(sentProfiles) ? sentProfiles.map(p => p.id) : []);
          setSentLikes(Array.isArray(sentProfiles) ? sentProfiles : []);
          const smeta: Record<string, { date?: string; status: "pending"|"match"|"unavailable" }> = {};
          sent.forEach(s => {
            const st = matchedUserIds.has(s.to_user) ? "match" : knownIds.has(s.to_user) ? "pending" : "unavailable";
            smeta[s.to_user] = { date: s.created_at, status: st };
          });
          setSentLikesMeta(smeta);
        }
      } catch {}
    }

    // ── VISITEURS (qui m'ont vu) ──
    try {
      const views = await sb.query<ViewRecord>(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}&select=viewer_id,created_at&order=created_at.desc&limit=100`);
      if (Array.isArray(views)) {
        // Dédoublonner — garder la visite la plus récente par visitor
        const seen = new Map<string, string>();
        views.forEach(v => { if (!seen.has(v.viewer_id)) seen.set(v.viewer_id, v.created_at || ""); });
        setViewsCount(seen.size);
        if (isPrem && seen.size > 0) {
          const vIds = [...seen.keys()].filter(id => !dIds.has(id)).join(",");
          if (vIds) {
            const vProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${vIds})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
            setVisitors(Array.isArray(vProfiles) ? vProfiles : []);
            const vmeta: Record<string, { date?: string }> = {};
            seen.forEach((date, id) => { vmeta[id] = { date }; });
            setVisitorMeta(vmeta);
          }
        }
      }
    } catch {}

    // ── PROFILS VUS PAR MOI ──
    if (isPrem) {
      try {
        const myVisits = await sb.query<VisitRecord>(auth.token, "profile_visits", `?visitor_id=eq.${auth.userId}&select=visited_id,created_at&order=created_at.desc&limit=50`);
        if (Array.isArray(myVisits) && myVisits.length > 0) {
          const seenVisited = new Map<string, string>();
          myVisits.forEach(v => { if (!seenVisited.has(v.visited_id)) seenVisited.set(v.visited_id, v.created_at || ""); });
          const vIds = [...seenVisited.keys()].join(",");
          const vProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=in.(${vIds})&select=id,name,age,city,bio,photo_url,gender,religion,is_premium,is_verified`);
          setVisitedProfiles(Array.isArray(vProfiles) ? vProfiles : []);
          const pvmeta: Record<string, { date?: string }> = {};
          seenVisited.forEach((date, id) => { pvmeta[id] = { date }; });
          setVisitedMeta(pvmeta);
        }
      } catch {}
    }

    setLoading(false);
  };

  useEffect(() => {
    sb.query<{ is_premium: boolean }>(auth.token, "profiles", `?id=eq.${auth.userId}&select=is_premium`)
      .then(res => {
        if (Array.isArray(res) && res.length > 0) {
          const prem = res[0].is_premium === true;
          setIsPremiumReal(prem);
          loadData(prem);
        }
      }).catch(() => {});
    loadData();
    const wsLikes = sb.subscribeRealtime(auth.token, "likes", `to_user=eq.${auth.userId}`, () => { loadData(); });
    const wsViews = sb.subscribeRealtime(auth.token, "profile_views", `viewed_id=eq.${auth.userId}`, () => { loadData(); });
    return () => {
      try { wsLikes?.close(); } catch {}
      try { wsViews?.close(); } catch {}
    };
  }, []);

  const confirmAndDismiss = async (profileId: string) => {
    setConfirmDismiss(null);
    setDismissedIds(prev => new Set([...prev, profileId]));
    setLikers(prev => prev.filter(p => p.id !== profileId));
    setVisitors(prev => prev.filter(p => p.id !== profileId));
    setCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/dismissed_cards`, {
        method: "POST",
        headers: { ...sb.h(auth.token), "Prefer": "return=minimal,resolution=ignore-duplicates" },
        body: JSON.stringify({ user_id: auth.userId, dismissed_id: profileId }),
      });
    } catch {}
    if (onBadgeUpdate) onBadgeUpdate();
  };

  const handleDismiss = (p: Profile, e: React.MouseEvent) => { e.stopPropagation(); setConfirmDismiss(p); };

  const handleLike = async (p: Profile) => {
    setLiking(true);
    try {
      await sb.insert(auth.token, "likes", { from_user: auth.userId, to_user: p.id });
      const mutual = await sb.query<object>(auth.token, "likes", `?from_user=eq.${p.id}&to_user=eq.${auth.userId}`);
      if (Array.isArray(mutual) && mutual.length > 0) {
        await sb.insert(auth.token, "matches", { user1: auth.userId, user2: p.id });
      }
    } catch {}
    setLiking(false);
    setSelectedProfile(null);
    loadData();
  };

  // Retirer un like envoyé — uniquement si pas de match
  const handleUnlike = async (p: Profile) => {
    const meta = sentLikesMeta[p.id];
    if (meta?.status === "match") return; // ne jamais casser un match
    try {
      await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${p.id}`);
      setSentLikes(prev => prev.filter(s => s.id !== p.id));
    } catch {}
    setConfirmUnlike(null);
  };

  // ── Sous-composant carte profil (grille) ──
  const ProfileCard = ({ p, meta, rightSlot, onView }: {
    p: Profile;
    meta?: { date?: string; isMatch?: boolean; status?: string };
    rightSlot?: React.ReactNode;
    onView: () => void;
  }) => (
    <div style={{ background: G.blanc, borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(44,26,14,0.09)", position: "relative", marginBottom: 12 }}>
      <div onClick={onView} style={{ height: 140, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)",
        overflow: "hidden", cursor: "pointer", position: "relative" }}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>}
        {/* Badges en overlay */}
        <div style={{ position: "absolute", top: 6, left: 6, display: "flex", flexDirection: "column", gap: 3 }}>
          {(meta?.isMatch || meta?.status === "match") && (
            <span style={{ background: G.vert, color: "white", borderRadius: 50, padding: "2px 7px", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Match
            </span>
          )}
          {meta?.date && isRecent(meta.date) && !meta?.isMatch && meta?.status !== "match" && (
            <span style={{ background: G.rouge, color: "white", borderRadius: 50, padding: "2px 7px", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Nouveau
            </span>
          )}
        </div>
        {/* Bouton action (dismiss) en overlay */}
        {rightSlot && (
          <div style={{ position: "absolute", top: 6, right: 6 }}>{rightSlot}</div>
        )}
      </div>
      <div onClick={onView} style={{ padding: "8px 10px 10px", cursor: "pointer" }}>
        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}, {p.age} ans</div>
        <div style={{ fontSize: "0.68rem", color: "#777", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.city}</span>
        </div>
      </div>
    </div>
  );

  // ── Sous-composant carte profil (liste) ──
  const ProfileRow = ({ p, meta, rightSlot, onView }: {
    p: Profile;
    meta?: { date?: string; isMatch?: boolean; status?: string };
    rightSlot?: React.ReactNode;
    onView: () => void;
  }) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc,
      borderRadius: 16, padding: "12px 14px", marginBottom: 10,
      boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
      <div onClick={onView} style={{ width: 52, height: 52, borderRadius: 13, overflow: "hidden",
        flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", cursor: "pointer" }}>
        {p.photo_url
          ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>}
      </div>
      <div onClick={onView} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{p.name}, {p.age} ans</span>
          {meta?.isMatch && <Badge label={<span style={{display:"flex",alignItems:"center",gap:3}}><svg width="10" height="10" viewBox="0 0 24 24" fill={G.vert} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Match</span>} color={G.vert} bg="rgba(26,92,58,0.1)" />}
          {meta?.status === "match" && <Badge label={<span style={{display:"flex",alignItems:"center",gap:3}}><svg width="10" height="10" viewBox="0 0 24 24" fill={G.vert} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Match</span>} color={G.vert} bg="rgba(26,92,58,0.1)" />}
          {meta?.status === "pending" && <Badge label="En attente" color="#888" bg="#F0F0F0" />}
          {meta?.status === "unavailable" && <Badge label="Profil indispo" color="#aaa" bg="#F5F5F5" />}
          {meta?.date && isRecent(meta.date) && !meta?.isMatch && meta?.status !== "match" && <Badge label={<span style={{display:"flex",alignItems:"center",gap:3}}><svg width="9" height="9" viewBox="0 0 24 24" fill={G.rouge} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Nouveau</span>} color={G.rouge} bg="rgba(192,57,43,0.08)" />}
        </div>
        <div style={{ fontSize: "0.73rem", color: "#777", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {p.city}
          </span>
          {meta?.date && <span style={{ color: "#aaa" }}>{fmtDate(meta.date)}</span>}
        </div>
      </div>
      {rightSlot}
    </div>
  );

  // ── Spinner ──
  const Spinner = () => (
    <div style={{ textAlign: "center", padding: 44 }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="2.5"
        strokeLinecap="round" style={{ animation: "pulse 0.9s ease-in-out infinite" }}>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
  );

  return (
    <div style={{ padding: "12px 16px 24px" }}>
      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: "1.18rem", fontWeight: 800, color: "#111" }}>
          {mode === "likes" ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={G.rouge} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Likes
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Vus
            </span>
          )}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div onClick={() => setViewMode(v => v === "card" ? "list" : "card")}
            style={{ background: G.blanc, color: "#111", border: `2px solid ${G.gris}`,
              borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
            {viewMode === "card" ? "≡ Liste" : "⊞ Carte"}
          </div>
          {isPremiumReal && (
            <span style={{ background: `linear-gradient(135deg,${G.or},#B8860B)`, color: "#111",
              borderRadius: 50, padding: "3px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#111" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                PREMIUM
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          ONGLET LIKES
      ══════════════════════════════ */}
      {mode === "likes" && (
        <>
          {/* 1. Bandeau compteur */}
          <div style={{ background: isPremiumReal ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`,
            borderRadius: 14, padding: "13px 16px", marginBottom: 14,
            color: isPremiumReal ? "#111" : G.blanc,
            display: "flex", alignItems: "center", gap: 12,
            cursor: isPremiumReal ? "default" : "pointer" }}
            onClick={() => !isPremiumReal && onShowPremium("Découvre qui a liké ton profil en passant Premium !")}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isPremiumReal?"#111":"white"} stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {count > 0 ? `${count} personne${count > 1?"s ont":" a"} liké ton profil` : "Aucun like reçu pour l'instant"}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 2 }}>
                {isPremiumReal ? "Historique complet activé" : "Passe Premium pour voir qui"}
              </div>
            </div>
            {!isPremiumReal && count > 0 && (
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.95rem" }}>
                {count > 9 ? "9+" : count}
              </div>
            )}
          </div>

          {/* 2. Switch Reçus / Envoyés */}
          <InnerSwitch
            value={likesSubTab}
            onChange={v => setLikesSubTab(v as "received"|"sent")}
            options={[
              { id: "received", label: `Reçus${count > 0 ? ` (${count})` : ""}`,
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { id: "sent", label: "Envoyés",
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
            ]}
          />

          {/* 3. Contenu selon sous-onglet */}
          {/* ── Likes reçus ── */}
          {likesSubTab === "received" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                likers.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                    title="Aucun like reçu pour l'instant"
                    subtitle="Complète ton profil pour attirer plus d'attention ✨"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {likers.map(p => (
                      <ProfileCard key={p.id}
                        p={p}
                        meta={likerMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.35)",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {likers.map(p => (
                      <ProfileRow key={p.id}
                        p={p}
                        meta={likerMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F0EB",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={count}
                  label={count > 0 ? `personne${count>1?"s ont":" a"} liké ton profil` : "Découvre qui t'a liké"}
                  onShowPremium={() => onShowPremium("Découvre qui a liké ton profil en passant Premium !")}
                />
              )}
            </>
          )}

          {/* ── Likes envoyés ── */}
          {likesSubTab === "sent" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                sentLikes.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                    title="Tu n'as encore liké personne"
                    subtitle="Explore les profils et envoie des likes !"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {sentLikes.map(p => {
                      const meta = sentLikesMeta[p.id];
                      return (
                        <ProfileCard key={p.id}
                          p={p}
                          meta={meta}
                          onView={() => setSelectedProfile(p)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {sentLikes.map(p => {
                      const meta = sentLikesMeta[p.id];
                      return (
                        <ProfileRow key={p.id}
                          p={p}
                          meta={meta}
                          onView={() => setSelectedProfile(p)}
                          rightSlot={
                            meta?.status !== "match" ? (
                              <button onClick={() => setConfirmUnlike(p)}
                                style={{ border: `1.5px solid #eee`, borderRadius: 50,
                                  padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600,
                                  color: "#aaa", background: G.blanc, cursor: "pointer",
                                  flexShrink: 0, whiteSpace: "nowrap" }}>
                                Retirer
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.7rem", color: G.vert, fontWeight: 700, flexShrink: 0 }}>✓ Match</span>
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={0}
                  label="Vois les profils que tu as likés"
                  onShowPremium={() => onShowPremium("Accède à l'historique de tes likes en passant Premium !")}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════
          ONGLET VISU / VISITEURS
      ══════════════════════════════ */}
      {mode === "visitors" && (
        <>
          {/* 1. Bandeau compteur */}
          <div style={{ background: isPremiumReal ? `linear-gradient(135deg,${G.or},#B8860B)` : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`,
            borderRadius: 14, padding: "13px 16px", marginBottom: 14,
            color: isPremiumReal ? "#111" : G.blanc,
            display: "flex", alignItems: "center", gap: 12,
            cursor: isPremiumReal ? "default" : "pointer" }}
            onClick={() => !isPremiumReal && onShowPremium("Découvre qui a visité ton profil en passant Premium !")}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPremiumReal?"#111":"white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {viewsCount > 0 ? `${viewsCount} visiteur${viewsCount>1?"s ont":" a"} consulté ton profil` : "Aucune visite pour l'instant"}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: 2 }}>
                {isPremiumReal ? "Historique complet activé" : "Passe Premium pour voir qui"}
              </div>
            </div>
            {!isPremiumReal && viewsCount > 0 && (
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.95rem" }}>
                {viewsCount > 9 ? "9+" : viewsCount}
              </div>
            )}
          </div>

          {/* 2. Switch Visiteurs / Profils vus */}
          <InnerSwitch
            value={visitorsSubTab}
            onChange={v => setVisitorsSubTab(v as "visitors"|"visited")}
            options={[
              { id: "visitors", label: `Visiteurs${viewsCount > 0 ? ` (${viewsCount})` : ""}`,
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
              { id: "visited", label: "Profils vus",
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
            ]}
          />

          {/* 3. Contenu selon sous-onglet */}
          {/* ── Visiteurs ── */}
          {visitorsSubTab === "visitors" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                visitors.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    title="Aucun visiteur pour l'instant"
                    subtitle="Les personnes qui consultent ton profil apparaîtront ici"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {visitors.map(p => (
                      <ProfileCard key={p.id}
                        p={p}
                        meta={visitorMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.35)",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {visitors.map(p => (
                      <ProfileRow key={p.id}
                        p={p}
                        meta={visitorMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <div onClick={(e) => handleDismiss(p, e)}
                            style={{ width: 30, height: 30, borderRadius: "50%", background: "#F5F0EB",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </div>
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={viewsCount}
                  label={viewsCount > 0 ? `personne${viewsCount>1?"s ont":" a"} visité ton profil` : "Découvre qui t'a rendu visite"}
                  onShowPremium={() => onShowPremium("Découvre qui a visité ton profil en passant Premium !")}
                />
              )}
            </>
          )}

          {/* ── Profils vus par moi ── */}
          {visitorsSubTab === "visited" && (
            <>
              {isPremiumReal ? (
                loading ? <Spinner /> :
                visitedProfiles.length === 0 ? (
                  <EmptyState
                    icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                    title="Aucun profil consulté"
                    subtitle="Les profils que tu auras visités apparaîtront ici"
                  />
                ) : viewMode === "card" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {visitedProfiles.map(p => (
                      <ProfileCard key={p.id}
                        p={p}
                        meta={visitedMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    {visitedProfiles.map(p => (
                      <ProfileRow key={p.id}
                        p={p}
                        meta={visitedMeta[p.id]}
                        onView={() => setSelectedProfile(p)}
                        rightSlot={
                          <button onClick={() => setSelectedProfile(p)}
                            style={{ border: `1.5px solid ${G.rouge}`, borderRadius: 50,
                              padding: "5px 10px", fontSize: "0.7rem", fontWeight: 700,
                              color: G.rouge, background: G.blanc, cursor: "pointer",
                              flexShrink: 0, whiteSpace: "nowrap" }}>
                            Revoir
                          </button>
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <PremiumBlur
                  count={0}
                  label="Vois les profils que tu as consultés"
                  onShowPremium={() => onShowPremium("Accède à l'historique de tes visites en passant Premium !")}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ── Modal profil ── */}
      {selectedProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 600,
          display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setSelectedProfile(null)}>
          <div style={{ background: G.blanc, borderRadius: "22px 22px 0 0", width: "100%",
            maxWidth: 500, maxHeight: "88vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden", position: "relative" }}>
              {selectedProfile.photo_url
                ? <img src={selectedProfile.photo_url} alt={selectedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
              <div onClick={() => setSelectedProfile(null)}
                style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)",
                  borderRadius: "50%", width: 34, height: 34, display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                  color: G.blanc, fontWeight: 700, fontSize: "1rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <div style={{ position: "absolute", bottom: 14, left: 16 }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: G.blanc, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                  {selectedProfile.name}, {selectedProfile.age} ans
                  {selectedProfile.is_premium && <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4A843" stroke="none" style={{display:"inline",verticalAlign:"middle",marginLeft:3}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  {selectedProfile.is_verified && <VerifiedBadge size={14} />}
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}>{selectedProfile.city}</div>
              </div>
            </div>
            <div style={{ padding: "18px 20px 32px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ background: selectedProfile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: selectedProfile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{selectedProfile.gender}</span>
                {selectedProfile.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{selectedProfile.religion}</span>}
              </div>
              {selectedProfile.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{selectedProfile.bio}</p>}
              <Btn variant="primary" onClick={() => handleLike(selectedProfile)} loading={liking} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>
                Liker {selectedProfile.name}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation dismiss ── */}
      {confirmDismiss && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%",
            maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F5F5F5",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Retirer {confirmDismiss.name} ?</h3>
            <p style={{ fontSize: "0.83rem", color: "#666", marginBottom: 22, lineHeight: 1.6 }}>
              Cette carte disparaîtra de ta liste. Tes likes, matchs et messages restent intacts.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmDismiss(null)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => confirmAndDismiss(confirmDismiss.id)} style={{ flex: 1 }}>Retirer</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation unlike ── */}
      {confirmUnlike && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%",
            maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%",
              background: "rgba(192,57,43,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Retirer ton like à {confirmUnlike.name} ?</h3>
            <p style={{ fontSize: "0.83rem", color: "#666", marginBottom: 22, lineHeight: 1.6 }}>
              Ton like sera retiré. Si un match existait déjà, il reste intact.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmUnlike(null)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => handleUnlike(confirmUnlike)} style={{ flex: 1 }}>Retirer le like</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Matches({ auth, onShowPremium, onNotifCount, onGoMessages, onUnmatchStart, onUnmatchEnd }: { auth: Auth; onShowPremium: (r: string) => void; onNotifCount: (n: number) => void; onGoMessages?: (partnerId?: string) => void; onUnmatchStart?: () => void; onUnmatchEnd?: () => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [menuMatchId, setMenuMatchId] = useState<string | null>(null);
  const [confirmUnmatch, setConfirmUnmatch] = useState<Match | null>(null);
  const [confirmBlockMatch, setConfirmBlockMatch] = useState<Match | null>(null);
  const isUnmatching = useRef(false);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    setLoading(true);
    const res = await sb.query<Match>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&order=created_at.desc`);
    const enriched = await Promise.all(res.map(async m => {
      const pid = m.user1 === auth.userId ? m.user2 : m.user1;
      const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${pid}`);
      return { ...m, partner: profiles[0] };
    }));
    const seen = new Set<string>();
    const valid = enriched.filter(m => {
      if (!m.partner) return false;
      if (seen.has(m.partner.id)) return false;
      seen.add(m.partner.id);
      return true;
    });
    setMatches(valid);
    onNotifCount(valid.length);
    setLoading(false);
  };

  const handleUnmatch = async (m: Match) => {
    isUnmatching.current = true;
    if (onUnmatchStart) onUnmatchStart();

    const partnerId = m.partner?.id;
    const updated = matches.filter(x => x.id !== m.id && !(
      (x.user1 === auth.userId && x.user2 === partnerId) ||
      (x.user1 === partnerId && x.user2 === auth.userId)
    ));
    setMatches(updated);
    onNotifCount(updated.length);
    setConfirmUnmatch(null);
    setMenuMatchId(null);

    if (!partnerId) { isUnmatching.current = false; if (onUnmatchEnd) onUnmatchEnd(); return; }

    try {
      const [fwd, rev] = await Promise.all([
        sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${partnerId}&select=id`),
        sb.query<{ id: string }>(auth.token, "matches", `?user1=eq.${partnerId}&user2=eq.${auth.userId}&select=id`),
      ]);
      const allIds = [
        ...(Array.isArray(fwd) ? fwd.map(x => x.id) : []),
        ...(Array.isArray(rev) ? rev.map(x => x.id) : []),
        m.id,
      ].filter((id, i, arr) => id && arr.indexOf(id) === i);

      for (const id of allIds) {
        await sb.delete(auth.token, "messages", `?match_id=eq.${id}`);
      }
      await sb.delete(auth.token, "matches", `?user1=eq.${auth.userId}&user2=eq.${partnerId}`);
      await sb.delete(auth.token, "matches", `?user1=eq.${partnerId}&user2=eq.${auth.userId}`);
      await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}&to_user=eq.${partnerId}`);
      await sb.delete(auth.token, "likes", `?from_user=eq.${partnerId}&to_user=eq.${auth.userId}`);
    } catch {
      try {
        await sb.delete(auth.token, "messages", `?match_id=eq.${m.id}`);
        await sb.delete(auth.token, "matches", `?id=eq.${m.id}`);
      } catch {}
    } finally {
      setTimeout(() => {
        isUnmatching.current = false;
        if (onUnmatchEnd) onUnmatchEnd();
      }, 2000);
    }
  };

  const handleBlockMatch = async (m: Match) => {
    setConfirmBlockMatch(null);
    // Annuler le match d'abord (cascade complète)
    await handleUnmatch(m);
    // Bloquer la personne
    if (m.partner?.id) {
      try { await sb.insert(auth.token, "blocks", { blocker_id: auth.userId, blocked_id: m.partner.id }); } catch {}
    }
  };

  const p = selectedMatch?.partner;
  return <div style={{ padding: "12px 16px 16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Matchs</h2>
      <div onClick={() => setViewMode(v => v === "card" ? "list" : "card")} style={{ background: G.blanc, color: "#111", border: `2px solid ${G.gris}`, borderRadius: 50, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>{viewMode === "card" ? "≡ Liste" : "⊞ Carte"}</div>
    </div>
    {/* Overlay fermeture menu */}
    {menuMatchId && <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setMenuMatchId(null)} />}

    {loading ? <div style={{ textAlign: "center", padding: 40 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"pulse 1s ease-in-out infinite"}}><circle cx="12" cy="12" r="10"/></svg></div>
    : matches.length === 0 ? <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><p>Continue à liker des profils pour avoir des matchs !</p></div>
    : viewMode === "list" ? (
      <div>
        {matches.map(m => (
          <div key={m.id} className="card-hover" style={{ display: "flex", gap: 12, alignItems: "center", background: G.blanc, borderRadius: 16, padding: "12px", marginBottom: 10, boxShadow: "0 2px 12px rgba(44,26,14,0.07)", position: "relative" }}>
            <div onClick={() => setSelectedMatch(m)} style={{ width: 58, height: 58, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", cursor: "pointer" }}>
              {m.partner?.photo_url ? <img src={m.partner.photo_url} alt={m.partner?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}
            </div>
            <div onClick={() => setSelectedMatch(m)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{m.partner?.name}, {m.partner?.age} ans</div>
              <div style={{ fontSize: "0.78rem", color: "#555", marginTop: 2 }}>{m.partner?.city}{m.partner?.religion && <span style={{ marginLeft: 6 }}>· {m.partner.religion}</span>}</div>
              <div style={{ fontSize: "0.7rem", color: "#27ae60", fontWeight: 600, marginTop: 2 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</div>
            </div>
            {/* 3 traits */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div onClick={() => setMenuMatchId(menuMatchId === m.id ? null : m.id)} style={{ width: 36, height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", padding: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: "#555" }} />)}
              </div>
              {menuMatchId === m.id && (
                <div style={{ position: "absolute", right: 0, top: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.2)", zIndex: 200, minWidth: 190 }}>
                  <div onClick={() => { setMenuMatchId(null); setSelectedMatch(m); if (auth.isPremium && m.partner?.id) sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: m.partner.id }).catch(()=>{}); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Voir le profil
                  </div>
                  <div onClick={() => { setMenuMatchId(null); if (onGoMessages) onGoMessages(m.partner?.id); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Envoyer un message
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmBlockMatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Bloquer
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmUnmatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler le match
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {matches.map(m => (
          <div key={m.id} className="card-hover" style={{ background: G.blanc, borderRadius: 16, boxShadow: "0 3px 16px rgba(44,26,14,0.08)", position: "relative" }}>
            <div onClick={() => setSelectedMatch(m)} style={{ cursor: "pointer" }}>
              <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", overflow: "hidden" }}>
                {m.partner?.photo_url ? <img src={m.partner.photo_url} alt={m.partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "3rem" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>}
              </div>
              <div style={{ padding: "10px 10px 6px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.partner?.name}, {m.partner?.age} ans</div>
                <div style={{ fontSize: "0.72rem", color: "#555" }}>📌 {m.partner?.city}</div>
                <div style={{ fontSize: "0.68rem", color: "#27ae60", fontWeight: 600, marginTop: 3 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</div>
              </div>
            </div>
            {/* 3 traits en bas */}
            <div style={{ position: "relative", padding: "4px 10px 10px", display: "flex", justifyContent: "flex-end" }}>
              <div onClick={() => setMenuMatchId(menuMatchId === m.id ? null : m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", padding: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 16, height: 2, borderRadius: 2, background: "#aaa" }} />)}
              </div>
              {menuMatchId === m.id && (
                <div style={{ position: "absolute", right: 10, bottom: 42, background: G.blanc, borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.2)", zIndex: 200, minWidth: 190 }}>
                  <div onClick={() => { setMenuMatchId(null); setSelectedMatch(m); if (auth.isPremium && m.partner?.id) sb.insert(auth.token, "profile_views", { viewer_id: auth.userId, viewed_id: m.partner.id }).catch(()=>{}); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Voir le profil
                  </div>
                  <div onClick={() => { setMenuMatchId(null); if (onGoMessages) onGoMessages(m.partner?.id); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: G.vert, cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Envoyer un message
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmBlockMatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#1a1a1a", cursor: "pointer", borderBottom: "1px solid #F5F5F5", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    Bloquer
                  </div>
                  <div onClick={() => { setMenuMatchId(null); setConfirmUnmatch(m); }} style={{ padding: "13px 16px", fontSize: "0.88rem", fontWeight: 600, color: "#e74c3c", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Annuler le match
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {selectedMatch && p && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSelectedMatch(null)}>
      <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ height: 220, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
          {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
          <div onClick={() => setSelectedMatch(null)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontSize: "1rem", fontWeight: 700 }}>✕</div>
          <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
            <div style={{  fontSize: "1.5rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{p.name}, {p.age} ans</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{p.city}</div>
          </div>
        </div>
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="#27ae60" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Match !</span>
            {p.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>⭐ Premium</span>}
            {p.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: `1px solid rgba(212,168,67,0.3)`, color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{p.religion}</span>}
          </div>
          {p.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{p.bio}</p>}
          <Btn variant="primary" onClick={() => { const pid = selectedMatch?.partner?.id; setSelectedMatch(null); if (onGoMessages) onGoMessages(pid); }} style={{ width: "100%", fontSize: "1rem", padding: "14px" }}>Envoyer un message</Btn>
        </div>
      </div>
    </div>}

    {/* Modal confirmation annulation match */}
    {confirmUnmatch && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="2" y1="2" x2="22" y2="22"/></svg></div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Annuler le match avec {confirmUnmatch.partner?.name} ?</h3>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 24, lineHeight: 1.6 }}>La conversation et les messages seront supprimés. L'autre personne ne sera pas notifiée.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmUnmatch(null)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn variant="danger" onClick={() => handleUnmatch(confirmUnmatch)} style={{ flex: 1 }}>Confirmer</Btn>
          </div>
        </div>
      </div>
    )}

    {/* Modal confirmation blocage */}
    {confirmBlockMatch && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Bloquer {confirmBlockMatch.partner?.name} ?</h3>
          <p style={{ fontSize: "0.83rem", color: "#666", marginBottom: 22, lineHeight: 1.6 }}>Le match et la conversation seront supprimés. Cette personne ne pourra plus te voir ni te contacter.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setConfirmBlockMatch(null)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn variant="danger" onClick={() => handleBlockMatch(confirmBlockMatch)} style={{ flex: 1 }}>Bloquer</Btn>
          </div>
        </div>
      </div>
    )}
  </div>;
}

function getOnlineStatus(lastSeen?: string): { label: string; color: string } {
  if (!lastSeen) return { label: "Hors ligne", color: "#bbb" };
  const diff = (Date.now() - new Date(lastSeen).getTime()) / 1000 / 60; // en minutes
  if (diff < 2) return { label: "En ligne", color: "#27ae60" };
  if (diff < 10) return { label: `Vu il y a ${Math.floor(diff)} min`, color: "#f39c12" };
  if (diff < 60) return { label: `Vu il y a ${Math.floor(diff)} min`, color: "#bbb" };
  if (diff < 1440) return { label: `Vu il y a ${Math.floor(diff / 60)}h`, color: "#bbb" };
  return { label: `Vu il y a ${Math.floor(diff / 1440)}j`, color: "#bbb" };
}

function TickIcon({ read, isPremium, white = false }: { read: boolean; isPremium: boolean; white?: boolean }) {
  if (!isPremium) {
    // Gratuit : juste une coche grise
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={white ? "rgba(255,255,255,0.6)" : "#bbb"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  // Premium : double coche - grise si pas lu, bleue si lu
  const color = read ? "#4fc3f7" : (white ? "rgba(255,255,255,0.6)" : "#bbb");
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -5 }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}

const ReplyBanner = React.memo(function ReplyBanner({ replyTo, partnerName, myId, onCancel }: {
  replyTo: Message; partnerName?: string; myId: string; onCancel: () => void;
}) {
  const isMine = replyTo.sender_id === myId;
  const name = isMine ? "Toi" : (partnerName ?? "…");
  const accent = isMine ? G.vert : G.rouge;
  const isImg = replyTo.content.startsWith("[img]");
  const raw = replyTo.content.replace(/^\[↩.*?\]\n/, "");
  const preview = !isImg && raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "#F2F2F2", borderRadius: 14, marginBottom: 8, overflow: "hidden", border: `1px solid ${G.gris}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* Barre colorée gauche */}
      <div style={{ width: 5, flexShrink: 0, background: accent, borderRadius: "14px 0 0 14px" }} />
      {/* Icône ↩ */}
      <div style={{ display: "flex", alignItems: "center", paddingLeft: 10, paddingRight: 4, flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
        </svg>
      </div>
      {/* Texte */}
      <div style={{ flex: 1, padding: "8px 6px 8px 2px", minWidth: 0 }}>
        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: accent, marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: "0.78rem", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
          {isImg ? (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ color: "#888" }}>Photo</span>
            </span>
          ) : preview}
        </div>
      </div>
      {/* Miniature image */}
      {isImg && (
        <img src={replyTo.content.slice(5, -6)} alt="" style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0, alignSelf: "center", borderRadius: 8, margin: "0 6px" }} />
      )}
      {/* Bouton ✕ */}
      <div onClick={onCancel} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", cursor: "pointer", flexShrink: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

function Messages({ auth, onUnreadCount, onShowPremium, initialPartnerId }: { auth: Auth; onUnreadCount: (n: number) => void; onShowPremium: (r: string) => void; initialPartnerId?: string | null }) {
  const [convs, setConvs] = useState<Match[]>([]);
  const [open, setOpen] = useState<Match | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgCount, setMsgCount] = useState(0);
  const [showDeleteConv, setShowDeleteConv] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [moderationAlert, setModerationAlert] = useState<"insult" | "scam" | "sexual" | null>(null);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const openRef = useRef<Match | null>(null);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => {
    loadConvs().then(convList => {
      // Si on arrive depuis un match, ouvrir directement la bonne conversation
      if (initialPartnerId && convList) {
        const target = convList.find(c => c.partner?.id === initialPartnerId);
        if (target) setOpen(target);
      }
    });
  }, []);
  useEffect(() => { if (open) loadMsgs(open); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Realtime - écoute INSERT sur les messages (nouveaux messages)
  useEffect(() => {
    if (!open) return;
    const ws = sb.subscribeRealtime(auth.token, "messages", `match_id=eq.${open.id}`, async () => {
      const res = await sb.query<Message>(auth.token, "messages", `?match_id=eq.${open.id}&order=created_at.asc`);
      setMsgs(res.filter(m => !((m as any).deleted_for || []).includes(auth.userId)));
    });
    return () => { try { ws?.close(); } catch {} };
  }, [open?.id]);

  // Polling dédié toutes les 2s pour détecter les changements de is_read
  useEffect(() => {
    if (!open) return;
    const readInterval = setInterval(async () => {
      try {
        const res = await sb.query<Message>(auth.token, "messages", `?match_id=eq.${open.id}&order=created_at.asc`);
        const filtered = res.filter(m => !((m as any).deleted_for || []).includes(auth.userId));
        setMsgs(prev => {
          const hasChange = filtered.some((m, i) => prev[i]?.is_read !== m.is_read || prev[i]?.id !== m.id || prev[i]?.reactions !== m.reactions);
          return hasChange ? filtered : prev;
        });
      } catch {}
    }, 2000);
    return () => clearInterval(readInterval);
  }, [open?.id]);

  const loadConvs = async () => {
    setLoading(true);
    const res = await sb.query<Match>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})`);
    if (!res.length) { setConvs([]); onUnreadCount(0); setLoading(false); return []; }
    const enriched = await Promise.all(res.map(async m => {
      const pid = m.user1 === auth.userId ? m.user2 : m.user1;
      const [profiles, lastMsgs, unread] = await Promise.all([
        sb.query<Profile>(auth.token, "profiles", `?id=eq.${pid}`),
        sb.query<Message>(auth.token, "messages", `?match_id=eq.${m.id}&order=created_at.desc&limit=1`),
        sb.query<Message>(auth.token, "messages", `?match_id=eq.${m.id}&sender_id=neq.${auth.userId}&is_read=eq.false`),
      ]);
      return { ...m, partner: profiles[0], lastMsg: lastMsgs[0], unreadCount: unread.length };
    }));
    const filtered = enriched.filter(c => c.partner);
    // Dédupliquer par partner id
    const seenPartners = new Set<string>();
    const deduped = filtered.filter(c => {
      if (seenPartners.has(c.partner!.id)) return false;
      seenPartners.add(c.partner!.id);
      return true;
    });
    setConvs(deduped);
    onUnreadCount(deduped.reduce((s, c) => s + (c.unreadCount || 0), 0));
    setLoading(false);
    return deduped;
  };

  const loadMsgs = async (conv: Match) => {
    const res = await sb.query<Message>(auth.token, "messages", `?match_id=eq.${conv.id}&order=created_at.asc`);
    const visible = res.filter(m => !((m as any).deleted_for || []).includes(auth.userId));
    setMsgs(visible);
    setMsgCount(visible.filter(m => m.sender_id === auth.userId).length);
    // Marquer comme lu ET livré
    await sb.markMessagesRead(auth.token, conv.id, auth.userId);
    // Recharger après marquage lu
    const res2 = await sb.query<Message>(auth.token, "messages", `?match_id=eq.${conv.id}&order=created_at.asc`);
    setMsgs(res2.filter(m => !((m as any).deleted_for || []).includes(auth.userId)));
    loadConvs();
  };

  const deleteConv = async () => {
    if (!open) return;
    await sb.delete(auth.token, "messages", `?match_id=eq.${open.id}`);
    setShowDeleteConv(false); setOpen(null); loadConvs();
  };

  const send = async () => {
    if (!text.trim() || !open) return;
    // Modération : insultes, arnaques, contenu interdit
    const mod = moderateMessage(text);
    if (mod.blocked && mod.type) {
      setModerationAlert(mod.type);
      // ── Alerte système auto-mod : ce n'est PAS un signalement utilisateur contre un autre profil.
      // reported_id = null (alerte système sans cible).
      // Si la colonne reported_id n'accepte pas null, Supabase renverra une erreur catchée silencieusement.
      console.log(`[Moyo][AutoMod] Alerte système — type:${mod.type} auteur:${auth.userId}`);
      try {
        await sb.insert(auth.token, "reports", {
          reporter_id: auth.userId,
          reported_id: null,
          reason: `[AUTO-MOD ${mod.type.toUpperCase()}] ${text.substring(0, 100)}`,
          status: "pending",
        });
        console.log("[Moyo][AutoMod] ✅ Alerte système enregistrée");
      } catch (e: any) {
        // Si reported_id n'accepte pas null → log sans crasher, comportement conservé
        console.warn("[Moyo][AutoMod] ⚠️ Alerte non enregistrée (reported_id null non accepté ?) :", e?.message || e);
      }
      return;
    }
    if (!auth.isPremium && hasContactInfo(text)) { onShowPremium("Pour partager tes coordonnées, passe à Premium. Cela protège aussi ta sécurité !"); return; }
    if (!auth.isPremium && msgCount >= FREE_LIMITS.messages) { onShowPremium(`Tu as envoyé tes ${FREE_LIMITS.messages} messages gratuits avec ${open.partner?.name}. Passe Premium !`); return; }
    const prefix = replyTo ? `[↩ ${replyTo.sender_id === auth.userId ? "Toi" : open.partner?.name} : ${replyTo.content.startsWith("[img]") ? "Photo" : replyTo.content.substring(0, 60)}]\n` : "";
    const res = await sb.insert<Message>(auth.token, "messages", { match_id: open.id, sender_id: auth.userId, content: prefix + text, is_read: false });
    if (res[0]) { setMsgs(m => [...m, res[0]]); setMsgCount(c => c + 1); setText(""); setReplyTo(null); }
  };

  const sendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !open) return;
    if (!auth.isPremium) { onShowPremium("L'envoi de photos est réservé aux membres Premium !"); return; }
    setImgLoading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${auth.userId}/${Date.now()}.${ext}`;
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/messages/${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${auth.token}`, "Content-Type": file.type || "image/jpeg", "x-upsert": "true" },
        body: file,
      });
      if (r.ok) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/messages/${path}`;
        const content = `[img]${url}[/img]`;
        const res = await sb.insert<Message>(auth.token, "messages", { match_id: open.id, sender_id: auth.userId, content, is_read: false });
        if (res[0]) { setMsgs(m => [...m, res[0]]); setMsgCount(c => c + 1); }
      }
    } catch {}
    setImgLoading(false);
    e.target.value = "";
  };

  const isImage = (content: string) => content.startsWith("[img]") && content.endsWith("[/img]");
  const getImageUrl = (content: string) => content.slice(5, -6);

  const [showGift, setShowGift] = useState(false);

  if (open) return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: G.creme, zIndex: 100, maxWidth: 500, margin: "0 auto" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {moderationAlert && <ModerationModal type={moderationAlert} onClose={() => setModerationAlert(null)} />}
      {/* Header fixe */}
      <div style={{ padding: "10px 16px", background: G.blanc, borderBottom: `1px solid ${G.gris}`, display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        {/* Bouton retour cercle rouge */}
        <div onClick={() => { setOpen(null); loadConvs(); }} style={{ width: 38, height: 38, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 10px rgba(192,57,43,0.35)", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </div>
        <div onClick={() => setShowPartnerProfile(true)} style={{ cursor: "pointer" }}>
          <Avatar url={open.partner?.photo_url} gender={open.partner?.gender} size={38} premium={open.partner?.is_premium} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{open.partner?.name}</div>
          {(() => { const s = getOnlineStatus(open.partner?.last_seen); return <div style={{ fontSize: "0.7rem", color: s.color, fontWeight: 600 }}>● {s.label}</div>; })()}
        </div>
        {!auth.isPremium && <div style={{ fontSize: "0.7rem", color: "#555", background: G.creme, padding: "4px 8px", borderRadius: 50 }}>{Math.max(0, FREE_LIMITS.messages - msgCount)}/{FREE_LIMITS.messages} msg</div>}
        {/* Bouton cadeau - offrir Premium : visible UNIQUEMENT aux utilisateurs Premium */}
        {auth.isPremium && !open.partner?.is_premium && (
          <div onClick={() => setShowGift(true)} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(212,168,67,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Offrir Premium">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5" rx="1"/>
              <path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
        )}
        <div onClick={() => setShowDeleteConv(true)} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(180,60,60,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Supprimer la conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
      </div>

      {/* Modal Offrir Premium */}
      {showGift && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(212,168,67,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Offrir Premium à {open.partner?.name}</h3>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: 6, lineHeight: 1.6 }}>
              Offre 1 mois de Premium à <strong>{open.partner?.name}</strong> pour <strong style={{ color: G.rouge }}>3 500 FCFA</strong>.
            </p>
            <p style={{ fontSize: "0.78rem", color: "#aaa", marginBottom: 20, lineHeight: 1.5 }}>
              Tu seras redirigé vers notre service client pour finaliser le paiement via MTN MoMo ou Airtel MoMo.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setShowGift(false)} style={{ flex: 1 }}>Annuler</Btn>
              <a
                href={`https://wa.me/33753356471?text=Bonjour%2C%20je%20souhaite%20offrir%201%20mois%20de%20Premium%20%C3%A0%20${encodeURIComponent(open.partner?.name || "")}%20(${encodeURIComponent(open.partner?.age + " ans")}%2C%20${encodeURIComponent(open.partner?.city || "")})%20sur%20Moyo.%20ID%20du%20profil%20%3A%20${encodeURIComponent(open.partner?.id || "")}%20%7C%20Mon%20email%20%3A%20${encodeURIComponent(auth.email)}`}
                target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none" }}
                onClick={() => setShowGift(false)}
              >
                <Btn variant="gold" style={{ width: "100%" }}>Offrir 🎁</Btn>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Zone messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
        <img src="/msg-bg.png" alt="" style={{ position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, height: "calc(100% - 48px - 65px)", objectFit: "cover", objectPosition: "top", zIndex: 0, pointerEvents: "none", opacity: 1 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.length === 0 && <div style={{ textAlign: "center", color: "#555", padding: "24px 0", fontSize: "0.85rem" }}>Dites bonjour !</div>}
        {msgs.map((m, i) => {
          const isMine = m.sender_id === auth.userId;
          const isImg = isImage(m.content);
          const time = m.created_at ? new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
          const reactions = m.reactions || {};
          const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);
          const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
            // Empêcher la sélection de texte native au long press
            if (window.getSelection) window.getSelection()?.removeAllRanges();
            longPressTimer.current = setTimeout(() => {
              if (window.getSelection) window.getSelection()?.removeAllRanges();
              const touch = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
              setContextMenu({ msg: m, x: touch.clientX, y: touch.clientY });
            }, 500);
          };
          const handleLongPressEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
          return (
            <div key={i} className="msg-row" style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", marginBottom: reactionEntries.length > 0 ? 18 : 0 }}>
              {isImg ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, flexDirection: isMine ? "row-reverse" : "row" }}>
                  {/* Flèche contextuelle — même que les messages texte */}
                  <div className="msg-arrow" onClick={() => setContextMenu({ msg: m, x: 0, y: 0 })} style={{ marginTop: 8, cursor: "pointer", width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div
                    style={{ position: "relative", maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}
                    onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd} onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd}
                  >
                    <img src={getImageUrl(m.content)} alt="img" onClick={() => setPreviewImg(getImageUrl(m.content))} style={{ width: "100%", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: "pointer", display: "block" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                      <span style={{ fontSize: "0.62rem", color: "#aaa" }}>{time}</span>
                      {isMine && <TickIcon read={m.is_read} isPremium={auth.isPremium} />}
                    </div>
                    {/* Badges réactions sous l'image — identique aux messages texte */}
                    {reactionEntries.length > 0 && (
                      <div style={{ position: "absolute", bottom: -18, [isMine ? "right" : "left"]: 4, display: "flex", gap: 3 }}>
                        {reactionEntries.map(([emoji, users]) => (
                          <div key={emoji} onClick={async () => {
                            if (!m.id) return;
                            const current = m.reactions || {};
                            const usersOnThis = (current[emoji] || []) as string[];
                            const hasReacted = usersOnThis.includes(auth.userId);
                            const cleaned: Record<string, string[]> = {};
                            for (const [e, us] of Object.entries(current)) {
                              cleaned[e] = (us as string[]).filter((u: string) => u !== auth.userId);
                            }
                            const base: string[] = cleaned[emoji] || [];
                            const updated = hasReacted ? base : [...base, auth.userId];
                            const newReactions = { ...cleaned, [emoji]: updated };
                            await sb.update(auth.token, "messages", m.id, { reactions: newReactions });
                            setMsgs(prev => prev.map(msg => msg.id === m.id ? { ...msg, reactions: newReactions } : msg));
                          }} style={{ background: G.blanc, borderRadius: 50, padding: "2px 6px", fontSize: "0.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, border: `1px solid ${G.gris}` }}>
                            {emoji}<span style={{ fontSize: "0.65rem", color: "#555", fontWeight: 600 }}>{users.length > 1 ? users.length : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, flexDirection: isMine ? "row-reverse" : "row" }}>
                  {/* Flèche */}
                  <div className="msg-arrow" onClick={() => setContextMenu({ msg: m, x: 0, y: 0 })} style={{ marginTop: 8, cursor: "pointer", width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div style={{ position: "relative", maxWidth: "72%" }}>
                    <div
                      style={{ background: isMine ? G.rouge : G.blanc, color: isMine ? G.blanc : G.brun, padding: "10px 14px", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: "0.88rem", lineHeight: 1.5, userSelect: "none", WebkitUserSelect: "none" }}
                      onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd} onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd}
                    >
                      {(() => {
                        const replyMatch = m.content.match(/^\[↩ (.+?) : (.+?)\]\n([\s\S]*)$/);
                        if (replyMatch) {
                          const [, who, quoted, body] = replyMatch;
                          const isPhoto = quoted === "Photo";
                          return <>
                            <div style={{ background: isMine ? "rgba(0,0,0,0.18)" : "rgba(192,57,43,0.07)", borderRadius: 8, marginBottom: 6, overflow: "hidden", display: "flex" }}>
                              {/* Barre colorée gauche */}
                              <div style={{ width: 3, flexShrink: 0, background: isMine ? "rgba(255,255,255,0.6)" : G.rouge }} />
                              {/* Texte cité */}
                              <div style={{ flex: 1, padding: "5px 8px", minWidth: 0 }}>
                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: isMine ? "rgba(255,255,255,0.9)" : G.rouge, marginBottom: 2 }}>{who}</div>
                                <div style={{ fontSize: "0.75rem", color: isMine ? "rgba(255,255,255,0.7)" : "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                                  {isPhoto && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                                  {quoted}
                                </div>
                              </div>
                            </div>
                            <span>{body}</span>
                          </>;
                        }
                        return <span>{m.content}</span>;
                      })()}
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        <span style={{ fontSize: "0.62rem", color: isMine ? "rgba(255,255,255,0.65)" : "#bbb" }}>{time}</span>
                        {isMine && <TickIcon read={m.is_read} isPremium={auth.isPremium} white />}
                      </div>
                    </div>
                    {/* Badges réactions sous la bulle */}
                    {reactionEntries.length > 0 && (
                      <div style={{ position: "absolute", bottom: -18, [isMine ? "right" : "left"]: 4, display: "flex", gap: 3 }}>
                        {reactionEntries.map(([emoji, users]) => (
                          <div key={emoji} onClick={async () => {
                            if (!m.id) return;
                            const current = m.reactions || {};
                            const usersOnThis = (current[emoji] || []) as string[];
                            const hasReacted = usersOnThis.includes(auth.userId);
                            // Retirer l'userId de TOUTES les réactions (une seule autorisée)
                            const cleaned: Record<string, string[]> = {};
                            for (const [e, us] of Object.entries(current)) {
                              cleaned[e] = (us as string[]).filter((u: string) => u !== auth.userId);
                            }
                            // Toggle : retire si déjà posé, sinon ajoute
                            const base: string[] = cleaned[emoji] || [];
                            const updated = hasReacted ? base : [...base, auth.userId];
                            const newReactions = { ...cleaned, [emoji]: updated };
                            await sb.update(auth.token, "messages", m.id, { reactions: newReactions });
                            setMsgs(prev => prev.map(msg => msg.id === m.id ? { ...msg, reactions: newReactions } : msg));
                          }} style={{ background: G.blanc, borderRadius: 50, padding: "2px 6px", fontSize: "0.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, border: `1px solid ${G.gris}` }}>
                            {emoji}<span style={{ fontSize: "0.65rem", color: "#555", fontWeight: 600 }}>{users.length > 1 ? users.length : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Barre d'envoi */}
      <div style={{ padding: "10px 12px", background: G.blanc, borderTop: `1px solid ${G.gris}`, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {/* Bandeau répondre style WhatsApp */}
        {replyTo && <ReplyBanner replyTo={replyTo} partnerName={open?.partner?.name} myId={auth.userId} onCancel={() => setReplyTo(null)} />}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Bouton image - Premium */}
          <input ref={imgRef} type="file" accept="image/*" onChange={sendImage} style={{ display: "none" }} />
          <div onClick={() => auth.isPremium ? imgRef.current?.click() : onShowPremium("L'envoi de photos est réservé aux membres Premium !")}
            style={{ width: 40, height: 40, borderRadius: "50%", background: auth.isPremium ? "rgba(192,57,43,0.08)" : "#F5F5F5", border: `1.5px solid ${auth.isPremium ? "rgba(192,57,43,0.25)" : "#E0E0E0"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            {imgLoading ? <span style={{ fontSize: "0.8rem" }}>⏳</span> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={auth.isPremium ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Écris un message..." style={{ flex: 1, minWidth: 0, padding: "11px 14px", border: `2px solid ${G.gris}`, borderRadius: 50, fontSize: "16px", outline: "none", background: G.creme }} />
          <div onClick={send} style={{ width: 44, height: 44, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
        </div>
      </div>

      {/* Menu contextuel style WhatsApp */}
      {contextMenu && (
        <div onClick={() => setContextMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: "88%", maxWidth: 340, userSelect: "none", WebkitUserSelect: "none" }}>
            {/* Barre emojis réactions */}
            <div style={{ background: G.blanc, borderRadius: 50, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-around", marginBottom: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              {["👍","❤️","😂","😮","😢","🙏"].map(emoji => {
                const hasReacted = (contextMenu.msg.reactions?.[emoji] || []).includes(auth.userId);
                return (
                  <div key={emoji} onClick={async () => {
                    const msgId = contextMenu.msg.id;
                    if (!msgId) return;
                    const current = contextMenu.msg.reactions || {};
                    // Retirer l'userId de TOUTES les réactions (une seule autorisée)
                    const cleaned: Record<string, string[]> = {};
                    for (const [e, us] of Object.entries(current)) {
                      cleaned[e] = (us as string[]).filter((u: string) => u !== auth.userId);
                    }
                    // Toggle : retire si déjà posé, sinon ajoute
                    const base: string[] = cleaned[emoji] || [];
                    const updated = hasReacted ? base : [...base, auth.userId];
                    const newReactions = { ...cleaned, [emoji]: updated };
                    await sb.update(auth.token, "messages", msgId, { reactions: newReactions });
                    setMsgs(prev => prev.map(msg => msg.id === msgId ? { ...msg, reactions: newReactions } : msg));
                    setContextMenu(null);
                  }} style={{ fontSize: hasReacted ? "1.8rem" : "1.5rem", cursor: "pointer", transition: "font-size 0.15s", filter: hasReacted ? "drop-shadow(0 0 4px rgba(192,57,43,0.5))" : "none", padding: "2px" }}>
                    {emoji}
                  </div>
                );
              })}
            </div>
            {/* Actions */}
            <div style={{ background: G.blanc, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              <div onClick={() => { const msg = contextMenu!.msg; setContextMenu(null); setTimeout(() => setReplyTo(msg), 0); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", cursor: "pointer", borderBottom: `1px solid ${G.gris}` }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 600, color: G.brun }}>Répondre</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
              </div>
              <div onClick={async () => {
                const msgId = contextMenu.msg.id;
                setContextMenu(null);
                if (!msgId) return;
                await sb.delete(auth.token, "messages", `?id=eq.${msgId}`);
                setMsgs(prev => prev.filter(msg => msg.id !== msgId));
                setToast({ msg: "Message supprimé pour tout le monde", type: "success" });
              }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", cursor: "pointer", borderBottom: `1px solid ${G.gris}` }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#e74c3c" }}>Supprimer pour tous</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div onClick={async () => {
                const msgId = contextMenu.msg.id;
                const currentDeletedFor: string[] = (contextMenu.msg as any).deleted_for || [];
                setContextMenu(null);
                if (!msgId) return;
                // Masquer immédiatement dans le state local
                setMsgs(prev => prev.filter(msg => msg.id !== msgId));
                // Persister dans Supabase — ajouter userId dans deleted_for sans écraser
                const updatedDeletedFor = currentDeletedFor.includes(auth.userId)
                  ? currentDeletedFor
                  : [...currentDeletedFor, auth.userId];
                await sb.update(auth.token, "messages", msgId, { deleted_for: updatedDeletedFor });
                setToast({ msg: "Message supprimé pour vous", type: "success" });
              }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", cursor: "pointer" }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "#888" }}>Supprimer pour moi</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
            </div>
            {/* Annuler */}
            <div onClick={() => setContextMenu(null)} style={{ background: G.blanc, borderRadius: 14, padding: "15px 20px", textAlign: "center", marginTop: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.92rem", color: G.rouge, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
              Annuler
            </div>
          </div>
        </div>
      )}

      {/* Modal aperçu image */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setPreviewImg(null)} style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", color: "#fff" }}>✕</div>
          <img src={previewImg} alt="aperçu" onClick={e => e.stopPropagation()} style={{ maxWidth: "95%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
        </div>
      )}

      {/* Modal suppression */}
      {showDeleteConv && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>Supprimer la conversation ?</h3>
          <p style={{ fontSize: "0.88rem", color: "#666", marginBottom: 20, lineHeight: 1.6 }}>Tous les messages seront supprimés. Cette action est irréversible.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setShowDeleteConv(false)} style={{ flex: 1 }}>Annuler</Btn>
            <Btn variant="danger" onClick={deleteConv} style={{ flex: 1 }}>Supprimer</Btn>
          </div>
        </div>
      </div>}

      {/* Modal profil partenaire */}
      {showPartnerProfile && open.partner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowPartnerProfile(false)}>
          <div style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 270, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", position: "relative", overflow: "hidden" }}>
              {open.partner.photo_url
                ? <img src={open.partner.photo_url} alt={open.partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              }
              <div onClick={() => setShowPartnerProfile(false)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, fontWeight: 700 }}>✕</div>
              <div style={{ position: "absolute", bottom: 14, left: 16, color: G.blanc }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{open.partner.name}, {open.partner.age} ans</div>
                <div style={{ fontSize: "0.82rem", opacity: 0.9 }}>{open.partner.city}</div>
              </div>
            </div>
            <div style={{ padding: "18px 20px 32px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ background: "rgba(192,57,43,0.08)", color: G.rouge, borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>{open.partner.gender}</span>
                {open.partner.religion && <span style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem" }}>{open.partner.religion}</span>}
                {open.partner.is_premium && <span style={{ background: "rgba(212,168,67,0.12)", color: "#555", borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>Premium</span>}
              </div>
              {open.partner.bio && <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.6 }}>{open.partner.bio}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <div style={{ padding: "12px 16px 16px" }}>
    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 16 }}>Messages</h2>
    {loading ? <div style={{ textAlign: "center", padding: 40 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"pulse 1s ease-in-out infinite"}}><circle cx="12" cy="12" r="10"/></svg></div> : convs.length === 0
      ? <div style={{ textAlign: "center", padding: "50px 20px", color: "#555" }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><p style={{ fontSize: "0.85rem" }}>Fais des matchs pour commencer à discuter !</p></div>
      : convs.map(c => (
        <div key={c.id} onClick={() => {
          // Réinitialiser le badge immédiatement dans l'état local
          setConvs(prev => prev.map(x => x.id === c.id ? { ...x, unreadCount: 0 } : x));
          onUnreadCount(convs.reduce((s, x) => s + (x.id === c.id ? 0 : (x.unreadCount || 0)), 0));
          setOpen(c);
        }} className="card-hover" style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px", background: (c.unreadCount || 0) > 0 ? "rgba(192,57,43,0.03)" : G.blanc, borderRadius: 14, marginBottom: 8, cursor: "pointer", border: (c.unreadCount || 0) > 0 ? `1px solid rgba(192,57,43,0.1)` : "1px solid transparent" }}>
          <Avatar url={c.partner?.photo_url} gender={c.partner?.gender} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ fontWeight: (c.unreadCount || 0) > 0 ? 700 : 600, fontSize: "0.92rem", color: (c.unreadCount || 0) > 0 ? "#1a1a1a" : G.brun, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{c.partner?.name}</div>
              {(() => { const s = getOnlineStatus(c.partner?.last_seen); return s.label === "En ligne" ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27ae60", flexShrink: 0 }} /> : null; })()}
            </div>
            <div style={{ fontSize: "0.82rem", color: (c.unreadCount || 0) > 0 ? G.rouge : "#555", fontWeight: (c.unreadCount || 0) > 0 ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.lastMsg?.content?.startsWith("[img]") ? "Photo" : c.lastMsg?.content || "Dis bonjour !"}
            </div>
          </div>
          {(c.unreadCount || 0) > 0 && (
            <div style={{ background: G.rouge, color: G.blanc, borderRadius: "50%", minWidth: 22, height: 22, padding: "0 5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
              {(c.unreadCount || 0) > 9 ? "9+" : c.unreadCount}
            </div>
          )}
        </div>
      ))
    }
  </div>;
}

function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (blob: Blob) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef2 = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const SIZE = 280;

  // Tout l'état de transform dans des refs pour éviter les re-renders pendant le drag/pinch
  const stateRef = useRef({ scale: 1, minScale: 1, offset: { x: 0, y: 0 } });
  const [scale, setScaleUI] = useState(1);         // uniquement pour le slider
  const [dragging, setDragging] = useState(false);

  // Refs pour drag
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Refs pour pinch
  const pinchingRef = useRef(false);
  const lastPinchDistRef = useRef(0);
  const lastPinchMidRef = useRef({ x: 0, y: 0 });

  // ── Init image ──
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      stateRef.current = { scale: s, minScale: s, offset: { x: (SIZE - img.width * s) / 2, y: (SIZE - img.height * s) / 2 } };
      setScaleUI(s);
      draw();
    };
    img.src = src;
  }, [src]);

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const img = imgRef2.current; if (!img || !img.complete) return;
    const { scale, offset } = stateRef.current;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, offset.x, offset.y, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.restore();
  };

  // ── Zoom centré sur un point (pinch mid ou centre) ──
  const applyZoom = (newScale: number, pivotX: number, pivotY: number) => {
    const { scale: oldScale, minScale, offset } = stateRef.current;
    const clamped = Math.min(Math.max(newScale, minScale), minScale * 4);
    // Zoom centré sur le pivot : on translate pour garder le point sous les doigts
    const ratio = clamped / oldScale;
    const newOffsetX = pivotX - (pivotX - offset.x) * ratio;
    const newOffsetY = pivotY - (pivotY - offset.y) * ratio;
    stateRef.current = { scale: clamped, minScale, offset: { x: newOffsetX, y: newOffsetY } };
    setScaleUI(clamped);
    draw();
  };

  // ── Attacher les touch events en non-passif ──
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        // Drag simple
        pinchingRef.current = false;
        draggingRef.current = true;
        setDragging(true);
        const t = e.touches[0];
        dragStartRef.current = { x: t.clientX - stateRef.current.offset.x, y: t.clientY - stateRef.current.offset.y };
      } else if (e.touches.length === 2) {
        // Pinch
        draggingRef.current = false;
        pinchingRef.current = true;
        const t0 = e.touches[0]; const t1 = e.touches[1];
        lastPinchDistRef.current = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        lastPinchMidRef.current = {
          x: (t0.clientX + t1.clientX) / 2 - el.getBoundingClientRect().left,
          y: (t0.clientY + t1.clientY) / 2 - el.getBoundingClientRect().top,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && draggingRef.current) {
        const t = e.touches[0];
        stateRef.current = { ...stateRef.current, offset: { x: t.clientX - dragStartRef.current.x, y: t.clientY - dragStartRef.current.y } };
        draw();
      } else if (e.touches.length === 2 && pinchingRef.current) {
        const t0 = e.touches[0]; const t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const mid = {
          x: (t0.clientX + t1.clientX) / 2 - el.getBoundingClientRect().left,
          y: (t0.clientY + t1.clientY) / 2 - el.getBoundingClientRect().top,
        };
        if (lastPinchDistRef.current > 0) {
          const ratio = dist / lastPinchDistRef.current;
          applyZoom(stateRef.current.scale * ratio, mid.x, mid.y);
        }
        lastPinchDistRef.current = dist;
        lastPinchMidRef.current = mid;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        draggingRef.current = false;
        pinchingRef.current = false;
        setDragging(false);
      } else if (e.touches.length === 1) {
        // Passage de pinch → drag : réinitialise l'ancre drag
        pinchingRef.current = false;
        draggingRef.current = true;
        const t = e.touches[0];
        dragStartRef.current = { x: t.clientX - stateRef.current.offset.x, y: t.clientY - stateRef.current.offset.y };
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // ── Mouse drag (desktop) ──
  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    draggingRef.current = true;
    setDragging(true);
    dragStartRef.current = { x: e.clientX - stateRef.current.offset.x, y: e.clientY - stateRef.current.offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    stateRef.current = { ...stateRef.current, offset: { x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y } };
    draw();
  };
  const onMouseUp = () => { draggingRef.current = false; setDragging(false); };

  // ── Scroll wheel zoom (desktop) ──
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pivotX = e.clientX - rect.left;
    const pivotY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    applyZoom(stateRef.current.scale * delta, pivotX, pivotY);
  };

  // ── Slider ──
  const onSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    applyZoom(newScale, SIZE / 2, SIZE / 2);
  };

  // ── Export ──
  const handleConfirm = () => {
    const img = imgRef2.current; if (!img || !img.complete) return;
    const EXPORT_SIZE = 1200;
    const ratio = EXPORT_SIZE / SIZE;
    const { scale, offset } = stateRef.current;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;
    const ctx = exportCanvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(img, offset.x * ratio, offset.y * ratio, img.naturalWidth * scale * ratio, img.naturalHeight * scale * ratio);
    exportCanvas.toBlob(blob => { if (blob) onConfirm(blob); }, "image/jpeg", 0.95);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: G.blanc, borderRadius: 24, padding: "24px 20px", width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6, color: "#111" }}>Cadrer ta photo</div>
        <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 16 }}>Glisse pour repositionner · Pince pour zoomer</div>
        <div ref={canvasContainerRef} style={{ position: "relative", width: SIZE, height: SIZE, margin: "0 auto 16px", borderRadius: 16, overflow: "hidden", background: "#e0e0e0", cursor: dragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}
        >
          <img ref={imgRef2} src={src} alt="" onLoad={draw} style={{ display: "none" }} />
          <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ display: "block" }} />
          {/* Overlay : rectangle carte + grille des tiers + cercle avatar */}
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", width: "100%", height: "100%" }} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {(() => {
              const rW = SIZE;
              const rH = Math.round(SIZE * (270 / 358));
              const rX = 0;
              const rY = Math.round((SIZE - rH) / 2);
              return <>
                <rect x={0} y={0} width={SIZE} height={rY} fill="rgba(0,0,0,0.35)" />
                <rect x={0} y={rY + rH} width={SIZE} height={SIZE - rY - rH} fill="rgba(0,0,0,0.35)" />
                <rect x={rX} y={rY} width={rW} height={rH} fill="none" stroke={G.or} strokeWidth="2" strokeDasharray="6 3" />
                <line x1={rW/3} y1={rY} x2={rW/3} y2={rY+rH} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                <line x1={rW*2/3} y1={rY} x2={rW*2/3} y2={rY+rH} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                <line x1={0} y1={rY+rH/3} x2={rW} y2={rY+rH/3} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                <line x1={0} y1={rY+rH*2/3} x2={rW} y2={rY+rH*2/3} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
                <circle cx={SIZE/2} cy={SIZE/2} r={SIZE*0.28} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" />
              </>;
            })()}
          </svg>
        </div>
        {/* Légende */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 14, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.7rem", color: "#555" }}>
            <svg width="14" height="9" viewBox="0 0 14 9"><rect x="1" y="1" width="12" height="7" fill="none" stroke={G.or} strokeWidth="1.5" strokeDasharray="3 1.5"/></svg>
            Zone carte
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.7rem", color: "#555" }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="#555" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
            Avatar rond
          </div>
        </div>
        <input type="range" min={stateRef.current.minScale} max={stateRef.current.minScale * 4} step={0.01} value={scale}
          onChange={onSliderChange}
          style={{ width: "100%", marginBottom: 18, accentColor: G.rouge }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Annuler</Btn>
          <Btn variant="primary" onClick={handleConfirm} style={{ flex: 2 }}>Confirmer</Btn>
        </div>
      </div>
    </div>
  );
}

function Profile({ auth, onLogout, onShowPremium, darkMode, onToggleDark }: { auth: Auth; onLogout: () => void; onShowPremium: (r: string) => void; darkMode?: boolean; onToggleDark?: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; blocked_id: string; profile?: Profile }>>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"card" | "list">("card");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); loadBlocked(); }, []);
  const loadProfile = async () => {
    const res = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}`);
    if (res[0]) { setProfile(res[0]); setForm(res[0]); }
    setLoading(false);
  };
  const loadBlocked = async () => {
    const blocks = await sb.query<{ id: string; blocked_id: string }>(auth.token, "blocks", `?blocker_id=eq.${auth.userId}`);
    if (!blocks.length) { setBlockedUsers([]); return; }
    const enriched = await Promise.all(blocks.map(async b => {
      const profiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${b.blocked_id}`);
      return { ...b, profile: profiles[0] };
    }));
    setBlockedUsers(enriched);
  };
  const handleUnblock = async (blockId: string) => {
    await sb.delete(auth.token, "blocks", `?id=eq.${blockId}`);
    setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
    setToast({ msg: "Utilisateur débloqué" });
  };
  const saveProfile = async () => {
    if (form.age && (form.age < 18 || form.age > 99)) { setErrorMsg("Vous devez avoir entre 18 et 99 ans. Modification refusée."); return; }
    await sb.update(auth.token, "profiles", auth.userId, { name: form.name, age: form.age, city: form.city, bio: form.bio, religion: form.religion });
    setProfile(p => p ? { ...p, ...(form as Profile) } : null);
    setEditing(false);
    setToast({ msg: "Profil mis à jour !" });
  };

  // Ouvrir le crop avant d'uploader
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setUploadLoading(true);
    const ext = pendingFile?.name.split(".").pop()?.toLowerCase() || "jpg";
    const croppedFile = new File([blob], `avatar.${ext}`, { type: "image/jpeg" });
    const url = await sb.uploadPhoto(auth.token, auth.userId, croppedFile);
    if (url) { await sb.update(auth.token, "profiles", auth.userId, { photo_url: url }); setProfile(p => p ? { ...p, photo_url: url } : null); setToast({ msg: "Photo mise à jour !" }); }
    else setErrorMsg("Erreur lors du téléchargement de la photo. Réessaie.");
    setUploadLoading(false);
    setPendingFile(null);
  };
  const handleDelete = async () => {
    await sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}`);
    await sb.delete(auth.token, "likes", `?to_user=eq.${auth.userId}`);
    await sb.rpc(auth.token, "delete_user");
    await sb.signOut(auth.token);
    onLogout();
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
  </div>;

  /* ── CROP MODAL ── */
  if (cropSrc) return <CropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={() => { setCropSrc(null); setPendingFile(null); }} />;

  /* ── FORMULAIRE EDITION ── */
  if (editing) return (
    <div style={{ paddingBottom: 30 }}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header édition */}
      <div style={{ background: G.blanc, borderBottom: `1px solid ${G.gris}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div onClick={() => setEditing(false)} style={{ cursor: "pointer", color: "#555", fontSize: "1.1rem" }}>←</div>
        <div style={{  fontWeight: 700, fontSize: "1.1rem", color: "#111" }}>Modifier mon profil</div>
      </div>
      <div style={{ padding: "20px 16px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Prénom</label>
        <input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", fontFamily: "inherit" }} />
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Âge</label>
        <input type="number" value={form.age || ""} min={18} max={99} onChange={e => setForm(f => ({ ...f, age: parseInt(e.target.value) }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", fontFamily: "inherit" }} />
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Ville</label>
        <select value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", background: G.blanc, color: "#111", fontFamily: "inherit" }}>
          {VILLES.map(c => c.startsWith("──") ? <option key={c} disabled>{c}</option> : <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Religion</label>
        <select value={form.religion || ""} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", background: G.blanc, color: "#111", fontFamily: "inherit" }}>
          <option value="">Religion (optionnel)</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Bio</label>
        <textarea value={form.bio || ""} onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, 160) }))} rows={3} maxLength={160} style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 4, fontSize: "0.93rem", resize: "none", fontFamily: "inherit" }} />
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: (form.bio || "").length >= 150 ? G.rouge : "#aaa", marginBottom: 16 }}>{(form.bio || "").length}/160</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setEditing(false)} style={{ flex: 1 }}>Annuler</Btn>
          <Btn variant="primary" onClick={saveProfile} style={{ flex: 2 }}>Sauvegarder ✓</Btn>
        </div>
      </div>
    </div>
  );

  /* ── VUE PROFIL (style Tinder) ── */
  const isVisible = profile?.is_visible !== false;

  return (
    <div style={{ paddingBottom: 30, background: "#EEEEF2", minHeight: "100%" }}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />

      {/* ── ZONE BLANCHE : photo + nom + boutons ── */}
      <div style={{ background: G.blanc, textAlign: "center", paddingTop: 32, paddingBottom: 8 }}>

        {/* Photo ronde */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: `conic-gradient(${G.rouge} 0% 100%, ${G.gris} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 32px rgba(192,57,43,0.25)` }}>
            <div style={{ width: 108, height: 108, borderRadius: "50%", overflow: "hidden", background: G.gris, border: `3px solid ${G.blanc}` }}>
              <Avatar url={profile?.photo_url} gender={profile?.gender} size={108} premium={profile?.is_premium} />
            </div>
          </div>
          {profile?.is_premium ? (
            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${G.or},#B8860B)`, borderRadius: 50, padding: "4px 14px", fontSize: "0.68rem", fontWeight: 700, color: "#111", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(212,168,67,0.4)" }}>Premium</div>
          ) : (
            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, borderRadius: 50, padding: "4px 14px", fontSize: "0.68rem", fontWeight: 700, color: G.blanc, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(192,57,43,0.35)" }}>Gratuit</div>
          )}
        </div>

        {/* Nom + infos */}
        <div style={{ marginTop: 16, paddingBottom: 20, paddingLeft: 16, paddingRight: 16, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em", marginBottom: 10 }}>
            {profile?.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F2F2F2", borderRadius: 50, padding: "5px 13px", fontSize: "0.78rem", fontWeight: 600, color: "#333" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {profile?.age} ans
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F2F2F2", borderRadius: 50, padding: "5px 13px", fontSize: "0.78rem", fontWeight: 600, color: "#333" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {profile?.gender}
            </span>
            {profile?.city && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F2F2F2", borderRadius: 50, padding: "5px 13px", fontSize: "0.78rem", fontWeight: 600, color: "#333" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {profile.city}
              </span>
            )}
            {profile?.religion && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F2F2F2", borderRadius: 50, padding: "5px 13px", fontSize: "0.78rem", fontWeight: 600, color: "#333" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {profile.religion}
              </span>
            )}
          </div>
          {profile?.bio && (
            <div style={{ display: "inline-block", background: "rgba(0,0,0,0.04)", borderRadius: 14, padding: "10px 18px", maxWidth: 280 }}>
              <div style={{ fontSize: "0.85rem", color: "#555", fontStyle: "italic", lineHeight: 1.6 }}>"{profile.bio}"</div>
            </div>
          )}
        </div>

        {/* 4 Boutons : extérieurs au niveau normal, centraux descendent sur la vague */}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }}>
            {/* Modifier mon profil — niveau normal */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flex: 1 }} onClick={() => setEditing(true)}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Modifier mon<br/>profil</div>
            </div>

            {/* Modifier ma photo — descend sur la vague */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flex: 1, transform: "translateY(18px)" }} onClick={() => fileRef.current?.click()}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(192,57,43,0.4)", position: "relative" }}>
                {uploadLoading ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                )}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderRadius: "50%", background: G.blanc, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                  <span style={{ fontSize: "0.65rem", color: G.rouge, fontWeight: 900, lineHeight: 1 }}>+</span>
                </div>
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Modifier ma<br/>photo</div>
            </div>

            {/* Liste noire — descend sur la vague */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flex: 1, transform: "translateY(18px)" }} onClick={() => setShowBlocked(true)}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", position: "relative" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                {blockedUsers.length > 0 && (
                  <div style={{ position: "absolute", top: -2, right: -2, background: G.rouge, color: G.blanc, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, border: `2px solid ${G.blanc}` }}>{blockedUsers.length}</div>
                )}
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Liste<br/>noire</div>
            </div>

            {/* Voir mon profil — niveau normal */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flex: 1 }} onClick={() => setShowPreview(true)}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(26,92,58,0.35)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Voir mon<br/>profil</div>
            </div>
        </div>
      </div>

      {/* ── MODAL APERÇU PROFIL ── */}
      {showPreview && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#EEEEF2", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: G.blanc, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${G.gris}`, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1a1a1a" }}>Aperçu de mon profil</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", background: G.gris, borderRadius: 50, padding: 3, gap: 2 }}>
                  {(["card","list"] as const).map(m => (
                    <div key={m} onClick={() => setPreviewMode(m)} style={{ padding: "4px 12px", borderRadius: 50, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", background: previewMode === m ? G.blanc : "transparent", color: previewMode === m ? G.rouge : "#888", boxShadow: previewMode === m ? "0 2px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                      {m === "card" ? "Carte" : "Liste"}
                    </div>
                  ))}
                </div>
                <div onClick={() => setShowPreview(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.3rem", lineHeight: 1 }}>✕</div>
              </div>
            </div>

            {/* Contenu aperçu */}
            <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px 8px" }}>
              {previewMode === "card" ? (
                <div style={{ background: G.blanc, borderRadius: 18, boxShadow: "0 4px 20px rgba(44,26,14,0.1)", overflow: "hidden" }}>
                  <div style={{ height: 220, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {profile.photo_url
                      ? <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "1.1rem", fontWeight: 700, color: "#111", marginBottom: 6 }}>
                      {profile.name}, {profile.age} ans
                      {profile.is_premium && <svg width="14" height="14" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                      {profile.is_verified && <VerifiedBadge size={16} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ background: profile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: profile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 600 }}>{profile.gender === "Femme" ? "Femme" : "Homme"}</span>
                      <span style={{ fontSize: "0.75rem", color: "#555" }}>{profile.city}</span>
                      {profile.religion && <span style={{ background: "rgba(212,168,67,0.12)", border: `1px solid rgba(212,168,67,0.35)`, borderRadius: 50, padding: "2px 7px", fontSize: "0.68rem", color: "#555" }}>{profile.religion}</span>}
                    </div>
                    {profile.bio && <p style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.4 }}>{profile.bio}</p>}
                    <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center", paddingTop: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.35 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                      </div>
                      <div style={{ width: 56, height: 56, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.35 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.35 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: G.blanc, borderRadius: 14, padding: "12px", boxShadow: "0 2px 12px rgba(44,26,14,0.07)", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "linear-gradient(160deg,#E8C5A0,#C47A4A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {profile.photo_url
                      ? <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", display: "flex", alignItems: "center", gap: 5 }}>
                      {profile.name}, {profile.age} ans
                      {profile.is_premium && <svg width="13" height="13" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                      {profile.is_verified && <VerifiedBadge size={14} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                      <span style={{ background: profile.gender === "Femme" ? "rgba(233,30,140,0.08)" : "rgba(26,110,245,0.08)", color: profile.gender === "Femme" ? "#e91e8c" : "#1a6ef5", borderRadius: 50, padding: "1px 7px", fontSize: "0.65rem", fontWeight: 600 }}>{profile.gender === "Femme" ? "Femme" : "Homme"}</span>
                      <span style={{ fontSize: "0.75rem", color: "#555" }}>{profile.city}</span>
                      {profile.religion && <span style={{ fontSize: "0.7rem", color: "#555" }}>· {profile.religion}</span>}
                    </div>
                    {profile.bio && <div style={{ fontSize: "0.75rem", color: "#555", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.bio}</div>}
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(192,57,43,0.06)", border: `1.5px solid rgba(192,57,43,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(192,57,43,0.4)" stroke={G.rouge} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                </div>
              )}
              <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#555", fontWeight: 600, marginTop: 12, marginBottom: 4, fontStyle: "italic" }}>C'est ainsi que les autres voient votre profil</p>
            </div>

            {/* Bouton modifier */}
            <div style={{ padding: "12px 16px 24px", background: "#EEEEF2", flexShrink: 0 }}>
              <Btn variant="primary" onClick={() => { setShowPreview(false); setEditing(true); }} style={{ width: "100%" }}>✏️ Modifier mon profil</Btn>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: "#EEEEF2", position: "relative" }}>
        <svg viewBox="0 0 500 40" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 40, marginTop: -1 }}>
          <path d="M0,0 Q125,40 250,40 Q375,40 500,0 L500,0 L0,0 Z" fill={G.blanc}/>
        </svg>

        {/* ── ACTIONS (cartes empilées) ── */}
        <div style={{ padding: "80px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Passer à Premium - visible seulement si gratuit */}
        {!auth.isPremium && (
          <div onClick={() => onShowPremium("")} style={{
            background: `linear-gradient(135deg,${G.rouge} 0%,${G.rougeDark} 100%)`,
            borderRadius: 18, padding: "18px 20px", cursor: "pointer",
            boxShadow: "0 8px 28px rgba(192,57,43,0.35)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}>
            <div>
              <div style={{  fontSize: "1rem", fontWeight: 700, color: G.blanc, marginBottom: 3 }}>✨ Passer à Moyo Premium</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>Messages illimités · Likes illimités · Voir qui vous like</div>
            </div>
            <div style={{  fontSize: "1.2rem", fontWeight: 800, color: G.or, marginLeft: 12, flexShrink: 0 }}>3 500<br/><span style={{ fontSize: "0.65rem",  fontWeight: 600 }}>FCFA/mois</span></div>
          </div>
        )}

        {/* Toggle Visible / Invisible */}
        <div style={{
          background: G.blanc, borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #E8E8E8`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: isVisible ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isVisible
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>Profil {isVisible ? "visible" : "invisible"}</div>
              <div style={{ fontSize: "0.82rem", color: "#888", fontWeight: 400, marginTop: 2 }}>{isVisible ? "Tu apparais dans Découvrir" : "Tu n'apparais plus dans Découvrir"}</div>
            </div>
          </div>
          <div onClick={async () => {
            const newVal = !isVisible;
            await sb.update(auth.token, "profiles", auth.userId, { is_visible: newVal });
            setProfile(p => p ? { ...p, is_visible: newVal } : null);
            setToast({ msg: newVal ? "Profil rendu visible ✅" : "Profil rendu invisible 🔒" });
          }} style={{ width: 52, height: 28, borderRadius: 50, background: isVisible ? "#27ae60" : "#e74c3c", cursor: "pointer", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: isVisible ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: G.blanc, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "left 0.3s" }} />
          </div>
        </div>

        {/* Mode sombre */}
        <div style={{ background: G.blanc, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #E8E8E8` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: darkMode ? "rgba(44,26,14,0.1)" : "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode ? "#2C1A0E" : G.or} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {darkMode
                  ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  : <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                }
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>Mode {darkMode ? "sombre" : "clair"}</div>
              <div style={{ fontSize: "0.82rem", color: "#888", marginTop: 2 }}>{darkMode ? "Thème sombre activé" : "Thème clair activé"}</div>
            </div>
          </div>
          <div onClick={onToggleDark} style={{ width: 52, height: 28, borderRadius: 50, background: darkMode ? "#2C1A0E" : G.gris, cursor: "pointer", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: darkMode ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: G.blanc, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "left 0.3s" }} />
          </div>
        </div>

        {/* Inviter un ami */}
        <div onClick={() => {
          const msg = encodeURIComponent("Salut 😊\nLes célibataires congolais sont déjà sur MOYO...\nEt toi, tu attends quoi pour trouver quelqu'un qui te correspond vraiment ? ❤️\nCrée ton compte gratuitement ici 👇\nhttps://moyo-congo.com");
          if (navigator.share) {
            navigator.share({ title: "Moyo Congo", text: "Salut 😊\nLes célibataires congolais sont déjà sur MOYO...\nEt toi, tu attends quoi pour trouver quelqu'un qui te correspond vraiment ? ❤️\nCrée ton compte gratuitement ici 👇", url: "https://moyo-congo.com" });
          } else {
            window.open(`https://wa.me/?text=${msg}`, "_blank");
          }
        }} style={{ background: G.blanc, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #E8E8E8`, cursor: "pointer" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(26,92,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>Inviter un ami</div>
            <div style={{ fontSize: "0.82rem", color: "#888", marginTop: 2 }}>Partage Moyo avec tes proches</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>

        {/* Se déconnecter */}
        <div onClick={() => setShowLogout(true)} className="action-card" style={{
          background: G.rouge, borderRadius: 50, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 18px rgba(192,57,43,0.3)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: G.blanc }}>Se déconnecter</div>
        </div>

        {/* Demande de vérification */}
        {!profile?.is_verified ? (
          <a href="https://wa.me/33753356471?text=Bonjour%2C%20je%20souhaite%20faire%20vérifier%20mon%20compte%20Moyo.%20Mon%20email%20%3A%20" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ background: G.blanc, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #E8E8E8` }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(29,155,240,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VerifiedBadge size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>Faire vérifier mon compte</div>
                <div style={{ fontSize: "0.78rem", color: "#888", marginTop: 2 }}>Obtenir le badge de confiance</div>
              </div>
              <div style={{ color: "#ccc", fontSize: "1rem" }}>›</div>
            </div>
          </a>
        ) : (
          <div style={{ background: "rgba(29,155,240,0.06)", borderRadius: 16, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, border: `1px solid rgba(29,155,240,0.2)` }}>
            <VerifiedBadge size={22} />
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1d9bf0", display: "flex", alignItems: "center", gap: 8 }}>Compte vérifié
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        )}

        {/* Email de connexion - grisé, non modifiable */}
        <div style={{ marginTop: 4, background: G.blanc, borderRadius: 16, padding: "14px 18px", border: `1px solid #E8E8E8`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Email de connexion</div>
            <div style={{ fontSize: "0.88rem", color: "#aaa", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{auth.email || "-"}</div>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#ccc", background: "#F5F5F5", padding: "3px 10px", borderRadius: 50, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>Non modifiable</div>
        </div>

        {/* Supprimer mon compte - tout en bas */}
        <div onClick={() => setShowDelete(true)} className="action-card" style={{
          background: G.blanc, borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #FFE0E0`,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#e74c3c" }}>Supprimer mon compte</div>
          <div style={{ marginLeft: "auto", color: "#ffb3b3", fontSize: "1rem", fontWeight: 400 }}>›</div>
        </div>

      </div>{/* fin actions */}
      </div>{/* fin zone grise */}

      {/* ── MODAL LISTE NOIRE ── */}
      {showBlocked && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid #F5F5F5` }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Liste noire</div>
              <div onClick={() => setShowBlocked(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.2rem" }}>✕</div>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 0 20px" }}>
              {blockedUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(39,174,96,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize: "0.88rem" }}>Aucun utilisateur bloqué</p>
                </div>
              ) : blockedUsers.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: G.gris, overflow: "hidden", flexShrink: 0 }}>
                    {b.profile?.photo_url ? <img src={b.profile.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{b.profile?.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1a1a" }}>{b.profile?.name || "Utilisateur"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>{b.profile?.city || "-"}</div>
                  </div>
                  <div onClick={() => handleUnblock(b.id)} style={{ background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.2)`, borderRadius: 50, padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, color: G.rouge, cursor: "pointer", flexShrink: 0 }}>Débloquer</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DÉCONNEXION ── */}
      {showLogout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Se déconnecter ?</h3>
            <p style={{ fontSize: "0.88rem", fontWeight: 400, color: "#666", marginBottom: 24, lineHeight: 1.6 }}>Tu seras redirigé vers la page d'accueil. À bientôt sur Moyo !</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setShowLogout(false)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => { sb.signOut(auth.token); onLogout(); }} style={{ flex: 1 }}>Se déconnecter</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION ── */}
      {showDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Supprimer mon compte ?</h3>
            <p style={{ fontSize: "0.88rem", fontWeight: 400, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>Ton profil, tes likes et tes messages seront <strong style={{ color: "#1a1a1a" }}>définitivement supprimés</strong>.</p>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e74c3c", marginBottom: 24 }}>Cette action est irréversible.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setShowDelete(false)} style={{ flex: 1 }}>Non, garder</Btn>
              <Btn variant="danger" onClick={handleDelete} style={{ flex: 1 }}>Oui, supprimer</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Admin({ auth, onBack }: { auth: Auth; onBack: () => void }) {
  // ── Sécurité : redirection si non-admin ──
  useEffect(() => {
    if (!auth.isAdmin) {
      console.warn("[Moyo][Admin] Accès refusé — non-admin");
      onBack();
    }
  }, [auth.isAdmin]);

  type ReportRow = {
    id?: string;
    reason: string;
    reporter_id: string;
    reported_id: string | null;
    status: string;
    created_at?: string;
  };

  type AdminProfile = {
    id: string;
    name: string;
    age: number;
    city: string;
    gender: string;
    is_premium: boolean;
    is_admin?: boolean;
    is_verified?: boolean;
    is_banned?: boolean;
    is_visible?: boolean;
    created_at?: string;
  };

  // ── Onglet actif ──
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "reports">("stats");

  // ── Stats ──
  const [stats, setStats] = useState({
    users: 0, matches: 0, messages: 0, reports: 0,
    todayUsers: 0, premiumUsers: 0, verifiedUsers: 0, bannedUsers: 0,
    maleCount: 0, femaleCount: 0,
    topCities: [] as { city: string; count: number }[],
    recentUsers: [] as AdminProfile[],
  });

  // ── Reports ──
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportFilter, setReportFilter] = useState<"all" | "user" | "system">("all");

  // ── Users ──
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const USER_PAGE_SIZE = 20;

  // ── Global ──
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmModal, setConfirmModal] = useState<{ msg: string; onConfirm: () => void } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId en cours
  const [showHelp, setShowHelp] = useState(false);

  // ── Utilitaires ──
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ── Chargement des stats globales ──
  const loadStats = async () => {
    setLoading(true);
    console.log("[Moyo][Admin] Chargement du dashboard…");
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const todayIso = today.toISOString();

      const [allUsers, matches, messages, reps, totalReps] = await Promise.all([
        sb.query<AdminProfile>(auth.token, "profiles", "?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,created_at&order=created_at.desc&limit=500"),
        sb.query<{ id: string }>(auth.token, "matches", "?select=id"),
        sb.query<{ id: string }>(auth.token, "messages", "?select=id"),
        sb.query<ReportRow>(auth.token, "reports", "?select=id,reason,reporter_id,reported_id,status,created_at&order=created_at.desc&limit=50"),
        sb.query<{ id: string }>(auth.token, "reports", "?select=id"),
      ]);

      // Calculs stats avancées
      const todayUsers = allUsers.filter(u => u.created_at && u.created_at >= todayIso).length;
      const premiumUsers = allUsers.filter(u => u.is_premium).length;
      const verifiedUsers = allUsers.filter(u => u.is_verified).length;
      const bannedUsers = allUsers.filter(u => u.is_banned).length;
      const maleCount = allUsers.filter(u => u.gender === "Homme").length;
      const femaleCount = allUsers.filter(u => u.gender === "Femme").length;

      // Top villes
      const cityMap: Record<string, number> = {};
      allUsers.forEach(u => { if (u.city) cityMap[u.city] = (cityMap[u.city] || 0) + 1; });
      const topCities = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city, count }));

      // Derniers inscrits
      const recentUsers = allUsers.slice(0, 5);

      setStats({
        users: allUsers.length,
        matches: matches.length,
        messages: messages.length,
        reports: totalReps.length,
        todayUsers, premiumUsers, verifiedUsers, bannedUsers,
        maleCount, femaleCount, topCities, recentUsers,
      });
      setReports(reps);
      console.log(`[Moyo][Admin] ✅ Dashboard chargé — ${allUsers.length} profils, ${reps.length} signalements`);
    } catch (e: any) {
      console.error("[Moyo][Admin] ❌ Erreur chargement dashboard :", e?.message || e);
      showToast("Erreur chargement dashboard : " + (e?.message || "inconnue"), "error");
    }
    setLoading(false);
  };

  // ── Chargement des utilisateurs avec recherche ──
  const loadUsers = async (search = "", page = 0) => {
    setUsersLoading(true);
    try {
      const offset = page * USER_PAGE_SIZE;
      let params = `?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,created_at&order=created_at.desc&limit=${USER_PAGE_SIZE}&offset=${offset}`;
      if (search.trim()) {
        // Recherche par nom (ilike)
        params = `?select=id,name,age,city,gender,is_premium,is_admin,is_verified,is_banned,created_at&name=ilike.*${encodeURIComponent(search.trim())}*&order=created_at.desc&limit=${USER_PAGE_SIZE}&offset=${offset}`;
      }
      const res = await sb.query<AdminProfile>(auth.token, "profiles", params);
      setUsers(res);
    } catch (e: any) {
      console.error("[Moyo][Admin][Users] ❌ Erreur :", e?.message || e);
      showToast("Erreur chargement utilisateurs : " + (e?.message || "inconnue"), "error");
    }
    setUsersLoading(false);
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (activeTab === "users") loadUsers(userSearch, userPage);
  }, [activeTab, userPage]);

  // ── Action admin générique sur un profil ──
  const adminAction = async (
    userId: string,
    updates: Partial<AdminProfile>,
    successMsg: string,
  ) => {
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setActionLoading(userId);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${auth.token}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify(updates),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const errMsg = data?.message || data?.code || `HTTP ${r.status}`;
        console.error("[Moyo][Admin][Action] ❌ Supabase error :", data);
        if (r.status === 403 || r.status === 401) {
          showToast(`Action bloquée par Supabase RLS (policy). Détail : ${errMsg}`, "error");
        } else {
          showToast(`Erreur Supabase : ${errMsg}`, "error");
        }
        return;
      }
      console.log("[Moyo][Admin][Action] ✅", successMsg, updates);
      showToast(successMsg, "success");
      // Mise à jour locale immédiate
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    } catch (e: any) {
      console.error("[Moyo][Admin][Action] ❌ Erreur réseau :", e?.message || e);
      showToast("Erreur réseau : " + (e?.message || "inconnue"), "error");
    }
    setActionLoading(null);
  };

  // ── Suppression de compte ──
  const deleteAccount = async (user: AdminProfile) => {
    if (user.id === auth.userId) { showToast("Vous ne pouvez pas supprimer votre propre compte.", "error"); return; }
    if (!auth.isAdmin) { showToast("Accès refusé", "error"); return; }
    setActionLoading(user.id);
    try {
      // Supprimer le profil (cascade selon policies)
      await sb.delete(auth.token, "profiles", `?id=eq.${user.id}`);
      console.log("[Moyo][Admin][Delete] ✅ Profil supprimé :", user.id);
      showToast(`Profil de ${user.name} supprimé.`, "success");
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setStats(s => ({ ...s, users: s.users - 1 }));
    } catch (e: any) {
      console.error("[Moyo][Admin][Delete] ❌ Erreur :", e?.message || e);
      showToast("Erreur suppression : " + (e?.message || "inconnue"), "error");
    }
    setActionLoading(null);
  };

  // ── Confirmation modale ──
  const confirm = (msg: string, fn: () => void) => setConfirmModal({ msg, onConfirm: fn });

  // ── Classify reports ──
  const classifyReport = (r: ReportRow): { label: string; color: string } => {
    if (r.reason?.startsWith("[AUTO-MOD")) return { label: "Auto-modération", color: "#e67e22" };
    if (r.reason?.startsWith("[BOT SIGNALEMENT]")) return { label: "Alerte bot", color: "#8e44ad" };
    if (!r.reported_id) return { label: "Alerte système", color: "#7f8c8d" };
    return { label: "Signalement profil", color: G.rouge };
  };

  const filteredReports = reports.filter(r => {
    if (reportFilter === "user") return !r.reason?.startsWith("[AUTO-MOD") && !r.reason?.startsWith("[BOT") && r.reported_id;
    if (reportFilter === "system") return r.reason?.startsWith("[AUTO-MOD") || r.reason?.startsWith("[BOT") || !r.reported_id;
    return true;
  });

  // ── SVG Icons ──
  const IcoUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const IcoStats = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
  const IcoAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  const IcoStar = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="#D4A843" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  const IcoShield = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const IcoBan = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
  const IcoCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const IcoTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
  const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  const IcoRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
  const IcoArrowLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
  const IcoGear = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

  // ── Rendu d'un badge statut ──
  const StatusBadge = ({ label, active, color, Icon }: { label: string; active: boolean; color: string; Icon: () => React.ReactElement }) => (
    active ? (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: `${color}18`, color, borderRadius: 50, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>
        <Icon />{label}
      </span>
    ) : null
  );

  // ── Rendu d'un bouton d'action utilisateur ──
  const ActionBtn = ({ label, onClick, color = G.rouge, disabled = false }: {
    label: string; onClick: () => void; color?: string; disabled?: boolean
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: `${color}14`, color, border: `1px solid ${color}30`, borderRadius: 8,
        padding: "5px 10px", fontSize: "0.7rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  if (!auth.isAdmin) return null;

  return (
    <div style={{ padding: "0 0 80px", minHeight: "100vh", background: G.creme }}>
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal confirmation */}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(44,26,14,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#111", lineHeight: 1.6, marginBottom: 22, fontWeight: 500 }}>{confirmModal.msg}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "11px" }}>Annuler</Btn>
              <Btn variant="danger" onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} style={{ flex: 1, padding: "11px" }}>Confirmer</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aide Admin */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn 0.2s ease" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: G.blanc, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", animation: "fadeUp 0.28s ease" }}
          >
            {/* En-tête modal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px", borderBottom: `1px solid ${G.gris}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: G.brun }}>Guide Admin</div>
                  <div style={{ fontSize: "0.72rem", color: "#999", marginTop: 1 }}>Tableau de bord MOYO</div>
                </div>
              </div>
              <div onClick={() => setShowHelp(false)} style={{ cursor: "pointer", width: 32, height: 32, borderRadius: "50%", background: G.creme, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            </div>
            {/* Contenu scrollable */}
            <div style={{ overflowY: "auto", padding: "18px 20px 32px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Section 1 — Rôle admin */}
              <div style={{ background: `linear-gradient(135deg,${G.rouge}12,${G.rouge}06)`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${G.rouge}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.rouge }}>Rôle d'un administrateur</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: G.brun, lineHeight: 1.65 }}>Un admin supervise la plateforme, protège les utilisateurs, vérifie les signalements et applique les décisions de modération. Il agit avec neutralité, sans jamais utiliser ses droits à des fins personnelles.</p>
              </div>

              {/* Section 2 — Stats */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Statistiques</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["Membres total", "Nombre total de comptes créés sur la plateforme."],
                    ["Matchs", "Nombre de paires qui se sont mutuellement likées."],
                    ["Messages", "Volume total de messages échangés."],
                    ["Signalements", "Nombre de signalements reçus toutes sources confondues."],
                    ["Nouveaux membres", "Inscriptions du jour en cours."],
                    ["Premium actifs", "Utilisateurs ayant un abonnement Premium actif."],
                    ["Profils vérifiés", "Comptes ayant obtenu le badge de vérification."],
                    ["Profils bannis", "Comptes actuellement bannis de la plateforme."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3 — Utilisateurs */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Utilisateurs</span>
                </div>
                <div style={{ background: "#FFF8F0", borderRadius: 10, padding: "9px 12px", marginBottom: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontSize: "0.79rem", color: "#7a5500" }}>Les actions sensibles doivent toujours être utilisées avec prudence et discernement.</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {([
                    ["Rendre Premium / Retirer Premium", "Attribue ou retire l'accès aux fonctionnalités payantes."],
                    ["Rendre Admin / Retirer Admin", "Accorde ou révoque les droits d'administration. À utiliser avec la plus grande prudence."],
                    ["Vérifier / Retirer vérification", "Attribue ou retire le badge bleu de vérification du profil."],
                    ["Avertir", "Envoie un avertissement officiel visible par l'utilisateur à sa prochaine connexion."],
                    ["Bannir", "Interdit l'accès à la plateforme. Action irréversible sans intervention admin."],
                    ["Supprimer", "Efface définitivement le compte et toutes ses données."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4 — Signalements */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Onglet Signalements</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["Signalement profil", "Un utilisateur a manuellement signalé un autre profil. À examiner en priorité."],
                    ["Auto-modération", "Le système a détecté un contenu interdit ou suspect (insulte, arnaque, contenu sexuel…)."],
                    ["Alerte système", "Notification technique ou comportement inhabituel détecté automatiquement."],
                  ] as [string, string][]).map(([label, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5 — Statuts */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Traitement des signalements</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["En attente", "#e67e22", "Pas encore examiné par un administrateur."],
                    ["Traité", G.vert, "Signalement vérifié et pris en charge par un admin."],
                    ["Rejeté", "#999", "Signalement examiné mais non retenu (sans suite)."],
                    ["Banni", G.rouge, "Sanction appliquée suite au signalement."],
                  ] as [string, string, string][]).map(([label, color, desc]) => (
                    <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: G.creme, borderRadius: 10, padding: "9px 12px" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, marginTop: 3, flexShrink: 0 }} />
                      <div><span style={{ fontWeight: 700, fontSize: "0.8rem", color: G.brun }}>{label} : </span><span style={{ fontSize: "0.8rem", color: "#555" }}>{desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6 — Avertissements */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.or} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>Avertissements utilisateurs</span>
                </div>
                <div style={{ background: G.creme, borderRadius: 10, padding: "12px 14px", fontSize: "0.82rem", color: G.brun, lineHeight: 1.7 }}>
                  Un avertissement est une étape préventive avant bannissement. L'utilisateur voit une modal officielle MOYO à sa prochaine connexion. Lorsqu'il clique <strong>"OK, j'ai compris"</strong>, la plateforme enregistre qu'il a bien pris connaissance de l'avertissement. L'admin peut ainsi suivre le 1er, 2e ou 3e avertissement et adapter la décision en conséquence.
                </div>
              </div>

              {/* Section 7 — Bonnes pratiques */}
              <div style={{ background: `linear-gradient(135deg,${G.vert}14,${G.vert}06)`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${G.vert}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: G.vert }}>Bonnes pratiques admin</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    "Rester neutre en toutes circonstances.",
                    "Ne jamais utiliser les droits admin pour des raisons personnelles.",
                    "Vérifier les faits avant d'appliquer une sanction.",
                    "Protéger les données des utilisateurs — elles sont confidentielles.",
                    "Ne jamais partager d'informations privées avec des tiers.",
                    "Privilégier l'avertissement avant le bannissement quand c'est possible.",
                  ].map((rule, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize: "0.82rem", color: G.brun, lineHeight: 1.6 }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: G.blanc, padding: "14px 16px 0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div onClick={onBack} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}><IcoArrowLeft /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IcoGear />
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: G.brun }}>Admin Dashboard</span>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: G.creme, border: `1.5px solid ${G.cremeDark}`, borderRadius: 20, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: G.brunLight, transition: "all 0.18s ease", flexShrink: 0 }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = G.cremeDark; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = G.creme; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Aide
          </button>
        </div>
        {/* Onglets */}
        <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${G.gris}` }}>
          {([
            ["stats", "Statistiques", IcoStats],
            ["users", "Utilisateurs", IcoUsers],
            ["reports", "Signalements", IcoAlert],
          ] as [string, string, () => React.ReactElement][]).map(([key, label, Icon]) => (
            <div
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                if (key === "users" && users.length === 0) loadUsers("", 0);
              }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 0 12px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
                color: activeTab === key ? G.rouge : "#999",
                borderBottom: activeTab === key ? `2.5px solid ${G.rouge}` : "2.5px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <Icon />{label}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ ONGLET STATS */}
      {activeTab === "stats" && (
        <div style={{ padding: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
            </div>
          ) : (
            <>
              {/* Grille stats principales */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
                {([
                  ["Membres total", stats.users, G.rouge, <IcoUsers key="u"/>],
                  ["Matchs", stats.matches, "#8e44ad", <svg key="m" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>],
                  ["Messages", stats.messages, "#2980b9", <svg key="ms" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>],
                  ["Signalements", stats.reports, "#e67e22", <IcoAlert key="a"/>],
                ] as [string, number, string, React.ReactNode][]).map(([label, value, color, icon]) => (
                  <div key={label} style={{ background: G.blanc, borderRadius: 16, padding: "16px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ color, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "0.73rem", color: "#777", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Stats avancées */}
              <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 14 }}>Statistiques avancées</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                  {([
                    ["Nouveaux aujourd'hui", stats.todayUsers, "#27ae60"],
                    ["Premium actifs", stats.premiumUsers, "#D4A843"],
                    ["Profils vérifiés", stats.verifiedUsers, G.vert],
                    ["Profils bannis", stats.bannedUsers, "#e74c3c"],
                  ] as [string, number, string][]).map(([label, val, color]) => (
                    <div key={label} style={{ background: `${color}0d`, borderRadius: 12, padding: "12px", border: `1px solid ${color}25` }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: "0.7rem", color: "#555", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratio Genre */}
              <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 12 }}>Ratio Homme / Femme</h3>
                {stats.users > 0 ? (
                  <>
                    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a6ef5" }}>{stats.maleCount}</div>
                        <div style={{ fontSize: "0.7rem", color: "#555" }}>Hommes</div>
                      </div>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#e91e8c" }}>{stats.femaleCount}</div>
                        <div style={{ fontSize: "0.7rem", color: "#555" }}>Femmes</div>
                      </div>
                    </div>
                    <div style={{ height: 10, borderRadius: 50, background: "#f0f0f0", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${Math.round(stats.maleCount / stats.users * 100)}%`, background: "#1a6ef5", borderRadius: "50px 0 0 50px", transition: "width 0.5s" }} />
                      <div style={{ flex: 1, background: "#e91e8c", borderRadius: "0 50px 50px 0" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.68rem", color: "#888" }}>
                      <span>{Math.round(stats.maleCount / stats.users * 100)}% H</span>
                      <span>{Math.round(stats.femaleCount / stats.users * 100)}% F</span>
                    </div>
                  </>
                ) : <p style={{ fontSize: "0.82rem", color: "#aaa" }}>Données insuffisantes</p>}
              </div>

              {/* Top villes */}
              {stats.topCities.length > 0 && (
                <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 12 }}>Top villes</h3>
                  {stats.topCities.map(({ city, count }, i) => (
                    <div key={city} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: G.rouge, color: G.blanc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{city}</span>
                          <span style={{ fontSize: "0.78rem", color: G.rouge, fontWeight: 700 }}>{count}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 50, background: "#f0f0f0", overflow: "hidden" }}>
                          <div style={{ width: `${Math.round(count / stats.users * 100)}%`, background: `linear-gradient(90deg,${G.rouge},${G.or})`, height: "100%", borderRadius: 50 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Derniers inscrits */}
              {stats.recentUsers.length > 0 && (
                <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun, marginBottom: 12 }}>Derniers inscrits</h3>
                  {stats.recentUsers.map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${G.gris}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: u.gender === "Femme" ? "rgba(233,30,140,0.1)" : "rgba(26,110,245,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={u.gender === "Femme" ? "#e91e8c" : "#1a6ef5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 5 }}>
                          {u.name}{u.is_premium && <IcoStar />}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#888" }}>{u.city} · {u.age} ans</div>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#aaa" }}>{formatDate(u.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}

              <Btn variant="ghost" onClick={loadStats} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                <IcoRefresh />Actualiser
              </Btn>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ ONGLET UTILISATEURS */}
      {activeTab === "users" && (
        <div style={{ padding: "16px" }}>
          {/* Barre de recherche */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><IcoSearch /></span>
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setUserPage(0); loadUsers(userSearch, 0); } }}
              placeholder="Rechercher par nom…"
              style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12, border: `2px solid ${G.gris}`, fontSize: "0.9rem", background: G.blanc, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Btn variant="primary" onClick={() => { setUserPage(0); loadUsers(userSearch, 0); }} style={{ flex: 1, padding: "10px" }}>
              Rechercher
            </Btn>
            <Btn variant="ghost" onClick={() => { setUserSearch(""); setUserPage(0); loadUsers("", 0); }} style={{ padding: "10px 16px" }}>
              Réinitialiser
            </Btn>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: "0.88rem" }}>Aucun utilisateur trouvé</div>
          ) : (
            <>
              <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: 10, fontWeight: 600 }}>{users.length} utilisateur(s) affichés</div>
              {users.map(u => {
                const isLoading = actionLoading === u.id;
                const isSelf = u.id === auth.userId;
                return (
                  <div key={u.id} style={{ background: G.blanc, borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    {/* En-tête utilisateur */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: u.gender === "Femme" ? "rgba(233,30,140,0.1)" : "rgba(26,110,245,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={u.gender === "Femme" ? "#e91e8c" : "#1a6ef5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
                          {u.name}
                          {isSelf && <span style={{ fontSize: "0.65rem", background: "rgba(26,92,58,0.1)", color: G.vert, borderRadius: 50, padding: "1px 7px", fontWeight: 700 }}>Vous</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>
                          {u.age} ans · {u.city} · {u.gender}
                          {u.created_at && <span> · inscrit le {formatDate(u.created_at)}</span>}
                        </div>
                        {/* Badges statuts */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          <StatusBadge label="Premium" active={u.is_premium} color="#D4A843" Icon={IcoStar} />
                          <StatusBadge label="Admin" active={!!u.is_admin} color={G.rouge} Icon={IcoGear} />
                          <StatusBadge label="Vérifié" active={!!u.is_verified} color={G.vert} Icon={IcoCheck} />
                          <StatusBadge label="Banni" active={!!u.is_banned} color="#e74c3c" Icon={IcoBan} />
                        </div>
                      </div>
                      {isLoading && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 0.8s ease-in-out infinite", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/></svg>
                      )}
                    </div>

                    {/* Actions — ligne 1 : Premium & Admin */}
                    <div style={{ borderTop: `1px solid ${G.gris}`, paddingTop: 10 }}>
                      <div style={{ fontSize: "0.68rem", color: "#aaa", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Statuts</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {!u.is_premium ? (
                          <ActionBtn label="+ Premium" color="#D4A843" disabled={isLoading}
                            onClick={() => confirm(`Rendre ${u.name} Premium ?`, () => adminAction(u.id, { is_premium: true }, `${u.name} est maintenant Premium.`))} />
                        ) : (
                          <ActionBtn label="— Premium" color="#B8860B" disabled={isLoading}
                            onClick={() => confirm(`Retirer le Premium de ${u.name} ?`, () => adminAction(u.id, { is_premium: false }, `Premium retiré pour ${u.name}.`))} />
                        )}
                        {!u.is_admin ? (
                          <ActionBtn label="+ Admin" color={G.rouge} disabled={isLoading}
                            onClick={() => confirm(`Rendre ${u.name} administrateur(trice) ?`, () => adminAction(u.id, { is_admin: true }, `${u.name} est maintenant admin.`))} />
                        ) : (
                          <ActionBtn label="— Admin" color="#c0392b" disabled={isLoading || isSelf}
                            onClick={() => {
                              if (isSelf) { showToast("Vous ne pouvez pas retirer vos propres droits admin.", "error"); return; }
                              confirm(`Retirer les droits admin de ${u.name} ?`, () => adminAction(u.id, { is_admin: false }, `Droits admin retirés pour ${u.name}.`));
                            }} />
                        )}
                        {!u.is_verified ? (
                          <ActionBtn label="+ Vérifier" color={G.vert} disabled={isLoading}
                            onClick={() => confirm(`Vérifier le profil de ${u.name} ?`, () => adminAction(u.id, { is_verified: true }, `Profil de ${u.name} vérifié.`))} />
                        ) : (
                          <ActionBtn label="— Vérifier" color="#555" disabled={isLoading}
                            onClick={() => confirm(`Retirer la vérification de ${u.name} ?`, () => adminAction(u.id, { is_verified: false }, `Vérification retirée pour ${u.name}.`))} />
                        )}
                      </div>

                      {/* Actions modération */}
                      <div style={{ fontSize: "0.68rem", color: "#aaa", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Modération</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {!u.is_banned ? (
                          <ActionBtn label="Bannir" color="#e74c3c" disabled={isLoading || isSelf}
                            onClick={() => {
                              if (isSelf) { showToast("Vous ne pouvez pas vous bannir vous-même.", "error"); return; }
                              confirm(`Bannir ${u.name} ? Il/elle ne pourra plus accéder à l'application.`, () => adminAction(u.id, { is_banned: true, is_visible: false }, `${u.name} a été banni(e).`));
                            }} />
                        ) : (
                          <ActionBtn label="Débannir" color={G.vert} disabled={isLoading}
                            onClick={() => confirm(`Débannir ${u.name} ?`, () => adminAction(u.id, { is_banned: false, is_visible: true }, `${u.name} a été débanni(e).`))} />
                        )}
                        <ActionBtn label="Supprimer" color="#c0392b" disabled={isLoading || isSelf}
                          onClick={() => {
                            if (isSelf) { showToast("Vous ne pouvez pas supprimer votre propre compte.", "error"); return; }
                            confirm(`⚠️ Supprimer définitivement le compte de ${u.name} ? Cette action est irréversible.`, () => deleteAccount(u));
                          }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <Btn variant="ghost" onClick={() => { const p = Math.max(0, userPage - 1); setUserPage(p); loadUsers(userSearch, p); }} disabled={userPage === 0} style={{ flex: 1, padding: "10px" }}>
                  ← Précédent
                </Btn>
                <span style={{ display: "flex", alignItems: "center", fontSize: "0.8rem", color: "#888", padding: "0 8px" }}>
                  Page {userPage + 1}
                </span>
                <Btn variant="ghost" onClick={() => { const p = userPage + 1; setUserPage(p); loadUsers(userSearch, p); }} disabled={users.length < USER_PAGE_SIZE} style={{ flex: 1, padding: "10px" }}>
                  Suivant →
                </Btn>
              </div>
            </>
          )}

          {/* Note colonnes manquantes */}
          <div style={{ background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.3)", borderRadius: 12, padding: "12px 14px", marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#f39c12" }}>Note technique</span>
            </div>
            <p style={{ fontSize: "0.73rem", color: "#555", lineHeight: 1.5 }}>
              Si les actions Bannir/Débannir échouent, la colonne <code>is_banned</code> est peut-être absente. SQL à exécuter dans Supabase : <code>ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;</code>
            </p>
            <p style={{ fontSize: "0.73rem", color: "#555", lineHeight: 1.5, marginTop: 6 }}>
              Si les mises à jour sont bloquées (erreur 403), les policies RLS doivent autoriser les admins à modifier les profils. Contactez le développeur.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ ONGLET SIGNALEMENTS */}
      {activeTab === "reports" && (
        <div style={{ padding: "16px" }}>
          {/* Filtres */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {(["all", "user", "system"] as const).map(f => (
              <div key={f} onClick={() => setReportFilter(f)} style={{
                padding: "7px 14px", borderRadius: 50, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                background: reportFilter === f ? G.rouge : G.blanc,
                color: reportFilter === f ? G.blanc : "#555",
                boxShadow: reportFilter === f ? "0 2px 8px rgba(192,57,43,0.25)" : "none",
                border: `1px solid ${reportFilter === f ? G.rouge : G.gris}`,
              }}>
                {f === "all" ? "Tous" : f === "user" ? "Profils" : "Système"}
              </div>
            ))}
          </div>

          <div style={{ background: G.blanc, borderRadius: 16, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: "0.88rem", color: G.brun }}>
                Signalements ({filteredReports.length} / {stats.reports} total)
              </h3>
            </div>

            {filteredReports.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>Aucun signalement dans cette catégorie</p>
            ) : (
              filteredReports.map((r, i) => {
                const cat = classifyReport(r);
                return (
                  <div key={r.id || i} style={{ padding: "12px 0", borderBottom: i < filteredReports.length - 1 ? `1px solid ${G.gris}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ background: `${cat.color}18`, color: cat.color, borderRadius: 50, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700 }}>
                        {cat.label}
                      </span>
                      {r.status && (
                        <span style={{ background: r.status === "pending" ? "rgba(243,156,18,0.12)" : "rgba(39,174,96,0.12)", color: r.status === "pending" ? "#f39c12" : "#27ae60", borderRadius: 50, padding: "2px 10px", fontSize: "0.66rem", fontWeight: 600 }}>
                          {r.status === "pending" ? "En attente" : r.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1a1a1a", marginBottom: 5, lineHeight: 1.4 }}>{r.reason}</div>
                    <div style={{ fontSize: "0.72rem", color: "#999", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {r.reporter_id?.slice(0, 12)}…
                      </span>
                      {r.reported_id
                        ? <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            {r.reported_id?.slice(0, 12)}…
                          </span>
                        : <span style={{ color: "#ccc" }}>Alerte système</span>
                      }
                      {r.created_at && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {formatDateTime(r.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Btn variant="ghost" onClick={loadStats} style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IcoRefresh />Actualiser
          </Btn>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("moyo_dark") === "1");
  const [tab, setTab] = useState("discover");
  const [auth, setAuth] = useState<Auth | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [viewsReceived, setViewsReceived] = useState(0);
  const [premiumModal, setPremiumModal] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [openConvPartnerId, setOpenConvPartnerId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isUnmatchingRef = useRef(false);
  // Ref pour permettre à LikesPage de déclencher un refresh des badges
  const refreshBadgesRef = useRef<(() => void) | null>(null);

  // ── SESSION v2 : callback injecté dans sb pour déconnexion propre sur 401 irrécupérable ──
  // Défini ici (pas dans useEffect) pour être stable dès le premier render
  const authRef = useRef<Auth | null>(null);
  const handleSessionExpired = React.useCallback(() => {
    console.warn("[Moyo][Session] Session expirée — déconnexion propre");
    localStorage.removeItem("moyo_session");
    authRef.current = null;
    setAuth(null);
    setPage("landing");
    setUnreadCount(0);
    setNotifCount(0);
    setLikesReceived(0);
  }, []);

  // ── Injecter le handler dans sb une seule fois ──
  useEffect(() => {
    sb.setAuthFailureHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // ── Helper pour mettre à jour le token après un refresh réussi ──
  const handleTokenRefreshed = React.useCallback((newToken: string, newRefreshToken: string, newExpiresAt: number) => {
    setAuth(prev => {
      if (!prev) return prev;
      const updated: Auth = { ...prev, token: newToken, refreshToken: newRefreshToken, expiresAt: newExpiresAt };
      authRef.current = updated;
      try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
      console.log("[Moyo][Session] Auth state mis à jour avec le nouveau token");
      return updated;
    });
  }, []);

  // PWA - écouter l'événement d'installation
  useEffect(() => {
    // Enregistrer le Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Ne pas afficher si déjà installé ou déjà dismissé
    const dismissed = localStorage.getItem("moyo_install_dismissed");
    const isInStandaloneMode = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;
    if (dismissed || isInStandaloneMode) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS - détecter Safari iPhone/iPad
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos && !isInStandaloneMode) {
      setTimeout(() => setShowInstall(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
    setDeferredPrompt(null);
  };
  // Restaurer session au chargement
  useEffect(() => {
    // Vérifier si c'est un lien de reset password ou confirmation email
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    if (type === "recovery") {
      setPage("reset-password");
      return;
    }
    // Confirmation email - rediriger vers login (Supabase valide le token automatiquement via l'URL)
    if ((type === "signup" || type === "email_confirmation") && accessToken) {
      window.location.hash = "";
      setPage("login");
      return;
    }
    try {
      const saved = localStorage.getItem("moyo_session");
      if (saved) {
        const a: Auth = JSON.parse(saved);
        if (a?.token && a?.userId) {

          // ── SESSION v2 : détecter si le token est déjà expiré avant même de l'utiliser ──
          const isExpired = a.expiresAt ? Date.now() > a.expiresAt - 60_000 : false; // marge 60s
          if (isExpired && a.refreshToken) {
            console.log("[Moyo][Session] Token expiré au chargement — refresh préventif…");
            sb.refreshSession(a.refreshToken).then(refreshed => {
              if (refreshed) {
                const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
                const updated: Auth = { ...a, token: refreshed.access_token, refreshToken: refreshed.refresh_token, expiresAt: newExpiresAt };
                authRef.current = updated;
                try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
                setAuth(updated);
              } else {
                // Refresh échoué → pas de session utilisable
                console.warn("[Moyo][Session] Refresh préventif échoué — retour landing");
                localStorage.removeItem("moyo_session");
                setAuth(null);
                setPage("landing");
              }
              setSessionLoaded(true);
            });
            setPage("app");
            setTab("discover");
            // Ne pas afficher l'app tant que le refresh n'est pas terminé
            return;
          }

          // Token non expiré (ou pas d'expiresAt) → restaurer immédiatement
          authRef.current = a;
          setAuth(a);
          setPage("app");
          setTab("discover");
          setSessionLoaded(true);

          // Vérifier en arrière-plan que le compte existe encore
          sb.query<Profile>(a.token, "profiles", `?id=eq.${a.userId}&select=id,is_premium,is_admin`, a.refreshToken, handleTokenRefreshed)
            .then(profiles => {
              if (!profiles || profiles.length === 0) {
                // ── Avant de déconnecter, vérifier que ce n'est pas un 401 récupéré ──
                // Si le token a été refreshé entre-temps, authRef.current.token ≠ a.token
                if (authRef.current?.token !== a.token) {
                  console.log("[Moyo][Session] Token refreshé entre-temps — pas de déconnexion");
                  return;
                }
                console.warn("[Moyo][Session] Profil introuvable au chargement — déconnexion");
                localStorage.removeItem("moyo_session");
                setAuth(null);
                setPage("landing");
              } else {
                // Mettre à jour Premium/isAdmin si changé
                const p = profiles[0];
                if (p.is_premium !== a.isPremium || (p.is_admin || false) !== a.isAdmin) {
                  const updated = { ...a, isPremium: p.is_premium, isAdmin: p.is_admin || false };
                  authRef.current = updated;
                  setAuth(updated);
                  try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
                }
              }
            })
            .catch(() => {
              // Erreur réseau : garder la session locale, pas de déconnexion
              console.log("[Moyo][Session] Vérification arrière-plan — erreur réseau ignorée");
            });
          return;
        }
      }
    } catch { localStorage.removeItem("moyo_session"); }
    setSessionLoaded(true);
  }, []);

  const handleAuth = (a: Auth) => {
    authRef.current = a;
    setAuth(a); setPage("app"); setTab("discover");
    try { localStorage.setItem("moyo_session", JSON.stringify(a)); } catch {}
    // Demander permission notifications push
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Moyo - Notifications activées !', {
              body: 'Vous recevrez des alertes pour vos nouveaux messages.',
              icon: '/favicon.png',
            });
          }
        });
      }, 3000);
    }
  };
  const handleLogout = () => {
    setAuth(null); setPage("landing"); setUnreadCount(0); setNotifCount(0); setLikesReceived(0);
    try { localStorage.removeItem("moyo_session"); } catch {}
  };
  useEffect(() => {
    if (!auth) return;

    // ── SESSION v2 : validateSession sécurisée ──
    // • Ne déconnecte QUE si le profil est confirmé inexistant (compte supprimé par admin)
    // • Ignore les erreurs réseau (timeout, hors ligne, 401 récupéré par safeRequest)
    // • Met à jour Premium/isAdmin silencieusement
    const validateSession = async () => {
      try {
        const profiles = await sb.query<Profile>(
          auth.token, "profiles",
          `?id=eq.${auth.userId}&select=id,is_premium,is_admin`,
          auth.refreshToken,
          handleTokenRefreshed,
        );
        if (!profiles || profiles.length === 0) {
          // Vérification supplémentaire : le token a peut-être été refreshé
          // entre le moment de l'appel et maintenant → authRef est à jour
          if (authRef.current && authRef.current.token !== auth.token) {
            console.log("[Moyo][Session] validateSession — token refreshé, on garde la session");
            return true;
          }
          console.warn("[Moyo][Session] validateSession — profil inexistant → compte supprimé");
          localStorage.removeItem("moyo_session");
          setAuth(null);
          setPage("landing");
          return false;
        }
        // Mettre à jour Premium/isAdmin si changé
        const p = profiles[0];
        if (p.is_premium !== auth.isPremium || (p.is_admin || false) !== auth.isAdmin) {
          console.log("[Moyo][Session] validateSession — mise à jour Premium/isAdmin");
          const updated = { ...auth, isPremium: p.is_premium, isAdmin: p.is_admin || false };
          authRef.current = updated;
          setAuth(updated);
          try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
        }
        return true;
      } catch (e) {
        // ── ANCIEN comportement supprimé ──
        // Avant : on déconnectait sur toute erreur. Problème : un 401 résolu
        // par safeRequest() ne remonte PAS ici en exception → ce catch ne
        // reçoit que les vraies erreurs réseau (offline, timeout), auquel cas
        // on ne déconnecte PAS pour éviter les déconnexions fantômes.
        console.log("[Moyo][Session] validateSession — erreur réseau ignorée (session conservée)", e);
        return true;
      }
    };
    validateSession();

    // Vérifier la session toutes les 60s (compte supprimé par admin, token expiré)
    const sessionCheck = setInterval(validateSession, 60000);

    // Quand le téléphone se réveille (visibilitychange), revalider silencieusement
    // sans éjecter si c'est juste un timeout réseau
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Utiliser authRef.current pour avoir le token le plus récent
        const currentAuth = authRef.current || auth;
        sb.query<Profile>(
          currentAuth.token, "profiles",
          `?id=eq.${currentAuth.userId}&select=id,is_premium,is_admin`,
          currentAuth.refreshToken,
          handleTokenRefreshed,
        )
          .then(profiles => {
            if (!profiles || profiles.length === 0) {
              // Vérifier que le token n'a pas été refreshé entre-temps
              if (authRef.current && authRef.current.token !== currentAuth.token) {
                console.log("[Moyo][Session] visibilitychange — token refreshé, pas de déconnexion");
                return;
              }
              console.warn("[Moyo][Session] visibilitychange — profil inexistant → déconnexion");
              localStorage.removeItem("moyo_session");
              setAuth(null);
              setPage("landing");
            } else {
              const p = profiles[0];
              const cur = authRef.current || auth;
              if (p.is_premium !== cur.isPremium || (p.is_admin || false) !== cur.isAdmin) {
                const updated = { ...cur, isPremium: p.is_premium, isAdmin: p.is_admin || false };
                authRef.current = updated;
                setAuth(updated);
                try { localStorage.setItem("moyo_session", JSON.stringify(updated)); } catch {}
              }
            }
          })
          .catch(() => {
            // Erreur réseau (timeout, hors ligne) : NE PAS éjecter
            // L'utilisateur est juste de retour d'une veille sans connexion
          });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const updateLastSeen = () => sb.update(auth.token, "profiles", auth.userId, { last_seen: new Date().toISOString() });
    updateLastSeen();
    const lastSeenInterval = setInterval(updateLastSeen, 30000);

    // Chargement initial des likes reçus (badge séparé pour likes et vus)
    const loadLikesReceived = async () => {
      let dIds = new Set<string>();
      try {
        const dismissed = await sb.query<{ dismissed_id: string }>(auth.token, "dismissed_cards", `?user_id=eq.${auth.userId}&select=dismissed_id`);
        dIds = new Set(Array.isArray(dismissed) ? dismissed.map(d => d.dismissed_id) : []);
      } catch {}
      try {
        const [likes, views] = await Promise.all([
          sb.query<{ from_user: string }>(auth.token, "likes", `?to_user=eq.${auth.userId}&select=from_user`),
          sb.query<{ viewer_id: string }>(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}&select=viewer_id`),
        ]);
        const likesCount = Array.isArray(likes) ? likes.filter(l => !dIds.has(l.from_user)).length : 0;
        const viewsCount = Array.isArray(views) ? [...new Set(views.map(v => v.viewer_id))].filter(id => !dIds.has(id)).length : 0;
        setLikesReceived(likesCount);
        setViewsReceived(viewsCount);
      } catch {}
    };
    loadLikesReceived();
    refreshBadgesRef.current = loadLikesReceived;

    // Chargement initial des matchs
    const loadMatchCount = async () => {
      const res = await sb.query<{ id: string; user1: string; user2: string }>(
        auth.token, "matches",
        `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id,user1,user2`
      );
      if (Array.isArray(res)) {
        // Dédupliquer par paire de partenaires (pas juste par ID)
        // pour éviter le doublon quand user1/user2 ont chacun un enregistrement
        const seenPartners = new Set<string>();
        for (const r of res) {
          const partnerId = r.user1 === auth.userId ? r.user2 : r.user1;
          seenPartners.add(partnerId);
        }
        setNotifCount(seenPartners.size);
      }
    };
    loadMatchCount();

    // Chargement initial des messages non lus
    const checkUnread = async () => {
      try {
        const matches = await sb.query<{ id: string }>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id`);
        if (!matches.length) { setUnreadCount(0); return; }
        const matchIds = matches.map(m => m.id).join(",");
        const res = await sb.query<object>(auth.token, "messages", `?match_id=in.(${matchIds})&sender_id=neq.${auth.userId}&is_read=eq.false&select=id`);
        const count = Array.isArray(res) ? res.length : 0;
        setUnreadCount(prev => {
          if (count > prev && prev >= 0 && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Moyo - Nouveau message', {
              body: 'Vous avez reçu un nouveau message !',
              icon: '/favicon.png',
            });
          }
          return count;
        });
      } catch {}
    };
    checkUnread();

    // ── REALTIME messages ──
    const wsMessages = sb.subscribeRealtime(auth.token, "messages", `match_id=neq.null`, () => {
      checkUnread();
    });

    // ── REALTIME likes ──
    const wsLikes = sb.subscribeRealtime(auth.token, "likes", `to_user=eq.${auth.userId}`, () => {
      loadLikesReceived();
    });

    // ── REALTIME matchs - badge mis à jour instantanément ──
    const wsMatches = sb.subscribeRealtime(auth.token, "matches", `user2=eq.${auth.userId}`, () => {
      if (isUnmatchingRef.current) return; // bloquer pendant unmatch
      loadMatchCount();
      loadLikesReceived();
    });
    const wsMatches2 = sb.subscribeRealtime(auth.token, "matches", `user1=eq.${auth.userId}`, () => {
      if (isUnmatchingRef.current) return; // bloquer pendant unmatch
      loadMatchCount();
    });

    // ── REALTIME profile_views ──
    const wsViews = sb.subscribeRealtime(auth.token, "profile_views", `viewed_id=eq.${auth.userId}`, () => {
      loadLikesReceived();
    });

    // Fallback polling toutes les 3s
    const fallbackInterval = setInterval(() => {
      if (isUnmatchingRef.current) return; // bloquer pendant unmatch
      checkUnread();
      loadLikesReceived();
      loadMatchCount();
    }, 3000);

    return () => {
      try { wsMessages?.close(); } catch {}
      try { wsLikes?.close(); } catch {}
      try { wsMatches?.close(); } catch {}
      try { wsMatches2?.close(); } catch {}
      try { wsViews?.close(); } catch {}
      clearInterval(fallbackInterval);
      clearInterval(lastSeenInterval);
      clearInterval(sessionCheck);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [auth?.userId]);
  const showPremium = (r = "") => setPremiumModal(r || "Passe Premium pour débloquer toutes les fonctionnalités !");

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const InstallBanner = showInstall ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.blanc, borderRadius: 24, width: "100%", maxWidth: 340, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, padding: "28px 24px 22px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", color: G.blanc, fontWeight: 800, marginBottom: 4 }}>Mo<span style={{ color: G.or }}>yo</span></div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "10px auto 0" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          </div>
        </div>
        {/* Contenu */}
        <div style={{ padding: "22px 24px 24px", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111", marginBottom: 8 }}>Installe l'app Moyo !</h3>
          {isIos ? (
            <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
              Appuie sur <strong style={{ color: G.rouge }}>Partager</strong> en bas de ton navigateur, puis <strong style={{ color: G.rouge }}>Sur l'écran d'accueil</strong>
            </p>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
              Accède rapidement à Moyo depuis ton écran d'accueil - rapide, pratique et sans passer par le navigateur !
            </p>
          )}
          {!isIos && (
            <button onClick={handleInstall} style={{ width: "100%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: G.blanc, border: "none", borderRadius: 50, padding: "14px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 14px rgba(192,57,43,0.35)" }}>
              Installer l'app
            </button>
          )}
          <button onClick={() => { setShowInstall(false); localStorage.setItem("moyo_install_dismissed", "1"); }} style={{ width: "100%", background: "transparent", color: "#555", border: `2px solid ${G.gris}`, borderRadius: 50, padding: "12px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
            Non merci
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!sessionLoaded) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.blanc }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s ease-in-out infinite" }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>;
  if (page === "landing") return <>{<Landing onNav={setPage} />}{InstallBanner}</>;
  if (page === "about") return <About onBack={() => setPage("landing")} />;
  if (page === "signup") return <SignUp onNav={setPage} />;
  if (page === "login") return <Login onNav={setPage} onAuth={handleAuth} />;
  if (page === "reset-password") return <ResetPassword onNav={setPage} />;
  if (!auth) return <Landing onNav={setPage} />;
  return <div style={darkMode ? { filter: "invert(93%) hue-rotate(180deg)", minHeight: "100vh" } : {}}>
    {darkMode && <style>{`
      img, video { filter: invert(100%) hue-rotate(180deg) !important; }
      .no-invert { filter: invert(100%) hue-rotate(180deg) !important; }
      [style*="background: #C0392B"], [style*="background: rgb(192, 57, 43)"],
      [style*="background-color: #C0392B"], [style*="background: linear-gradient(135deg, rgb(192"],
      [style*="color: #C0392B"], [style*="color: rgb(192, 57, 43)"],
      [style*="stroke: #C0392B"], [style*="fill: #C0392B"] {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
    `}</style>}
    <AppShell tab={tab} setTab={(t) => {
      setTab(t);
      if (t === "messages") setUnreadCount(0);
    }} unreadCount={unreadCount} notifCount={notifCount} likesReceived={likesReceived} viewsReceived={viewsReceived} auth={auth}>
      {tab === "discover" && <Discover auth={auth} onShowPremium={showPremium} />}
      {tab === "likes" && <LikesPage auth={auth} onShowPremium={showPremium} mode="likes" onBadgeUpdate={() => refreshBadgesRef.current?.()} />}
      {tab === "visitors" && <LikesPage auth={auth} onShowPremium={showPremium} mode="visitors" onBadgeUpdate={() => refreshBadgesRef.current?.()} />}
      {tab === "matches" && <Matches auth={auth} onShowPremium={showPremium} onNotifCount={setNotifCount} onGoMessages={(pid) => { setOpenConvPartnerId(pid || null); setTab("messages"); }} onUnmatchStart={() => { isUnmatchingRef.current = true; }} onUnmatchEnd={() => { setTimeout(() => { isUnmatchingRef.current = false; }, 2000); }} />}
      {tab === "messages" && <Messages auth={auth} onUnreadCount={setUnreadCount} onShowPremium={showPremium} initialPartnerId={openConvPartnerId} />}
      {tab === "profile" && <Profile auth={auth} onLogout={handleLogout} onShowPremium={showPremium} darkMode={darkMode} onToggleDark={() => { const v = !darkMode; setDarkMode(v); localStorage.setItem("moyo_dark", v ? "1" : "0"); }} />}
      {tab === "admin" && <Admin auth={auth} onBack={() => setTab("discover")} />}
    </AppShell>
    {premiumModal && <PremiumModal reason={premiumModal} onClose={() => setPremiumModal(null)} />}
    {InstallBanner}
  </div>;
}
