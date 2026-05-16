import React, { useState, useEffect, useRef, useCallback, memo } from "react";
// ── Auto-extracted from monolith ──
// TODO: replace inline references with imports from ../../lib, ../../constants, ../../components

export function Messages({ auth, onUnreadCount, onShowPremium, initialPartnerId }: { auth: Auth; onUnreadCount: (n: number) => void; onShowPremium: (r: string) => void; initialPartnerId?: string | null }) {
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
  const [footerHeight, setFooterHeight] = useState(65);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [statuses, setStatuses] = useState<StatusPost[]>([]);
  const [myStatuses, setMyStatuses] = useState<StatusPost[]>([]);
  const [showStatusComposer, setShowStatusComposer] = useState(false);
  const [statusUploading, setStatusUploading] = useState(false);
  const [statusDeleting, setStatusDeleting] = useState(false);
  const [statusPreview, setStatusPreview] = useState<StatusPost | null>(null);
  const [statusPreviewList, setStatusPreviewList] = useState<StatusPost[]>([]);
  const [statusPreviewIndex, setStatusPreviewIndex] = useState(0);
  const [statusProgress, setStatusProgress] = useState(0);
  const [statusReplyText, setStatusReplyText] = useState("");
  const [statusStats, setStatusStats] = useState<Record<string, { views: number; likes: number }>>({});
  const [statusLikedByMe, setStatusLikedByMe] = useState<Record<string, boolean>>({});
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusPaused, setStatusPaused] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef<Match | null>(null);
  const supportProfile: Profile = { id: SUPPORT_TEAM_ID, name: SUPPORT_TEAM_NAME, age: 0, city: "MOYO", gender: "", bio: "Assistance officielle Moyo", photo_url: null, is_premium: true, is_admin: true, is_verified: true };
  const supportMatch: Match = { id: "__support__", user1: auth.userId, user2: SUPPORT_TEAM_ID, partner: supportProfile };

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
  // Scroll uniquement si un nouveau message est apparu (count augmente), pas sur les mises à jour de is_read/reactions
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const count = msgs.length;
    if (count > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCountRef.current = count;
  }, [msgs]);

  // Mesure la hauteur du footer + scroll quand ReplyBanner apparaît/disparaît
  useEffect(() => {
    const measure = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };
    const t = setTimeout(measure, 30);
    return () => clearTimeout(t);
  }, [replyTo, showEmojiPicker]);

  // Auto-resize textarea + remesure footer à chaque frappe
  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    // Remesure le footer pour que paddingBottom de la liste suive
    if (footerRef.current) {
      setFooterHeight(footerRef.current.offsetHeight);
    }
  };

  // Reset la hauteur quand le texte est vidé (après envoi)
  useEffect(() => {
    if (text === "") {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "44px";
      }
      if (footerRef.current) {
        setTimeout(() => {
          if (footerRef.current) setFooterHeight(footerRef.current.offsetHeight);
        }, 0);
      }
    } else {
      autoResizeTextarea();
    }
  }, [text]);

  // Realtime - écoute INSERT sur les messages (nouveaux messages)
  useEffect(() => {
    if (!open) return;
    if (open.id === "__support__") {
      const supportInterval = setInterval(() => loadMsgs(open), 3000);
      return () => clearInterval(supportInterval);
    }
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
        if (open.id === "__support__") { await loadMsgs(open); return; }
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

  const loadStatuses = async (list: Match[] = convs) => {
    try {
      const realConvs = list.filter(c => c.id !== "__support__" && c.partner?.id);
      const partnerIds = Array.from(new Set(realConvs.map(c => c.partner!.id)));
      const now = new Date().toISOString();

      const mineRaw = await sb.query<StatusPost>(auth.token, "statuses", `?user_id=eq.${auth.userId}&expires_at=gt.${encodeURIComponent(now)}&order=created_at.desc`).catch(() => [] as StatusPost[]);
      const ownProfiles = await sb.query<Profile>(auth.token, "profiles", `?id=eq.${auth.userId}&select=id,name,age,city,gender,bio,photo_url,is_premium,is_verified&limit=1`).catch(() => [] as Profile[]);
      const ownProfile: Profile = ownProfiles?.[0] || { id: auth.userId, name: auth.name, age: 0, city: "", gender: "", bio: "", photo_url: null, is_premium: auth.isPremium };
      const mine = await Promise.all((Array.isArray(mineRaw) ? mineRaw : []).map(async st => ({ ...st, profile: { ...ownProfile, is_premium: ownProfile.is_premium ?? auth.isPremium }, image_url: await resolveStatusImageUrl(auth.token, st.image_url) })));
      setMyStatuses(mine);

      if (!partnerIds.length) { setStatuses([]); return; }
      const rows = await sb.query<StatusPost>(auth.token, "statuses", `?user_id=in.(${partnerIds.join(",")})&expires_at=gt.${encodeURIComponent(now)}&order=created_at.desc`).catch(() => [] as StatusPost[]);
      const byPartner = new Map(realConvs.map(c => [c.partner!.id, c.partner!]));
      const enriched = await Promise.all((Array.isArray(rows) ? rows : [])
        .map(st => ({ ...st, profile: byPartner.get(st.user_id) }))
        .filter(st => st.profile)
        .map(async st => ({ ...st, image_url: await resolveStatusImageUrl(auth.token, st.image_url) }))
      );
      setStatuses(enriched);
    } catch {
      setStatuses([]);
      setMyStatuses([]);
    }
  };

  const handleStatusFile = async (file?: File | null) => {
    if (!file) return;
    if (!auth.isPremium) { onShowPremium("Les statuts sont réservés aux membres Premium."); return; }
    const hasRealMatch = convs.some(c => c.id !== "__support__" && c.partner?.id);
    if (!hasRealMatch) { setToast({ msg: "Tu dois avoir au moins un match pour publier un statut.", type: "error" }); return; }
    setStatusUploading(true);
    try {
      const now = new Date().toISOString();
      // Vérification serveur obligatoire : évite de publier 2 + 2 statuts si l'état React n'est pas encore synchronisé.
      const activeMine = await sb.query<StatusPost>(auth.token, "statuses", `?user_id=eq.${auth.userId}&expires_at=gt.${encodeURIComponent(now)}&select=id`)
        .catch(() => [] as StatusPost[]);
      if ((Array.isArray(activeMine) ? activeMine.length : 0) >= STATUS_LIMIT) {
        setToast({ msg: `Tu as déjà ${STATUS_LIMIT}/${STATUS_LIMIT} statuts actifs. Attends l'expiration ou supprime un statut avant d'en publier un autre.`, type: "error" });
        return;
      }

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${auth.userId}/${Date.now()}.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/statuses/${path}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${auth.token}`, "apikey": SUPABASE_KEY, "Content-Type": file.type || "image/jpeg", "x-upsert": "true" },
        body: file,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text().catch(() => "");
        console.error("[Moyo][Statuses] Upload impossible", uploadRes.status, err);
        throw new Error("upload_failed");
      }
      // On stocke le chemin brut en base. L'URL publique/signée est régénérée à l'affichage.
      const image_url = path;
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await sb.insert<StatusPost>(auth.token, "statuses", { user_id: auth.userId, image_url, image_path: path, caption: null, expires_at });
      setShowStatusComposer(false);
      setToast({ msg: "Statut publié pour 24h.", type: "success" });
      await loadStatuses(convs);
    } catch (err) {
      console.error("[Moyo][Statuses] Publication impossible", err);
      setToast({ msg: "Impossible de publier le statut. Vérifie la table/bucket statuses.", type: "error" });
    } finally {
      setStatusUploading(false);
      if (statusInputRef.current) statusInputRef.current.value = "";
    }
  };

  const handleDeleteStatus = async (status?: StatusPost | null) => {
    if (!status?.id) return;
    if (status.user_id !== auth.userId) {
      setToast({ msg: "Tu ne peux supprimer que tes propres statuts.", type: "error" });
      return;
    }
    const ok = window.confirm("Supprimer ce statut ?");
    if (!ok) return;

    setStatusDeleting(true);
    try {
      const rawPath = status.image_path || getStatusStoragePath(status.image_url);
      if (rawPath) {
        const cleanPath = rawPath.replace(/^statuses\//, "").replace(/^status\//, "").replace(/^\//, "");
        // Supprimer le fichier Storage si possible. Si le fichier est déjà absent, on continue pour supprimer la ligne DB.
        const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/object/statuses/${cleanPath}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${auth.token}`, "apikey": SUPABASE_KEY },
        });
        if (!storageRes.ok) {
          const detail = await storageRes.text().catch(() => "");
          console.warn("[Moyo][Statuses] Suppression fichier statut non bloquante", storageRes.status, detail);
        }
      }

      await sb.delete(auth.token, "statuses", `?id=eq.${status.id}&user_id=eq.${auth.userId}`);
      setMyStatuses(prev => prev.filter(s => s.id !== status.id));
      setStatuses(prev => prev.filter(s => s.id !== status.id));
      closeStatusViewer();
      setToast({ msg: "Statut supprimé.", type: "success" });
      await loadStatuses(convs);
    } catch (err) {
      console.error("[Moyo][Statuses] Suppression impossible", err);
      setToast({ msg: "Impossible de supprimer le statut.", type: "error" });
    } finally {
      setStatusDeleting(false);
    }
  };


  const openStatusViewer = (list: StatusPost[], startIndex = 0) => {
    const raw = (Array.isArray(list) ? list : []).filter(st => !!st.image_url);
    if (!raw.length) return;
    const sorted = [...raw].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    const wanted = raw[startIndex];
    const index = wanted ? Math.max(0, sorted.findIndex(x => (x.id || x.image_url) === (wanted.id || wanted.image_url))) : Math.max(0, Math.min(startIndex, sorted.length - 1));
    const safeIndex = index >= 0 ? index : 0;
    setStatusPreviewList(sorted);
    setStatusPreviewIndex(safeIndex);
    setStatusProgress(0);
    setStatusPaused(false);
    setStatusPreview(sorted[safeIndex]);
  };

  const closeStatusViewer = () => {
    setStatusPreview(null);
    setStatusPreviewList([]);
    setStatusPreviewIndex(0);
    setStatusProgress(0);
    setStatusPaused(false);
    setStatusReplyText("");
  };

  const getMatchWithUser = (userId?: string | null) => {
    if (!userId) return null;
    return convs.find(c => c.id !== "__support__" && c.partner?.id === userId) || null;
  };

  const insertStatusInteraction = async (table: "status_status_views" | "status_status_likes", payload: object) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...sb.h(auth.token), "Prefer": "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify(payload),
    });
    if (!r.ok && r.status !== 409) {
      const detail = await r.text().catch(() => "");
      console.warn(`[Moyo][Statuses] interaction ${table} non enregistrée`, r.status, detail);
    }
  };

  const loadStatusEngagement = async (st?: StatusPost | null) => {
    if (!st?.id) return;
    try {
      const [views, likes, myLike] = await Promise.all([
        sb.query<any>(auth.token, "status_status_views", `?status_id=eq.${st.id}&select=id`).catch(() => []),
        sb.query<any>(auth.token, "status_status_likes", `?status_id=eq.${st.id}&select=id,user_id`).catch(() => []),
        sb.query<any>(auth.token, "status_status_likes", `?status_id=eq.${st.id}&user_id=eq.${auth.userId}&select=id&limit=1`).catch(() => []),
      ]);
      setStatusStats(prev => ({ ...prev, [st.id!]: { views: Array.isArray(views) ? views.length : 0, likes: Array.isArray(likes) ? likes.length : 0 } }));
      setStatusLikedByMe(prev => ({ ...prev, [st.id!]: Array.isArray(myLike) && myLike.length > 0 }));
    } catch {}
  };

  const recordStatusView = async (st?: StatusPost | null) => {
    if (!st?.id || st.user_id === auth.userId) return;
    const key = `moyo_status_view_${st.id}_${auth.userId}`;
    if (sessionStorage.getItem(key)) return;
    try {
      await insertStatusInteraction("status_status_views", { status_id: st.id, viewer_id: auth.userId });
      sessionStorage.setItem(key, "1");
      await loadStatusEngagement(st);
    } catch (e) {
      console.warn("[Moyo][Statuses] vue non enregistrée", e);
    }
  };

  const toggleStatusLike = async (st?: StatusPost | null) => {
    if (!st?.id || st.user_id === auth.userId || statusActionLoading) return;
    setStatusActionLoading(true);
    try {
      const existing = await sb.query<any>(auth.token, "status_status_likes", `?status_id=eq.${st.id}&user_id=eq.${auth.userId}&select=id&limit=1`).catch(() => []);
      if (Array.isArray(existing) && existing[0]?.id) {
        await sb.delete(auth.token, "status_status_likes", `?id=eq.${existing[0].id}`);
        setStatusLikedByMe(prev => ({ ...prev, [st.id!]: false }));
        setStatusStats(prev => ({ ...prev, [st.id!]: { views: prev[st.id!]?.views || 0, likes: Math.max(0, (prev[st.id!]?.likes || 1) - 1) } }));
      } else {
        await sb.insert(auth.token, "status_status_likes", { status_id: st.id, user_id: auth.userId });
        setStatusLikedByMe(prev => ({ ...prev, [st.id!]: true }));
        setStatusStats(prev => ({ ...prev, [st.id!]: { views: prev[st.id!]?.views || 0, likes: (prev[st.id!]?.likes || 0) + 1 } }));
      }
    } catch {
      setToast({ msg: "Impossible d’enregistrer le j’aime pour ce statut.", type: "error" });
    } finally {
      await loadStatusEngagement(st);
      setStatusActionLoading(false);
    }
  };

  const sendStatusReply = async (st?: StatusPost | null) => {
    const content = statusReplyText.trim();
    if (!st?.id || st.user_id === auth.userId || !content || statusActionLoading) return;
    const match = getMatchWithUser(st.user_id);
    if (!match) { setToast({ msg: "Vous devez avoir un match actif pour répondre à ce statut.", type: "error" }); return; }
    setStatusActionLoading(true);
    try {
      const prefix = `[↩ Statut Moyo : ${st.caption || "Photo"}]\n`;
      await sb.insert<Message>(auth.token, "messages", { match_id: match.id, sender_id: auth.userId, content: prefix + content, is_read: false });
      setStatusReplyText("");
      setToast({ msg: "Réponse envoyée dans la conversation.", type: "success" });
    } catch {
      setToast({ msg: "Impossible d’envoyer la réponse au statut.", type: "error" });
    } finally {
      setStatusActionLoading(false);
    }
  };

  const goStatusStep = (dir: 1 | -1) => {
    const list = statusPreviewList.length ? statusPreviewList : (statusPreview ? [statusPreview] : []);
    if (!list.length) return;
    const next = statusPreviewIndex + dir;
    if (next < 0) {
      setStatusProgress(0);
      return;
    }
    if (next >= list.length) {
      closeStatusViewer();
      return;
    }
    setStatusPreviewIndex(next);
    setStatusPreview(list[next]);
    setStatusProgress(0);
    setStatusPaused(false);
  };

  useEffect(() => {
    if (!statusPreview || !statusPreviewList.length) return;
    setStatusProgress(0);
    const duration = 5200;
    const step = 100;
    const timer = setInterval(() => {
      setStatusProgress(prev => {
        if (statusPaused) return prev;
        const next = prev + (step / duration) * 100;
        if (next >= 100) {
          setTimeout(() => goStatusStep(1), 0);
          return 100;
        }
        return next;
      });
    }, step);
    return () => clearInterval(timer);
  }, [statusPreview?.id, statusPreviewList.length, statusPaused]);

  useEffect(() => {
    if (!statusPreview?.id) return;
    loadStatusEngagement(statusPreview);
    recordStatusView(statusPreview);
  }, [statusPreview?.id]);

  const loadConvs = async () => {
    setLoading(true);
    const res = await sb.query<Match>(auth.token, "matches", `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})`);
    const supportRows = await sb.query<ReportRowLike>(auth.token, "reports", `?select=id,reason,reporter_id,reported_id,status,created_at&or=(reporter_id.eq.${auth.userId},reported_id.eq.${auth.userId})&order=created_at.desc&limit=50`).catch(() => [] as ReportRowLike[]);
    const hasSupport = supportRows.some(r => isSupportReason(r.reason));
    if (!res.length) {
      const onlySupport = hasSupport ? [{ ...supportMatch, lastMsg: supportRows.find(r => isSupportReason(r.reason)) ? { match_id: "__support__", sender_id: supportRows.find(r => isSupportReason(r.reason))!.reason.startsWith(SUPPORT_PREFIX_REPLY) ? SUPPORT_TEAM_ID : auth.userId, content: cleanSupportReason(supportRows.find(r => isSupportReason(r.reason))!.reason), is_read: true, created_at: supportRows.find(r => isSupportReason(r.reason))!.created_at } : undefined } as Match] : [];
      setConvs(onlySupport); await loadStatuses(onlySupport); onUnreadCount(0); setLoading(false); return onlySupport;
    }
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
    const supportLast = supportRows.find(r => isSupportReason(r.reason));
    const finalConvs = hasSupport
      ? [{ ...supportMatch, lastMsg: supportLast ? { match_id: "__support__", sender_id: supportLast.reason.startsWith(SUPPORT_PREFIX_REPLY) ? SUPPORT_TEAM_ID : auth.userId, content: cleanSupportReason(supportLast.reason), is_read: true, created_at: supportLast.created_at } : undefined } as Match, ...deduped]
      : deduped;
    setConvs(finalConvs);
    await loadStatuses(finalConvs);
    onUnreadCount(finalConvs.reduce((s, c) => s + (c.unreadCount || 0), 0));
    setLoading(false);
    return finalConvs;
  };

  const loadMsgs = async (conv: Match) => {
    if (conv.id === "__support__") {
      const rows = await sb.query<ReportRowLike>(auth.token, "reports", `?select=id,reason,reporter_id,reported_id,status,created_at&or=(reporter_id.eq.${auth.userId},reported_id.eq.${auth.userId})&order=created_at.asc&limit=200`).catch(() => [] as ReportRowLike[]);
      const supportMsgs: Message[] = rows.filter(r => isSupportReason(r.reason)).map(r => ({
        id: r.id,
        match_id: "__support__",
        sender_id: r.reason.startsWith(SUPPORT_PREFIX_REPLY) ? SUPPORT_TEAM_ID : auth.userId,
        content: cleanSupportReason(r.reason),
        is_read: true,
        created_at: r.created_at,
      }));
      setMsgs(supportMsgs);
      setMsgCount(supportMsgs.filter(m => m.sender_id === auth.userId).length);
      loadConvs();
      return;
    }
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
    if (open.id === "__support__") {
      const msgText = text.trim();
      setText("");
      const res = await sb.insert<ReportRowLike>(auth.token, "reports", { reporter_id: auth.userId, reported_id: null, reason: `${SUPPORT_PREFIX_USER} ${msgText}`, status: "pending" });
      const saved = res[0];
      setMsgs(prev => [...prev, { id: saved?.id, match_id: "__support__", sender_id: auth.userId, content: msgText, is_read: true, created_at: saved?.created_at || new Date().toISOString() }]);
      loadConvs();
      return;
    }
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
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", paddingBottom: `${footerHeight + 14}px`, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
        <img src="/msg-bg.png" alt="" style={{ position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, height: `calc(100% - 48px - ${footerHeight}px)`, objectFit: "cover", objectPosition: "top", zIndex: 0, pointerEvents: "none", opacity: 1 }} />
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
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, flexDirection: isMine ? "row-reverse" : "row", width: "100%", justifyContent: isMine ? "flex-start" : "flex-start" }}>
                  <div
                    style={{ position: "relative", maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}
                    onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd} onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd}
                  >
                    <div className="msg-arrow" onClick={(e) => { e.stopPropagation(); setContextMenu({ msg: m, x: 0, y: 0 }); }} style={{ position: "absolute", top: 6, right: 6, zIndex: 3, cursor: "pointer", width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.78)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
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
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, flexDirection: isMine ? "row-reverse" : "row", width: "100%", justifyContent: isMine ? "flex-start" : "flex-start" }}>
                  <div style={{ position: "relative", maxWidth: "72%" }}>
                    <div
                      style={{ position: "relative", background: isMine ? G.rouge : G.blanc, color: isMine ? G.blanc : G.brun, padding: "22px 14px 10px", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: "0.88rem", lineHeight: 1.5, userSelect: "none", WebkitUserSelect: "none", overflowWrap: "anywhere", wordBreak: "break-word" }}
                      onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd} onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd}
                    >
                      <div className="msg-arrow" onClick={(e) => { e.stopPropagation(); setContextMenu({ msg: m, x: 0, y: 0 }); }} style={{ position: "absolute", top: 5, right: 6, zIndex: 3, cursor: "pointer", width: 20, height: 20, borderRadius: "50%", background: isMine ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isMine ? "rgba(255,255,255,0.85)" : "#555"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
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
      <div ref={footerRef} style={{ background: G.blanc, borderTop: `1px solid ${G.gris}`, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* Bandeau répondre style WhatsApp — visible immédiatement au-dessus du champ */}
        {replyTo && (
          <div style={{ padding: "8px 12px 0 12px" }}>
            <ReplyBanner replyTo={replyTo} partnerName={open?.partner?.name} myId={auth.userId} onCancel={() => setReplyTo(null)} />
          </div>
        )}
        {/* Palette emojis */}
        {showEmojiPicker && (
          <>
            {/* Overlay invisible — ferme la palette si on touche ailleurs */}
            <div onClick={() => setShowEmojiPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
            <div style={{ padding: "10px 12px 4px 12px", borderBottom: `1px solid ${G.gris}`, position: "relative", zIndex: 11 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                {["😊","😍","🥰","😘","😁","😂","🤣","😅","😆","😉","😋","😎","🤩","😏","🥳","😔","😢","😭","😤","😡","🤔","🫠","😶","🫡","🥺","🙏","👏","💪","🤝","👍","❤️","🧡","💛","💚","💙","💜","🖤","💔","💕","💞","💓","💗","💖","💝","🌹","🌸","🌺","🌷","✨","🎉","🎊","🥂","🍀","🌍","🔥","💫","⭐","🌟","🌈","🎶","🎵","💃","🕺","😴","🤗","🫶","🙌","👀","💯","🫀","🥹","🤭","😇","🤠","🥸","😼","🫣","🤫","🫦"].map(em => (
                  <span key={em} onClick={() => { setText(prev => prev + em); }} style={{ fontSize: "1.45rem", cursor: "pointer", lineHeight: 1, padding: "3px 2px", borderRadius: 6, transition: "transform 0.1s", userSelect: "none", WebkitUserSelect: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.25)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >{em}</span>
                ))}
              </div>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "10px 12px" }}>
          {/* Bouton image - Premium */}
          <input ref={imgRef} type="file" accept="image/*" onChange={sendImage} style={{ display: "none" }} />
          <div onClick={() => auth.isPremium ? imgRef.current?.click() : onShowPremium("L'envoi de photos est réservé aux membres Premium !")}
            style={{ width: 40, height: 40, borderRadius: "50%", background: auth.isPremium ? "rgba(192,57,43,0.08)" : "#F5F5F5", border: `1.5px solid ${auth.isPremium ? "rgba(192,57,43,0.25)" : "#E0E0E0"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginBottom: 2 }}>
            {imgLoading ? <span style={{ fontSize: "0.8rem" }}>⏳</span> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={auth.isPremium ? G.rouge : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
          {/* Bouton emoji */}
          <div onClick={() => setShowEmojiPicker(prev => !prev)}
            style={{ width: 40, height: 40, borderRadius: "50%", background: showEmojiPicker ? "rgba(192,57,43,0.12)" : "rgba(44,26,14,0.06)", border: `1.5px solid ${showEmojiPicker ? "rgba(192,57,43,0.35)" : G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s", marginBottom: 2 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showEmojiPicker ? G.rouge : "#888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setShowEmojiPicker(false)}
            placeholder="Écris un message..."
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              width: "auto",
              display: "block",
              boxSizing: "border-box",
              padding: "11px 14px",
              border: `2px solid ${G.gris}`,
              borderRadius: 20,
              fontSize: "16px",
              outline: "none",
              background: G.creme,
              resize: "none",
              fontFamily: "inherit",
              lineHeight: "1.4",
              minHeight: 44,
              maxHeight: 120,
              overflowY: "auto",
              overflowX: "hidden",
              verticalAlign: "bottom",
              wordBreak: "break-word",
              WebkitOverflowScrolling: "touch",
            }}
          />
          <div onClick={() => { send(); setShowEmojiPicker(false); }} style={{ width: 44, height: 44, borderRadius: "50%", background: G.rouge, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: G.blanc, flexShrink: 0, marginBottom: 2 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
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
                const contentToCopy = contextMenu.msg.content.replace(/^\[↩ .+? : .+?\]\n/, "").replace(/^\[img\](.*)\[\/img\]$/, "$1");
                setContextMenu(null);
                try {
                  await navigator.clipboard.writeText(contentToCopy);
                  setToast({ msg: "Message copié", type: "success" });
                } catch {
                  setToast({ msg: "Impossible de copier le message", type: "error" });
                }
              }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", cursor: "pointer", borderBottom: `1px solid ${G.gris}` }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 600, color: G.brun }}>Copier</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.brun} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
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

  const statusGroups = Array.from(
    statuses.reduce((acc, st) => {
      if (!st.user_id) return acc;
      const current = acc.get(st.user_id) || [];
      current.push(st);
      acc.set(st.user_id, current);
      return acc;
    }, new Map<string, StatusPost[]>())
  ).map(([userId, items]) => ({
    userId,
    items: [...items].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()),
    first: [...items].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())[0],
  })).filter(g => !!g.first);

  return <div style={{ padding: "12px 16px 16px" }}>
    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 16 }}>Messages</h2>
    <input ref={statusInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleStatusFile(e.target.files?.[0])} />
    <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "2px 0 12px", marginBottom: 10, WebkitOverflowScrolling: "touch" }}>
      <div onClick={() => {
        if (!auth.isPremium) { onShowPremium("Publier un statut est réservé aux membres Premium."); return; }
        if (myStatuses.length > 0) { openStatusViewer(myStatuses, 0); return; }
        setShowStatusComposer(true);
      }} style={{ minWidth: 74, textAlign: "center", cursor: "pointer" }}>
        <div style={{ position: "relative", width: 58, height: 58, borderRadius: "50%", margin: "0 auto 6px", padding: myStatuses.length ? 3 : 0, border: myStatuses.length ? `2px solid ${G.rouge}` : `2px dashed rgba(192,57,43,0.35)`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(192,57,43,0.05)", color: G.rouge, fontSize: "1.6rem", fontWeight: 800 }}>
          {myStatuses.length ? <Avatar url={myStatuses[0]?.profile?.photo_url} gender={myStatuses[0]?.profile?.gender} size={50} premium={auth.isPremium} /> : "+"}
          {auth.isPremium && myStatuses.length < STATUS_LIMIT && (
            <button onClick={(e) => { e.stopPropagation(); setShowStatusComposer(true); }} aria-label="Ajouter un statut" style={{ position: "absolute", right: -4, bottom: -2, width: 24, height: 24, borderRadius: "50%", border: "2px solid #fff", background: G.rouge, color: "#fff", fontSize: "1rem", lineHeight: 1, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.18)", WebkitTapHighlightColor: "transparent" }}>+</button>
          )}
        </div>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: G.rouge }}>Mon statut</div>
        <div style={{ fontSize: "0.65rem", color: "#999" }}>{myStatuses.length ? `Voir • ${myStatuses.length}/${STATUS_LIMIT}` : `0/${STATUS_LIMIT}`}</div>
      </div>
      {statusGroups.slice(0, 12).map(group => {
        const st = group.first;
        return (
        <div key={group.userId} onClick={() => openStatusViewer(group.items, 0)} style={{ minWidth: 74, textAlign: "center", cursor: "pointer" }}>
          <div style={{ position: "relative", width: 58, height: 58, borderRadius: "50%", margin: "0 auto 6px", padding: 3, border: `2px solid ${st.profile?.is_premium ? G.or : G.rouge}` }}>
            <Avatar url={st.profile?.photo_url} gender={st.profile?.gender} size={50} premium={false} />
            <span style={{ position: "absolute", right: -2, bottom: 4, width: 12, height: 12, borderRadius: "50%", background: G.rouge, border: "2px solid #fff" }} />
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: G.brun, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.profile?.name || "Statut"}</div>
          <div style={{ fontSize: "0.65rem", color: G.rouge }}>{group.items.length > 1 ? `${group.items.length} photos` : "Nouveau"}</div>
        </div>
      );})}
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.72rem", color: "#999", marginBottom: 14 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><span>Les statuts sont visibles uniquement par vos matchs</span>
    </div>
    {showStatusComposer && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 650, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowStatusComposer(false)}>
        <div style={{ background: G.blanc, borderRadius: 22, padding: 22, width: "100%", maxWidth: 340, boxShadow: "0 18px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: 8 }}>Publier un statut</h3>
          <p style={{ fontSize: "0.86rem", color: "#666", lineHeight: 1.5, marginBottom: 16 }}>Tu peux publier {STATUS_LIMIT} statuts actifs maximum sur 24h. Chaque statut disparaît après 24h et reste visible uniquement par tes matchs.</p>
          <Btn variant="primary" onClick={() => statusInputRef.current?.click()} loading={statusUploading} disabled={myStatuses.length >= STATUS_LIMIT} style={{ width: "100%" }}>{statusUploading ? "Publication..." : myStatuses.length >= STATUS_LIMIT ? "Limite atteinte" : "Ajouter une photo"}</Btn>
          <Btn variant="ghost" onClick={() => setShowStatusComposer(false)} style={{ width: "100%", marginTop: 10 }}>Annuler</Btn>
        </div>
      </div>
    )}
    {statusPreview && (
      <div
        onPointerDownCapture={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest("button") && !target.closest("input")) {
            e.preventDefault();
            setStatusPaused(true);
          }
        }}
        onTouchStart={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest("button") && !target.closest("input")) {
            e.preventDefault();
            setStatusPaused(true);
          }
        }}
        onPointerUp={() => setStatusPaused(false)}
        onPointerCancel={() => setStatusPaused(false)}
        onPointerLeave={() => setStatusPaused(false)}
        onTouchEnd={() => setStatusPaused(false)}
        onTouchCancel={() => setStatusPaused(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "88px 18px 22px", touchAction: "none", overscrollBehavior: "contain" }}
      >
        <div style={{ position: "absolute", top: 10, left: 12, right: 12, display: "flex", gap: 4, zIndex: 3 }}>
          {(statusPreviewList.length ? statusPreviewList : [statusPreview]).map((st, i) => (
            <div key={st.id || st.image_url || i} style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
              <div style={{ width: `${i < statusPreviewIndex ? 100 : i === statusPreviewIndex ? statusProgress : 0}%`, height: "100%", background: "#fff", borderRadius: 999, transition: "width 100ms linear" }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 24, left: 18, right: 18, display: "flex", alignItems: "center", gap: 10, color: "#fff", zIndex: 3 }}>
          <Avatar url={statusPreview.profile?.photo_url} gender={statusPreview.profile?.gender} size={44} premium={statusPreview.profile?.is_premium} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: "1.02rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{statusPreview.profile?.name || "Statut"}</div>
            <div style={{ fontSize: "0.78rem", opacity: 0.82 }}>Statut Moyo</div>
          </div>
          {statusPreview.user_id === auth.userId && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteStatus(statusPreview); }}
              disabled={statusDeleting}
              title="Supprimer ce statut"
              style={{ marginLeft: "auto", width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(192,57,43,0.92)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: statusDeleting ? "wait" : "pointer", opacity: statusDeleting ? 0.65 : 1, padding: 0, boxShadow: "0 6px 16px rgba(0,0,0,0.22)" }}
            >
              {statusDeleting ? "…" : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); closeStatusViewer(); }} style={{ marginLeft: statusPreview.user_id === auth.userId ? 8 : "auto", width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.16)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, boxShadow: "0 6px 16px rgba(0,0,0,0.18)" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <button aria-label="Statut précédent" onPointerDown={() => setStatusPaused(true)} onPointerUp={() => setStatusPaused(false)} onTouchStart={(e) => { e.preventDefault(); setStatusPaused(true); }} onTouchEnd={() => setStatusPaused(false)} onClick={(e) => { e.stopPropagation(); goStatusStep(-1); }} style={{ position: "absolute", left: 0, top: 82, bottom: 0, width: "34%", zIndex: 2, background: "transparent", border: "none", cursor: "pointer" }} />
        <button aria-label="Statut suivant" onPointerDown={() => setStatusPaused(true)} onPointerUp={() => setStatusPaused(false)} onTouchStart={(e) => { e.preventDefault(); setStatusPaused(true); }} onTouchEnd={() => setStatusPaused(false)} onClick={(e) => { e.stopPropagation(); goStatusStep(1); }} style={{ position: "absolute", right: 0, top: 82, bottom: 0, width: "66%", zIndex: 2, background: "transparent", border: "none", cursor: "pointer" }} />
        {statusPreview.image_url ? <img src={statusPreview.image_url} alt="Statut" onClick={e => e.stopPropagation()} onError={async e => { const signed = await getStatusSignedFallbackUrl(auth.token, statusPreview.image_url); if (signed && signed !== statusPreview.image_url) { (e.currentTarget as HTMLImageElement).src = signed; setStatusPreview(prev => prev ? { ...prev, image_url: signed } : prev); } }} style={{ maxWidth: "100%", maxHeight: statusPreview.user_id === auth.userId ? "78vh" : "68vh", borderRadius: 22, objectFit: "contain", boxShadow: "0 18px 60px rgba(0,0,0,0.35)", zIndex: 1 }} /> : null}
        {statusPreview.user_id === auth.userId ? (
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: 18, right: 18, bottom: 28, zIndex: 5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ borderRadius: 18, padding: "12px 14px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              <div><div style={{ fontSize: "0.72rem", opacity: 0.75 }}>Vues</div><div style={{ fontWeight: 900 }}>{statusStats[statusPreview.id || ""]?.views || 0}</div></div>
            </div>
            <div style={{ borderRadius: 18, padding: "12px 14px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <div><div style={{ fontSize: "0.72rem", opacity: 0.75 }}>J’aime</div><div style={{ fontWeight: 900 }}>{statusStats[statusPreview.id || ""]?.likes || 0}</div></div>
            </div>
          </div>
        ) : (
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: 18, right: 18, bottom: 26, zIndex: 5, display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => toggleStatusLike(statusPreview)} disabled={statusActionLoading} aria-label="Aimer ce statut" style={{ height: 48, minWidth: 54, borderRadius: 999, border: "1px solid rgba(255,255,255,0.22)", background: statusLikedByMe[statusPreview.id || ""] ? "rgba(192,57,43,0.92)" : "rgba(255,255,255,0.13)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={statusLikedByMe[statusPreview.id || ""] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <input value={statusReplyText} onChange={e => setStatusReplyText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendStatusReply(statusPreview); }} placeholder="Envoyer un message…" style={{ flex: 1, minWidth: 0, height: 48, borderRadius: 999, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.13)", color: "#fff", padding: "0 16px", outline: "none", fontSize: "0.95rem" }} />
            <button onClick={() => sendStatusReply(statusPreview)} disabled={!statusReplyText.trim() || statusActionLoading} aria-label="Envoyer la réponse" style={{ height: 48, width: 50, borderRadius: "50%", border: "none", background: statusReplyText.trim() ? G.rouge : "rgba(255,255,255,0.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: statusReplyText.trim() ? "pointer" : "default" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        )}
      </div>
    )}
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

