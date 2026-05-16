import { SUPABASE_URL, SUPABASE_KEY, APP_URL } from "../constants/config";

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT SUPABASE — v2 avec refresh automatique JWT
//
// Stratégie :
//   • Toutes les requêtes REST passent par safeRequest()
//   • Si Supabase répond 401 → on tente un refresh du token (une seule fois)
//   • Si le refresh réussit → on relance la requête avec le nouveau token
//   • Si le refresh échoue → on appelle onAuthFailure() (déconnexion propre)
//   • Un flag _isRefreshing évite les boucles infinies
//   • onAuthFailure est injecté par App au montage via sb.setAuthFailureHandler()
// ─────────────────────────────────────────────────────────────────────────────

type OnNewToken = (newToken: string, newRefreshToken: string, newExpiresAt: number) => void;

export const sb = {
  // ── Callback injecté par App pour déclencher la déconnexion propre ──
  _onAuthFailure: null as (() => void) | null,
  setAuthFailureHandler(fn: () => void) {
    this._onAuthFailure = fn;
  },

  // ── Anti-boucle : un seul refresh en cours à la fois ──
  _isRefreshing: false,
  _pendingRefreshToken: null as string | null,

  // ── Headers standard REST ──
  h: (token?: string) => ({
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    Prefer: "return=representation",
  }),

  // ────────────────────────────────────────────────────────────────────────
  // AUTH
  // ────────────────────────────────────────────────────────────────────────

  async signUp(email: string, password: string, metadata: object) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: this.h(),
      body: JSON.stringify({ email, password, data: metadata }),
    });
    return r.json();
  },

  async signIn(email: string, password: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: this.h(),
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  },

  async signOut(token: string) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: this.h(token),
    });
  },

  async resetPassword(email: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: this.h(),
      body: JSON.stringify({ email, redirect_to: `${APP_URL}/reset-password` }),
    });
    return r.json();
  },

  async updatePassword(accessToken: string, newPassword: string) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: { ...this.h(accessToken), Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ password: newPassword }),
    });
    return r.json().catch(() => null);
  },

  // ────────────────────────────────────────────────────────────────────────
  // REFRESH SESSION
  // Appelle /auth/v1/token?grant_type=refresh_token
  // Retourne { access_token, refresh_token, expires_in } ou null si échec
  // ────────────────────────────────────────────────────────────────────────

  async refreshSession(
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
    if (this._isRefreshing) {
      console.log("[Moyo][Session] Refresh déjà en cours — skip");
      return null;
    }
    this._isRefreshing = true;
    console.log("[Moyo][Session] Tentative de refresh du token…");
    try {
      const r = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: this.h(),
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      const data = await r.json().catch(() => null);
      if (data?.access_token) {
        console.log("[Moyo][Session] ✅ Refresh réussi — nouveau token obtenu");
        return data;
      }
      console.warn(
        "[Moyo][Session] ❌ Refresh échoué :",
        data?.error_description || data?.message || "réponse invalide"
      );
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
  // ────────────────────────────────────────────────────────────────────────

  async safeRequest(
    token: string,
    refreshToken: string | undefined,
    fn: (t: string) => Promise<Response>,
    onNewToken?: OnNewToken
  ): Promise<Response> {
    const r = await fn(token);
    if (r.status !== 401) return r;

    console.warn("[Moyo][Session] 401 détecté — JWT probablement expiré");

    if (!refreshToken) {
      console.warn("[Moyo][Session] Pas de refresh_token — déconnexion");
      this._onAuthFailure?.();
      return r;
    }

    const refreshed = await this.refreshSession(refreshToken);
    if (!refreshed) {
      console.warn("[Moyo][Session] Refresh impossible — déconnexion");
      this._onAuthFailure?.();
      return r;
    }

    const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
    onNewToken?.(refreshed.access_token, refreshed.refresh_token, newExpiresAt);

    console.log("[Moyo][Session] ✅ Requête relancée avec le nouveau token");
    return fn(refreshed.access_token);
  },

  // ────────────────────────────────────────────────────────────────────────
  // REST — toutes les méthodes passent par safeRequest
  // ────────────────────────────────────────────────────────────────────────

  async query<T>(
    token: string,
    table: string,
    params = "",
    refreshToken?: string,
    onNewToken?: OnNewToken
  ): Promise<T[]> {
    const r = await this.safeRequest(
      token,
      refreshToken,
      (t) => fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers: this.h(t) }),
      onNewToken
    );
    const data = await r.json().catch(() => []);
    if (!Array.isArray(data)) {
      if (data?.code || data?.message) throw new Error(data.message || data.code);
      return [];
    }
    return data;
  },

  async insert<T>(
    token: string,
    table: string,
    data: object,
    refreshToken?: string,
    onNewToken?: OnNewToken
  ): Promise<T[]> {
    const r = await this.safeRequest(
      token,
      refreshToken,
      (t) =>
        fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: "POST",
          headers: this.h(t),
          body: JSON.stringify(data),
        }),
      onNewToken
    );
    const res = await r.json().catch(() => null);
    return Array.isArray(res) ? res : res ? [res] : [];
  },

  async update(
    token: string,
    table: string,
    id: string,
    data: object,
    refreshToken?: string,
    onNewToken?: OnNewToken
  ) {
    const r = await this.safeRequest(
      token,
      refreshToken,
      (t) =>
        fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
          method: "PATCH",
          headers: this.h(t),
          body: JSON.stringify(data),
        }),
      onNewToken
    );
    return r.json().catch(() => null);
  },

  async upsert(
    token: string,
    table: string,
    data: object,
    refreshToken?: string,
    onNewToken?: OnNewToken
  ) {
    const r = await this.safeRequest(
      token,
      refreshToken,
      (t) =>
        fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: "POST",
          headers: { ...this.h(t), Prefer: "return=representation,resolution=merge-duplicates" },
          body: JSON.stringify(data),
        }),
      onNewToken
    );
    return r.json().catch(() => null);
  },

  async delete(
    token: string,
    table: string,
    params: string,
    refreshToken?: string,
    onNewToken?: OnNewToken
  ) {
    await this.safeRequest(
      token,
      refreshToken,
      (t) =>
        fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
          method: "DELETE",
          headers: this.h(t),
        }),
      onNewToken
    );
  },

  async rpc(
    token: string,
    fn: string,
    refreshToken?: string,
    onNewToken?: OnNewToken
  ) {
    const r = await this.safeRequest(
      token,
      refreshToken,
      (t) =>
        fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
          method: "POST",
          headers: this.h(t),
          body: JSON.stringify({}),
        }),
      onNewToken
    );
    return r.json().catch(() => null);
  },

  // ────────────────────────────────────────────────────────────────────────
  // UTILITAIRES (pas de refresh nécessaire)
  // ────────────────────────────────────────────────────────────────────────

  async uploadPhoto(token: string, userId: string, file: File): Promise<string | null> {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${ext}`;
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "true",
          "Cache-Control": "3600",
        },
        body: file,
      });
      if (!r.ok) return null;
      return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
    } catch {
      return null;
    }
  },

  async markMessagesRead(token: string, matchId: string, userId: string) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/messages?match_id=eq.${matchId}&sender_id=neq.${userId}&is_read=eq.false`,
      {
        method: "PATCH",
        headers: this.h(token),
        body: JSON.stringify({ is_read: true }),
      }
    );
  },

  async recordVisit(token: string, visitorId: string, visitedId: string) {
    if (visitorId === visitedId) return;
    await fetch(`${SUPABASE_URL}/rest/v1/profile_visits`, {
      method: "POST",
      headers: { ...this.h(token), Prefer: "return=minimal" },
      body: JSON.stringify({ visitor_id: visitorId, visited_id: visitedId }),
    });
  },

  subscribeRealtime(
    token: string,
    table: string,
    filter: string,
    callback: () => void
  ): WebSocket | null {
    try {
      const wsUrl = SUPABASE_URL.replace("https://", "wss://").replace("http://", "ws://");
      const ws = new WebSocket(
        `${wsUrl}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`
      );
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            topic: "realtime:public",
            event: "phx_join",
            payload: { access_token: token },
            ref: "1",
          })
        );
        ws.send(
          JSON.stringify({
            topic: `realtime:public:${table}:${filter}`,
            event: "phx_join",
            payload: { access_token: token },
            ref: "2",
          })
        );
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (["INSERT", "UPDATE", "DELETE"].includes(msg.event)) callback();
        } catch {}
      };
      ws.onerror = () => {};
      return ws;
    } catch {
      return null;
    }
  },
};
