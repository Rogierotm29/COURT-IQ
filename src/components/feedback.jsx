import { C } from "../theme";
import { useEffect, useState } from "react";

// ─── CONFETTI ──────────────────────────────────────────────────────────────
export const CONF_COLORS=['#00C2FF','#00FF9D','#FFB800','#FF6B35','#a855f7','#ffffff','#ff6b9d'];
export const Confetti=({active})=>{
  if(!active) return null;
  const particles=Array.from({length:70},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*.9,dur:1.4+Math.random()*1.2,color:CONF_COLORS[i%CONF_COLORS.length],w:5+Math.random()*9,h:3+Math.random()*6,rot:Math.random()*360}));
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999,overflow:'hidden'}}>
    {particles.map(p=><div key={p.id} style={{position:'absolute',left:`${p.x}%`,top:-12,width:p.w,height:p.h,background:p.color,borderRadius:2,opacity:0,animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,transform:`rotate(${p.rot}deg)`}}/>)}
  </div>;
};

// ─── RESULT BANNER ─────────────────────────────────────────────────────────
export const ResultBanner=({show,correct,pts,streak,streakOnly,onClose})=>{
  useEffect(()=>{if(show){const t=setTimeout(onClose,3800);return()=>clearTimeout(t);}},[show]);
  if(!show) return null;
  const bg=streakOnly?'linear-gradient(135deg,#FFB800,#ff9500)':correct?'linear-gradient(135deg,#00FF9D,#00c97a)':'linear-gradient(135deg,#ff4444,#cc2222)';
  return <div style={{position:'fixed',bottom:90,left:'50%',transform:'translateX(-50%)',background:bg,color:'#07090f',borderRadius:20,padding:'16px 28px',fontSize:20,fontWeight:900,zIndex:9998,animation:'resultPop .5s ease both',boxShadow:'0 12px 40px #00000088',display:'flex',alignItems:'center',gap:12,whiteSpace:'nowrap'}}>
    {streakOnly?<>🔥 <span>¡Racha de {streak}!</span></>:correct?<>✅ <span>+{pts} pts</span>{streak>=3&&<span style={{background:'#07090f22',borderRadius:10,padding:'2px 10px',fontSize:15}}>🔥 {streak}</span>}</>:<>❌ <span>Mala suerte</span></>}
  </div>;
};


// ─── FLOATING POINTS ───────────────────────────────────────────────────────
export const FloatPts=({pts,correct})=><div style={{position:'absolute',top:'-8px',right:10,fontSize:18,fontWeight:900,color:correct?'#00FF9D':'#ff6666',pointerEvents:'none',animation:'floatUp 1.2s ease forwards',zIndex:100,textShadow:'0 2px 8px #00000088'}}>{correct?`+${pts}`:`-${pts}`}</div>;
export const LiveBadge=({live})=><span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:.8,background:live?"#00FF9D18":"#1a2535",color:live?"#00FF9D":C.muted}}>{live?"🟢 LIVE":"📦 Cache"}</span>;


