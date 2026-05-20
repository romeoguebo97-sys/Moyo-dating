import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { G, SUPABASE_URL, SUPABASE_KEY, VILLES, RELIGIONS, FREE_LIMITS, STATUS_LIMIT, LIFETIME_PREMIUM_UNTIL, PREMIUM_30_DAYS_MS, SUPER_ADMIN_ID, REFERRAL_BONUS_DAYS, SUPPORT_TEAM_ID, SUPPORT_TEAM_NAME, MSG_BG_STYLE } from "../../constants";
import { Auth, Profile, Match, Message, StatusPost, LikeRecord, ViewRecord, VisitRecord, MatchRecord } from "../../types";
import { sb, sendMatchWelcomeMessage } from "../../lib/supabase";
import { shuffleArray, priorityRandomizeProfiles } from "../../utils/profiles";
import { moderateMessage, getModerationMessage, hasContactInfo, isSupportReason, cleanSupportReason } from "../../utils/moderation";
import { resolveStatusImageUrl, getStatusSignedFallbackUrl, buildStatusPublicUrl, getStatusStoragePath } from "../../utils/status";
import { Btn, Input, Toast, Avatar, Badge, Spinner, EmptyState, InnerSwitch, ErrorModal, ModerationModal, VerifiedBadge, PremiumBadge, PremiumBlur } from "../ui";

export function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (blob: Blob) => void; onCancel: () => void }) {
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

export function Profile({ auth, onLogout, onShowPremium, darkMode, onToggleDark }: { auth: Auth; onLogout: () => void; onShowPremium: (r: string) => void; darkMode?: boolean; onToggleDark?: () => void }) {
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

  // ── NOTATION ──
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("main");

  const loadExistingRating = async () => {
    try {
      const res = await sb.query<{ id: string; rating: number; comment: string }>(
        auth.token, "app_ratings", `?user_id=eq.${auth.userId}`
      );
      if (res[0]) {
        setExistingRatingId(res[0].id);
        setUserRating(res[0].rating);
        setRatingComment(res[0].comment || "");
        setRatingSubmitted(true);
      }
    } catch {}
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) { setRatingError("Choisis une note avant d'envoyer."); return; }
    if (ratingComment.length > 300) { setRatingError("Le commentaire ne doit pas dépasser 300 caractères."); return; }
    setRatingLoading(true);
    setRatingError("");
    try {
      const payload = { user_id: auth.userId, rating: userRating, comment: ratingComment.trim() || null };
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/app_ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${auth.token}`,
            "Prefer": "return=representation,resolution=merge-duplicates",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!r.ok) throw new Error("Erreur réseau");
      const data = await r.json().catch(() => null);
      if (data?.[0]?.id) setExistingRatingId(data[0].id);
      setRatingSubmitted(true);
      setToast({ msg: existingRatingId ? "Avis mis à jour !" : "Merci pour ton avis !", type: "success" });
    } catch {
      setRatingError("Une erreur est survenue. Réessaie dans quelques instants.");
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => { loadProfile(); loadBlocked(); loadExistingRating(); }, []);
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
    await sb.update(auth.token, "profiles", auth.userId, { name: form.name, age: form.age, city: form.city, bio: form.bio, religion: form.religion, profession: (form.profession || "").trim() || null, hobbies: (form.hobbies || "").trim() || null });
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      // ── Étape 1 : supprimer toutes les données associées en cascade ──
      await Promise.all([
        sb.delete(auth.token, "likes", `?from_user=eq.${auth.userId}`),
        sb.delete(auth.token, "likes", `?to_user=eq.${auth.userId}`),
        sb.delete(auth.token, "blocks", `?blocker_id=eq.${auth.userId}`),
        sb.delete(auth.token, "blocks", `?blocked_id=eq.${auth.userId}`),
        sb.delete(auth.token, "profile_views", `?viewer_id=eq.${auth.userId}`),
        sb.delete(auth.token, "profile_views", `?viewed_id=eq.${auth.userId}`),
        sb.delete(auth.token, "dismissed_cards", `?user_id=eq.${auth.userId}`),
        sb.delete(auth.token, "app_ratings", `?user_id=eq.${auth.userId}`),
        sb.delete(auth.token, "statuses", `?user_id=eq.${auth.userId}`),
        sb.delete(auth.token, "payment_requests", `?user_id=eq.${auth.userId}`),
      ]);

      // ── Étape 2 : supprimer les matchs et leurs messages ──
      const matches = await sb.query<{ id: string }>(
        auth.token, "matches",
        `?or=(user1.eq.${auth.userId},user2.eq.${auth.userId})&select=id`
      );
      if (Array.isArray(matches) && matches.length > 0) {
        const ids = matches.map(m => m.id);
        for (const id of ids) {
          await sb.delete(auth.token, "messages", `?match_id=eq.${id}`);
        }
        await sb.delete(auth.token, "matches", `?user1=eq.${auth.userId}`);
        await sb.delete(auth.token, "matches", `?user2=eq.${auth.userId}`);
      }

      // ── Étape 3 : appeler la RPC Supabase qui supprime le compte Auth ──
      // Cette RPC doit exister dans Supabase (voir SQL fourni séparément)
      const rpcResult = await sb.rpc(auth.token, "delete_user");
      console.log("[Moyo][Delete] RPC delete_user result:", rpcResult);

      // ── Étape 4 : déconnexion propre et redirection ──
      await sb.signOut(auth.token);
      onLogout();
    } catch (e: any) {
      console.error("[Moyo][Delete] Erreur suppression compte :", e);
      setDeleteError("Une erreur est survenue lors de la suppression. Réessaie ou contacte le support à contact@moyo-congo.com");
      setDeleteLoading(false);
    }
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
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Profession <span style={{ color: "#aaa", fontSize: "0.78rem", fontWeight: 400 }}>(optionnel)</span></label>
        <input value={form.profession || ""} onChange={e => setForm(f => ({ ...f, profession: e.target.value.slice(0, 60) }))} placeholder="Ex : Infirmière, Ingénieur, Étudiant…" style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", fontFamily: "inherit" }} />
        <label style={{ display: "block", fontWeight: 600, marginBottom: 7, fontSize: "0.88rem", color: "#555" }}>Centres d'intérêt / Hobbies <span style={{ color: "#aaa", fontSize: "0.78rem", fontWeight: 400 }}>(optionnel)</span></label>
        <input value={form.hobbies || ""} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value.slice(0, 80) }))} placeholder="Ex : Lecture, Musique, Voyages, Sport…" style={{ width: "100%", boxSizing: "border-box", display: "block", padding: "13px 14px", border: `2px solid ${G.gris}`, borderRadius: 12, marginBottom: 14, fontSize: "0.93rem", fontFamily: "inherit" }} />
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

  const isWideProfile = window.innerWidth >= 768;
  const isVisible = profile?.is_visible !== false;

  const menuItems = [
    { id: "main", label: "Mon profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: "edit", label: "Modifier mon profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
    { id: "photo", label: "Modifier ma photo", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
    { id: "premium", label: "Premium", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, badge: auth.isPremium ? "✓" : null },
    { id: "parrainage", label: "Parrainer un ami", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "verification", label: "Vérification", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, badge: profile?.is_verified ? "✓" : null },
    { id: "visibility", label: isVisible ? "Profil visible" : "Profil invisible", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id: "blocklist", label: "Liste noire", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
    { id: "darkmode", label: darkMode ? "Mode clair" : "Mode sombre", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
    { id: "rating", label: "Noter l'application", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    { id: "preview", label: "Voir mon profil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id: "invite", label: "Inviter un ami", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.07 6.07l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
    { id: "logout", label: "Se déconnecter", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>, danger: true },
    { id: "delete", label: "Supprimer mon compte", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>, danger: true },
  ];

  const handleMenuClick = (id: string) => {
    if (id === "photo") { fileRef.current?.click(); return; }
    if (id === "darkmode") { onToggleDark?.(); return; }
    if (id === "invite") {
      const refLink = `https://moyo-congo.com?ref=${auth.userId}`;
      const msg = encodeURIComponent(`Salut ! Les célibataires congolais sont déjà sur MOYO.\nCrée ton compte gratuitement ici : ${refLink}`);
      if (navigator.share) navigator.share({ title: "Moyo Congo", text: "Rejoins-moi sur Moyo !", url: refLink });
      else window.open(`https://wa.me/?text=${msg}`, "_blank");
      return;
    }
    // ── "Voir mon profil" ouvre la modale d'aperçu (desktop + mobile) ──
    if (id === "preview") { setShowPreview(true); return; }
    setActiveSection(id);
  };

  return (
    <div style={{ background: "#EEEEF2", minHeight: "100%", display: isWideProfile ? "flex" : "block", height: isWideProfile ? "100%" : "auto", paddingBottom: isWideProfile ? 0 : 30 }}>
      <ErrorModal msg={errorMsg} onClose={() => setErrorMsg("")} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />

      {/* ── COLONNE GAUCHE : MENU 50% — masquée sur mobile ── */}
      <div style={{ width: isWideProfile ? "50%" : "100%", background: G.blanc, borderRight: isWideProfile ? `1px solid ${G.gris}` : "none", overflowY: "auto", height: isWideProfile ? "100%" : "auto", display: isWideProfile ? "flex" : "none", flexDirection: "column" }}>
        {/* Menu items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
          {menuItems.map(item => (
            <div key={item.id} onClick={() => handleMenuClick(item.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, marginBottom: 3, cursor: "pointer", background: activeSection === item.id ? "rgba(192,57,43,0.06)" : "transparent", transition: "background 0.12s" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: activeSection === item.id ? "rgba(192,57,43,0.1)" : "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: (item as any).danger ? G.rouge : activeSection === item.id ? G.rouge : "#666" }}>
                {item.icon}
              </div>
              <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: activeSection === item.id ? 700 : 500, color: (item as any).danger ? G.rouge : activeSection === item.id ? G.rouge : "#333" }}>{item.label}</span>
              {(item as any).badge && <span style={{ fontSize: "0.62rem", background: G.vert, color: G.blanc, borderRadius: 50, padding: "2px 7px", fontWeight: 700 }}>{(item as any).badge}</span>}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      </div>

      {/* ── COLONNE DROITE : CONTENU 50% ── */}
      <div style={{ width: isWideProfile ? "50%" : "100%", overflowY: "auto", height: isWideProfile ? "100%" : "auto", background: "#EEEEF2" }}>

      {/* ── ZONE BLANCHE : photo + nom + boutons — visible si section main ou mobile ── */}
      {(!isWideProfile || activeSection === "main") && <div style={{ background: G.blanc, textAlign: "center", paddingTop: 32, paddingBottom: 8 }}>

        {/* Photo ronde */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: profile?.is_premium ? `conic-gradient(${G.or} 0% 100%, ${G.gris} 100%)` : `conic-gradient(${G.rouge} 0% 100%, ${G.gris} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: profile?.is_premium ? `0 8px 32px rgba(212,168,67,0.35)` : `0 8px 32px rgba(192,57,43,0.25)` }}>
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
            {/* Modifier mon profil - niveau normal */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flex: 1 }} onClick={() => setEditing(true)}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: G.blanc, border: `2px solid ${G.gris}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1a1a1a", textAlign: "center", lineHeight: 1.3 }}>Modifier mon<br/>profil</div>
            </div>

            {/* Modifier ma photo - descend sur la vague */}
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

            {/* Liste noire - descend sur la vague */}
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

            {/* Voir mon profil - niveau normal */}
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
      </div>}{/* fin ZONE BLANCHE */}

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
                      ? <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
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
                      ? <img src={profile.photo_url} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
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
      {(!isWideProfile || ["main","premium","parrainage","verification","visibility","blocklist","darkmode","rating","logout","delete"].includes(activeSection)) && <div style={{ background: "#EEEEF2", position: "relative" }}>
        {(!isWideProfile || activeSection === "main") && <svg viewBox="0 0 500 40" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 40, marginTop: -1 }}><path d="M0,0 Q125,40 250,40 Q375,40 500,0 L500,0 L0,0 Z" fill={G.blanc}/></svg>}

        {/* ── ACTIONS (cartes empilées) ── */}
        <div style={{ padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* CTA Premium - rouge si gratuit, doré si actif, rouge si expiré */}
        {(!isWideProfile || ["premium","main"].includes(activeSection)) && (() => {
          const stored = localStorage.getItem(`moyo_premium_until_${auth.userId}`);
          const daysLeft = stored ? Math.floor((new Date(stored).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : -1;
          const isLifetime = stored && new Date(stored).getFullYear() >= 2090;
          // Si isPremium = true → toujours bouton doré, peu importe le localStorage
          if (auth.isPremium) return (
            <div style={{ background: "linear-gradient(135deg,#D4A843 0%,#B8860B 60%,#8B6914 100%)", borderRadius: 20, padding: "18px 20px", boxShadow: "0 10px 32px rgba(184,134,11,0.45)", border: "1px solid rgba(255,220,100,0.3)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.13) 0%,transparent 100%)", borderRadius: "20px 20px 0 0", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none" style={{ flexShrink: 0 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: G.blanc, lineHeight: 1.3 }}>Abonnement<br/>Premium actif</div>
                </div>
                <div style={{ width: 1, height: 44, background: "rgba(255,255,255,0.3)", marginLeft: 18, marginRight: 18, flexShrink: 0 }} />
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  {isLifetime ? (
                    <>
                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: G.blanc, lineHeight: 1 }}>∞</div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>À vie</div>
                    </>
                  ) : daysLeft >= 0 ? (
                    <>
                      <div style={{ fontSize: "1.75rem", fontWeight: 900, color: G.blanc, lineHeight: 1 }}>{daysLeft}</div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>jours</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: G.blanc, lineHeight: 1 }}>✓</div>
                      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>Actif</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
          const isExpired = !auth.isPremium && stored && daysLeft <= 0;
          return (
            <div onClick={() => onShowPremium("")} style={{ background: `linear-gradient(135deg,${G.rouge} 0%,${G.rougeDark} 100%)`, borderRadius: 18, padding: "18px 20px", cursor: "pointer", boxShadow: "0 8px 28px rgba(192,57,43,0.35)", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "transform 0.15s, box-shadow 0.15s" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {isExpired
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G.blanc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  }
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: G.blanc }}>
                    {isExpired ? "Votre Premium a expiré — Renouveler" : "Passer à Moyo Premium"}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>
                  {isExpired ? "Réabonnez-vous pour retrouver tous vos avantages" : "Messages illimités · Likes illimités · Voir qui vous like"}
                </div>
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: G.or, marginLeft: 12, flexShrink: 0 }}>3 500<br/><span style={{ fontSize: "0.65rem", fontWeight: 600 }}>FCFA/mois</span></div>
            </div>
          );
        })()}


        {/* Parrainage — mis en avant */}
        {(!isWideProfile || ["parrainage","main"].includes(activeSection)) && <div onClick={() => {
          const refLink = `https://moyo-congo.com?ref=${auth.userId}`;
          const msg = encodeURIComponent(`Salut ! Les célibataires congolais sont déjà sur MOYO.\nEt toi, tu attends quoi pour trouver quelqu'un qui te correspond vraiment ?\nCrée ton compte gratuitement ici : ${refLink}`);
          if (navigator.share) {
            navigator.share({ title: "Moyo Congo", text: `Salut ! Les célibataires congolais sont déjà sur MOYO. Crée ton compte gratuitement :`, url: refLink });
          } else {
            window.open(`https://wa.me/?text=${msg}`, "_blank");
          }
        }} style={{ background: `linear-gradient(135deg,${G.vert} 0%,#0f3d25 100%)`, borderRadius: 18, padding: "18px 20px", cursor: "pointer", boxShadow: "0 8px 28px rgba(26,92,58,0.35)", display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: G.blanc, marginBottom: 3 }}>Parrainer un ami</div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>Gagnez <span style={{ fontWeight: 800, color: G.or }}>7 jours Premium offerts</span> pour chaque ami qui s'abonne</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>}


        {/* Demande de vérification */}
        {(!isWideProfile || ["verification","main"].includes(activeSection)) && (!profile?.is_verified ? (
          <a href={`https://wa.me/242065132012?text=${encodeURIComponent(`Bonjour, je souhaite faire vérifier mon compte Moyo.\n\n👤 Nom : ${profile?.name || auth.name}\n🎂 Âge : ${profile?.age} ans\n⚥ Genre : ${profile?.gender}\n📧 Email : ${auth.email}\n\nMerci !`)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
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
        ))}

        {/* Toggle Visible / Invisible */}
        {(!isWideProfile || ["visibility","main"].includes(activeSection)) && <div style={{
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
        </div>}


        {/* Mode sombre */}
        {(!isWideProfile || ["darkmode","main"].includes(activeSection)) && <div style={{ background: G.blanc, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid #E8E8E8` }}>
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
        </div>}


        {/* ── Notation ── */}
        {(!isWideProfile || ["rating","main"].includes(activeSection)) && <div
          onClick={() => setShowRating(v => !v)}
          style={{ background: G.blanc, borderRadius: showRating ? "16px 16px 0 0" : 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${showRating ? G.or : "#E8E8E8"}`, cursor: "pointer", transition: "border-color 0.2s, border-radius 0.2s" }}
        >
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(212,168,67,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={showRating ? G.or : "none"} stroke={G.or} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>
              {ratingSubmitted ? "Ton avis Moyo" : "Noter Moyo"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#888", marginTop: 2 }}>
              {ratingSubmitted
                ? `${["", "😕", "🙁", "😐", "😊", "😍"][userRating]} ${userRating}/5 étoiles - Modifier`
                : "Donne-nous ton avis sur l'application"}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showRating ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>}

        {(!isWideProfile || ["rating","main"].includes(activeSection)) && showRating && (
            <div style={{ background: "#FAFAFA", border: `1px solid ${G.or}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "20px 20px 16px" }}>
              {ratingSubmitted && !ratingLoading ? (
                <div style={{ textAlign: "center", paddingBottom: 4 }}>
                  <div style={{ fontSize: "2rem", marginBottom: 6 }}>🎉</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", marginBottom: 4 }}>Merci pour ton avis !</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 14 }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="22" height="22" viewBox="0 0 24 24" fill={s <= userRating ? G.or : "#ddd"} stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  {ratingComment && (
                    <div style={{ fontSize: "0.8rem", color: "#666", fontStyle: "italic", marginBottom: 14, background: G.blanc, borderRadius: 10, padding: "8px 12px", border: `1px solid #EEE` }}>
                      "{ratingComment}"
                    </div>
                  )}
                  <button onClick={() => setRatingSubmitted(false)} style={{ background: "transparent", border: `1.5px solid ${G.or}`, color: "#B8860B", borderRadius: 50, padding: "8px 20px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                    Modifier mon avis
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111", marginBottom: 4, textAlign: "center" }}>Comment tu trouves Moyo ?</div>
                  <div style={{ fontSize: "0.78rem", color: "#888", marginBottom: 14, textAlign: "center" }}>Ton avis nous aide à améliorer l'application</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(star => (
                      <div key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => { setUserRating(star); setRatingError(""); }} style={{ cursor: "pointer", transform: (hoverRating || userRating) >= star ? "scale(1.25)" : "scale(1)", transition: "transform 0.15s" }}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill={(hoverRating || userRating) >= star ? G.or : "#DDD"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#aaa", marginBottom: 14, minHeight: 18 }}>
                    {userRating > 0 && ["", "Très déçu(e)", "Déçu(e)", "Correct", "Bien !", "Excellent !"][userRating]}
                  </div>
                  <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value.slice(0, 300))} placeholder="Laisse un commentaire (optionnel)..." rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1.5px solid #DDD`, fontSize: "0.82rem", resize: "none", outline: "none", fontFamily: "inherit", marginBottom: 4 }} />
                  <div style={{ textAlign: "right", fontSize: "0.72rem", color: ratingComment.length >= 280 ? G.rouge : "#ccc", marginBottom: 12 }}>{ratingComment.length}/300</div>
                  {ratingError && <div style={{ background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: "0.8rem", color: "#e74c3c", marginBottom: 10 }}>{ratingError}</div>}
                  <button onClick={handleSubmitRating} disabled={ratingLoading || userRating === 0} style={{ width: "100%", background: userRating === 0 ? "#DDD" : `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, color: userRating === 0 ? "#aaa" : G.blanc, border: "none", borderRadius: 50, padding: "12px", fontSize: "0.88rem", fontWeight: 700, cursor: userRating === 0 || ratingLoading ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: ratingLoading ? 0.7 : 1 }}>
                    {ratingLoading ? "Envoi en cours..." : existingRatingId ? "Mettre à jour mon avis" : "Envoyer mon avis"}
                  </button>
                </div>
              )}
            </div>
        )}

        {/* ── Carte Avertissements ── */}
        {(!isWideProfile || activeSection === "main") && (() => {
          const wc = profile?.warning_count ?? 0;
          const bgCard = wc === 0 ? G.blanc : wc === 1 ? "#FFFDE7" : wc === 2 ? "#FFF3E0" : "#FFF0F0";
          const borderCard = wc === 0 ? "#E8E8E8" : wc === 1 ? "#FFF176" : wc === 2 ? "#FFCC80" : "#FFBDBD";
          const iconBg = wc === 0 ? "#F5F5F5" : wc === 1 ? "rgba(255,235,59,0.2)" : wc === 2 ? "rgba(255,152,0,0.15)" : "rgba(231,76,60,0.12)";
          const iconColor = wc === 0 ? "#bbb" : wc === 1 ? "#F9A825" : wc === 2 ? "#E65100" : "#e74c3c";
          const labelColor = wc === 0 ? "#aaa" : wc === 1 ? "#F57F17" : wc === 2 ? "#E65100" : "#c0392b";
          const countColor = wc === 0 ? "#888" : wc === 1 ? "#F9A825" : wc === 2 ? "#E65100" : "#e74c3c";
          return (
            <div style={{ background: bgCard, borderRadius: 16, padding: "15px 20px", display: "flex", alignItems: "center", gap: 14, border: `1px solid ${borderCard}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: labelColor }}>Avertissements</div>
                  <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < wc ? countColor : "#E0E0E0", transition: "background 0.3s" }} />)}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: countColor, marginTop: 2 }}>{wc}/3</div>
                {wc >= 3 && <div style={{ fontSize: "0.72rem", color: "#c0392b", marginTop: 4, lineHeight: 1.5, fontWeight: 500 }}>Votre compte risque une suspension en cas de nouveau signalement.</div>}
              </div>
            </div>
          );
        })()}

        {/* Email de connexion */}
        {(!isWideProfile || activeSection === "main") && <div style={{ marginTop: 4, background: G.blanc, borderRadius: 16, padding: "14px 18px", border: `1px solid #E8E8E8`, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Email de connexion</div>
            <div style={{ fontSize: "0.88rem", color: "#aaa", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{auth.email || "-"}</div>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#ccc", background: "#F5F5F5", padding: "3px 10px", borderRadius: 50, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>Non modifiable</div>
        </div>}

        {/* ── Se déconnecter | Supprimer mon compte ── */}
        {(!isWideProfile || ["logout","delete","main"].includes(activeSection)) && <div style={{ display: "flex", gap: 10 }}>
          {(!isWideProfile || ["logout","main"].includes(activeSection)) && <div onClick={() => setShowLogout(true)} style={{ flex: 1, background: G.blanc, borderRadius: 16, padding: "15px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: `1.5px solid #E8E8E8`, minHeight: 82 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(192,57,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: G.rouge, textAlign: "center", lineHeight: 1.25 }}>Se déconnecter</div>
          </div>}
          {(!isWideProfile || ["delete","main"].includes(activeSection)) && <div onClick={() => setShowDelete(true)} style={{ flex: 1, background: "#FFF8F8", borderRadius: 16, padding: "15px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: "0 1px 4px rgba(231,76,60,0.07)", border: `1.5px solid #FFD6D6`, minHeight: 82 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(231,76,60,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#e74c3c", textAlign: "center", lineHeight: 1.25 }}>Supprimer<br/>mon compte</div>
          </div>}
        </div>}

        {/* Liste noire intégrée (section blocklist) */}
        {isWideProfile && activeSection === "blocklist" && (
          <div style={{ background: G.blanc, borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 16 }}>Liste noire</div>
            {blockedUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: "#aaa" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 10px" }}><polyline points="20 6 9 17 4 12"/></svg>
                <p style={{ fontSize: "0.88rem" }}>Aucun utilisateur bloqué</p>
              </div>
            ) : blockedUsers.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid #F5F5F5` }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: G.gris, overflow: "hidden", flexShrink: 0 }}>
                  {b.profile?.photo_url ? <img src={b.profile.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{b.profile?.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{b.profile?.name || "Utilisateur"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#888" }}>{b.profile?.city || "-"}</div>
                </div>
                <div onClick={() => handleUnblock(b.id)} style={{ background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.2)`, borderRadius: 50, padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, color: G.rouge, cursor: "pointer" }}>Débloquer</div>
              </div>
            ))}
          </div>
        )}

      </div>{/* fin actions */}
      </div>}

      {/* ── MODALES (communes mobile et desktop) ── */}
      {showBlocked && !isWideProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: G.blanc, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid #F5F5F5` }}>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Liste noire</div>
              <div onClick={() => setShowBlocked(false)} style={{ cursor: "pointer", color: "#aaa", fontSize: "1.2rem" }}>✕</div>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 0 20px" }}>
              {blockedUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 12px" }}><polyline points="20 6 9 17 4 12"/></svg><p style={{ fontSize: "0.88rem" }}>Aucun utilisateur bloqué</p></div>
              ) : blockedUsers.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: G.gris, overflow: "hidden", flexShrink: 0 }}>
                    {b.profile?.photo_url ? <img src={b.profile.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{b.profile?.gender === "Femme" ? "👩🏿" : "👨🏿"}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{b.profile?.name || "Utilisateur"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>{b.profile?.city || "-"}</div>
                  </div>
                  <div onClick={() => handleUnblock(b.id)} style={{ background: "rgba(192,57,43,0.08)", border: `1px solid rgba(192,57,43,0.2)`, borderRadius: 50, padding: "6px 14px", fontSize: "0.75rem", fontWeight: 700, color: G.rouge, cursor: "pointer", flexShrink: 0 }}>Débloquer</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {showDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.blanc, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Supprimer mon compte ?</h3>
            <p style={{ fontSize: "0.88rem", fontWeight: 400, color: "#666", marginBottom: 6, lineHeight: 1.6 }}>Ton profil, tes likes, tes matchs et tes messages seront <strong style={{ color: "#1a1a1a" }}>définitivement supprimés</strong>.</p>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e74c3c", marginBottom: deleteError ? 10 : 24 }}>Cette action est irréversible.</p>
            {deleteError && (
              <div style={{ background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: "0.78rem", color: "#e74c3c", lineHeight: 1.5, textAlign: "left" }}>
                {deleteError}
              </div>
            )}
            {deleteLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 0", color: "#888", fontSize: "0.88rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G.rouge} strokeWidth="2.5" strokeLinecap="round" style={{ animation: "pulse 0.8s ease-in-out infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                Suppression en cours…
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="ghost" onClick={() => { setShowDelete(false); setDeleteError(""); }} style={{ flex: 1 }}>Non, garder</Btn>
                <Btn variant="danger" onClick={handleDelete} style={{ flex: 1 }}>Oui, supprimer</Btn>
              </div>
            )}
          </div>
        </div>
      )}
      </div>{/* fin colonne droite */}
    </div>
  );
}

// ── MODAL AVERTISSEMENT UTILISATEUR (s'affiche à la connexion si avertissement non lu) ──
