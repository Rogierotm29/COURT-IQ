import { useState } from "react";
import { C } from "../theme";

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
export const ONBOARD_STEPS=[
  {icon:"🎯",title:"Haz tus picks",desc:"Antes de que empiece cada partido, elige qué equipo va a ganar. Los favoritos dan menos puntos, los underdogs dan más."},
  {icon:"🏆",title:"Compite con amigos",desc:"Crea un grupo privado o únete con un código. Todos hacen sus picks y compiten en la misma tabla de posiciones."},
  {icon:"⭐",title:"Gana puntos y sube",desc:"Cada acierto suma puntos según la dificultad del pick. Mantén tu racha, apuesta monedas y llega al #1 del grupo."},
];
export const Onboarding=({onDone})=>{
  const [step,setStep]=useState(0);
  const s=ONBOARD_STEPS[step];
  const last=step===ONBOARD_STEPS.length-1;
  return <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:5000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>{s.icon}</div>
      <div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:10,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{s.title}</div>
      <div style={{fontSize:14,color:C.dim,lineHeight:1.6,marginBottom:28}}>{s.desc}</div>
      {/* dots */}
      <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:24}}>
        {ONBOARD_STEPS.map((_,i)=><div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,background:i===step?C.accent:C.border,transition:"all .3s"}}/>)}
      </div>
      <button className="btn" onClick={()=>last?onDone():setStep(s=>s+1)} style={{width:"100%",padding:"14px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:15,fontWeight:900}}>
        {last?"¡Empezar! 🚀":"Siguiente →"}
      </button>
      {!last&&<button className="btn" onClick={onDone} style={{marginTop:10,background:"none",color:C.muted,fontSize:12,padding:"6px"}}>Saltar</button>}
    </div>
  </div>;
};