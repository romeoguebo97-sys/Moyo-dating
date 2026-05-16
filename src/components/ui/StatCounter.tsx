import React, { useState, useEffect, useRef } from "react";
import { G } from "../../constants/styles";

// ─────────────────────────────────────────────────────────────────────────────
// STAT COUNTER — Compteur animé déclenché à l'entrée dans le viewport
// ─────────────────────────────────────────────────────────────────────────────

interface StatCounterProps {
  target: number;
  suffix: string;
  label: string;
  svg: React.ReactNode;
}

export function StatCounter({ target, suffix, label, svg }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  const display =
    target >= 1000
      ? `${Math.floor(count / 1000)} ${String(count % 1000).padStart(3, "0")}${suffix}`
      : `${count}${suffix}`;

  return (
    <div ref={ref} className="stat" style={{ background: G.creme, borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{svg}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: G.rouge, marginBottom: 2 }}>
        {display}
      </div>
      <div style={{ fontSize: "0.7rem", color: "#555", fontWeight: 500 }}>{label}</div>
    </div>
  );
}
