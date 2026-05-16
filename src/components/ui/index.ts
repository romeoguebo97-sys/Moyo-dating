// ─────────────────────────────────────────────────────────────────────────────
// UI — Re-exports de tous les composants UI atomiques
//
// Usage :
//   import { Btn, Input, Toast, Avatar, PremiumModal } from "@/components/ui"
// ─────────────────────────────────────────────────────────────────────────────

export { Btn }             from "./Btn";
export { Input }           from "./Input";
export { Toast, ErrorModal, ModerationModal } from "./Feedback";
export { Avatar, VerifiedBadge, PremiumBadge } from "./Avatar";
export { StatCounter }     from "./StatCounter";
export { PremiumModal }    from "./PremiumModal";
export { useWindowWidth }  from "./useWindowWidth";
