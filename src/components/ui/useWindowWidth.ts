import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useWindowWidth — Retourne la largeur de la fenêtre en temps réel
// ─────────────────────────────────────────────────────────────────────────────

export function useWindowWidth(): number {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 768
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return width;
}
