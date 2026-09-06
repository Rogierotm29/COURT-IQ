import { useEffect } from "react";
import { T } from "../theme";

/* ═══ CONFETTI ═══ */
// Paleta reducida: sólo acento, éxito y blanco. Menos ruido, más intención.
export const CONF_COLORS=[T.accent.base, T.accent.hover, T.success.base, "#FFFFFF"];

export const Confetti=({active})=>{
  if(!active) return null;
  const particles=Array.from({length:50},(_,i)=>({
    id:i,
    x:Math.random()*100,
    delay:Math.random()*.8,
    dur:1.6+Math.random()*1.0,
    color:CONF_COLORS[i%CONF_COLORS.length],
    w:4+Math.random()*6,
    h:3+Math.random()*4,
    rot:Math.random()*360,
  }));
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden"}}>
    {particles.map(p=><div key={p.id} style={{
      position:"absolute", left:`${p.x}%`, top:-12,
      width:p.w, height:p.h, background:p.color, borderRadius:1,
      opacity:0, animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
      transform:`rotate(${p.rot}deg)`,
    }}/>)}
  </div>;
};

/* ═══ RESULT BANNER ═══ */
export const ResultBanner=({show,correct,pts,streak,streakOnly,onClose})=>{
  useEffect(()=>{if(show){const t=setTimeout(onClose,3400);return()=>clearTimeout(t);}},[show]);
  if(!show) return null;

  const accent = streakOnly ? T.warning : correct ? T.success : T.danger;
  const label  = streakOnly ? `Racha de ${streak}` : correct ? `+${pts} pts` : "Mala suerte";

  return <div style={{
    position:"fixed", bottom:96, left:"50%", transform:"translateX(-50%)",
    background:T.surface[2], border:`1px solid ${accent.border}`,
    borderLeft:`3px solid ${accent.base}`,
    color:T.text.primary, borderRadius:T.radius.base,
    padding:`${T.space[3]}px ${T.space[5]}px`,
    fontSize:T.font.base, fontWeight:600, zIndex:9998,
    animation:"resultPop .32s cubic-bezier(.2,.8,.3,1) both",
    boxShadow:T.shadow.lg,
    display:"flex", alignItems:"center", gap:T.space[3], whiteSpace:"nowrap",
  }}>
    <span style={{color:accent.base,fontWeight:700}}>{label}</span>
    {!streakOnly&&correct&&streak>=3&&(
      <span style={{
        background:T.surface[3], borderRadius:T.radius.sm,
        padding:`2px ${T.space[2]}px`, fontSize:T.font.xs,
        color:T.warning.base, fontWeight:600,
      }}>{streak} en racha</span>
    )}
  </div>;
};

/* ═══ FLOATING POINTS ═══ */
export const FloatPts=({pts,correct})=>(
  <div style={{
    position:"absolute", top:-6, right:T.space[3],
    fontSize:T.font.lg, fontWeight:700,
    color:correct?T.success.base:T.danger.base,
    pointerEvents:"none", animation:"floatUp 1.1s ease forwards", zIndex:100,
  }}>{correct?`+${pts}`:`-${pts}`}</div>
);

/* ═══ LIVE BADGE ═══ */
export const LiveBadge=({live})=>(
  <span style={{
    display:"inline-flex", alignItems:"center", gap:T.space[2],
    fontSize:T.font.xs, fontWeight:600, letterSpacing:.3,
    padding:`3px ${T.space[3]}px`, borderRadius:T.radius.full,
    background:T.surface[2], border:`1px solid ${T.border.subtle}`,
    color:live?T.text.secondary:T.text.tertiary,
  }}>
    <span style={{
      width:5, height:5, borderRadius:"50%",
      background:live?T.success.base:T.text.disabled,
      animation:live?"pulse 2s infinite":undefined,
    }}/>
    {live?"En vivo":"Caché"}
  </span>
);