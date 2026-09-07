import { useState } from "react";
import { T } from "../theme";

/* ═══ ONBOARDING ═══ */
export const ONBOARD_STEPS=[
  {
    title:"Haz tus picks",
    desc:"Antes de cada partido, elige qué equipo va a ganar. Los favoritos dan menos puntos; los underdogs, más.",
  },
  {
    title:"Compite con amigos",
    desc:"Crea un grupo privado o únete con un código. Todos hacen sus picks y compiten en la misma tabla.",
  },
  {
    title:"Gana puntos y sube",
    desc:"Cada acierto suma según la dificultad. Mantén tu racha, apuesta monedas y llega al primer lugar.",
  },
];

export const Onboarding=({onDone})=>{
  const [step,setStep]=useState(0);
  const s=ONBOARD_STEPS[step];
  const last=step===ONBOARD_STEPS.length-1;

  return <div
    role="dialog"
    aria-modal="true"
    aria-label="Introducción a Court IQ"
    style={{position:"fixed",inset:0,background:"#000000cc",zIndex:5000,display:"flex",alignItems:"center",justifyContent:"center",padding:T.space[5]}}
  >
    <div style={{
      background:T.surface[1], border:`1px solid ${T.border.base}`,
      borderRadius:T.radius.xl, padding:T.space[6],
      maxWidth:380, width:"100%", boxShadow:T.shadow.lg,
    }}>
      <div style={{fontSize:T.font.xs,color:T.text.tertiary,letterSpacing:1.2,textTransform:"uppercase",fontWeight:600,marginBottom:T.space[2]}}>
        Paso {step+1} de {ONBOARD_STEPS.length}
      </div>

      <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,letterSpacing:-0.4,marginBottom:T.space[3]}}>
        {s.title}
      </div>

      <div style={{fontSize:T.font.base,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[6]}}>
        {s.desc}
      </div>

      <div style={{display:"flex",justifyContent:"flex-start",gap:T.space[1],marginBottom:T.space[5]}}>
        {ONBOARD_STEPS.map((_,i)=>(
          <div key={i} style={{
            width:i===step?22:6, height:3, borderRadius:2,
            background:i===step?T.accent.base:T.border.base,
            transition:"width .25s, background .25s",
          }}/>
        ))}
      </div>

      <div style={{display:"flex",gap:T.space[2]}}>
        {step>0&&<button className="btn" onClick={()=>setStep(x=>x-1)} style={{
          padding:`${T.space[3]}px ${T.space[4]}px`, borderRadius:T.radius.base,
          background:T.surface[2], border:`1px solid ${T.border.base}`,
          color:T.text.secondary, fontSize:T.font.sm, fontWeight:600,
        }}>Atrás</button>}
        <button className="btn" onClick={()=>last?onDone():setStep(x=>x+1)} style={{
          flex:1, padding:T.space[3], borderRadius:T.radius.base,
          background:T.accent.base, color:"#fff",
          fontSize:T.font.base, fontWeight:600,
        }}>{last?"Empezar":"Siguiente"}</button>
      </div>

      {!last&&<button className="btn" onClick={onDone} style={{
        width:"100%", marginTop:T.space[3], background:"none",
        color:T.text.tertiary, fontSize:T.font.sm, padding:T.space[2],
      }}>Saltar introducción</button>}
    </div>
  </div>;
};