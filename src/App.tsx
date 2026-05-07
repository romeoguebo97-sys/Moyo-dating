import { useState, useEffect, useEffect } from "react";

const G = {
  rouge:"#C0392B", rougeDark:"#922B21", or:"#D4A843",
  vert:"#1A5C3A", creme:"#FAF3E8", cremeDark:"#F0E6D3",
  brun:"#2C1A0E", brunLight:"#5C3D2A", blanc:"#FFFFFF", gris:"#E8DDD0",
};

const VILLES = [
  "Brazzaville","Pointe-Noire","Dolisie","Nkayi","Owando",
  "Ouesso","Impfondo","Sibiti","Djambala","Kinkala",
  "Ewo","Gamboma","Madingou","Mossaka","Odziba",
  "──────────────",
  "Diaspora Europe","Diaspora Amérique","Diaspora Asie / Océanie","Diaspora Afrique (autre pays)",
];

function Btn({children,variant="primary",onClick=()=>{},style={},disabled=false}) {
  const base={border:"none",borderRadius:50,padding:"12px 24px",fontWeight:600,fontSize:"0.9rem",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.65:1,fontFamily:"inherit",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",...style};
  const v={
    primary:{background:G.rouge,color:G.blanc,boxShadow:"0 4px 16px rgba(192,57,43,0.3)"},
    gold:{background:`linear-gradient(135deg,${G.or},#B8860B)`,color:G.brun},
    outline:{background:"transparent",color:G.brun,border:`2px solid ${G.brun}`},
    ghost:{background:"rgba(44,26,14,0.06)",color:G.brun},
    danger:{background:"#e74c3c",color:G.blanc},
    white:{background:G.blanc,color:G.rouge},
  };
  return <button style={{...base,...v[variant]}} onClick={onClick} disabled={disabled}>{children}</button>;
}

/* ─── LANDING ─── */
function Landing({onNav}) {
  const [visible,setVisible]=useState(false);
  useEffect(()=>{setTimeout(()=>setVisible(true),50);},[]);
  return <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${G.creme} 50%,${G.vert} 100%)`,overflow:"hidden"}}>
    <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      .fu1{animation:fadeUp 0.7s 0.1s both ease-out}
      .fu2{animation:fadeUp 0.7s 0.25s both ease-out}
      .fu3{animation:fadeUp 0.7s 0.4s both ease-out}
      .fu4{animation:fadeUp 0.7s 0.55s both ease-out}
      .fu5{animation:fadeUp 0.7s 0.7s both ease-out}
      .fu6{animation:fadeUp 0.7s 0.85s both ease-out}
      .heart{animation:float 3s ease-in-out infinite;display:inline-block}
      .btn-p:hover{transform:translateY(-3px)!important;box-shadow:0 14px 36px rgba(192,57,43,0.5)!important;transition:all 0.25s!important}
      .btn-o:hover{background:#2C1A0E!important;color:#FAF3E8!important;transform:translateY(-3px)!important;transition:all 0.25s!important}
      .stat:hover{transform:translateY(-5px) scale(1.04)!important;box-shadow:0 10px 28px rgba(44,26,14,0.14)!important}
      .stat{transition:all 0.25s ease!important}
      .store:hover{transform:translateY(-3px);opacity:0.92}
      .store{transition:all 0.22s ease!important}
      .fb:hover{opacity:0.88;transform:translateY(-2px)}
      .fb{transition:all 0.2s!important}
      .nav-link:hover{color:#C0392B!important}
      .nav-link{transition:color 0.2s!important}
    `}</style>
    <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",animation:"fadeIn 0.5s ease both"}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:"2rem",color:G.rouge,fontWeight:700}}>Mo<span style={{color:G.or}}>yo</span></div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <span className="nav-link" style={{fontSize:"0.88rem",fontWeight:500,color:G.brunLight,cursor:"pointer"}} onClick={()=>onNav("about")}>À propos</span>
        <a href="https://www.facebook.com/share/1CHQizobz9/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
          className="fb" style={{display:"flex",alignItems:"center",gap:6,background:"#1877F2",color:"#fff",borderRadius:50,padding:"8px 16px",textDecoration:"none",fontSize:"0.82rem",fontWeight:600}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </a>
      </div>
    </nav>
    <div style={{maxWidth:560,margin:"40px auto 0",padding:"0 24px",textAlign:"center"}}>
      <div className="fu1" style={{display:"inline-block",background:"rgba(212,168,67,0.15)",border:`1px solid ${G.or}`,padding:"6px 16px",borderRadius:50,fontSize:"0.75rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:24,color:G.brunLight}}>🇨🇬 Site de rencontres — Congo-Brazzaville</div>
      <h1 className="fu2" style={{fontFamily:"Georgia,serif",fontSize:"clamp(2.2rem,8vw,3.8rem)",lineHeight:1.1,fontWeight:700,marginBottom:20}}>
        Trouve ton <span className="heart" style={{color:G.rouge,fontStyle:"italic",fontFamily:"Georgia,serif"}}>âme sœur</span><br/>au Congo
      </h1>
      <p className="fu3" style={{fontSize:"1rem",lineHeight:1.75,color:G.brunLight,marginBottom:36}}>
        Moyo connecte les Congolais à la recherche d'une relation sincère et durable. Brazzaville, Pointe-Noire, Dolisie et toute la diaspora.
      </p>
      <div className="fu4" style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
        <button className="btn-p" onClick={()=>onNav("signup")} style={{border:"none",borderRadius:50,padding:"15px 36px",fontWeight:600,fontSize:"0.95rem",background:G.rouge,color:G.blanc,boxShadow:"0 4px 18px rgba(192,57,43,0.35)",cursor:"pointer",fontFamily:"inherit"}}>
          Créer mon profil gratuit
        </button>
        <button className="btn-o" onClick={()=>onNav("login")} style={{border:`2px solid ${G.brun}`,borderRadius:50,padding:"13px 28px",fontWeight:600,fontSize:"0.95rem",background:"transparent",color:G.brun,cursor:"pointer",fontFamily:"inherit"}}>
          J'ai déjà un compte
        </button>
      </div>
      <div className="fu5" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:32}}>
        {[["12 000+","Membres inscrits"],["850+","Couples formés"],["19","Villes & diasporas"]].map(([n,l])=>(
          <div key={l} className="stat" style={{background:"rgba(255,255,255,0.75)",borderRadius:14,padding:"16px 8px",textAlign:"center",backdropFilter:"blur(8px)"}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"1.5rem",fontWeight:700,color:G.rouge,marginBottom:4}}>{n}</div>
            <div style={{fontSize:"0.72rem",color:G.brunLight,fontWeight:500}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="fu6" style={{marginBottom:40}}>
        <p style={{fontSize:"0.82rem",color:G.brunLight,marginBottom:14,fontWeight:500}}>📲 Bientôt disponible sur</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <div className="store" style={{display:"flex",alignItems:"center",gap:10,background:G.brun,color:G.blanc,borderRadius:12,padding:"10px 18px",minWidth:150,cursor:"pointer"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.76c.3.17.64.24.99.2l11.47-11.47L12.36 9.2 3.18 23.76zm16.3-12.04L16.6 9.97l-3.23 3.23 3.23 3.23 2.9-1.74c.82-.49.82-1.28-.02-1.97zM3.02.28C2.7.46 2.5.8 2.5 1.25v21.5c0 .44.2.79.52.96l.1.06 12.05-12.05v-.28L3.12.22l-.1.06zm9.34 9.34L3.18.24l-.1.06 9.28 9.32z"/></svg>
            <div><div style={{fontSize:"0.6rem",opacity:0.75,letterSpacing:"0.05em"}}>DISPONIBLE SUR</div><div style={{fontSize:"0.9rem",fontWeight:700}}>Google Play</div></div>
          </div>
          <div className="store" style={{display:"flex",alignItems:"center",gap:10,background:G.brun,color:G.blanc,borderRadius:12,padding:"10px 18px",minWidth:150,cursor:"pointer"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            <div><div style={{fontSize:"0.6rem",opacity:0.75,letterSpacing:"0.05em"}}>TÉLÉCHARGER SUR</div><div style={{fontSize:"0.9rem",fontWeight:700}}>App Store</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

/* ─── ABOUT ─── */
function About({onBack}) {
  return <div style={{minHeight:"100vh",background:G.creme}}>
    <div style={{background:`linear-gradient(160deg,${G.vert},#0D2E1C)`,padding:"24px 24px 40px"}}>
      <div onClick={onBack} style={{color:"rgba(255,255,255,0.7)",fontSize:"0.88rem",cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>← Retour</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:"2.5rem",color:G.blanc,fontWeight:700,marginBottom:4}}>Mo<span style={{color:G.or}}>yo</span></div>
        <p style={{color:"rgba(255,255,255,0.75)",fontSize:"0.9rem"}}>Le premier site de rencontres congolais</p>
      </div>
    </div>
    <div style={{padding:"0 20px 60px",maxWidth:600,margin:"0 auto"}}>
      {/* Mission */}
      <div style={{background:G.blanc,borderRadius:20,padding:"24px",marginTop:-20,boxShadow:"0 8px 32px rgba(44,26,14,0.1)",marginBottom:16}}>
        <div style={{fontSize:"2rem",marginBottom:10}}>❤️</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,marginBottom:10}}>Notre mission</h2>
        <p style={{fontSize:"0.88rem",lineHeight:1.8,color:G.brunLight}}>
          <strong>Moyo</strong> (qui signifie "cœur" en swahili) est le premier site de rencontres dédié aux Congolais. Notre mission est simple : créer des rencontres sincères et durables entre Congolais, qu'ils soient au pays ou dans la diaspora.
        </p>
        <p style={{fontSize:"0.88rem",lineHeight:1.8,color:G.brunLight,marginTop:10}}>
          Nous croyons que chaque Congolais mérite de trouver l'amour dans un espace sûr, respectueux et adapté à notre culture et nos valeurs.
        </p>
      </div>

      {/* Conseils */}
      <div style={{background:G.blanc,borderRadius:20,padding:"24px",marginBottom:16,boxShadow:"0 4px 16px rgba(44,26,14,0.07)"}}>
        <div style={{fontSize:"2rem",marginBottom:10}}>💡</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,marginBottom:16}}>Conseils pour bien rencontrer</h2>
        {[
          {icon:"📸",titre:"Mets une vraie photo",desc:"Les profils avec une photo reçoivent 5x plus de messages. Utilise une photo récente et souriante."},
          {icon:"✍️",titre:"Remplis bien ta bio",desc:"Parle de tes passions, tes valeurs, ce que tu recherches. Une bio sincère attire les bonnes personnes."},
          {icon:"💬",titre:"Prends le temps de discuter",desc:"Ne te précipite pas. Apprends à connaître la personne avant de proposer une rencontre."},
          {icon:"🔒",titre:"Protège tes informations",desc:"Ne partage pas ton numéro trop vite. Prends le temps de vérifier que la personne est sérieuse."},
          {icon:"🚨",titre:"Signale les faux profils",desc:"Si tu suspectes une arnaque, utilise le bouton Reporter. Tu protèges toute la communauté."},
          {icon:"🤝",titre:"Sois respectueux(se)",desc:"Traite les autres comme tu voudrais être traité(e). Un message sincère fait toujours bonne impression."},
        ].map(c=>(
          <div key={c.titre} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${G.gris}`}}>
            <div style={{fontSize:"1.4rem",flexShrink:0}}>{c.icon}</div>
            <div>
              <div style={{fontWeight:700,fontSize:"0.9rem",marginBottom:3}}>{c.titre}</div>
              <div style={{fontSize:"0.82rem",color:G.brunLight,lineHeight:1.6}}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Services */}
      <div style={{background:G.blanc,borderRadius:20,padding:"24px",marginBottom:16,boxShadow:"0 4px 16px rgba(44,26,14,0.07)"}}>
        <div style={{fontSize:"2rem",marginBottom:10}}>🌟</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,marginBottom:16}}>Nos services</h2>
        {[
          {icon:"💞",titre:"Rencontres en ligne",desc:"Trouve ton âme sœur parmi des milliers de profils vérifiés au Congo et dans la diaspora.",badge:"Gratuit"},
          {icon:"⭐",titre:"Abonnement Premium",desc:"Likes illimités, messages illimités, voir qui t'a liké, profil mis en avant et bien plus.",badge:"5 000 FCFA/mois"},
          {icon:"💍",titre:"Accompagnement mariage",desc:"Nous t'accompagnons dans l'organisation de ta cérémonie congolaise traditionnelle et moderne.",badge:"Sur demande"},
          {icon:"🤵",titre:"Mise en relation VIP",desc:"Service personnalisé pour une approche discrète et accompagnée dans ta recherche.",badge:"Premium"},
          {icon:"📋",titre:"Conseil relationnel",desc:"Nos conseillers t'aident à rédiger ton profil et te guident dans tes rencontres.",badge:"Bientôt"},
        ].map(s=>(
          <div key={s.titre} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 0",borderBottom:`1px solid ${G.gris}`}}>
            <div style={{fontSize:"1.5rem",flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                <div style={{fontWeight:700,fontSize:"0.9rem"}}>{s.titre}</div>
                <div style={{background:"rgba(212,168,67,0.15)",border:`1px solid ${G.or}`,borderRadius:50,padding:"2px 8px",fontSize:"0.68rem",fontWeight:600,color:G.brunLight,flexShrink:0,marginLeft:8}}>{s.badge}</div>
              </div>
              <div style={{fontSize:"0.82rem",color:G.brunLight,lineHeight:1.6}}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mariage */}
      <div style={{background:`linear-gradient(135deg,${G.rouge},${G.rougeDark})`,borderRadius:20,padding:"24px",marginBottom:16,color:G.blanc}}>
        <div style={{fontSize:"2rem",marginBottom:10}}>💍</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.3rem",fontWeight:700,marginBottom:10}}>Accompagnement mariage congolais</h2>
        {["Organisation du mariage traditionnel et civil (Possibilité de préfinancement)","Coordination de la cérémonie traditionnelle","Mise en relation avec des prestataires congolais","Accompagnement pour les couples diaspora/Congo","Accompagnement administratif (mariage civil)"].map(s=>(
          <div key={s} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"6px 0",fontSize:"0.82rem",opacity:0.9}}>
            <span style={{color:G.or,fontWeight:700,flexShrink:0}}>✓</span> {s}
          </div>
        ))}
        <div style={{marginTop:16,background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 16px",fontSize:"0.82rem",display:"flex",alignItems:"center",gap:8}}>
          <span>📱</span>
          <div>
            <div style={{fontWeight:700}}>SR Event — Agence événementielle</div>
            <div style={{opacity:0.85}}>Mariages · Dots · Conférences · Anniversaires · Brazzaville</div>
          </div>
        </div>
        <div style={{marginTop:10,background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"12px 16px",fontSize:"0.82rem"}}>
          📞 Devis : <strong>+33 07 53 35 64 71</strong>
        </div>
      </div>

      {/* Conseils relationnels */}
      <div style={{background:G.blanc,borderRadius:20,padding:"24px",marginBottom:16,boxShadow:"0 4px 16px rgba(44,26,14,0.07)"}}>
        <div style={{fontSize:"2rem",marginBottom:10}}>🧠</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,marginBottom:16}}>Conseils relationnels</h2>
        {[
          {icon:"💌",titre:"Réussir son premier message",desc:"Sois original, pose une question ouverte, montre que tu as lu son profil. Évite le simple 'Bonjour'."},
          {icon:"📱",titre:"Bien se lancer sur Moyo",desc:"Remplis ton profil à 100%, utilise des photos récentes. Sois patient — les belles rencontres prennent du temps."},
          {icon:"☕",titre:"Préparer son premier RDV",desc:"Choisis un lieu public. Sois à l'heure, sois toi-même. Pas de pression !"},
          {icon:"💑",titre:"Construire une relation durable",desc:"La confiance se construit progressivement. Communique honnêtement sur tes attentes dès le début."},
          {icon:"💔",titre:"Surmonter une rupture",desc:"Prends le temps de te reconstruire et reviens sur Moyo quand tu te sens prêt(e)."},
          {icon:"🔐",titre:"Sécurité sur les applis",desc:"Ne partage jamais d'argent, méfie-toi des profils trop parfaits. Rencontre dans un lieu public."},
        ].map(c=>(
          <div key={c.titre} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${G.gris}`}}>
            <div style={{fontSize:"1.4rem",flexShrink:0}}>{c.icon}</div>
            <div>
              <div style={{fontWeight:700,fontSize:"0.9rem",marginBottom:3}}>{c.titre}</div>
              <div style={{fontSize:"0.82rem",color:G.brunLight,lineHeight:1.6}}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div style={{background:G.blanc,borderRadius:20,padding:"24px",marginBottom:16,boxShadow:"0 4px 16px rgba(44,26,14,0.07)"}}>
        <div style={{fontSize:"2rem",marginBottom:10}}>📞</div>
        <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,marginBottom:16}}>Nous contacter</h2>
        {[
          {icon:"📘",label:"Facebook",value:"Page Moyo Congo",color:"#1877F2"},
          {icon:"📱",label:"Téléphone / WhatsApp",value:"+33 07 53 35 64 71",color:"#25D366"},
          {icon:"📧",label:"Email",value:"contact@moyo-congo.com",color:G.rouge},
        ].map(c=>(
          <div key={c.label} style={{display:"flex",gap:14,alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${G.gris}`}}>
            <div style={{fontSize:"1.5rem",flexShrink:0}}>{c.icon}</div>
            <div>
              <div style={{fontWeight:600,fontSize:"0.82rem",color:G.brunLight,marginBottom:2}}>{c.label}</div>
              <div style={{fontSize:"0.9rem",color:c.color,fontWeight:700}}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Facebook CTA */}
      <a href="https://www.facebook.com/share/1CHQizobz9/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#1877F2",color:"#fff",borderRadius:16,padding:"18px",marginBottom:16,cursor:"pointer",textDecoration:"none"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        <div>
          <div style={{fontWeight:700,fontSize:"0.95rem"}}>Rejoins notre communauté Facebook</div>
          <div style={{fontSize:"0.78rem",opacity:0.85}}>Actualités, conseils et témoignages</div>
        </div>
      </a>

      <div style={{textAlign:"center",color:G.brunLight}}>
        <p style={{fontSize:"0.75rem"}}>© 2026 Moyo Congo · Tous droits réservés</p>
      </div>
    </div>
  </div>;
}

/* ─── LOGIN ─── */
function Login({onNav}) {
  const [form,setForm]=useState({email:"",password:""});
  const [showPwd,setShowPwd]=useState(false);
  const [showForgot,setShowForgot]=useState(false);
  const [forgotEmail,setForgotEmail]=useState("");
  const [forgotSent,setForgotSent]=useState(false);

  if(showForgot) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,${G.creme},${G.cremeDark})`,padding:"0 16px"}}>
      <div onClick={()=>onNav("landing")} style={{padding:"20px 4px",cursor:"pointer",color:G.brunLight,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>← Accueil</div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",paddingBottom:40}}>
        <div style={{background:G.blanc,borderRadius:24,padding:"40px 28px",width:"100%",maxWidth:420,boxShadow:"0 20px 70px rgba(44,26,14,0.12)"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"2rem",color:G.rouge,fontWeight:700}}>Mo<span style={{color:G.or}}>yo</span></div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700,marginTop:8}}>Mot de passe oublié</h2>
          </div>
          {forgotSent ? (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"3rem",marginBottom:12}}>📧</div>
              <p style={{color:G.brunLight,fontSize:"0.88rem",marginBottom:20}}>Email envoyé ! Vérifie ta boîte mail.</p>
              <Btn variant="ghost" onClick={()=>{setShowForgot(false);setForgotSent(false);}}>← Retour</Btn>
            </div>
          ) : <>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Ton email</label>
              <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="ton@email.com"
                style={{width:"100%",padding:"13px 14px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <Btn variant="primary" onClick={()=>setForgotSent(true)} style={{width:"100%",marginBottom:12}}>Envoyer le lien 📧</Btn>
            <div style={{textAlign:"center"}}><span onClick={()=>setShowForgot(false)} style={{fontSize:"0.85rem",color:G.brunLight,cursor:"pointer"}}>← Retour</span></div>
          </>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,${G.creme},${G.cremeDark})`,padding:"0 16px"}}>
      <div onClick={()=>onNav("landing")} style={{padding:"20px 4px",cursor:"pointer",color:G.brunLight,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>← Accueil</div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",paddingBottom:40}}>
        <div style={{background:G.blanc,borderRadius:24,padding:"40px 28px",width:"100%",maxWidth:420,boxShadow:"0 20px 70px rgba(44,26,14,0.12)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"2rem",color:G.rouge,fontWeight:700}}>Mo<span style={{color:G.or}}>yo</span></div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.6rem",fontWeight:700,marginTop:6}}>Bon retour !</h2>
            <p style={{color:G.brunLight,fontSize:"0.85rem",marginTop:4}}>Retrouve tes matchs</p>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Email</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",opacity:0.5}}>✉️</span>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ton@email.com"
                style={{width:"100%",padding:"13px 14px 13px 42px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",opacity:0.5}}>🔒</span>
              <input type={showPwd?"text":"password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••"
                style={{width:"100%",padding:"13px 44px 13px 42px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
              <span onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer",opacity:0.6}}>{showPwd?"🙈":"👁️"}</span>
            </div>
          </div>
          <div style={{textAlign:"right",marginBottom:20}}>
            <span onClick={()=>setShowForgot(true)} style={{fontSize:"0.82rem",color:G.rouge,cursor:"pointer",fontWeight:500}}>Mot de passe oublié ?</span>
          </div>
          <Btn variant="primary" onClick={()=>onNav("app")} style={{width:"100%"}} disabled={!form.email||!form.password}>Se connecter →</Btn>
          <p style={{textAlign:"center",marginTop:20,fontSize:"0.85rem",color:G.brunLight}}>
            Pas encore de compte ? <span style={{color:G.rouge,cursor:"pointer",fontWeight:600}} onClick={()=>onNav("signup")}>S'inscrire</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SIGNUP ─── */
function SignUp({onNav}) {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({email:"",password:"",name:"",age:"",city:"",gender:"",bio:""});
  const [showPwd,setShowPwd]=useState(false);
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,${G.creme},${G.cremeDark})`,padding:"0 16px"}}>
      <div onClick={()=>onNav("landing")} style={{padding:"20px 4px",cursor:"pointer",color:G.brunLight,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>← Accueil</div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",paddingBottom:40}}>
        <div style={{background:G.blanc,borderRadius:24,padding:"40px 28px",width:"100%",maxWidth:440,boxShadow:"0 20px 70px rgba(44,26,14,0.12)"}}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:"2rem",color:G.rouge,fontWeight:700}}>Mo<span style={{color:G.or}}>yo</span></div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.5rem",fontWeight:700,marginTop:6}}>Crée ton compte</h2>
            <p style={{color:G.brunLight,fontSize:"0.85rem",marginTop:4}}>Étape {step}/2</p>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:2,background:s<=step?G.rouge:G.gris}}/>)}
          </div>

          {step===1&&<>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Email</label>
              <input type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="ton@email.com"
                style={{width:"100%",padding:"13px 14px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Mot de passe</label>
              <div style={{position:"relative"}}>
                <input type={showPwd?"text":"password"} value={form.password} onChange={e=>upd("password",e.target.value)} placeholder="Minimum 6 caractères"
                  style={{width:"100%",padding:"13px 44px 13px 14px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                <span onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer",opacity:0.6}}>{showPwd?"🙈":"👁️"}</span>
              </div>
            </div>
            <Btn variant="primary" onClick={()=>setStep(2)} style={{width:"100%"}} disabled={!form.email||form.password.length<6}>Continuer →</Btn>
          </>}

          {step===2&&<>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Prénom</label>
              <input value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Ex: Faïda"
                style={{width:"100%",padding:"13px 14px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Je suis</label>
              <div style={{display:"flex",gap:10}}>
                {["Homme","Femme"].map(g=>(
                  <div key={g} onClick={()=>upd("gender",g)} style={{flex:1,padding:"12px",borderRadius:12,textAlign:"center",cursor:"pointer",border:`2px solid ${form.gender===g?G.rouge:G.gris}`,background:form.gender===g?"rgba(192,57,43,0.06)":G.blanc,fontWeight:600,fontSize:"0.88rem"}}>
                    {g==="Homme"?"👨🏿 Homme":"👩🏿 Femme"}
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Âge</label>
              <input type="number" value={form.age} onChange={e=>upd("age",e.target.value)} placeholder="Ex: 25"
                style={{width:"100%",padding:"13px 14px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontWeight:500,marginBottom:7,fontSize:"0.88rem",color:G.brunLight}}>Ville</label>
              <select value={form.city} onChange={e=>upd("city",e.target.value)} style={{width:"100%",padding:"13px 14px",border:`2px solid ${G.gris}`,borderRadius:12,fontSize:"0.93rem",background:G.blanc,color:G.brun,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
                <option value="">Sélectionne ta ville</option>
                {VILLES.map(c=>c.startsWith("──")?<option key={c} disabled>{c}</option>:<option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="ghost" onClick={()=>setStep(1)} style={{flex:1}}>← Retour</Btn>
              <Btn variant="primary" onClick={()=>onNav("app")} style={{flex:2}} disabled={!form.name||!form.gender||!form.age||!form.city}>Créer mon compte 🎉</Btn>
            </div>
          </>}

          <p style={{textAlign:"center",marginTop:20,fontSize:"0.85rem",color:G.brunLight}}>
            Déjà un compte ? <span style={{color:G.rouge,cursor:"pointer",fontWeight:600}} onClick={()=>onNav("login")}>Se connecter</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── APP (demo) ─── */
function AppDemo({onLogout}) {
  const [tab,setTab]=useState("discover");
  const tabs=[{id:"discover",icon:"🔥",label:"Découvrir"},{id:"matches",icon:"💞",label:"Matchs"},{id:"messages",icon:"💬",label:"Messages"},{id:"profile",icon:"👤",label:"Profil"}];
  return (
    <div style={{maxWidth:500,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column",background:G.creme}}>
      <div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",background:G.blanc,borderBottom:`1px solid ${G.gris}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:"1.6rem",color:G.rouge,fontWeight:700}}>Mo<span style={{color:G.or}}>yo</span></div>
        <div style={{fontSize:"0.78rem",color:G.brunLight}}>🇨🇬 Congo-Brazzaville</div>
      </div>
      <div style={{flex:1,padding:"20px",paddingBottom:80}}>
        {tab==="discover"&&<div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{background:G.blanc,borderRadius:22,boxShadow:"0 8px 36px rgba(44,26,14,0.12)",overflow:"hidden",marginBottom:20}}>
            <div style={{height:260,background:`linear-gradient(160deg,#E8C5A0,#C47A4A)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7rem"}}>👩🏿</div>
            <div style={{padding:"16px 20px",textAlign:"left"}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700}}>Faïda, 24</div>
              <div style={{color:G.brunLight,fontSize:"0.82rem"}}>📍 Brazzaville</div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:16}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:G.blanc,border:`2px solid ${G.gris}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>←</div>
            <div style={{width:68,height:68,borderRadius:"50%",background:`linear-gradient(135deg,${G.rouge},${G.rougeDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.7rem",cursor:"pointer",boxShadow:`0 6px 20px rgba(192,57,43,0.35)`}}>❤️</div>
            <div style={{width:48,height:48,borderRadius:"50%",background:G.blanc,border:`2px solid ${G.gris}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>→</div>
          </div>
        </div>}
        {tab==="matches"&&<div style={{padding:"4px 0"}}>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.3rem",fontWeight:700,marginBottom:16}}>Mes Matchs 💞</h2>
          <div style={{background:`linear-gradient(135deg,${G.rouge},${G.rougeDark})`,borderRadius:16,padding:"14px 18px",marginBottom:16,color:G.blanc,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:"1.8rem"}}>🔒</div>
            <div><div style={{fontWeight:700}}>Des personnes ont liké ton profil</div><div style={{fontSize:"0.78rem",opacity:0.85}}>Passe Premium pour les découvrir 👀</div></div>
          </div>
        </div>}
        {tab==="messages"&&<div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.3rem",fontWeight:700,marginBottom:16}}>Messages 💬</h2>
          <div style={{textAlign:"center",padding:"40px 20px",color:G.brunLight}}>
            <div style={{fontSize:"3rem",marginBottom:12}}>💬</div>
            <p style={{fontSize:"0.88rem"}}>Fais des matchs pour commencer à discuter !</p>
          </div>
        </div>}
        {tab==="profile"&&<div>
          <div style={{height:110,background:`linear-gradient(160deg,${G.vert},#0D2E1C)`,borderRadius:"0 0 0 0",position:"relative",marginTop:-20,marginLeft:-20,marginRight:-20,width:"calc(100% + 40px)"}}>
            <div style={{position:"absolute",bottom:-36,left:"50%",transform:"translateX(-50%)",width:72,height:72,borderRadius:"50%",background:`linear-gradient(160deg,#E8C5A0,#C47A4A)`,border:"4px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.2rem"}}>👨🏿</div>
          </div>
          <div style={{textAlign:"center",marginTop:48,marginBottom:20}}>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.4rem",fontWeight:700}}>Mon profil</h2>
            <p style={{color:G.brunLight,fontSize:"0.83rem"}}>📍 Brazzaville · 28 ans</p>
          </div>
          <div style={{background:`linear-gradient(135deg,${G.rouge},${G.rougeDark})`,borderRadius:16,padding:"18px",marginBottom:10,color:G.blanc,cursor:"pointer"}}>
            <div style={{fontWeight:700,marginBottom:4}}>✨ Passe à Premium</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:"1.6rem",fontWeight:700,color:G.or}}>5 000 FCFA/mois</div>
            <div style={{background:G.or,color:G.brun,borderRadius:50,padding:"10px",textAlign:"center",fontWeight:700,marginTop:12}}>Voir tous les avantages ⭐</div>
          </div>
          <Btn variant="danger" onClick={onLogout} style={{width:"100%"}}>🚪 Se déconnecter</Btn>
        </div>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:G.blanc,borderTop:`1px solid ${G.gris}`,display:"flex",justifyContent:"space-around",padding:"10px 0 14px",zIndex:50}}>
        {tabs.map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:tab===t.id?G.rouge:"#bbb"}}>
            <div style={{fontSize:"1.3rem",transform:tab===t.id?"scale(1.15)":"scale(1)"}}>{t.icon}</div>
            <div style={{fontSize:"0.6rem",fontWeight:tab===t.id?700:400}}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function App() {
  const [page,setPage]=useState("landing");
  if(page==="landing") return <Landing onNav={setPage}/>;
  if(page==="about") return <About onBack={()=>setPage("landing")}/>;
  if(page==="login") return <Login onNav={setPage}/>;
  if(page==="signup") return <SignUp onNav={setPage}/>;
  if(page==="app") return <AppDemo onLogout={()=>setPage("landing")}/>;
  return <Landing onNav={setPage}/>;
}