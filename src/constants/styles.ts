import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — Palette de couleurs Moyo
// ─────────────────────────────────────────────────────────────────────────────

export const G = {
  rouge: "#C0392B",
  rougeDark: "#922B21",
  or: "#D4A843",
  vert: "#1A5C3A",
  creme: "#F0F1F5",
  cremeDark: "#E4E6ED",
  brun: "#2C1A0E",
  brunLight: "#5C3D2A",
  blanc: "#FFFFFF",
  gris: "#E8DDD0",
};

// ─────────────────────────────────────────────────────────────────────────────
// MSG_BG_STYLE — Fond messages style Moyo (compatible tous navigateurs mobiles)
// ─────────────────────────────────────────────────────────────────────────────

export const MSG_BG_STYLE: React.CSSProperties = {
  position: "relative",
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL_CSS — Styles globaux injectés dans <style> au montage de App
// ─────────────────────────────────────────────────────────────────────────────

export const GLOBAL_CSS = `
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
  .chat-textarea {
    -webkit-appearance: none;
    appearance: none;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    word-break: break-word;
    white-space: pre-wrap;
  }
  .chat-textarea:focus { outline: none; }
  @supports (-webkit-touch-callout: none) {
    .chat-textarea { font-size: 16px !important; }
  }
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
