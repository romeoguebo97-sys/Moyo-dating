// ── Client Supabase partagé (App.tsx + Admin.tsx). ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).
//
// CLIENT SUPABASE - v2 avec refresh automatique JWT
// Stratégie :
//   • Toutes les requêtes REST passent par safeRequest()
//   • Si Supabase répond 401 → on tente un refresh du token (une seule fois)
//   • Si le refresh réussit → on relance la requête avec le nouveau token
//   • Si le refresh échoue → on appelle onAuthFailure() (déconnexion propre)
//   • Un flag _isRefreshing évite les boucles infinies
//   • onAuthFailure est injecté par App au montage via sb.setAuthFailureHandler()

export const SUPABASE_URL = "https://mcswcapxpruiffzrxfvl.supabase.co";
export const SUPABASE_KEY = "sb_publishable_nx44ipF3_X98flDVXxBZ5A_aztvDdgN";

const APP_URL = "https://dating.moyo-congo.com";

// Petit utilitaire de délai — sert uniquement à garantir que l'anneau de progression
// reste visible au moins un court instant, même si l'upload est très rapide.
// Ne touche à AUCUNE logique réseau : c'est juste un timer parallèle.
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ── État interne de la connexion Realtime partagée (voir sb.subscribeRealtime plus bas) ──
let _rtSocket: WebSocket | null = null;
let _rtToken: string | null = null;
const _rtListeners: Record<string, Set<() => void>> = {};
let _rtReconnectTimer: ReturnType<typeof setTimeout> | null = null;
function _rtEnsureSocket(token: string): WebSocket {
  if (_rtSocket && _rtToken === token &&
      (_rtSocket.readyState === WebSocket.OPEN || _rtSocket.readyState === WebSocket.CONNECTING)) {
    return _rtSocket;
  }
  try { _rtSocket?.close(); } catch {}
  _rtToken = token;
  const wsUrl = SUPABASE_URL.replace("https://", "wss://").replace("http://", "ws://");
  const ws = new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`);
  _rtSocket = ws;
  ws.onopen = () => {
    ws.send(JSON.stringify({ topic: "realtime:public", event: "phx_join", payload: { access_token: token }, ref: "1" }));
    // Ré-abonnement à tous les topics encore actifs (utile après une reconnexion)
    Object.keys(_rtListeners).forEach(topic => {
      const set = _rtListeners[topic];
      if (set && set.size > 0) {
        ws.send(JSON.stringify({ topic, event: "phx_join", payload: { access_token: token }, ref: topic }));
      }
    });
  };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.event === "INSERT" || msg.event === "UPDATE" || msg.event === "DELETE") {
        const cbs = _rtListeners[msg.topic];
        cbs?.forEach(cb => { try { cb(); } catch {} });
      }
    } catch {}
  };
  ws.onerror = () => {};
  ws.onclose = () => {
    if (_rtSocket !== ws) return;
    _rtSocket = null;
    const hasListeners = Object.values(_rtListeners).some(s => s && s.size > 0);
    if (hasListeners) {
      if (_rtReconnectTimer) clearTimeout(_rtReconnectTimer);
      _rtReconnectTimer = setTimeout(() => { if (_rtToken) _rtEnsureSocket(_rtToken); }, 2000);
    }
  };
  return ws;
}

export const sb = {
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
      body: JSON.stringify({ email, redirect_to: APP_URL }),
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
      console.log("[Moyo][Session] Refresh déjà en cours - skip");
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
      // ── Erreur serveur (pas un vrai 401/400) → conserver la session ──
      if (!r.ok && r.status !== 400 && r.status !== 401) {
        console.warn("[Moyo][Session] ⚠️ Refresh - serveur indisponible (" + r.status + ") - session conservée");
        (this as any)._lastRefreshWasNetworkError = true;
        return null;
      }
      (this as any)._lastRefreshWasNetworkError = false;
      const data = await r.json().catch(() => null);
      if (data?.access_token) {
        console.log("[Moyo][Session] ✅ Refresh réussi - nouveau token obtenu");
        return data;
      }
      console.warn("[Moyo][Session] ❌ Refresh échoué :", data?.error_description || data?.message || "réponse invalide");
      return null;
    } catch (e) {
      // Erreur réseau pure (hors ligne, timeout) → NE PAS déconnecter
      console.warn("[Moyo][Session] ❌ Refresh - erreur réseau (hors ligne?) - session conservée :", e);
      (this as any)._lastRefreshWasNetworkError = true;
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

    console.warn("[Moyo][Session] 401 détecté - JWT probablement expiré");

    // Pas de refresh_token disponible → déconnexion propre
    if (!refreshToken) {
      console.warn("[Moyo][Session] Pas de refresh_token - déconnexion");
      this._onAuthFailure?.();
      return r;
    }

    // Tentative de refresh
    const refreshed = await this.refreshSession(refreshToken);
    if (!refreshed) {
      // ── Ne déconnecter QUE si c'est un vrai token invalide (400/401 Supabase) ──
      // Si c'était une erreur réseau, on conserve la session
      if ((this as any)._lastRefreshWasNetworkError) {
        console.warn("[Moyo][Session] Refresh échoué (réseau) - session conservée");
        return r;
      }
      console.warn("[Moyo][Session] Refresh impossible - déconnexion");
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
  // REST - toutes les méthodes passent par safeRequest
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
  // UTILITAIRES (pas de refresh nécessaire - pas de données privées)
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

  // ── Connexion Realtime partagée : une SEULE connexion WebSocket par utilisateur, sur laquelle on
  //    "s'abonne" à plusieurs tables à la fois (comme plusieurs stations captées par une même antenne),
  //    au lieu d'ouvrir une connexion séparée par écoute (messages, likes, matchs, vues, avertissements,
  //    broadcasts...). Avant ce correctif, chaque personne active ouvrait 7 à 10+ connexions simultanées
  //    rien que pour les badges — ce qui épuisait très vite le quota de connexions Realtime de Supabase
  //    à seulement quelques centaines d'utilisateurs actifs en même temps. Le contrat public de
  //    subscribeRealtime() ne change pas (toujours un objet avec .close()), donc aucun des appels
  //    existants dans le reste du code n'a besoin d'être modifié. ──
  subscribeRealtime(token: string, table: string, filter: string, callback: () => void): { close: () => void } | null {
    try {
      const topic = `realtime:public:${table}:${filter}`;
      if (!_rtListeners[topic]) _rtListeners[topic] = new Set();
      const isFirstForTopic = _rtListeners[topic].size === 0;
      _rtListeners[topic].add(callback);
      const ws = _rtEnsureSocket(token);
      if (isFirstForTopic && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ topic, event: "phx_join", payload: { access_token: token }, ref: topic }));
      }
      // Si le socket n'est pas encore ouvert, l'abonnement se fera automatiquement dans onopen ci-dessus.
      return {
        close: () => {
          const set = _rtListeners[topic];
          if (!set) return;
          set.delete(callback);
          if (set.size === 0) {
            delete _rtListeners[topic];
            try {
              if (_rtSocket && _rtSocket.readyState === WebSocket.OPEN) {
                _rtSocket.send(JSON.stringify({ topic, event: "phx_leave", payload: {}, ref: topic + "_leave" }));
              }
            } catch {}
          }
        },
      };
    } catch { return null; }
  },
};
