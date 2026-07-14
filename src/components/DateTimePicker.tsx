// ── Sélecteur date/heure des rendez-vous (calendrier Moyo), partagé entre App.tsx et Admin.tsx. ──
// Extrait d'App.tsx (refactoring pur : aucun changement de comportement, uniquement
// un déplacement du code pour faciliter la maintenance).
import React, { useState } from "react";
import { G } from "../theme";

// Bornes de l'agence : horaires 9h → 19h, fermée le dimanche.
export const APPT_HOUR_MIN = 9;
export const APPT_HOUR_MAX = 19;
const APPT_HOURS = Array.from({ length: APPT_HOUR_MAX - APPT_HOUR_MIN + 1 }, (_, i) => String(APPT_HOUR_MIN + i).padStart(2, "0"));
const APPT_MINUTES = ["00", "15", "30", "45"];
const apptTodayYMD = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export const APPT_INPUT: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${G.gris}`, borderRadius: 10, padding: "10px 12px", fontSize: "0.85rem", fontFamily: "inherit", background: G.blanc, color: G.brun };

// Mini calendrier Moyo : dates passées et dimanches désactivés (agence fermée le dimanche)
function ApptCalendar({ value, onPick, onClose }: { value: string; onPick: (d: string) => void; onClose: () => void }) {
  const base = value ? new Date(value + "T00:00:00") : new Date();
  const today = new Date(); const tY = today.getFullYear(); const tM = today.getMonth();
  const [vy, setVy] = useState(base.getFullYear());
  const [vm, setVm] = useState(base.getMonth());
  const firstDay = new Date(vy, vm, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const canPrev = vy > tY || (vy === tY && vm > tM);
  const monthLabel = firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const todayStr = apptTodayYMD();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const navBtn: React.CSSProperties = { background: G.creme, border: `1px solid ${G.gris}`, borderRadius: 8, width: 30, height: 30, fontWeight: 800, color: G.brun };
  return (
    <div style={{ background: G.blanc, border: `1.5px solid ${G.gris}`, borderRadius: 14, padding: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button type="button" onClick={() => { if (!canPrev) return; if (vm - 1 < 0) { setVm(11); setVy(vy - 1); } else setVm(vm - 1); }} disabled={!canPrev} style={{ ...navBtn, cursor: canPrev ? "pointer" : "not-allowed", opacity: canPrev ? 1 : 0.4 }}>‹</button>
        <div style={{ fontWeight: 800, fontSize: "0.85rem", color: G.brun, textTransform: "capitalize" }}>{monthLabel}</div>
        <button type="button" onClick={() => { if (vm + 1 > 11) { setVm(0); setVy(vy + 1); } else setVm(vm + 1); }} style={{ ...navBtn, cursor: "pointer" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: "0.62rem", fontWeight: 800, color: i === 6 ? "#c0392b" : "#aaa", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = `${vy}-${String(vm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const sunday = new Date(vy, vm, d).getDay() === 0;
          const past = ds < todayStr;
          const disabled = sunday || past;
          const selected = ds === value;
          return (
            <div key={i} onClick={() => { if (disabled) return; onPick(ds); onClose(); }}
              title={sunday ? "Agence fermée le dimanche" : past ? "Date passée" : ""}
              style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, fontSize: "0.8rem", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", background: selected ? G.vert : disabled ? "transparent" : G.creme, color: selected ? "#fff" : disabled ? "#ccc" : G.brun, textDecoration: disabled ? "line-through" : "none", opacity: disabled ? 0.55 : 1 }}>{d}</div>
          );
        })}
      </div>
      <div style={{ fontSize: "0.64rem", color: "#999", marginTop: 8, textAlign: "center" }}>Agence fermée le dimanche · horaires 9h–19h</div>
    </div>
  );
}

// Sélecteur date (calendrier Moyo) + heure (9h–19h) + minute
export function DateTimePicker({ date, hour, minute, onChange }: { date: string; hour: string; minute: string; onChange: (d: string, h: string, m: string) => void }) {
  const [openCal, setOpenCal] = useState(false);
  const sel: React.CSSProperties = { ...APPT_INPUT, width: "auto", padding: "10px 8px", cursor: "pointer" };
  const fmt = date ? new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "Choisir une date";
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" onClick={() => setOpenCal(o => !o)} style={{ ...APPT_INPUT, flex: "1 1 150px", padding: "9px 10px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, color: date ? G.brun : "#999" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.vert} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        <span style={{ textTransform: "capitalize" }}>{fmt}</span>
      </button>
      <select value={hour} onChange={e => onChange(date, e.target.value, minute)} style={sel}>
        <option value="">-- h</option>
        {APPT_HOURS.map(h => <option key={h} value={h}>{h} h</option>)}
      </select>
      <select value={minute} onChange={e => onChange(date, hour, e.target.value)} style={sel}>
        <option value="">-- min</option>
        {APPT_MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      {openCal && <div style={{ flexBasis: "100%", marginTop: 4 }}><ApptCalendar value={date} onPick={(d) => onChange(d, hour, minute)} onClose={() => setOpenCal(false)} /></div>}
    </div>
  );
}
