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
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  .msg-bg{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' opacity='0.055'%3E%3Ctext x='10' y='20' font-family='Georgia,serif' font-size='11' font-weight='700' fill='%23C0392B'%3EMo%3C/text%3E%3Ctext x='31' y='20' font-family='Georgia,serif' font-size='11' font-weight='700' fill='%23D4A843'%3Eyo%3C/text%3E%3C/svg%3E");background-repeat:repeat;background-size:200px 200px}
  .chat-textarea{-webkit-appearance:none;appearance:none;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;word-break:break-word;white-space:pre-wrap}
  .chat-textarea:focus{outline:none}
  @supports(-webkit-touch-callout:none){.chat-textarea{font-size:16px!important}}
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
  .card-hover{transition:transform 0.18s ease,box-shadow 0.18s ease!important}
  .card-hover:hover{transform:translateY(-2px)!important;box-shadow:0 8px 24px rgba(44,26,14,0.12)!important}
  .card-hover:active{transform:scale(0.98)!important}
  .action-card{transition:transform 0.15s ease,box-shadow 0.15s ease,background 0.15s ease!important}
  .action-card:hover{transform:translateX(3px)!important}
  .action-card:active{transform:scale(0.98)!important}
  .moyo-footer-hidden{transform:translateX(-50%) translateY(100%)!important;transition:transform 0.35s cubic-bezier(0.4,0,0.2,1)!important}
  .moyo-footer-visible{transform:translateX(-50%) translateY(0)!important;transition:transform 0.35s cubic-bezier(0.4,0,0.2,1)!important}
  @media(max-width:767px){.landing-hero-text{text-align:center!important}.landing-hero-btns{justify-content:center!important}}
  @media(min-width:768px){
    .landing-hero{display:grid!important;grid-template-columns:1fr 1fr!important;gap:48px!important;align-items:center!important;text-align:left!important;max-width:1100px!important;margin:0 auto!important;padding:60px 40px 40px!important}
    .landing-stats{max-width:900px!important;margin:0 auto!important;padding:0 40px 0!important;grid-template-columns:repeat(3,1fr)!important}
    .trust-grid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:20px!important}
    .testi-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:20px!important}
    .steps-layout{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:32px!important}
  }
`;
