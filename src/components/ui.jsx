import { T } from "../theme";

/* ═══ ESTILOS GLOBALES ═══ */
export const GS=()=><style>{`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:${T.surface[0]};-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.border.base};border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:${T.border.strong}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bounceIn{0%{transform:scale(.92);opacity:0}60%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}
@keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-60px) scale(1.1);opacity:0}}
@keyframes resultPop{0%{transform:translateX(-50%) scale(.9) translateY(12px);opacity:0}100%{transform:translateX(-50%) scale(1) translateY(0);opacity:1}}
@keyframes resultOut{0%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(.96) translateY(8px)}}
.fade-up{animation:fadeUp .28s cubic-bezier(.2,.8,.3,1) both}
.pick-correct{animation:bounceIn .4s ease both}
.pick-wrong{animation:shake .35s ease both}
.btn{cursor:pointer;border:none;outline:none;font-family:inherit;transition:background .15s,border-color .15s,color .15s,opacity .15s}
.btn:hover{opacity:.85}
.btn:active{transform:scale(.985)}
.btn:disabled{opacity:.4;cursor:not-allowed}
.card{transition:border-color .18s,background .18s}
input,select,textarea{outline:none;font-family:inherit}
input::placeholder{color:${T.text.disabled}}
`}</style>;

/* ═══ PRIMITIVOS ═══ */

// Etiqueta pequeña de estado
export const Tag=({c=T.text.tertiary,children})=>(
  <span style={{
    fontSize:T.font.xs, fontWeight:600, padding:"3px 9px",
    borderRadius:T.radius.sm, background:`${c}14`, color:c,
    border:`1px solid ${c}28`, whiteSpace:"nowrap",
  }}>{children}</span>
);

// Contenedor base
export const Card=({children,style={},className=""})=>(
  <div className={`card ${className}`} style={{
    background:T.surface[1],
    border:`1px solid ${T.border.subtle}`,
    borderRadius:T.radius.lg,
    padding:T.space[4],
    ...style,
  }}>{children}</div>
);

// Título de sección
export const ST=({children,sub,style={}})=>(
  <div style={{marginBottom:T.space[4],...style}}>
    {sub&&<div style={{
      fontSize:T.font.xs, color:T.text.tertiary, textTransform:"uppercase",
      letterSpacing:1.2, fontWeight:600, marginBottom:T.space[1],
    }}>{sub}</div>}
    <div style={{
      fontSize:T.font.xl, fontWeight:700, color:T.text.primary, letterSpacing:-0.4,
    }}>{children}</div>
  </div>
);

export const Divider=()=>(
  <div style={{height:1,background:T.border.subtle,margin:`${T.space[4]}px 0`}}/>
);

export const Spin=({s=16})=>(
  <div className="spin" style={{
    width:s, height:s, border:`2px solid ${T.border.base}`,
    borderTopColor:T.accent.base, borderRadius:"50%",
    display:"inline-block", animation:"spin .8s linear infinite",
  }}/>
);

// Tooltip para gráficas
export const TT=({active,payload,label})=>active&&payload?.length?(
  <div style={{
    background:T.surface[2], border:`1px solid ${T.border.base}`,
    borderRadius:T.radius.base, padding:`${T.space[2]}px ${T.space[3]}px`,
    boxShadow:T.shadow.base,
  }}>
    <p style={{color:T.text.tertiary,fontSize:T.font.xs,marginBottom:2}}>{label}</p>
    {payload.map((p,i)=>(
      <p key={i} style={{color:T.text.primary,fontSize:T.font.sm,fontWeight:600}}>{p.name}: {p.value}</p>
    ))}
  </div>
):null;