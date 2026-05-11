import { useState } from "react";

const G = {
  rouge: "#C0392B", rougeDark: "#96281B", or: "#D4A843", vert: "#1A5C3A",
  brun: "#2C1A0E", brunLight: "#7A5C44", blanc: "#FFFFFF", creme: "#FAF3E8",
  cremeDark: "#E8C5A0", gris: "#EEEEEE",
};

const PHOTOS = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=400&fit=crop&auto=format",
];

function PhoneMobile({ style, children }) {
  return (
    <div style={{ borderRadius: 16, border: "3px solid rgba(255,255,255,0.2)", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.25)", flexShrink: 0, ...style }}>
      {children}
    </div>
  );
}

export default function LandingPreview() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: G.creme, minHeight: "100vh" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .float { animation: float 3s ease-in-out infinite; }
        .fadeUp { animation: fadeUp 0.8s ease both; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: G.blanc, boxShadow: "0 2px 16px rgba(44,26,14,0.07)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontSize: "1.8rem", fontWeight: 700, color: G.rouge }}>Mo<span style={{ color: G.or }}>yo</span></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ fontSize: "0.72rem", fontWeight: 700, color: G.brun, padding: "8px 16px", borderRadius: 10, border: `2px solid ${G.brun}`, background: "transparent", cursor: "pointer", height: 46, width: 80 }}>
            À PROPOS
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", background: "transparent", border: `2px solid ${G.brun}`, borderRadius: 10, padding: "8px 14px", height: 46, width: 80 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 2, background: G.brun }} />)}
            <span style={{ color: G.brun, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em" }}>MENU</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: `linear-gradient(150deg,${G.creme} 0%,#F0E8D8 60%,rgba(26,92,58,0.12) 100%)`, overflow: "hidden", position: "relative", minHeight: "90vh" }}>
        
        {/* Photos arrière-plan */}
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 4, opacity: 0.13, zIndex: 0, pointerEvents: "none" }}>
          {PHOTOS.map((url, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>

        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg,rgba(240,232,216,0.92) 0%,rgba(240,232,216,0.85) 50%,rgba(26,92,58,0.1) 100%)`, zIndex: 1, pointerEvents: "none" }} />

        {/* Cercles déco */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 420, height: 420, borderRadius: "50%", border: `2px solid rgba(212,168,67,0.25)`, zIndex: 1, pointerEvents: "none" }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px 40px", position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto" }}>
          
          {/* Texte */}
          <div className="fadeUp" style={{ textAlign: "center", maxWidth: 600, marginBottom: 40 }}>
            <div style={{ display: "inline-block", background: "rgba(212,168,67,0.15)", border: `1px solid ${G.or}`, padding: "6px 16px", borderRadius: 50, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20, color: G.brunLight }}>
              Site de rencontres Congolais
            </div>
            <h1 style={{ fontSize: "clamp(2.2rem,5vw,3.5rem)", lineHeight: 1.1, fontWeight: 700, marginBottom: 18, color: G.brun }}>
              Trouve ton{" "}
              <span className="float" style={{ color: G.rouge, fontStyle: "italic", display: "inline-block" }}>âme sœur</span>
              <br />au Congo
            </h1>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: G.brunLight, marginBottom: 32 }}>
              Moyo connecte les Congolais à la recherche d'une relation sincère et durable.
              Brazzaville, Pointe-Noire, Dolisie et toute la diaspora.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{ border: "none", borderRadius: 50, padding: "15px 36px", fontWeight: 700, fontSize: "0.95rem", background: G.rouge, color: G.blanc, boxShadow: "0 4px 18px rgba(192,57,43,0.35)", cursor: "pointer" }}>
                Créer mon profil gratuit
              </button>
              <button style={{ border: "2px solid #1a1a1a", borderRadius: 50, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", background: G.blanc, color: "#1a1a1a", cursor: "pointer" }}>
                Me connecter
              </button>
            </div>
          </div>

          {/* 3 TÉLÉPHONES */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16, position: "relative" }}>
            
            {/* Téléphone gauche */}
            <PhoneMobile style={{ width: 140, height: 260, background: "linear-gradient(160deg,#2C1A0E,#5C3A1E)", transform: "rotate(-7deg) translateY(30px)" }}>
              <div style={{ background: G.rouge, padding: "6px 10px", display: "flex", alignItems: "center" }}>
                <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.65rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
              </div>
              <div style={{ background: "linear-gradient(160deg,#C47A4A,#8B4513)", height: 140, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div style={{ position: "absolute", top: 8, right: 8, background: G.or, borderRadius: 6, padding: "2px 6px", fontSize: "0.45rem", fontWeight: 700, color: G.brun }}>⭐ Premium</div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontWeight: 700, fontSize: "0.65rem", color: G.brun }}>Sandrine, 27</div>
                <div style={{ fontSize: "0.55rem", color: G.brunLight, marginBottom: 8 }}>📍 Brazzaville</div>
                <div style={{ background: G.rouge, borderRadius: 50, padding: "4px 8px", textAlign: "center", fontSize: "0.55rem", color: G.blanc, fontWeight: 700 }}>❤️ Liker</div>
              </div>
            </PhoneMobile>

            {/* Téléphone central */}
            <PhoneMobile style={{ width: 175, height: 340, background: "#0D0B1A", transform: "translateY(-10px)", zIndex: 2 }}>
              <div style={{ background: `linear-gradient(135deg,${G.vert},#0D4020)`, padding: "8px 12px", display: "flex", alignItems: "center" }}>
                <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.8rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
                <span style={{ marginLeft: "auto", fontSize: "0.7rem" }}>🇨🇬</span>
              </div>
              <div style={{ background: G.blanc, height: "calc(100% - 34px)" }}>
                <div style={{ background: "rgba(192,57,43,0.08)", margin: "10px 8px", borderRadius: 10, padding: "8px", border: `1px solid rgba(192,57,43,0.15)` }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: G.rouge, marginBottom: 4 }}>💞 Nouveau match !</div>
                  <div style={{ fontSize: "0.56rem", color: G.brunLight }}>Junior t'a liké aussi</div>
                </div>
                <div style={{ padding: "0 8px" }}>
                  <div style={{ height: 140, borderRadius: 12, background: "linear-gradient(160deg,#7A4A20,#3D1A05)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.2)", position: "absolute", top: 20 }} />
                    <div style={{ width: 70, height: 40, borderRadius: "50% 50% 0 0", background: "rgba(255,255,255,0.15)", position: "absolute", bottom: 0 }} />
                    <div style={{ position: "absolute", bottom: 8, left: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.68rem", color: G.blanc }}>Faïda, 25</div>
                      <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.7)" }}>📍 Pointe-Noire</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1, background: G.gris, borderRadius: 50, padding: "6px", textAlign: "center", fontSize: "0.7rem" }}>✕</div>
                    <div style={{ flex: 2, background: G.rouge, borderRadius: 50, padding: "6px", textAlign: "center", fontSize: "0.65rem", color: G.blanc, fontWeight: 700 }}>❤️ Liker</div>
                    <div style={{ flex: 1, background: "rgba(212,168,67,0.2)", border: `1px solid ${G.or}`, borderRadius: 50, padding: "6px", textAlign: "center", fontSize: "0.7rem" }}>⭐</div>
                  </div>
                </div>
              </div>
            </PhoneMobile>

            {/* Téléphone droit */}
            <PhoneMobile style={{ width: 140, height: 260, background: "#1C1A2E", transform: "rotate(7deg) translateY(30px)" }}>
              <div style={{ background: G.brun, padding: "6px 10px" }}>
                <span style={{ color: G.blanc, fontWeight: 700, fontSize: "0.65rem" }}>Mo<span style={{ color: G.or }}>yo</span></span>
              </div>
              <div style={{ padding: "8px", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 7px", fontSize: "0.55rem", color: "rgba(255,255,255,0.7)" }}>Bonsoir Lionel...</div>
                <div style={{ background: G.rouge, borderRadius: 8, padding: "5px 7px", fontSize: "0.55rem", color: G.blanc, textAlign: "right" }}>Bonsoir ! Ça va ?</div>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 7px", fontSize: "0.55rem", color: "rgba(255,255,255,0.7)" }}>Très bien merci ❤️</div>
                <div style={{ background: "rgba(212,168,67,0.2)", border: `1px solid ${G.or}`, borderRadius: 8, padding: "4px 7px", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill={G.or} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span style={{ fontSize: "0.45rem", color: G.or, fontWeight: 600 }}>Profils vérifiés</span>
                </div>
              </div>
            </PhoneMobile>

            {/* Bulle flottante */}
            <div style={{ position: "absolute", bottom: -10, right: -10, background: G.blanc, borderRadius: 14, padding: "8px 14px", boxShadow: "0 8px 24px rgba(44,26,14,0.15)", display: "flex", alignItems: "center", gap: 8, zIndex: 5 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${G.rouge},${G.rougeDark})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.8rem", color: G.brun }}>850+ couples</div>
                <div style={{ fontSize: "0.6rem", color: G.brunLight }}>formés sur Moyo</div>
              </div>
            </div>
            <div style={{ position: "absolute", top: -10, left: -10, background: G.blanc, borderRadius: 14, padding: "7px 12px", boxShadow: "0 6px 18px rgba(44,26,14,0.12)", display: "flex", alignItems: "center", gap: 7, zIndex: 5 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${G.vert},#0D4020)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>🇨🇬</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.72rem", color: G.brun }}>12 000+ membres</div>
                <div style={{ fontSize: "0.56rem", color: G.brunLight }}>Congo & diaspora</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: G.blanc, padding: "28px 24px", borderBottom: `1px solid ${G.gris}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          {[
            { n: "12 000+", l: "Membres inscrits", color: G.rouge },
            { n: "850+", l: "Couples formés", color: G.rouge },
            { n: "19", l: "Villes & diasporas", color: G.rouge },
          ].map(({ n, l, color }) => (
            <div key={l} style={{ background: G.creme, borderRadius: 16, padding: "18px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color, marginBottom: 2 }}>{n}</div>
              <div style={{ fontSize: "0.7rem", color: G.brunLight, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIANCE */}
      <div style={{ padding: "48px 24px" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, textAlign: "center", marginBottom: 8, color: G.brun }}>
          Pourquoi faire confiance à <span style={{ color: G.rouge }}>Moyo</span> ?
        </h2>
        <p style={{ textAlign: "center", color: G.brunLight, fontSize: "0.88rem", marginBottom: 32 }}>
          Une plateforme pensée pour des rencontres sincères et sécurisées
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, maxWidth: 700, margin: "0 auto" }}>
          {[
            { bg: G.rouge, titre: "Profils modérés", desc: "Les profils sont surveillés afin de limiter les faux comptes.", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
            { bg: G.or, titre: "Signalement rapide", desc: "Signale rapidement un comportement inapproprié.", path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" },
            { bg: G.vert, titre: "Communauté congolaise", desc: "Des membres du Congo et de la diaspora.", path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0" },
            { bg: G.rouge, titre: "Respect & sécurité", desc: "Des échanges sérieux et respectueux.", path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
          ].map(c => (
            <div key={c.titre} style={{ background: G.blanc, borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: "0 4px 20px rgba(44,26,14,0.07)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={c.path}/>
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: 8, color: G.brun }}>{c.titre}</div>
              <div style={{ fontSize: "0.8rem", color: G.brunLight, lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER simple */}
      <div style={{ background: G.vert, padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 700, color: G.blanc, marginBottom: 8 }}>Mo<span style={{ color: G.or }}>yo</span></div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>© 2026 Moyo Congo · Tous droits réservés</p>
      </div>
    </div>
  );
}
